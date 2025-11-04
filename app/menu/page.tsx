'use client';

import { useState, useEffect } from 'react';
import { menuItems, categories, getMenuItemsByCategory, type MenuItem } from '@/lib/data/menu-items';

export default function CustomerMenuPage() {
  const [customerName, setCustomerName] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]); // Start with all tabs collapsed
  const [selectedItems, setSelectedItems] = useState<{ item: MenuItem; quantity: number }[]>([]);
  const [waiterCalled, setWaiterCalled] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [orderStatus, setOrderStatus] = useState<'Received' | 'Accepted' | 'In-Progress' | 'Delivered' | 'Bill Generated' | 'Bill Paid'>('Received');
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    setMounted(true);
    const name = localStorage.getItem('customerName');
    if (!name) {
      window.location.href = '/';
    } else {
      setCustomerName(name);
      
      // Restore selected items from localStorage
      const savedItems = localStorage.getItem('selectedItems');
      if (savedItems) {
        try {
          setSelectedItems(JSON.parse(savedItems));
        } catch (error) {
          console.error('Error loading saved items:', error);
        }
      }

      // Restore order placed state from localStorage
      const savedOrderPlaced = localStorage.getItem('orderPlaced');
      if (savedOrderPlaced === 'true') {
        setOrderPlaced(true);
      }

      // Restore order status from localStorage
      const savedOrderStatus = localStorage.getItem('orderStatus');
      if (savedOrderStatus) {
        setOrderStatus(savedOrderStatus as any);
      }

      // Restore order ID from localStorage
      const savedOrderId = localStorage.getItem('orderId');
      if (savedOrderId) {
        setOrderId(savedOrderId);
      }
    }
  }, []);

  // Save selected items to localStorage whenever they change
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('selectedItems', JSON.stringify(selectedItems));
    }
  }, [selectedItems, mounted]);

  // Update current time every second when order is placed
  useEffect(() => {
    if (orderPlaced) {
      const timer = setInterval(() => {
        setCurrentTime(new Date().toLocaleTimeString());
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [orderPlaced]);

  // Save order placed state to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('orderPlaced', orderPlaced.toString());
    }
  }, [orderPlaced, mounted]);

  // Save order status to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('orderStatus', orderStatus);
    }
  }, [orderStatus, mounted]);

  // Mock Order ID (will be replaced by backend API later)
  const getMockOrderId = () => {
    return 'SX122344'; // Fixed mock data
  };

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
        setOrderPlaced(true);
        // Keep selectedItems in localStorage so they persist on refresh
      }
    } catch (error) {
      console.error('Error placing order:', error);
      const mockOrderId = getMockOrderId();
      setOrderId(mockOrderId);
      localStorage.setItem('orderId', mockOrderId);
      setOrderPlaced(true);
      // Keep selectedItems in localStorage so they persist on refresh
    }
  };

  const handleRefresh = () => {
    localStorage.removeItem('customerName');
    localStorage.removeItem('selectedItems');
    localStorage.removeItem('orderPlaced');
    localStorage.removeItem('orderStatus');
    localStorage.removeItem('orderId');
    window.location.href = '/';
  };

  if (!mounted) return null;

  if (orderPlaced) {
    return (
      <div className="min-h-screen gradient-soft flex flex-col items-center pb-16 sm:pb-20">
        {/* Header with Banner Background - Mobile Container (No Text) */}
        <div className="w-full max-w-md md:max-w-2xl lg:max-w-3xl shadow-soft-lg sticky top-0 z-50 relative overflow-hidden gradient-primary rounded-b-2xl mb-4">
          {/* Content Layer with Banner Background */}
          <div 
            className="relative z-10 w-full px-6 py-12"
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
        <div className="relative group max-w-md md:max-w-2xl lg:max-w-3xl w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-8 mb-6 sm:mb-8">
          {/* Glowing border effect */}
          <div className="absolute -inset-0.5 gradient-primary rounded-[28px] opacity-75 blur-md"></div>
          
          {/* Main card with glass-morphism */}
          <div className="relative rounded-3xl overflow-hidden shadow-soft-xl flex flex-col">
            {/* Glass background */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-purple-50/80 backdrop-blur-xl"></div>
            
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
                  <div className="bg-gradient-to-br from-primary-50 via-accent-50 to-purple-50 rounded-2xl p-4 border border-primary-100">
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
                      <div className="bg-gradient-to-br from-white via-white to-purple-50/60 p-4 border border-primary-100 shadow-sm">
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
                  <div className="bg-gradient-to-br from-primary-50 via-accent-50 to-purple-50 rounded-2xl p-4 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-800">Total Amount</span>
                      <span className="text-2xl font-bold text-primary-600">₹{getTotalAmount()}</span>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={handleRefresh}
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

  return (
    <main className="min-h-screen gradient-soft flex flex-col items-center">
      {/* Header with Banner Background - Mobile Container */}
      <div className="w-full max-w-md md:max-w-2xl lg:max-w-3xl shadow-soft-lg sticky top-0 z-50 relative overflow-hidden gradient-primary rounded-b-2xl">
        {/* Content Layer with Banner Background */}
        <div 
          className="relative z-10 w-full px-6 py-6"
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
            <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.95), 0 4px 12px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,1)' }}>
              <span>Hi, {customerName}!</span>
              <span className="text-3xl">👋</span>
            </h1>
            <p className="text-white text-sm mt-1 font-semibold drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.5)' }}>Choose your favorites from our menu</p>
          </div>
        </div>
      </div>

      {/* Expandable Category Accordion - Mobile Container */}
      <div className="w-full max-w-md md:max-w-2xl lg:max-w-3xl px-6 md:px-8 lg:px-10 py-3 pb-64 space-y-1.5">
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
                  <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-purple-50/80 backdrop-blur-md"></div>
                  
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-0 group-hover/header:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Content */}
                  <div className="relative z-10 px-5 py-2.5 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-transparent bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text">
                      {category}
                    </h3>
                    <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                      <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </button>

              {/* Expandable Items List */}
              <div className={`overflow-hidden transition-all duration-500 ${isExpanded ? 'max-h-[5000px] opacity-100 mt-1.5' : 'max-h-0 opacity-0'}`}>
                <div className="space-y-1.5">
                  {categoryItems.map(item => {
                    const selectedItem = selectedItems.find(i => i.item.id === item.id);
                    const quantity = selectedItem?.quantity || 0;

                    return (
                      <div
                        key={item.id}
                        className="relative group"
                      >
                        {/* Glowing border effect on hover */}
                        <div className="absolute -inset-0.5 gradient-primary rounded-xl opacity-0 group-hover:opacity-75 blur-sm transition duration-300"></div>
                        
                        {/* Main card with glass-morphism */}
                        <div className="relative rounded-xl overflow-hidden shadow-soft hover:shadow-soft-lg transition-all duration-300 transform hover:scale-[1.01]">
                          {/* Glass background */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-purple-50/80 backdrop-blur-md"></div>
                          
                          {/* Shine effect */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          
                          {/* Content */}
                          <div className="relative z-10 p-2.5">
                            {/* Title Row with Icon and Add Button */}
                            <div className="flex items-center justify-between mb-0.5">
                              <div className="flex items-center gap-1.5 flex-1">
                                {item.icon && (
                                  <div className="flex-shrink-0 w-7 h-7 rounded-md bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center shadow-sm border border-primary-100 overflow-hidden">
                                    {item.icon.startsWith('/') || item.icon.startsWith('http') ? (
                                      <img 
                                        src={item.icon} 
                                        alt={item.name}
                                        className="w-5 h-5 object-contain"
                                      />
                                    ) : (
                                      <span className="text-base">{item.icon}</span>
                                    )}
                                  </div>
                                )}
                                <h3 className="text-sm font-bold text-gray-800 flex-1 leading-tight">{item.name}</h3>
                              </div>
                              
                              {/* Add Button or Quantity Controls */}
                              {quantity > 0 ? (
                                <div className="flex items-center gap-0.5">
                                  <button
                                    onClick={() => removeItem(item.id)}
                                    className="w-5 h-5 rounded bg-gradient-to-br from-red-500 to-red-600 text-white text-[10px] font-bold hover:shadow-soft-lg transition-all active:scale-95 shadow-soft flex items-center justify-center"
                                  >
                                    −
                                  </button>
                                  <span className="text-[10px] font-bold text-gray-800 min-w-[24px] text-center bg-gradient-to-br from-primary-50 to-accent-50 px-1.5 py-0.5 rounded border border-primary-100">
                                    {quantity}
                                  </span>
                                  <button
                                    onClick={() => addItem(item)}
                                    className="w-5 h-5 rounded gradient-primary text-white text-[10px] font-bold hover:shadow-soft-lg transition-all active:scale-95 shadow-soft flex items-center justify-center"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addItem(item)}
                                  className="px-2.5 py-0.5 gradient-primary text-white font-bold text-[10px] rounded hover:shadow-soft-lg transition-all active:scale-95 shadow-soft"
                                >
                                  Add
                                </button>
                              )}
                            </div>
                            
                            {/* Description and Price */}
                            <div className="flex justify-between items-center mt-0.5">
                              <p className="text-[9px] text-gray-500 flex-1 mr-1.5 truncate leading-tight">{item.description}</p>
                              <p className="text-sm font-bold text-primary-600 whitespace-nowrap">₹{item.price}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fixed Bottom Bar - Fully Opaque - Mobile Container */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md md:max-w-2xl lg:max-w-3xl bg-white shadow-soft-xl border-t-2 border-primary-100 rounded-t-2xl safe-area-inset-bottom z-20">
        <div className="flex flex-col bg-white">
          {/* Scrollable Order Summary - Fixed height to show 2.5 items */}
          {selectedItems.length > 0 && (
            <div className="relative group/summary rounded-t-2xl overflow-hidden bg-gradient-to-br from-primary-50 via-accent-50 to-purple-50">
              {/* Content */}
              <div className="relative z-10 p-4">
                {/* Items List - Max height to show 2 items */}
                <div className="text-xs text-gray-600 space-y-2 max-h-[96px] overflow-y-auto mb-3">
                  {selectedItems.map(({ item, quantity }) => (
                    <div key={item.id} className="flex justify-between bg-white rounded-lg p-2 border border-primary-100 shadow-sm">
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
