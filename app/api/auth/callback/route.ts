import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  let next = searchParams.get('next') ?? '/order-admin';
  
  // Ensure OAuth flows always redirect to /order-admin or admin sub-routes (OAuth is only for admin)
  // Prevent redirects to root or book-order which could cause issues
  if (next === '/' || next === '/book-order') {
    next = '/order-admin';
  }

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
    logger.error('❌ No code parameter in callback');
    return NextResponse.redirect(`${baseUrl}/auth/error`);
  }

  try {
    logger.section('🔐 OAUTH CALLBACK - Processing authentication...');
    logger.info('📍 Callback URL:', request.url);
    logger.info('📍 Redirect target:', next);
    
    // Create Supabase client with proper cookie handling for API routes
    // IMPORTANT: Create response once and reuse it - don't recreate on each cookie set
    const response = NextResponse.next();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            // Log the cookie being set to debug corruption (debug level)
            if (name.includes('auth-token')) {
              logger.debug(`🔍 Setting cookie: ${name}`);
              logger.debug(`  Value length: ${value?.length || 0}`);
              logger.debug(`  First 50 chars: ${value?.substring(0, 50) || 'EMPTY'}`);
              logger.debug(`  Is JWT: ${value?.startsWith('eyJ') ? '✅ YES' : '❌ NO'}`);
              if (!value?.startsWith('eyJ') && value) {
                logger.warn(`  ⚠️ WARNING: Cookie value is NOT a JWT!`);
                logger.debug(`  Value type: ${typeof value}`);
                logger.debug(`  Full value (first 200): ${value.substring(0, 200)}`);
              }
            }
            // Set on request cookies (for Supabase client to read)
            request.cookies.set({
              name,
              value,
              ...options,
            });
            // Set on response cookies (to send to browser)
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {
            // Set on request cookies
            request.cookies.set({
              name,
              value: '',
              ...options,
            });
            // Set on response cookies
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );
    
    logger.info('🔄 Step 1: Exchanging OAuth code for session...');
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      logger.section('❌ OAUTH FAILED - Code exchange error', 'error');
      logger.error('  Error:', error.message);
      logger.error('  Error code:', error.status || 'unknown');
      return NextResponse.redirect(`${baseUrl}/auth/error?error=${encodeURIComponent(error.message)}`);
    }

    if (!data?.user) {
      logger.section('❌ OAUTH FAILED - No user data after code exchange', 'error');
      return NextResponse.redirect(`${baseUrl}/auth/error?error=no_user_data`);
    }

    logger.info('✅ Step 1: OAuth code exchange successful');
    logger.info('  📧 User email:', data.user.email);
    logger.debug('  🆔 User ID:', data.user.id);
    logger.debug('  📅 Authenticated at:', new Date().toISOString());

    // Log cookies after code exchange (debug level - detailed info)
    logger.debug('═══════════════════════════════════════════════════════');
    logger.debug('🔍 STEP 1.1: Cookies after code exchange');
    logger.debug('═══════════════════════════════════════════════════════');
    const cookiesAfterExchange = response.cookies.getAll();
    logger.debug('📊 Total cookies in response:', cookiesAfterExchange.length);
    cookiesAfterExchange.forEach((cookie, index) => {
      logger.debug(`\n  Cookie ${index + 1}: ${cookie.name}`);
      logger.debug(`    Value length: ${cookie.value?.length || 0}`);
      logger.debug(`    Value preview (first 100): ${cookie.value?.substring(0, 100) || 'EMPTY'}`);
      logger.debug(`    Is JWT format: ${cookie.value?.startsWith('eyJ') ? '✅ YES' : '❌ NO'}`);
      if (cookie.value && !cookie.value.startsWith('eyJ')) {
        logger.warn(`    ⚠️ WARNING: Cookie doesn't start with 'eyJ' (JWT format)`);
        logger.debug(`    Value type: ${typeof cookie.value}`);
        logger.debug(`    Contains 'picture': ${cookie.value.includes('picture') ? '⚠️ YES' : '✅ NO'}`);
      }
      logger.debug(`    Attributes:`, {
        path: cookie.path || '/',
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite,
        maxAge: cookie.maxAge,
      });
    });

    // Check if user is authorized (case-insensitive)
    logger.info('🔄 Step 2: Checking authorization in database...');
    const userEmail = data.user.email?.toLowerCase().trim();
    logger.debug('  🔍 Searching for email:', userEmail);
    
    const { data: authorizedEmails, error: authError } = await supabase
      .from('authorized_emails')
      .select('role, email')
      .ilike('email', userEmail || '');

    // Fallback to case-sensitive if ilike fails
    let authorizedEmail = authorizedEmails && authorizedEmails.length > 0 ? authorizedEmails[0] : null;
    
    if (!authorizedEmail && !authError) {
      logger.debug('  🔄 Trying case-sensitive match as fallback...');
      // Try case-sensitive match as fallback
      const { data: fallbackAuth } = await supabase
        .from('authorized_emails')
        .select('role, email')
        .eq('email', data.user.email || '')
        .single();
      authorizedEmail = fallbackAuth || null;
    }

    if (!authorizedEmail) {
      logger.section('❌ AUTHORIZATION FAILED', 'error');
      logger.error('  📧 Email:', data.user.email);
      logger.error('  ❌ Email not found in authorized_emails table');
      logger.error('  🔒 Access denied - redirecting to unauthorized page');
      // User is not authorized, sign them out
      await supabase.auth.signOut();
      return NextResponse.redirect(`${baseUrl}/auth/unauthorized`);
    }

    logger.info('✅ Step 2: User is authorized');
    logger.info('  👤 Role:', authorizedEmail.role);
    logger.debug('  📧 Authorized email:', authorizedEmail.email);

    // Ensure session is properly established by getting user again
    // This ensures cookies are set correctly
    logger.info('🔄 Step 3: Verifying session establishment...');
    const { data: { user: verifiedUser } } = await supabase.auth.getUser();
    if (!verifiedUser) {
      logger.section('❌ SESSION FAILED - Session not properly established', 'error');
      return NextResponse.redirect(`${baseUrl}/auth/error?error=session_not_established`);
    }

    logger.info('✅ Step 3: Session verified successfully');
    logger.section('✅ OAUTH LOGIN SUCCESSFUL');
    logger.info('  📧 User email:', verifiedUser.email);
    logger.info('  👤 Role:', authorizedEmail.role);
    logger.info('  🎯 Redirecting to:', `${baseUrl}${next}`);
    logger.info('  ✅ Access granted to order-admin page');

    // User is authorized, proceed to redirect
    // IMPORTANT: The 'response' object already has cookies set by Supabase client
    // We need to create a redirect that preserves those cookies
    logger.debug('═══════════════════════════════════════════════════════');
    logger.debug('🔍 STEP 4: Preparing cookies for redirect');
    logger.debug('═══════════════════════════════════════════════════════');
    const cookiesToSet = response.cookies.getAll();
    logger.debug('📊 Total cookies to copy:', cookiesToSet.length);
    logger.debug('📋 Cookie names:', cookiesToSet.map(c => c.name));
    
    // Detailed analysis of each cookie BEFORE copying (debug level)
    logger.debug('\n🔍 Analyzing cookies BEFORE copy:');
    cookiesToSet.forEach((cookie, index) => {
      logger.debug(`\n  Cookie ${index + 1}/${cookiesToSet.length}: ${cookie.name}`);
      logger.debug(`    Full value length: ${cookie.value?.length || 0}`);
      logger.debug(`    First 100 chars: ${cookie.value?.substring(0, 100) || 'EMPTY'}`);
      if (cookie.value && cookie.value.length > 100) {
        logger.debug(`    Last 50 chars: ${cookie.value.substring(cookie.value.length - 50)}`);
      }
      logger.debug(`    Is valid JWT: ${cookie.value?.startsWith('eyJ') ? '✅ YES' : '❌ NO'}`);
      if (!cookie.value?.startsWith('eyJ') && cookie.value) {
        logger.warn(`    ⚠️ WARNING: Cookie value doesn't look like JWT!`);
        logger.debug(`    Value appears to be JSON fragment or corrupted`);
      }
      logger.debug(`    Attributes:`, {
        path: cookie.path || '/',
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite,
        maxAge: cookie.maxAge,
        expires: cookie.expires ? new Date(cookie.expires).toISOString() : 'none',
      });
    });
    
    // Create redirect response
    logger.debug('\n═══════════════════════════════════════════════════════');
    logger.debug('🔍 STEP 5: Copying cookies to redirect response');
    logger.debug('═══════════════════════════════════════════════════════');
    const redirectResponse = NextResponse.redirect(`${baseUrl}${next}`, { status: 303 });
    
    // Copy ALL cookies with their EXACT attributes from the response object
    cookiesToSet.forEach((cookie, index) => {
      logger.debug(`\n📋 Copying cookie ${index + 1}/${cookiesToSet.length}: ${cookie.name}`);
      logger.debug(`  Source value length: ${cookie.value?.length || 0}`);
      logger.debug(`  Source value preview: ${cookie.value?.substring(0, 50) || 'EMPTY'}...`);
      
      const cookieValue = cookie.value;
      const cookieOptions: CookieOptions = {
        path: cookie.path || '/',
        domain: cookie.domain,
        sameSite: cookie.sameSite as any,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        maxAge: cookie.maxAge,
        expires: cookie.expires,
      };
      
      logger.debug(`  Setting with options:`, {
        path: cookieOptions.path,
        httpOnly: cookieOptions.httpOnly,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
        maxAge: cookieOptions.maxAge,
      });
      
      redirectResponse.cookies.set(cookie.name, cookieValue, cookieOptions);
      
      // Verify it was set correctly
      const verifyCookie = redirectResponse.cookies.get(cookie.name);
      logger.debug(`  ✅ Verification after set:`, {
        name: verifyCookie?.name,
        valueLength: verifyCookie?.value?.length || 0,
        valueMatch: verifyCookie?.value === cookieValue ? '✅ MATCH' : '❌ MISMATCH',
        valuePreview: verifyCookie?.value?.substring(0, 50) || 'EMPTY',
        isJWT: verifyCookie?.value?.startsWith('eyJ') ? '✅ YES' : '❌ NO',
      });
      
      if (verifyCookie?.value !== cookieValue) {
        logger.warn(`  ⚠️ WARNING: Cookie value mismatch after setting!`);
        logger.debug(`    Original length: ${cookieValue?.length || 0}`);
        logger.debug(`    Copied length: ${verifyCookie?.value?.length || 0}`);
      }
    });
    
    logger.debug('\n═══════════════════════════════════════════════════════');
    logger.debug('🔍 STEP 6: Final redirect response cookies');
    logger.debug('═══════════════════════════════════════════════════════');
    const finalCookies = redirectResponse.cookies.getAll();
    logger.debug('📊 Total cookies in redirect response:', finalCookies.length);
    finalCookies.forEach((cookie, index) => {
      logger.debug(`  Cookie ${index + 1}: ${cookie.name}`);
      logger.debug(`    Value length: ${cookie.value?.length || 0}`);
      logger.debug(`    Is JWT: ${cookie.value?.startsWith('eyJ') ? '✅ YES' : '❌ NO'}`);
      if (!cookie.value?.startsWith('eyJ') && cookie.value) {
        logger.warn(`    ⚠️ WARNING: Final cookie is not JWT format!`);
        logger.debug(`    Value preview: ${cookie.value.substring(0, 100)}`);
      }
    });
    
    return redirectResponse;
  } catch (err: any) {
    logger.error('❌ Callback error:', err);
    return NextResponse.redirect(`${baseUrl}/auth/error?error=${encodeURIComponent(err.message || 'unknown_error')}`);
  }
}

