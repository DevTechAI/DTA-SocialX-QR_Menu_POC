import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { createClient } from '@/lib/supabase/server';

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
  
  // Update Supabase session
  const response = await updateSession(request);

  // Protect admin routes
  if (pathname.startsWith('/order-admin')) {
    // Check for bypass cookie (only if enabled via environment variable)
    const bypassCookie = request.cookies.get('admin_bypass');
    const allowBypass = process.env.ALLOW_ADMIN_BYPASS === 'true' || process.env.NODE_ENV === 'development';
    
    if (allowBypass && bypassCookie?.value === 'true') {
      console.log('🛡️ ⚠️ Bypass mode enabled');
      return NextResponse.next();
    }

    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    console.log('🛡️ Middleware: Checking admin route access');
    console.log('🛡️ Path:', pathname);
    console.log('🛡️ User:', user?.email || 'none');
    console.log('🛡️ Error:', error?.message || 'none');

    if (error || !user) {
      console.log('🛡️ ❌ No user found, redirecting to sign-in');
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    // Check if user is authorized
    const { data: authorizedEmail } = await supabase
      .from('authorized_emails')
      .select('role')
      .eq('email', user.email)
      .single();

    console.log('🛡️ Authorized email check:', authorizedEmail?.role || 'not found');

    if (!authorizedEmail) {
      console.log('🛡️ ❌ User not authorized, redirecting to unauthorized page');
      return NextResponse.redirect(new URL('/auth/unauthorized', request.url));
    }

    console.log('🛡️ ✅ User authorized, allowing access to admin');
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

