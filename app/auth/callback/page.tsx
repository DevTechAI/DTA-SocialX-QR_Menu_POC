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

      if (code) {
        console.log('🔐 Processing OAuth callback...');
        console.log('📝 Code received, redirecting to API route for server-side exchange');
        
        // Use the API route for server-side code exchange (more reliable)
        // This ensures cookies are properly set on the server
        const apiUrl = `/api/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`;
        window.location.href = apiUrl;
      } else {
        // No code parameter, redirect to sign-in
        console.log('⚠️ No code parameter, redirecting to sign-in');
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

