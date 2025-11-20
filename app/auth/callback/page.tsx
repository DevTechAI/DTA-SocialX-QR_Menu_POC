'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = () => {
      const code = searchParams.get('code');
      const next = searchParams.get('next') || '/order-admin';

      // Store logs in sessionStorage to persist across redirects
      const logToStorage = (message: string) => {
        const logs = JSON.parse(sessionStorage.getItem('oauth_logs') || '[]');
        logs.push({ timestamp: new Date().toISOString(), message });
        sessionStorage.setItem('oauth_logs', JSON.stringify(logs.slice(-50))); // Keep last 50 logs
      };

      if (code) {
        console.log('═══════════════════════════════════════════════════════');
        console.log('🔐 OAUTH CALLBACK PAGE - Client-side');
        console.log('═══════════════════════════════════════════════════════');
        console.log('✅ OAuth code received from Google');
        console.log('📍 Code parameter:', code.substring(0, 20) + '...');
        console.log('📍 Target page:', next);
        console.log('🔄 Redirecting to API route for server-side processing...');
        console.log('═══════════════════════════════════════════════════════');
        
        // Store in sessionStorage
        logToStorage('OAuth code received, redirecting to API route');
        
        // Use the API route for server-side code exchange (more reliable)
        // This ensures cookies are properly set on the server
        const apiUrl = `/api/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`;
        window.location.href = apiUrl;
      } else {
        // No code parameter, redirect to sign-in
        console.log('═══════════════════════════════════════════════════════');
        console.log('❌ OAUTH CALLBACK - No code parameter');
        console.log('═══════════════════════════════════════════════════════');
        console.log('⚠️ No code parameter found, redirecting to sign-in');
        logToStorage('No code parameter, redirecting to sign-in');
        window.location.href = '/auth/signin';
      }
    };

    handleCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
        <p className="text-orange-600 font-semibold">Completing sign in...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-orange-600 font-semibold">Loading...</p>
        </div>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}

