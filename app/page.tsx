'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to /order-menu
    router.replace('/order-menu');
  }, [router]);

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
