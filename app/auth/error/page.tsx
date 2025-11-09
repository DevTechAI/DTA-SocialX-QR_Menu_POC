'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AuthErrorPage() {
  const [errorDetails, setErrorDetails] = useState<any>(null);

  useEffect(() => {
    // Get error details from sessionStorage
    const errorStr = sessionStorage.getItem('auth_error');
    let parsedError: any = null;
    
    if (errorStr) {
      try {
        parsedError = JSON.parse(errorStr);
        sessionStorage.removeItem('auth_error');
      } catch (e) {
        console.error('Error parsing error details:', e);
      }
    }
    
    // Also check URL params for error message
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    
    if (parsedError) {
      setErrorDetails(parsedError);
    } else if (errorParam) {
      setErrorDetails({
        message: decodeURIComponent(errorParam),
        fromUrl: true
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border-2 border-orange-200">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-3xl font-bold text-orange-900 mb-2">Authentication Error</h1>
          <p className="text-orange-600">There was an error signing you in.</p>
        </div>

        {errorDetails && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm font-semibold mb-2">Error Details:</p>
            <p className="text-red-700 text-xs break-words">
              {errorDetails.message || 'Unknown error occurred'}
            </p>
            {process.env.NODE_ENV === 'development' && errorDetails.details && (
              <details className="mt-2">
                <summary className="text-red-600 text-xs cursor-pointer">Show technical details</summary>
                <pre className="text-xs mt-2 overflow-auto max-h-40 bg-red-100 p-2 rounded">
                  {JSON.stringify(errorDetails.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="space-y-3">
          <Link
            href="/auth/signin"
            className="block w-full py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold text-center"
          >
            Try Again
          </Link>
          <Link
            href="/order-menu"
            className="block w-full py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold text-center"
          >
            Return Home
          </Link>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-xs font-semibold mb-2">💡 Troubleshooting:</p>
          <ul className="text-yellow-700 text-xs space-y-1 list-disc list-inside">
            <li>Check browser console (F12) for detailed error messages</li>
            <li>Verify your email is in the authorized_emails table in Supabase</li>
            <li>Try using email/password sign-in instead</li>
            <li>Check that Google OAuth is properly configured in Supabase</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

