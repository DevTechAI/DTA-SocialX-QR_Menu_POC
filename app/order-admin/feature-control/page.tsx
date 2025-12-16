'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

interface FeatureControl {
  feature_item_id: string;
  feature_name: string;
  feature_desc: string | null;
  user_visibility: boolean;
  admin_dashboard_visibility: boolean;
  created_at: string;
  updated_at: string | null;
}

interface WhatsAppMessagesContentProps {
  msgId: string;
  messages: any;
  onUpdate: (msgId: string, field: string, value: string) => void;
}

function WhatsAppMessagesContent({ msgId, messages, onUpdate }: WhatsAppMessagesContentProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [expandedField, setExpandedField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const fields = [
    { key: 'default_msg', label: 'Default Message' },
    { key: 'custom_msg1', label: 'Custom Message 1' },
    { key: 'custom_msg2', label: 'Custom Message 2' },
    { key: 'custom_msg3', label: 'Custom Message 3' },
    { key: 'custom_msg4', label: 'Custom Message 4' },
    { key: 'custom_msg5', label: 'Custom Message 5' },
  ];

  const handleToggleExpand = (field: string) => {
    if (expandedField === field) {
      setExpandedField(null);
      setEditingField(null);
    } else {
      setExpandedField(field);
    }
  };

  const handleEdit = (field: string) => {
    setEditingField(field);
    setEditValue(messages?.[field] || '');
  };

  const handleSave = (field: string) => {
    onUpdate(msgId, field, editValue);
    setEditingField(null);
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue('');
  };

  if (!messages) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No messages found for this category.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {fields.map((field) => {
        const value = messages[field.key];
        const isEmpty = !value || value.trim() === '';
        const isExpanded = expandedField === field.key;
        const isEditing = editingField === field.key;
        const preview = value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : '';

        return (
          <div
            key={field.key}
            className="relative rounded-lg border-2 border-indigo-200 bg-white/80 overflow-hidden transition-all"
          >
            {/* Collapsed Tab/Button */}
            <button
              onClick={() => handleToggleExpand(field.key)}
              className={`w-full px-3 py-2.5 flex items-center justify-between gap-2 text-left transition-all ${
                isExpanded
                  ? 'bg-indigo-50 border-b-2 border-indigo-300'
                  : 'hover:bg-indigo-50/50'
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xs font-semibold text-indigo-600 whitespace-nowrap">
                  {field.label}:
                </span>
                {isEmpty ? (
                  <span className="text-xs text-gray-400 italic">Empty</span>
                ) : (
                  <span className="text-xs text-gray-600 truncate">{preview}</span>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {!isEmpty && !isEditing && (
                  <span className="text-xs text-indigo-600">✏️</span>
                )}
                <span className={`text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="p-3 border-t-2 border-indigo-200 bg-white">
                {isEditing ? (
                  <div className="space-y-3">
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
                      rows={4}
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={handleCancel}
                        className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-all border border-red-200"
                        title="Cancel"
                      >
                        ✕ Cancel
                      </button>
                      <button
                        onClick={() => handleSave(field.key)}
                        className="px-3 py-1.5 text-xs font-semibold text-green-600 hover:bg-green-50 rounded-lg transition-all border border-green-200"
                        title="Save"
                      >
                        ✓ Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {isEmpty ? (
                      <button
                        onClick={() => handleEdit(field.key)}
                        className="w-full px-4 py-3 text-left text-sm text-gray-400 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:text-indigo-600 transition-all"
                      >
                        + Click to add {field.label.toLowerCase()}
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-800 whitespace-pre-wrap max-h-40 overflow-y-auto">
                          {value}
                        </div>
                        <button
                          onClick={() => handleEdit(field.key)}
                          className="w-full px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all border border-indigo-200"
                        >
                          ✏️ Edit
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function FeatureControlPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [featureControls, setFeatureControls] = useState<FeatureControl[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'FnB' | 'Snooker' | 'WorkSpace'>('FnB');
  const [whatsappMessages, setWhatsappMessages] = useState<Record<string, any>>({});
  const [whatsappLoading, setWhatsappLoading] = useState(true);

  // Map tabs to msg_id
  const tabToMsgId: Record<string, string> = {
    'FnB': 'FnB-Order-Msg',
    'Snooker': 'Snooker-Booking-Msg',
    'WorkSpace': 'WorkSpace-Booking-Msg',
  };

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/manager');
          return;
        }

        // Check if user is authorized (manager or superadmin)
        const { data: authorizedUser } = await supabase
          .from('authorized_emails')
          .select('email, role')
          .eq('email', session.user.email)
          .single();

        if (!authorizedUser || (authorizedUser.role !== 'manager' && authorizedUser.role !== 'superadmin')) {
          router.push('/manager');
          return;
        }

        setAuthChecked(true);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/manager');
      }
    };

    checkAuth();
  }, [router]);

  // Fetch feature controls
  const fetchFeatureControls = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/feature-control');
      if (response.ok) {
        const result = await response.json();
        const data = result?.data || result || [];
        console.log('✅ Fetched feature controls:', Array.isArray(data) ? data.length : 0, 'records');
        setFeatureControls(Array.isArray(data) ? data : []);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Failed to fetch feature controls:', errorData);
        setFeatureControls([]);
      }
    } catch (error) {
      console.error('❌ Error fetching feature controls:', error);
      setFeatureControls([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authChecked) {
      fetchFeatureControls();
    }
  }, [authChecked, fetchFeatureControls]);

  // Fetch WhatsApp messages
  const fetchWhatsappMessages = useCallback(async () => {
    setWhatsappLoading(true);
    try {
      const response = await fetch('/api/whatsapp-messages');
      if (response.ok) {
        const result = await response.json();
        const data = result?.data || result || [];
        const messagesMap: Record<string, any> = {};
        data.forEach((msg: any) => {
          messagesMap[msg.msg_id] = msg;
        });
        setWhatsappMessages(messagesMap);
      } else {
        console.error('Failed to fetch WhatsApp messages');
        setWhatsappMessages({});
      }
    } catch (error) {
      console.error('Error fetching WhatsApp messages:', error);
      setWhatsappMessages({});
    } finally {
      setWhatsappLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authChecked) {
      fetchWhatsappMessages();
    }
  }, [authChecked, fetchWhatsappMessages]);

  // Handle message update
  const handleUpdateMessage = async (msgId: string, field: string, value: string) => {
    try {
      const updatePayload: any = { msg_id: msgId };
      updatePayload[field] = value || null;

      const response = await fetch('/api/whatsapp-messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      if (response.ok) {
        await fetchWhatsappMessages();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        alert(`Failed to update message: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating message:', error);
      alert(`Error updating message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Update feature control
  const updateFeatureControl = async (featureItemId: string, userVisibility: boolean) => {
    try {
      const response = await fetch('/api/feature-control', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature_item_id: featureItemId,
          user_visibility: userVisibility,
        }),
      });

      if (response.ok) {
        // Refresh feature controls
        await fetchFeatureControls();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        alert(`Failed to update feature control: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating feature control:', error);
      alert(`Error updating feature control: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/manager');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen gradient-soft flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary mb-4 shadow-soft-lg">
            <div className="animate-pulse">
              <span className="text-5xl text-white">⏳</span>
            </div>
          </div>
          <p className="text-gray-700 font-bold text-lg">Verifying authentication...</p>
          <p className="text-gray-500 text-sm mt-1">Please wait</p>
        </div>
      </div>
    );
  }

  // Map feature_item_id to display info
  const featureMap: Record<string, { icon: string; name: string; route: string }> = {
    'snooker-order-booking': {
      icon: '🎱',
      name: 'Snooker',
      route: '/book-snooker',
    },
    'food-order-booking': {
      icon: '🍽️',
      name: 'FnB Order',
      route: '/order-menu',
    },
    'seat-order-booking': {
      icon: '💼',
      name: 'WorkSpace',
      route: '/book-workspace',
    },
  };

  // Get the three main features
  const mainFeatures = ['snooker-order-booking', 'food-order-booking', 'seat-order-booking'];
  const featuresToShow = mainFeatures.map(id => {
    const feature = featureControls.find(f => f.feature_item_id === id);
    const info = featureMap[id] || { icon: '⚙️', name: id, route: '#' };
    return {
      id,
      ...info,
      feature: feature || null,
      user_visibility: feature?.user_visibility ?? true,
    };
  });

  return (
    <div className="min-h-screen gradient-soft flex flex-col">
      {/* Header with Vector Background - Matching Admin Dashboard */}
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
              {/* Left side - Back to Dashboard */}
              <div className="flex-1 flex flex-col items-start gap-2">
                <Link
                  href="/order-admin"
                  className="px-5 py-2.5 bg-white/50 backdrop-blur-md text-gray-900 rounded-lg border-2 border-white/70 hover:bg-white/60 hover:border-white/90 transition-all font-bold text-base shadow-lg hover:shadow-xl active:scale-95"
                >
                  🏠 Dashboard
                </Link>
              </div>
              
              {/* Centered Feature Control Title */}
              <div className="flex-1 flex flex-col items-center text-center">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white flex items-center gap-3 drop-shadow-lg whitespace-nowrap">
                  <span className="text-4xl md:text-5xl">⚙️</span>
                  <span>Feature Control</span>
                </h1>
                <p className="text-white text-base md:text-lg mt-2 font-bold" style={{ 
                  textShadow: '3px 3px 6px rgba(0, 0, 0, 0.9), -2px -2px 4px rgba(0, 0, 0, 0.9), 2px 2px 4px rgba(0, 0, 0, 0.9), -2px 2px 4px rgba(0, 0, 0, 0.9), 2px -2px 4px rgba(0, 0, 0, 0.9), 0 0 8px rgba(0, 0, 0, 0.8)',
                  WebkitTextStroke: '1px rgba(0, 0, 0, 0.7)',
                  paintOrder: 'stroke fill'
                }}>SocialX Hub - Feature Management</p>
              </div>
              
              {/* Right side - Date and Time + Actions */}
              <div className="flex-1 flex flex-col items-end gap-2">
                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href="/order-admin/bi-reports"
                    className="px-5 py-2.5 bg-white/50 backdrop-blur-md text-gray-900 rounded-lg border-2 border-white/70 hover:bg-white/60 hover:border-white/90 transition-all font-bold text-base shadow-lg hover:shadow-xl active:scale-95"
                  >
                    📊 BI Reports
                  </Link>
                  <Link
                    href="/order-admin/menu-edit"
                    className="px-5 py-2.5 bg-white/50 backdrop-blur-md text-gray-900 rounded-lg border-2 border-white/70 hover:bg-white/60 hover:border-white/90 transition-all font-bold text-base shadow-lg hover:shadow-xl active:scale-95"
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

      {/* Main Content */}
      <div className="flex-1 w-full px-6 md:px-10 lg:px-16 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8 h-full items-stretch">
          {/* Left Side - Feature Control Cards */}
          <div className="flex-1 lg:flex-[0_0_65%] flex">
            <div className="relative rounded-2xl overflow-hidden shadow-soft-lg bg-white/95 backdrop-blur-xl border-2 border-indigo-200 p-6 md:p-8 w-full h-full flex flex-col">
              {/* Header Section */}
              <div className="mb-6 md:mb-8 flex-shrink-0">
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <h2 className="text-2xl md:text-3xl font-bold text-indigo-600 flex items-center gap-3">
                    <span className="text-3xl md:text-4xl">⚙️</span>
                    <span>Feature Toggles</span>
                  </h2>
                </div>
                <p className="text-gray-600 mt-2 text-sm md:text-base font-medium text-center">
                  Enable or disable features for user visibility
                </p>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto">
                {/* Loading State */}
                {loading && (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 mb-4 shadow-soft">
                      <div className="animate-pulse">
                        <span className="text-5xl text-indigo-600">⏳</span>
                      </div>
                    </div>
                    <p className="text-gray-700 font-bold text-lg">Loading Feature Controls...</p>
                  </div>
                )}

                {/* Feature Controls Grid */}
                {!loading && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {featuresToShow.map((feature) => {
                      return (
                        <div
                          key={feature.id}
                          className="relative rounded-2xl overflow-hidden transition-all shadow-soft hover:shadow-soft-lg"
                        >
                          <div className={`relative ${
                            feature.user_visibility
                              ? 'bg-gradient-to-br from-green-50 via-green-100/70 to-emerald-50/80 border-2 border-green-300'
                              : 'bg-gradient-to-br from-gray-50 via-gray-100/70 to-slate-50/80 border-2 border-gray-300'
                          } p-6 md:p-8 rounded-2xl`}>
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-2xl pointer-events-none"></div>
                            
                            <div className="relative z-10">
                              {/* Feature Header */}
                              <div className="flex flex-col items-center gap-4 mb-6">
                                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-xl ${
                                  feature.user_visibility
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                    : 'bg-gradient-to-r from-gray-400 to-gray-500'
                                } flex items-center justify-center shadow-soft`}>
                                  <span className="text-3xl md:text-4xl text-white">{feature.icon}</span>
                                </div>
                                <div className="text-center">
                                  <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">
                                    {feature.name}
                                  </h3>
                                  <p className="text-xs text-gray-600">
                                    {feature.route}
                                  </p>
                                </div>
                              </div>

                              {/* Toggle Switch */}
                              <div className="flex flex-col items-center gap-4">
                                <div className="flex items-center justify-between bg-white/60 rounded-xl p-4 border border-gray-200 w-full">
                                  <span className="text-base font-semibold text-gray-700">
                                    User Visibility
                                  </span>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={feature.user_visibility}
                                      onChange={(e) => {
                                        updateFeatureControl(feature.id, e.target.checked);
                                      }}
                                      className="sr-only peer"
                                    />
                                    <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-500"></div>
                                  </label>
                                </div>

                                {/* Status Badge */}
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                                  feature.user_visibility
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                    : 'bg-gradient-to-r from-gray-400 to-gray-500'
                                }`}>
                                  <span className="text-sm font-bold text-white uppercase">
                                    {feature.user_visibility ? 'ON' : 'OFF'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Empty State */}
                {!loading && featuresToShow.length === 0 && (
                  <div className="relative rounded-3xl overflow-hidden shadow-soft-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-indigo-50/80 backdrop-blur-xl"></div>
                    <div className="relative z-10 text-center py-16 md:py-20 px-6">
                      <div className="inline-flex items-center justify-center w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 mb-6 shadow-soft">
                        <span className="text-6xl md:text-7xl">⚙️</span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text mb-3">No feature controls found</h3>
                      <p className="text-gray-600 font-medium">Feature controls will appear here once configured in the database</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Manage WhatsApp Messages */}
          <div className="lg:flex-[0_0_35%] flex">
            <div className="w-full h-full flex flex-col">
              <div className="relative rounded-2xl overflow-hidden shadow-soft-lg bg-white/95 backdrop-blur-xl border-2 border-indigo-200 p-6 md:p-8 w-full h-full flex flex-col">
                <h2 className="text-2xl md:text-3xl font-bold text-indigo-600 flex items-center gap-3 mb-6 flex-shrink-0">
                  <span className="text-3xl md:text-4xl">💬</span>
                  <span>WhatsApp Messages</span>
                </h2>
                
                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b-2 border-indigo-200 flex-shrink-0">
                  {['FnB', 'Snooker', 'WorkSpace'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as 'FnB' | 'Snooker' | 'WorkSpace')}
                      className={`flex-1 px-4 py-2 font-bold text-base transition-all ${
                        activeTab === tab
                          ? 'text-indigo-600 border-b-2 border-indigo-600 -mb-0.5'
                          : 'text-gray-500 hover:text-indigo-500'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Messages Content */}
                <div className="flex-1 overflow-y-auto">
                  {whatsappLoading ? (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 mb-4">
                        <div className="animate-pulse">
                          <span className="text-4xl text-indigo-600">⏳</span>
                        </div>
                      </div>
                      <p className="text-gray-700 font-bold">Loading messages...</p>
                    </div>
                  ) : (
                    <WhatsAppMessagesContent
                      msgId={tabToMsgId[activeTab]}
                      messages={whatsappMessages[tabToMsgId[activeTab]]}
                      onUpdate={handleUpdateMessage}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 py-6 text-center border-t border-gray-200/50 bg-white/60 backdrop-blur-sm">
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

