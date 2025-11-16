import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

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

  // Debug: Log what cookies are in the request
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔍 updateSession - Step 1: Reading cookies from request');
  console.log('═══════════════════════════════════════════════════════');
  const cookieNames = request.cookies.getAll().map(c => c.name);
  console.log('📊 Total cookies in request:', cookieNames.length);
  console.log('📋 All cookie names:', cookieNames);
  
  // Check for any Supabase auth cookies (they start with 'sb-')
  const supabaseCookies = cookieNames.filter(name => name.startsWith('sb-'));
  console.log('📊 Supabase cookies found:', supabaseCookies.length);
  console.log('📋 Supabase cookie names:', supabaseCookies);
  
  if (supabaseCookies.length > 0) {
    console.log('\n🔍 Analyzing each Supabase cookie:');
    supabaseCookies.forEach((cookieName, index) => {
      const cookie = request.cookies.get(cookieName);
      const value = cookie?.value || '';
      console.log(`\n  Cookie ${index + 1}: ${cookieName}`);
      console.log(`    Value length: ${value.length}`);
      console.log(`    Value exists: ${value ? '✅ YES' : '❌ NO'}`);
      if (value) {
        console.log(`    First 100 chars: ${value.substring(0, 100)}`);
        if (value.length > 100) {
          console.log(`    Last 50 chars: ${value.substring(value.length - 50)}`);
        }
        console.log(`    Is JWT format: ${value.startsWith('eyJ') ? '✅ YES' : '❌ NO'}`);
        console.log(`    Contains "picture": ${value.includes('picture') ? '⚠️ YES (suspicious)' : '✅ NO'}`);
        console.log(`    Contains "false": ${value.includes('false') ? '⚠️ YES (suspicious)' : '✅ NO'}`);
        
        if (!value.startsWith('eyJ') && value.length > 0) {
          console.log(`    ⚠️ WARNING: This doesn't look like a JWT token!`);
          console.log(`    Expected: JWT starting with 'eyJ...'`);
          console.log(`    Got: ${value.substring(0, 100)}`);
        }
      }
    });
  } else {
    console.log('⚠️ No Supabase cookies found in request!');
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🔍 updateSession - Step 2: Creating Supabase client');
  console.log('═══════════════════════════════════════════════════════');
  console.log('📍 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 40) + '...');
  console.log('📍 Anon key exists:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ YES' : '❌ NO');

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🔍 updateSession - Step 3: Calling getUser()');
  console.log('═══════════════════════════════════════════════════════');
  console.log('⏳ Calling supabase.auth.getUser()...');
  
  const { data: { user }, error: getUserError } = await supabase.auth.getUser();

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🔍 updateSession - Step 4: getUser() result');
  console.log('═══════════════════════════════════════════════════════');
  
  if (getUserError) {
    console.log('❌ Error occurred:');
    console.log('  Error message:', getUserError.message);
    console.log('  Error name:', getUserError.name);
    console.log('  Error status:', getUserError.status || 'N/A');
    
    if (getUserError.message.includes('session')) {
      console.log('\n  ⚠️ Session-related error detected');
      console.log('  💡 Possible causes:');
      console.log('     - Cookie value is corrupted or invalid');
      console.log('     - Cookie format is not JWT');
      console.log('     - Cookie is missing required parts');
      console.log('     - Cookie expired or was tampered with');
    }
    
    // Check cookies after getUser call
    const cookiesAfterGetUser = request.cookies.getAll().map(c => c.name);
    console.log('\n  📊 Cookies after getUser():', cookiesAfterGetUser.length);
    console.log('  📋 Cookie names:', cookiesAfterGetUser);
  } else {
    console.log('✅ No error from getUser()');
  }

  if (user) {
    console.log('✅ User found:');
    console.log('  Email:', user.email);
    console.log('  ID:', user.id);
    console.log('  Created at:', user.created_at);
  } else {
    console.log('❌ No user returned');
    console.log('  This means:');
    console.log('    - Session is invalid or expired');
    console.log('    - Cookie couldn\'t be parsed by Supabase');
    console.log('    - User needs to re-authenticate');
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🔍 updateSession - Step 5: Response cookies');
  console.log('═══════════════════════════════════════════════════════');
  const responseCookies = response.cookies.getAll();
  console.log('📊 Cookies in response object:', responseCookies.length);
  responseCookies.forEach((cookie, index) => {
    console.log(`  Response cookie ${index + 1}: ${cookie.name}`);
    console.log(`    Value length: ${cookie.value?.length || 0}`);
    console.log(`    Is JWT: ${cookie.value?.startsWith('eyJ') ? '✅ YES' : '❌ NO'}`);
  });

  return { response, supabase, user };
}

