'use client';

import { useState, useEffect } from 'react';
import { menuItems, categories, getMenuItemsByCategory, type MenuItem } from '@/lib/data/menu-items';

type ViewState = 'nameEntry' | 'menu' | 'orderPlaced';

export default function SocialXMenuApp() {
  // View state
  const [currentView, setCurrentView] = useState<ViewState>('nameEntry');
  const [navigationHistory, setNavigationHistory] = useState<ViewState[]>([]);
  
  // Name entry state
  const [customerName, setCustomerName] = useState('');
  
  // Menu state
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
      // Clear all previous order data for a fresh start
      localStorage.removeItem('orderPlaced');
      localStorage.removeItem('selectedItems');
      localStorage.removeItem('orderStatus');
      localStorage.removeItem('orderId');
      localStorage.setItem('customerName', customerName.trim());
      
      // Reset menu state
      setSelectedItems([]);
      setExpandedCategories([]);
      
      navigateToView('menu');
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
      <main className="min-h-screen gradient-soft flex flex-col items-center">
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
                          className="relative w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-white/90 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:outline-none focus:border-primary-400 text-sm sm:text-base transition-all hover:border-primary-300 hover:bg-white shadow-sm font-medium"
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
      <div className="min-h-screen gradient-soft flex flex-col items-center pb-16 sm:pb-20">
        {/* Back Button - Left Arrow */}
        <button
          onClick={navigateBack}
          className="fixed top-2 left-2 md:top-4 md:left-4 z-[60] group/back"
        >
          <div className="relative rounded-lg md:rounded-xl overflow-hidden shadow-soft-lg hover:shadow-soft-xl transition-all active:scale-95">
            {/* Glossy transparent background */}
            <div className="absolute inset-0 bg-white/40 backdrop-blur-md"></div>
            {/* Glass shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent"></div>
            {/* Arrow icon */}
            <div className="relative z-10 p-2 md:p-3">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-primary-600 group-hover/back:text-primary-700 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </div>
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
                                <img 
                                  src={item.icon} 
                                  alt={item.name}
                                  className="w-8 h-8 object-contain"
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
    <main className="min-h-screen gradient-soft flex flex-col items-center">
      {/* Back Button - Left Arrow (to Name Entry) */}
      <button
        onClick={navigateBack}
        className="fixed top-2 left-2 md:top-4 md:left-4 z-[60] group/back"
      >
        <div className="relative rounded-lg md:rounded-xl overflow-hidden shadow-soft-lg hover:shadow-soft-xl transition-all active:scale-95">
          {/* Glossy transparent background */}
          <div className="absolute inset-0 bg-white/40 backdrop-blur-md"></div>
          {/* Glass shine effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent"></div>
          {/* Arrow icon */}
          <div className="relative z-10 p-2 md:p-3">
            <svg className="w-5 h-5 md:w-6 md:h-6 text-primary-600 group-hover/back:text-primary-700 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </div>
        </div>
      </button>

      {/* Forward Button - Right Arrow (to Order Placed) - Only if came from there */}
      {cameFromOrderPlaced && (
        <button
          onClick={() => navigateToView('orderPlaced')}
          className="fixed top-2 right-2 md:top-4 md:right-4 z-[60] group/forward"
        >
          <div className="relative rounded-lg md:rounded-xl overflow-hidden shadow-soft-lg hover:shadow-soft-xl transition-all active:scale-95">
            {/* Glossy transparent background */}
            <div className="absolute inset-0 bg-white/40 backdrop-blur-md"></div>
            {/* Glass shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent"></div>
            {/* Arrow icon */}
            <div className="relative z-10 p-2 md:p-3">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-primary-600 group-hover/forward:text-primary-700 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </button>
      )}

      {/* Header with Banner Background - Mobile Container */}
      <div className="w-full md:max-w-2xl lg:max-w-3xl shadow-soft-lg sticky top-0 z-50 relative overflow-hidden gradient-primary rounded-b-2xl">
        {/* Content Layer with Banner Background */}
        <div 
          className="relative z-10 w-full px-4 py-3 md:px-6 md:py-6"
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
          
          {/* Text Content */}
          <div className="relative z-10">
            <h1 className="text-lg md:text-2xl font-bold text-white flex items-center gap-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.95), 0 4px 12px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,1)' }}>
              <span>Hi, {customerName}!</span>
              <span className="text-xl md:text-3xl">👋</span>
            </h1>
            <p className="text-white text-xs md:text-sm mt-0.5 md:mt-1 font-semibold drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.5)' }}>Choose your favorites from our menu</p>
          </div>
        </div>
      </div>

      {/* Expandable Category Accordion - Mobile Container */}
      <div className="w-full md:max-w-2xl lg:max-w-3xl px-4 md:px-6 lg:px-10 py-2 md:py-3 pb-48 md:pb-64 space-y-1.5">
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
                                    <img 
                                      src={item.icon} 
                                      alt={item.name}
                                      className="w-6 h-6 object-contain"
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

      {/* Fixed Bottom Bar - Fully Opaque - Mobile Container */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-2xl lg:max-w-3xl bg-white shadow-soft-xl border-t-2 border-primary-100 rounded-t-3xl safe-area-inset-bottom z-20">
        <div className="flex flex-col bg-white rounded-t-3xl">
          {/* Scrollable Order Summary - Fixed height to show 2 items */}
          {selectedItems.length > 0 && (
            <div className="relative group/summary rounded-t-3xl overflow-hidden bg-gradient-to-br from-primary-50 via-accent-50 to-orange-50">
              {/* Content */}
              <div className="relative z-10 p-4 rounded-t-3xl">
                {/* Items List - Max height to show 2 items */}
                <div className="text-xs text-gray-600 space-y-2 max-h-[96px] overflow-y-auto mb-3">
                  {selectedItems.map(({ item, quantity }) => (
                    <div key={item.id} className="flex justify-between bg-white rounded-xl p-2 border border-primary-100 shadow-sm">
                      <span className="font-semibold">{item.name} × {quantity}</span>
                      <span className="font-bold text-primary-600">₹{item.price * quantity}</span>
                    </div>
                  ))}
                </div>
                
                {/* Clear Button - Centered */}
                <div className="flex justify-center">
                  <button
                    onClick={handleClearSelection}
                    className="group/clear text-xs font-semibold text-red-500 hover:text-red-600 px-4 py-1.5 rounded-lg bg-white/80 hover:bg-red-50 border border-red-200 hover:border-red-300 transition-all shadow-sm active:scale-95"
                  >
                    <span className="flex items-center gap-1">
                      <span>🗑️</span>
                      <span>Clear All</span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Fixed Buttons at Bottom */}
          <div className="flex gap-3 bg-white p-4 border-t border-primary-100">
            <button
              onClick={handleCallWaiter}
              disabled={waiterCalled}
              className={`relative flex-1 py-3 px-4 rounded-xl font-bold transition-all shadow-soft overflow-hidden group/waiter ${
                waiterCalled ? '' : 'active:scale-95'
              }`}
            >
              {waiterCalled ? (
                <>
                  <div className="absolute inset-0 gradient-primary"></div>
                  <span className="relative z-10 text-white">✓ Help Requested</span>
                </>
              ) : (
                <>
                  <div className="absolute inset-0 bg-white border-2 border-primary-500 group-hover/waiter:bg-gradient-to-br group-hover/waiter:from-primary-50 group-hover/waiter:to-accent-50 transition-all"></div>
                  <span className="relative z-10 text-primary-600">🙋 Call Waiter</span>
                </>
              )}
            </button>
            
            <button
              onClick={handlePlaceOrder}
              disabled={selectedItems.length === 0}
              className="relative flex-1 py-3 px-4 rounded-xl font-bold transition-all shadow-soft disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group/order active:scale-95"
            >
              <div className="absolute inset-0 gradient-primary group-hover/order:shadow-soft-lg transition-all"></div>
              <span className="relative z-10 text-white">🍽️ Place Order</span>
            </button>
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
