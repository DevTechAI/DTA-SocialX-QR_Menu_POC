import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/admin';

  if (!code) {
    console.error('❌ No code parameter in callback');
    return NextResponse.redirect(`${origin}/auth/error`);
  }

  try {
    console.log('🔐 Processing OAuth callback in API route...');
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('❌ Code exchange error:', error);
      console.error('Error message:', error.message);
      return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(error.message)}`);
    }

    if (!data?.user) {
      console.error('❌ No user data after code exchange');
      return NextResponse.redirect(`${origin}/auth/error?error=no_user_data`);
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
      return NextResponse.redirect(`${origin}/auth/unauthorized`);
    }

    console.log('✅ User authorized with role:', authorizedEmail.role);

    // User is authorized, proceed to redirect
    const forwardedHost = request.headers.get('x-forwarded-host');
    const isLocalEnv = process.env.NODE_ENV === 'development';
    
    if (isLocalEnv) {
      return NextResponse.redirect(`${origin}${next}`);
    } else if (forwardedHost) {
      return NextResponse.redirect(`https://${forwardedHost}${next}`);
    } else {
      return NextResponse.redirect(`${origin}${next}`);
    }
  } catch (err: any) {
    console.error('❌ Callback error:', err);
    return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(err.message || 'unknown_error')}`);
  }
}

