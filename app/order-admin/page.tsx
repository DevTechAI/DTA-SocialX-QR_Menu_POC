'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

interface OrderItem {
  menu_item_id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phno: string;
  items: OrderItem[];
  total_amount: number;
  status: 'received' | 'accepted' | 'rejected' | 'delivered' | 'paid' | 'unpaid';
  created_at: string;
  table_number?: string;
}

const statusConfig = {
  received: {
    label: 'Received',
    color: 'border-yellow-300',
    cardBg: 'bg-gradient-to-br from-yellow-50 via-yellow-100/70 to-orange-50/80',
    textColor: 'text-yellow-700',
    badge: 'bg-gradient-to-r from-yellow-500 to-orange-500',
    icon: '⏳',
  },
  accepted: {
    label: 'Accepted',
    color: 'border-blue-300',
    cardBg: 'bg-gradient-to-br from-blue-50 via-blue-100/70 to-indigo-50/80',
    textColor: 'text-blue-700',
    badge: 'bg-gradient-to-r from-blue-500 to-indigo-500',
    icon: '✅',
  },
  rejected: {
    label: 'Rejected',
    color: 'border-red-400',
    cardBg: 'bg-gradient-to-br from-red-50 via-red-100/70 to-rose-50/80',
    textColor: 'text-red-800',
    badge: 'bg-gradient-to-r from-red-600 to-rose-600',
    icon: '❌',
  },
  delivered: {
    label: 'Delivered',
    color: 'border-green-300',
    cardBg: 'bg-gradient-to-br from-green-50 via-green-100/70 to-emerald-50/80',
    textColor: 'text-green-700',
    badge: 'bg-gradient-to-r from-green-500 to-emerald-500',
    icon: '✅',
  },
  paid: {
    label: 'Paid',
    color: 'border-gray-300',
    cardBg: 'bg-gradient-to-br from-gray-50 via-gray-100/70 to-slate-50/80',
    textColor: 'text-gray-700',
    badge: 'bg-gradient-to-r from-gray-500 to-slate-500',
    icon: '💰',
  },
  unpaid: {
    label: 'Unpaid',
    color: 'border-red-300',
    cardBg: 'bg-gradient-to-br from-red-50 via-orange-100/70 to-red-50/80',
    textColor: 'text-red-700',
    badge: 'bg-gradient-to-r from-red-500 to-orange-500',
    icon: '💳',
  },
};

interface SnookerBooking {
  snooker_order_id: string;
  customer_name: string;
  customer_phno: string;
  snooker_board_id: string;
  order_status: string;
  start_date_time: string;
  end_date_time: string | null;
  players_count: number;
  created_at: string;
  snooker_board_menu_items?: {
    board_name: string;
    type: string;
    given_duration_for_100inr: number;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isItemMetricsExpanded, setIsItemMetricsExpanded] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [amountView, setAmountView] = useState<'ordered' | 'settled'>('settled');
  const [authChecked, setAuthChecked] = useState(false);
  const [bypassAuth, setBypassAuth] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [previousOrders, setPreviousOrders] = useState<Order[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    // Load from localStorage, default to true
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notificationSoundEnabled');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });
  const [activeTab, setActiveTab] = useState<'food' | 'snooker' | 'workspace' | 'billing'>('food');
  const [snookerBookings, setSnookerBookings] = useState<SnookerBooking[]>([]);
  const [snookerLoading, setSnookerLoading] = useState(true);
  const [expandedSnookerBookings, setExpandedSnookerBookings] = useState<Set<string>>(new Set());
  const [newSnookerBookingsCount, setNewSnookerBookingsCount] = useState(0);
  const [previousSnookerBookings, setPreviousSnookerBookings] = useState<SnookerBooking[]>([]);
  
  // Continuous notification sound state
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [pendingSnookerCount, setPendingSnookerCount] = useState(0);
  const [pendingWorkspaceCount, setPendingWorkspaceCount] = useState(0);
  const [pendingBillingCount, setPendingBillingCount] = useState(0);
  const soundIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pendingOrdersRef = useRef(0);
  const pendingSnookerRef = useRef(0);
  const pendingWorkspaceRef = useRef(0);
  const pendingBillingRef = useRef(0);
  
  // Workspace bookings state
  interface WorkspaceBooking {
    workspace_order_id: string;
    customer_name: string;
    customer_phno: string;
    workspace_seat_id: string;
    seats_count: number;
    order_date: string;
    order_status: 'Received' | 'Accepted' | 'Paid' | 'Delivered' | 'Rejected';
    created_at: string;
    workspace_seat_menu_items?: {
      workspace_seat_id: string;
      workspace_seat_value: number;
    };
  }
  const [workspaceBookings, setWorkspaceBookings] = useState<WorkspaceBooking[]>([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [expandedWorkspaceBookings, setExpandedWorkspaceBookings] = useState<Set<string>>(new Set());
  
  // Customer Billing state
  interface CustomerBilling {
    customer_phno: string;
    customer_name: string;
    total_ordered_value_at_socialx: number;
    order_history_json: Array<{
      order_date: string;
      Customer_PhNo: string;
      Customer_Name: string;
      allorder_value: number;
      FoodOrderUUID?: string;
      WorkSpaceOrderUUID?: string;
      SnookerOrderUUID?: string;
      allOrder_Status: 'PAID' | 'UNPAID';
      foodOrders?: any[];
      snookerBookings?: any[];
      workspaceBookings?: any[];
    }>;
    latestdate_allorder_json: {
      order_date: string;
      Customer_PhNo: string;
      Customer_Name: string;
      allorder_value: number;
      FoodOrderUUID?: string;
      WorkSpaceOrderUUID?: string;
      SnookerOrderUUID?: string;
      allOrder_Status: 'PAID' | 'UNPAID';
      foodOrders?: any[];
      snookerBookings?: any[];
      workspaceBookings?: any[];
    };
    latestdate_allorder_value: number;
    latestdate_allorder_status: 'PAID' | 'UNPAID';
    created_at: string;
    updated_at: string;
  }
  const [customerBillings, setCustomerBillings] = useState<CustomerBilling[]>([]);
  const [billingLoading, setBillingLoading] = useState(true);
  const [expandedBillings, setExpandedBillings] = useState<Set<string>>(new Set());
  const [expandedSubCards, setExpandedSubCards] = useState<Set<string>>(new Set());
  
  // Use ref to always have the current soundEnabled value (avoids stale closures)
  const soundEnabledRef = useRef(soundEnabled);
  const previousOrdersRef = useRef<Order[]>([]);
  const newOrdersCountRef = useRef(0);
  const previousSnookerBookingsRef = useRef<SnookerBooking[]>([]);
  const newSnookerBookingsCountRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Preload audio on mount
  useEffect(() => {
    // Preload the audio file for better performance and to avoid autoplay issues
    const audio = new Audio('/sounds/order-alert.mp3');
    audio.preload = 'auto';
    audio.volume = 0.7;
    // Try to load the audio (this helps with autoplay policies)
    audio.load();
    audioRef.current = audio;
    
    // Log audio readiness
    audio.addEventListener('canplaythrough', () => {
      console.log('✅ Sound notification audio loaded and ready');
    });
    
    audio.addEventListener('error', (e) => {
      console.error('❌ Sound notification audio error:', e);
    });
    
    return () => {
      // Cleanup
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
  
  // Update refs whenever state changes
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

    // Update refs for snooker bookings
    useEffect(() => {
      previousSnookerBookingsRef.current = previousSnookerBookings;
    }, [previousSnookerBookings]);

    useEffect(() => {
      newSnookerBookingsCountRef.current = newSnookerBookingsCount;
    }, [newSnookerBookingsCount]);
  
  useEffect(() => {
    previousOrdersRef.current = previousOrders;
  }, [previousOrders]);
  
  useEffect(() => {
    newOrdersCountRef.current = newOrdersCount;
  }, [newOrdersCount]);

  // Update refs for pending orders
  useEffect(() => {
    pendingOrdersRef.current = pendingOrdersCount;
  }, [pendingOrdersCount]);

  useEffect(() => {
    pendingSnookerRef.current = pendingSnookerCount;
  }, [pendingSnookerCount]);

  useEffect(() => {
    pendingWorkspaceRef.current = pendingWorkspaceCount;
  }, [pendingWorkspaceCount]);

  useEffect(() => {
    pendingBillingRef.current = pendingBillingCount;
  }, [pendingBillingCount]);

  // Continuous notification sound - plays until all pending orders are accepted
  useEffect(() => {
    const totalPending = pendingOrdersCount + pendingSnookerCount + pendingWorkspaceCount + pendingBillingCount;
    
    // Clear existing interval if any
    if (soundIntervalRef.current) {
      clearInterval(soundIntervalRef.current);
      soundIntervalRef.current = null;
    }

    // If there are pending orders and sound is enabled, start continuous notification
    if (totalPending > 0 && soundEnabledRef.current) {
      console.log(`🔔 Starting continuous notification for ${totalPending} pending order(s)`);
      
      // Play immediately
      playAlertSound();
      
      // Then play every 3 seconds until all orders are accepted
      soundIntervalRef.current = setInterval(() => {
        const currentPending = pendingOrdersRef.current + pendingSnookerRef.current + pendingWorkspaceRef.current + pendingBillingRef.current;
        
        if (currentPending > 0 && soundEnabledRef.current) {
          playAlertSound();
        } else {
          // Stop if no pending orders or sound disabled
          if (soundIntervalRef.current) {
            clearInterval(soundIntervalRef.current);
            soundIntervalRef.current = null;
            console.log('🔇 Stopped continuous notification - no pending orders');
          }
        }
      }, 3000); // Play every 3 seconds
    } else {
      console.log('🔇 Continuous notification stopped - no pending orders or sound disabled');
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (soundIntervalRef.current) {
        clearInterval(soundIntervalRef.current);
        soundIntervalRef.current = null;
      }
    };
  }, [pendingOrdersCount, pendingSnookerCount, pendingWorkspaceCount, soundEnabled]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('admin_bypass');
    // Clear bypass cookie
    document.cookie = 'admin_bypass=; path=/; max-age=0';
    router.push('/auth/signin');
  };

  // Format phone number for WhatsApp link
  const formatPhoneForWhatsApp = (phoneNumber: string): string => {
    if (!phoneNumber || phoneNumber === 'N/A') return '';
    
    // Remove all spaces, dashes, and other non-digit characters except +
    let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Remove +91 if present at the start
    if (cleaned.startsWith('+91')) {
      cleaned = cleaned.substring(3);
    } else if (cleaned.startsWith('91') && cleaned.length > 10) {
      cleaned = cleaned.substring(2);
    }
    
    // Remove leading 0 if present (for Indian numbers)
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    // Ensure we have a valid 10-digit number
    if (cleaned.length === 10 && /^\d+$/.test(cleaned)) {
      return `+91${cleaned}`;
    }
    
    // If already in international format, return as is
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    
    // Fallback: return with +91 prefix if it's all digits
    if (/^\d+$/.test(cleaned)) {
      return `+91${cleaned}`;
    }
    
    return '';
  };

  // Format WhatsApp link with pre-filled message
  const formatWhatsAppMessageLink = (phoneNumber: string, customerName: string): string => {
    const formattedPhone = formatPhoneForWhatsApp(phoneNumber);
    if (!formattedPhone) return '';
    
    const message = `Hey ${customerName}, 
your order is ready!
Please collect it from the counter. 
-socialx kitchen`;
    
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  };

  // Bypass login is disabled - authentication is required
  // This function is kept for reference but should not be used
  const handleBypassLogin = () => {
    console.log('⚠️ Bypass login is disabled. Please use proper authentication.');
    alert('Bypass login is disabled. Please sign in with Google or email/password.');
  };

  // Check authentication on mount
  useEffect(() => {
    // Display stored OAuth logs from sessionStorage
    const storedLogs = sessionStorage.getItem('oauth_logs');
    if (storedLogs) {
      try {
        const logs = JSON.parse(storedLogs);
        console.log('═══════════════════════════════════════════════════════');
        console.log('📋 OAUTH FLOW LOGS (from previous steps)');
        console.log('═══════════════════════════════════════════════════════');
        logs.forEach((log: { timestamp: string; message: string }) => {
          console.log(`[${new Date(log.timestamp).toLocaleTimeString()}] ${log.message}`);
        });
        console.log('═══════════════════════════════════════════════════════');
        console.log('💡 TIP: Enable "Preserve log" in browser console to keep logs across page navigations');
        console.log('═══════════════════════════════════════════════════════');
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    // Make logs accessible globally for debugging
    if (typeof window !== 'undefined') {
      (window as any).viewOAuthLogs = () => {
        const logs = sessionStorage.getItem('oauth_logs');
        if (logs) {
          console.log('═══════════════════════════════════════════════════════');
          console.log('📋 ALL OAUTH LOGS');
          console.log('═══════════════════════════════════════════════════════');
          JSON.parse(logs).forEach((log: { timestamp: string; message: string }) => {
            console.log(`[${new Date(log.timestamp).toLocaleString()}] ${log.message}`);
          });
          console.log('═══════════════════════════════════════════════════════');
        } else {
          console.log('No OAuth logs found in sessionStorage');
        }
      };
      
      (window as any).clearOAuthLogs = () => {
        sessionStorage.removeItem('oauth_logs');
        console.log('✅ OAuth logs cleared');
      };
    }

    // Only check bypass if explicitly enabled via environment variable
    // Note: We can't access process.env.ALLOW_ADMIN_BYPASS on client-side directly,
    // but middleware will handle the actual protection. This is just for UI state.
    // If bypass is disabled, we should always require proper authentication.
    const bypassEnabled = false; // Bypass is disabled - always require authentication
    
    if (bypassEnabled) {
      console.log('⚠️ Bypass mode enabled');
      setBypassAuth(true);
      setAuthChecked(true);
      return;
    }

    const checkAuth = async () => {
      // Store logs in sessionStorage to persist across redirects
      const logToStorage = (message: string) => {
        try {
          const logs = JSON.parse(sessionStorage.getItem('oauth_logs') || '[]');
          logs.push({ timestamp: new Date().toISOString(), message });
          sessionStorage.setItem('oauth_logs', JSON.stringify(logs.slice(-50))); // Keep last 50 logs
        } catch (e) {
          // Ignore storage errors
        }
      };
      
      try {
        console.log('═══════════════════════════════════════════════════════');
        console.log('🔐 ORDER-ADMIN PAGE - Verifying access');
        console.log('═══════════════════════════════════════════════════════');
        console.log('🔄 Step 1: Checking authentication...');
        
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          console.log('═══════════════════════════════════════════════════════');
          console.log('❌ PAGE CHECK - Authentication failed');
          console.log('═══════════════════════════════════════════════════════');
          console.log('  📧 User email: none');
          console.log('  ❌ Error:', error?.message || 'No user found');
          console.log('  🔒 Redirecting to sign-in page');
          router.push('/auth/signin');
          return;
        }

        console.log('✅ Step 1: User authenticated');
        console.log('  📧 Email:', user.email);
        console.log('  🆔 User ID:', user.id);
        logToStorage(`✅ User authenticated: ${user.email}`);

        // Check if user is authorized (case-insensitive)
        console.log('🔄 Step 2: Checking authorization in database...');
        const userEmail = user.email?.toLowerCase().trim();
        console.log('  🔍 Searching for email:', userEmail);
        const { data: authorizedEmail, error: authError } = await supabase
          .from('authorized_emails')
          .select('role')
          .ilike('email', userEmail || '')
          .single();

        if (authError) {
          console.log('═══════════════════════════════════════════════════════');
          console.log('❌ PAGE CHECK - Database query error');
          console.log('═══════════════════════════════════════════════════════');
          console.log('  📧 Email:', user.email);
          console.log('  ❌ Error:', authError.message);
          console.log('  💡 This might be an RLS policy issue. Check Supabase RLS policies.');
          console.log('  🔒 Redirecting to unauthorized page');
          logToStorage(`❌ Authorization query error: ${authError.message}`);
          router.push('/auth/unauthorized');
          return;
        }

        if (!authorizedEmail) {
          console.log('═══════════════════════════════════════════════════════');
          console.log('❌ PAGE CHECK - Authorization failed');
          console.log('═══════════════════════════════════════════════════════');
          console.log('  📧 Email:', user.email);
          console.log('  ❌ Email not found in authorized_emails table');
          console.log('  🔒 Redirecting to unauthorized page');
          logToStorage(`❌ Authorization failed: ${user.email} not in authorized_emails`);
          router.push('/auth/unauthorized');
          return;
        }

        console.log('✅ Step 2: User is authorized');
        console.log('  👤 Role:', authorizedEmail.role);
        console.log('═══════════════════════════════════════════════════════');
        console.log('✅ ORDER-ADMIN PAGE - Access verified');
        console.log('═══════════════════════════════════════════════════════');
        console.log('  📧 User:', user.email);
        console.log('  👤 Role:', authorizedEmail.role);
        console.log('  ✅ Dashboard access granted');
        console.log('  📊 Loading orders and dashboard data...');
        console.log('═══════════════════════════════════════════════════════');
        
        // Store success in sessionStorage
        logToStorage(`✅ OAuth login successful! User: ${user.email}, Role: ${authorizedEmail.role}`);
        logToStorage(`✅ Access granted to /order-admin page`);
        
        // Clear logs after successful login (optional - comment out if you want to keep them)
        // sessionStorage.removeItem('oauth_logs');
        
        setAuthChecked(true);
      } catch (err) {
        console.error('═══════════════════════════════════════════════════════');
        console.error('❌ PAGE CHECK - Error occurred');
        console.error('═══════════════════════════════════════════════════════');
        console.error('  Error:', err);
        router.push('/auth/signin');
      }
    };

    // Add a small delay to ensure cookies are available after redirect
    const timer = setTimeout(() => {
      checkAuth();
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    if (!authChecked) return; // Wait for auth check before fetching orders
    
    // Initial fetch with loading state
    fetchOrders(true);
    
    // Set up polling interval (every 10 seconds) - background refresh without loading
    const interval = setInterval(() => fetchOrders(false), 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Request notification permission on mount and register service worker for push notifications
  useEffect(() => {
    // Request notification permission
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
          if (permission === 'granted') {
            console.log('✅ Notification permission granted');
          }
        });
      } else {
        setNotificationPermission(Notification.permission);
      }
    }

    // Register service worker for better push notification support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('✅ Service Worker registered:', registration.scope);
        })
        .catch(error => {
          console.log('⚠️ Service Worker registration failed (optional):', error);
          // This is optional - notifications will still work without it
        });
    }
    
    // Unlock audio on first user interaction (required by browser autoplay policies)
    const unlockAudio = async () => {
      // Try to play and immediately pause to unlock audio
      if (audioRef.current) {
        try {
          await audioRef.current.play();
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          console.log('✅ Audio unlocked for notifications');
        } catch (error) {
          console.log('⚠️ Could not unlock audio:', error);
        }
      }
      
      // Also unlock AudioContext for beep fallback
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const testContext = new AudioContextClass();
        if (testContext.state === 'suspended') {
          await testContext.resume();
          console.log('✅ AudioContext unlocked for beep fallback');
        }
        testContext.close();
      } catch (error) {
        // Ignore errors
      }
    };
    
    // Add event listeners for user interaction to unlock audio
    const events = ['click', 'touchstart', 'keydown'];
    const unlockHandler = () => {
      unlockAudio();
      // Remove listeners after first interaction
      events.forEach(event => {
        document.removeEventListener(event, unlockHandler);
      });
    };
    
    events.forEach(event => {
      document.addEventListener(event, unlockHandler, { once: true });
    });
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, unlockHandler);
      });
    };
  }, []);

  // Update browser tab title with new orders count
  const updateTabTitle = (foodCount: number, snookerCount: number = 0) => {
    const totalCount = foodCount + snookerCount;
    if (totalCount > 0) {
      document.title = `New Orders (${totalCount}) - Order Admin`;
    } else {
      document.title = 'Order Admin Dashboard';
    }
  };

  // Toggle sound notification
  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('notificationSoundEnabled', String(newValue));
  };

  // Play alert sound when new order is received (using MP3 file with fallback)
  const playAlertSound = () => {
    // Check if sound is enabled (use ref to get current value, avoiding stale closures)
    if (!soundEnabledRef.current) {
      console.log('🔇 Sound notification is disabled');
      return;
    }
    
    console.log('🔔 Attempting to play sound notification...');
    
    // Try to use preloaded audio first
    if (audioRef.current) {
      const audio = audioRef.current;
      
      // Reset audio to beginning
      audio.currentTime = 0;
      
      // Try to play
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('✅ Sound notification played successfully');
          })
          .catch((error) => {
            console.warn('⚠️ Could not play preloaded MP3 audio:', error);
            console.log('🔄 Falling back to beep sound...');
            // Fallback to generated beep sound if MP3 fails
            playBeepSound();
          });
      }
    } else {
      // If preloaded audio doesn't exist, try creating a new one
      try {
        console.log('⚠️ Preloaded audio not available, creating new audio element...');
        const audio = new Audio('/sounds/order-alert.mp3');
        audio.volume = 0.7;
        
        audio.play().catch((error) => {
          console.warn('⚠️ Could not play new MP3 audio file:', error);
          console.log('🔄 Falling back to beep sound...');
          playBeepSound();
        });
      } catch (error) {
        console.warn('⚠️ Could not initialize audio:', error);
        console.log('🔄 Falling back to beep sound...');
        playBeepSound();
      }
    }
  };

  // Fallback beep sound (used if MP3 file fails to load)
  const playBeepSound = async () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      
      // Resume AudioContext if it's suspended (browser autoplay policy)
      if (audioContext.state === 'suspended') {
        console.log('🔄 AudioContext is suspended, attempting to resume...');
        await audioContext.resume();
        console.log('✅ AudioContext resumed');
      }
      
      // Play 3 beeps for better attention
      [0, 200, 400].forEach((delay, index) => {
        setTimeout(() => {
          try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Slightly different pitch for each beep (800Hz, 900Hz, 1000Hz)
            oscillator.frequency.value = 800 + (index * 100);
            oscillator.type = 'sine';

            // Louder and longer for better noticeability
            gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.4);
            
            if (index === 0) {
              console.log('✅ Fallback beep sound playing');
            }
          } catch (beepError) {
            console.error('❌ Error creating beep:', beepError);
          }
        }, delay);
      });
    } catch (error) {
      console.error('❌ Could not play fallback beep sound:', error);
      console.log('💡 Tip: Browser may be blocking audio. Try clicking anywhere on the page first to enable audio.');
    }
  };

  // Show desktop notification for new order (works even when browser is in background)
  const showNewOrderNotification = (order: Order) => {
    if (notificationPermission === 'granted') {
      const itemsSummary = order.items
        .slice(0, 3)
        .map(item => `${item.name} (x${item.quantity})`)
        .join(', ');
      const moreItems = order.items.length > 3 ? ` +${order.items.length - 3} more` : '';

      const notificationBody = [
        `Customer: ${order.customer_name}`,
        `Items: ${itemsSummary}${moreItems}`,
        `Total: ₹${order.total_amount}`,
        order.table_number ? `Table: ${order.table_number}` : ''
      ].filter(Boolean).join('\n');

      const notificationOptions: NotificationOptions = {
        body: notificationBody,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `order-${order.id}`, // Prevent duplicate notifications
        requireInteraction: false,
        silent: false, // Ensure sound plays (browser may play notification sound)
      };

      // Add vibrate for mobile (TypeScript doesn't recognize it but browsers do)
      if ('vibrate' in navigator) {
        (notificationOptions as any).vibrate = [200, 100, 200];
      }

      const notification = new Notification('New Order Received! 🎉', notificationOptions);

      // Handle notification click - focus the window
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);
    }
  };

  const fetchOrders = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      // Fetch orders for current business day (8 AM to 8 AM)
      const response = await fetch('/api/orders?business_day=true');
      if (response.ok) {
        const data = await response.json();
        const parsedData = data.map((order: any) => {
          // Handle both customer_phno and customer_phNo (for backward compatibility)
          const phoneNumber = order.customer_phno || order.customer_phNo || 'N/A';
          return {
            ...order,
            customer_phno: phoneNumber, // Ensure it's always customer_phno
            items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
          };
        });
        
        // Detect new orders and track if we should play sound
        let shouldPlaySound = false;
        let newOrders: Order[] = [];
        
        // Use refs to get latest values (avoid stale closures)
        const currentPreviousOrders = previousOrdersRef.current;
        const currentNewOrdersCount = newOrdersCountRef.current;
        
        if (currentPreviousOrders.length > 0 && parsedData.length > currentPreviousOrders.length) {
          newOrders = parsedData.filter(
            (newOrder: Order) => 
              !currentPreviousOrders.some(prevOrder => prevOrder.id === newOrder.id)
          );

          // Play sound when new orders are detected
          if (newOrders.length > 0) {
            shouldPlaySound = true;
            playAlertSound();
          }
          
          newOrders.forEach((order: Order) => {
            // Show notification (requires permission)
            showNewOrderNotification(order);
            
            // Also send message to service worker for background notifications
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage({
                type: 'NEW_ORDER',
                order: {
                  id: order.id,
                  customer_name: order.customer_name,
                  total_amount: order.total_amount,
                  items: order.items.slice(0, 3).map(item => `${item.name} (x${item.quantity})`).join(', '),
                  table_number: order.table_number,
                }
              });
            }
          });
        }

        setPreviousOrders(parsedData);
        setOrders(parsedData);

        // Calculate new orders count (received but not accepted)
        const receivedCount = parsedData.filter(
          (order: Order) => order.status === 'received'
        ).length;
        
        // Update pending orders count - this will trigger continuous notification
        setPendingOrdersCount(receivedCount);
        
        // Play sound if count is 1 or greater (and count increased)
        // This ensures sound plays when count goes from 0 to 1 or more
        // Only play if we didn't already play for new orders detection above
        const previousCount = currentNewOrdersCount;
        if (receivedCount >= 1 && receivedCount > previousCount && !shouldPlaySound) {
          playAlertSound();
        }
        
        setNewOrdersCount(receivedCount);

        // Update browser tab title with both food and snooker counts
        const currentSnookerCount = newSnookerBookingsCountRef.current;
        updateTabTitle(receivedCount, currentSnookerCount);

        console.log('📋 Fetched orders for business day:', parsedData.length, 'orders');
        if (parsedData.length > 0) {
          console.log('📋 Sample order:', {
            id: parsedData[0].id,
            customer_name: parsedData[0].customer_name,
            customer_phno: parsedData[0].customer_phno,
            created_at: parsedData[0].created_at
          });
        }
        
        // Mark initial load as complete after first successful fetch
        if (!initialLoadComplete) {
          setInitialLoadComplete(true);
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      if (showLoading) {
      setLoading(false);
      }
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      console.log(`🔄 Updating order ${orderId} status to: ${newStatus}`);
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        console.log(`✅ Order ${orderId} status updated to: ${newStatus}`);
        setOrders(prev => {
          const updated = prev.map(order =>
            order.id === orderId ? { ...order, status: newStatus } : order
          );
          
          // Recalculate new orders count
          const receivedCount = updated.filter(order => order.status === 'received').length;
          setNewOrdersCount(receivedCount);
          // Update pending orders count - this will stop notification if count becomes 0
          setPendingOrdersCount(receivedCount);
          const currentSnookerCount = newSnookerBookingsCountRef.current;
          updateTabTitle(receivedCount, currentSnookerCount);
          
          return updated;
        });
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error(`❌ Failed to update order status:`, errorData);
        alert(`Failed to update order status: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error updating order:', error);
      alert(`Error updating order: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Don't update local state on error - keep the original status
    }
  };

  // Fetch Snooker Bookings
  const fetchSnookerBookings = async (showLoading = false) => {
    try {
      if (showLoading) {
        setSnookerLoading(true);
      }
      const response = await fetch('/api/snooker-bookings');
      if (response.ok) {
        const data = await response.json();
        const currentPreviousBookings = previousSnookerBookingsRef.current;
        let shouldPlaySound = false;
        
        // Detect new bookings
        if (currentPreviousBookings.length > 0 && data.length > currentPreviousBookings.length) {
          const newBookings = data.filter(
            (newBooking: SnookerBooking) => 
              !currentPreviousBookings.some(prevBooking => prevBooking.snooker_order_id === newBooking.snooker_order_id)
          );

          // Play sound when new bookings are detected
          if (newBookings.length > 0) {
            shouldPlaySound = true;
            playAlertSound();
          }
        }

        setPreviousSnookerBookings(data);
        setSnookerBookings(data);

        // Calculate new snooker bookings count (Received status)
        const receivedCount = data.filter(
          (booking: SnookerBooking) => booking.order_status === 'Received'
        ).length;
        
        // Update pending snooker count - this will trigger continuous notification
        setPendingSnookerCount(receivedCount);
        
        // Play sound if count is 1 or greater (and count increased)
        // Only play if we didn't already play for new bookings detection above
        const previousCount = newSnookerBookingsCountRef.current;
        if (receivedCount >= 1 && receivedCount > previousCount && !shouldPlaySound) {
          playAlertSound();
        }
        
        setNewSnookerBookingsCount(receivedCount);

        // Update browser tab title with both food and snooker counts
        const currentFoodCount = newOrdersCountRef.current;
        updateTabTitle(currentFoodCount, receivedCount);
      } else {
        console.error('Failed to fetch snooker bookings');
      }
    } catch (error) {
      console.error('Error fetching snooker bookings:', error);
    } finally {
      if (showLoading) {
        setSnookerLoading(false);
      }
    }
  };

  // Fetch Workspace Bookings
  const fetchWorkspaceBookings = async (showLoading = false) => {
    try {
      if (showLoading) {
        setWorkspaceLoading(true);
      }
      const response = await fetch('/api/workspace-bookings');
      if (response.ok) {
        const data = await response.json();
        setWorkspaceBookings(data);
        
        // Calculate pending workspace bookings count (Received status)
        const receivedCount = data.filter(
          (booking: WorkspaceBooking) => booking.order_status === 'Received'
        ).length;
        
        // Update pending workspace count - this will trigger continuous notification
        setPendingWorkspaceCount(receivedCount);
      } else {
        console.error('Failed to fetch workspace bookings');
      }
    } catch (error) {
      console.error('Error fetching workspace bookings:', error);
    } finally {
      if (showLoading) {
        setWorkspaceLoading(false);
      }
    }
  };

  // End Play Session
  const handleStartPlay = async (bookingId: string) => {
    if (!confirm('Are you sure you want to start this play session?')) {
      return;
    }

    try {
      const response = await fetch(`/api/snooker-bookings/${bookingId}/start-play`, {
        method: 'PATCH',
      });

      if (response.ok) {
        // Refresh bookings
        await fetchSnookerBookings();
        // Also refresh food orders to update any related stats (background refresh)
        await fetchOrders(false);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        alert(`Failed to start play session: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error starting play session:', error);
      alert(`Error starting play session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleEndPlay = async (bookingId: string) => {
    if (!confirm('Are you sure you want to end this play session?')) {
      return;
    }

    try {
      const response = await fetch(`/api/snooker-bookings/${bookingId}/end-play`, {
        method: 'PATCH',
      });

      if (response.ok) {
        // Refresh bookings
        await fetchSnookerBookings();
        // Also refresh food orders to update any related stats (background refresh)
        await fetchOrders(false);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        alert(`Failed to end play session: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error ending play session:', error);
      alert(`Error ending play session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Update Workspace Booking Status
  const updateWorkspaceBookingStatus = async (bookingId: string, newStatus: 'Received' | 'Accepted' | 'Paid' | 'Delivered' | 'Rejected') => {
    try {
      const response = await fetch(`/api/workspace-bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_status: newStatus }),
      });

      if (response.ok) {
        // Update pending count immediately if status changed from Received
        if (newStatus !== 'Received') {
          setWorkspaceBookings(prev => {
            const receivedCount = prev.filter(b => b.order_status === 'Received' && b.workspace_order_id !== bookingId).length;
            setPendingWorkspaceCount(receivedCount);
            return prev.map(b => 
              b.workspace_order_id === bookingId ? { ...b, order_status: newStatus } : b
            );
          });
        }
        // Refresh workspace bookings
        await fetchWorkspaceBookings(false);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        alert(`Failed to update booking status: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating workspace booking status:', error);
      alert(`Error updating booking status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Update Snooker Booking Status
  const updateSnookerBookingStatus = async (bookingId: string, newStatus: 'Received' | 'Accepted' | 'Started' | 'Paused' | 'Resumed' | 'Ended') => {
    try {
      const response = await fetch(`/api/snooker-bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_status: newStatus }),
      });

      if (response.ok) {
        // Update pending count immediately if status changed from Received
        if (newStatus !== 'Received') {
          setSnookerBookings(prev => {
            const receivedCount = prev.filter(b => b.order_status === 'Received' && b.snooker_order_id !== bookingId).length;
            setPendingSnookerCount(receivedCount);
            return prev.map(b => 
              b.snooker_order_id === bookingId ? { ...b, order_status: newStatus } : b
            );
          });
        }
        // Refresh snooker bookings
        await fetchSnookerBookings(false);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        alert(`Failed to update booking status: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating snooker booking status:', error);
      alert(`Error updating booking status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Fetch Customer Billings
  const fetchCustomerBillings = async (showLoading = true) => {
    if (showLoading) setBillingLoading(true);
    try {
      const response = await fetch('/api/customer-billing');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Fetched customer billings:', data?.length || 0, 'records');
        setCustomerBillings(data || []);
        
        // Calculate pending billings (UNPAID status)
        const unpaidCount = (data || []).filter(
          (billing: CustomerBilling) => billing.latestdate_allorder_status === 'UNPAID'
        ).length;
        setPendingBillingCount(unpaidCount);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Failed to fetch customer billings:', errorData);
        setCustomerBillings([]);
        setPendingBillingCount(0);
      }
    } catch (error) {
      console.error('❌ Error fetching customer billings:', error);
      setCustomerBillings([]);
      setPendingBillingCount(0);
    } finally {
      setBillingLoading(false);
    }
  };

  // Update Customer Billing Status
  const updateCustomerBillingStatus = async (phone: string, newStatus: 'PAID' | 'UNPAID' | 'ACCEPT' | 'REJECT') => {
    try {
      const response = await fetch(`/api/customer-billing/${encodeURIComponent(phone)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Play notification sound
        if (soundEnabledRef.current && audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(err => console.log('Audio play failed:', err));
        }
        // Refresh customer billings
        await fetchCustomerBillings(false);
        // Also refresh other tabs to sync status
        if (activeTab === 'food') await fetchOrders(false);
        if (activeTab === 'snooker') await fetchSnookerBookings(false);
        if (activeTab === 'workspace') await fetchWorkspaceBookings(false);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        alert(`Failed to update billing status: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating customer billing status:', error);
      alert(`Error updating billing status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Update Individual Order Status
  const updateIndividualOrderStatus = async (phone: string, orderType: 'food' | 'workspace' | 'snooker', orderId: string, status: 'PAID' | 'UNPAID') => {
    try {
      const response = await fetch(`/api/customer-billing/${encodeURIComponent(phone)}/order-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderType, orderId, status }),
      });

      if (response.ok) {
        const result = await response.json();
        // Play notification sound
        if (soundEnabledRef.current && audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(err => console.log('Audio play failed:', err));
        }
        // Refresh customer billings
        await fetchCustomerBillings(false);
        // Also refresh other tabs to sync status
        if (activeTab === 'food') await fetchOrders(false);
        if (activeTab === 'snooker') await fetchSnookerBookings(false);
        if (activeTab === 'workspace') await fetchWorkspaceBookings(false);
        
        if (result.mainStatusUpdated) {
          console.log('✅ All orders are now PAID - main card status updated to PAID');
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        alert(`Failed to update order status: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating individual order status:', error);
      alert(`Error updating order status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Countdown Timer Component
  const CountdownTimer = ({ startTime }: { startTime: string }) => {
    const [timeElapsed, setTimeElapsed] = useState('00:00:00');

    useEffect(() => {
      const updateTimer = () => {
        const start = new Date(startTime).getTime();
        const now = new Date().getTime();
        const diff = now - start;

        if (diff < 0) {
          setTimeElapsed('00:00:00');
          return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeElapsed(
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        );
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);

      return () => clearInterval(interval);
    }, [startTime]);

    return (
      <div className="flex items-center gap-2">
        <span className="text-lg">⏱️</span>
        <span className="font-bold text-orange-700">{timeElapsed}</span>
      </div>
    );
  };

  // Fetch snooker bookings when tab is active
  useEffect(() => {
    if (activeTab === 'snooker' && authChecked) {
      // Initial fetch with loading state
      fetchSnookerBookings(true);
      // Refresh every 5 seconds without loading state
      const interval = setInterval(() => fetchSnookerBookings(false), 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, authChecked]);

  // Fetch workspace bookings when tab is active
  useEffect(() => {
    if (activeTab === 'workspace' && authChecked) {
      // Initial fetch with loading state
      fetchWorkspaceBookings(true);
      // Refresh every 5 seconds without loading state
      const interval = setInterval(() => fetchWorkspaceBookings(false), 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, authChecked]);

  // Fetch customer billings when tab is active
  useEffect(() => {
    if (activeTab === 'billing' && authChecked) {
      // Initial fetch with loading state
      fetchCustomerBillings(true);
      // Refresh every 5 seconds without loading state
      const interval = setInterval(() => fetchCustomerBillings(false), 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, authChecked]);

  // Orders are already filtered by business day (8 AM to 8 AM) from the API
  // So we can use them directly - no need for additional client-side filtering
  const allTodayOrders = orders; // Already filtered by business day from server

  // Calculate stats from all business day orders
  const totalOrderValue = allTodayOrders.reduce((sum, order) => sum + order.total_amount, 0);
  const numberOfOrders = allTodayOrders.length;
  const amountSettled = allTodayOrders
    .filter(order => order.status === 'paid')
    .reduce((sum, order) => sum + order.total_amount, 0);

  // Display orders: sort by created_at (oldest first) - show all orders
  const todayOrders = allTodayOrders
    .sort((a, b) => {
      // Sort by created_at ascending (oldest first)
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

  // Calculate item-wise metrics
  interface ItemMetrics {
    name: string;
    menu_item_id: string;
    totalQuantity: number;
    orderCount: number;
    totalRevenue: number;
    averageQuantity: number;
    averagePrice: number;
  }

  const itemMetricsMap = new Map<string, ItemMetrics>();

  // Calculate item metrics from all today's orders (not just displayed 20)
  allTodayOrders.forEach(order => {
    order.items.forEach(item => {
      const key = item.menu_item_id || item.name;
      const existing = itemMetricsMap.get(key);

      if (existing) {
        existing.totalQuantity += item.quantity;
        existing.orderCount += 1;
        existing.totalRevenue += item.price * item.quantity;
        existing.averageQuantity = existing.totalQuantity / existing.orderCount;
        existing.averagePrice = existing.totalRevenue / existing.totalQuantity;
      } else {
        itemMetricsMap.set(key, {
          name: item.name,
          menu_item_id: item.menu_item_id || item.name,
          totalQuantity: item.quantity,
          orderCount: 1,
          totalRevenue: item.price * item.quantity,
          averageQuantity: item.quantity,
          averagePrice: item.price,
        });
      }
    });
  });

  const itemMetrics = Array.from(itemMetricsMap.values())
    .sort((a, b) => b.totalQuantity - a.totalQuantity); // Sort by total quantity (most popular first)

  // Show loading state only on initial load while checking authentication or fetching data
  if (!authChecked || (loading && !initialLoadComplete)) {
  return (
      <div className="min-h-screen gradient-soft flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary mb-4 shadow-soft-lg">
            <div className="animate-pulse">
              <span className="text-5xl text-white">⏳</span>
            </div>
          </div>
          <p className="text-gray-700 font-bold text-lg">
            {!authChecked ? 'Verifying authentication...' : 'Loading Dashboard...'}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {!authChecked ? 'Please wait' : 'Fetching latest orders'}
          </p>
          {/* Bypass login is disabled - authentication is required */}
          {/* Bypass button removed for security */}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-soft flex flex-col">
      {/* Header with Vector Background - Matching Menu Page */}
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
              
              {/* Centered Admin Dashboard */}
              <div className="flex-1 flex flex-col items-center text-center">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white flex items-center gap-3 drop-shadow-lg">
                  <span className="text-4xl md:text-5xl">👨‍💼</span>
                  <span>Admin Dashboard</span>
                </h1>
                <p className="text-white text-base md:text-lg mt-2 font-bold drop-shadow-lg">SocialX Hub - Order Management</p>
              </div>
              
              {/* Right side - Date and Time + Actions */}
              <div className="flex-1 flex flex-col items-end gap-2">
                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href="/order-admin/menu-edit"
                    className="px-4 py-2 bg-white/20 backdrop-blur-md text-white rounded-lg border border-white/30 hover:bg-white/30 transition-colors font-semibold text-sm"
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
                {/* Live Status */}
                <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/30">
                  <div className="w-3 h-3 rounded-full bg-green-400 shadow-soft"></div>
                  <span className="text-white font-bold text-sm md:text-base">Live</span>
                </div>
              </div>
            </div>
              </div>
            </div>
        </div>

      {/* Hero Section - Desktop Stats with Theme Colors */}
      <div 
        className="w-full py-8 md:py-12"
        style={{
          background: 'linear-gradient(135deg, #fef3e2 0%, #f3e8ff 50%, #ffe4cc 100%)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* Total Order Value */}
            <div className="relative rounded-2xl overflow-hidden shadow-soft-lg hover:shadow-card-hover transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/15 to-white/10 backdrop-blur-xl"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent"></div>
              <div className="relative z-10 p-6 border-2 border-white/30">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-white/25 backdrop-blur-sm flex items-center justify-center shadow-soft">
                    <span className="text-4xl">💵</span>
              </div>
              <div>
                    <p className="text-orange-800 text-xs md:text-sm font-bold uppercase tracking-wide">Total Order Value</p>
                    <p className="text-3xl md:text-4xl font-bold text-orange-900 drop-shadow-lg">₹{totalOrderValue}</p>
                    <p className="text-orange-700 text-xs mt-1 font-semibold">Today</p>
              </div>
            </div>
              </div>
            </div>

            {/* Number of Orders */}
            <div className="relative rounded-2xl overflow-hidden shadow-soft-lg hover:shadow-card-hover transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/15 to-white/10 backdrop-blur-xl"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent"></div>
              <div className="relative z-10 p-6 border-2 border-white/30">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-white/25 backdrop-blur-sm flex items-center justify-center shadow-soft">
                    <span className="text-4xl">📋</span>
              </div>
              <div>
                    <p className="text-orange-800 text-xs md:text-sm font-bold uppercase tracking-wide">Number of Orders</p>
                    <p className="text-3xl md:text-4xl font-bold text-orange-900 drop-shadow-lg">{numberOfOrders}</p>
                    <p className="text-orange-700 text-xs mt-1 font-semibold">Today</p>
              </div>
            </div>
              </div>
            </div>

            {/* Amount - Ordered | Settled */}
            <div className="relative rounded-2xl overflow-hidden shadow-soft-lg hover:shadow-card-hover transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/15 to-white/10 backdrop-blur-xl"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent"></div>
              <div className="relative z-10 p-6 border-2 border-white/30">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-white/25 backdrop-blur-sm flex items-center justify-center shadow-soft">
                    <span className="text-4xl">✅</span>
              </div>
              <div className="flex-1">
                    <p className="text-orange-800 text-xs md:text-sm font-bold uppercase tracking-wide mb-2">AMOUNT</p>
                    
                    {/* Toggle Buttons */}
                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={() => setAmountView('ordered')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          amountView === 'ordered'
                            ? 'bg-orange-600 text-white shadow-sm'
                            : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                        }`}
                      >
                        Ordered
                      </button>
                      <button
                        onClick={() => setAmountView('settled')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          amountView === 'settled'
                            ? 'bg-orange-600 text-white shadow-sm'
                            : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                        }`}
                      >
                        Settled
                      </button>
                    </div>
                    
                    {/* Display Value */}
                    <p className="text-3xl md:text-4xl font-bold text-orange-900 drop-shadow-lg">
                      ₹{amountView === 'ordered' ? totalOrderValue : amountSettled}
                    </p>
                    <p className="text-orange-700 text-xs mt-1 font-semibold">
                      {amountView === 'ordered' ? 'All Orders' : 'Paid Orders'}
                    </p>
              </div>
            </div>
              </div>
              </div>
            </div>
          </div>
        </div>

      {/* Main Content - Orders List */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10 py-8 md:py-10 flex-1 flex flex-col items-center justify-center">
        {/* Tabs */}
        <div className="mb-6 md:mb-8 w-full">
          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              onClick={() => setActiveTab('food')}
              className={`px-6 py-3 rounded-xl font-bold text-lg transition-all relative ${
                activeTab === 'food'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 shadow-soft'
              }`}
            >
              🍽️ Food Orders
              {pendingOrdersCount > 0 && (
                <span className="ml-2 text-xl animate-pulse" title="Notification sound active - pending orders">
                  🔊
                </span>
              )}
              {newOrdersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {newOrdersCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('snooker')}
              className={`px-6 py-3 rounded-xl font-bold text-lg transition-all relative ${
                activeTab === 'snooker'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 shadow-soft'
              }`}
            >
              🎱 Snooker Booking
              {pendingSnookerCount > 0 && (
                <span className="ml-2 text-xl animate-pulse" title="Notification sound active - pending bookings">
                  🔊
                </span>
              )}
              {newSnookerBookingsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {newSnookerBookingsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('workspace')}
              className={`px-6 py-3 rounded-xl font-bold text-lg transition-all relative ${
                activeTab === 'workspace'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 shadow-soft'
              }`}
            >
              💼 WorkSpace Booking
              {pendingWorkspaceCount > 0 && (
                <span className="ml-2 text-xl animate-pulse" title="Notification sound active - pending bookings">
                  🔊
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`px-6 py-3 rounded-xl font-bold text-lg transition-all relative ${
                activeTab === 'billing'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 shadow-soft'
              }`}
            >
              💳 Customer Billing
              {pendingBillingCount > 0 && (
                <span className="ml-2 text-xl animate-pulse" title="Notification sound active - pending billings">
                  🔊
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Food Orders Tab */}
        {activeTab === 'food' && (
          <>
        {/* Orders List Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-center gap-4 flex-wrap">
          <h2 className="text-2xl md:text-3xl font-bold text-orange-600 flex items-center gap-3">
            <span className="text-3xl md:text-4xl">📦</span>
            <span>Orders Dashboard</span>
          </h2>
            
            {/* Sound Notification Toggle */}
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-soft border border-orange-200">
              <span className="text-sm font-semibold text-gray-700">🔔</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={toggleSound}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                <span className="ml-2 text-sm font-medium text-gray-700">
                  {soundEnabled ? 'On' : 'Off'}
                </span>
              </label>
            </div>
          </div>
          <p className="text-gray-600 mt-2 text-sm md:text-base font-medium text-center">
            Click on an order to expand and view details
            {allTodayOrders.length > 0 && (
              <span className="ml-2 text-orange-600 font-semibold">
                (sorted by time - oldest first)
              </span>
            )}
          </p>
        </div>

        {/* Empty State */}
        {todayOrders.length === 0 && (
          <div className="relative rounded-3xl overflow-hidden shadow-soft-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-orange-50/80 backdrop-blur-xl"></div>
            <div className="relative z-10 text-center py-16 md:py-20 px-6">
              <div className="inline-flex items-center justify-center w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 mb-6 shadow-soft">
                <span className="text-6xl md:text-7xl">📭</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-transparent bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text mb-3">No orders yet</h3>
              <p className="text-gray-600 font-medium">Orders will appear here as customers place them</p>
            </div>
          </div>
        )}

        {/* Orders Grid */}
        {todayOrders.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            {todayOrders.map(order => {
              const config = statusConfig[order.status];
              const isExpanded = expandedOrders.has(order.id);

              return (
                <div
                  key={order.id}
                  className="relative rounded-2xl overflow-hidden transition-all shadow-soft hover:shadow-soft-lg"
                >
                  {/* Card Background with Status Color - Theme Matched */}
                  <div className={`relative ${config.cardBg} p-5 md:p-6 border-2 ${config.color}`}>
                    {/* Glass Effect Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent"></div>
                    
                    {/* Content */}
                    <div className="relative z-10">
                      {/* Order Header - Clickable */}
                      <button
                        onClick={() => {
                          const newExpanded = new Set(expandedOrders);
                          if (isExpanded) {
                            newExpanded.delete(order.id);
                          } else {
                            newExpanded.add(order.id);
                          }
                          setExpandedOrders(newExpanded);
                        }}
                        className="w-full text-left hover:bg-white/30 rounded-xl p-3 -m-3 mb-0 transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          {/* Left Section - Customer Info */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Status Icon */}
                            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl ${config.badge} flex items-center justify-center shadow-soft flex-shrink-0`}>
                              <span className="text-2xl md:text-3xl text-white">{config.icon}</span>
                            </div>

                            {/* Customer Name & Order ID */}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base md:text-lg font-bold text-gray-800 truncate">
                                {order.customer_name}
                              </h3>
                              <div className="flex items-center gap-2">
                              <p className="text-xs text-gray-600 font-medium truncate">
                                📞 {order.customer_phno || 'N/A'}
                              </p>
                                {order.customer_phno && formatWhatsAppMessageLink(order.customer_phno, order.customer_name) && (
                                  <a
                                    href={formatWhatsAppMessageLink(order.customer_phno, order.customer_name)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#25D366] hover:bg-[#20BA5A] transition-all shadow-md hover:shadow-lg hover:scale-110"
                                    title={`Notify ${order.customer_name} on WhatsApp`}
                                  >
                                    <span className="text-sm font-bold text-white">💬</span>
                                  </a>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 font-medium truncate">
                                #{order.id.slice(0, 8)}
                                {order.table_number && ` • Table ${order.table_number}`}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {new Date(order.created_at).toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                            </div>
                          </div>

                          {/* Right Section - Amount */}
                          <div className="text-right flex-shrink-0">
                            <p className="text-xl md:text-2xl font-bold text-transparent bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text">
                              ₹{order.total_amount}
                            </p>
                            {/* Status Badge */}
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg ${config.badge} mt-1 mb-1`}>
                              <span className="text-xs font-bold text-white uppercase">{config.label}</span>
                              {(order.status === 'received' || order.status === 'unpaid') && (
                                <span className="text-sm animate-pulse" title="Notification sound active - needs attention">
                                  🔊
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-semibold text-gray-600 mt-1">
                              {isExpanded ? '▲ Hide' : '▼ Show'}
                            </p>
                          </div>
                        </div>
                      </button>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t-2 border-gray-300/50">
                          {/* Items List */}
                          <div className="mb-4">
                            <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2 text-sm md:text-base">
                              <span className="text-lg">🍽️</span>
                              <span>Order Items:</span>
                            </h4>
                            <div className="space-y-2">
                              {order.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="relative rounded-xl overflow-hidden shadow-soft"
                                >
                                  {/* Glass background */}
                                  <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-orange-50/70 backdrop-blur-xl"></div>
                                  
                                  <div className="relative z-10 flex justify-between items-center p-3">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center border border-primary-200 shadow-sm flex-shrink-0">
                                        <span className="text-base">☕</span>
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <span className="text-gray-800 font-bold text-sm block truncate">{item.name}</span>
                                        <span className="text-primary-600 font-bold text-xs">× {item.quantity}</span>
                                      </div>
                                    </div>
                                    <span className="font-bold text-gray-800 text-sm flex-shrink-0 ml-2">
                                      ₹{item.price * item.quantity}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Total */}
                          <div className="relative rounded-xl overflow-hidden shadow-soft mb-4">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-accent-50 to-orange-50 border-2 border-primary-200"></div>
                            <div className="relative z-10 p-4">
                              <div className="flex justify-between items-center">
                                <span className="text-base md:text-lg font-bold text-gray-800">Total Amount</span>
                                <span className="text-xl md:text-2xl font-bold text-transparent bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text">
                                  ₹{order.total_amount}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Status Update Buttons */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateOrderStatus(order.id, 'received');
                              }}
                              disabled={order.status === 'received'}
                              className={`py-3 px-3 md:px-4 rounded-xl font-bold text-xs md:text-sm transition-all shadow-soft hover:shadow-soft-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${
                                order.status === 'received'
                                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-2 border-yellow-400'
                                  : 'bg-gradient-to-br from-yellow-100 to-orange-100 text-yellow-700 hover:from-yellow-200 hover:to-orange-200 border border-yellow-300'
                              }`}
                            >
                              <span className="block text-base md:text-lg mb-0.5">⏳</span>
                              <span>Received</span>
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateOrderStatus(order.id, 'accepted');
                              }}
                              disabled={order.status === 'accepted'}
                              className={`py-3 px-3 md:px-4 rounded-xl font-bold text-xs md:text-sm transition-all shadow-soft hover:shadow-soft-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${
                                order.status === 'accepted'
                                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-2 border-blue-400'
                                  : 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 hover:from-blue-200 hover:to-indigo-200 border border-blue-300'
                              }`}
                            >
                              <span className="block text-base md:text-lg mb-0.5">✅</span>
                              <span>Accepted</span>
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateOrderStatus(order.id, 'rejected');
                              }}
                              disabled={order.status === 'rejected'}
                              className={`py-3 px-3 md:px-4 rounded-xl font-bold text-xs md:text-sm transition-all shadow-soft hover:shadow-soft-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${
                                order.status === 'rejected'
                                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-2 border-red-500'
                                  : 'bg-gradient-to-br from-red-100 to-rose-100 text-red-800 hover:from-red-200 hover:to-rose-200 border border-red-400'
                              }`}
                            >
                              <span className="block text-base md:text-lg mb-0.5">❌</span>
                              <span>Rejected</span>
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateOrderStatus(order.id, 'delivered');
                              }}
                              disabled={order.status === 'delivered'}
                              className={`py-3 px-3 md:px-4 rounded-xl font-bold text-xs md:text-sm transition-all shadow-soft hover:shadow-soft-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${
                                order.status === 'delivered'
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-2 border-green-400'
                                  : 'bg-gradient-to-br from-green-100 to-emerald-100 text-green-700 hover:from-green-200 hover:to-emerald-200 border border-green-300'
                              }`}
                            >
                              <span className="block text-base md:text-lg mb-0.5">✅</span>
                              <span>Delivered</span>
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateOrderStatus(order.id, 'paid');
                              }}
                              disabled={order.status === 'paid'}
                              className={`py-3 px-3 md:px-4 rounded-xl font-bold text-xs md:text-sm transition-all shadow-soft hover:shadow-soft-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${
                                order.status === 'paid'
                                  ? 'bg-gradient-to-r from-gray-500 to-slate-500 text-white border-2 border-gray-400'
                                  : 'bg-gradient-to-br from-gray-100 to-slate-100 text-gray-700 hover:from-gray-200 hover:to-slate-200 border border-gray-300'
                              }`}
                            >
                              <span className="block text-base md:text-lg mb-0.5">💰</span>
                              <span>Paid</span>
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateOrderStatus(order.id, 'unpaid');
                              }}
                              disabled={order.status === 'unpaid'}
                              className={`py-3 px-3 md:px-4 rounded-xl font-bold text-xs md:text-sm transition-all shadow-soft hover:shadow-soft-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${
                                order.status === 'unpaid'
                                  ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white border-2 border-red-400'
                                  : 'bg-gradient-to-br from-red-100 to-orange-100 text-red-700 hover:from-red-200 hover:to-orange-200 border border-red-300'
                              }`}
                            >
                              <span className="block text-base md:text-lg mb-0.5">💳</span>
                              <span>Unpaid</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
          </>
        )}

        {/* Snooker Booking Tab */}
        {activeTab === 'snooker' && (
          <>
            {/* Snooker Bookings Header */}
            <div className="mb-6 md:mb-8">
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <h2 className="text-2xl md:text-3xl font-bold text-blue-600 flex items-center gap-3">
                  <span className="text-3xl md:text-4xl">🎱</span>
                  <span>Snooker Bookings</span>
                </h2>
              </div>
              <p className="text-gray-600 mt-2 text-sm md:text-base font-medium text-center">
                Click on a booking to expand and view details
              </p>
            </div>

            {/* Loading State */}
            {snookerLoading && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 mb-4 shadow-soft">
                  <div className="animate-pulse">
                    <span className="text-5xl text-blue-600">⏳</span>
                  </div>
                </div>
                <p className="text-gray-700 font-bold text-lg">Loading Bookings...</p>
              </div>
            )}

            {/* Empty State */}
            {!snookerLoading && snookerBookings.length === 0 && (
              <div className="relative rounded-3xl overflow-hidden shadow-soft-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-blue-50/80 backdrop-blur-xl"></div>
                <div className="relative z-10 text-center py-16 md:py-20 px-6">
                  <div className="inline-flex items-center justify-center w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 mb-6 shadow-soft">
                    <span className="text-6xl md:text-7xl">🎱</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text mb-3">No bookings yet</h3>
                  <p className="text-gray-600 font-medium">Snooker bookings will appear here as customers book tables</p>
                </div>
              </div>
            )}

            {/* Snooker Bookings Grid */}
            {!snookerLoading && snookerBookings.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {snookerBookings
                  .filter(booking => {
                    // Show all ongoing orders: Received, Accepted, Started, STARTED, Paused, Resumed, Ended, and ENDED orders
                    const ongoingStatuses = ['Received', 'Accepted', 'Started', 'STARTED', 'Paused', 'Resumed', 'Ended', 'ENDED'];
                    return ongoingStatuses.includes(booking.order_status);
                  })
                  .map(booking => {
                    const isExpanded = expandedSnookerBookings.has(booking.snooker_order_id);
                    const boardInfo = booking.snooker_board_menu_items;
                    const statusConfig = {
                      Received: {
                        label: 'Received',
                        color: 'border-yellow-300',
                        cardBg: 'bg-gradient-to-br from-yellow-50 via-yellow-100/70 to-orange-50/80',
                        textColor: 'text-yellow-700',
                        badge: 'bg-gradient-to-r from-yellow-500 to-orange-500',
                        icon: '⏳',
                      },
                      Started: {
                        label: 'Started',
                        color: 'border-blue-300',
                        cardBg: 'bg-gradient-to-br from-blue-50 via-blue-100/70 to-indigo-50/80',
                        textColor: 'text-blue-700',
                        badge: 'bg-gradient-to-r from-blue-500 to-indigo-500',
                        icon: '▶️',
                      },
                      Ended: {
                        label: 'Ended',
                        color: 'border-gray-300',
                        cardBg: 'bg-gradient-to-br from-gray-50 via-gray-100/70 to-slate-50/80',
                        textColor: 'text-gray-700',
                        badge: 'bg-gradient-to-r from-gray-500 to-slate-500',
                        icon: '✅',
                      },
                    };
                    // Normalize status to handle case variations
                    const normalizedStatus = booking.order_status === 'STARTED' ? 'STARTED' : 
                                           booking.order_status === 'Started' ? 'STARTED' :
                                           booking.order_status === 'ENDED' ? 'ENDED' :
                                           booking.order_status === 'Ended' ? 'ENDED' :
                                           booking.order_status;
                    const config = statusConfig[normalizedStatus as keyof typeof statusConfig] || statusConfig.Received;

                    return (
                      <div
                        key={booking.snooker_order_id}
                        className="relative rounded-2xl overflow-hidden transition-all shadow-soft hover:shadow-soft-lg"
                      >
                        {/* Card Background with Status Color */}
                        <div className={`relative ${config.cardBg} p-5 md:p-6 border-2 ${config.color} rounded-2xl`}>
                          {/* Glass Effect Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-2xl pointer-events-none"></div>
                          
                          {/* Content */}
                          <div className="relative z-10">
                            {/* Booking Header - Clickable */}
                            <div
                              onClick={() => {
                                const newExpanded = new Set(expandedSnookerBookings);
                                if (isExpanded) {
                                  newExpanded.delete(booking.snooker_order_id);
                                } else {
                                  newExpanded.add(booking.snooker_order_id);
                                }
                                setExpandedSnookerBookings(newExpanded);
                              }}
                              className="w-full text-left hover:bg-white/30 rounded-xl p-3 -m-3 mb-0 transition-all cursor-pointer"
                            >
                              <div className="flex items-start justify-between gap-4">
                                {/* Left Section - Customer Info */}
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  {/* Status Icon */}
                                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl ${config.badge} flex items-center justify-center shadow-soft flex-shrink-0`}>
                                    <span className="text-2xl md:text-3xl text-white">{config.icon}</span>
                                  </div>

                                  {/* Customer Name & Booking ID */}
                                  <div className="flex-1 min-w-0 space-y-1">
                                    <h3 className="text-base md:text-lg font-bold text-gray-800 truncate leading-tight">
                                      {booking.customer_name}
                                    </h3>
                                    <p className="text-xs text-gray-600 font-medium truncate">
                                      📞 {booking.customer_phno || 'N/A'}
                                    </p>
                                    <p className="text-xs text-gray-600 font-medium truncate">
                                      #{booking.snooker_order_id.slice(0, 8)}
                                      {boardInfo && ` • ${boardInfo.board_name}`}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(booking.created_at).toLocaleString('en-US', { 
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </p>
                                  </div>
                                </div>

                                {/* Right Section - Status & Timer */}
                                <div className="text-right flex-shrink-0 flex flex-col items-end">
                                  {/* Status Badge */}
                                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg ${config.badge} mb-2`}>
                                    <span className="text-xs font-bold text-white uppercase">{config.label}</span>
                                    {booking.order_status === 'Received' && (
                                      <span className="text-sm animate-pulse" title="Notification sound active - needs attention">
                                        🔊
                                      </span>
                                    )}
                                  </div>
                                  {/* START PLAY Button - Show for Received orders (DISABLED) */}
                                  {normalizedStatus === 'Received' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStartPlay(booking.snooker_order_id);
                                      }}
                                      disabled
                                      className="mt-1 w-auto min-w-[120px] py-2 px-3 rounded-lg font-bold text-xs transition-all shadow-soft hover:shadow-soft-lg active:scale-95 bg-gradient-to-r from-green-500 to-emerald-600 text-white border-2 border-green-400 opacity-50 cursor-not-allowed"
                                    >
                                      ▶️ START PLAY
                                    </button>
                                  )}
                                  {/* Countdown Timer - Show for Started orders with start_date_time */}
                                  {booking.start_date_time && (normalizedStatus === 'STARTED' || normalizedStatus === 'Started') && (
                                    <div className="mt-2">
                                      <CountdownTimer startTime={booking.start_date_time} />
                                    </div>
                                  )}
                                  {/* END PLAY Button - Show for Started orders */}
                                  {(normalizedStatus === 'STARTED' || normalizedStatus === 'Started') && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEndPlay(booking.snooker_order_id);
                                      }}
                                      className="mt-2 w-auto min-w-[120px] py-2 px-3 rounded-lg font-bold text-xs transition-all shadow-soft hover:shadow-soft-lg active:scale-95 bg-gradient-to-r from-red-500 to-red-600 text-white border-2 border-red-400"
                                    >
                                      🛑 END PLAY
                                    </button>
                                  )}
                                  <p className="text-xs font-semibold text-gray-600 mt-2">
                                    {isExpanded ? '▲ Hide' : '▼ Show'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t-2 border-gray-300/50">
                                {/* Booking Details */}
                                <div className="mb-4">
                                  <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2 text-sm md:text-base">
                                    <span className="text-lg">🎱</span>
                                    <span>Booking Details:</span>
                                  </h4>
                                  <div className="space-y-2">
                                    <div className="relative rounded-xl overflow-hidden shadow-soft">
                                      <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-blue-50/70 backdrop-blur-xl"></div>
                                      <div className="relative z-10 p-3">
                                        <div className="flex justify-between items-center">
                                          <span className="text-gray-800 font-bold text-sm">Board</span>
                                          <span className="font-bold text-gray-800 text-sm">
                                            {boardInfo?.board_name || 'N/A'} ({boardInfo?.type || 'N/A'})
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                          <span className="text-gray-800 font-bold text-sm">Players</span>
                                          <span className="font-bold text-gray-800 text-sm">{booking.players_count}</span>
                                        </div>
                                        {booking.start_date_time && (
                                          <div className="flex justify-between items-center mt-2">
                                            <span className="text-gray-800 font-bold text-sm">Start Time</span>
                                            <span className="font-bold text-gray-800 text-sm">
                                              {new Date(booking.start_date_time).toLocaleString('en-US', { 
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit', 
                                                minute: '2-digit' 
                                              })}
                                            </span>
                                          </div>
                                        )}
                                        {/* Start Play Button - DISABLED */}
                                        {/* {normalizedStatus === 'Received' && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleStartPlay(booking.snooker_order_id);
                                            }}
                                            className="w-full py-3 px-4 rounded-xl font-bold text-sm md:text-base transition-all shadow-soft hover:shadow-soft-lg active:scale-95 bg-gradient-to-r from-green-500 to-emerald-600 text-white border-2 border-green-400"
                                          >
                                            <span className="block text-lg mb-1">▶️</span>
                                            <span>START PLAY</span>
                                          </button>
                                        )} */}
                                        {booking.start_date_time && (normalizedStatus === 'STARTED' || normalizedStatus === 'Started') && (
                                          <div className="mt-3 pt-3 border-t border-gray-200">
                                            <CountdownTimer startTime={booking.start_date_time} />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* End Play Button - Show for Started orders */}
                                {(normalizedStatus === 'STARTED' || normalizedStatus === 'Started') && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEndPlay(booking.snooker_order_id);
                                    }}
                                    className="w-full py-3 px-4 rounded-xl font-bold text-sm md:text-base transition-all shadow-soft hover:shadow-soft-lg active:scale-95 bg-gradient-to-r from-red-500 to-red-600 text-white border-2 border-red-400 mb-4"
                                  >
                                    <span className="block text-lg mb-1">🛑</span>
                                    <span>END PLAY</span>
                                  </button>
                                )}

                                {/* Status Update Buttons */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateSnookerBookingStatus(booking.snooker_order_id, 'Received');
                                    }}
                                    disabled={booking.order_status === 'Received'}
                                    className={`py-3 px-3 md:px-4 rounded-xl font-bold text-xs md:text-sm transition-all shadow-soft hover:shadow-soft-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${
                                      booking.order_status === 'Received'
                                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-2 border-yellow-400'
                                        : 'bg-gradient-to-br from-yellow-100 to-orange-100 text-yellow-700 hover:from-yellow-200 hover:to-orange-200 border border-yellow-300'
                                    }`}
                                  >
                                    <span className="block text-base md:text-lg mb-0.5">⏳</span>
                                    <span>Received</span>
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateSnookerBookingStatus(booking.snooker_order_id, 'Accepted');
                                    }}
                                    disabled={booking.order_status === 'Accepted'}
                                    className={`py-3 px-3 md:px-4 rounded-xl font-bold text-xs md:text-sm transition-all shadow-soft hover:shadow-soft-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${
                                      booking.order_status === 'Accepted'
                                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-2 border-blue-400'
                                        : 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 hover:from-blue-200 hover:to-indigo-200 border border-blue-300'
                                    }`}
                                  >
                                    <span className="block text-base md:text-lg mb-0.5">✅</span>
                                    <span>Accepted</span>
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateSnookerBookingStatus(booking.snooker_order_id, 'Started');
                                    }}
                                    disabled={booking.order_status === 'Started' || booking.order_status === 'STARTED'}
                                    className={`py-3 px-3 md:px-4 rounded-xl font-bold text-xs md:text-sm transition-all shadow-soft hover:shadow-soft-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${
                                      booking.order_status === 'Started' || booking.order_status === 'STARTED'
                                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-2 border-green-400'
                                        : 'bg-gradient-to-br from-green-100 to-emerald-100 text-green-700 hover:from-green-200 hover:to-emerald-200 border border-green-300'
                                    }`}
                                  >
                                    <span className="block text-base md:text-lg mb-0.5">▶️</span>
                                    <span>Started</span>
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateSnookerBookingStatus(booking.snooker_order_id, 'Paused');
                                    }}
                                    disabled={booking.order_status === 'Paused'}
                                    className={`py-3 px-3 md:px-4 rounded-xl font-bold text-xs md:text-sm transition-all shadow-soft hover:shadow-soft-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${
                                      booking.order_status === 'Paused'
                                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-2 border-purple-400'
                                        : 'bg-gradient-to-br from-purple-100 to-pink-100 text-purple-700 hover:from-purple-200 hover:to-pink-200 border border-purple-300'
                                    }`}
                                  >
                                    <span className="block text-base md:text-lg mb-0.5">⏸️</span>
                                    <span>Paused</span>
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateSnookerBookingStatus(booking.snooker_order_id, 'Resumed');
                                    }}
                                    disabled={booking.order_status === 'Resumed'}
                                    className={`py-3 px-3 md:px-4 rounded-xl font-bold text-xs md:text-sm transition-all shadow-soft hover:shadow-soft-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${
                                      booking.order_status === 'Resumed'
                                        ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white border-2 border-cyan-400'
                                        : 'bg-gradient-to-br from-cyan-100 to-teal-100 text-cyan-700 hover:from-cyan-200 hover:to-teal-200 border border-cyan-300'
                                    }`}
                                  >
                                    <span className="block text-base md:text-lg mb-0.5">▶️</span>
                                    <span>Resumed</span>
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateSnookerBookingStatus(booking.snooker_order_id, 'Ended');
                                    }}
                                    disabled={booking.order_status === 'Ended' || booking.order_status === 'ENDED'}
                                    className={`py-3 px-3 md:px-4 rounded-xl font-bold text-xs md:text-sm transition-all shadow-soft hover:shadow-soft-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${
                                      booking.order_status === 'Ended' || booking.order_status === 'ENDED'
                                        ? 'bg-gradient-to-r from-gray-500 to-slate-500 text-white border-2 border-gray-400'
                                        : 'bg-gradient-to-br from-gray-100 to-slate-100 text-gray-700 hover:from-gray-200 hover:to-slate-200 border border-gray-300'
                                    }`}
                                  >
                                    <span className="block text-base md:text-lg mb-0.5">✅</span>
                                    <span>Ended</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </>
        )}

        {/* Workspace Booking Tab */}
        {activeTab === 'workspace' && (
          <>
            {/* Workspace Bookings Header */}
            <div className="mb-6 md:mb-8">
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <h2 className="text-2xl md:text-3xl font-bold text-green-600 flex items-center gap-3">
                  <span className="text-3xl md:text-4xl">💼</span>
                  <span>Workspace Bookings</span>
                </h2>
              </div>
              <p className="text-gray-600 mt-2 text-sm md:text-base font-medium text-center">
                Click on a booking to expand and view details
              </p>
            </div>

            {/* Loading State */}
            {workspaceLoading && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 mb-4 shadow-soft">
                  <div className="animate-pulse">
                    <span className="text-5xl text-green-600">⏳</span>
                  </div>
                </div>
                <p className="text-gray-700 font-bold text-lg">Loading Bookings...</p>
              </div>
            )}

            {/* Empty State */}
            {!workspaceLoading && workspaceBookings.length === 0 && (
              <div className="relative rounded-3xl overflow-hidden shadow-soft-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-green-50/80 backdrop-blur-xl"></div>
                <div className="relative z-10 text-center py-16 md:py-20 px-6">
                  <div className="inline-flex items-center justify-center w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 mb-6 shadow-soft">
                    <span className="text-6xl md:text-7xl">💼</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-transparent bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text mb-3">No bookings yet</h3>
                  <p className="text-gray-600 font-medium">Workspace bookings will appear here as customers reserve seats</p>
                </div>
              </div>
            )}

            {/* Workspace Bookings Grid */}
            {!workspaceLoading && workspaceBookings.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {workspaceBookings
                  .filter(booking => {
                    // Show all bookings with status: Received, Accepted, Paid, Delivered, Rejected
                    const validStatuses = ['Received', 'Accepted', 'Paid', 'Delivered', 'Rejected'];
                    return validStatuses.includes(booking.order_status);
                  })
                  .map(booking => {
                    const isExpanded = expandedWorkspaceBookings.has(booking.workspace_order_id);
                    const seatInfo = booking.workspace_seat_menu_items;
                    const workspaceStatusConfig = {
                      Received: {
                        label: 'Received',
                        color: 'border-yellow-300',
                        cardBg: 'bg-gradient-to-br from-yellow-50 via-yellow-100/70 to-orange-50/80',
                        textColor: 'text-yellow-700',
                        badge: 'bg-gradient-to-r from-yellow-500 to-orange-500',
                        icon: '⏳',
                      },
                      Accepted: {
                        label: 'Accepted',
                        color: 'border-blue-300',
                        cardBg: 'bg-gradient-to-br from-blue-50 via-blue-100/70 to-indigo-50/80',
                        textColor: 'text-blue-700',
                        badge: 'bg-gradient-to-r from-blue-500 to-indigo-500',
                        icon: '✅',
                      },
                      Paid: {
                        label: 'Paid',
                        color: 'border-green-300',
                        cardBg: 'bg-gradient-to-br from-green-50 via-green-100/70 to-emerald-50/80',
                        textColor: 'text-green-700',
                        badge: 'bg-gradient-to-r from-green-500 to-emerald-500',
                        icon: '💰',
                      },
                      Delivered: {
                        label: 'Delivered',
                        color: 'border-gray-300',
                        cardBg: 'bg-gradient-to-br from-gray-50 via-gray-100/70 to-slate-50/80',
                        textColor: 'text-gray-700',
                        badge: 'bg-gradient-to-r from-gray-500 to-slate-500',
                        icon: '✅',
                      },
                      Rejected: {
                        label: 'Rejected',
                        color: 'border-red-400',
                        cardBg: 'bg-gradient-to-br from-red-50 via-red-100/70 to-rose-50/80',
                        textColor: 'text-red-800',
                        badge: 'bg-gradient-to-r from-red-600 to-rose-600',
                        icon: '❌',
                      },
                    };
                    const config = workspaceStatusConfig[booking.order_status] || workspaceStatusConfig.Received;
                    const totalAmount = seatInfo ? booking.seats_count * seatInfo.workspace_seat_value : 0;

                    return (
                      <div
                        key={booking.workspace_order_id}
                        className="relative rounded-2xl overflow-hidden transition-all shadow-soft hover:shadow-soft-lg"
                      >
                        {/* Card Background with Status Color */}
                        <div className={`relative ${config.cardBg} p-5 md:p-6 border-2 ${config.color} rounded-2xl`}>
                          {/* Glass Effect Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-2xl pointer-events-none"></div>
                          
                          {/* Content */}
                          <div className="relative z-10">
                            {/* Booking Header - Clickable */}
                            <div
                              onClick={() => {
                                const newExpanded = new Set(expandedWorkspaceBookings);
                                if (isExpanded) {
                                  newExpanded.delete(booking.workspace_order_id);
                                } else {
                                  newExpanded.add(booking.workspace_order_id);
                                }
                                setExpandedWorkspaceBookings(newExpanded);
                              }}
                              className="w-full text-left hover:bg-white/30 rounded-xl p-3 -m-3 mb-0 transition-all cursor-pointer"
                            >
                              <div className="flex items-start justify-between gap-4">
                                {/* Left Section - Customer Info */}
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  {/* Status Icon */}
                                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl ${config.badge} flex items-center justify-center shadow-soft flex-shrink-0`}>
                                    <span className="text-2xl md:text-3xl text-white">{config.icon}</span>
                                  </div>

                                  {/* Customer Name & Booking ID */}
                                  <div className="flex-1 min-w-0 space-y-1">
                                    <h3 className="text-base md:text-lg font-bold text-gray-800 truncate leading-tight">
                                      {booking.customer_name}
                                    </h3>
                                    <p className="text-xs text-gray-600 font-medium truncate">
                                      📞 {booking.customer_phno || 'N/A'}
                                    </p>
                                    <p className="text-xs text-gray-600 font-medium truncate">
                                      #{booking.workspace_order_id.slice(0, 8)}
                                      {seatInfo && ` • Seat ID: ${booking.workspace_seat_id}`}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(booking.created_at).toLocaleString('en-US', { 
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </p>
                                  </div>
                                </div>

                                {/* Right Section - Status */}
                                <div className="text-right flex-shrink-0 flex flex-col items-end">
                                  {/* Status Badge */}
                                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg ${config.badge} mb-2`}>
                                    <span className="text-xs font-bold text-white uppercase">{config.label}</span>
                                    {booking.order_status === 'Received' && (
                                      <span className="text-sm animate-pulse" title="Notification sound active - needs attention">
                                        🔊
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs font-semibold text-gray-600 mt-2">
                                    {isExpanded ? '▲ Hide' : '▼ Show'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t-2 border-gray-300/50">
                                {/* Booking Details */}
                                <div className="mb-4">
                                  <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2 text-sm md:text-base">
                                    <span className="text-lg">💼</span>
                                    <span>Booking Details:</span>
                                  </h4>
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center bg-white/60 rounded-lg px-3 py-2">
                                      <span className="text-sm font-semibold text-gray-700">Seats Count:</span>
                                      <span className="text-sm font-bold text-gray-900">{booking.seats_count}</span>
                                    </div>
                                    {seatInfo && (
                                      <>
                                        <div className="flex justify-between items-center bg-white/60 rounded-lg px-3 py-2">
                                          <span className="text-sm font-semibold text-gray-700">Per Seat Cost:</span>
                                          <span className="text-sm font-bold text-gray-900">₹{seatInfo.workspace_seat_value}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white/60 rounded-lg px-3 py-2">
                                          <span className="text-sm font-semibold text-gray-700">Total Amount:</span>
                                          <span className="text-sm font-bold text-green-700">₹{totalAmount}</span>
                                        </div>
                                      </>
                                    )}
                                    <div className="flex justify-between items-center bg-white/60 rounded-lg px-3 py-2">
                                      <span className="text-sm font-semibold text-gray-700">Order Date:</span>
                                      <span className="text-sm font-bold text-gray-900">{booking.order_date}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Status Update Buttons */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateWorkspaceBookingStatus(booking.workspace_order_id, 'Received');
                                    }}
                                    disabled={booking.order_status === 'Received'}
                                    className={`py-3 px-3 md:px-4 rounded-xl font-bold text-xs md:text-sm transition-all shadow-soft hover:shadow-soft-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${
                                      booking.order_status === 'Received'
                                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-2 border-yellow-400'
                                        : 'bg-gradient-to-br from-yellow-100 to-orange-100 text-yellow-700 hover:from-yellow-200 hover:to-orange-200 border border-yellow-300'
                                    }`}
                                  >
                                    <span className="block text-base md:text-lg mb-0.5">⏳</span>
                                    <span>Received</span>
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateWorkspaceBookingStatus(booking.workspace_order_id, 'Accepted');
                                    }}
                                    disabled={booking.order_status === 'Accepted'}
                                    className={`py-3 px-3 md:px-4 rounded-xl font-bold text-xs md:text-sm transition-all shadow-soft hover:shadow-soft-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${
                                      booking.order_status === 'Accepted'
                                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-2 border-blue-400'
                                        : 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 hover:from-blue-200 hover:to-indigo-200 border border-blue-300'
                                    }`}
                                  >
                                    <span className="block text-base md:text-lg mb-0.5">✅</span>
                                    <span>Accepted</span>
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateWorkspaceBookingStatus(booking.workspace_order_id, 'Rejected');
                                    }}
                                    disabled={booking.order_status === 'Rejected'}
                                    className={`py-3 px-3 md:px-4 rounded-xl font-bold text-xs md:text-sm transition-all shadow-soft hover:shadow-soft-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${
                                      booking.order_status === 'Rejected'
                                        ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-2 border-red-500'
                                        : 'bg-gradient-to-br from-red-100 to-rose-100 text-red-800 hover:from-red-200 hover:to-rose-200 border border-red-400'
                                    }`}
                                  >
                                    <span className="block text-base md:text-lg mb-0.5">❌</span>
                                    <span>Rejected</span>
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateWorkspaceBookingStatus(booking.workspace_order_id, 'Delivered');
                                    }}
                                    disabled={booking.order_status === 'Delivered'}
                                    className={`py-3 px-3 md:px-4 rounded-xl font-bold text-xs md:text-sm transition-all shadow-soft hover:shadow-soft-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${
                                      booking.order_status === 'Delivered'
                                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-2 border-green-400'
                                        : 'bg-gradient-to-br from-green-100 to-emerald-100 text-green-700 hover:from-green-200 hover:to-emerald-200 border border-green-300'
                                    }`}
                                  >
                                    <span className="block text-base md:text-lg mb-0.5">✅</span>
                                    <span>Delivered</span>
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateWorkspaceBookingStatus(booking.workspace_order_id, 'Paid');
                                    }}
                                    disabled={booking.order_status === 'Paid'}
                                    className={`py-3 px-3 md:px-4 rounded-xl font-bold text-xs md:text-sm transition-all shadow-soft hover:shadow-soft-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${
                                      booking.order_status === 'Paid'
                                        ? 'bg-gradient-to-r from-gray-500 to-slate-500 text-white border-2 border-gray-400'
                                        : 'bg-gradient-to-br from-gray-100 to-slate-100 text-gray-700 hover:from-gray-200 hover:to-slate-200 border border-gray-300'
                                    }`}
                                  >
                                    <span className="block text-base md:text-lg mb-0.5">💰</span>
                                    <span>Paid</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </>
        )}

        {/* Customer Billing Tab */}
        {activeTab === 'billing' && (
          <>
            {/* Customer Billing Header */}
            <div className="mb-6 md:mb-8">
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <h2 className="text-2xl md:text-3xl font-bold text-purple-600 flex items-center gap-3">
                  <span className="text-3xl md:text-4xl">💳</span>
                  <span>Customer Billing</span>
                </h2>
              </div>
              <p className="text-gray-600 mt-2 text-sm md:text-base font-medium text-center">
                Click on a customer to expand and view consolidated billing details
              </p>
            </div>

            {/* Loading State */}
            {billingLoading && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 mb-4 shadow-soft">
                  <div className="animate-pulse">
                    <span className="text-5xl text-purple-600">⏳</span>
                  </div>
                </div>
                <p className="text-gray-700 font-bold text-lg">Loading Billing Records...</p>
              </div>
            )}

            {/* Empty State */}
            {!billingLoading && customerBillings.length === 0 && (
              <div className="relative rounded-3xl overflow-hidden shadow-soft-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-purple-50/80 backdrop-blur-xl"></div>
                <div className="relative z-10 text-center py-16 md:py-20 px-6">
                  <div className="inline-flex items-center justify-center w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 mb-6 shadow-soft">
                    <span className="text-6xl md:text-7xl">💳</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text mb-3">No billing records yet</h3>
                  <p className="text-gray-600 font-medium">Customer billing records will appear here as orders are placed</p>
                </div>
              </div>
            )}

            {/* Customer Billing Grid */}
            {!billingLoading && customerBillings.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {customerBillings.map((billing) => {
                  const isExpanded = expandedBillings.has(billing.customer_phno);
                  const latestOrder = billing.latestdate_allorder_json || {};
                  const billingStatusConfig = {
                    PAID: {
                      label: 'Paid',
                      color: 'border-green-300',
                      cardBg: 'bg-gradient-to-br from-green-50 via-green-100/70 to-emerald-50/80',
                      textColor: 'text-green-700',
                      badge: 'bg-gradient-to-r from-green-500 to-emerald-500',
                      icon: '💰',
                    },
                    UNPAID: {
                      label: 'Unpaid',
                      color: 'border-red-300',
                      cardBg: 'bg-gradient-to-br from-red-50 via-orange-100/70 to-red-50/80',
                      textColor: 'text-red-700',
                      badge: 'bg-gradient-to-r from-red-500 to-orange-500',
                      icon: '💳',
                    },
                  };
                  const config = billingStatusConfig[billing.latestdate_allorder_status] || billingStatusConfig.UNPAID;

                  return (
                    <div
                      key={billing.customer_phno}
                      className="relative rounded-2xl overflow-hidden transition-all shadow-soft hover:shadow-soft-lg"
                    >
                      <div className={`relative ${config.cardBg} p-5 md:p-6 border-2 ${config.color} rounded-2xl`}>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-2xl pointer-events-none"></div>
                        
                        <div className="relative z-10">
                          {/* Billing Header - Clickable */}
                          <div
                            onClick={() => {
                              const newExpanded = new Set(expandedBillings);
                              if (isExpanded) {
                                newExpanded.delete(billing.customer_phno);
                              } else {
                                newExpanded.add(billing.customer_phno);
                              }
                              setExpandedBillings(newExpanded);
                            }}
                            className="w-full text-left hover:bg-white/30 rounded-xl p-3 -m-3 mb-0 transition-all cursor-pointer"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl ${config.badge} flex items-center justify-center shadow-soft flex-shrink-0`}>
                                  <span className="text-2xl md:text-3xl text-white">{config.icon}</span>
                                </div>
                                <div className="flex-1 min-w-0 space-y-1">
                                  <h3 className="text-base md:text-lg font-bold text-gray-800 truncate leading-tight">
                                    {billing.customer_name}
                                  </h3>
                                  <p className="text-xs text-gray-600 font-medium truncate">
                                    📞 {billing.customer_phno || 'N/A'}
                                  </p>
                                  <p className="text-xs text-gray-600 font-medium">
                                    Total Value: ₹{billing.total_ordered_value_at_socialx.toFixed(2)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(billing.updated_at).toLocaleString('en-US', { 
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 flex flex-col items-end">
                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg ${config.badge} mb-2`}>
                                  <span className="text-xs font-bold text-white uppercase">{config.label}</span>
                                  {billing.latestdate_allorder_status === 'UNPAID' && (
                                    <span className="text-sm animate-pulse" title="Notification sound active - needs attention">
                                      🔊
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-semibold text-gray-600 mt-2">
                                  {isExpanded ? '▲ Hide' : '▼ Show'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t-2 border-gray-300/50">
                              {/* Order History from order_history_json */}
                              {billing.order_history_json && billing.order_history_json.length > 0 ? (
                                <div className="space-y-4 mb-4">
                                  <h4 className="font-bold text-gray-700 mb-3 flex items-center justify-between text-sm md:text-base">
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg">📋</span>
                                      <span>Order History:</span>
                                    </div>
                                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg ${
                                      billing.latestdate_allorder_status === 'PAID' 
                                        ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                                        : 'bg-gradient-to-r from-red-500 to-orange-500'
                                    }`}>
                                      <span className="text-xs font-bold text-white uppercase">
                                        {billing.latestdate_allorder_status || 'UNPAID'}
                                      </span>
                                    </div>
                                  </h4>
                                  {billing.order_history_json.map((orderHistory: any, index: number) => {
                                    const orderDate = orderHistory.order_date || 'N/A';
                                    const orderValue = orderHistory.allorder_value || 0;
                                    const orderStatus = orderHistory.allOrder_Status || 'UNPAID';
                                    const foodUUIDs = orderHistory.FoodOrderUUID || '';
                                    const workspaceUUIDs = orderHistory.WorkSpaceOrderUUID || '';
                                    const snookerUUIDs = orderHistory.SnookerOrderUUID || '';
                                    
                                    const orderStatusConfig = {
                                      PAID: {
                                        label: 'Paid',
                                        color: 'border-green-300',
                                        bg: 'bg-green-50/80',
                                        textColor: 'text-green-700',
                                        badge: 'bg-gradient-to-r from-green-500 to-emerald-500',
                                      },
                                      UNPAID: {
                                        label: 'Unpaid',
                                        color: 'border-red-300',
                                        bg: 'bg-red-50/80',
                                        textColor: 'text-red-700',
                                        badge: 'bg-gradient-to-r from-red-500 to-orange-500',
                                      },
                                    };
                                    const statusConfig = orderStatusConfig[orderStatus as 'PAID' | 'UNPAID'] || orderStatusConfig.UNPAID;

                                    return (
                                      <div
                                        key={index}
                                        className={`relative rounded-xl overflow-hidden ${statusConfig.bg} border-2 ${statusConfig.color} p-4`}
                                      >
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-xl pointer-events-none"></div>
                                        
                                        <div className="relative z-10">
                                          {/* Order Date Header */}
                                          <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                              <span className="text-lg">📅</span>
                                              <h5 className="font-bold text-gray-800 text-sm md:text-base">
                                                {new Date(orderDate).toLocaleDateString('en-US', { 
                                                  weekday: 'short',
                                                  year: 'numeric',
                                                  month: 'short',
                                                  day: 'numeric'
                                                })}
                                              </h5>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg ${statusConfig.badge}`}>
                                                <span className="text-xs font-bold text-white uppercase">{statusConfig.label}</span>
                                              </div>
                                              <span className="text-sm font-bold text-gray-900">₹{orderValue.toFixed(2)}</span>
                                            </div>
                                          </div>

                                          {/* Sub-cards for individual order types */}
                                          <div className="space-y-3">
                                            {/* Food Orders */}
                                            {orderHistory.foodOrders && orderHistory.foodOrders.length > 0 && (() => {
                                              const subCardKey = `${billing.customer_phno}-${orderDate}-food`;
                                              const isSubCardExpanded = expandedSubCards.has(subCardKey);
                                              const allPaid = orderHistory.foodOrders.every((fo: any) => 
                                                fo.status === 'paid' || fo.status === 'Paid'
                                              );
                                              const statusBadge = allPaid 
                                                ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                                                : 'bg-gradient-to-r from-red-500 to-orange-500';
                                              
                                              return (
                                                <div className="bg-orange-50/90 rounded-lg p-3 border-2 border-orange-300">
                                                  <div 
                                                    className="flex items-center justify-between mb-2 cursor-pointer hover:bg-orange-100/50 rounded p-1 -m-1 transition-all"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      const newExpanded = new Set(expandedSubCards);
                                                      if (isSubCardExpanded) {
                                                        newExpanded.delete(subCardKey);
                                                      } else {
                                                        newExpanded.add(subCardKey);
                                                      }
                                                      setExpandedSubCards(newExpanded);
                                                    }}
                                                  >
                                                    <div className="flex items-center gap-2">
                                                      <span className="text-lg">🍽️</span>
                                                      <p className="text-xs font-bold text-orange-700">Food Order(s)</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg ${statusBadge}`}>
                                                        <span className="text-xs font-bold text-white uppercase">
                                                          {allPaid ? 'PAID' : 'UNPAID'}
                                                        </span>
                                                      </div>
                                                      <span className="text-xs font-semibold text-gray-600">
                                                        {isSubCardExpanded ? '▲' : '▼'}
                                                      </span>
                                                    </div>
                                                  </div>
                                                  {isSubCardExpanded && (
                                                    <div>
                                                      {orderHistory.foodOrders.map((foodOrder: any, foodIdx: number) => {
                                                  const items = Array.isArray(foodOrder.items) ? foodOrder.items : [];
                                                  const subtotal = foodOrder.total_amount || 0;
                                                  const isPaid = foodOrder.status === 'paid' || foodOrder.status === 'Paid';
                                                  return (
                                                    <div key={foodIdx} className="mb-2 last:mb-0 bg-white/60 rounded-lg p-2 border border-orange-200">
                                                      <div className="flex items-center justify-between mb-1.5">
                                                        <div className="text-xs text-gray-600 font-semibold">
                                                          Order #{foodOrder.id.slice(0, 8)}
                                                        </div>
                                                        <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${
                                                          isPaid 
                                                            ? 'bg-green-500 text-white' 
                                                            : 'bg-red-500 text-white'
                                                        }`}>
                                                          <span className="text-xs font-bold uppercase">
                                                            {isPaid ? 'PAID' : 'UNPAID'}
                                                          </span>
                                                        </div>
                                                      </div>
                                                      {items.length > 0 ? (
                                                        <div className="space-y-1 mb-2">
                                                          {items.map((item: any, itemIdx: number) => (
                                                            <div key={itemIdx} className="flex justify-between items-center text-xs">
                                                              <span className="text-gray-700 flex-1 truncate">
                                                                {item.name} × {item.quantity}
                                                              </span>
                                                              <span className="text-gray-800 font-bold ml-2">
                                                                ₹{(item.price || 0) * (item.quantity || 0)}
                                                              </span>
                                                            </div>
                                                          ))}
                                                        </div>
                                                      ) : (
                                                        <div className="text-xs text-gray-500 mb-2">No items found</div>
                                                      )}
                                                      <div className="flex justify-between items-center pt-1.5 border-t border-orange-200 mb-2">
                                                        <span className="text-xs font-bold text-orange-700">Subtotal:</span>
                                                        <span className="text-sm font-bold text-orange-800">₹{subtotal.toFixed(2)}</span>
                                                      </div>
                                                      <div className="flex gap-1.5">
                                                        <button
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            updateIndividualOrderStatus(billing.customer_phno, 'food', foodOrder.id, 'PAID');
                                                          }}
                                                          disabled={isPaid}
                                                          className={`flex-1 py-1 px-2 rounded text-xs font-semibold transition-all ${
                                                            isPaid
                                                              ? 'bg-green-100 text-green-700 cursor-not-allowed opacity-50'
                                                              : 'bg-green-500 text-white hover:bg-green-600 active:scale-95'
                                                          }`}
                                                        >
                                                          💰 Paid
                                                        </button>
                                                        <button
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            updateIndividualOrderStatus(billing.customer_phno, 'food', foodOrder.id, 'UNPAID');
                                                          }}
                                                          disabled={!isPaid}
                                                          className={`flex-1 py-1 px-2 rounded text-xs font-semibold transition-all ${
                                                            !isPaid
                                                              ? 'bg-red-100 text-red-700 cursor-not-allowed opacity-50'
                                                              : 'bg-red-500 text-white hover:bg-red-600 active:scale-95'
                                                          }`}
                                                        >
                                                          💳 Unpaid
                                                        </button>
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                            })()}
                                            
                                            {/* Workspace Bookings */}
                                            {orderHistory.workspaceBookings && orderHistory.workspaceBookings.length > 0 && (() => {
                                              const subCardKey = `${billing.customer_phno}-${orderDate}-workspace`;
                                              const isSubCardExpanded = expandedSubCards.has(subCardKey);
                                              const allPaid = orderHistory.workspaceBookings.every((wb: any) => 
                                                wb.order_status === 'Paid' || wb.order_status === 'PAID'
                                              );
                                              const statusBadge = allPaid 
                                                ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                                                : 'bg-gradient-to-r from-red-500 to-orange-500';
                                              
                                              return (
                                                <div className="bg-green-50/90 rounded-lg p-3 border-2 border-green-300">
                                                  <div 
                                                    className="flex items-center justify-between mb-2 cursor-pointer hover:bg-green-100/50 rounded p-1 -m-1 transition-all"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      const newExpanded = new Set(expandedSubCards);
                                                      if (isSubCardExpanded) {
                                                        newExpanded.delete(subCardKey);
                                                      } else {
                                                        newExpanded.add(subCardKey);
                                                      }
                                                      setExpandedSubCards(newExpanded);
                                                    }}
                                                  >
                                                    <div className="flex items-center gap-2">
                                                      <span className="text-lg">💼</span>
                                                      <p className="text-xs font-bold text-green-700">Workspace Booking(s)</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg ${statusBadge}`}>
                                                        <span className="text-xs font-bold text-white uppercase">
                                                          {allPaid ? 'PAID' : 'UNPAID'}
                                                        </span>
                                                      </div>
                                                      <span className="text-xs font-semibold text-gray-600">
                                                        {isSubCardExpanded ? '▲' : '▼'}
                                                      </span>
                                                    </div>
                                                  </div>
                                                  {isSubCardExpanded && (
                                                    <div>
                                                      {orderHistory.workspaceBookings.map((workspaceBooking: any, wsIdx: number) => {
                                                  const seatInfo = workspaceBooking.workspace_seat_menu_items;
                                                  const subtotal = workspaceBooking.total_order_value || 0;
                                                  const isPaid = workspaceBooking.order_status === 'Paid' || workspaceBooking.order_status === 'PAID';
                                                  return (
                                                    <div key={wsIdx} className="mb-2 last:mb-0 bg-white/60 rounded-lg p-2 border border-green-200">
                                                      <div className="flex items-center justify-between mb-1.5">
                                                        <div className="text-xs text-gray-600 font-semibold">
                                                          Booking #{workspaceBooking.workspace_order_id.slice(0, 8)}
                                                        </div>
                                                        <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${
                                                          isPaid 
                                                            ? 'bg-green-500 text-white' 
                                                            : 'bg-red-500 text-white'
                                                        }`}>
                                                          <span className="text-xs font-bold uppercase">
                                                            {isPaid ? 'PAID' : 'UNPAID'}
                                                          </span>
                                                        </div>
                                                      </div>
                                                      <div className="space-y-1 mb-2">
                                                        <div className="flex justify-between items-center text-xs">
                                                          <span className="text-gray-700">Seat ID:</span>
                                                          <span className="text-gray-800 font-semibold">{workspaceBooking.workspace_seat_id}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-xs">
                                                          <span className="text-gray-700">Seats Count:</span>
                                                          <span className="text-gray-800 font-semibold">{workspaceBooking.seats_count}</span>
                                                        </div>
                                                        {seatInfo && (
                                                          <div className="flex justify-between items-center text-xs">
                                                            <span className="text-gray-700">Seat Value:</span>
                                                            <span className="text-gray-800 font-semibold">₹{seatInfo.workspace_seat_value}</span>
                                                          </div>
                                                        )}
                                                        <div className="flex justify-between items-center text-xs">
                                                          <span className="text-gray-700">Total:</span>
                                                          <span className="text-gray-800 font-semibold">₹{subtotal.toFixed(2)}</span>
                                                        </div>
                                                      </div>
                                                      <div className="flex justify-between items-center pt-1.5 border-t border-green-200 mb-2">
                                                        <span className="text-xs font-bold text-green-700">Subtotal:</span>
                                                        <span className="text-sm font-bold text-green-800">₹{subtotal.toFixed(2)}</span>
                                                      </div>
                                                      <div className="flex gap-1.5">
                                                        <button
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            updateIndividualOrderStatus(billing.customer_phno, 'workspace', workspaceBooking.workspace_order_id, 'PAID');
                                                          }}
                                                          disabled={isPaid}
                                                          className={`flex-1 py-1 px-2 rounded text-xs font-semibold transition-all ${
                                                            isPaid
                                                              ? 'bg-green-100 text-green-700 cursor-not-allowed opacity-50'
                                                              : 'bg-green-500 text-white hover:bg-green-600 active:scale-95'
                                                          }`}
                                                        >
                                                          💰 Paid
                                                        </button>
                                                        <button
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            updateIndividualOrderStatus(billing.customer_phno, 'workspace', workspaceBooking.workspace_order_id, 'UNPAID');
                                                          }}
                                                          disabled={!isPaid}
                                                          className={`flex-1 py-1 px-2 rounded text-xs font-semibold transition-all ${
                                                            !isPaid
                                                              ? 'bg-red-100 text-red-700 cursor-not-allowed opacity-50'
                                                              : 'bg-red-500 text-white hover:bg-red-600 active:scale-95'
                                                          }`}
                                                        >
                                                          💳 Unpaid
                                                        </button>
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                            })()}
                                            
                                            {/* Snooker Bookings */}
                                            {orderHistory.snookerBookings && orderHistory.snookerBookings.length > 0 && (() => {
                                              const subCardKey = `${billing.customer_phno}-${orderDate}-snooker`;
                                              const isSubCardExpanded = expandedSubCards.has(subCardKey);
                                              const allPaid = orderHistory.snookerBookings.every((sb: any) => 
                                                sb.order_status === 'Ended' || sb.order_status === 'ENDED'
                                              );
                                              const statusBadge = allPaid 
                                                ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                                                : 'bg-gradient-to-r from-red-500 to-orange-500';
                                              
                                              return (
                                                <div className="bg-blue-50/90 rounded-lg p-3 border-2 border-blue-300">
                                                  <div 
                                                    className="flex items-center justify-between mb-2 cursor-pointer hover:bg-blue-100/50 rounded p-1 -m-1 transition-all"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      const newExpanded = new Set(expandedSubCards);
                                                      if (isSubCardExpanded) {
                                                        newExpanded.delete(subCardKey);
                                                      } else {
                                                        newExpanded.add(subCardKey);
                                                      }
                                                      setExpandedSubCards(newExpanded);
                                                    }}
                                                  >
                                                    <div className="flex items-center gap-2">
                                                      <span className="text-lg">🎱</span>
                                                      <p className="text-xs font-bold text-blue-700">Snooker Booking(s)</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg ${statusBadge}`}>
                                                        <span className="text-xs font-bold text-white uppercase">
                                                          {allPaid ? 'PAID' : 'UNPAID'}
                                                        </span>
                                                      </div>
                                                      <span className="text-xs font-semibold text-gray-600">
                                                        {isSubCardExpanded ? '▲' : '▼'}
                                                        </span>
                                                    </div>
                                                  </div>
                                                  {isSubCardExpanded && (
                                                    <div>
                                                      {orderHistory.snookerBookings.map((snookerBooking: any, snookerIdx: number) => {
                                                  const boardInfo = snookerBooking.snooker_board_menu_items;
                                                  const subtotal = snookerBooking.total_order_amount || 0;
                                                  const isPaid = snookerBooking.order_status === 'Ended' || snookerBooking.order_status === 'ENDED';
                                                  return (
                                                    <div key={snookerIdx} className="mb-2 last:mb-0 bg-white/60 rounded-lg p-2 border border-blue-200">
                                                      <div className="flex items-center justify-between mb-1.5">
                                                        <div className="text-xs text-gray-600 font-semibold">
                                                          Booking #{snookerBooking.snooker_order_id.slice(0, 8)}
                                                        </div>
                                                        <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${
                                                          isPaid 
                                                            ? 'bg-green-500 text-white' 
                                                            : 'bg-red-500 text-white'
                                                        }`}>
                                                          <span className="text-xs font-bold uppercase">
                                                            {isPaid ? 'PAID' : 'UNPAID'}
                                                          </span>
                                                        </div>
                                                      </div>
                                                      <div className="space-y-1 mb-2">
                                                        {boardInfo && (
                                                          <div className="flex justify-between items-center text-xs">
                                                            <span className="text-gray-700">Board:</span>
                                                            <span className="text-gray-800 font-semibold">{boardInfo.board_name} ({boardInfo.type})</span>
                                                          </div>
                                                        )}
                                                        <div className="flex justify-between items-center text-xs">
                                                          <span className="text-gray-700">Players:</span>
                                                          <span className="text-gray-800 font-semibold">{snookerBooking.players_count || 0}</span>
                                                        </div>
                                                        {snookerBooking.total_duration_minutes && (
                                                          <div className="flex justify-between items-center text-xs">
                                                            <span className="text-gray-700">Duration:</span>
                                                            <span className="text-gray-800 font-semibold">{snookerBooking.total_duration_minutes} min</span>
                                                          </div>
                                                        )}
                                                        <div className="flex justify-between items-center text-xs">
                                                          <span className="text-gray-700">Total:</span>
                                                          <span className="text-gray-800 font-semibold">₹{subtotal.toFixed(2)}</span>
                                                        </div>
                                                      </div>
                                                      <div className="flex justify-between items-center pt-1.5 border-t border-blue-200 mb-2">
                                                        <span className="text-xs font-bold text-blue-700">Subtotal:</span>
                                                        <span className="text-sm font-bold text-blue-800">₹{subtotal.toFixed(2)}</span>
                                                      </div>
                                                      <div className="flex gap-1.5">
                                                        <button
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            updateIndividualOrderStatus(billing.customer_phno, 'snooker', snookerBooking.snooker_order_id, 'PAID');
                                                          }}
                                                          disabled={isPaid}
                                                          className={`flex-1 py-1 px-2 rounded text-xs font-semibold transition-all ${
                                                            isPaid
                                                              ? 'bg-green-100 text-green-700 cursor-not-allowed opacity-50'
                                                              : 'bg-green-500 text-white hover:bg-green-600 active:scale-95'
                                                          }`}
                                                        >
                                                          💰 Paid
                                                        </button>
                                                        <button
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            updateIndividualOrderStatus(billing.customer_phno, 'snooker', snookerBooking.snooker_order_id, 'UNPAID');
                                                          }}
                                                          disabled={!isPaid}
                                                          className={`flex-1 py-1 px-2 rounded text-xs font-semibold transition-all ${
                                                            !isPaid
                                                              ? 'bg-red-100 text-red-700 cursor-not-allowed opacity-50'
                                                              : 'bg-red-500 text-white hover:bg-red-600 active:scale-95'
                                                          }`}
                                                        >
                                                          💳 Unpaid
                                                        </button>
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                            })()}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="mb-4 text-center py-4 bg-white/60 rounded-lg">
                                  <p className="text-sm text-gray-600 font-medium">No order history available</p>
                                </div>
                              )}

                              {/* Status Update Buttons */}
                              <div className="grid grid-cols-2 gap-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateCustomerBillingStatus(billing.customer_phno, 'PAID');
                                  }}
                                  className={`py-2 px-3 rounded-xl font-semibold text-sm transition-all shadow-soft active:scale-95 ${
                                    billing.latestdate_allorder_status === 'PAID'
                                      ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-soft-lg'
                                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                                  }`}
                                >
                                  💰 Paid
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateCustomerBillingStatus(billing.customer_phno, 'UNPAID');
                                  }}
                                  className={`py-2 px-3 rounded-xl font-semibold text-sm transition-all shadow-soft active:scale-95 ${
                                    billing.latestdate_allorder_status === 'UNPAID'
                                      ? 'bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-soft-lg'
                                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                                  }`}
                                >
                                  💳 Unpaid
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateCustomerBillingStatus(billing.customer_phno, 'ACCEPT');
                                  }}
                                  className="py-2 px-3 rounded-xl font-semibold text-sm transition-all shadow-soft active:scale-95 bg-blue-100 text-blue-700 hover:bg-blue-200"
                                >
                                  ✅ Accept
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateCustomerBillingStatus(billing.customer_phno, 'REJECT');
                                  }}
                                  className="py-2 px-3 rounded-xl font-semibold text-sm transition-all shadow-soft active:scale-95 bg-red-100 text-red-700 hover:bg-red-200"
                                >
                                  ❌ Reject
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
        </div>

      {/* Item-wise Metrics Section - Collapsible Tab */}
      {itemMetrics.length > 0 && (
        <div 
          className="w-full py-6 md:py-8"
          style={{
            background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)'
          }}
        >
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10">
            {/* Collapsible Tab Header */}
            <button
              onClick={() => setIsItemMetricsExpanded(!isItemMetricsExpanded)}
              className="w-full relative rounded-2xl overflow-hidden shadow-soft-lg hover:shadow-card-hover transition-all mb-4"
            >
              {/* Glass Effect Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/15 to-white/10 backdrop-blur-xl"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent"></div>
              
              <div className="relative z-10 p-4 md:p-6 border-2 border-white/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl md:text-4xl">📊</span>
                    <div className="text-left">
                      <h2 className="text-xl md:text-2xl font-bold text-orange-900 drop-shadow-lg">
                        Item-wise Metrics
                      </h2>
                      <p className="text-orange-800 text-xs md:text-sm mt-1 font-semibold">
                        Performance breakdown by menu item
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-800 text-sm font-bold">
                      {isItemMetricsExpanded ? 'Hide' : 'Show'}
                    </span>
                    <span className={`text-2xl text-orange-900 transition-transform duration-300 ${isItemMetricsExpanded ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </div>
                </div>
              </div>
            </button>

            {/* Collapsible Content */}
            {isItemMetricsExpanded && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                {itemMetrics.map((item, index) => (
                  <div
                    key={item.menu_item_id}
                    className="relative rounded-2xl overflow-hidden shadow-soft-lg hover:shadow-card-hover transition-all"
                  >
                    {/* Glass Effect Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/15 to-white/10 backdrop-blur-xl"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent"></div>
                    
                    <div className="relative z-10 p-4 md:p-5 border-2 border-orange-200/50 bg-white/80 backdrop-blur-sm">
                      {/* Item Name */}
                      <div className="mb-3">
                        <h3 className="text-base md:text-lg font-bold text-orange-900 truncate drop-shadow-sm">
                          {item.name}
          </h3>
                        {index < 3 && (
                          <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-lg bg-orange-500/80 backdrop-blur-sm">
                            <span className="text-xs font-bold text-white">🔥</span>
                            <span className="text-xs font-bold text-white">Top Seller</span>
                          </div>
                        )}
                      </div>

                      {/* Metrics Grid */}
                      <div className="space-y-2">
                        {/* Total Quantity */}
                        <div className="flex items-center justify-between bg-orange-50/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-orange-200/50">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">📦</span>
                            <span className="text-xs text-orange-800 font-bold">Total Qty</span>
                          </div>
                          <span className="text-sm md:text-base font-bold text-orange-900">{item.totalQuantity}</span>
                        </div>

                        {/* Order Count */}
                        <div className="flex items-center justify-between bg-orange-50/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-orange-200/50">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🛒</span>
                            <span className="text-xs text-orange-800 font-bold">Orders</span>
                          </div>
                          <span className="text-sm md:text-base font-bold text-orange-900">{item.orderCount}</span>
                        </div>

                        {/* Total Revenue */}
                        <div className="flex items-center justify-between bg-orange-50/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-orange-200/50">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">💰</span>
                            <span className="text-xs text-orange-800 font-bold">Revenue</span>
                          </div>
                          <span className="text-sm md:text-base font-bold text-orange-900">₹{item.totalRevenue}</span>
                        </div>

                        {/* Average Quantity */}
                        <div className="flex items-center justify-between bg-orange-50/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-orange-200/50">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">📈</span>
                            <span className="text-xs text-orange-800 font-bold">Avg Qty</span>
                          </div>
                          <span className="text-sm md:text-base font-bold text-orange-900">{item.averageQuantity.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

        {/* Footer */}
      <footer className="mt-12 py-6 text-center border-t border-gray-200/50">
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
  );
}
