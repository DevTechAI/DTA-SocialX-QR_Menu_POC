'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type WorkspaceSeat = {
  workspace_seat_id: string;
  workspace_seat_value: number;
};

export default function BookWorkspacePage() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedSeatId, setSelectedSeatId] = useState('');
  const [seatsCount, setSeatsCount] = useState('1');
  const [customSeatsCount, setCustomSeatsCount] = useState('');
  const [workspaceSeats, setWorkspaceSeats] = useState<WorkspaceSeat[]>([]);
  const [seatValue, setSeatValue] = useState<number>(0);
  const [amount, setAmount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showBookingSuccessDialog, setShowBookingSuccessDialog] = useState(false);
  const [bookingAmount, setBookingAmount] = useState<number>(0);
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [bookingOrderId, setBookingOrderId] = useState<string>('');
  const [bookingDetails, setBookingDetails] = useState<{
    customerName: string;
    customerPhone: string;
    seatsCount: number;
    workspaceSeatId: string;
    orderDate: string;
  } | null>(null);

  // Fetch workspace seats from API
  useEffect(() => {
    const fetchWorkspaceSeats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/workspace-seats');
        if (response.ok) {
          const data = await response.json();
          setWorkspaceSeats(data);
          
          // If only one seat found, default select it
          if (data.length === 1) {
            setSelectedSeatId(data[0].workspace_seat_id);
            setSeatValue(data[0].workspace_seat_value);
          }
        } else {
          console.error('Failed to fetch workspace seats');
        }
      } catch (error) {
        console.error('Error fetching workspace seats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaceSeats();
  }, []);

  // Update amount when seat or count changes
  useEffect(() => {
    if (selectedSeatId && seatValue) {
      const count = seatsCount === 'custom' ? parseInt(customSeatsCount) || 0 : parseInt(seatsCount) || 0;
      setAmount(count * seatValue);
    } else {
      setAmount(0);
    }
  }, [selectedSeatId, seatValue, seatsCount, customSeatsCount]);

  // Update seat value when selected seat changes
  useEffect(() => {
    if (selectedSeatId) {
      const selectedSeat = workspaceSeats.find(seat => seat.workspace_seat_id === selectedSeatId);
      if (selectedSeat) {
        setSeatValue(selectedSeat.workspace_seat_value);
      }
    }
  }, [selectedSeatId, workspaceSeats]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!customerName.trim()) {
      alert('Please enter your name');
      return;
    }
    
    const phoneDigits = customerPhone.replace(/\D/g, '');
    if (!phoneDigits || phoneDigits.length !== 10) {
      alert('Please enter your Phone Number (exactly 10 digits)');
      return;
    }

    if (!selectedSeatId) {
      alert('Please select a workspace seat');
      return;
    }

    const finalSeatsCount = seatsCount === 'custom' ? parseInt(customSeatsCount) : parseInt(seatsCount);
    if (!finalSeatsCount || finalSeatsCount < 1) {
      alert('Please select at least 1 seat');
      return;
    }

    if (seatsCount === 'custom' && (!customSeatsCount || parseInt(customSeatsCount) < 1 || parseInt(customSeatsCount) > 50)) {
      alert('Please enter a valid seat count (1-50)');
      return;
    }

    setSubmitting(true);
    
    try {
      const phoneWithPrefix = `+91${phoneDigits}`;
      const response = await fetch('/api/workspace-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          customer_phno: phoneWithPrefix,
          workspace_seat_id: selectedSeatId,
          seats_count: finalSeatsCount.toString(),
          total_order_value: amount,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store booking details before resetting
        setBookingAmount(amount);
        setBookingOrderId(data.workspace_order_id || '');
        setBookingDetails({
          customerName: customerName.trim(),
          customerPhone: phoneWithPrefix,
          seatsCount: finalSeatsCount,
          workspaceSeatId: selectedSeatId,
          orderDate: new Date().toISOString().split('T')[0],
        });
        // Reset form
        setCustomerName('');
        setCustomerPhone('');
        setSelectedSeatId(workspaceSeats.length === 1 ? workspaceSeats[0].workspace_seat_id : '');
        setSeatsCount('1');
        setCustomSeatsCount('');
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
                <svg className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:w-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

      {/* Content Container */}
      {!showOrderSummary && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-8 w-full mt-4 sm:mt-6 md:mt-8">
          <div className="w-full md:max-w-2xl lg:max-w-3xl px-3 sm:px-0 md:px-4 lg:px-6">
            {/* Booking Form Card - Same style as snooker booking */}
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
              <div className="relative z-10 p-6 sm:p-8 md:p-10 -mt-2.5 sm:-mt-3.5 md:-mt-5">
                {/* Form Header */}
                <div className="text-center mb-6 sm:mb-8">
                  <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-transparent bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text leading-tight">
                    Reserve Workspace
                  </h2>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  {/* Name Input */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    <label htmlFor="name" className="text-sm font-semibold text-gray-700 whitespace-nowrap flex-shrink-0 min-w-[80px] sm:min-w-[100px]">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group/input flex-1">
                      {/* Elite border frame */}
                      <div className="absolute -inset-px bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400 rounded-xl opacity-0 group-hover/input:opacity-100 transition duration-300"></div>
                      
                      <input
                        type="text"
                        id="name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="enter your name"
                        className="relative w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white/90 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:outline-none focus:border-primary-400 text-sm sm:text-base transition-all hover:border-primary-300 hover:bg-white shadow-sm font-medium text-center"
                        style={{ fontSize: '16px' }}
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Phone Number Input */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    <label htmlFor="phone" className="text-sm font-semibold text-gray-700 whitespace-nowrap flex-shrink-0 min-w-[80px] sm:min-w-[100px]">
                      Contact <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group/input flex-1">
                      {/* Elite border frame */}
                      <div className="absolute -inset-px bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400 rounded-xl opacity-0 group-hover/input:opacity-100 transition duration-300"></div>
                      
                      {/* Phone prefix */}
                      <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                        <span className="text-sm sm:text-base font-medium text-gray-700">+91</span>
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
                        placeholder="enter ph number"
                        className="relative w-full pl-12 sm:pl-14 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-white/90 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:outline-none focus:border-primary-400 text-sm sm:text-base transition-all hover:border-primary-300 hover:bg-white shadow-sm font-medium text-center"
                        style={{ fontSize: '16px' }}
                        inputMode="numeric"
                        pattern="[0-9]{10}"
                        required
                        minLength={10}
                        maxLength={10}
                      />
                    </div>
                  </div>

                  {/* Workspace Seat Selection (if multiple seats available) */}
                  {workspaceSeats.length > 1 && (
                    <div className="flex items-center gap-3 sm:gap-4">
                      <label htmlFor="workspaceSeat" className="text-sm font-semibold text-gray-700 whitespace-nowrap flex-shrink-0 min-w-[80px] sm:min-w-[100px]">
                        Workspace Seat <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group/input flex-1">
                        {/* Elite border frame */}
                        <div className="absolute -inset-px bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400 rounded-xl opacity-0 group-hover/input:opacity-100 transition duration-300"></div>
                        
                        <select
                          id="workspaceSeat"
                          value={selectedSeatId}
                          onChange={(e) => setSelectedSeatId(e.target.value)}
                          className="relative w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white/90 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:outline-none focus:border-primary-400 text-sm sm:text-base transition-all hover:border-primary-300 hover:bg-white shadow-sm font-medium text-center"
                          style={{ fontSize: '16px' }}
                          required
                          disabled={loading}
                        >
                          <option value="">Select Workspace Seat</option>
                          {workspaceSeats.map((seat) => (
                            <option key={seat.workspace_seat_id} value={seat.workspace_seat_id}>
                              {seat.workspace_seat_id} - ₹{seat.workspace_seat_value}/day
                            </option>
                          ))}
                        </select>
                      </div>
                      {loading && (
                        <p className="text-xs text-gray-500">Loading seats...</p>
                      )}
                    </div>
                  )}

                  {/* Seat(s) Count Dropdown */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    <label htmlFor="seats" className="text-sm font-semibold text-gray-700 whitespace-nowrap flex-shrink-0 min-w-[80px] sm:min-w-[100px]">
                      No. Seats: <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group/input flex-1">
                      {/* Elite border frame */}
                      <div className="absolute -inset-px bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400 rounded-xl opacity-0 group-hover/input:opacity-100 transition duration-300"></div>
                      
                      <select
                        id="seats"
                        value={seatsCount}
                        onChange={(e) => setSeatsCount(e.target.value)}
                        className="relative w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white/90 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:outline-none focus:border-primary-400 text-sm sm:text-base transition-all hover:border-primary-300 hover:bg-white shadow-sm font-medium text-center"
                        style={{ fontSize: '16px' }}
                        required
                      >
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                  </div>

                  {/* Custom Seats Count Input (shown when "Custom" is selected) */}
                  {seatsCount === 'custom' && (
                    <div className="flex items-center gap-3 sm:gap-4">
                      <label htmlFor="customSeats" className="text-sm font-semibold text-gray-700 whitespace-nowrap flex-shrink-0 min-w-[80px] sm:min-w-[100px]">
                        Enter Seat Count (Max 50) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group/input flex-1">
                        {/* Elite border frame */}
                        <div className="absolute -inset-px bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400 rounded-xl opacity-0 group-hover/input:opacity-100 transition duration-300"></div>
                        
                        <input
                          type="number"
                          id="customSeats"
                          value={customSeatsCount}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 50)) {
                              setCustomSeatsCount(value);
                            }
                          }}
                          placeholder="Enter number of seats (1-50)"
                          className="relative w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white/90 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:outline-none focus:border-primary-400 text-sm sm:text-base transition-all hover:border-primary-300 hover:bg-white shadow-sm font-medium text-center"
                          style={{ fontSize: '16px' }}
                          min={1}
                          max={50}
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Amount Display (Auto-populated) */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    <label htmlFor="amount" className="text-sm font-semibold text-gray-700 whitespace-nowrap flex-shrink-0 min-w-[80px] sm:min-w-[100px]">
                      Amount
                    </label>
                    <div className="relative group/input flex-1">
                      {/* Elite border frame */}
                      <div className="absolute -inset-px bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400 rounded-xl opacity-0 group-hover/input:opacity-100 transition duration-300"></div>
                      
                      <input
                        type="text"
                        id="amount"
                        value={amount > 0 ? `₹${amount}` : '₹0'}
                        readOnly
                        className="relative w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-100/90 backdrop-blur-sm border border-gray-300/50 rounded-xl text-sm sm:text-base font-medium cursor-not-allowed"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                  </div>

                  {/* Submit Button - Same style as snooker form */}
                  <div className="flex justify-center mt-4 sm:mt-5">
                    <button
                      type="submit"
                      disabled={submitting || loading}
                      className="relative inline-block group/btn transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {/* Elite outer border */}
                      <div className="absolute -inset-px bg-gradient-to-r from-primary-400/60 via-accent-400/60 to-primary-400/60 rounded-lg opacity-100 group-hover/btn:opacity-100 transition duration-300 blur-[0.5px]"></div>
                      
                      {/* Inner button */}
                      <div className="relative py-2 sm:py-2.5 px-[1.1rem] sm:px-[1.375rem] rounded-lg overflow-hidden backdrop-blur-md">
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
                          <span className="text-lg sm:text-xl group-hover/btn:rotate-12 transition-transform duration-300">🧑‍💻</span>
                        </span>
                      </div>
                    </button>
                  </div>
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

      {/* Workspace Order Summary Card */}
      {showOrderSummary && bookingDetails && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-8 w-full mt-4 sm:mt-6 md:mt-8">
          <div className="w-full md:max-w-2xl lg:max-w-3xl px-3 sm:px-0 md:px-4 lg:px-6">
          <div className="relative group">
            {/* Glowing border effect */}
            <div className="absolute -inset-0.5 gradient-primary rounded-[28px] opacity-75 blur-md"></div>
            
            {/* Main card with glass-morphism */}
            <div className="relative rounded-3xl overflow-hidden shadow-soft-xl flex flex-col">
              {/* Glass background */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-green-50/80 backdrop-blur-xl"></div>
              
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
                          {bookingDetails.customerName}&apos;s Booking
                        </h2>
                        <p className="text-xs font-semibold text-gray-600 mt-0.5">Booking ID: {bookingOrderId.slice(0, 8)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Status</p>
                      <p className="text-sm font-bold text-green-600">Confirmed</p>
                    </div>
                  </div>

                  {/* Status Section */}
                  <div className="mb-4">
                    <div className="bg-gradient-to-br from-green-50 via-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-700">WorkSpace Booking Status</span>
                        <span className="text-lg font-bold text-green-600">Received</span>
                      </div>
                    </div>
                  </div>

                  {/* Booking Message */}
                  <div className="mb-4">
                    <div className="space-y-2">
                      <p className="text-base font-bold text-gray-800">
                        Workspace booking is confirmed
                      </p>
                      <p className="text-sm font-semibold text-gray-700 leading-relaxed">
                        Please pay ₹{bookingAmount} and collect your day pass from the counter.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Booking Details List */}
                <div className="px-4 sm:px-6 max-h-[35vh] sm:max-h-[40vh] md:max-h-[45vh] overflow-y-auto">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Booking Details</h3>
                  <div className="space-y-2 pb-4">
                    <div className="relative group/item rounded-2xl overflow-hidden">
                      <div className="bg-gradient-to-br from-white via-white to-green-50/60 p-4 border border-green-100 shadow-sm">
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
                             <span className="text-sm font-semibold text-gray-700">Seats Count:</span>
                             <span className="text-sm font-bold text-gray-800">{bookingDetails.seatsCount}</span>
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
                <div className="p-4 sm:p-6 pt-3 sm:pt-4 border-t border-green-100 bg-white/50">
                  {/* Total Amount */}
                  <div className="bg-gradient-to-br from-green-50 via-green-50 to-emerald-50 rounded-2xl p-4 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-800">Total Amount</span>
                      <span className="text-2xl font-bold text-green-600">₹{bookingAmount}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Order Food Button */}
                    <button
                      onClick={() => {
                        // Store customer name and phone in sessionStorage
                        if (bookingDetails) {
                          sessionStorage.setItem('customerName', bookingDetails.customerName);
                          sessionStorage.setItem('customerPhone', bookingDetails.customerPhone);
                        }
                        router.push('/order-menu');
                      }}
                      className="relative w-full py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl font-bold transition-all shadow-soft hover:shadow-soft-lg active:scale-95 overflow-hidden group/btn"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600"></div>
                      <span className="relative z-10 text-white flex flex-col items-center">
                        <span>Order Food</span>
                        <span className="text-xs sm:text-sm font-bold opacity-95 mt-0.5">(10% off on Day-Pass)</span>
                      </span>
                    </button>

                    {/* Book Another Workspace Button */}
                    <button
                      onClick={() => {
                        setShowOrderSummary(false);
                        setBookingAmount(0);
                        setBookingOrderId('');
                        setBookingDetails(null);
                        router.push('/book-order');
                      }}
                      className="relative w-full py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl font-bold transition-all shadow-soft hover:shadow-soft-lg active:scale-95 overflow-hidden group/btn"
                    >
                      <div className="absolute inset-0 gradient-primary"></div>
                      <span className="relative z-10 text-white">Book Another Workspace</span>
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
                  Your booking is confirmed! Please pay ₹{bookingAmount} and collect your day pass from the counter.
                </p>
              </div>
            </div>

            {/* Close Button at Bottom */}
            <button
              onClick={() => {
                setShowBookingSuccessDialog(false);
                setShowOrderSummary(true);
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

