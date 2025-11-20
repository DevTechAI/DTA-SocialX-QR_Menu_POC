'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { type MenuItem } from '@/lib/data/menu-items';
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
  const [customerPhone, setCustomerPhone] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  
  // Menu state - keep categories collapsed by default
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<{ item: MenuItem; quantity: number }[]>([]);
  const [waiterCalled, setWaiterCalled] = useState(false);
  
  // Menu items from API
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  
  // Order placed state
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [orderStatus, setOrderStatus] = useState<'Received' | 'Accepted' | 'In-Progress' | 'Delivered' | 'Bill Generated' | 'Bill Paid'>('Received');
  const [orderId, setOrderId] = useState('');
  
  const [mounted, setMounted] = useState(false);
  const [showOrderMessageDialog, setShowOrderMessageDialog] = useState(false);
  const [showUnavailableItemsDialog, setShowUnavailableItemsDialog] = useState(false);
  const [unavailableItems, setUnavailableItems] = useState<Array<{ menu_item_id: string; name: string; Available: boolean }>>([]);
  
  // Ref for selected items scroll container
  const selectedItemsScrollRef = useRef<HTMLDivElement>(null);
  // Ref to track if dialog has been shown for current order
  const dialogShownForOrderRef = useRef<string | null>(null);

  // Fetch menu items from API
  useEffect(() => {
    const fetchMenuItems = async (isInitialLoad = false) => {
      try {
        if (isInitialLoad) {
          setMenuLoading(true);
        }
        const response = await fetch('/api/menu');
        if (response.ok) {
          const data = await response.json();
          setMenuItems(data);
          if (isInitialLoad) {
            console.log('✅ Menu items loaded from database:', data.length);
            // Log availability status for debugging
            const unavailableCount = data.filter((item: MenuItem) => item.available === false).length;
            if (unavailableCount > 0) {
              console.log(`⚠️ Found ${unavailableCount} unavailable items (available=false)`);
            }
          }
        } else {
          console.error('Failed to fetch menu items');
        }
      } catch (error) {
        console.error('Error fetching menu items:', error);
      } finally {
        if (isInitialLoad) {
          setMenuLoading(false);
        }
      }
    };

    // Initial load
    fetchMenuItems(true);
    
    // Poll for menu updates every 20 seconds to get real-time availability changes
    const pollInterval = setInterval(() => {
      fetchMenuItems(false);
    }, 20000); // 20 seconds

    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    setMounted(true);
    
    // Restore state from localStorage
    const savedName = localStorage.getItem('customerName');
    const savedPhone = localStorage.getItem('customerPhone');
    const savedView = localStorage.getItem('currentView') as ViewState;
    const savedItems = localStorage.getItem('selectedItems');
    const savedOrderPlaced = localStorage.getItem('orderPlaced');
    const savedOrderStatus = localStorage.getItem('orderStatus');
    const savedOrderId = localStorage.getItem('orderId');
    
    if (savedName) setCustomerName(savedName);
    if (savedPhone) {
      // Remove +91 prefix if present (for display in input field)
      const phoneWithoutPrefix = savedPhone.startsWith('+91') ? savedPhone.slice(3) : savedPhone;
      setCustomerPhone(phoneWithoutPrefix);
    }
    if (savedItems) {
      try {
        setSelectedItems(JSON.parse(savedItems));
      } catch (error) {
        console.error('Error loading saved items:', error);
      }
    }
    if (savedOrderPlaced === 'true' && savedView === 'orderPlaced') {
      setCurrentView('orderPlaced');
    } else if (savedView) {
      setCurrentView(savedView);
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

  // Show dialog when order is placed (on page load or when order is placed)
  useEffect(() => {
    if (currentView === 'orderPlaced' && orderId && dialogShownForOrderRef.current !== orderId) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setShowOrderMessageDialog(true);
        dialogShownForOrderRef.current = orderId; // Mark as shown for this order
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentView, orderId]);

  // Update current time every second when order is placed
  useEffect(() => {
    if (currentView === 'orderPlaced') {
      const timer = setInterval(() => {
        setCurrentTime(new Date().toLocaleTimeString());
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentView]);

  // Auto-scroll selected items window to show latest added item
  useEffect(() => {
    if (selectedItemsScrollRef.current && selectedItems.length > 0) {
      // Scroll to bottom to show latest item
      selectedItemsScrollRef.current.scrollTo({
        top: selectedItemsScrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [selectedItems]);

  // Auto-refresh once every time menu page is reached for better header fit
  useEffect(() => {
    if (currentView === 'menu' && mounted) {
      const refreshKey = 'menuPageAutoRefreshed';
      const wasRefreshed = sessionStorage.getItem(refreshKey);
      
      // If flag exists, it means we just refreshed - clear it for next time
      if (wasRefreshed === 'true') {
        sessionStorage.removeItem(refreshKey);
        return;
      }
      
      // No flag means we navigated to menu (not from refresh) - refresh once
      // Set flag immediately to prevent multiple refreshes
      sessionStorage.setItem(refreshKey, 'true');
      
      // Small delay to ensure everything is ready, then refresh
      const timeoutId = setTimeout(() => {
        // Final check before refreshing
        if (sessionStorage.getItem(refreshKey) === 'true') {
          window.location.reload();
        }
      }, 150);
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentView, mounted]);

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
    // If we have navigation history, use it
    if (navigationHistory.length > 0) {
      const previousView = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory(prev => prev.slice(0, -1));
      setCurrentView(previousView);
    } else {
      // Fallback: if no history, go to nameEntry (welcome page)
      // This handles cases where navigationHistory might be empty
      setCurrentView('nameEntry');
    }
  };

  // Name Entry Handlers
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate name
    if (!customerName.trim()) {
      alert('Please enter your good Name');
      return;
    }
    
    // Validate phone number - must be exactly 10 digits
    const phoneDigits = customerPhone.replace(/\D/g, '');
    if (!phoneDigits || phoneDigits.length !== 10) {
      alert('Please enter your Phone Number (exactly 10 digits)');
      return;
    }
    
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
    // Store phone number with +91 prefix (phoneDigits is already validated to be 10 digits)
    const phoneWithPrefix = `+91${phoneDigits}`;
    localStorage.setItem('customerPhone', phoneWithPrefix);
    
    // Reset menu state - keep categories collapsed
    setSelectedItems([]);
    setExpandedCategories([]);
    
    // Navigate immediately - zoom reset will be handled in useEffect
    // Refresh will happen automatically when menu view loads
    navigateToView('menu');
    
    // Restore viewport after navigation
    setTimeout(() => {
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0, viewport-fit=cover, user-scalable=yes');
      }
    }, 300);
  };

  // Menu Handlers - Only one tab expanded at a time
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      // If the clicked category is already expanded, collapse it
      if (prev.includes(category)) {
        return [];
      }
      // Otherwise, collapse all others and expand only the clicked one
      return [category];
    });
  };

  const addItem = (item: MenuItem) => {
    // Prevent adding unavailable items
    if (item.available === false) {
      return;
    }
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

  const removeItemCompletely = (itemId: string) => {
    setSelectedItems(prev => prev.filter(i => i.item.id !== itemId));
  };

  const handleViewMenu = () => {
    // Get IDs of unavailable items
    const unavailableIds = unavailableItems.map(item => item.menu_item_id);
    
    // Remove unavailable items from selected items
    setSelectedItems(prev => {
      const updated = prev.filter(i => !unavailableIds.includes(i.item.id));
      // Update localStorage for selected items
      localStorage.setItem('selectedItems', JSON.stringify(updated));
      return updated;
    });
    
    // Update menu items to mark unavailable items as sold out
    setMenuItems(prev => prev.map(item => {
      if (unavailableIds.includes(item.id)) {
        return { ...item, available: false };
      }
      return item;
    }));
    
    // Close dialog
    setShowUnavailableItemsDialog(false);
    setUnavailableItems([]);
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

    // Ensure phone number is exactly 10 digits with +91 prefix
    const phoneDigits = customerPhone.replace(/\D/g, '');
    const phoneWithPrefix = phoneDigits.length === 10 ? `+91${phoneDigits}` : `+91${customerPhone}`;

    const orderData = {
      customer_name: customerName,
      customer_phno: phoneWithPrefix,
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

      let responseData;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        console.error('❌ Failed to parse response JSON:', jsonError);
        alert('Failed to place order. Please try again.');
        return;
      }

      console.log('📦 Order API Response:', {
        status: response.status,
        ok: response.ok,
        hasUnavailableItems: !!responseData.unavailableItems,
        unavailableItemsCount: responseData.unavailableItems?.length || 0,
        data: responseData
      });

      if (response.ok) {
        // Order placed successfully
        const orderId = responseData.id || getMockOrderId();
        setOrderId(orderId);
        localStorage.setItem('orderId', orderId);
        localStorage.setItem('orderPlaced', 'true');
        navigateToView('orderPlaced');
        // Dialog will be shown by useEffect
      } else if (response.status === 400) {
        // Check if it's an unavailable items error
        if (responseData.unavailableItems && Array.isArray(responseData.unavailableItems) && responseData.unavailableItems.length > 0) {
          // Some items are unavailable
          console.log('⚠️ Unavailable items detected:', responseData.unavailableItems);
          console.log('🔔 Setting dialog state to true');
          
          // Show dialog first to notify user
          setUnavailableItems(responseData.unavailableItems);
          setShowUnavailableItemsDialog(true);
          console.log('✅ Dialog state set, showUnavailableItemsDialog should be true');
        } else {
          // Other 400 error
          console.error('❌ Order error (400):', responseData);
          alert(responseData.error || 'Failed to place order. Please try again.');
        }
      } else {
        // Other error
        console.error('❌ Order error:', responseData);
        alert(responseData.error || 'Failed to place order. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error placing order:', error);
      alert('Failed to place order. Please try again.');
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
    setCustomerPhone('');
    setSelectedItems([]);
    setExpandedCategories([]);
    setOrderId('');
    setOrderStatus('Received');
    setNavigationHistory([]);
    setShowOrderMessageDialog(false);
    dialogShownForOrderRef.current = null; // Reset dialog tracking
    
    localStorage.removeItem('customerName');
    localStorage.removeItem('customerPhone');
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
                          onInvalid={(e) => {
                            e.preventDefault();
                            if (!customerName.trim()) {
                              alert('Please enter your good Name');
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Phone Number Input with elite styling */}
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
                      <p className="text-xs text-gray-600 mt-1.5 italic font-bold">
                        *You&apos;ll get a quick SMS/WhatsApp message once order is ready for pickup!
                      </p>
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
                    <p className="text-sm font-bold text-primary-600">25min</p>
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

                {/* Order Ready Message */}
                <div className="mb-4">
                  <div className="space-y-2">
                    <p className="text-base font-bold text-gray-800">
                      Your order will be ready soon!
                    </p>
                    <p className="text-sm font-semibold text-gray-700 leading-relaxed">
                      Please collect it from the counter when you get a message.
                    </p>
                    <p className="text-sm font-semibold text-gray-700">
                      SocialX is a self-serve space <span className="text-green-600 font-bold">💚</span>
                    </p>
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
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-800 truncate">{item.name}</h4>
                          </div>
                          
                          {/* Quantity */}
                          <div className="text-right flex-shrink-0">
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

        {/* Order Message Dialog Popup */}
        {showOrderMessageDialog && (
          <div 
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-300"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={(e) => {
              // Close when clicking outside
              if (e.target === e.currentTarget) {
                setShowOrderMessageDialog(false);
              }
            }}
          >
            <div 
              className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full transform transition-all animate-in zoom-in-95 duration-300"
            >
              {/* Close Button - Red X */}
              <button
                onClick={() => setShowOrderMessageDialog(false)}
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
                  🎉 Order Confirmed!
                </h3>
                <div className="space-y-2">
                  <p className="text-base font-bold text-gray-800">
                    Your order will be ready soon!
                  </p>
                  <p className="text-sm font-semibold text-gray-700 leading-relaxed">
                    Please collect it from the counter when you get a message.
                  </p>
                  <p className="text-sm font-semibold text-gray-700">
                    SocialX is a self-serve space <span className="text-green-600 font-bold">💚</span>
                  </p>
                </div>
              </div>

              {/* Close Button at Bottom */}
              <button
                onClick={() => setShowOrderMessageDialog(false)}
                className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    );
  }

  // ===== MENU VIEW =====
  const cameFromOrderPlaced = navigationHistory.includes('orderPlaced');
  
  // Show loading state while fetching menu items
  if (menuLoading && menuItems.length === 0) {
    return (
      <main className="gradient-soft flex flex-col items-center justify-center min-h-screen w-full">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary mb-4 shadow-soft-lg">
            <div className="animate-pulse">
              <span className="text-5xl text-white">☕</span>
            </div>
          </div>
          <p className="text-gray-700 font-bold text-lg">Loading Menu...</p>
          <p className="text-gray-500 text-sm mt-1">Fetching latest items list</p>
        </div>
      </main>
    );
  }
  
  return (
    <main 
      className="gradient-soft flex flex-col items-center w-full overflow-x-hidden"
      style={{ 
        scrollBehavior: 'auto',
        minHeight: '100vh',
        overflowY: 'auto', // Allow scrolling if unexpanded tabs don't fit on screen
      }}
    >
      {/* Back Button - Left Arrow (to Name Entry) - Mid Screen */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          navigateBack();
        }}
        className="fixed top-1/2 left-2 md:left-4 -translate-y-1/2 z-[60] group/back touch-manipulation"
        style={{ 
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
        }}
        aria-label="Go back to welcome page"
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
            // Increase height by 40% + 30% more = 82% total increase (1.4 * 1.3 = 1.82)
            paddingTop: deviceInfo.isMobile 
              ? deviceInfo.screenWidth <= 375 
                ? 'calc(0.625rem * 1.82)' // py-2.5 * 1.82 = 18.2px
                : deviceInfo.screenWidth <= 428
                ? 'calc(0.75rem * 1.82)' // py-3 * 1.82 = 21.84px
                : 'calc(0.875rem * 1.82)' // py-3.5 * 1.82 = 25.48px
              : 'calc(1.5rem * 1.82)', // md:py-6 * 1.82 = 43.68px
            paddingBottom: deviceInfo.isMobile 
              ? deviceInfo.screenWidth <= 375 
                ? 'calc(0.625rem * 1.82)' // py-2.5 * 1.82 = 18.2px
                : deviceInfo.screenWidth <= 428
                ? 'calc(0.75rem * 1.82)' // py-3 * 1.82 = 21.84px
                : 'calc(0.875rem * 1.82)' // py-3.5 * 1.82 = 25.48px
              : 'calc(1.5rem * 1.82)', // md:py-6 * 1.82 = 43.68px
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
      <div className="w-full md:max-w-2xl lg:max-w-3xl px-4 md:px-6 lg:px-10 py-1.5 md:py-2 pb-1">
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
                  ? '0 4px 20px rgba(168, 85, 247, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.2)' 
                  : '0 2px 10px rgba(0, 0, 0, 0.2)',
              }}
            >
              <div 
                className="absolute inset-0 group-hover/order:opacity-90 transition-all"
                style={{
                  background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)'
                }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent"></div>
              <span className="relative z-10 text-white flex items-center gap-1.5 font-extrabold drop-shadow-lg" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                <span className="text-base md:text-lg">🍽️</span>
                <span>Place Order</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Selected Items Section - Between Place Order and Tabs - Sticky, overlays menu items */}
      {selectedItems.length > 0 && (
        <div className="w-full md:max-w-2xl lg:max-w-3xl px-4 md:px-6 sticky z-[9999] mt-1" style={{ top: 'calc(140px + env(safe-area-inset-top, 0px))' }}>
          <div 
            className="backdrop-blur-xl rounded-2xl shadow-2xl border-2 border-primary-200/50 overflow-hidden mb-6"
            style={{
              background: 'linear-gradient(to bottom, rgba(255, 237, 213, 0.95), rgba(254, 215, 170, 0.95), rgba(251, 191, 36, 0.90))',
              maxHeight: '120px', // Reduced from 140px
              marginBottom: '24px', // Increased spacing between selected items and HOT tab
              marginTop: '4px', // Small top margin to create minimal gap from Place Order button
            }}
          >
            {/* Header - Smaller */}
            <div className="px-3 py-1.5 border-b border-primary-100 flex-shrink-0">
              <h3 className="text-xs font-bold text-gray-700">Selected Items ({selectedItems.reduce((sum, { quantity }) => sum + quantity, 0)})</h3>
            </div>
            
            {/* Scrollable Items List - Smaller height, scrollable when items exceed */}
            <div 
              ref={selectedItemsScrollRef}
              className="px-3 py-1 space-y-1"
              style={{
                maxHeight: '90px', // Reduced from 100px
                overflowY: 'auto',
                overflowX: 'hidden',
                WebkitOverflowScrolling: 'touch',
                scrollBehavior: 'smooth',
              }}
            >
              {selectedItems.map(({ item, quantity }) => (
                <div key={item.id} className="flex items-center gap-1.5 bg-gradient-to-br from-white via-white to-orange-50/60 p-1.5 rounded-lg border border-primary-100 shadow-sm">
                  {/* Icon - Smaller */}
                  {item.icon && (
                    <div className="flex-shrink-0 w-5 h-5 rounded-md bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center shadow-sm border border-primary-100">
                      {item.icon.startsWith('/') || item.icon.startsWith('http') ? (
                        <Image 
                          src={item.icon} 
                          alt={item.name}
                          width={14}
                          height={14}
                          className="object-contain"
                        />
                      ) : (
                        <span className="text-[10px]">{item.icon}</span>
                      )}
                    </div>
                  )}
                  
                  {/* Item name - Smaller */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-800 truncate text-[11px] leading-tight">{item.name}</h4>
                    <p className="text-[9px] text-gray-500 leading-tight">₹{item.price} × {quantity}</p>
                  </div>
                  
                  {/* Quantity controls - Smaller */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeItem(item.id);
                      }}
                      className="w-4 h-4 rounded-md bg-gradient-to-br from-red-500 to-red-600 text-white font-bold shadow-sm hover:shadow-soft transition-all active:scale-95 flex items-center justify-center text-[10px] touch-manipulation"
                      style={{
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation',
                      }}
                      aria-label={`Decrease ${item.name}`}
                    >
                      −
                    </button>
                    <span className="min-w-[20px] text-center px-1 py-0 bg-gradient-to-br from-primary-50 to-accent-50 rounded-md font-bold text-primary-600 border border-primary-200 text-[10px]">
                      {quantity}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addItem(item);
                      }}
                      className="w-4 h-4 rounded-md bg-gradient-to-br from-green-500 to-green-600 text-white font-bold shadow-sm hover:shadow-soft transition-all active:scale-95 flex items-center justify-center text-[10px] touch-manipulation"
                      style={{
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation',
                      }}
                      aria-label={`Increase ${item.name}`}
                    >
                      +
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeItemCompletely(item.id);
                      }}
                      className="w-4 h-4 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white font-bold shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center justify-center text-[9px] touch-manipulation ml-0.5"
                      style={{
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation',
                      }}
                      aria-label={`Remove ${item.name}`}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Expandable Category Accordion - Mobile Container - Scrolls behind selected items window */}
      <div 
        className="w-full md:max-w-2xl lg:max-w-3xl space-y-1.5"
        style={{
          // Add top margin to create space from selected items window
          marginTop: selectedItems.length > 0 ? '16px' : '8px', // Increased gap when selected items visible
          paddingTop: '8px',
          paddingBottom: '20px', // Single paddingBottom value
          // Reduced horizontal padding by 20% + additional 15% = 32% total reduction (0.8 * 0.85 = 0.68)
          // Mobile: 16px * 0.68 = 10.88px, Tablet: 24px * 0.68 = 16.32px, Desktop: 40px * 0.68 = 27.2px
          paddingLeft: deviceInfo.isMobile 
            ? 'calc(1rem * 0.68)' // 10.88px (32% less than 16px)
            : deviceInfo.screenWidth >= 1024
            ? 'calc(2.5rem * 0.68)' // 27.2px (32% less than 40px)
            : 'calc(1.5rem * 0.68)', // 16.32px (32% less than 24px)
          paddingRight: deviceInfo.isMobile 
            ? 'calc(1rem * 0.68)' // 10.88px (32% less than 16px)
            : deviceInfo.screenWidth >= 1024
            ? 'calc(2.5rem * 0.68)' // 27.2px (32% less than 40px)
            : 'calc(1.5rem * 0.68)', // 16.32px (32% less than 24px)
          // No maxHeight - allow natural flow, main page will scroll if unexpanded tabs don't fit
          overflowX: 'hidden',
          transition: 'padding-left 0.3s ease-in-out, padding-right 0.3s ease-in-out',
          // Ensure menu items scroll behind selected items window
          position: 'relative',
          zIndex: 1, // Lower than selected items window
        }}
      >
        {/* Get unique categories from menu items */}
        {(() => {
          // Define category order: Hot coffee, Cold Coffee, Coffee Addons, Non-Coffee & Refreshers, Snacks & Bites, Desserts
          const categoryOrder = ['HOT', 'COLD', 'ADDON', 'NON-COFFEE', 'SNACK', 'DESSERT'];
          // Category display names
          const categoryDisplayNames: Record<string, string> = {
            'HOT': 'Hot Coffee',
            'COLD': 'Cold Coffee',
            'ADDON': 'Coffee Addons',
            'NON-COFFEE': 'Non-Coffee & Refreshers',
            'SNACK': 'Snacks & Bites',
            'DESSERT': 'Desserts'
          };
          const uniqueCategories = Array.from(new Set(menuItems.map(item => item.category)))
            .sort((a, b) => {
              const indexA = categoryOrder.indexOf(a);
              const indexB = categoryOrder.indexOf(b);
              // If category is in order array, use its index, otherwise put it at the end
              if (indexA === -1 && indexB === -1) return 0;
              if (indexA === -1) return 1;
              if (indexB === -1) return -1;
              return indexA - indexB;
            });
          const getMenuItemsByCategory = (category: string) => {
            return menuItems.filter(item => item.category === category);
          };
          
          return uniqueCategories.map(category => {
            const isExpanded = expandedCategories.includes(category);
            const categoryItems = getMenuItemsByCategory(category);

          return (
            <div key={category} className="relative">
              {/* Category Header Bar */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full relative group/header"
              >
                {/* Glowing border effect - Purple/Violet on hover and when expanded */}
                <div 
                  className={`absolute -inset-0.5 rounded-xl blur-sm transition duration-300 ${
                    isExpanded 
                      ? 'opacity-100' 
                      : 'opacity-0 group-hover/header:opacity-100'
                  }`}
                  style={{
                    background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)'
                  }}
                ></div>
                
                {/* Main header bar */}
                <div className="relative rounded-xl overflow-hidden shadow-soft hover:shadow-soft-lg transition-all duration-300">
                  {/* Glass background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-orange-50/80 backdrop-blur-xl"></div>
                  
                  {/* Content */}
                  <div className="relative z-10 py-3 flex items-center justify-between" style={{ paddingLeft: 'calc(1.25rem * 0.68)', paddingRight: 'calc(1.25rem * 0.68)' }}>
                    <span className="text-lg font-bold text-orange-600">
                      {categoryDisplayNames[category] || category}
                    </span>
                    <svg
                      className={`w-5 h-5 text-orange-600 transition-transform duration-300 ${
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

              {/* Expanded Menu Items - Scrollable if items exceed viewport - Behind selected items window */}
              {isExpanded && (
                <div 
                  className="mt-1.5 space-y-1.5" 
                  style={{ 
                    paddingLeft: 'calc(0.25rem * 0.68)',
                    // No bottom padding needed - selected items window is now above tabs
                    paddingBottom: '20px',
                    // Add scrolling for tab-specific items - max height based on available space
                    // Account for header and selected items window (now above tabs)
                    maxHeight: 'calc(100vh - 300px)', // Account for header + selected items section above
                    overflowY: 'auto', // Scroll items within this tab
                    overflowX: 'hidden',
                    WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
                    // Ensure menu items stay behind selected items window
                    position: 'relative',
                    zIndex: 1, // Lower than selected items window (99999)
                  }}
                >
                  {categoryItems.map(item => {
                    const selectedItem = selectedItems.find(i => i.item.id === item.id);
                    const quantity = selectedItem?.quantity || 0;

                    const isUnavailable = item.available === false;
                    
                    return (
                      <div key={item.id} className="relative group/item px-1">
                        {/* Card */}
                        <div className={`relative rounded-xl overflow-hidden shadow-soft ${isUnavailable ? 'opacity-60 grayscale' : ''}`}>
                          {/* Glass background */}
                          <div className={`absolute inset-0 backdrop-blur-xl ${
                            isUnavailable 
                              ? 'bg-gradient-to-br from-gray-200/95 via-gray-200/90 to-gray-300/70' 
                              : 'bg-gradient-to-br from-white/95 via-white/90 to-orange-50/70'
                          }`}></div>
                          
                          {/* SOLD OUT Tag */}
                          {isUnavailable && (
                            <div className="absolute top-2 right-2 z-20 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-md">
                              SOLD OUT
                            </div>
                          )}
                          
                          {/* Content */}
                          <div className="relative z-10 p-3">
                            <div className="flex items-center gap-3">
                              {/* Icon */}
                              {item.icon && (
                                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm border ${
                                  isUnavailable 
                                    ? 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300' 
                                    : 'bg-gradient-to-br from-primary-50 to-accent-50 border-primary-100'
                                }`}>
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
                                  <h3 className={`text-sm font-bold truncate ${
                                    isUnavailable ? 'text-gray-500' : 'text-gray-800'
                                  }`}>{item.name}</h3>
                                  {quantity === 0 ? (
                                    isUnavailable ? (
                                      <span className="flex-shrink-0 py-1.5 text-xs rounded-lg font-bold text-gray-500 min-w-[72px] text-center">
                                        SOLD OUT
                                      </span>
                                    ) : (
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          addItem(item);
                                        }}
                                        className="flex-shrink-0 py-1.5 text-xs rounded-lg font-bold transition-all shadow-sm hover:shadow-soft active:scale-95 text-white touch-manipulation min-w-[72px]"
                                        style={{
                                          background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
                                          WebkitTapHighlightColor: 'transparent',
                                          touchAction: 'manipulation',
                                          paddingLeft: '1.2rem', // 19.2px - 20% more than previous 16px (1rem)
                                          paddingRight: '1.2rem', // 19.2px - 20% more than previous 16px (1rem)
                                        }}
                                      >
                                        Add
                                      </button>
                                    )
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
                                        disabled={isUnavailable}
                                        className={`w-6 h-6 rounded-lg font-bold shadow-sm hover:shadow-soft transition-all active:scale-95 flex items-center justify-center text-sm ${
                                          isUnavailable 
                                            ? 'bg-gradient-to-br from-gray-400 to-gray-500 text-gray-200 cursor-not-allowed' 
                                            : 'bg-gradient-to-br from-green-500 to-green-600 text-white'
                                        }`}
                                      >
                                        +
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <p className={`text-[10px] truncate ${
                                    isUnavailable ? 'text-gray-400' : 'text-gray-500'
                                  }`}>{item.description}</p>
                                  <span className={`text-base font-bold whitespace-nowrap flex-shrink-0 ${
                                    isUnavailable ? 'text-gray-500' : 'text-primary-600'
                                  }`}>₹{item.price}</span>
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
          });
        })()}
      </div>

      {/* Moved selected items section above - now between Place Order and tabs */}

      {/* Footer removed in menu page - Selected items window now between sections */}

      {/* Unavailable Items Dialog - Available from menu view */}
      {showUnavailableItemsDialog && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-300"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={(e) => {
            // Close when clicking outside
            if (e.target === e.currentTarget) {
              setShowUnavailableItemsDialog(false);
            }
          }}
        >
          <div 
            className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full transform transition-all animate-in zoom-in-95 duration-300"
          >
            {/* Close Button - Red X */}
            <button
              onClick={() => setShowUnavailableItemsDialog(false)}
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
            <div className="pr-8 text-center">
              <h3 className="text-xl font-bold text-red-600 mb-4">
                ⚠️ Not Available
              </h3>
              <div className="space-y-3 mb-4">
                <ul className="space-y-2 flex flex-col items-center">
                  {unavailableItems.map((item) => {
                    // Find the menu item to get its icon
                    const menuItem = menuItems.find(mi => mi.id === item.menu_item_id);
                    return (
                      <li key={item.menu_item_id} className="flex items-center gap-2 text-sm font-bold text-gray-700">
                        {menuItem?.icon && (
                          <span className="text-lg flex-shrink-0">{menuItem.icon}</span>
                        )}
                        <span className="text-red-600">{item.name}</span> - <span className="text-red-600 font-bold">SOLD OUT</span>
                      </li>
                    );
                  })}
                </ul>
                <p className="text-sm font-semibold text-gray-700 mt-4">
                  Removing out of stock Items from your cart
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6">
              <button
                onClick={handleViewMenu}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                View Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
