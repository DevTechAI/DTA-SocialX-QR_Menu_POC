'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { type MenuItem } from '@/lib/data/menu-items';
import { useDeviceDetection, getDevicePadding } from '@/hooks/useDeviceDetection';
import { setSessionData, getSessionData, removeSessionData } from '@/lib/utils/sessionStorage';

type ViewState = 'nameEntry' | 'menu' | 'orderPlaced';

export default function SocialXMenuApp() {
  const router = useRouter();
  // Device detection
  const deviceInfo = useDeviceDetection();
  const devicePadding = getDevicePadding(deviceInfo);
  
  // View state
  const [currentView, setCurrentView] = useState<ViewState>('menu');
  const [navigationHistory, setNavigationHistory] = useState<ViewState[]>([]);
  
  // Name entry state
  const [customerName, setCustomerName] = useState('Guest');
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
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [isDiscountEligible, setIsDiscountEligible] = useState(false);
  const [skipCheckoutDialog, setSkipCheckoutDialog] = useState(false);
  const [consolidatedOrderIds, setConsolidatedOrderIds] = useState<string[]>([]);
  
  // Unpaid orders state
  const [unpaidOrders, setUnpaidOrders] = useState<any[]>([]);
  const [unpaidOrdersTotal, setUnpaidOrdersTotal] = useState(0);
  const [unpaidOrdersLoading, setUnpaidOrdersLoading] = useState(false);
  const [allUnpaidOrderIds, setAllUnpaidOrderIds] = useState<string[]>([]);
  
  // Image popup state
  const [selectedImagePopup, setSelectedImagePopup] = useState<{ url: string; name: string } | null>(null);
  
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
            // Log items with images for debugging
            const itemsWithImages = data.filter((item: MenuItem) => item.image_url);
            if (itemsWithImages.length > 0) {
              console.log(`🖼️ Found ${itemsWithImages.length} items with images:`, itemsWithImages.map((i: MenuItem) => ({ id: i.id, name: i.name, image_url: i.image_url, icon: i.icon })));
            }
            // Log specific item for debugging
            const testItem = data.find((i: MenuItem) => i.id === 'HOT-caremal');
            if (testItem) {
              console.log('🔍 Test item (HOT-caremal):', {
                id: testItem.id,
                name: testItem.name,
                image_url: testItem.image_url,
                icon: testItem.icon,
                hasIcon: !!testItem.icon,
                hasImageUrl: !!testItem.image_url,
                show_image: testItem.show_image
              });
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

  // Check for active booking and discount eligibility on page load
  // Discount ONLY applies when navigating from Snooker or Workspace Order Summary cards
  useEffect(() => {
    const checkDiscountEligibility = async () => {
      // Check if user came from a booking page (snooker or workspace)
      const fromBookingPage = sessionStorage.getItem('fromBookingPage') === 'true';
      
      // Clear any saved discount eligibility - only apply if coming from booking page
      removeSessionData('food_discountEligible');
      
      if (fromBookingPage) {
        // Get phone number - try multiple sources in order of priority
        let phone = sessionStorage.getItem('customerPhone');
        
        // If not found in sessionStorage, try 12-hour session storage
        if (!phone) {
          phone = getSessionData<string>('snooker_customerPhone') ||
                  getSessionData<string>('workspace_customerPhone') ||
                  getSessionData<string>('food_customerPhone');
        }
        
        if (phone) {
          try {
            // Normalize phone number: ensure it has +91 prefix
            // Remove any spaces or dashes
            let phoneForApi = phone.replace(/\s+/g, '').replace(/-/g, '');
            
            // Add +91 prefix if not present
            if (!phoneForApi.startsWith('+91')) {
              // Remove any leading 0 or 91
              phoneForApi = phoneForApi.replace(/^(0|91)/, '');
              phoneForApi = `+91${phoneForApi}`;
            }
            
            // Check for active snooker booking
            const snookerResponse = await fetch(`/api/snooker-bookings/by-phone?phone=${encodeURIComponent(phoneForApi)}`);
            const snookerResult = snookerResponse.ok ? await snookerResponse.json() : { data: null };
            
            // Check for active workspace booking
            const workspaceResponse = await fetch(`/api/workspace-bookings/by-phone?phone=${encodeURIComponent(phoneForApi)}`);
            const workspaceResult = workspaceResponse.ok ? await workspaceResponse.json() : { data: null };
            
            // If user has an active booking (within 12 hours), they're eligible for discount
            if (snookerResult.data || workspaceResult.data) {
              setIsDiscountEligible(true);
            } else {
              setIsDiscountEligible(false);
            }
          } catch (error) {
            console.error('Error checking booking eligibility:', error);
            setIsDiscountEligible(false);
          }
        } else {
          setIsDiscountEligible(false);
        }
        
        // Clear the flag immediately after checking (so it doesn't persist)
        sessionStorage.removeItem('fromBookingPage');
      } else {
        // Not coming from booking page - no discount
        setIsDiscountEligible(false);
      }
    };

    // Small delay to ensure sessionStorage is ready after navigation
    const timeoutId = setTimeout(() => {
      checkDiscountEligibility();
    }, 150);

    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    setMounted(true);
    
    // Restore state from 12-hour session storage (takes priority) or regular storage
    const savedName = getSessionData<string>('food_customerName') || 
                     sessionStorage.getItem('customerName') || 
                     localStorage.getItem('customerName');
    const savedPhone = getSessionData<string>('food_customerPhone') || 
                      sessionStorage.getItem('customerPhone') || 
                      localStorage.getItem('customerPhone');
    const savedView = getSessionData<ViewState>('food_currentView') || 
                     (localStorage.getItem('currentView') as ViewState);
    const savedItems = getSessionData<{ item: MenuItem; quantity: number }[]>('food_selectedItems') || 
                      (() => {
                        const items = localStorage.getItem('selectedItems');
                        return items ? JSON.parse(items) : null;
                      })();
    const savedOrderPlaced = getSessionData<boolean>('food_orderPlaced') || 
                           (localStorage.getItem('orderPlaced') === 'true');
    const savedOrderStatus = getSessionData<string>('food_orderStatus') || 
                            localStorage.getItem('orderStatus');
    const savedOrderId = getSessionData<string>('food_orderId') || 
                        localStorage.getItem('orderId');
    
    // Only restore name if it exists and is not 'Guest' (to allow Guest as default)
    if (savedName && savedName !== 'Guest') {
      setCustomerName(savedName);
    }
    if (savedPhone) {
      // Remove +91 prefix if present (for display in input field)
      const phoneWithoutPrefix = savedPhone.startsWith('+91') ? savedPhone.slice(3) : savedPhone;
      setCustomerPhone(phoneWithoutPrefix);
    }
    if (savedItems) {
      try {
        setSelectedItems(savedItems);
      } catch (error) {
        console.error('Error loading saved items:', error);
      }
    }
    if (savedOrderPlaced && savedView === 'orderPlaced') {
      setCurrentView('orderPlaced');
    } else {
      // Default to menu view, skip nameEntry
      setCurrentView('menu');
    }
    if (savedOrderStatus) {
      setOrderStatus(savedOrderStatus as any);
    }
    if (savedOrderId) {
      setOrderId(savedOrderId);
    }
    // Restore consolidated order IDs if available
    const savedConsolidatedIds = getSessionData<string>('food_consolidatedOrderIds');
    if (savedConsolidatedIds) {
      try {
        const parsedIds = JSON.parse(savedConsolidatedIds);
        if (Array.isArray(parsedIds) && parsedIds.length > 0) {
          setConsolidatedOrderIds(parsedIds);
        }
      } catch (error) {
        console.error('Error parsing consolidated order IDs:', error);
      }
    }
    // Restore skipCheckoutDialog flag if available
    const savedSkipCheckout = sessionStorage.getItem('skipCheckoutDialog') === 'true';
    if (savedSkipCheckout) {
      setSkipCheckoutDialog(true);
    }
    
    // Keep categories collapsed by default when menu view loads
      setExpandedCategories([]);
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

  // Ensure customer info is loaded into state when menu view is active
  useEffect(() => {
    if (mounted && currentView === 'menu') {
      // Always ensure customer info is in state, even if it's already there (in case it got cleared)
      const savedName = getSessionData<string>('food_customerName') || 
                       localStorage.getItem('customerName') ||
                       sessionStorage.getItem('customerName');
      const savedPhone = getSessionData<string>('food_customerPhone') || 
                        localStorage.getItem('customerPhone') ||
                        sessionStorage.getItem('customerPhone');
      
      // Update state if we have saved info and it's different from current state
      if (savedName && savedName !== 'Guest' && savedName !== customerName) {
        setCustomerName(savedName);
      }
      if (savedPhone) {
        // Remove +91 prefix if present (for display in input field)
        const phoneWithoutPrefix = savedPhone.startsWith('+91') ? savedPhone.slice(3) : savedPhone;
        if (phoneWithoutPrefix !== customerPhone) {
          setCustomerPhone(phoneWithoutPrefix);
        }
      }
      
      // Restore skipCheckoutDialog flag if it exists in sessionStorage
      const savedSkipCheckout = sessionStorage.getItem('skipCheckoutDialog') === 'true';
      if (savedSkipCheckout && !skipCheckoutDialog) {
        setSkipCheckoutDialog(true);
      }
    }
  }, [mounted, currentView]);

  // Fetch unpaid orders when order summary page loads
  useEffect(() => {
    const fetchUnpaidOrders = async () => {
      if (currentView === 'orderPlaced' && customerPhone) {
        setUnpaidOrdersLoading(true);
        try {
          // Ensure phone has +91 prefix
          const phoneWithPrefix = customerPhone.startsWith('+91') ? customerPhone : `+91${customerPhone}`;
          const response = await fetch(`/api/orders/unpaid-by-phone?phone=${encodeURIComponent(phoneWithPrefix)}`);
          
          if (response.ok) {
            const data = await response.json();
            setUnpaidOrders(data.orders || []);
            setUnpaidOrdersTotal(data.totalAmount || 0);
            setAllUnpaidOrderIds(data.orderIds || []);
            console.log('✅ Fetched unpaid orders:', {
              count: data.count,
              totalAmount: data.totalAmount,
              orderIds: data.orderIds
            });
          } else {
            console.error('Failed to fetch unpaid orders');
          }
        } catch (error) {
          console.error('Error fetching unpaid orders:', error);
        } finally {
          setUnpaidOrdersLoading(false);
        }
      }
    };

    fetchUnpaidOrders();
  }, [currentView, customerPhone]);

  // Dialog removed - no longer showing pop-up on order summary page

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

  // Calculate discounted price (10% off) - only if eligible
  const getDiscountedPrice = (originalPrice: number): number => {
    if (!isDiscountEligible) {
      return originalPrice; // Return original price if not eligible
    }
    return Math.round(originalPrice * 0.9);
  };

  // Get original total (before discount)
  const getOriginalTotalAmount = () => {
    return selectedItems.reduce((sum, { item, quantity }) => sum + (item.price * quantity), 0);
  };

  // Get total amount (discounted if eligible, otherwise original)
  const getTotalAmount = () => {
    return selectedItems.reduce((sum, { item, quantity }) => {
      const finalPrice = getDiscountedPrice(item.price);
      return sum + (finalPrice * quantity);
    }, 0);
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

  // Common order placement logic
  const processOrderPlacement = async (customerName: string, customerPhone: string) => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item!');
      return;
    }

    // Ensure phone number has +91 prefix
    const phoneWithPrefix = customerPhone.startsWith('+91') ? customerPhone : `+91${customerPhone}`;
    const phoneDigits = phoneWithPrefix.startsWith('+91') ? phoneWithPrefix.slice(3) : phoneWithPrefix;

    // Update customer name and phone in state and 12-hour session storage
    setCustomerName(customerName);
    setSessionData('food_customerName', customerName);
    localStorage.setItem('customerName', customerName); // Keep for backward compatibility
    setCustomerPhone(phoneDigits);
    setSessionData('food_customerPhone', phoneWithPrefix);
    localStorage.setItem('customerPhone', phoneWithPrefix); // Keep for backward compatibility

    // Check for existing unpaid orders for this phone number on the same business day
    let existingOrderIds: string[] = [];
    try {
      // Use business day query (8 AM to 8 AM)
      const existingOrdersResponse = await fetch(`/api/orders?business_day=true`);
      if (existingOrdersResponse.ok) {
        const existingOrders = await existingOrdersResponse.json();
        const unpaidOrders = existingOrders.filter((order: any) => 
          order.customer_phno === phoneWithPrefix && 
          (order.status === 'received' || order.status === 'unpaid')
        );
        existingOrderIds = unpaidOrders.map((order: any) => order.id);
        console.log(`📋 Found ${existingOrderIds.length} existing unpaid order(s) for consolidation`);
      }
    } catch (error) {
      console.error('Error checking for existing orders:', error);
    }

    const orderData = {
      customer_name: customerName,
      customer_phno: phoneWithPrefix,
      items: selectedItems.map(({ item, quantity }) => ({
        menu_item_id: item.id,
        name: item.name,
        quantity,
        price: isDiscountEligible ? getDiscountedPrice(item.price) : item.price, // Use discounted price only if eligible
      })),
      total_amount: getTotalAmount(),
      status: 'received',
      consolidate_with_existing: existingOrderIds.length > 0, // Flag to indicate consolidation needed
      existing_order_ids: existingOrderIds, // Pass existing order IDs to backend
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
        // Close checkout dialog if it was open
        setShowCheckoutDialog(false);
        // Reset checkout form
        setCheckoutName('');
        setCheckoutPhone('');
        // Order placed successfully - save to 12-hour session storage
        const orderId = responseData.id || getMockOrderId();
        const allOrderIds = existingOrderIds.length > 0 
          ? [...existingOrderIds, orderId] 
          : [orderId];
        
        setOrderId(orderId);
        setConsolidatedOrderIds(allOrderIds); // Set consolidated order IDs
        setSessionData('food_orderId', orderId);
        setSessionData('food_consolidatedOrderIds', JSON.stringify(allOrderIds));
        setSessionData('food_orderPlaced', true);
        setSessionData('food_orderStatus', 'Received');
        setSessionData('food_orderSummary', {
          orderId,
          consolidatedOrderIds: allOrderIds,
          customerName,
          customerPhone: phoneWithPrefix,
          items: selectedItems.map(({ item, quantity }) => ({
            menu_item_id: item.id,
            name: item.name,
            quantity,
            price: isDiscountEligible ? getDiscountedPrice(item.price) : item.price,
          })),
          totalAmount: getTotalAmount(),
          originalTotalAmount: getOriginalTotalAmount(),
          status: 'Received',
          orderDate: new Date().toISOString(),
        });
        localStorage.setItem('orderId', orderId); // Keep for backward compatibility
        localStorage.setItem('orderPlaced', 'true'); // Keep for backward compatibility
        // Clear the fromBookingPage flag after order is placed
        sessionStorage.removeItem('fromBookingPage');
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

  const handlePlaceOrder = async () => {
    // Validate checkout form
    if (!checkoutName.trim()) {
      alert('Please enter your good Name');
      return;
    }
    
    // Validate phone number - must be exactly 10 digits
    const phoneDigits = checkoutPhone.replace(/\D/g, '');
    if (!phoneDigits || phoneDigits.length !== 10) {
      alert('Please enter your Phone Number (exactly 10 digits)');
      return;
    }

    // Ensure phone number is exactly 10 digits with +91 prefix
    const phoneWithPrefix = `+91${phoneDigits}`;
    await processOrderPlacement(checkoutName.trim(), phoneWithPrefix);
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
    setSkipCheckoutDialog(false);
    setConsolidatedOrderIds([]);
    
    localStorage.removeItem('customerName');
    localStorage.removeItem('customerPhone');
    localStorage.removeItem('selectedItems');
    localStorage.removeItem('orderPlaced');
    localStorage.removeItem('orderStatus');
    localStorage.removeItem('orderId');
    localStorage.removeItem('currentView');
    
    setCurrentView('nameEntry');
  };

  // More Food/Coffee Handler - retains customer info and skips checkout dialog
  const handleMoreFoodCoffee = () => {
    // Load customer info from storage to ensure it's in state
    const savedName = getSessionData<string>('food_customerName') || 
                     localStorage.getItem('customerName') ||
                     customerName;
    const savedPhone = getSessionData<string>('food_customerPhone') || 
                      localStorage.getItem('customerPhone') ||
                      customerPhone;
    
    // Update state with customer info if available
    if (savedName && savedName !== 'Guest') {
      setCustomerName(savedName);
    }
    if (savedPhone) {
      // Remove +91 prefix if present (for display in input field)
      const phoneWithoutPrefix = savedPhone.startsWith('+91') ? savedPhone.slice(3) : savedPhone;
      setCustomerPhone(phoneWithoutPrefix);
    }
    
    // Clear only selected items and order status
    setSelectedItems([]);
    setExpandedCategories([]);
    setOrderStatus('Received');
    setShowOrderMessageDialog(false);
    dialogShownForOrderRef.current = null;
    
    // Set flag to skip checkout dialog and persist it
    setSkipCheckoutDialog(true);
    sessionStorage.setItem('skipCheckoutDialog', 'true'); // Persist flag in sessionStorage
    
    setConsolidatedOrderIds([]);
    
    // Clear selected items from localStorage but keep customer info
    localStorage.removeItem('selectedItems');
    localStorage.removeItem('orderPlaced');
    localStorage.removeItem('orderStatus');
    localStorage.removeItem('orderId');
    
    console.log('✅ More Food/Coffee clicked - customer info loaded:', {
      name: savedName,
      phone: savedPhone,
      skipCheckoutDialog: true
    });
    
    // Navigate to menu view (not nameEntry)
    setCurrentView('menu');
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
                          <span className="text-sm sm:text-base font-bold">Done</span>
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
          </div>
        </div>

        {/* Footer - Subtle Bottom Banner */}
        <footer className="fixed bottom-0 left-0 right-0 z-0">
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
                {/* Header: Tick Mark + Name */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-500 shadow-soft-lg flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                      <h2 className="text-lg font-bold text-transparent bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text">
                        {customerName}&apos;s Order
                      </h2>
                    </div>

                {/* Order IDs, Status, and ETA Row */}
                <div className="flex items-start justify-between mb-4 gap-2">
                  {/* Order IDs - 30% width */}
                  <div className="flex-[0_0_30%]">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Order IDs</p>
                    <p className="text-xs font-semibold text-gray-600 break-words">
                      {allUnpaidOrderIds.length > 0 ? (
                        allUnpaidOrderIds.map(id => id.slice(-6)).join(', ')
                      ) : consolidatedOrderIds.length > 0 ? (
                        consolidatedOrderIds.map(id => id.slice(-6)).join(', ')
                      ) : orderId ? (
                        orderId.slice(-6)
                      ) : (
                        'N/A'
                      )}
                    </p>
                  </div>
                  
                  {/* Order Status - Middle */}
                  <div className="flex-1 text-center">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Order-Status</p>
                    <p className="text-sm font-bold text-primary-600">{orderStatus}</p>
                </div>

                  {/* ETA Time - Right */}
                  <div className="flex-1 text-right">
                    <p className="text-xs font-semibold text-gray-500 mb-1">ETA Time</p>
                    <p className="text-sm font-bold text-primary-600">25min</p>
                  </div>
                </div>

                {/* Order Ready Message */}
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-base font-bold text-gray-800">
                      Order will be ready soon!
                    </p>
                    {/* Follow us on Instagram */}
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-700">Follow us</span>
                      <a
                        href="https://www.instagram.com/socialxcafe/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-6 h-6 hover:scale-110 transition-transform"
                        title="Follow us on Instagram"
                      >
                        <Image
                          src="/resources/instagram-logo.svg"
                          alt="Instagram"
                          width={24}
                          height={24}
                          className="w-6 h-6"
                        />
                      </a>
                    </div>
                  </div>
                    <p className="text-sm font-semibold text-gray-700 leading-relaxed">
                    Please pay and collect it from the counter when you get a message.
                    </p>
                    <p className="text-sm font-semibold text-gray-700">
                      SocialX is a self-serve space <span className="text-green-600 font-bold">💚</span>
                    </p>
                </div>
              </div>

              {/* Sticky Total Amount - Fixed at top of scrollable area */}
              <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 sm:px-6 pt-2 pb-2 border-b border-primary-100 -mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-700">
                    {unpaidOrders.length > 1 ? 'Total Amount (All Unpaid Orders)' : 'Total Amount'}
                  </span>
                  <div className="text-right">
                    {unpaidOrders.length > 1 ? (
                      <span className="text-lg font-bold text-primary-600">₹{unpaidOrdersTotal.toFixed(2)}</span>
                    ) : isDiscountEligible && getOriginalTotalAmount() !== getTotalAmount() ? (
                      <>
                        <span className="text-base line-through text-gray-400 mr-2">₹{getOriginalTotalAmount()}</span>
                        <span className="text-lg font-bold text-green-600">₹{getTotalAmount()}</span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-primary-600">₹{getTotalAmount()}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Scrollable Order Items List */}
              <div className="px-4 sm:px-6 max-h-[35vh] sm:max-h-[40vh] md:max-h-[45vh] overflow-y-auto -mt-2">
                {/* Show loading state */}
                {unpaidOrdersLoading && (
                  <div className="mb-4 text-center pt-4">
                    <p className="text-sm text-gray-500">Loading unpaid orders...</p>
                  </div>
                )}
                
                {/* Order Items Section - Show first */}
                <h3 className="text-sm font-bold text-gray-700 mb-3 pt-4">Order Items</h3>
                <div className="space-y-2 pb-4">
                  {/* If we have unpaid orders, show items from all orders, otherwise show selectedItems */}
                  {unpaidOrders.length > 1 ? (
                    // Show consolidated items from all unpaid orders
                    (() => {
                      // Merge items from all unpaid orders
                      const allItemsMap = new Map<string, { item: any; quantity: number }>();
                      
                      unpaidOrders.forEach((order) => {
                        if (order.items && Array.isArray(order.items)) {
                          order.items.forEach((orderItem: any) => {
                            const itemId = orderItem.menu_item_id || orderItem.item?.id || orderItem.id || `item-${orderItem.name}`;
                            const itemName = orderItem.name || orderItem.item?.name || 'Item';
                            const itemPrice = orderItem.price || orderItem.item?.price || 0;
                            const itemQuantity = orderItem.quantity || 1;
                            const itemIcon = orderItem.icon || orderItem.item?.icon || '🍽️';
                            // Get image_url from menuItems if available
                            const menuItem = menuItems.find(mi => mi.id === itemId);
                            const itemImageUrl = menuItem?.image_url || orderItem.image_url || orderItem.item?.image_url;
                            
                            const existing = allItemsMap.get(itemId);
                            if (existing) {
                              existing.quantity += itemQuantity;
                            } else {
                              allItemsMap.set(itemId, {
                                item: {
                                  id: itemId,
                                  name: itemName,
                                  price: itemPrice,
                                  icon: itemIcon,
                                  image_url: itemImageUrl,
                                },
                                quantity: itemQuantity,
                              });
                            }
                          });
                        }
                      });
                      
                      return Array.from(allItemsMap.values()).map(({ item, quantity }) => (
                        <div key={item.id} className="relative group/item rounded-2xl overflow-hidden">
                          <div className="bg-gradient-to-br from-white via-white to-orange-50/60 py-2.5 px-3 border border-primary-100 shadow-sm">
                            <div className="flex items-center gap-3">
                              {(item.icon || item.image_url) && (
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center shadow-sm border border-primary-100 overflow-hidden">
                                  {item.show_image && item.image_url ? (
                                    <Image 
                                      src={item.image_url} 
                                      alt={item.name}
                                      width={40}
                                      height={40}
                                      className="object-cover w-full h-full cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => setSelectedImagePopup({ url: item.image_url!, name: item.name })}
                                    />
                                  ) : item.icon && (item.icon.startsWith('/') || item.icon.startsWith('http')) ? (
                                    <Image 
                                      src={item.icon} 
                                      alt={item.name}
                                      width={32}
                                      height={32}
                                      className="object-contain"
                                    />
                                  ) : item.icon ? (
                                    <span className="text-xl">{item.icon}</span>
                                  ) : null}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-800 truncate">{item.name}</h4>
                                <p className="text-xs text-gray-500">₹{item.price.toFixed(2)} each</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-lg font-bold text-primary-600">× {quantity}</p>
                                <p className="text-xs text-gray-600">₹{(item.price * quantity).toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ));
                    })()
                  ) : (
                    // Show selectedItems as before
                    selectedItems.map(({ item, quantity }) => (
                    <div key={item.id} className="relative group/item rounded-2xl overflow-hidden">
                      {/* Card background */}
                      <div className="bg-gradient-to-br from-white via-white to-orange-50/60 py-2.5 px-3 border border-primary-100 shadow-sm">
                        <div className="flex items-center gap-3">
                          {/* Icon */}
                          {(item.icon || item.image_url) && (
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center shadow-sm border border-primary-100 overflow-hidden">
                              {item.show_image && item.image_url ? (
                                <Image 
                                  src={item.image_url} 
                                  alt={item.name}
                                  width={40}
                                  height={40}
                                  className="object-cover w-full h-full cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => setSelectedImagePopup({ url: item.image_url!, name: item.name })}
                                />
                              ) : item.icon && (item.icon.startsWith('/') || item.icon.startsWith('http')) ? (
                                <Image 
                                  src={item.icon} 
                                  alt={item.name}
                                  width={32}
                                  height={32}
                                  className="object-contain"
                                />
                              ) : item.icon ? (
                                <span className="text-xl">{item.icon}</span>
                              ) : null}
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
                    ))
                  )}
                </div>
                
                {/* Show all unpaid orders if multiple exist - After Order Items */}
                {!unpaidOrdersLoading && unpaidOrders.length > 1 && (
                  <div className="mb-4 space-y-3 pt-4">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Individual Orders</h3>
                    {unpaidOrders.map((order, orderIndex) => (
                      <div key={order.id} className="bg-gradient-to-br from-orange-50 via-white to-orange-50/40 p-3 rounded-xl border border-primary-100 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-600">Order {orderIndex + 1}</span>
                          <span className="text-xs font-semibold text-primary-600">₹{order.total_amount?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="space-y-1.5">
                          {order.items && Array.isArray(order.items) && order.items.map((orderItem: any, itemIndex: number) => (
                            <div key={itemIndex} className="flex items-center justify-between text-xs">
                              <span className="text-gray-700">{orderItem.name || orderItem.item?.name || 'Item'}</span>
                              <span className="text-gray-600">× {orderItem.quantity || 1} = ₹{((orderItem.price || orderItem.item?.price || 0) * (orderItem.quantity || 1)).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Fixed Bottom Section */}
              <div className="p-4 sm:p-6 pt-2 sm:pt-2 border-t border-primary-100 bg-white/50 -mt-2">
                {/* Total - Only visible for Bill Generated or Bill Paid */}
                {(orderStatus === 'Bill Generated' || orderStatus === 'Bill Paid') && (
                  <div className="bg-gradient-to-br from-primary-50 via-accent-50 to-orange-50 rounded-2xl p-4 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-800">Total Amount</span>
                      <div className="text-right">
                        {isDiscountEligible && getOriginalTotalAmount() !== getTotalAmount() ? (
                          <>
                            <span className="text-xl line-through text-gray-400 mr-2">₹{getOriginalTotalAmount()}</span>
                            <span className="text-2xl font-bold text-green-600">₹{getTotalAmount()}</span>
                          </>
                        ) : (
                      <span className="text-2xl font-bold text-primary-600">₹{getTotalAmount()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  {/* More Food/Coffee Button */}
                <button
                  onClick={handleMoreFoodCoffee}
                  className="relative w-full py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl font-bold transition-all shadow-soft hover:shadow-soft-lg active:scale-95 overflow-hidden group/btn"
                >
                  <div className="absolute inset-0 gradient-primary"></div>
                  <span className="relative z-10 text-white">More Food/Coffee</span>
                </button>

                  {/* Book Snooker and Book WorkSpace Buttons - Side by Side */}
                  <div className="flex gap-2 w-full">
                    {/* Book Snooker Button - Left ~45% */}
                    <button
                      onClick={() => {
                        // Clear any existing snooker booking data to show empty form
                        removeSessionData('snooker_bookingDetails');
                        removeSessionData('snooker_bookingOrderId');
                        removeSessionData('snooker_showOrderSummary');
                        // Set flag to indicate we're starting a new booking (not restoring)
                        sessionStorage.setItem('startNewSnookerBooking', 'true');
                        
                        // Store customer info for snooker booking page to pre-fill
                        if (customerName && customerPhone) {
                          const phoneWithPrefix = customerPhone.startsWith('+91') ? customerPhone : `+91${customerPhone}`;
                          sessionStorage.setItem('customerName', customerName);
                          sessionStorage.setItem('customerPhone', phoneWithPrefix);
                          setSessionData('snooker_customerName', customerName);
                          setSessionData('snooker_customerPhone', phoneWithPrefix);
                        }
                        router.push('/book-snooker');
                      }}
                      className="relative flex-[0_0_45%] py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl font-bold transition-all shadow-soft hover:shadow-soft-lg active:scale-95 overflow-hidden group/btn"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl"></div>
                      <span className="relative z-10 text-white text-sm sm:text-base">Book Snooker</span>
                    </button>

                    {/* Book WorkSpace Button - Right ~55% */}
                    <button
                      onClick={() => {
                        // Clear any existing workspace booking data to show empty form
                        removeSessionData('workspace_bookingDetails');
                        removeSessionData('workspace_bookingOrderId');
                        removeSessionData('workspace_showOrderSummary');
                        // Set flag to indicate we're starting a new booking (not restoring)
                        sessionStorage.setItem('startNewWorkspaceBooking', 'true');
                        
                        // Store customer info for workspace booking page to pre-fill
                        if (customerName && customerPhone) {
                          const phoneWithPrefix = customerPhone.startsWith('+91') ? customerPhone : `+91${customerPhone}`;
                          sessionStorage.setItem('customerName', customerName);
                          sessionStorage.setItem('customerPhone', phoneWithPrefix);
                          setSessionData('workspace_customerName', customerName);
                          setSessionData('workspace_customerPhone', phoneWithPrefix);
                        }
                        router.push('/book-workspace');
                      }}
                      className="relative flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl font-bold transition-all shadow-soft hover:shadow-soft-lg active:scale-95 overflow-hidden group/btn"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl"></div>
                      <span className="relative z-10 text-white text-sm sm:text-base">Book WorkSpace</span>
                </button>
                  </div>

                  {/* Home Button */}
                  <button
                    onClick={() => {
                      // Store customer info in memory for future bookings (snooker/workspace)
                      if (customerName && customerPhone) {
                        const phoneWithPrefix = customerPhone.startsWith('+91') ? customerPhone : `+91${customerPhone}`;
                        sessionStorage.setItem('customerName', customerName);
                        sessionStorage.setItem('customerPhone', phoneWithPrefix);
                        // Store in 12-hour session storage for snooker and workspace bookings
                        setSessionData('snooker_customerName', customerName);
                        setSessionData('snooker_customerPhone', phoneWithPrefix);
                        setSessionData('workspace_customerName', customerName);
                        setSessionData('workspace_customerPhone', phoneWithPrefix);
                      }
                      router.push('/book-order');
                    }}
                    className="relative w-full py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl font-bold transition-all shadow-soft hover:shadow-soft-lg active:scale-95 overflow-hidden group/btn mt-3"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-700"></div>
                    <span className="relative z-10 text-white">Home</span>
                </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Subtle Bottom Banner */}
        <footer className="fixed bottom-0 left-0 right-0 z-0">
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

        {/* Order Message Dialog Popup - Removed */}

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
      {/* Back Button - Left Arrow (to Name Entry) - Mid Screen or Aligned with Checkout */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          navigateBack();
        }}
        className={`fixed left-2 md:left-4 -translate-y-1/2 z-[60] group/back touch-manipulation ${
          selectedItems.length > 0 ? '' : 'top-1/2'
        }`}
        style={{ 
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
          ...(selectedItems.length > 0 ? {
            top: selectedItems.length === 1
              ? 'calc(272px + env(safe-area-inset-top, 0px))' // Aligned with Checkout button center when 1 item
              : 'calc(306px + env(safe-area-inset-top, 0px))' // Aligned with Checkout button center when 2+ items
          } : {})
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

      {/* Customer Info Section - Below Header */}
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
        </div>
      </div>

      {/* Selected Items Section - Between Header and CheckOut Button - Sticky, overlays menu items */}
      {selectedItems.length > 0 && (
        <div className="w-full md:max-w-2xl lg:max-w-3xl px-4 md:px-6 sticky z-[9999] mt-1" style={{ top: 'calc(140px + env(safe-area-inset-top, 0px))' }}>
          <div 
            className="backdrop-blur-xl rounded-2xl shadow-2xl border-2 border-primary-200/50 overflow-hidden mb-4"
            style={{
              background: 'linear-gradient(to bottom, rgba(255, 237, 213, 0.95), rgba(254, 215, 170, 0.95), rgba(251, 191, 36, 0.90))',
              maxHeight: '120px', // Reduced from 140px
              marginTop: '4px', // Small top margin to create minimal gap from header
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
                  {(item.icon || item.image_url) && (
                    <div className="flex-shrink-0 w-5 h-5 rounded-md bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center shadow-sm border border-primary-100 overflow-hidden">
                      {item.show_image && item.image_url ? (
                        <Image 
                          src={item.image_url} 
                          alt={item.name}
                          width={20}
                          height={20}
                          className="object-cover w-full h-full cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setSelectedImagePopup({ url: item.image_url!, name: item.name })}
                        />
                      ) : item.icon && (item.icon.startsWith('/') || item.icon.startsWith('http')) ? (
                        <Image 
                          src={item.icon} 
                          alt={item.name}
                          width={14}
                          height={14}
                          className="object-contain"
                        />
                      ) : item.icon ? (
                        <span className="text-[10px]">{item.icon}</span>
                      ) : null}
                    </div>
                  )}
                  
                  {/* Item name - Smaller */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-800 truncate text-[11px] leading-tight">{item.name}</h4>
                    <p className="text-[9px] text-gray-500 leading-tight">
                      {isDiscountEligible && item.price !== getDiscountedPrice(item.price) ? (
                        <>
                          <span className="line-through text-gray-400">₹{item.price}</span>
                          <span className="ml-1 text-green-600 font-bold">₹{getDiscountedPrice(item.price)}</span> × {quantity}
                        </>
                      ) : (
                        <>₹{item.price} × {quantity}</>
                      )}
                    </p>
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

      {/* CheckOut Button - Below Selected Items, Above Tabs */}
      {selectedItems.length > 0 && (
        <div 
          className="w-full md:max-w-2xl lg:max-w-3xl px-4 md:px-6 mb-4 flex justify-center sticky z-[9998]" 
          style={{ 
            top: selectedItems.length === 1 
              ? 'calc(250px + env(safe-area-inset-top, 0px))' // Closer to Selected Items when only 1 item
              : 'calc(284px + env(safe-area-inset-top, 0px))' // Normal position for 2+ items
          }}
        >
          <button
            onClick={async () => {
              // PRIORITY 1: Check skipCheckoutDialog flag from sessionStorage first (persists across navigation)
              const savedSkipCheckout = sessionStorage.getItem('skipCheckoutDialog') === 'true';
              const shouldSkipDialog = skipCheckoutDialog || savedSkipCheckout;
              
              if (shouldSkipDialog) {
                // Get customer info from ALL possible sources (state, localStorage, sessionStorage, 12-hour session)
                const nameToUse = customerName || 
                                 getSessionData<string>('food_customerName') || 
                                 localStorage.getItem('customerName') ||
                                 sessionStorage.getItem('customerName') || 
                                 '';
                
                // Get phone from all sources and normalize it
                let phoneToUse = customerPhone || 
                                getSessionData<string>('food_customerPhone') || 
                                localStorage.getItem('customerPhone') ||
                                sessionStorage.getItem('customerPhone') || 
                                '';
                
                // If phone doesn't have +91 prefix, add it (handle both with and without prefix)
                if (phoneToUse && !phoneToUse.startsWith('+91')) {
                  // Remove any existing prefix and extract digits
                  const phoneDigits = phoneToUse.replace(/^\+?91?/, '').replace(/\D/g, '').slice(0, 10);
                  phoneToUse = phoneDigits.length === 10 ? `+91${phoneDigits}` : phoneToUse;
                }
                
                console.log('🔍 skipCheckoutDialog is true, checking customer info:', {
                  skipCheckoutDialog,
                  savedSkipCheckout,
                  customerName,
                  customerPhone,
                  nameToUse,
                  phoneToUse,
                  hasName: !!nameToUse,
                  hasPhone: !!phoneToUse,
                  phoneLength: phoneToUse ? (phoneToUse.startsWith('+91') ? phoneToUse.length - 3 : phoneToUse.length) : 0
                });
                
                if (nameToUse && phoneToUse) {
                  // Ensure phone has +91 prefix and is valid
                  let phoneWithPrefix = phoneToUse.startsWith('+91') ? phoneToUse : `+91${phoneToUse.replace(/^\+?91?/, '').replace(/\D/g, '').slice(0, 10)}`;
                  
                  // Validate phone number (should be +91 followed by 10 digits = 13 characters total)
                  const phoneDigits = phoneWithPrefix.startsWith('+91') ? phoneWithPrefix.slice(3) : phoneWithPrefix;
                  if (phoneDigits.length !== 10) {
                    // Invalid phone, reset flag and show dialog
                    console.warn('⚠️ Invalid phone number, showing dialog. Phone:', phoneWithPrefix, 'Digits:', phoneDigits);
                    setSkipCheckoutDialog(false);
                    sessionStorage.removeItem('skipCheckoutDialog');
                    setCheckoutName(nameToUse);
                    setCheckoutPhone(phoneDigits);
                    setShowCheckoutDialog(true);
                    return;
                  }
                  
                  // Update state with customer info
                  setCustomerName(nameToUse);
                  setCustomerPhone(phoneDigits);
                  
                  console.log('✅ Placing order directly without dialog:', { nameToUse, phoneWithPrefix });
                  
                  // Place order directly without showing dialog
                  await processOrderPlacement(nameToUse, phoneWithPrefix);
                  setSkipCheckoutDialog(false); // Reset flag after use
                  sessionStorage.removeItem('skipCheckoutDialog'); // Clear persisted flag
                  return;
                } else {
                  // If no customer info found, reset flag and show dialog
                  console.warn('⚠️ skipCheckoutDialog is true but no customer info found, showing dialog', {
                    nameToUse,
                    phoneToUse
                  });
                  setSkipCheckoutDialog(false);
                  sessionStorage.removeItem('skipCheckoutDialog');
                  setShowCheckoutDialog(true);
                  return;
                }
              }
              
              // PRIORITY 2: Check if customer details are available from sessionStorage (from workspace/snooker booking)
              const sessionName = sessionStorage.getItem('customerName');
              const sessionPhone = sessionStorage.getItem('customerPhone');
              const fromBookingPage = sessionStorage.getItem('fromBookingPage') === 'true';
              
              // If coming from booking page, verify discount eligibility
              if (fromBookingPage && sessionPhone) {
                try {
                  // Normalize phone number: ensure it has +91 prefix
                  let phoneForApi = sessionPhone.replace(/\s+/g, '').replace(/-/g, '');
                  if (!phoneForApi.startsWith('+91')) {
                    phoneForApi = phoneForApi.replace(/^(0|91)/, '');
                    phoneForApi = `+91${phoneForApi}`;
                  }
                  
                  const snookerResponse = await fetch(`/api/snooker-bookings/by-phone?phone=${encodeURIComponent(phoneForApi)}`);
                  const snookerResult = snookerResponse.ok ? await snookerResponse.json() : { data: null };
                  
                  const workspaceResponse = await fetch(`/api/workspace-bookings/by-phone?phone=${encodeURIComponent(phoneForApi)}`);
                  const workspaceResult = workspaceResponse.ok ? await workspaceResponse.json() : { data: null };
                  
                  if (snookerResult.data || workspaceResult.data) {
                    setIsDiscountEligible(true);
                  } else {
                    setIsDiscountEligible(false);
                  }
                  // Clear the flag after checking
                  sessionStorage.removeItem('fromBookingPage');
                } catch (error) {
                  console.error('Error checking booking eligibility:', error);
                  setIsDiscountEligible(false);
                }
              }
              
              if (sessionName && sessionPhone) {
                // Customer details available - directly place order without showing dialog
                // Validate phone number
                const phoneDigits = sessionPhone.startsWith('+91') ? sessionPhone.slice(3) : sessionPhone;
                if (phoneDigits.length === 10) {
                  // Update customer name and phone
                  setCustomerName(sessionName);
                  localStorage.setItem('customerName', sessionName);
                  setCustomerPhone(phoneDigits);
                  localStorage.setItem('customerPhone', sessionPhone);
                  
                  // Directly place order using sessionStorage data
                  await processOrderPlacement(sessionName, sessionPhone);
                } else {
                  // Invalid phone, show dialog
                  setCheckoutName(sessionName);
                  setCheckoutPhone(phoneDigits);
                  setShowCheckoutDialog(true);
                }
              } else {
                // No sessionStorage data - show checkout dialog
                // Also clear discount eligibility if not from booking page
                if (!fromBookingPage) {
                  setIsDiscountEligible(false);
                  removeSessionData('food_discountEligible');
                }
                if (sessionName) {
                  setCheckoutName(sessionName);
                }
                if (sessionPhone) {
                  // Remove +91 prefix if present (for display in input field)
                  const phoneWithoutPrefix = sessionPhone.startsWith('+91') ? sessionPhone.slice(3) : sessionPhone;
                  setCheckoutPhone(phoneWithoutPrefix);
                }
                setShowCheckoutDialog(true);
              }
            }}
            className="relative w-[45%] min-w-[140px] max-w-[240px] px-4 py-2.5 md:px-5 md:py-3 rounded-xl font-bold text-sm md:text-base transition-all shadow-lg overflow-hidden group/checkout active:scale-95 border-2 border-primary-300"
            style={{
              boxShadow: '0 4px 20px rgba(168, 85, 247, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.2)',
            }}
          >
            <div 
              className="absolute inset-0 group-hover/checkout:opacity-90 transition-all"
              style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)'
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent"></div>
            <span className="relative z-10 text-white flex items-center justify-center gap-1.5 font-extrabold drop-shadow-lg whitespace-nowrap" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 md:h-6 md:w-6 text-white" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>CheckOut</span>
            </span>
          </button>
        </div>
      )}

      {/* Expandable Category Accordion - Mobile Container - Scrolls behind selected items window */}
      <div 
        className="w-full md:max-w-2xl lg:max-w-3xl space-y-1.5"
        style={{
          // Add top margin to create space from CheckOut button or selected items window
          marginTop: selectedItems.length === 1 
            ? '45px' // Smaller gap when 1 item (CheckOut button is higher)
            : selectedItems.length > 0 
            ? '50px' // Normal gap when 2+ items
            : '8px', // Gap from header when no items
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
            'ADDON': 'Coffee Add-Ons',
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

              {/* Expanded Menu Items - Natural scrolling, tabs move together */}
              {isExpanded && (
                <div 
                  className="mt-1.5 space-y-1.5" 
                  style={{ 
                    paddingLeft: 'calc(0.25rem * 0.68)',
                    paddingBottom: '20px',
                    overflowX: 'hidden',
                    // Removed maxHeight and overflowY to allow natural page scrolling
                    // Menu items will scroll with the main page underneath sticky elements
                    // When scrolling up, tabs will naturally move up together
                    position: 'relative',
                    zIndex: 1, // Lower than selected items window
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
                              {/* Icon or Image */}
                              {(item.icon || item.image_url) && (
                                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm border overflow-hidden ${
                                  isUnavailable 
                                    ? 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300' 
                                    : 'bg-gradient-to-br from-primary-50 to-accent-50 border-primary-100'
                                }`}>
                                  {item.show_image && item.image_url ? (
                                    <Image 
                                      src={item.image_url} 
                                      alt={item.name}
                                      width={32}
                                      height={32}
                                      className="object-cover w-full h-full cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => setSelectedImagePopup({ url: item.image_url!, name: item.name })}
                                    />
                                  ) : item.icon && (item.icon.startsWith('/') || item.icon.startsWith('http')) ? (
                                    <Image 
                                      src={item.icon} 
                                      alt={item.name}
                                      width={24}
                                      height={24}
                                      className="object-contain"
                                    />
                                  ) : item.icon ? (
                                    <span className="text-lg">{item.icon}</span>
                                  ) : null}
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
                                  }`}>
                                    {isDiscountEligible && item.price !== getDiscountedPrice(item.price) ? (
                                      <>
                                        <span className="line-through text-gray-400 text-sm mr-1">₹{item.price}</span>
                                        <span className="text-green-600">₹{getDiscountedPrice(item.price)}</span>
                                      </>
                                    ) : (
                                      <span>₹{item.price}</span>
                                    )}
                                  </span>
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

      {/* CheckOut Dialog Popup */}
      {showCheckoutDialog && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-300"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={(e) => {
            // Close when clicking outside
            if (e.target === e.currentTarget) {
              setShowCheckoutDialog(false);
            }
          }}
        >
          <div 
            className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full transform transition-all animate-in zoom-in-95 duration-300 overflow-hidden"
          >
            {/* Orange corner lining on all 4 edges */}
            <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-orange-500 rounded-tl-2xl"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-orange-500 rounded-tr-2xl"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-orange-500 rounded-bl-2xl"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-orange-500 rounded-br-2xl"></div>
            </div>

            {/* Close Button - Red X */}
            <button
              onClick={() => setShowCheckoutDialog(false)}
              className="absolute top-4 right-4 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full p-1.5 transition-all z-10"
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

            {/* Form Content */}
            <div>
              <form onSubmit={(e) => { e.preventDefault(); handlePlaceOrder(); }} className="space-y-4 sm:space-y-6">
                {/* Name Input */}
                <div>
                  <label htmlFor="checkout-name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group/input">
                    {/* Elite border frame */}
                    <div className="absolute -inset-px bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400 rounded-xl opacity-0 group-hover/input:opacity-100 transition duration-300"></div>
                    
                    <input
                      type="text"
                      id="checkout-name"
                      value={checkoutName}
                      onChange={(e) => setCheckoutName(e.target.value)}
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
                  <label htmlFor="checkout-phone" className="block text-sm font-semibold text-gray-700 mb-1.5">
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
                      id="checkout-phone"
                      value={checkoutPhone}
                      onChange={(e) => {
                        // Only allow numbers, max 10 digits
                        const numericValue = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setCheckoutPhone(numericValue);
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
                  <p className="text-xs text-gray-600 mt-1.5 italic font-bold text-center">
                    *Details needed to notify when your order is ready!
                  </p>
                </div>

                {/* Place Order Button - Narrowed by 30% on each side (40% width total) */}
                <div className="flex justify-center">
                  <button
                    type="submit"
                    className="relative w-[40%] group/btn transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99]"
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
                      
                      {/* Button content - Single line text, no icon */}
                      <span className="relative flex items-center justify-center text-white drop-shadow-lg whitespace-nowrap">
                        <span className="text-sm sm:text-base font-bold">Place Order</span>
                      </span>
                    </div>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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

      {/* Image Popup Modal */}
      {selectedImagePopup && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedImagePopup(null)}
        >
          {/* Close Button */}
          <button
            onClick={() => setSelectedImagePopup(null)}
            className="absolute top-4 right-4 z-[101] bg-white/90 hover:bg-white text-gray-800 rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-all hover:scale-110"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image Container */}
          <div
            className="relative max-w-4xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white/10 backdrop-blur-md p-2">
              <Image
                src={selectedImagePopup.url}
                alt={selectedImagePopup.name}
                width={800}
                height={600}
                className="w-full h-auto object-contain rounded-xl"
                unoptimized
              />
              {/* Item Name Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent p-4 rounded-b-xl">
                <p className="text-white font-bold text-lg md:text-xl text-center">
                  {selectedImagePopup.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
