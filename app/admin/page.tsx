'use client';

import { useState, useEffect } from 'react';
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
  items: OrderItem[];
  total_amount: number;
  status: 'received' | 'delivered' | 'paid' | 'unpaid';
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

export default function AdminDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isItemMetricsExpanded, setIsItemMetricsExpanded] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [amountView, setAmountView] = useState<'ordered' | 'settled'>('settled');

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/signin');
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        const parsedData = data.map((order: any) => ({
          ...order,
          items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
        }));
        setOrders(parsedData);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setOrders(prev =>
          prev.map(order =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
      }
    } catch (error) {
      console.error('Error updating order:', error);
      setOrders(prev =>
        prev.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    }
  };

  // Calculate today's stats
  const todayOrders = orders.filter(order => {
    const orderDate = new Date(order.created_at);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });

  const totalOrderValue = todayOrders.reduce((sum, order) => sum + order.total_amount, 0);
  const numberOfOrders = todayOrders.length;
  const amountSettled = todayOrders
    .filter(order => order.status === 'paid')
    .reduce((sum, order) => sum + order.total_amount, 0);

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

  todayOrders.forEach(order => {
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

  if (loading) {
  return (
      <div className="min-h-screen gradient-soft flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary mb-4 shadow-soft-lg">
            <div className="animate-pulse">
              <span className="text-5xl text-white">⏳</span>
            </div>
          </div>
          <p className="text-gray-700 font-bold text-lg">Loading Dashboard...</p>
          <p className="text-gray-500 text-sm mt-1">Fetching latest orders</p>
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
                  <span className="text-4xl md:text-5xl">👔</span>
                  <span>Admin Dashboard</span>
                </h1>
                <p className="text-white text-base md:text-lg mt-2 font-bold drop-shadow-lg">SocialX Community Café - Order Management</p>
              </div>
              
              {/* Right side - Date and Time + Actions */}
              <div className="flex-1 flex flex-col items-end gap-2">
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Link
                    href="/admin/menu"
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
                  <div className={`w-3 h-3 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'} shadow-soft`}></div>
                  <span className="text-white font-bold text-sm md:text-base">{loading ? 'Syncing...' : 'Live'}</span>
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
        {/* Orders List Header */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-orange-600 flex items-center gap-3">
            <span className="text-3xl md:text-4xl">📦</span>
            <span>Orders Dashboard</span>
          </h2>
          <p className="text-gray-600 mt-2 text-sm md:text-base font-medium">Click on an order to expand and view details</p>
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
                          <div className="grid grid-cols-2 gap-2 md:gap-3">
                            <button
                              onClick={() => updateOrderStatus(order.id, 'received')}
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
                              onClick={() => updateOrderStatus(order.id, 'delivered')}
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
                              onClick={() => updateOrderStatus(order.id, 'paid')}
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
                              onClick={() => updateOrderStatus(order.id, 'unpaid')}
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
            Powered by{' '}
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
