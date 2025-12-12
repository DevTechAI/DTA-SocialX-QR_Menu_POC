'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSessionData, setSessionData, removeSessionData } from '@/lib/utils/sessionStorage';

type Board = {
  snooker_board_id: string;
  board_name: string;
  type: string;
  given_duration_for_100inr: number;
};

export default function BookSnookerPage() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedBoard, setSelectedBoard] = useState('');
  const [playersCount, setPlayersCount] = useState('');
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showBookingSuccessDialog, setShowBookingSuccessDialog] = useState(false);
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [bookingOrderId, setBookingOrderId] = useState<string>('');
  const [bookingDetails, setBookingDetails] = useState<{
    customerName: string;
    customerPhone: string;
    boardName: string;
    boardId: string;
    playersCount: number;
    orderDate: string;
  } | null>(null);
  
  // Feature visibility state
  const [isFeatureEnabled, setIsFeatureEnabled] = useState(true);
  const [featureVisibilityLoading, setFeatureVisibilityLoading] = useState(true);

  // Fetch feature visibility
  useEffect(() => {
    const fetchFeatureVisibility = async () => {
      try {
        const response = await fetch('/api/feature-control/visibility');
        if (response.ok) {
          const data = await response.json();
          setIsFeatureEnabled(data['snooker-order-booking'] ?? true);
        }
      } catch (error) {
        console.error('Error fetching feature visibility:', error);
        setIsFeatureEnabled(true); // Default to enabled on error
      } finally {
        setFeatureVisibilityLoading(false);
      }
    };

    fetchFeatureVisibility();
  }, []);

  // Restore booking data from 12-hour session storage on page load
  useEffect(() => {
    const restoreBookingData = async () => {
      // Check if we're starting a new booking (from Food Order Summary)
      const startNewBooking = sessionStorage.getItem('startNewSnookerBooking') === 'true';
      
      if (startNewBooking) {
        // Clear the flag
        sessionStorage.removeItem('startNewSnookerBooking');
        // Don't restore booking data - show empty form instead
        setShowOrderSummary(false);
        setLoading(false);
        return;
      }
      
      // First, try to restore from client-side 12-hour session storage
      const savedBookingDetails = getSessionData<{
        customerName: string;
        customerPhone: string;
        boardName: string;
        boardId: string;
        playersCount: number;
        orderDate: string;
      }>('snooker_bookingDetails');
      
      const savedBookingOrderId = getSessionData<string>('snooker_bookingOrderId');
      const savedShowOrderSummary = getSessionData<boolean>('snooker_showOrderSummary');

      if (savedBookingDetails && savedBookingOrderId) {
        // Restore from client-side storage
        setBookingDetails(savedBookingDetails);
        setBookingOrderId(savedBookingOrderId);
        // Always show order summary if we have saved booking data
        setShowOrderSummary(true);
        setLoading(false);
        return;
      }

      // If no client-side data, try to restore from server using phone number
      const savedPhone = sessionStorage.getItem('customerPhone') || 
                        getSessionData<string>('snooker_customerPhone');
      
      if (savedPhone && boards.length > 0) {
        try {
          const response = await fetch(`/api/snooker-bookings/by-phone?phone=${encodeURIComponent(savedPhone)}`);
          if (response.ok) {
            const result = await response.json();
            if (result.data) {
              // Found booking on server, restore it
              const booking = result.data;
              const selectedBoard = boards.find(b => b.snooker_board_id === booking.snooker_board_id);
              const boardName = selectedBoard 
                ? selectedBoard.board_name.replace(/\s+[A-Z0-9]+$/, '') 
                : (booking.snooker_board_menu_items?.board_name?.replace(/\s+[A-Z0-9]+$/, '') || booking.snooker_board_id);
              
              const bookingDetails = {
                customerName: booking.customer_name,
                customerPhone: booking.customer_phno,
                boardName: boardName,
                boardId: booking.snooker_board_id,
                playersCount: booking.players_count || 1,
                orderDate: new Date(booking.created_at).toISOString().split('T')[0],
              };
              
              setBookingDetails(bookingDetails);
              setBookingOrderId(booking.snooker_order_id);
              setShowOrderSummary(true);
              setLoading(false);
              
              // Also save to client-side storage for future use
              setSessionData('snooker_bookingDetails', bookingDetails);
              setSessionData('snooker_bookingOrderId', booking.snooker_order_id);
              setSessionData('snooker_showOrderSummary', true);
              setSessionData('snooker_customerPhone', booking.customer_phno);
            } else {
              // No booking found on server, show form
              setShowOrderSummary(false);
              setLoading(false);
            }
          } else {
            // Error fetching, show form
            setShowOrderSummary(false);
            setLoading(false);
          }
        } catch (error) {
          console.error('Error fetching booking from server:', error);
          // On error, show form
          setShowOrderSummary(false);
          setLoading(false);
        }
      } else {
        // No phone number, show form
        setShowOrderSummary(false);
        setLoading(false);
      }
    };

    // Only restore if boards are loaded
    if (boards.length > 0 || loading === false) {
      restoreBookingData();
    }
  }, [boards, loading]);

  // Restore customer info from sessionStorage or 12-hour session storage (from workspace/food booking)
  useEffect(() => {
    // Always restore customer info when showing form (not order summary)
    // This ensures customer info is pre-filled when starting a new booking
    if (!showOrderSummary && !loading) {
      // Check 12-hour session storage first, then regular sessionStorage
      const savedName = getSessionData<string>('snooker_customerName') || 
                       getSessionData<string>('food_customerName') ||
                       sessionStorage.getItem('customerName');
      const savedPhone = getSessionData<string>('snooker_customerPhone') || 
                        getSessionData<string>('food_customerPhone') ||
                        sessionStorage.getItem('customerPhone');
      
      if (savedName) {
        setCustomerName(savedName);
      }
      if (savedPhone) {
        // Remove +91 prefix if present (for display in input field)
        const phoneWithoutPrefix = savedPhone.startsWith('+91') ? savedPhone.slice(3) : savedPhone;
        setCustomerPhone(phoneWithoutPrefix);
      }
    }
  }, [showOrderSummary, loading]);

  // Fetch boards from API
  useEffect(() => {
    const fetchBoards = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/boards');
        if (response.ok) {
          const data = await response.json();
          setBoards(data);
        } else {
          console.error('Failed to fetch boards');
        }
      } catch (error) {
        console.error('Error fetching boards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBoards();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!customerName.trim()) {
      alert('Please enter your good Name');
      return;
    }
    
    const phoneDigits = customerPhone.replace(/\D/g, '');
    if (!phoneDigits || phoneDigits.length !== 10) {
      alert('Please enter your Phone Number (exactly 10 digits)');
      return;
    }

    if (!selectedBoard) {
      alert('Please select a Gaming Table');
      return;
    }

    if (!playersCount || parseInt(playersCount) < 1) {
      alert('Please select at least 1 player');
      return;
    }

    setSubmitting(true);
    
    try {
      const phoneWithPrefix = `+91${phoneDigits}`;
      const response = await fetch('/api/snooker-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          customer_phno: phoneWithPrefix,
          snooker_board_id: selectedBoard,
          players_count: playersCount,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Get board name for display
        const selectedBoardObj = boards.find(b => b.snooker_board_id === selectedBoard);
        const boardName = selectedBoardObj ? selectedBoardObj.board_name.replace(/\s+[A-Z0-9]+$/, '') : selectedBoard;
        
        // Store booking details before resetting
        const bookingDetails = {
          customerName: customerName.trim(),
          customerPhone: phoneWithPrefix,
          boardName: boardName,
          boardId: selectedBoard,
          playersCount: parseInt(playersCount),
          orderDate: new Date().toISOString().split('T')[0],
        };
        
        setBookingOrderId(data.booking_id || data.booking?.snooker_order_id || data.snooker_order_id || '');
        setBookingDetails(bookingDetails);
        
        // Save to 12-hour session storage for persistence across refreshes
        const orderId = data.booking_id || data.booking?.snooker_order_id || data.snooker_order_id || '';
        setSessionData('snooker_bookingDetails', bookingDetails);
        setSessionData('snooker_bookingOrderId', orderId);
        setSessionData('snooker_showOrderSummary', true);
        setSessionData('snooker_customerPhone', phoneWithPrefix);
        
        // Also save to sessionStorage for compatibility
        sessionStorage.setItem('customerName', customerName.trim());
        sessionStorage.setItem('customerPhone', phoneWithPrefix);
        
        // Reset form
        setCustomerName('');
        setCustomerPhone('');
        setSelectedBoard('');
        setPlayersCount('');
        // Show success dialog
        setShowBookingSuccessDialog(true);
      } else {
        alert(data.error || 'Failed to submit booking. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting booking:', error);
      alert('Failed to submit booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <main className="min-h-screen gradient-soft flex flex-col items-center w-full overflow-x-hidden">
      {/* Header with Banner Background - Same as /book-order */}
      <div className="w-full md:max-w-2xl lg:max-w-3xl shadow-soft-lg sticky top-0 z-10 relative overflow-hidden gradient-primary rounded-b-xl sm:rounded-b-2xl mb-3 sm:mb-4">
        {/* Content Layer with Banner Background */}
        <div 
          className="relative z-10 w-full px-4 py-4 sm:px-6 sm:py-8 md:py-10"
          style={{
            backgroundImage: 'url(/Menu_Header_OR_Footer_BG.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            minHeight: '20vh',
          }}
        >
          {/* Fogged Glossy Overlay - Extremely light tint */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/8 via-accent-500/5 to-primary-500/8"></div>
          
          {/* Shiny Glass Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent"></div>
          
          {/* Content positioned above screen midline */}
          <div className="absolute inset-0 flex items-center justify-center transform -translate-y-12">
            <div className="text-center relative z-10">
              {/* Coffee Cup Icon */}
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-white/40 backdrop-blur-md mb-3 sm:mb-4 mt-16 sm:mt-18 md:mt-20 shadow-soft-lg">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {/* Coffee cup body */}
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9v8c0 1.657 1.343 3 3 3h8c1.657 0 3-1.343 3-3v-2" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 9h1a3 3 0 013 3v1a3 3 0 01-3 3h-1" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 9h12V7c0-1.105-.895-2-2-2H7c-1.105 0-2 .895-2 2v2z" />
                  {/* Steam lines */}
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 5V3" opacity="0.7" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5V2" opacity="0.7" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 5V3" opacity="0.7" />
                </svg>
              </div>
              
              {/* Brand Name */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white drop-shadow-2xl mb-2 sm:mb-3" style={{ fontFamily: 'cursive', textShadow: '0 4px 8px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)' }}>
                SocialX <span className="italic font-black" style={{ fontFamily: 'Georgia, serif', fontWeight: 900 }}>Hub</span>
              </h1>
            </div>
          </div>
          
          {/* Decorative circles with animation */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/15 backdrop-blur-sm animate-pulse z-10"></div>
          <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/15 backdrop-blur-sm animate-pulse z-10" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>

      {/* "Will ReOpen Shortly" Banner - When feature is disabled */}
      {!isFeatureEnabled && !featureVisibilityLoading && (
        <div className="w-full md:max-w-2xl lg:max-w-3xl px-4 md:px-6 mb-4 relative z-[100]">
          <div className="relative overflow-hidden rounded-2xl shadow-2xl">
            {/* Animated gradient background */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite]"
              style={{
                animation: 'shimmer 3s ease-in-out infinite',
              }}
            ></div>
            {/* Waving text effect */}
            <div className="relative px-6 py-4 text-center">
              <h2 className="text-2xl md:text-3xl font-black text-white drop-shadow-2xl animate-pulse" style={{
                textShadow: '0 4px 8px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)',
                animation: 'wave 2s ease-in-out infinite',
              }}>
                Will ReOpen Shortly
              </h2>
            </div>
          </div>
          <style jsx>{`
            @keyframes shimmer {
              0%, 100% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
            }
            @keyframes wave {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-5px); }
            }
          `}</style>
        </div>
      )}

      {/* Grey Out Overlay - When feature is disabled */}
      {!isFeatureEnabled && !featureVisibilityLoading && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[99] pointer-events-none"></div>
      )}

      {/* Content Container */}
      {!showOrderSummary && (
      <div className={`flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-8 w-full mt-4 sm:mt-6 md:mt-8 ${!isFeatureEnabled && !featureVisibilityLoading ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
        <div className="w-full md:max-w-2xl lg:max-w-3xl px-3 sm:px-0 md:px-4 lg:px-6">
          {/* Booking Form Card - Same style as order-menu */}
          <div className="relative group mb-6 sm:mb-8">
            {/* Glowing border effect */}
            <div className="absolute -inset-0.5 gradient-primary rounded-[24px] sm:rounded-[28px] opacity-75 group-hover:opacity-100 blur-sm transition duration-500"></div>

            {/* Main card */}
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-soft-xl transform hover:scale-[1.02] transition-all duration-500">
              {/* Glass-morphism background */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-orange-50/80 backdrop-blur-xl"></div>
              
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              {/* Content */}
              <div className="relative z-10 p-6 sm:p-8 md:p-10">
                {/* Form Header */}
                <div className="text-center mb-6 sm:mb-8">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text">
                    <span className="block sm:inline">Book</span>
                    <span className="block sm:inline sm:ml-1">Snooker/Pool Table</span>
                  </h2>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  {/* Name Input */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group/input">
                      {/* Elite border frame */}
                      <div className="absolute -inset-px bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400 rounded-xl opacity-0 group-hover/input:opacity-100 transition duration-300"></div>
                      
                      <input
                        type="text"
                        id="name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Please enter your name"
                        className="relative w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-white/90 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:outline-none focus:border-primary-400 text-base sm:text-base transition-all hover:border-primary-300 hover:bg-white shadow-sm font-medium"
                        style={{ fontSize: '16px' }}
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Phone Number Input */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group/input">
                      {/* Elite border frame */}
                      <div className="absolute -inset-px bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400 rounded-xl opacity-0 group-hover/input:opacity-100 transition duration-300"></div>
                      
                      {/* Phone prefix */}
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                        <span className="text-base font-medium text-gray-700">+91</span>
                      </div>
                      
                      <input
                        type="tel"
                        id="phone"
                        value={customerPhone}
                        onChange={(e) => {
                          // Only allow numbers, max 10 digits
                          const numericValue = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setCustomerPhone(numericValue);
                        }}
                        placeholder="Enter 10 digit phone number"
                        className="relative w-full pl-14 sm:pl-16 pr-4 sm:pr-5 py-3 sm:py-3.5 bg-white/90 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:outline-none focus:border-primary-400 text-base sm:text-base transition-all hover:border-primary-300 hover:bg-white shadow-sm font-medium"
                        style={{ fontSize: '16px' }}
                        inputMode="numeric"
                        pattern="[0-9]{10}"
                        required
                        minLength={10}
                        maxLength={10}
                      />
                    </div>
                  </div>
          
                  {/* Snooker Table Dropdown */}
                  <div>
                    <label htmlFor="board" className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Table <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group/input">
                      {/* Elite border frame */}
                      <div className="absolute -inset-px bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400 rounded-xl opacity-0 group-hover/input:opacity-100 transition duration-300"></div>
                      
                      <select
                        id="board"
                        value={selectedBoard}
                        onChange={(e) => setSelectedBoard(e.target.value)}
                        className="relative w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-white/90 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:outline-none focus:border-primary-400 text-base sm:text-base transition-all hover:border-primary-300 hover:bg-white shadow-sm font-medium"
                        style={{ fontSize: '16px' }}
                        required
                        disabled={loading}
                      >
                        <option value="">Select a Gaming Table</option>
                        {boards.map((board) => {
                          // Calculate hourly price based on type
                          // Pool Table: 300/hr, French Table: 400/hr
                          const hourlyPrice = board.type === 'Pool-Table' ? 300 : 400;
                          // Remove trailing numbers and letters from board name for display
                          const displayName = board.board_name.replace(/\s+[A-Z0-9]+$/, '');
                          return (
                            <option 
                              key={board.snooker_board_id} 
                              value={board.snooker_board_id}
                            >
                              {displayName} - ₹{hourlyPrice}/hr
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    {loading && (
                      <p className="text-xs text-gray-500 mt-1.5">Loading boards...</p>
                    )}
                  </div>

                  {/* Players Count Dropdown */}
                  <div>
                    <label htmlFor="players" className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Players Count <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group/input">
                      {/* Elite border frame */}
                      <div className="absolute -inset-px bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400 rounded-xl opacity-0 group-hover/input:opacity-100 transition duration-300"></div>
                      
                      <select
                        id="players"
                        value={playersCount}
                        onChange={(e) => setPlayersCount(e.target.value)}
                        className="relative w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-white/90 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:outline-none focus:border-primary-400 text-base sm:text-base transition-all hover:border-primary-300 hover:bg-white shadow-sm font-medium"
                        style={{ fontSize: '16px' }}
                        required
                      >
                        <option value="">Select Players Count (Minimum 1)</option>
                        {[1, 2, 3, 4].map((count) => (
                          <option key={count} value={count.toString()}>
                            {count}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Submit Button - Same style as "Click for Menu" */}
          <button
                    type="submit"
                    disabled={submitting || loading || !isFeatureEnabled}
                    className="relative w-full group/btn transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {/* Elite outer border */}
                    <div className="absolute -inset-px bg-gradient-to-r from-primary-400/60 via-accent-400/60 to-primary-400/60 rounded-lg opacity-100 group-hover/btn:opacity-100 transition duration-300 blur-[0.5px]"></div>
                    
                    {/* Inner button */}
                    <div className="relative py-2.5 sm:py-3 px-4 sm:px-5 rounded-lg overflow-hidden backdrop-blur-md">
                      {/* Shiny transparent gradient background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/70 via-accent-500/70 to-primary-500/70 bg-[length:200%_100%] group-hover/btn:bg-[position:100%_0] transition-all duration-500"></div>
                      
                      {/* Glass shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent"></div>
                      
                      {/* Animated shine sweep */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                      
                      {/* Button content */}
                      <span className="relative flex items-center justify-center gap-2 text-white drop-shadow-lg">
                        <span className="text-sm sm:text-base font-bold">
                          {submitting ? 'Submitting...' : 'Submit'}
                        </span>
                        <span className="text-lg sm:text-xl group-hover/btn:rotate-12 transition-transform duration-300">🎱</span>
                      </span>
                    </div>
                  </button>
                </form>

                {/* Decorative corner accents */}
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4 w-6 h-6 sm:w-8 sm:h-8 border-t-2 border-l-2 border-primary-300 rounded-tl-2xl opacity-50"></div>
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-6 h-6 sm:w-8 sm:h-8 border-t-2 border-r-2 border-accent-300 rounded-tr-2xl opacity-50"></div>
                <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 w-6 h-6 sm:w-8 sm:h-8 border-b-2 border-l-2 border-primary-300 rounded-bl-2xl opacity-50"></div>
                <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 w-6 h-6 sm:w-8 sm:h-8 border-b-2 border-r-2 border-accent-300 rounded-br-2xl opacity-50"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Snooker Order Summary Card */}
      {showOrderSummary && bookingDetails && (
        <div className={`flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-8 w-full mt-4 sm:mt-6 md:mt-8 ${!isFeatureEnabled && !featureVisibilityLoading ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
          <div className="w-full md:max-w-2xl lg:max-w-3xl px-3 sm:px-0 md:px-4 lg:px-6">
          <div className="relative group">
            {/* Glowing border effect */}
            <div className="absolute -inset-0.5 gradient-primary rounded-[28px] opacity-75 blur-md"></div>
            
            {/* Main card with glass-morphism */}
            <div className="relative rounded-3xl overflow-hidden shadow-soft-xl flex flex-col">
              {/* Glass background */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-blue-50/80 backdrop-blur-xl"></div>
              
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent"></div>
              
              {/* Content */}
              <div className="relative z-10 flex flex-col">
                {/* Header Section */}
                <div className="flex-shrink-0 p-4 sm:p-6 pb-0">
                  {/* Header: Tick Mark + Name + Booking ID */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-500 shadow-soft-lg flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-transparent bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text">
                          {bookingDetails.customerName}
                        </h2>
                        <p className="text-xs font-semibold text-gray-600 mt-0.5">Booking ID: {bookingOrderId.slice(0, 8)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Status</p>
                      <p className="text-lg font-bold text-green-600">Received</p>
                    </div>
                  </div>

                  {/* Booking Message */}
                  <div className="mb-4">
                    <div className="space-y-2">
                      <p className="text-base font-bold text-gray-800">
                        Snooker booking is confirmed
                      </p>
                      <p className="text-sm font-semibold text-gray-700 leading-relaxed">
                        Thank you for booking Snooker Table, kindly collect Cue sticks from the counter.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Booking Details List */}
                <div className="px-4 sm:px-6 max-h-[35vh] sm:max-h-[40vh] md:max-h-[45vh] overflow-y-auto">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Booking Details</h3>
                  <div className="space-y-2 pb-4">
                    <div className="relative group/item rounded-2xl overflow-hidden">
                      <div className="bg-gradient-to-br from-white via-white to-blue-50/60 p-4 border border-blue-100 shadow-sm">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-700">Customer Name:</span>
                            <span className="text-sm font-bold text-gray-800">{bookingDetails.customerName}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-700">Contact:</span>
                            <span className="text-sm font-bold text-gray-800">{bookingDetails.customerPhone}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-700">Gaming Table:</span>
                            <span className="text-sm font-bold text-gray-800">{bookingDetails.boardName}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-700">Players Count:</span>
                            <span className="text-sm font-bold text-gray-800">{bookingDetails.playersCount}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-700">Order Date:</span>
                            <span className="text-sm font-bold text-gray-800">{bookingDetails.orderDate}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fixed Bottom Section */}
                <div className="p-4 sm:p-6 pt-3 sm:pt-4 border-t border-blue-100 bg-white/50">
                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3">
                    {/* Book Another Snooker Button */}
                    <button
                      onClick={() => {
                        // Clear booking data and show form with pre-filled customer info
                        setShowOrderSummary(false);
                        setBookingOrderId('');
                        setBookingDetails(null);
                        
                        // Clear 12-hour session storage
                        removeSessionData('snooker_bookingDetails');
                        removeSessionData('snooker_bookingOrderId');
                        removeSessionData('snooker_showOrderSummary');
                        
                        // Keep customer info for pre-filling
                        if (bookingDetails) {
                          const phoneWithoutPrefix = bookingDetails.customerPhone.startsWith('+91') 
                            ? bookingDetails.customerPhone.slice(3) 
                            : bookingDetails.customerPhone;
                          setCustomerName(bookingDetails.customerName);
                          setCustomerPhone(phoneWithoutPrefix);
                        }
                      }}
                      className="relative w-full py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl font-bold transition-all shadow-soft hover:shadow-soft-lg active:scale-95 overflow-hidden group/btn"
                    >
                      <div className="absolute inset-0 gradient-primary"></div>
                      <span className="relative z-10 text-white">Book Another Snooker</span>
                    </button>

                    {/* Order Food Button */}
                    <button
                      onClick={() => {
                        // Store customer name and phone in sessionStorage
                        if (bookingDetails) {
                          sessionStorage.setItem('customerName', bookingDetails.customerName);
                          sessionStorage.setItem('customerPhone', bookingDetails.customerPhone);
                          // Set flag to indicate user came from booking page (for discount eligibility)
                          sessionStorage.setItem('fromBookingPage', 'true');
                        }
                        router.push('/order-menu');
                      }}
                      className="relative w-full py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl font-bold transition-all shadow-soft hover:shadow-soft-lg active:scale-95 overflow-hidden group/btn"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600"></div>
                      <span className="relative z-10 text-white">Order Food</span>
                    </button>

                    {/* Reserve WorkSpace Button */}
                    <button
                      onClick={() => {
                        // Store customer info for workspace booking
                        if (bookingDetails) {
                          sessionStorage.setItem('customerName', bookingDetails.customerName);
                          sessionStorage.setItem('customerPhone', bookingDetails.customerPhone);
                        }
                        router.push('/book-workspace');
                      }}
                      className="relative w-full py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl font-bold transition-all shadow-soft hover:shadow-soft-lg active:scale-95 overflow-hidden group/btn"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600"></div>
                      <span className="relative z-10 text-white">Reserve WorkSpace</span>
                    </button>

                    {/* Home Button */}
                    <button
                      onClick={() => {
                        router.push('/book-order');
                      }}
                      className="relative w-full py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl font-bold transition-all shadow-soft hover:shadow-soft-lg active:scale-95 overflow-hidden group/btn"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-700"></div>
                      <span className="relative z-10 text-white">Home</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* Footer - Subtle Bottom Banner */}
      <footer className="w-full mt-auto">
        <div className="w-full bg-white/60 backdrop-blur-sm border-t border-gray-200/50 py-2 shadow-sm">
          <p className="text-xs text-gray-500 text-center">
            Tech Powered by{' '}
            <a
              href="https://www.devtechai.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-500 hover:text-primary-600 font-semibold underline"
            >
              DevTechAi.Org
            </a>
          </p>
        </div>
      </footer>

      {/* Booking Success Dialog Popup */}
      {showBookingSuccessDialog && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-300"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={(e) => {
            // Close when clicking outside
            if (e.target === e.currentTarget) {
              setShowBookingSuccessDialog(false);
              setShowOrderSummary(true);
              setSessionData('snooker_showOrderSummary', true);
            }
          }}
        >
          <div 
            className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full transform transition-all animate-in zoom-in-95 duration-300"
          >
            {/* Close Button - Red X */}
            <button
              onClick={() => {
                setShowBookingSuccessDialog(false);
                setShowOrderSummary(true);
                setSessionData('snooker_showOrderSummary', true);
              }}
              className="absolute top-4 right-4 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full p-1.5 transition-all"
              aria-label="Close"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Message Content */}
            <div className="pr-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                🎉 Booking Confirmed!
              </h3>
              <div className="space-y-2">
                <p className="text-base font-bold text-gray-800">
                  Thank you for booking Snooker Table, kindly collect Cue sticks from the counter.
                </p>
              </div>
            </div>

            {/* Close Button at Bottom */}
            <button
              onClick={() => {
                setShowBookingSuccessDialog(false);
                setShowOrderSummary(true);
                setSessionData('snooker_showOrderSummary', true);
              }}
              className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Close
          </button>
        </div>
      </div>
      )}
    </main>
  );
}

