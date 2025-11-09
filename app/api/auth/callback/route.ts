import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/order-admin';

  // Get the correct origin for redirects
  // Priority: x-forwarded-host (production) > host header > origin
      const forwardedHost = request.headers.get('x-forwarded-host');
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  
  let baseUrl: string;
  if (forwardedHost) {
    baseUrl = `${protocol}://${forwardedHost}`;
  } else if (host) {
    baseUrl = `${protocol}://${host}`;
      } else {
    const { origin } = new URL(request.url);
    baseUrl = origin;
  }

  if (!code) {
    console.error('❌ No code parameter in callback');
    return NextResponse.redirect(`${baseUrl}/auth/error`);
  }

  try {
    console.log('🔐 Processing OAuth callback in API route...');
    
    // Create Supabase client with proper cookie handling for API routes
    let response = NextResponse.next();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value,
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('❌ Code exchange error:', error);
      console.error('Error message:', error.message);
      return NextResponse.redirect(`${baseUrl}/auth/error?error=${encodeURIComponent(error.message)}`);
    }

    if (!data?.user) {
      console.error('❌ No user data after code exchange');
      return NextResponse.redirect(`${baseUrl}/auth/error?error=no_user_data`);
    }

    console.log('✅ User authenticated:', data.user.email);

    // Check if user is authorized (case-insensitive)
    const userEmail = data.user.email?.toLowerCase().trim();
    const { data: authorizedEmails, error: authError } = await supabase
      .from('authorized_emails')
      .select('role, email')
      .ilike('email', userEmail || '');

    // Fallback to case-sensitive if ilike fails
    let authorizedEmail = authorizedEmails && authorizedEmails.length > 0 ? authorizedEmails[0] : null;
    
    if (!authorizedEmail && !authError) {
      // Try case-sensitive match as fallback
      const { data: fallbackAuth } = await supabase
        .from('authorized_emails')
        .select('role, email')
        .eq('email', data.user.email || '')
        .single();
      authorizedEmail = fallbackAuth || null;
    }

    if (!authorizedEmail) {
      console.log('❌ User not authorized:', data.user.email);
      // User is not authorized, sign them out
      await supabase.auth.signOut();
      return NextResponse.redirect(`${baseUrl}/auth/unauthorized`);
    }

    console.log('✅ User authorized with role:', authorizedEmail.role);

    // Ensure session is properly established by getting user again
    // This ensures cookies are set correctly
    const { data: { user: verifiedUser } } = await supabase.auth.getUser();
    if (!verifiedUser) {
      console.error('❌ Session not properly established after code exchange');
      return NextResponse.redirect(`${baseUrl}/auth/error?error=session_not_established`);
    }

    console.log('✅ Session verified, redirecting to:', `${baseUrl}${next}`);
    console.log('📋 Redirect details:');
    console.log('  - Base URL:', baseUrl);
    console.log('  - Next path:', next);
    console.log('  - Full URL:', `${baseUrl}${next}`);
    console.log('  - User email:', verifiedUser.email);

    // User is authorized, proceed to redirect
    // Use the response object that has cookies set, and redirect
    const redirectResponse = NextResponse.redirect(`${baseUrl}${next}`, { status: 303 });
    
    // Copy cookies from the session response to the redirect response
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path || '/',
        domain: cookie.domain,
        sameSite: cookie.sameSite as any,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        maxAge: cookie.maxAge,
      });
    });
    
    console.log('🍪 Setting redirect response with cookies');
    console.log('🍪 Cookies being set:', response.cookies.getAll().map(c => c.name));
    
    return redirectResponse;
  } catch (err: any) {
    console.error('❌ Callback error:', err);
    return NextResponse.redirect(`${baseUrl}/auth/error?error=${encodeURIComponent(err.message || 'unknown_error')}`);
  }
}

