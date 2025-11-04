'use client';

import { useState, useEffect } from 'react';

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
    color: 'bg-yellow-50 border-yellow-300',
    textColor: 'text-yellow-700',
    badge: 'gradient-secondary',
    icon: '⏳',
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-green-50 border-green-300',
    textColor: 'text-green-700',
    badge: 'bg-green-500',
    icon: '✅',
  },
  paid: {
    label: 'Paid',
    color: 'bg-gray-50 border-gray-300',
    textColor: 'text-gray-700',
    badge: 'bg-gray-500',
    icon: '💰',
  },
  unpaid: {
    label: 'Unpaid',
    color: 'bg-red-50 border-red-300',
    textColor: 'text-red-700',
    badge: 'bg-red-500',
    icon: '💳',
  },
};

export default function OrderManagerPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
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

  const getTodayStats = () => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(
      order => new Date(order.created_at).toDateString() === today
    );

    return {
      totalOrders: todayOrders.length,
      totalValue: todayOrders.reduce((sum, order) => sum + order.total_amount, 0),
      amountSettled: todayOrders
        .filter(order => order.status === 'paid')
        .reduce((sum, order) => sum + order.total_amount, 0),
    };
  };

  const stats = getTodayStats();

  if (loading) {
    return (
      <div className="min-h-screen gradient-soft flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-primary mb-4">
            <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen gradient-soft">
      {/* Header */}
      <div className="gradient-primary shadow-soft-lg">
        <div className="max-w-7xl mx-auto p-6">
          <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-4xl">📊</span>
            <span>Order Manager Dashboard</span>
          </h1>
          
          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card-theme bg-white/95 backdrop-blur-sm p-6 hover:shadow-card-hover transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl gradient-secondary flex items-center justify-center">
                  <span className="text-2xl">💵</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Order Value (Today)</p>
                  <p className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">₹{stats.totalValue}</p>
                </div>
              </div>
            </div>
            <div className="card-theme bg-white/95 backdrop-blur-sm p-6 hover:shadow-card-hover transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <span className="text-2xl">🛒</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Number of Orders</p>
                  <p className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">{stats.totalOrders}</p>
                </div>
              </div>
            </div>
            <div className="card-theme bg-white/95 backdrop-blur-sm p-6 hover:shadow-card-hover transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                  <span className="text-2xl">✓</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Amount Settled</p>
                  <p className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">₹{stats.amountSettled}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="max-w-7xl mx-auto p-6">
        {orders.length === 0 ? (
          <div className="card-theme p-12 text-center shadow-soft-lg">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full gradient-soft mb-4">
              <span className="text-5xl">📋</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Orders Yet</h2>
            <p className="text-gray-600">Orders will appear here as customers place them.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {orders.map(order => {
              const config = statusConfig[order.status];
              const isExpanded = expandedOrder === order.id;

              return (
                <div
                  key={order.id}
                  className={`card-theme border-2 transition-all ${config.color}`}
                >
                  {/* Order Header */}
                  <button
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    className="w-full text-left hover:bg-white/50 rounded-2xl p-4 -m-4 mb-0 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-gray-800">
                            {order.customer_name}
                          </h3>
                          <span className={`px-3 py-1 rounded-xl text-xs font-bold text-white shadow-soft ${config.badge}`}>
                            {config.icon} {config.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <span>🕐 {new Date(order.created_at).toLocaleTimeString()}</span>
                          <span>•</span>
                          <span>{order.items.length} items</span>
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
                          ₹{order.total_amount}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {isExpanded ? '▲ Hide' : '▼ Show'}
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t-2 border-gray-200">
                      {/* Items List */}
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <span>📦</span>
                          <span>Order Items:</span>
                        </h4>
                        <div className="space-y-2">
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center bg-white rounded-xl p-3 shadow-soft"
                            >
                              <span className="text-gray-800 font-medium">
                                {item.name} <span className="text-primary-600 font-bold">× {item.quantity}</span>
                              </span>
                              <span className="font-bold text-gray-800">
                                ₹{item.price * item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Status Update Buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => updateOrderStatus(order.id, 'received')}
                          className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-soft active:scale-95 ${
                            order.status === 'received'
                              ? 'gradient-secondary text-white shadow-soft-lg'
                              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          }`}
                        >
                          ⏳ Received
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-soft active:scale-95 ${
                            order.status === 'delivered'
                              ? 'bg-green-500 text-white shadow-soft-lg'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          ✅ Delivered
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'unpaid')}
                          className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-soft active:scale-95 ${
                            order.status === 'unpaid'
                              ? 'bg-red-500 text-white shadow-soft-lg'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          💳 Unpaid
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'paid')}
                          className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-soft active:scale-95 ${
                            order.status === 'paid'
                              ? 'bg-gray-500 text-white shadow-soft-lg'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          💰 Paid
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
