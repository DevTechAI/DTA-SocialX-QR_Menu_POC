'use client';

import { useState, useEffect } from 'react';
import { menuItems, categories, getMenuItemsByCategory, type MenuItem } from '@/lib/data/menu-items';

export default function CustomerMenuPage() {
  const [customerName, setCustomerName] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['HOT']); // Start with HOT expanded
  const [selectedItems, setSelectedItems] = useState<{ item: MenuItem; quantity: number }[]>([]);
  const [waiterCalled, setWaiterCalled] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const name = localStorage.getItem('customerName');
    if (!name) {
      window.location.href = '/order';
    } else {
      setCustomerName(name);
    }
  }, []);

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
        setOrderPlaced(true);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      setOrderPlaced(true);
    }
  };

  const handleRefresh = () => {
    localStorage.removeItem('customerName');
    window.location.href = '/order';
  };

  if (!mounted) return null;

  if (orderPlaced) {
    return (
      <div className="min-h-screen gradient-soft flex items-center justify-center p-4">
        <div className="relative group max-w-md w-full">
          {/* Glowing border effect */}
          <div className="absolute -inset-0.5 gradient-primary rounded-[28px] opacity-75 blur-md"></div>
          
          {/* Main card with glass-morphism */}
          <div className="relative rounded-3xl overflow-hidden shadow-soft-xl">
            {/* Glass background */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-purple-50/80 backdrop-blur-xl"></div>
            
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent"></div>
            
            {/* Content */}
            <div className="relative z-10 p-10 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full gradient-primary mb-6 shadow-soft-lg animate-pulse">
                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-transparent bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text mb-4">Order Placed!</h2>
              <p className="text-lg text-gray-700 font-medium mb-6">
                Your order is being prepared. Our staff will serve you shortly!
              </p>
              <div className="relative rounded-2xl overflow-hidden mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-accent-50 to-purple-50"></div>
                <div className="relative z-10 p-4">
                  <p className="text-sm text-primary-700 font-bold flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Cooking in Progress...</span>
                  </p>
                </div>
              </div>
              <button
                onClick={handleRefresh}
                className="relative w-full py-3 px-6 rounded-xl font-bold transition-all shadow-soft hover:shadow-soft-lg active:scale-95 overflow-hidden group/btn"
              >
                <div className="absolute inset-0 gradient-primary"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent group-hover/btn:from-white/30 transition-all"></div>
                <span className="relative z-10 text-white">Start New Order</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen gradient-soft pb-32 flex flex-col items-center">
      {/* Header with Banner Background - Mobile Container */}
      <div className="w-full max-w-md shadow-soft-lg sticky top-0 z-10 relative overflow-hidden gradient-primary rounded-b-2xl">
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
      <div className="w-full max-w-md px-6 py-4 space-y-3">
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
                <div className="absolute -inset-0.5 gradient-primary rounded-2xl opacity-0 group-hover/header:opacity-75 blur-sm transition duration-300"></div>
                
                {/* Main header bar */}
                <div className="relative rounded-2xl overflow-hidden shadow-soft hover:shadow-soft-lg transition-all duration-300">
                  {/* Glass background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-purple-50/80 backdrop-blur-md"></div>
                  
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-0 group-hover/header:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Content */}
                  <div className="relative z-10 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-transparent bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text">
                      {category}
                    </h3>
                    <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                      <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </button>

              {/* Expandable Items List */}
              <div className={`overflow-hidden transition-all duration-500 ${isExpanded ? 'max-h-[5000px] opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
                <div className="space-y-3">
                  {categoryItems.map(item => {
                    const selectedItem = selectedItems.find(i => i.item.id === item.id);
                    const quantity = selectedItem?.quantity || 0;

                    return (
                      <div
                        key={item.id}
                        className="relative group"
                      >
                        {/* Glowing border effect on hover */}
                        <div className="absolute -inset-0.5 gradient-primary rounded-[20px] opacity-0 group-hover:opacity-75 blur-sm transition duration-300"></div>
                        
                        {/* Main card with glass-morphism */}
                        <div className="relative rounded-2xl overflow-hidden shadow-soft hover:shadow-soft-lg transition-all duration-300 transform hover:scale-[1.01]">
                          {/* Glass background */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-purple-50/80 backdrop-blur-md"></div>
                          
                          {/* Shine effect */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          
                          {/* Content */}
                          <div className="relative z-10 p-5">
                            {/* Title Row with Icon and Add Button */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3 flex-1">
                                {item.icon && (
                                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center shadow-sm border border-primary-100 overflow-hidden">
                                    {item.icon.startsWith('/') || item.icon.startsWith('http') ? (
                                      <img 
                                        src={item.icon} 
                                        alt={item.name}
                                        className="w-10 h-10 object-contain"
                                      />
                                    ) : (
                                      <span className="text-2xl">{item.icon}</span>
                                    )}
                                  </div>
                                )}
                                <h3 className="text-lg font-bold text-gray-800 flex-1">{item.name}</h3>
                              </div>
                              
                              {/* Add Button or Quantity Controls */}
                              {quantity > 0 ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => removeItem(item.id)}
                                    className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 text-white font-bold hover:shadow-soft-lg transition-all active:scale-95 shadow-soft"
                                  >
                                    −
                                  </button>
                                  <span className="text-base font-bold text-gray-800 min-w-[35px] text-center bg-gradient-to-br from-primary-50 to-accent-50 px-3 py-1 rounded-lg border border-primary-100">
                                    {quantity}
                                  </span>
                                  <button
                                    onClick={() => addItem(item)}
                                    className="w-8 h-8 rounded-lg gradient-primary text-white font-bold hover:shadow-soft-lg transition-all active:scale-95 shadow-soft"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addItem(item)}
                                  className="px-5 py-2 gradient-primary text-white font-bold text-sm rounded-lg hover:shadow-soft-lg transition-all active:scale-95 shadow-soft"
                                >
                                  Add +
                                </button>
                              )}
                            </div>
                            
                            {/* Description and Price */}
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-gray-600 flex-1 mr-4 truncate">{item.description}</p>
                              <p className="text-xl font-bold text-primary-600 whitespace-nowrap">₹{item.price}</p>
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

      {/* Fixed Bottom Bar - Elegant Glass Design - Mobile Container */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-xl shadow-soft-xl border-t-2 border-primary-100 rounded-t-2xl safe-area-inset-bottom">
        <div className="p-4 space-y-3">
          {/* Order Summary */}
          {selectedItems.length > 0 && (
            <div className="relative group/summary rounded-2xl overflow-hidden mb-2">
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-accent-50 to-purple-50"></div>
              
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/40 via-transparent to-transparent"></div>
              
              {/* Content */}
              <div className="relative z-10 p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-gray-800">
                    {selectedItems.reduce((sum, i) => sum + i.quantity, 0)} items selected
                  </span>
                  <span className="text-2xl font-bold text-primary-600">
                    ₹{getTotalAmount()}
                  </span>
                </div>
                <div className="text-xs text-gray-600 space-y-2 max-h-24 overflow-y-auto">
                  {selectedItems.map(({ item, quantity }) => (
                    <div key={item.id} className="flex justify-between bg-white/80 backdrop-blur-sm rounded-lg p-2 border border-primary-100">
                      <span className="font-semibold">{item.name} × {quantity}</span>
                      <span className="font-bold text-primary-600">₹{item.price * quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
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
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent group-hover/order:from-white/30 transition-all"></div>
              <span className="relative z-10 text-white">🍽️ Place Order</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
