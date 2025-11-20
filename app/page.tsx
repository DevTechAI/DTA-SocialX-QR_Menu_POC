'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if this is an OAuth callback (has code parameter)
    const code = searchParams.get('code');
    const next = searchParams.get('next');
    
    if (code) {
      // This is an OAuth callback - redirect to the callback handler
      const callbackUrl = `/auth/callback?code=${encodeURIComponent(code)}${next ? `&next=${encodeURIComponent(next)}` : '&next=/order-admin'}`;
      router.replace(callbackUrl);
      return;
    }
    
    // Normal case: Redirect to /book-order
    router.replace('/book-order');
  }, [router, searchParams]);

  // Show loading state while redirecting
  return (
    <main className="min-h-screen gradient-soft flex flex-col items-center justify-center w-full">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary mb-4 shadow-soft-lg">
          <div className="animate-pulse">
            <span className="text-5xl text-white">☕</span>
          </div>
        </div>
        <p className="text-gray-700 font-bold text-lg">Redirecting...</p>
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen gradient-soft flex flex-col items-center justify-center w-full">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary mb-4 shadow-soft-lg">
            <div className="animate-pulse">
              <span className="text-5xl text-white">☕</span>
            </div>
          </div>
          <p className="text-gray-700 font-bold text-lg">Loading...</p>
        </div>
      </main>
    }>
      <HomePageContent />
    </Suspense>
  );
}
