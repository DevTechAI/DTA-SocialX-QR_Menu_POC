'use client';

import { useState, useEffect } from 'react';
import { MenuItem } from '@/models';

export default function MenuEditorPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    fetchMenuItems();
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchMenuItems = async () => {
    try {
      const res = await fetch('/api/menu');
      if (res.ok) {
        const data = await res.json();
        setMenuItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/menu/${id}/toggle-availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: !currentStatus }),
      });
      if (res.ok) {
        fetchMenuItems();
      } else {
        const error = await res.json();
        alert(`Failed to update: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to toggle availability:', error);
      alert('Failed to update availability');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item? This action cannot be undone.')) return;
    
    try {
      const res = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchMenuItems();
      } else {
        const error = await res.json();
        alert(`Failed to delete: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Failed to delete item');
    }
  };

  const handleSave = async (itemData: Partial<MenuItem>) => {
    try {
      if (editingItem) {
        // Update existing item
        const res = await fetch(`/api/menu/${editingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData),
        });
        if (res.ok) {
          fetchMenuItems();
          setEditingItem(null);
        } else {
          const error = await res.json();
          alert(`Failed to update: ${error.error}`);
        }
      } else {
        // Create new item
        const res = await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData),
        });
        if (res.ok) {
          fetchMenuItems();
          setShowAddForm(false);
        } else {
          const error = await res.json();
          alert(`Failed to create: ${error.error}`);
        }
      }
    } catch (error) {
      console.error('Failed to save item:', error);
      alert('Failed to save item');
    }
  };

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const categories = ['HOT', 'COLD', 'NON-COFFEE'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Header */}
      <div className="w-full relative overflow-hidden bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 py-6 md:py-8 backdrop-blur-sm">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 lg:px-10">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex flex-col items-center text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg mb-2">
                👨‍💼 Admin Dashboard - Menu Editor
              </h1>
              <p className="text-white/90 text-sm md:text-base font-semibold drop-shadow">
                SocialX Community Café - Menu Management
              </p>
              <p className="text-white/80 text-xs md:text-sm mt-1">
                {currentDateTime.toLocaleString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-orange-900">Menu Items</h2>
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingItem(null);
            }}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
          >
            + Add New Item
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-orange-600">Loading menu items...</p>
          </div>
        ) : (
          <>
            {/* Add/Edit Form */}
            {(showAddForm || editingItem) && (
              <div className="mb-6 bg-white p-6 rounded-lg shadow-lg border-2 border-orange-200">
                <h3 className="text-xl font-bold text-orange-900 mb-4">
                  {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                </h3>
                <MenuItemForm
                  item={editingItem}
                  onSave={(data) => {
                    handleSave(data);
                    setShowAddForm(false);
                    setEditingItem(null);
                  }}
                  onCancel={() => {
                    setShowAddForm(false);
                    setEditingItem(null);
                  }}
                />
              </div>
            )}

            {/* Menu Items by Category */}
            {categories.map((category) => (
              <div key={category} className="mb-8">
                <h3 className="text-xl font-bold text-orange-800 mb-4 border-b-2 border-orange-200 pb-2">
                  {category}
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {groupedItems[category]?.map((item) => (
                    <div
                      key={item.id}
                      className={`bg-white p-4 rounded-lg shadow-md border-2 ${
                        item.available ? 'border-orange-200' : 'border-gray-300 opacity-60'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-orange-900">{item.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        </div>
                        {item.icon && <span className="text-2xl ml-2">{item.icon}</span>}
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-xl font-bold text-orange-600">₹{item.price}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleAvailability(item.id, item.available)}
                            className={`px-3 py-1 rounded text-xs font-semibold ${
                              item.available
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {item.available ? 'In Stock' : 'Out of Stock'}
                          </button>
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setShowAddForm(false);
                            }}
                            className="px-3 py-1 bg-orange-100 text-orange-700 rounded text-xs font-semibold hover:bg-orange-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!groupedItems[category] || groupedItems[category].length === 0) && (
                    <p className="text-gray-500 text-sm">No items in this category</p>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function MenuItemForm({
  item,
  onSave,
  onCancel,
}: {
  item: MenuItem | null;
  onSave: (data: Partial<MenuItem>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price || 0,
    category: item?.category || 'HOT',
    available: item?.available ?? true,
    icon: item?.icon || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      alert('Name and price are required');
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-orange-900 mb-1">Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-orange-900 mb-1">Price (₹) *</label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            min="0"
            step="0.01"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-orange-900 mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          rows={2}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-orange-900 mb-1">Category *</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
            className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          >
            <option value="HOT">HOT</option>
            <option value="COLD">COLD</option>
            <option value="NON-COFFEE">NON-COFFEE</option>
            <option value="ADDON">ADDON (Coffee Addons)</option>
            <option value="SNACK">SNACK (Snacks & Bites)</option>
            <option value="DESSERT">DESSERT</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-orange-900 mb-1">Icon (Emoji)</label>
          <input
            type="text"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="☕"
          />
        </div>
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          id="available"
          checked={formData.available}
          onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
          className="w-4 h-4 text-orange-600 border-orange-300 rounded focus:ring-orange-500"
        />
        <label htmlFor="available" className="ml-2 text-sm font-semibold text-orange-900">
          Available (In Stock)
        </label>
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
        >
          {item ? 'Update' : 'Create'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

