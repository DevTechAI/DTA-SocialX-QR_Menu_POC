'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

interface ReportData {
  date?: string;
  weekStart?: string;
  weekEnd?: string;
  summary: {
    foodOrders: { count: number; total: number; currency: string };
    snookerBookings: { count: number; total: number; currency: string };
    workspaceBookings: { count: number; total: number; currency: string };
    overall: { totalOrders: number; totalAmount: number; currency: string };
  };
  dailyBreakdown?: Array<{ date: string; food: number; snooker: number; workspace: number; total: number }>;
  details: {
    foodOrders: any[];
    snookerBookings: any[];
    workspaceBookings: any[];
  };
}

export default function BIReportsPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [activeReport, setActiveReport] = useState<'none' | 'daily' | 'weekly'>('none');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleDailyReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/reports/daily-settlement?date=${today}`);
      if (!response.ok) {
        throw new Error('Failed to fetch daily settlement report');
      }
      const data = await response.json();
      setReportData(data);
      setActiveReport('daily');
    } catch (err: any) {
      setError(err.message || 'Failed to load daily report');
      console.error('Error fetching daily report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWeeklyReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const weekStart = getWeekStartDate();
      const response = await fetch(`/api/reports/weekly-settlement?weekStart=${weekStart}`);
      if (!response.ok) {
        throw new Error('Failed to fetch weekly settlement report');
      }
      const data = await response.json();
      setReportData(data);
      setActiveReport('weekly');
    } catch (err: any) {
      setError(err.message || 'Failed to load weekly report');
      console.error('Error fetching weekly report:', err);
    } finally {
      setLoading(false);
    }
  };

  const getWeekStartDate = (): string => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday as start
    const monday = new Date(today.setDate(diff));
    return monday.toISOString().split('T')[0];
  };

  const handleBackToReports = () => {
    setActiveReport('none');
    setReportData(null);
    setError(null);
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const handleDBDump = () => {
    // TODO: Implement DB Dump functionality
    console.log('DB Dump clicked - functionality to be implemented');
    alert('DB Dump functionality will be implemented shortly');
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
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
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />
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
        <div className="max-w-6xl mx-auto">
          {activeReport === 'none' ? (
            <>
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
            </>
          ) : (
            <>
              {/* Back Button */}
              <div className="mb-6 no-print">
                <button
                  onClick={handleBackToReports}
                  className="px-4 py-2 bg-white/50 backdrop-blur-md text-gray-900 rounded-lg border-2 border-white/70 hover:bg-white/60 hover:border-white/90 transition-all font-semibold text-base shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2"
                >
                  <span>←</span> Back to Reports
                </button>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4 shadow-soft-lg animate-pulse">
                      <span className="text-3xl text-white">⏳</span>
                    </div>
                    <p className="text-gray-700 font-bold">Loading report...</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
                  <p className="text-red-800 font-semibold">Error: {error}</p>
                </div>
              )}

              {/* Report Display */}
              {!loading && reportData && (
                <div className="print-content bg-white rounded-2xl shadow-soft-lg border-2 border-primary-200 p-6 md:p-8">
                  {/* Report Header */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 pb-4 border-b-2 border-gray-200">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                        {activeReport === 'daily' ? '📅 Daily Settlement Report' : '📊 Weekly Settlement Report'}
                      </h2>
                      <p className="text-gray-600">
                        {activeReport === 'daily' 
                          ? `Date: ${reportData.date ? new Date(reportData.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}`
                          : `Week: ${reportData.weekStart ? new Date(reportData.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'} - ${reportData.weekEnd ? new Date(reportData.weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}`
                        }
                      </p>
                    </div>
                    <div className="flex gap-3 mt-4 md:mt-0 no-print">
                      <button
                        onClick={handleDownloadPDF}
                        className="px-5 py-2.5 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg font-bold text-base shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center gap-2"
                      >
                        <span>📄</span> Download PDF
                      </button>
                      <button
                        onClick={handleDBDump}
                        className="px-5 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg font-bold text-base shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center gap-2"
                      >
                        <span>💾</span> DB Dump
                      </button>
                    </div>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Food Orders */}
                    <div className="bg-gradient-to-br from-orange-50 via-orange-100/70 to-orange-50/80 rounded-xl p-5 border-2 border-orange-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-orange-700">Food Orders</span>
                        <span className="text-2xl">🍔</span>
                      </div>
                      <p className="text-2xl font-bold text-orange-800 mb-1">
                        {formatCurrency(reportData.summary.foodOrders.total)}
                      </p>
                      <p className="text-xs text-orange-600">Count: {reportData.summary.foodOrders.count}</p>
                    </div>

                    {/* Snooker Bookings */}
                    <div className="bg-gradient-to-br from-blue-50 via-blue-100/70 to-blue-50/80 rounded-xl p-5 border-2 border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-blue-700">Snooker Bookings</span>
                        <span className="text-2xl">🎱</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-800 mb-1">
                        {formatCurrency(reportData.summary.snookerBookings.total)}
                      </p>
                      <p className="text-xs text-blue-600">Count: {reportData.summary.snookerBookings.count}</p>
                    </div>

                    {/* Workspace Bookings */}
                    <div className="bg-gradient-to-br from-purple-50 via-purple-100/70 to-purple-50/80 rounded-xl p-5 border-2 border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-purple-700">Workspace Bookings</span>
                        <span className="text-2xl">🧑‍💻</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-800 mb-1">
                        {formatCurrency(reportData.summary.workspaceBookings.total)}
                      </p>
                      <p className="text-xs text-purple-600">Count: {reportData.summary.workspaceBookings.count}</p>
                    </div>

                    {/* Overall Total */}
                    <div className="bg-gradient-to-br from-green-50 via-green-100/70 to-green-50/80 rounded-xl p-5 border-2 border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-green-700">Overall Total</span>
                        <span className="text-2xl">💰</span>
                      </div>
                      <p className="text-2xl font-bold text-green-800 mb-1">
                        {formatCurrency(reportData.summary.overall.totalAmount)}
                      </p>
                      <p className="text-xs text-green-600">Total Orders: {reportData.summary.overall.totalOrders}</p>
                    </div>
                  </div>

                  {/* Detailed Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gradient-to-r from-primary-500 to-accent-500 text-white">
                          <th className="px-4 py-3 text-left font-bold rounded-tl-xl">Category</th>
                          <th className="px-4 py-3 text-center font-bold">Count</th>
                          <th className="px-4 py-3 text-right font-bold rounded-tr-xl">Total Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-200 hover:bg-orange-50/50">
                          <td className="px-4 py-3 font-semibold text-gray-800">🍔 Food Orders</td>
                          <td className="px-4 py-3 text-center text-gray-700">{reportData.summary.foodOrders.count}</td>
                          <td className="px-4 py-3 text-right font-bold text-orange-600">{formatCurrency(reportData.summary.foodOrders.total)}</td>
                        </tr>
                        <tr className="border-b border-gray-200 hover:bg-blue-50/50">
                          <td className="px-4 py-3 font-semibold text-gray-800">🎱 Snooker Bookings</td>
                          <td className="px-4 py-3 text-center text-gray-700">{reportData.summary.snookerBookings.count}</td>
                          <td className="px-4 py-3 text-right font-bold text-blue-600">{formatCurrency(reportData.summary.snookerBookings.total)}</td>
                        </tr>
                        <tr className="border-b border-gray-200 hover:bg-purple-50/50">
                          <td className="px-4 py-3 font-semibold text-gray-800">🧑‍💻 Workspace Bookings</td>
                          <td className="px-4 py-3 text-center text-gray-700">{reportData.summary.workspaceBookings.count}</td>
                          <td className="px-4 py-3 text-right font-bold text-purple-600">{formatCurrency(reportData.summary.workspaceBookings.total)}</td>
                        </tr>
                        <tr className="bg-gradient-to-r from-green-50 to-emerald-50 font-bold">
                          <td className="px-4 py-4 rounded-bl-xl text-gray-800">💰 Overall Total</td>
                          <td className="px-4 py-4 text-center text-gray-800">{reportData.summary.overall.totalOrders}</td>
                          <td className="px-4 py-4 text-right rounded-br-xl text-green-700 text-lg">{formatCurrency(reportData.summary.overall.totalAmount)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Weekly Daily Breakdown */}
                  {activeReport === 'weekly' && reportData.dailyBreakdown && (
                    <div className="mt-8">
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Daily Breakdown</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gradient-to-r from-primary-500 to-accent-500 text-white">
                              <th className="px-4 py-3 text-left font-bold rounded-tl-xl">Date</th>
                              <th className="px-4 py-3 text-right font-bold">Food Orders</th>
                              <th className="px-4 py-3 text-right font-bold">Snooker</th>
                              <th className="px-4 py-3 text-right font-bold">Workspace</th>
                              <th className="px-4 py-3 text-right font-bold rounded-tr-xl">Daily Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportData.dailyBreakdown.map((day, index) => (
                              <tr key={day.date} className={`border-b border-gray-200 hover:bg-gray-50 ${index === reportData.dailyBreakdown!.length - 1 ? 'font-semibold bg-green-50' : ''}`}>
                                <td className="px-4 py-3 text-gray-800">
                                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                </td>
                                <td className="px-4 py-3 text-right text-orange-600">{formatCurrency(day.food)}</td>
                                <td className="px-4 py-3 text-right text-blue-600">{formatCurrency(day.snooker)}</td>
                                <td className="px-4 py-3 text-right text-purple-600">{formatCurrency(day.workspace)}</td>
                                <td className="px-4 py-3 text-right font-bold text-green-700">{formatCurrency(day.total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

