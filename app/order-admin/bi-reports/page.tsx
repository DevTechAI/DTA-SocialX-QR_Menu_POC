'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface StatusBreakdown {
  delivered: { count: number; total: number; orderIds: string[] };
  paid: { count: number; total: number; orderIds: string[] };
  unpaid: { count: number; total: number; orderIds: string[] };
}

interface ReportData {
  date?: string;
  weekStart?: string;
  weekEnd?: string;
  summary: {
    foodOrders: { count: number; total: number; currency: string; statusBreakdown?: StatusBreakdown };
    snookerBookings: { count: number; total: number; currency: string; statusBreakdown?: StatusBreakdown };
    workspaceBookings: { count: number; total: number; currency: string; statusBreakdown?: StatusBreakdown };
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
  const [activeReport, setActiveReport] = useState<'none' | 'daily' | 'weekly' | 'analytics'>('none');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderDetailsView, setOrderDetailsView] = useState<{
    category: 'food' | 'snooker' | 'workspace';
    status: 'delivered' | 'paid' | 'unpaid';
    orderIds: string[];
  } | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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

  const handleUserClickAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      // Placeholder for analytics functionality
      // Will be implemented shortly
      setActiveReport('analytics');
    } catch (err: any) {
      setError(err.message || 'Failed to load user click analytics');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current || !reportData) {
      return;
    }

    setIsGeneratingPDF(true);
    try {
      // Hide elements that shouldn't be in PDF
      const noPrintElements = document.querySelectorAll('.no-print');
      noPrintElements.forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });

      // Get the report content element
      const reportElement = reportRef.current;
      
      // PDF dimensions (A4 landscape)
      const pdfWidth = 297; // mm
      const pdfHeight = 210; // mm
      const margin = 10; // margin in mm
      const contentWidth = pdfWidth - (margin * 2);
      const contentHeight = pdfHeight - (margin * 2);
      
      // Convert mm to pixels (at 96 DPI: 1mm ≈ 3.7795 pixels)
      const pxPerMm = 3.7795;
      const contentWidthPx = contentWidth * pxPerMm;
      
      // Store original styles
      const originalWidth = reportElement.style.width;
      const originalHeight = reportElement.style.height;
      const originalOverflow = reportElement.style.overflow;
      const originalMaxHeight = reportElement.style.maxHeight;
      
      // Set up element for full content capture
      reportElement.style.width = `${contentWidthPx}px`;
      reportElement.style.height = 'auto';
      reportElement.style.maxHeight = 'none';
      reportElement.style.overflow = 'visible';
      
      // Wait a bit for layout to settle
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Capture the entire content as canvas
      const canvas = await html2canvas(reportElement, {
        scale: 2, // Higher quality for better graphics
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: contentWidthPx,
        height: reportElement.scrollHeight,
        windowWidth: contentWidthPx,
        windowHeight: reportElement.scrollHeight,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('.print-content') as HTMLElement;
          if (clonedElement) {
            clonedElement.style.width = `${contentWidthPx}px`;
            clonedElement.style.height = 'auto';
            clonedElement.style.maxHeight = 'none';
            clonedElement.style.overflow = 'visible';
          }
          // Ensure footer is visible in cloned document
          const clonedFooter = clonedDoc.querySelector('footer');
          if (clonedFooter) {
            (clonedFooter as HTMLElement).style.display = 'block';
          }
          // Add page-break CSS to table rows to prevent splitting
          const style = clonedDoc.createElement('style');
          style.textContent = `
            table tr {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            table thead {
              display: table-header-group;
            }
            table tfoot {
              display: table-footer-group;
            }
          `;
          clonedDoc.head.appendChild(style);
        }
      });

      // Restore original styles
      reportElement.style.width = originalWidth;
      reportElement.style.height = originalHeight;
      reportElement.style.overflow = originalOverflow;
      reportElement.style.maxHeight = originalMaxHeight;
      
      // Restore hidden elements
      noPrintElements.forEach(el => {
        (el as HTMLElement).style.display = '';
      });

      // Calculate dimensions
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Convert pixels to mm (accounting for scale factor of 2)
      const imgWidthInMm = imgWidth / (2 * pxPerMm);
      const imgHeightInMm = imgHeight / (2 * pxPerMm);
      
      // Calculate scaling to fit content width
      const widthRatio = contentWidth / imgWidthInMm;
      const scaledWidth = contentWidth;
      const scaledHeight = imgHeightInMm * widthRatio;
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      // Calculate number of pages needed with better row handling
      const pageContentHeight = contentHeight;
      
      // Estimate average row height in mm (adjust based on your table row height)
      // Typical table row is around 40-60px, which is about 10-15mm at scale
      const estimatedRowHeightMm = 12; // Approximate row height in mm
      const rowHeightBuffer = estimatedRowHeightMm * 1.2; // Add 20% buffer
      
      // Split content across pages with intelligent row-aware splitting
      let currentY = 0;
      let totalPages = 0;
      const maxIterations = 100; // Safety limit
      let iterations = 0;
      
      while (currentY < scaledHeight && iterations < maxIterations) {
        iterations++;
        
        if (totalPages > 0) {
          pdf.addPage();
        }
        
        // Calculate available space on this page
        let availableHeight = pageContentHeight;
        
        // If this is not the last page (we have more content), leave buffer to avoid cutting rows
        const remainingContent = scaledHeight - currentY;
        if (remainingContent > pageContentHeight) {
          // Leave buffer space to avoid cutting rows
          availableHeight = pageContentHeight - rowHeightBuffer;
          
          // Ensure we don't make the page too small
          if (availableHeight < pageContentHeight * 0.75) {
            availableHeight = pageContentHeight * 0.85; // Use 85% of page if buffer is too large
          }
        }
        
        // Calculate source coordinates for this page
        const sourceY = currentY / widthRatio * (2 * pxPerMm);
        const remainingHeight = imgHeight - sourceY;
        const pageSourceHeight = Math.min(
          availableHeight / widthRatio * (2 * pxPerMm),
          remainingHeight
        );
        
        // Ensure we have at least some content
        if (pageSourceHeight <= 0) break;
        
        // Calculate destination dimensions
        const destY = margin;
        const destHeight = (pageSourceHeight / (2 * pxPerMm)) * widthRatio;
        
        // Create canvas for this page slice
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = imgWidth;
        pageCanvas.height = Math.ceil(pageSourceHeight);
        const pageCtx = pageCanvas.getContext('2d');
        
        if (pageCtx) {
          // Draw the portion of the image for this page
          pageCtx.drawImage(
            canvas,
            0, Math.floor(sourceY), imgWidth, Math.ceil(pageSourceHeight),
            0, 0, imgWidth, Math.ceil(pageSourceHeight)
          );
          
          const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
          
          // Add to PDF with proper positioning
          pdf.addImage(
            pageImgData,
            'PNG',
            margin,
            destY,
            scaledWidth,
            Math.min(destHeight, pageContentHeight),
            undefined,
            'FAST'
          );
        }
        
        // Update current position for next page
        // Move forward by the actual height used, ensuring we don't overlap
        currentY += availableHeight;
        totalPages++;
        
        // Safety check to prevent infinite loops
        if (currentY >= scaledHeight) break;
      }
      
      // Generate filename
      const reportType = activeReport === 'daily' ? 'Daily' : 'Weekly';
      const dateStr = activeReport === 'daily' 
        ? (reportData.date || new Date().toISOString().split('T')[0])
        : (reportData.weekStart || new Date().toISOString().split('T')[0]);
      const filename = `${reportType}_Settlement_Report_${dateStr}.pdf`;
      
      // Save PDF
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
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
          @page {
            size: A4 landscape;
            margin: 1cm;
          }
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
            font-size: 12pt;
          }
          .no-print {
            display: none !important;
          }
          .print-content table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11pt;
          }
          .print-content table th,
          .print-content table td {
            padding: 8px;
            border: 1px solid #ddd;
          }
          .print-content .grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
          }
          .print-content .overflow-x-auto {
            overflow: visible;
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
                    className="no-print px-5 py-2.5 bg-white/50 backdrop-blur-md text-gray-900 rounded-lg border-2 border-white/70 hover:bg-white/60 hover:border-white/90 transition-all font-bold text-base shadow-lg hover:shadow-xl active:scale-95"
                  >
                    🏠 Dashboard
                  </Link>
                  <Link
                    href="/order-admin/menu-edit"
                    className="no-print px-5 py-2.5 bg-white/50 backdrop-blur-md text-gray-900 rounded-lg border-2 border-white/70 hover:bg-white/60 hover:border-white/90 transition-all font-bold text-base shadow-lg hover:shadow-xl active:scale-95"
                  >
                    📝 Menu Editor
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="no-print px-4 py-2 bg-white/20 backdrop-blur-md text-white rounded-lg border border-white/30 hover:bg-white/30 transition-colors font-semibold text-sm"
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

          {/* Second Row - User Click Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* User Click Analytics Button */}
            <button
              onClick={handleUserClickAnalytics}
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
                  <span className="text-4xl">👆</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">User Click Analytics</h2>
                <p className="text-gray-600 text-sm md:text-base">Track user interactions, clicks, and engagement metrics</p>
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
                  className="no-print px-4 py-2 bg-white/50 backdrop-blur-md text-gray-900 rounded-lg border-2 border-white/70 hover:bg-white/60 hover:border-white/90 transition-all font-semibold text-base shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2"
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
              {!loading && activeReport === 'analytics' && (
                <div ref={reportRef} className="print-content bg-white rounded-2xl shadow-soft-lg border-2 border-primary-200 p-6 md:p-8">
                  {/* Report Header */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 pb-4 border-b-2 border-gray-200">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                        👆 User Click Analytics
                      </h2>
                      <p className="text-gray-600">
                        User interaction and click tracking analytics
                      </p>
                    </div>
                    <div className="flex gap-3 mt-4 md:mt-0 no-print">
                      <button
                        onClick={handleBackToReports}
                        className="no-print px-4 py-2 bg-white/50 backdrop-blur-md text-gray-900 rounded-lg border-2 border-white/70 hover:bg-white/60 hover:border-white/90 transition-all font-semibold text-base shadow-lg hover:shadow-xl active:scale-95"
                      >
                        Back to Reports
                      </button>
                    </div>
                  </div>

                  {/* Placeholder Content */}
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl gradient-primary mb-6 shadow-soft-lg">
                      <span className="text-5xl">👆</span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
                      User Click Analytics
                    </h3>
                    <p className="text-gray-600 text-lg mb-8">
                      Analytics functionality will be implemented shortly
                    </p>
                    <div className="bg-gradient-to-br from-orange-50 via-white to-orange-50/60 rounded-xl p-6 border-2 border-orange-200">
                      <p className="text-gray-700 font-semibold mb-2">
                        Expected features:
                      </p>
                      <ul className="text-left mt-4 space-y-2 text-gray-600">
                        <li className="flex items-center gap-2">
                          <span className="text-orange-500">•</span>
                          User click tracking
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-orange-500">•</span>
                          Page interaction analytics
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-orange-500">•</span>
                          Engagement metrics
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-orange-500">•</span>
                          User behavior insights
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Report Display */}
              {!loading && reportData && activeReport !== 'analytics' && (
                <div ref={reportRef} className="print-content bg-white rounded-2xl shadow-soft-lg border-2 border-primary-200 p-6 md:p-8">
                  {/* Report Header */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 pb-4 border-b-2 border-gray-200">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                        {activeReport === 'daily' ? '📅 Daily Settlement Report' : activeReport === 'weekly' ? '📊 Weekly Settlement Report' : '👆 User Click Analytics'}
                      </h2>
                      <p className="text-gray-600">
                        {activeReport === 'daily' 
                          ? `Date: ${reportData.date ? new Date(reportData.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}`
                          : activeReport === 'weekly'
                          ? `Week: ${reportData.weekStart ? new Date(reportData.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'} - ${reportData.weekEnd ? new Date(reportData.weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}`
                          : 'User interaction and click tracking analytics'
                        }
                      </p>
                    </div>
                    <div className="flex gap-3 mt-4 md:mt-0 no-print">
                      <button
                        onClick={handleDownloadPDF}
                        disabled={isGeneratingPDF}
                        className="no-print px-5 py-2.5 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg font-bold text-base shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isGeneratingPDF ? (
                          <>
                            <span className="animate-spin">⏳</span> Generating PDF...
                          </>
                        ) : (
                          <>
                            <span>📄</span> Download PDF
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleDBDump}
                        disabled
                        className="no-print px-5 py-2.5 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-lg font-bold text-base shadow-lg opacity-50 cursor-not-allowed flex items-center gap-2"
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

                  {/* Detailed Table with Status Breakdown */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-[800px]">
                      <thead>
                        <tr className="bg-gradient-to-r from-primary-500 to-accent-500 text-white">
                          <th className="px-4 py-3 text-left font-bold rounded-tl-xl">Category</th>
                          <th className="px-4 py-3 text-center font-bold">Status</th>
                          <th className="px-4 py-3 text-center font-bold">Count</th>
                          <th className="px-4 py-3 text-right font-bold rounded-tr-xl">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Food Orders - Status Breakdown */}
                        {reportData.summary.foodOrders.statusBreakdown && (
                          <>
                            <tr className="border-b border-gray-200 hover:bg-orange-50/50">
                              <td className="px-4 py-3 font-semibold text-gray-800" rowSpan={3}>🍔 Food Orders</td>
                              <td className="px-4 py-3 text-center">
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">Delivered</span>
                              </td>
                              <td 
                                className="px-4 py-3 text-center text-gray-700 font-bold cursor-pointer hover:text-green-600 hover:underline"
                                onClick={() => reportData.summary.foodOrders.statusBreakdown?.delivered.orderIds.length && setOrderDetailsView({
                                  category: 'food',
                                  status: 'delivered',
                                  orderIds: reportData.summary.foodOrders.statusBreakdown.delivered.orderIds
                                })}
                              >
                                {reportData.summary.foodOrders.statusBreakdown.delivered.count}
                              </td>
                              <td 
                                className="px-4 py-3 text-right font-bold text-green-600 cursor-pointer hover:underline"
                                onClick={() => reportData.summary.foodOrders.statusBreakdown?.delivered.orderIds.length && setOrderDetailsView({
                                  category: 'food',
                                  status: 'delivered',
                                  orderIds: reportData.summary.foodOrders.statusBreakdown.delivered.orderIds
                                })}
                              >
                                {formatCurrency(reportData.summary.foodOrders.statusBreakdown.delivered.total)}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200 hover:bg-orange-50/50">
                              <td className="px-4 py-3 text-center">
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">Paid</span>
                              </td>
                              <td 
                                className="px-4 py-3 text-center text-gray-700 font-bold cursor-pointer hover:text-blue-600 hover:underline"
                                onClick={() => reportData.summary.foodOrders.statusBreakdown?.paid.orderIds.length && setOrderDetailsView({
                                  category: 'food',
                                  status: 'paid',
                                  orderIds: reportData.summary.foodOrders.statusBreakdown.paid.orderIds
                                })}
                              >
                                {reportData.summary.foodOrders.statusBreakdown.paid.count}
                              </td>
                              <td 
                                className="px-4 py-3 text-right font-bold text-blue-600 cursor-pointer hover:underline"
                                onClick={() => reportData.summary.foodOrders.statusBreakdown?.paid.orderIds.length && setOrderDetailsView({
                                  category: 'food',
                                  status: 'paid',
                                  orderIds: reportData.summary.foodOrders.statusBreakdown.paid.orderIds
                                })}
                              >
                                {formatCurrency(reportData.summary.foodOrders.statusBreakdown.paid.total)}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200 hover:bg-orange-50/50">
                              <td className="px-4 py-3 text-center">
                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">UnPaid</span>
                              </td>
                              <td 
                                className="px-4 py-3 text-center text-gray-700 font-bold cursor-pointer hover:text-red-600 hover:underline"
                                onClick={() => reportData.summary.foodOrders.statusBreakdown?.unpaid.orderIds.length && setOrderDetailsView({
                                  category: 'food',
                                  status: 'unpaid',
                                  orderIds: reportData.summary.foodOrders.statusBreakdown.unpaid.orderIds
                                })}
                              >
                                {reportData.summary.foodOrders.statusBreakdown.unpaid.count}
                              </td>
                              <td 
                                className="px-4 py-3 text-right font-bold text-red-600 cursor-pointer hover:underline"
                                onClick={() => reportData.summary.foodOrders.statusBreakdown?.unpaid.orderIds.length && setOrderDetailsView({
                                  category: 'food',
                                  status: 'unpaid',
                                  orderIds: reportData.summary.foodOrders.statusBreakdown.unpaid.orderIds
                                })}
                              >
                                {formatCurrency(reportData.summary.foodOrders.statusBreakdown.unpaid.total)}
                              </td>
                            </tr>
                            <tr className="border-b-2 border-orange-300 bg-orange-50/30">
                              <td className="px-4 py-3 font-bold text-orange-800" colSpan={2}>🍔 Food Orders Total</td>
                              <td className="px-4 py-3 text-center font-bold text-orange-800">{reportData.summary.foodOrders.count}</td>
                              <td className="px-4 py-3 text-right font-bold text-orange-700">{formatCurrency(reportData.summary.foodOrders.total)}</td>
                            </tr>
                          </>
                        )}
                        
                        {/* Snooker Bookings - Status Breakdown */}
                        {reportData.summary.snookerBookings.statusBreakdown && (
                          <>
                            <tr className="border-b border-gray-200 hover:bg-blue-50/50">
                              <td className="px-4 py-3 font-semibold text-gray-800" rowSpan={3}>🎱 Snooker Bookings</td>
                              <td className="px-4 py-3 text-center">
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">Delivered</span>
                              </td>
                              <td 
                                className="px-4 py-3 text-center text-gray-700 font-bold cursor-pointer hover:text-green-600 hover:underline"
                                onClick={() => reportData.summary.snookerBookings.statusBreakdown?.delivered.orderIds.length && setOrderDetailsView({
                                  category: 'snooker',
                                  status: 'delivered',
                                  orderIds: reportData.summary.snookerBookings.statusBreakdown.delivered.orderIds
                                })}
                              >
                                {reportData.summary.snookerBookings.statusBreakdown.delivered.count}
                              </td>
                              <td 
                                className="px-4 py-3 text-right font-bold text-green-600 cursor-pointer hover:underline"
                                onClick={() => reportData.summary.snookerBookings.statusBreakdown?.delivered.orderIds.length && setOrderDetailsView({
                                  category: 'snooker',
                                  status: 'delivered',
                                  orderIds: reportData.summary.snookerBookings.statusBreakdown.delivered.orderIds
                                })}
                              >
                                {formatCurrency(reportData.summary.snookerBookings.statusBreakdown.delivered.total)}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200 hover:bg-blue-50/50">
                              <td className="px-4 py-3 text-center">
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">Paid</span>
                              </td>
                              <td 
                                className="px-4 py-3 text-center text-gray-700 font-bold cursor-pointer hover:text-blue-600 hover:underline"
                                onClick={() => reportData.summary.snookerBookings.statusBreakdown?.paid.orderIds.length && setOrderDetailsView({
                                  category: 'snooker',
                                  status: 'paid',
                                  orderIds: reportData.summary.snookerBookings.statusBreakdown.paid.orderIds
                                })}
                              >
                                {reportData.summary.snookerBookings.statusBreakdown.paid.count}
                              </td>
                              <td 
                                className="px-4 py-3 text-right font-bold text-blue-600 cursor-pointer hover:underline"
                                onClick={() => reportData.summary.snookerBookings.statusBreakdown?.paid.orderIds.length && setOrderDetailsView({
                                  category: 'snooker',
                                  status: 'paid',
                                  orderIds: reportData.summary.snookerBookings.statusBreakdown.paid.orderIds
                                })}
                              >
                                {formatCurrency(reportData.summary.snookerBookings.statusBreakdown.paid.total)}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200 hover:bg-blue-50/50">
                              <td className="px-4 py-3 text-center">
                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">UnPaid</span>
                              </td>
                              <td 
                                className="px-4 py-3 text-center text-gray-700 font-bold cursor-pointer hover:text-red-600 hover:underline"
                                onClick={() => reportData.summary.snookerBookings.statusBreakdown?.unpaid.orderIds.length && setOrderDetailsView({
                                  category: 'snooker',
                                  status: 'unpaid',
                                  orderIds: reportData.summary.snookerBookings.statusBreakdown.unpaid.orderIds
                                })}
                              >
                                {reportData.summary.snookerBookings.statusBreakdown.unpaid.count}
                              </td>
                              <td 
                                className="px-4 py-3 text-right font-bold text-red-600 cursor-pointer hover:underline"
                                onClick={() => reportData.summary.snookerBookings.statusBreakdown?.unpaid.orderIds.length && setOrderDetailsView({
                                  category: 'snooker',
                                  status: 'unpaid',
                                  orderIds: reportData.summary.snookerBookings.statusBreakdown.unpaid.orderIds
                                })}
                              >
                                {formatCurrency(reportData.summary.snookerBookings.statusBreakdown.unpaid.total)}
                              </td>
                            </tr>
                            <tr className="border-b-2 border-blue-300 bg-blue-50/30">
                              <td className="px-4 py-3 font-bold text-blue-800" colSpan={2}>🎱 Snooker Bookings Total</td>
                              <td className="px-4 py-3 text-center font-bold text-blue-800">{reportData.summary.snookerBookings.count}</td>
                              <td className="px-4 py-3 text-right font-bold text-blue-700">{formatCurrency(reportData.summary.snookerBookings.total)}</td>
                            </tr>
                          </>
                        )}
                        
                        {/* Workspace Bookings - Status Breakdown */}
                        {reportData.summary.workspaceBookings.statusBreakdown && (
                          <>
                            <tr className="border-b border-gray-200 hover:bg-purple-50/50">
                              <td className="px-4 py-3 font-semibold text-gray-800" rowSpan={3}>🧑‍💻 Workspace Bookings</td>
                              <td className="px-4 py-3 text-center">
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">Delivered</span>
                              </td>
                              <td 
                                className="px-4 py-3 text-center text-gray-700 font-bold cursor-pointer hover:text-green-600 hover:underline"
                                onClick={() => reportData.summary.workspaceBookings.statusBreakdown?.delivered.orderIds.length && setOrderDetailsView({
                                  category: 'workspace',
                                  status: 'delivered',
                                  orderIds: reportData.summary.workspaceBookings.statusBreakdown.delivered.orderIds
                                })}
                              >
                                {reportData.summary.workspaceBookings.statusBreakdown.delivered.count}
                              </td>
                              <td 
                                className="px-4 py-3 text-right font-bold text-green-600 cursor-pointer hover:underline"
                                onClick={() => reportData.summary.workspaceBookings.statusBreakdown?.delivered.orderIds.length && setOrderDetailsView({
                                  category: 'workspace',
                                  status: 'delivered',
                                  orderIds: reportData.summary.workspaceBookings.statusBreakdown.delivered.orderIds
                                })}
                              >
                                {formatCurrency(reportData.summary.workspaceBookings.statusBreakdown.delivered.total)}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200 hover:bg-purple-50/50">
                              <td className="px-4 py-3 text-center">
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">Paid</span>
                              </td>
                              <td 
                                className="px-4 py-3 text-center text-gray-700 font-bold cursor-pointer hover:text-blue-600 hover:underline"
                                onClick={() => reportData.summary.workspaceBookings.statusBreakdown?.paid.orderIds.length && setOrderDetailsView({
                                  category: 'workspace',
                                  status: 'paid',
                                  orderIds: reportData.summary.workspaceBookings.statusBreakdown.paid.orderIds
                                })}
                              >
                                {reportData.summary.workspaceBookings.statusBreakdown.paid.count}
                              </td>
                              <td 
                                className="px-4 py-3 text-right font-bold text-blue-600 cursor-pointer hover:underline"
                                onClick={() => reportData.summary.workspaceBookings.statusBreakdown?.paid.orderIds.length && setOrderDetailsView({
                                  category: 'workspace',
                                  status: 'paid',
                                  orderIds: reportData.summary.workspaceBookings.statusBreakdown.paid.orderIds
                                })}
                              >
                                {formatCurrency(reportData.summary.workspaceBookings.statusBreakdown.paid.total)}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200 hover:bg-purple-50/50">
                              <td className="px-4 py-3 text-center">
                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">UnPaid</span>
                              </td>
                              <td 
                                className="px-4 py-3 text-center text-gray-700 font-bold cursor-pointer hover:text-red-600 hover:underline"
                                onClick={() => reportData.summary.workspaceBookings.statusBreakdown?.unpaid.orderIds.length && setOrderDetailsView({
                                  category: 'workspace',
                                  status: 'unpaid',
                                  orderIds: reportData.summary.workspaceBookings.statusBreakdown.unpaid.orderIds
                                })}
                              >
                                {reportData.summary.workspaceBookings.statusBreakdown.unpaid.count}
                              </td>
                              <td 
                                className="px-4 py-3 text-right font-bold text-red-600 cursor-pointer hover:underline"
                                onClick={() => reportData.summary.workspaceBookings.statusBreakdown?.unpaid.orderIds.length && setOrderDetailsView({
                                  category: 'workspace',
                                  status: 'unpaid',
                                  orderIds: reportData.summary.workspaceBookings.statusBreakdown.unpaid.orderIds
                                })}
                              >
                                {formatCurrency(reportData.summary.workspaceBookings.statusBreakdown.unpaid.total)}
                              </td>
                            </tr>
                            <tr className="border-b-2 border-purple-300 bg-purple-50/30">
                              <td className="px-4 py-3 font-bold text-purple-800" colSpan={2}>🧑‍💻 Workspace Bookings Total</td>
                              <td className="px-4 py-3 text-center font-bold text-purple-800">{reportData.summary.workspaceBookings.count}</td>
                              <td className="px-4 py-3 text-right font-bold text-purple-700">{formatCurrency(reportData.summary.workspaceBookings.total)}</td>
                            </tr>
                          </>
                        )}
                        
                        {/* Overall Total */}
                        <tr className="bg-gradient-to-r from-green-50 to-emerald-50 font-bold">
                          <td className="px-4 py-4 rounded-bl-xl text-gray-800" colSpan={2}>💰 Overall Total</td>
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

                  {/* Footer - Included in PDF */}
                  <footer className="mt-8 pt-6 text-center border-t border-gray-200/50 bg-white/60 backdrop-blur-sm">
                    <p className="text-sm text-gray-600">
                      Tech Powered by{' '}
                      <a
                        href="https://www.devtechai.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 font-semibold underline transition-colors"
                      >
                        DevTechAi.Org
                      </a>
                    </p>
                  </footer>
                </div>
              )}

              {/* Order Details View */}
              {orderDetailsView && (
                <OrderDetailsView
                  category={orderDetailsView.category}
                  status={orderDetailsView.status}
                  orderIds={orderDetailsView.orderIds}
                  date={activeReport === 'daily' ? reportData?.date : reportData?.weekStart}
                  onClose={() => setOrderDetailsView(null)}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 py-6 text-center border-t border-gray-200/50 bg-white/60 backdrop-blur-sm">
        <p className="text-sm text-gray-600">
          Tech Powered by{' '}
          <a
            href="https://www.devtechai.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-700 font-semibold underline transition-colors"
          >
            DevTechAi.Org
          </a>
        </p>
      </footer>
    </div>
    </>
  );
}

// Format currency helper function
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

// Order Details View Component
function OrderDetailsView({ 
  category, 
  status, 
  orderIds, 
  date,
  onClose 
}: { 
  category: 'food' | 'snooker' | 'workspace';
  status: 'delivered' | 'paid' | 'unpaid';
  orderIds: string[];
  date?: string;
  onClose: () => void;
}) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        if (category === 'food') {
          const response = await fetch(`/api/orders?ids=${orderIds.join(',')}`);
          if (response.ok) {
            const data = await response.json();
            setOrders(Array.isArray(data) ? data : []);
          }
        } else if (category === 'snooker') {
          const response = await fetch('/api/snooker-bookings');
          if (response.ok) {
            const allBookings = await response.json();
            setOrders(allBookings.filter((b: any) => orderIds.includes(b.snooker_order_id)));
          }
        } else if (category === 'workspace') {
          const response = await fetch('/api/workspace-bookings');
          if (response.ok) {
            const allBookings = await response.json();
            setOrders(allBookings.filter((b: any) => orderIds.includes(b.workspace_order_id)));
          }
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    if (orderIds.length > 0) {
      fetchOrders();
    }
  }, [category, orderIds]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const categoryLabels = {
    food: '🍔 Food Orders',
    snooker: '🎱 Snooker Bookings',
    workspace: '🧑‍💻 Workspace Bookings'
  };

  const statusLabels = {
    delivered: 'Delivered',
    paid: 'Paid',
    unpaid: 'UnPaid'
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        // Close modal when clicking on backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-accent-500 text-white p-6 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold">{categoryLabels[category]} - {statusLabels[status]}</h3>
            <p className="text-white/80 text-sm mt-1">
              {orderIds.length} order{orderIds.length !== 1 ? 's' : ''} • {date && `Date: ${new Date(date).toLocaleDateString()}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition-colors"
          >
            ✕ Close
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4 shadow-soft-lg animate-pulse">
                  <span className="text-3xl text-white">⏳</span>
                </div>
                <p className="text-gray-700 font-bold">Loading orders...</p>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No orders found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orders.map((order) => (
                <div
                  key={order.id || order.snooker_order_id || order.workspace_order_id}
                  className="bg-gradient-to-br from-white via-white to-orange-50/60 rounded-xl p-4 border-2 border-primary-200 shadow-soft"
                >
                  {category === 'food' && (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-mono text-gray-500">ID: {(order.id || '').slice(-8)}</span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          order.status === 'paid' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {order.status || 'N/A'}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-800 mb-2">{order.customer_name || 'N/A'}</p>
                      <p className="text-sm text-gray-600 mb-3">{order.customer_phno || 'N/A'}</p>
                      {order.items && Array.isArray(order.items) && order.items.length > 0 && (
                        <div className="mb-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Order Items:</p>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {order.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between text-xs bg-white rounded px-2 py-1.5 border border-gray-100">
                                <span className="text-gray-700 font-medium flex-1">
                                  {item.name || item.item_name || 'Unknown Item'}
                                </span>
                                <span className="text-gray-600 mx-2">
                                  x{item.quantity || 1}
                                </span>
                                <span className="text-gray-800 font-semibold">
                                  ₹{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                          {order.items.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <p className="text-xs font-semibold text-gray-700 text-right">
                                Subtotal: <span className="text-orange-600">{formatCurrency(
                                  order.items.reduce((sum: number, item: any) => 
                                    sum + ((item.price || 0) * (item.quantity || 1)), 0
                                  )
                                )}</span>
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                      <p className="text-lg font-bold text-orange-600">Total: {formatCurrency(order.total_amount || 0)}</p>
                    </>
                  )}
                  {(category === 'snooker' || category === 'workspace') && (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-mono text-gray-500">
                          ID: {((order.snooker_order_id || order.workspace_order_id) || '').slice(-8)}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          order.order_status === 'paid' || order.order_status === 'Paid' ? 'bg-blue-100 text-blue-700' :
                          order.order_status === 'ended' || order.order_status === 'delivered' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {order.order_status || 'N/A'}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-800 mb-2">{order.customer_name || 'N/A'}</p>
                      <p className="text-sm text-gray-600 mb-3">{order.customer_phno || 'N/A'}</p>
                      {category === 'snooker' && (
                        <>
                          {order.snooker_board_menu_items && (
                            <p className="text-xs text-gray-600 mb-1">Board: {order.snooker_board_menu_items.board_name}</p>
                          )}
                          {order.total_duration_minutes && (
                            <p className="text-xs text-gray-600 mb-1">Duration: {order.total_duration_minutes} mins</p>
                          )}
                          <p className="text-lg font-bold text-blue-600">
                            Total: {formatCurrency(order.total_order_amount || 0)}
                          </p>
                        </>
                      )}
                      {category === 'workspace' && (
                        <>
                          {order.workspace_seat_menu_items && (
                            <p className="text-xs text-gray-600 mb-1">
                              Seat Value: ₹{order.workspace_seat_menu_items.workspace_seat_value}
                            </p>
                          )}
                          <p className="text-lg font-bold text-purple-600">
                            Total: {formatCurrency(order.total_order_value || 0)}
                          </p>
                        </>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

