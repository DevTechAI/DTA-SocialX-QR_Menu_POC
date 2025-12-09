'use client';

import { useState, useEffect } from 'react';

interface BillingItem {
  id: string;
  type: 'workspace' | 'food' | 'snooker';
  description: string;
  amount: number;
  created_at: string;
  status: string;
}

interface CustomerBilling {
  customer_phno: string;
  customer_name: string;
  items: BillingItem[];
  total_amount: number;
}

export default function CustomerBillingTab() {
  const [billings, setBillings] = useState<CustomerBilling[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBillings, setExpandedBillings] = useState<Set<string>>(new Set());
  const [searchPhone, setSearchPhone] = useState('');

  // Fetch consolidated billing data
  useEffect(() => {
    const fetchBillings = async () => {
      setLoading(true);
      try {
        // TODO: Implement API call to fetch consolidated billing by phone number
        // This will aggregate data from workspace, food, and snooker bookings
        // For now, return empty array as functionality will be built shortly
        setBillings([]);
      } catch (error) {
        console.error('Error fetching customer billings:', error);
        setBillings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBillings();
  }, []);

  const handleSearch = async () => {
    if (!searchPhone.trim()) return;
    
    setLoading(true);
    try {
      // TODO: Implement search by phone number
      // This will fetch consolidated billing for the specific phone number
      setBillings([]);
    } catch (error) {
      console.error('Error searching customer billing:', error);
      setBillings([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Customer Billing Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <h2 className="text-2xl md:text-3xl font-bold text-purple-600 flex items-center gap-3">
            <span className="text-3xl md:text-4xl">🧾</span>
            <span>Customer Billing</span>
          </h2>
        </div>
        <p className="text-gray-600 mt-2 text-sm md:text-base font-medium text-center">
          Consolidated billing from Workspace, Food Orders, and Snooker bookings
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6 md:mb-8">
        <div className="max-w-md mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter phone number to search..."
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-purple-500 focus:outline-none text-sm md:text-base"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 mb-4 shadow-soft">
            <div className="animate-pulse">
              <span className="text-5xl text-purple-600">⏳</span>
            </div>
          </div>
          <p className="text-gray-700 font-bold text-lg">Loading Billings...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && billings.length === 0 && (
        <div className="relative rounded-3xl overflow-hidden shadow-soft-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-purple-50/80 backdrop-blur-xl"></div>
          <div className="relative z-10 text-center py-16 md:py-20 px-6">
            <div className="inline-flex items-center justify-center w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 mb-6 shadow-soft">
              <span className="text-6xl md:text-7xl">🧾</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text mb-3">
              No billing records found
            </h3>
            <p className="text-gray-600 font-medium">
              {searchPhone 
                ? 'No consolidated billing found for this phone number'
                : 'Search by phone number to view consolidated billing'}
            </p>
          </div>
        </div>
      )}

      {/* Billing Cards Grid */}
      {!loading && billings.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {billings.map((billing) => {
            const isExpanded = expandedBillings.has(billing.customer_phno);
            const billingStatusConfig = {
              paid: {
                label: 'Paid',
                color: 'border-green-300',
                cardBg: 'bg-gradient-to-br from-green-50 via-green-100/70 to-emerald-50/80',
                textColor: 'text-green-700',
                badge: 'bg-gradient-to-r from-green-500 to-emerald-500',
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
              partial: {
                label: 'Partial',
                color: 'border-yellow-300',
                cardBg: 'bg-gradient-to-br from-yellow-50 via-yellow-100/70 to-orange-50/80',
                textColor: 'text-yellow-700',
                badge: 'bg-gradient-to-r from-yellow-500 to-orange-500',
                icon: '⚠️',
              },
            };

            // Determine overall status based on items
            const hasUnpaid = billing.items.some(item => item.status !== 'paid');
            const hasPaid = billing.items.some(item => item.status === 'paid');
            const status = hasUnpaid && hasPaid ? 'partial' : hasUnpaid ? 'unpaid' : 'paid';
            const config = billingStatusConfig[status as keyof typeof billingStatusConfig] || billingStatusConfig.unpaid;

            return (
              <div
                key={billing.customer_phno}
                className="relative rounded-2xl overflow-hidden transition-all shadow-soft hover:shadow-soft-lg"
              >
                {/* Card Background with Status Color */}
                <div className={`relative ${config.cardBg} p-5 md:p-6 border-2 ${config.color} rounded-2xl`}>
                  {/* Glass Effect Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-2xl pointer-events-none"></div>
                  
                  {/* Content */}
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
                        {/* Left Section - Customer Info */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {/* Status Icon */}
                          <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl ${config.badge} flex items-center justify-center shadow-soft flex-shrink-0`}>
                            <span className="text-2xl md:text-3xl text-white">{config.icon}</span>
                          </div>

                          {/* Customer Name & Phone */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <h3 className="text-base md:text-lg font-bold text-gray-800 truncate leading-tight">
                              {billing.customer_name || 'Unknown'}
                            </h3>
                            <p className="text-xs text-gray-600 font-medium truncate">
                              📞 {billing.customer_phno}
                            </p>
                            <p className="text-xs font-bold text-gray-900">
                              Total: ₹{billing.total_amount}
                            </p>
                            <p className="text-xs text-gray-500">
                              {billing.items.length} item{billing.items.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>

                        {/* Right Section - Status */}
                        <div className="text-right flex-shrink-0 flex flex-col items-end">
                          {/* Status Badge */}
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg ${config.badge} mb-2`}>
                            <span className="text-xs font-bold text-white uppercase">{config.label}</span>
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
                        {/* Billing Items */}
                        <div className="mb-4">
                          <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2 text-sm md:text-base">
                            <span className="text-lg">🧾</span>
                            <span>Billing Items:</span>
                          </h4>
                          <div className="space-y-2">
                            {billing.items.map((item, index) => {
                              const itemTypeIcons = {
                                workspace: '💼',
                                food: '🍽️',
                                snooker: '🎱',
                              };
                              const itemTypeLabels = {
                                workspace: 'Workspace',
                                food: 'Food Order',
                                snooker: 'Snooker',
                              };
                              
                              return (
                                <div key={index} className="bg-white/60 rounded-lg px-3 py-2">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                      {itemTypeIcons[item.type]} {itemTypeLabels[item.type]}
                                    </span>
                                    <span className="text-sm font-bold text-gray-900">₹{item.amount}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-600">{item.description}</span>
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                      item.status === 'paid' 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-red-100 text-red-700'
                                    }`}>
                                      {item.status}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(item.created_at).toLocaleString('en-US', { 
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Total Summary */}
                        <div className="bg-white/80 rounded-lg px-4 py-3 border-2 border-gray-300/50">
                          <div className="flex justify-between items-center">
                            <span className="text-base font-bold text-gray-800">Grand Total:</span>
                            <span className="text-lg font-bold text-purple-700">₹{billing.total_amount}</span>
                          </div>
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
  );
}

