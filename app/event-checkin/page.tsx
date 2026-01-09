'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { setSessionData, getSessionData } from '@/lib/utils/sessionStorage';

type Event = {
  event_uuid: string;
  event_name: string;
  event_datetime: string;
  event_organiser_name: string;
  event_organiser_ph: string;
};

export default function EventCheckInPage() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedEventUuid, setSelectedEventUuid] = useState('');
  const [wantUpdates, setWantUpdates] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [checkInDetails, setCheckInDetails] = useState<{
    attendeeName: string;
    eventName: string;
    checkInTime: string;
  } | null>(null);

  // Fetch events from API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/events');
        if (response.ok) {
          const data = await response.json();
          setEvents(data);
        } else {
          console.error('Failed to fetch events');
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Pre-fill customer info from session storage
  useEffect(() => {
    if (!showSuccessScreen) {
      const savedName = getSessionData<string>('food_customerName') ||
                       getSessionData<string>('snooker_customerName') ||
                       getSessionData<string>('workspace_customerName') ||
                       sessionStorage.getItem('customerName');
      const savedPhone = getSessionData<string>('food_customerPhone') ||
                        getSessionData<string>('snooker_customerPhone') ||
                        getSessionData<string>('workspace_customerPhone') ||
                        sessionStorage.getItem('customerPhone');
      
      if (savedName && savedName !== 'Guest') {
        setCustomerName(savedName);
      }
      if (savedPhone) {
        const phoneWithoutPrefix = savedPhone.startsWith('+91') ? savedPhone.slice(3) : savedPhone;
        setCustomerPhone(phoneWithoutPrefix);
      }
    }
  }, [showSuccessScreen]);

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

    if (!selectedEventUuid) {
      alert('Please select an Event');
      return;
    }

    setSubmitting(true);
    
    try {
      const phoneWithPrefix = `+91${phoneDigits}`;
      const response = await fetch('/api/event-checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_uuid: selectedEventUuid,
          attendee_name: customerName.trim(),
          attendee_phno: phoneWithPrefix,
          notify_future_events: wantUpdates,
        }),
      });

      const data = await response.json();

      if (response.ok || response.status === 200) {
        // Format check-in time
        const checkInDate = new Date(data.check_in_time);
        const checkInTimeFormatted = checkInDate.toLocaleString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });

        setCheckInDetails({
          attendeeName: data.attendee_name || customerName.trim(),
          eventName: data.event_name,
          checkInTime: checkInTimeFormatted,
        });

        // Save to session storage
        setSessionData('event_customerName', customerName.trim());
        setSessionData('event_customerPhone', phoneWithPrefix);
        sessionStorage.setItem('customerName', customerName.trim());
        sessionStorage.setItem('customerPhone', phoneWithPrefix);

        // Show success screen
        setShowSuccessScreen(true);
      } else {
        alert(data.error || 'Failed to check in. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting check-in:', error);
      alert('Failed to check in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen gradient-soft flex flex-col items-center w-full overflow-x-hidden">
      {/* Header with Banner Background - Same as other pages */}
      <div className="w-full md:max-w-2xl lg:max-w-3xl shadow-soft-lg sticky top-0 z-10 relative overflow-hidden gradient-primary rounded-b-xl sm:rounded-b-2xl mb-3 sm:mb-4">
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
          {/* Fogged Glossy Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/8 via-accent-500/5 to-primary-500/8"></div>
          
          {/* Shiny Glass Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent"></div>
          
          {/* Content positioned above screen midline */}
          <div className="absolute inset-0 flex items-center justify-center transform -translate-y-12">
            <div className="text-center relative z-10">
              {/* Coffee Cup Icon */}
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-white/40 backdrop-blur-md mb-3 sm:mb-4 mt-16 sm:mt-18 md:mt-20 shadow-soft-lg">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9v8c0 1.657 1.343 3 3 3h8c1.657 0 3-1.343 3-3v-2" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 9h1a3 3 0 013 3v1a3 3 0 01-3 3h-1" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 9h12V7c0-1.105-.895-2-2-2H7c-1.105 0-2 .895-2 2v2z" />
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
          
          {/* Decorative circles */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/15 backdrop-blur-sm animate-pulse z-10"></div>
          <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/15 backdrop-blur-sm animate-pulse z-10" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>

      {/* Content Container */}
      {!showSuccessScreen ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-8 w-full mt-4 sm:mt-6 md:mt-8">
          <div className="w-full md:max-w-2xl lg:max-w-3xl px-3 sm:px-0 md:px-4 lg:px-6">
            {/* Registration Form Card */}
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
                      Event Check-In
                    </h2>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    {/* Name Input */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group/input">
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
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group/input">
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

                    {/* Event Dropdown */}
                    <div>
                      <label htmlFor="event" className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Event <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group/input">
                        <div className="absolute -inset-px bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400 rounded-xl opacity-0 group-hover/input:opacity-100 transition duration-300"></div>
                        
                        <select
                          id="event"
                          value={selectedEventUuid}
                          onChange={(e) => setSelectedEventUuid(e.target.value)}
                          className="relative w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-white/90 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:outline-none focus:border-primary-400 text-base sm:text-base transition-all hover:border-primary-300 hover:bg-white shadow-sm font-medium text-center"
                          style={{ fontSize: '16px', textAlign: 'center' }}
                          required
                          disabled={loading}
                        >
                          <option value="">Select an Event</option>
                          {events.map((event) => {
                            return (
                              <option key={event.event_uuid} value={event.event_uuid}>
                                {event.event_name}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      
                      {/* Want Updates Checkbox */}
                      <div className="mt-3 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="wantUpdates"
                          checked={wantUpdates}
                          onChange={(e) => setWantUpdates(e.target.checked)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer"
                        />
                        <label htmlFor="wantUpdates" className="text-sm font-semibold text-gray-700 cursor-pointer">
                          Want updates about future events?
                        </label>
                      </div>
                    </div>

                    {/* Check-In Button */}
                    <button
                      type="submit"
                      disabled={submitting || loading}
                      className="relative w-full py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl font-bold transition-all shadow-soft hover:shadow-soft-lg active:scale-95 overflow-hidden group/btn disabled:opacity-50 disabled:cursor-not-allowed bg-white/90 backdrop-blur-sm border border-gray-300/50 hover:border-primary-300"
                    >
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
                      
                      <span className="relative z-10 flex items-center justify-center gap-2 text-transparent bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text">
                        {submitting ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-transparent bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text">Checking In...</span>
                          </>
                        ) : (
                          'Check-In'
                        )}
                      </span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Success Screen */
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-8 w-full mt-2 sm:mt-3 md:mt-4">
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
                    {/* Checked In Success */}
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-500 shadow-soft-lg mb-4">
                        <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-transparent bg-gradient-to-r from-green-600 to-green-700 bg-clip-text mb-2">
                        Checked In ✅
                      </h2>
                    </div>

                    {/* Participant Name and Event */}
                    {checkInDetails && (
                      <div className="mb-4 space-y-1.5">
                        <div className="flex items-center justify-start gap-2">
                          <p className="text-sm font-semibold text-gray-600">Participant:</p>
                          <p className="text-lg sm:text-xl font-bold text-gray-800">
                            {checkInDetails.attendeeName}
                          </p>
                        </div>
                        <div className="flex items-center justify-start gap-2">
                          <p className="text-sm font-semibold text-gray-600">Event:</p>
                          <p className="text-lg sm:text-xl font-bold text-gray-800">
                            {checkInDetails.eventName}
                          </p>
                        </div>
                        <div className="flex items-center justify-start">
                          <p className="text-sm font-semibold text-gray-600">
                            Check-in Time: {checkInDetails.checkInTime}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Discount Message */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-200">
                      <p className="text-sm sm:text-base font-semibold text-gray-800 text-center mb-3">
                        10% Off for Event Attendees today
                      </p>
                      <button
                        onClick={() => {
                          // Get customer phone number from check-in
                          const phoneWithPrefix = sessionStorage.getItem('customerPhone') || 
                                                 getSessionData<string>('event_customerPhone') || '';
                          
                          // Check if there's an existing food order for this phone number
                          const savedOrderPlaced = getSessionData<boolean>('food_orderPlaced') || 
                                                   (localStorage.getItem('orderPlaced') === 'true');
                          const savedPhone = getSessionData<string>('food_customerPhone') || 
                                           sessionStorage.getItem('customerPhone') || '';
                          
                          // Normalize phone numbers for comparison (ensure both have +91 prefix)
                          const normalizePhone = (phone: string) => {
                            if (!phone) return '';
                            const digits = phone.replace(/\D/g, '');
                            if (digits.startsWith('91') && digits.length === 12) {
                              return `+${digits}`;
                            } else if (digits.length === 10) {
                              return `+91${digits}`;
                            }
                            return phone.startsWith('+') ? phone : `+${phone}`;
                          };
                          
                          const normalizedCurrentPhone = normalizePhone(phoneWithPrefix);
                          const normalizedSavedPhone = normalizePhone(savedPhone);
                          
                          // Check if there's an existing order for the same phone number
                          const hasExistingOrder = savedOrderPlaced && 
                                                  normalizedSavedPhone && 
                                                  normalizedCurrentPhone && 
                                                  normalizedSavedPhone === normalizedCurrentPhone;
                          
                          if (hasExistingOrder) {
                            // Set view to orderPlaced to show order summary
                            localStorage.setItem('currentView', 'orderPlaced');
                            // Ensure orderPlaced flag is set
                            if (!getSessionData<boolean>('food_orderPlaced')) {
                              setSessionData('food_orderPlaced', true);
                            }
                            localStorage.setItem('orderPlaced', 'true');
                          } else {
                            // No existing order - show fresh menu
                            // Clear any existing order flags to start fresh
                            localStorage.setItem('currentView', 'menu');
                            localStorage.removeItem('orderPlaced');
                            // Set flags to skip checkout dialog and pre-fill customer info
                            sessionStorage.setItem('skipCheckoutDialog', 'true');
                          }
                          
                          // Set flag to indicate coming from event check-in
                          sessionStorage.setItem('fromEventCheckIn', 'true');
                          
                          // Store event details to display in order summary
                          if (checkInDetails) {
                            sessionStorage.setItem('eventCheckInDetails', JSON.stringify({
                              eventName: checkInDetails.eventName,
                              checkInTime: checkInDetails.checkInTime,
                            }));
                          }
                          
                          // Navigate to order menu
                          router.push('/order-menu');
                        }}
                        className="relative w-full py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl font-bold transition-all shadow-soft hover:shadow-soft-lg active:scale-95 overflow-hidden group/btn"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600"></div>
                        <span className="relative z-10 text-white">Order Food/Coffee</span>
                      </button>
                    </div>
                  </div>

                  {/* Action Links Section */}
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
                    {/* Follow SocialX on Instagram */}
                    <div className="flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-200">
                      <span className="text-sm font-semibold text-gray-700">Follow SocialX</span>
                      <a
                        href="https://www.instagram.com/socialxcafe/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-bold text-pink-600 hover:text-pink-700 transition-colors"
                      >
                        <Image
                          src="/resources/instagram-logo.svg"
                          alt="Instagram"
                          width={20}
                          height={20}
                          className="w-5 h-5"
                        />
                        <span>@socialxcafe</span>
                      </a>
                    </div>

                    {/* Explore Upcoming Events */}
                    <button
                      onClick={() => {
                        // Navigate to SocialX Linktree for upcoming events
                        window.open('https://linktr.ee/socialx.hub', '_blank');
                      }}
                      className="w-full py-3 px-4 rounded-xl font-bold transition-all shadow-soft hover:shadow-soft-lg active:scale-95 overflow-hidden group/btn bg-white/90 backdrop-blur-sm border border-gray-300/50 hover:border-primary-300"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2 text-transparent bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text">
                        👉 See Upcoming Events
                      </span>
                    </button>
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
    </main>
  );
}
