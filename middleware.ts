import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow auth callback routes to pass through without checks
  if (pathname.startsWith('/auth/callback') || pathname.startsWith('/api/auth/callback')) {
    console.log('🛡️ Allowing auth callback route:', pathname);
    return NextResponse.next();
  }
  
  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Skip Supabase middleware if not configured (use mock data)
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
    // Still protect admin routes even without Supabase (redirect to signin)
    if (pathname.startsWith('/order-admin')) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
    return NextResponse.next();
  }
  
  // Update Supabase session and get user
  console.log('═══════════════════════════════════════════════════════');
  console.log('🛡️ MIDDLEWARE - Starting request processing');
  console.log('═══════════════════════════════════════════════════════');
  console.log('📍 Request path:', pathname);
  console.log('📍 Request URL:', request.url);
  console.log('📊 Incoming cookies count:', request.cookies.getAll().length);
  console.log('📋 Incoming cookie names:', request.cookies.getAll().map(c => c.name));
  
  console.log('\n⏳ Calling updateSession()...');
  const { response, supabase, user } = await updateSession(request);
  console.log('✅ updateSession() completed');

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🛡️ MIDDLEWARE - updateSession() result');
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 User found:', user ? '✅ YES' : '❌ NO');
  if (user) {
    console.log('  Email:', user.email);
    console.log('  ID:', user.id);
  } else {
    console.log('  ⚠️ No user - authentication failed');
  }

  // Protect admin routes
  if (pathname.startsWith('/order-admin')) {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🛡️ MIDDLEWARE - Protecting /order-admin route');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📍 Request path:', pathname);
    
    // Check for bypass cookie (only if explicitly enabled via environment variable)
    const bypassCookie = request.cookies.get('admin_bypass');
    const allowBypass = process.env.ALLOW_ADMIN_BYPASS === 'true';
    
    if (allowBypass && bypassCookie?.value === 'true') {
      console.log('⚠️ Bypass mode enabled (not recommended for production)');
      return NextResponse.next();
    }

    console.log('🔄 Checking user authentication...');

    if (!user) {
      console.log('═══════════════════════════════════════════════════════');
      console.log('❌ MIDDLEWARE - Authentication failed');
      console.log('═══════════════════════════════════════════════════════');
      console.log('  📧 User email: none');
      console.log('  ❌ Error: No user found (session not established)');
      console.log('  🔒 Redirecting to sign-in page');
      // Preserve the original URL so user can be redirected back after auth
      const signInUrl = new URL('/auth/signin', request.url);
      signInUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(signInUrl);
    }

    console.log('✅ User authenticated via OAuth/Email');
    console.log('  📧 Email:', user.email);
    console.log('  🆔 User ID:', user.id);

    // Check if user is authorized (case-insensitive)
    console.log('🔄 Checking authorization in database...');
    const userEmail = user.email?.toLowerCase().trim();
    console.log('  🔍 Searching for email:', userEmail);
    const { data: authorizedEmail, error: authError } = await supabase
      .from('authorized_emails')
      .select('role')
      .ilike('email', userEmail || '')
      .single();

    if (authError) {
      console.log('═══════════════════════════════════════════════════════');
      console.log('❌ MIDDLEWARE - Database query error');
      console.log('═══════════════════════════════════════════════════════');
      console.log('  📧 Email:', user.email);
      console.log('  ❌ Error:', authError.message);
      console.log('  💡 This might be an RLS policy issue. Check Supabase RLS policies.');
      console.log('  🔒 Redirecting to unauthorized page');
      return NextResponse.redirect(new URL('/auth/unauthorized', request.url));
    }

    if (!authorizedEmail) {
      console.log('═══════════════════════════════════════════════════════');
      console.log('❌ MIDDLEWARE - Authorization failed');
      console.log('═══════════════════════════════════════════════════════');
      console.log('  📧 Email:', user.email);
      console.log('  ❌ Email not found in authorized_emails table');
      console.log('  🔒 Redirecting to unauthorized page');
      return NextResponse.redirect(new URL('/auth/unauthorized', request.url));
    }

    console.log('✅ User is authorized');
    console.log('  👤 Role:', authorizedEmail.role);
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ MIDDLEWARE - Access granted to /order-admin');
    console.log('═══════════════════════════════════════════════════════');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

