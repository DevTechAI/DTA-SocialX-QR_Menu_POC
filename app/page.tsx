'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { menuItems, categories, getMenuItemsByCategory, type MenuItem } from '@/lib/data/menu-items';
import { useDeviceDetection, getDevicePadding } from '@/hooks/useDeviceDetection';

type ViewState = 'nameEntry' | 'menu' | 'orderPlaced';

export default function SocialXMenuApp() {
  // Device detection
  const deviceInfo = useDeviceDetection();
  const devicePadding = getDevicePadding(deviceInfo);
  
  // View state
  const [currentView, setCurrentView] = useState<ViewState>('nameEntry');
  const [navigationHistory, setNavigationHistory] = useState<ViewState[]>([]);
  
  // Name entry state
  const [customerName, setCustomerName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  
  // Menu state - keep categories collapsed by default
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<{ item: MenuItem; quantity: number }[]>([]);
  const [waiterCalled, setWaiterCalled] = useState(false);
  
  // Order placed state
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [orderStatus, setOrderStatus] = useState<'Received' | 'Accepted' | 'In-Progress' | 'Delivered' | 'Bill Generated' | 'Bill Paid'>('Received');
  const [orderId, setOrderId] = useState('');
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Restore state from localStorage
    const savedName = localStorage.getItem('customerName');
    const savedView = localStorage.getItem('currentView') as ViewState;
    const savedItems = localStorage.getItem('selectedItems');
    const savedOrderPlaced = localStorage.getItem('orderPlaced');
    const savedOrderStatus = localStorage.getItem('orderStatus');
    const savedOrderId = localStorage.getItem('orderId');
    
    if (savedName) setCustomerName(savedName);
    if (savedView) setCurrentView(savedView);
    if (savedItems) {
      try {
        setSelectedItems(JSON.parse(savedItems));
      } catch (error) {
        console.error('Error loading saved items:', error);
      }
    }
    if (savedOrderPlaced === 'true' && savedView === 'orderPlaced') {
      setCurrentView('orderPlaced');
    }
    if (savedOrderStatus) {
      setOrderStatus(savedOrderStatus as any);
    }
    if (savedOrderId) {
      setOrderId(savedOrderId);
    }
    // Keep categories collapsed by default when menu view loads
    if (savedView === 'menu' || !savedView) {
      setExpandedCategories([]);
    }
  }, []);

  // Save view state
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('currentView', currentView);
    }
  }, [currentView, mounted]);

  // Save selected items
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('selectedItems', JSON.stringify(selectedItems));
    }
  }, [selectedItems, mounted]);

  // Save order status
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('orderStatus', orderStatus);
    }
  }, [orderStatus, mounted]);

  // Update current time every second when order is placed
  useEffect(() => {
    if (currentView === 'orderPlaced') {
      const timer = setInterval(() => {
        setCurrentTime(new Date().toLocaleTimeString());
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentView]);

  // Set body data attribute for CSS targeting and reset zoom/scroll
  useEffect(() => {
    if (currentView === 'menu') {
      document.body.setAttribute('data-view', 'menu');
      document.documentElement.setAttribute('data-view', 'menu');
      
      // Comprehensive scroll and zoom reset function
      const resetScrollAndZoom = () => {
        // Blur any focused elements
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement.blur) {
          activeElement.blur();
        }
        
        // Reset zoom on body and html
        document.body.style.zoom = '1';
        if (document.documentElement) {
          document.documentElement.style.zoom = '1';
        }
        
        // Force scroll to top - multiple methods for maximum compatibility
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.documentElement.scrollLeft = 0;
        document.body.scrollTop = 0;
        document.body.scrollLeft = 0;
        
        // Scroll all possible scrollable elements
        const mainElement = document.querySelector('main');
        if (mainElement) {
          mainElement.scrollTop = 0;
          mainElement.scrollLeft = 0;
        }
        
        // Scroll any other scrollable containers
        const scrollableElements = document.querySelectorAll('[class*="overflow"], [style*="overflow"]');
        scrollableElements.forEach((el) => {
          if (el instanceof HTMLElement) {
            el.scrollTop = 0;
            el.scrollLeft = 0;
          }
        });
        
        // Reset viewport scale temporarily
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
      };
      
      // Execute immediately
      resetScrollAndZoom();
      
      // Use requestAnimationFrame for next frame
      requestAnimationFrame(() => {
        resetScrollAndZoom();
        
        // Also use setTimeout as backup
        setTimeout(() => {
          resetScrollAndZoom();
          
          // Restore viewport after reset
          const viewport = document.querySelector('meta[name="viewport"]');
          if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0, viewport-fit=cover, user-scalable=yes');
          }
          
          // Clear zoom styles
          document.body.style.zoom = '';
          if (document.documentElement) {
            document.documentElement.style.zoom = '';
          }
          
          // Final scroll check - ensure we're at top
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
          
          // Ensure header is visible
          const headerElement = document.querySelector('[class*="sticky top-0"]');
          if (headerElement) {
            headerElement.scrollIntoView({ behavior: 'instant', block: 'start' });
          }
        }, 100);
      });
      
      // Additional checks at various intervals to catch any delayed rendering
      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        document.body.style.zoom = '1';
        setTimeout(() => {
          document.body.style.zoom = '';
          // One more scroll reset
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }, 50);
      }, 300);
      
      // Final check after content is fully rendered
      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 500);
    } else {
      document.body.removeAttribute('data-view');
      document.documentElement.removeAttribute('data-view');
    }
    
    return () => {
      document.body.removeAttribute('data-view');
      document.documentElement.removeAttribute('data-view');
    };
  }, [currentView]);

  // Navigation helpers
  const navigateToView = (view: ViewState) => {
    setNavigationHistory(prev => [...prev, currentView]);
    setCurrentView(view);
  };

  const navigateBack = () => {
    if (navigationHistory.length > 0) {
      const previousView = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory(prev => prev.slice(0, -1));
      setCurrentView(previousView);
    }
  };

  // Name Entry Handlers
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customerName.trim()) {
      // Aggressively reset zoom before navigation
      const input = document.activeElement as HTMLElement;
      if (input && input.blur) {
        input.blur();
      }
      
      // Force zoom reset immediately
      document.body.style.zoom = '1';
      if (document.documentElement) {
        document.documentElement.style.zoom = '1';
      }
      
      // Reset viewport scale
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      }
      
      // Clear all previous order data for a fresh start
      localStorage.removeItem('orderPlaced');
      localStorage.removeItem('selectedItems');
      localStorage.removeItem('orderStatus');
      localStorage.removeItem('orderId');
      localStorage.setItem('customerName', customerName.trim());
      
      // Reset menu state - keep categories collapsed
      setSelectedItems([]);
      setExpandedCategories([]);
      
      // Navigate immediately - zoom reset will be handled in useEffect
      navigateToView('menu');
      
      // Restore viewport after navigation
      setTimeout(() => {
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0, viewport-fit=cover, user-scalable=yes');
        }
      }, 300);
    }
  };

  // Menu Handlers
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const addItem = (item: MenuItem) => {
    setSelectedItems(prev => {
      const existing = prev.find(i => i.item.id === item.id);
      if (existing) {
        return prev.map(i => 
          i.item.id === item.id 
            ? { ...i, quantity: i.quantity + 1 } 
            : i
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeItem = (itemId: string) => {
    setSelectedItems(prev => {
      const existing = prev.find(i => i.item.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(i => 
          i.item.id === itemId 
            ? { ...i, quantity: i.quantity - 1 } 
            : i
        );
      }
      return prev.filter(i => i.item.id !== itemId);
    });
  };

  const getTotalAmount = () => {
    return selectedItems.reduce((sum, { item, quantity }) => sum + (item.price * quantity), 0);
  };

  const handleCallWaiter = () => {
    setWaiterCalled(true);
    setTimeout(() => setWaiterCalled(false), 3000);
  };

  const handleClearSelection = () => {
    setSelectedItems([]);
    localStorage.removeItem('selectedItems');
  };

  // Name editing handlers
  const handleEditName = () => {
    setEditedName(customerName);
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    if (editedName.trim()) {
      setCustomerName(editedName.trim());
      localStorage.setItem('customerName', editedName.trim());
      setIsEditingName(false);
    } else {
      setIsEditingName(false);
    }
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditedName('');
  };

  const handlePlaceOrder = async () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item!');
      return;
    }

    const orderData = {
      customer_name: customerName,
      items: selectedItems.map(({ item, quantity }) => ({
        menu_item_id: item.id,
        name: item.name,
        quantity,
        price: item.price,
      })),
      total_amount: getTotalAmount(),
      status: 'received',
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const mockOrderId = getMockOrderId();
        setOrderId(mockOrderId);
        localStorage.setItem('orderId', mockOrderId);
        localStorage.setItem('orderPlaced', 'true');
        navigateToView('orderPlaced');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      const mockOrderId = getMockOrderId();
      setOrderId(mockOrderId);
      localStorage.setItem('orderId', mockOrderId);
      localStorage.setItem('orderPlaced', 'true');
      navigateToView('orderPlaced');
    }
  };

  // Mock Order ID
  const getMockOrderId = () => {
    return 'SX122344';
  };

  // Order Placed Handlers
  const handleStartNewOrder = () => {
    // Clear all data
    setCustomerName('');
    setSelectedItems([]);
    setExpandedCategories([]);
    setOrderId('');
    setOrderStatus('Received');
    setNavigationHistory([]);
    
    localStorage.removeItem('customerName');
    localStorage.removeItem('selectedItems');
    localStorage.removeItem('orderPlaced');
    localStorage.removeItem('orderStatus');
    localStorage.removeItem('orderId');
    localStorage.removeItem('currentView');
    
    setCurrentView('nameEntry');
  };

  if (!mounted) return null;

  // ===== NAME ENTRY VIEW =====
  if (currentView === 'nameEntry') {
    return (
      <main className="min-h-screen gradient-soft flex flex-col items-center w-full overflow-x-hidden">
        {/* Header with Banner Background - Mobile Container (No Text) */}
        <div className="w-full md:max-w-2xl lg:max-w-3xl shadow-soft-lg sticky top-0 z-10 relative overflow-hidden gradient-primary rounded-b-xl sm:rounded-b-2xl mb-3 sm:mb-4">
          {/* Content Layer with Banner Background */}
          <div 
            className="relative z-10 w-full px-4 py-4 sm:px-6 sm:py-8 md:py-10"
            style={{
              backgroundImage: 'url(/Menu_Header_OR_Footer_BG.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            {/* Fogged Glossy Overlay - Extremely light tint */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/8 via-accent-500/5 to-primary-500/8"></div>
            
            {/* Shiny Glass Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent"></div>
          </div>
        </div>

        {/* Content Container - Mobile focused */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-8 w-full -mt-20 sm:-mt-24 md:-mt-28 lg:-mt-32">
          <div className="w-full md:max-w-2xl lg:max-w-3xl px-3 sm:px-0 md:px-4 lg:px-6">
            {/* Welcome Card - Elegant Glass-morphism Design */}
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
                  {/* Welcome Header */}
                  <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-transparent bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text">
                      Welcome!
                    </h2>
                  </div>
                  
                  <form onSubmit={handleNameSubmit} className="space-y-4 sm:space-y-6">
                    {/* Name Input with elite styling */}
                    <div>
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

                    {/* Submit Button - Narrow & Shiny Transparent */}
                    <button
                      type="submit"
                      className="relative w-full group/btn transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99]"
                    >
                      {/* Elite outer border */}
                      <div className="absolute -inset-px bg-gradient-to-r from-primary-400/60 via-accent-400/60 to-primary-400/60 rounded-lg opacity-100 group-hover/btn:opacity-100 transition duration-300 blur-[0.5px]"></div>
                      
                      {/* Inner button - Narrow */}
                      <div className="relative py-2.5 sm:py-3 px-4 sm:px-5 rounded-lg overflow-hidden backdrop-blur-md">
                        {/* Shiny transparent gradient background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/70 via-accent-500/70 to-primary-500/70 bg-[length:200%_100%] group-hover/btn:bg-[position:100%_0] transition-all duration-500"></div>
                        
                        {/* Glass shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent"></div>
                        
                        {/* Animated shine sweep */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                        
                        {/* Button content */}
                        <span className="relative flex items-center justify-center gap-2 text-white drop-shadow-lg">
                          <span className="text-sm sm:text-base font-bold">Click for Menu</span>
                          <span className="text-lg sm:text-xl group-hover/btn:rotate-12 transition-transform duration-300">🍽️</span>
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

            {/* SocialX Logo Card with Café Background */}
            <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-soft-xl transform hover:scale-105 transition-all duration-300">
              <div className="relative w-full h-48 sm:h-56 md:h-72 lg:h-80 p-6 sm:p-8 md:p-10" style={{
                background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.75) 0%, rgba(251, 146, 60, 0.75) 100%)',
              }}>
                {/* Café Background Vector - Fitted to this window */}
                <div 
                  className="absolute inset-0"
                  style={{
                    backgroundImage: 'url(/background_vector.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    opacity: 0.35,
                  }}
                />
                
                {/* Content Layer - Positioned above screen midline */}
                <div className="absolute inset-0 flex items-center justify-center transform -translate-y-20">
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
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-2xl mb-2 sm:mb-3" style={{ fontFamily: 'cursive' }}>
                      SocialX
                    </h1>
                    <p className="text-lg sm:text-xl md:text-2xl text-white/95 italic font-medium drop-shadow-lg" style={{ fontFamily: 'Georgia, serif' }}>
                      Community Café
                    </p>
                  </div>
                </div>
                
                {/* Decorative circles with animation */}
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/15 backdrop-blur-sm animate-pulse z-10"></div>
                <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/15 backdrop-blur-sm animate-pulse z-10" style={{ animationDelay: '1s' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Subtle Bottom Banner */}
        <footer className="fixed bottom-0 left-0 right-0 z-0">
          <div className="w-full bg-white/60 backdrop-blur-sm border-t border-gray-200/50 py-2 shadow-sm">
            <p className="text-xs text-gray-500 text-center">
              Powered by{' '}
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

  // ===== ORDER PLACED VIEW =====
  if (currentView === 'orderPlaced') {
    return (
      <div className="min-h-screen gradient-soft flex flex-col items-center pb-16 sm:pb-20 w-full overflow-x-hidden">
        {/* Back Button - Left Arrow - Mid Screen */}
        <button
          onClick={navigateBack}
          className="fixed top-1/2 left-2 md:left-4 -translate-y-1/2 z-[60] group/back"
        >
          <div className="relative transition-all active:scale-90 hover:scale-110">
            {/* Glossy orange arrow with border */}
            <svg className="w-8 h-8 md:w-10 md:h-10 drop-shadow-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              {/* Outer glow */}
              <path 
                d="M15 19l-7-7 7-7" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="stroke-primary-400 opacity-40 blur-[2px]"
                strokeWidth={4}
              />
              {/* Main arrow with gradient */}
              <path 
                d="M15 19l-7-7 7-7" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="stroke-primary-500 group-hover/back:stroke-primary-600 transition-colors"
                strokeWidth={2.5}
                style={{
                  filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.6))'
                }}
              />
            </svg>
          </div>
        </button>

        {/* Header with Banner Background - Mobile Container (No Text) */}
        <div className="w-full md:max-w-2xl lg:max-w-3xl shadow-soft-lg sticky top-0 z-50 relative overflow-hidden gradient-primary rounded-b-2xl mb-4">
          {/* Content Layer with Banner Background */}
          <div 
            className="relative z-10 w-full px-4 py-6 md:px-6 md:py-12"
            style={{
              backgroundImage: 'url(/Menu_Header_OR_Footer_BG.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            {/* Fogged Glossy Overlay - Extremely light tint */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/8 via-accent-500/5 to-primary-500/8"></div>
            
            {/* Shiny Glass Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent"></div>
          </div>
        </div>

        {/* Order Content Card */}
        <div className="relative group md:max-w-2xl lg:max-w-3xl w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-8 mb-6 sm:mb-8">
          {/* Glowing border effect */}
          <div className="absolute -inset-0.5 gradient-primary rounded-[28px] opacity-75 blur-md"></div>
          
          {/* Main card with glass-morphism */}
          <div className="relative rounded-3xl overflow-hidden shadow-soft-xl flex flex-col">
            {/* Glass background */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-orange-50/80 backdrop-blur-xl"></div>
            
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent"></div>
            
            {/* Content - Flexbox layout */}
            <div className="relative z-10 flex flex-col">
              {/* Fixed Header Section */}
              <div className="flex-shrink-0 p-4 sm:p-6 pb-0">
                {/* Header: Tick Mark + Name + Time */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-500 shadow-soft-lg flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-transparent bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text">
                        {customerName}&apos;s Order
                      </h2>
                      <p className="text-xs font-semibold text-gray-600 mt-0.5">Order ID: {orderId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">ETA Time</p>
                    <p className="text-sm font-bold text-primary-600">15min</p>
                  </div>
                </div>

                {/* Status Section */}
                <div className="mb-4">
                  <div className="bg-gradient-to-br from-primary-50 via-accent-50 to-orange-50 rounded-2xl p-4 border border-primary-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-700">Order Status</span>
                      <span className="text-lg font-bold text-primary-600">{orderStatus}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrollable Order Items List */}
              <div className="px-4 sm:px-6 max-h-[35vh] sm:max-h-[40vh] md:max-h-[45vh] overflow-y-auto">
                <h3 className="text-sm font-bold text-gray-700 mb-3">Order Items</h3>
                <div className="space-y-2 pb-4">
                  {selectedItems.map(({ item, quantity }) => (
                    <div key={item.id} className="relative group/item rounded-2xl overflow-hidden">
                      {/* Card background */}
                      <div className="bg-gradient-to-br from-white via-white to-orange-50/60 p-4 border border-primary-100 shadow-sm">
                        <div className="flex items-center gap-3">
                          {/* Icon */}
                          {item.icon && (
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center shadow-sm border border-primary-100">
                              {item.icon.startsWith('/') || item.icon.startsWith('http') ? (
                                <Image 
                                  src={item.icon} 
                                  alt={item.name}
                                  width={32}
                                  height={32}
                                  className="object-contain"
                                />
                              ) : (
                                <span className="text-xl">{item.icon}</span>
                              )}
                            </div>
                          )}
                          
                          {/* Item name */}
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-800">{item.name}</h4>
                          </div>
                          
                          {/* Quantity only */}
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary-600">× {quantity}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fixed Bottom Section */}
              <div className="p-4 sm:p-6 pt-3 sm:pt-4 border-t border-primary-100 bg-white/50">
                {/* Total - Only visible for Bill Generated or Bill Paid */}
                {(orderStatus === 'Bill Generated' || orderStatus === 'Bill Paid') && (
                  <div className="bg-gradient-to-br from-primary-50 via-accent-50 to-orange-50 rounded-2xl p-4 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-800">Total Amount</span>
                      <span className="text-2xl font-bold text-primary-600">₹{getTotalAmount()}</span>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={handleStartNewOrder}
                  className="relative w-full py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl font-bold transition-all shadow-soft hover:shadow-soft-lg active:scale-95 overflow-hidden group/btn"
                >
                  <div className="absolute inset-0 gradient-primary"></div>
                  <span className="relative z-10 text-white">Start New Order</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Subtle Bottom Banner */}
        <footer className="fixed bottom-0 left-0 right-0 z-0">
          <div className="w-full bg-white/60 backdrop-blur-sm border-t border-gray-200/50 py-2 shadow-sm">
            <p className="text-xs text-gray-500 text-center">
              Powered by{' '}
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
      </div>
    );
  }

  // ===== MENU VIEW =====
  const cameFromOrderPlaced = navigationHistory.includes('orderPlaced');
  
  return (
    <main 
      className="gradient-soft flex flex-col items-center w-full overflow-x-hidden"
      style={{ 
        scrollBehavior: 'auto',
        height: '100vh',
        overflowY: 'hidden', // Prevent main scroll, let menu container handle it
      }}
    >
      {/* Back Button - Left Arrow (to Name Entry) - Mid Screen */}
      <button
        onClick={navigateBack}
        className="fixed top-1/2 left-2 md:left-4 -translate-y-1/2 z-[60] group/back"
      >
        <div className="relative transition-all active:scale-90 hover:scale-110">
          {/* Glossy orange arrow with border */}
          <svg className="w-8 h-8 md:w-10 md:h-10 drop-shadow-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            {/* Outer glow */}
            <path 
              d="M15 19l-7-7 7-7" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="stroke-primary-400 opacity-40 blur-[2px]"
              strokeWidth={4}
            />
            {/* Main arrow with gradient */}
            <path 
              d="M15 19l-7-7 7-7" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="stroke-primary-500 group-hover/back:stroke-primary-600 transition-colors"
              strokeWidth={2.5}
              style={{
                filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.6))'
              }}
            />
          </svg>
        </div>
      </button>

      {/* Forward Button - Right Arrow (to Order Placed) - Only if came from there - Mid Screen */}
      {cameFromOrderPlaced && (
        <button
          onClick={() => navigateToView('orderPlaced')}
          className="fixed top-1/2 right-2 md:right-4 -translate-y-1/2 z-[60] group/forward"
        >
          <div className="relative transition-all active:scale-90 hover:scale-110">
            {/* Glossy orange arrow with border */}
            <svg className="w-8 h-8 md:w-10 md:h-10 drop-shadow-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              {/* Outer glow */}
              <path 
                d="M9 5l7 7-7 7" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="stroke-primary-400 opacity-40 blur-[2px]"
                strokeWidth={4}
              />
              {/* Main arrow with gradient */}
              <path 
                d="M9 5l7 7-7 7" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="stroke-primary-500 group-hover/forward:stroke-primary-600 transition-colors"
                strokeWidth={2.5}
                style={{
                  filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.6))'
                }}
              />
            </svg>
          </div>
        </button>
      )}

      {/* Header with Banner Background - Mobile Container */}
      <div className="w-full md:max-w-2xl lg:max-w-3xl shadow-soft-lg sticky top-0 z-50 relative overflow-hidden gradient-primary rounded-b-2xl" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        {/* Content Layer with Banner Background */}
        <div 
          className={`relative z-10 w-full ${devicePadding.horizontal} md:px-6`}
          style={{
            backgroundImage: 'url(/Menu_Header_OR_Footer_BG.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            // Increase height by 40% - calculate based on device padding
            paddingTop: deviceInfo.isMobile 
              ? deviceInfo.screenWidth <= 375 
                ? 'calc(0.625rem * 1.4)' // py-2.5 * 1.4 = 14px
                : deviceInfo.screenWidth <= 428
                ? 'calc(0.75rem * 1.4)' // py-3 * 1.4 = 16.8px
                : 'calc(0.875rem * 1.4)' // py-3.5 * 1.4 = 19.6px
              : 'calc(1.5rem * 1.4)', // md:py-6 * 1.4 = 33.6px
            paddingBottom: deviceInfo.isMobile 
              ? deviceInfo.screenWidth <= 375 
                ? 'calc(0.625rem * 1.4)' // py-2.5 * 1.4 = 14px
                : deviceInfo.screenWidth <= 428
                ? 'calc(0.75rem * 1.4)' // py-3 * 1.4 = 16.8px
                : 'calc(0.875rem * 1.4)' // py-3.5 * 1.4 = 19.6px
              : 'calc(1.5rem * 1.4)', // md:py-6 * 1.4 = 33.6px
          }}
        >
          {/* Fogged Glossy Overlay - Extremely light tint */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/8 via-accent-500/5 to-primary-500/8"></div>
          
          {/* Shiny Glass Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent"></div>
          
          {/* Header Vector Background - No Text Content */}
        </div>
      </div>

      {/* Customer Info and Place Order Section - Below Header */}
      <div className="w-full md:max-w-2xl lg:max-w-3xl px-4 md:px-6 lg:px-10 py-3 md:py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            {!isEditingName ? (
              <>
                <h1 className="text-lg md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <span>Hi, {customerName}!</span>
                  <button
                    onClick={handleEditName}
                    className="inline-flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary-100 hover:bg-primary-200 active:bg-primary-300 transition-all active:scale-95 p-1"
                    aria-label="Edit name"
                  >
                    <svg 
                      className="w-3 h-3 md:w-4 md:h-4 text-primary-600" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor" 
                      strokeWidth={2.5}
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                      />
                    </svg>
                  </button>
                  <span className="text-xl md:text-3xl">👋</span>
                </h1>
                <p className="text-gray-600 text-xs md:text-sm font-semibold mt-0.5 md:mt-1">Choose from menu</p>
              </>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveName();
                      } else if (e.key === 'Escape') {
                        handleCancelEditName();
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-white rounded-lg text-base font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-400 border border-gray-300"
                    placeholder="Enter your name"
                    autoFocus
                    style={{ fontSize: '16px' }}
                  />
                  <button
                    onClick={handleSaveName}
                    className="inline-flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-lg bg-green-500 hover:bg-green-600 active:bg-green-700 transition-all active:scale-95"
                    aria-label="Save name"
                  >
                    <svg 
                      className="w-4 h-4 md:w-5 md:h-5 text-white" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor" 
                      strokeWidth={2.5}
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M5 13l4 4L19 7" 
                      />
                    </svg>
                  </button>
                  <button
                    onClick={handleCancelEditName}
                    className="inline-flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-lg bg-red-500 hover:bg-red-600 active:bg-red-700 transition-all active:scale-95"
                    aria-label="Cancel editing"
                  >
                    <svg 
                      className="w-4 h-4 md:w-5 md:h-5 text-white" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor" 
                      strokeWidth={2.5}
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M6 18L18 6M6 6l12 12" 
                      />
                    </svg>
                  </button>
                </div>
                <p className="text-gray-600 text-xs font-semibold">Press Enter to save, Esc to cancel</p>
              </div>
            )}
          </div>
          {/* Place Order Button - Vertically Centered */}
          <div className="flex items-center">
            <button
              onClick={handlePlaceOrder}
              disabled={selectedItems.length === 0}
              className="relative px-4 py-2 md:px-5 md:py-2.5 rounded-xl font-bold text-sm md:text-base transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group/order active:scale-95 border-2 border-primary-300"
              style={{
                boxShadow: selectedItems.length > 0 
                  ? '0 4px 20px rgba(249, 115, 22, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.2)' 
                  : '0 2px 10px rgba(0, 0, 0, 0.2)',
              }}
            >
              <div className="absolute inset-0 gradient-primary group-hover/order:opacity-90 transition-all"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent"></div>
              <span className="relative z-10 text-white flex items-center gap-1.5 font-extrabold drop-shadow-lg" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                <span className="text-base md:text-lg">🍽️</span>
                <span>Place Order</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Category Accordion - Mobile Container */}
      <div 
        className="w-full md:max-w-2xl lg:max-w-3xl px-4 md:px-6 lg:px-10 py-2 md:py-3 pb-4 space-y-1.5 flex-1"
        style={{
          // Calculate max height: viewport height - header height (approx 140px) - margins
          // Only show scrollbar when content exceeds this height
          maxHeight: 'calc(100vh - 160px)',
          minHeight: 0, // Allow flex shrinking
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
        }}
      >
        {categories.map(category => {
          const isExpanded = expandedCategories.includes(category);
          const categoryItems = getMenuItemsByCategory(category);

          return (
            <div key={category} className="relative">
              {/* Category Header Bar */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full relative group/header"
              >
                {/* Glowing border effect */}
                <div className="absolute -inset-0.5 gradient-primary rounded-xl opacity-0 group-hover/header:opacity-75 blur-sm transition duration-300"></div>
                
                {/* Main header bar */}
                <div className="relative rounded-xl overflow-hidden shadow-soft hover:shadow-soft-lg transition-all duration-300">
                  {/* Glass background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-orange-50/80 backdrop-blur-xl"></div>
                  
                  {/* Content */}
                  <div className="relative z-10 px-5 py-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-transparent bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text">
                      {category}
                    </span>
                    <svg
                      className={`w-5 h-5 text-primary-600 transition-transform duration-300 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Expanded Menu Items */}
              {isExpanded && (
                <div className="mt-1.5 space-y-1.5 pl-1">
                  {categoryItems.map(item => {
                    const selectedItem = selectedItems.find(i => i.item.id === item.id);
                    const quantity = selectedItem?.quantity || 0;

                    return (
                      <div key={item.id} className="relative group/item px-1">
                        {/* Card */}
                        <div className="relative rounded-xl overflow-hidden shadow-soft">
                          {/* Glass background */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-orange-50/70 backdrop-blur-xl"></div>
                          
                          {/* Content */}
                          <div className="relative z-10 p-3">
                            <div className="flex items-center gap-3">
                              {/* Icon */}
                              {item.icon && (
                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center shadow-sm border border-primary-100">
                                  {item.icon.startsWith('/') || item.icon.startsWith('http') ? (
                                    <Image 
                                      src={item.icon} 
                                      alt={item.name}
                                      width={24}
                                      height={24}
                                      className="object-contain"
                                    />
                                  ) : (
                                    <span className="text-lg">{item.icon}</span>
                                  )}
                                </div>
                              )}
                              
                              {/* Item Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                  <h3 className="text-sm font-bold text-gray-800 truncate">{item.name}</h3>
                                  {quantity === 0 ? (
                                    <button
                                      onClick={() => addItem(item)}
                                      className="flex-shrink-0 px-3 py-1.5 text-xs rounded-lg font-bold transition-all shadow-sm hover:shadow-soft active:scale-95 bg-gradient-to-r from-primary-500 to-accent-500 text-white"
                                    >
                                      Add
                                    </button>
                                  ) : (
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <button
                                        onClick={() => removeItem(item.id)}
                                        className="w-6 h-6 rounded-lg bg-gradient-to-br from-red-500 to-red-600 text-white font-bold shadow-sm hover:shadow-soft transition-all active:scale-95 flex items-center justify-center text-sm"
                                      >
                                        −
                                      </button>
                                      <span className="min-w-[30px] text-center px-2 py-0.5 bg-gradient-to-br from-primary-50 to-accent-50 rounded-lg font-bold text-primary-600 border border-primary-200 text-sm">
                                        {quantity}
                                      </span>
                                      <button
                                        onClick={() => addItem(item)}
                                        className="w-6 h-6 rounded-lg bg-gradient-to-br from-green-500 to-green-600 text-white font-bold shadow-sm hover:shadow-soft transition-all active:scale-95 flex items-center justify-center text-sm"
                                      >
                                        +
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-[10px] text-gray-500 truncate">{item.description}</p>
                                  <span className="text-base font-bold text-primary-600 whitespace-nowrap flex-shrink-0">₹{item.price}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>


      {/* Footer - Subtle Bottom Banner */}
      <footer className="fixed bottom-0 left-0 right-0 z-0">
        <div className="w-full bg-white/60 backdrop-blur-sm border-t border-gray-200/50 py-2 shadow-sm">
          <p className="text-xs text-gray-500 text-center">
            Powered by{' '}
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
