'use client';

import { useRouter } from 'next/navigation';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border-2 border-orange-200 text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-3xl font-bold text-orange-900 mb-4">Unauthorized Access</h1>
        <p className="text-orange-600 mb-6">
          Your email is not authorized to access the admin panel. Please contact the administrator
          to request access.
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
}

