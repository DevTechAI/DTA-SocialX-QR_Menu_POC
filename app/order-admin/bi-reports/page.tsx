'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function BIReportsPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/manager');
          return;
        }

        // Check if user is authorized (manager or superadmin)
        const { data: authorizedUser } = await supabase
          .from('authorized_emails')
          .select('email, role')
          .eq('email', session.user.email)
          .single();

        if (!authorizedUser || (authorizedUser.role !== 'manager' && authorizedUser.role !== 'superadmin')) {
          router.push('/manager');
          return;
        }

        setAuthChecked(true);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/manager');
      }
    };

    checkAuth();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/manager');
  };

  const handleDailyReport = () => {
    // TODO: Implement daily settlement report
    console.log('Daily Settlement Report clicked');
  };

  const handleWeeklyReport = () => {
    // TODO: Implement weekly settlement report
    console.log('Weekly Settlement Report clicked');
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen gradient-soft flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary mb-4 shadow-soft-lg">
            <div className="animate-pulse">
              <span className="text-5xl text-white">⏳</span>
            </div>
          </div>
          <p className="text-gray-700 font-bold text-lg">Verifying authentication...</p>
          <p className="text-gray-500 text-sm mt-1">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-soft flex flex-col">
      {/* Header with Vector Background - Matching Order Admin Page */}
      <div className="w-full shadow-soft-lg sticky top-0 z-50 relative overflow-hidden gradient-primary rounded-b-2xl backdrop-blur-sm">
        <div 
          className="relative z-10 w-full px-6 md:px-10 lg:px-16 backdrop-blur-md"
          style={{
            backgroundImage: 'url(/Menu_Header_OR_Footer_BG.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            paddingTop: '2.5rem',
            paddingBottom: '2.5rem',
          }}
        >
          {/* Glossy Overlay - Matching Theme */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-accent-500/8 to-primary-500/10 backdrop-blur-sm"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent"></div>
          
          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-center justify-between flex-wrap gap-4">
              {/* Left spacer for balance */}
              <div className="flex-1"></div>
              
              {/* Centered BI Reports Title */}
              <div className="flex-1 flex flex-col items-center text-center">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white flex items-center gap-3 drop-shadow-lg whitespace-nowrap">
                  <span className="text-4xl md:text-5xl">📊</span>
                  <span>BI Reports</span>
                </h1>
                <p className="text-white text-base md:text-lg mt-2 font-bold" style={{ 
                  textShadow: '3px 3px 6px rgba(0, 0, 0, 0.9), -2px -2px 4px rgba(0, 0, 0, 0.9), 2px 2px 4px rgba(0, 0, 0, 0.9), -2px 2px 4px rgba(0, 0, 0, 0.9), 2px -2px 4px rgba(0, 0, 0, 0.9), 0 0 8px rgba(0, 0, 0, 0.8)',
                  WebkitTextStroke: '1px rgba(0, 0, 0, 0.7)',
                  paintOrder: 'stroke fill'
                }}>SocialX Hub - Business Intelligence</p>
              </div>
              
              {/* Right side - Date and Time + Actions */}
              <div className="flex-1 flex flex-col items-end gap-2">
                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href="/order-admin"
                    className="px-5 py-2.5 bg-white/50 backdrop-blur-md text-gray-900 rounded-lg border-2 border-white/70 hover:bg-white/60 hover:border-white/90 transition-all font-bold text-base shadow-lg hover:shadow-xl active:scale-95"
                  >
                    🏠 Dashboard
                  </Link>
                  <Link
                    href="/order-admin/menu-edit"
                    className="px-5 py-2.5 bg-white/50 backdrop-blur-md text-gray-900 rounded-lg border-2 border-white/70 hover:bg-white/60 hover:border-white/90 transition-all font-bold text-base shadow-lg hover:shadow-xl active:scale-95"
                  >
                    📝 Menu Editor
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 bg-white/20 backdrop-blur-md text-white rounded-lg border border-white/30 hover:bg-white/30 transition-colors font-semibold text-sm"
                  >
                    Sign Out
                  </button>
                </div>
                {/* Date and Time */}
                <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/30">
                  <span className="text-white font-bold text-sm md:text-base">
                    {currentDateTime.toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                  <span className="text-white/80 text-xs">|</span>
                  <span className="text-white font-bold text-sm md:text-base">
                    {currentDateTime.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit', 
                      second: '2-digit',
                      hour12: true 
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full px-6 md:px-10 lg:px-16 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Report Buttons Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {/* Daily Settlement Report Button */}
            <button
              onClick={handleDailyReport}
              className="group relative overflow-hidden bg-gradient-to-br from-white via-white to-orange-50/60 rounded-2xl p-8 border-2 border-primary-200 shadow-soft hover:shadow-soft-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {/* Decorative corner accents */}
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 w-6 h-6 sm:w-8 sm:h-8 border-t-2 border-l-2 border-primary-300 rounded-tl-2xl opacity-50"></div>
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-6 h-6 sm:w-8 sm:h-8 border-t-2 border-r-2 border-accent-300 rounded-tr-2xl opacity-50"></div>
              <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 w-6 h-6 sm:w-8 sm:h-8 border-b-2 border-l-2 border-primary-300 rounded-bl-2xl opacity-50"></div>
              <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 w-6 h-6 sm:w-8 sm:h-8 border-b-2 border-r-2 border-accent-300 rounded-br-2xl opacity-50"></div>
              
              {/* Content */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                  <span className="text-4xl">📅</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Daily Settlement Report</h2>
                <p className="text-gray-600 text-sm md:text-base">View daily sales, orders, and revenue summary</p>
              </div>
              
              {/* Hover gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-400/60 via-accent-400/60 to-primary-400/60 rounded-lg opacity-0 group-hover:opacity-100 transition duration-300 blur-[0.5px]"></div>
            </button>

            {/* Weekly Settlement Report Button */}
            <button
              onClick={handleWeeklyReport}
              className="group relative overflow-hidden bg-gradient-to-br from-white via-white to-orange-50/60 rounded-2xl p-8 border-2 border-primary-200 shadow-soft hover:shadow-soft-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {/* Decorative corner accents */}
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 w-6 h-6 sm:w-8 sm:h-8 border-t-2 border-l-2 border-primary-300 rounded-tl-2xl opacity-50"></div>
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-6 h-6 sm:w-8 sm:h-8 border-t-2 border-r-2 border-accent-300 rounded-tr-2xl opacity-50"></div>
              <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 w-6 h-6 sm:w-8 sm:h-8 border-b-2 border-l-2 border-primary-300 rounded-bl-2xl opacity-50"></div>
              <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 w-6 h-6 sm:w-8 sm:h-8 border-b-2 border-r-2 border-accent-300 rounded-br-2xl opacity-50"></div>
              
              {/* Content */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                  <span className="text-4xl">📊</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Weekly Settlement Report</h2>
                <p className="text-gray-600 text-sm md:text-base">View weekly sales trends, revenue, and performance metrics</p>
              </div>
              
              {/* Hover gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-400/60 via-accent-400/60 to-primary-400/60 rounded-lg opacity-0 group-hover:opacity-100 transition duration-300 blur-[0.5px]"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

