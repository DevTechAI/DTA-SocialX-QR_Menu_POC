'use client';

import { useRouter } from 'next/navigation';

export default function BookSnookerPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen gradient-soft flex flex-col items-center justify-center w-full p-4">
      <div className="w-full max-w-2xl text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 mb-6 shadow-soft-lg">
          <span className="text-6xl">🎱</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Book Snooker Board
        </h1>

        {/* Coming Soon Message */}
        <div className="bg-white rounded-2xl shadow-soft-lg p-8 mb-6">
          <p className="text-xl text-gray-600 mb-4">
            🚧 This feature is under development
          </p>
          <p className="text-gray-500 mb-6">
            We're working hard to bring you the snooker board booking system. 
            Check back soon!
          </p>
          
          {/* Status Badge */}
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-500 mb-6">
            Coming Soon
          </span>

          {/* Back Button */}
          <button
            onClick={() => router.push('/book-order')}
            className="mt-4 px-6 py-3 bg-gradient-to-br from-primary-500 to-primary-600 text-white font-bold rounded-xl shadow-soft-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 active:scale-95"
          >
            ← Back to Booking Options
          </button>
        </div>
      </div>
    </main>
  );
}

