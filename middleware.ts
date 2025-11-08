import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { createClient } from '@/lib/supabase/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow auth callback route to pass through without checks
  if (pathname.startsWith('/auth/callback')) {
    return NextResponse.next();
  }
  
  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Skip Supabase middleware if not configured (use mock data)
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
    // Still protect admin routes even without Supabase (redirect to signin)
    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
    return NextResponse.next();
  }
  
  // Update Supabase session
  const response = await updateSession(request);

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    // Check if user is authorized
    const { data: authorizedEmail } = await supabase
      .from('authorized_emails')
      .select('role')
      .eq('email', user.email)
      .single();

    if (!authorizedEmail) {
      return NextResponse.redirect(new URL('/auth/unauthorized', request.url));
    }
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

