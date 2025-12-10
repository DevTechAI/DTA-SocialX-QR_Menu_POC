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

  const handleToggleAvailability = async (id: string, name: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/menu/${id}/toggle-availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: !currentStatus, name }),
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

  const handleToggleShowImage = async (id: string, name: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/menu/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ show_image: !currentStatus }),
      });
      if (res.ok) {
        fetchMenuItems();
      } else {
        const error = await res.json();
        alert(`Failed to update: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to toggle show image:', error);
      alert('Failed to update show image setting');
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

  // Get all categories that have items, sorted to show common ones first
  const categoryOrder = ['HOT', 'COLD', 'NON-COFFEE', 'ADDON', 'SNACK', 'DESSERT'];
  const categories = [
    ...categoryOrder.filter(cat => groupedItems[cat] && groupedItems[cat].length > 0),
    ...Object.keys(groupedItems).filter(cat => !categoryOrder.includes(cat))
  ];

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
                SocialX Hub - Menu Management
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
            {/* Add Form (only for new items) */}
            {showAddForm && !editingItem && (
              <div className="mb-6 bg-white p-6 rounded-lg shadow-lg border-2 border-orange-200">
                <h3 className="text-xl font-bold text-orange-900 mb-4">
                  Add New Menu Item
                </h3>
                <MenuItemForm
                  item={null}
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
                  {groupedItems[category]?.map((item) => {
                    const isEditing = editingItem?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`bg-white rounded-lg shadow-md border-2 transition-all ${
                          item.available ? 'border-orange-200' : 'border-gray-300 opacity-60'
                        } ${isEditing ? 'md:col-span-2 lg:col-span-3' : ''}`}
                      >
                        {!isEditing ? (
                          <>
                            {/* Card Content - Normal View */}
                            <div className="p-4">
                              {/* Image Preview */}
                              {item.image_url && (
                                <div className="mb-3 rounded-lg overflow-hidden">
                                  <img
                                    src={item.image_url}
                                    alt={item.name}
                                    className="w-full h-40 object-cover"
                                    onError={(e) => {
                                      // Hide image if it fails to load
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}
                              
                              {/* Item ID - Top of card */}
                              <div className="mb-2">
                                <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                  ID: {item.id}
                                </span>
                              </div>
                              
                              {/* First Line: Icon, Name, and Toggle */}
                              <div className="flex items-center gap-2 mb-2">
                                {/* Icon - Left Top Corner */}
                                {item.icon && (
                                  <span className="text-2xl flex-shrink-0">{item.icon}</span>
                                )}
                                
                                {/* Item Name - Beside Icon */}
                                <h4 className="font-bold text-lg text-orange-900 flex-1 min-w-0 truncate">
                                  {item.name}
                                </h4>
                                
                                {/* Toggle - Right side of first line */}
                                <div className="flex-shrink-0">
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={item.available}
                                      onChange={() => handleToggleAvailability(item.id, item.name, item.available)}
                                      className="sr-only peer"
                                    />
                                    <div className="relative w-[51px] h-5 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-500 rounded-full peer peer-checked:after:translate-x-[33px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500">
                                      {/* Ready label - Left side */}
                                      <span className={`absolute left-1 top-1/2 -translate-y-1/2 text-[9px] font-bold transition-all ${
                                        item.available ? 'text-white opacity-100' : 'text-gray-500 opacity-50'
                                      }`}>
                                        Ready
                                      </span>
                                      {/* NA label - Right side */}
                                      <span className={`absolute right-1 top-1/2 -translate-y-1/2 text-[9px] font-bold transition-all ${
                                        !item.available ? 'text-gray-800 opacity-100' : 'text-gray-500 opacity-50'
                                      }`}>
                                        NA
                                      </span>
                                    </div>
                                  </label>
                                </div>
                              </div>
                              
                              {/* Description */}
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                              
                              {/* Show Image Toggle - Only show if image_url exists */}
                              {item.image_url && (
                                <div className="mb-3 pt-2 border-t border-gray-200">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-gray-700">Show Image to Customers:</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={item.show_image ?? false}
                                        onChange={() => handleToggleShowImage(item.id, item.name, item.show_image ?? false)}
                                        className="sr-only peer"
                                      />
                                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                      <span className="ml-2 text-xs font-medium text-gray-700">
                                        {item.show_image ? 'Image' : 'Emoji'}
                                      </span>
                                    </label>
                                  </div>
                                </div>
                              )}
                              
                              {/* Bottom Section: Price and Action Buttons */}
                              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                                <span className="text-xl font-bold text-orange-600">₹{item.price}</span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingItem(item);
                                      setShowAddForm(false);
                                    }}
                                    className="px-3 py-1 bg-orange-500 text-white rounded text-xs font-semibold hover:bg-orange-600 transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(item.id)}
                                    className="px-3 py-1 bg-red-500 text-white rounded text-xs font-semibold hover:bg-red-600 transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Edit Form - Expanded View */}
                            <div className="p-6">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-xl font-bold text-orange-900">
                                    Edit Menu Item
                                  </h3>
                                  {item.id && (
                                    <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                      ID: {item.id}
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => setEditingItem(null)}
                                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors"
                                  aria-label="Close"
                                >
                                  ×
                                </button>
                              </div>
                              <MenuItemForm
                                item={item}
                                onSave={(data) => {
                                  handleSave(data);
                                  setEditingItem(null);
                                }}
                                onCancel={() => {
                                  setEditingItem(null);
                                }}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
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
  const [formData, setFormData] = useState<{
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    available: boolean;
    icon: string;
    image_url: string;
    show_image: boolean;
  }>({
    id: item?.id || '',
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price || 0,
    category: item?.category || 'HOT',
    available: item?.available ?? true,
    icon: item?.icon || '',
    image_url: item?.image_url || '',
    show_image: item?.show_image ?? false,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(item?.image_url || null);
  const [uploading, setUploading] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  // Update form data when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        id: item.id || '',
        name: item.name || '',
        description: item.description || '',
        price: item.price || 0,
        category: item.category || 'HOT',
        available: item.available ?? true,
        icon: item.icon || '',
        image_url: item.image_url || '',
        show_image: item.show_image ?? false,
      });
      setImagePreview(item.image_url || null);
      setIsCustomCategory(false);
      setCustomCategory('');
      setSelectedImageFile(null);
    } else {
      // For new items, initialize ID with category prefix
      const initialCategory = 'HOT';
      setFormData({
        id: `${initialCategory}-`,
        name: '',
        description: '',
        price: 0,
        category: initialCategory,
        available: true,
        icon: '',
        image_url: '',
        show_image: false,
      });
      setImagePreview(null);
      setIsCustomCategory(false);
      setCustomCategory('');
      setSelectedImageFile(null);
    }
  }, [item]);

  // Update ID prefix when category changes (only for new items)
  useEffect(() => {
    if (!item && formData.category) {
      // Get the actual category to use (custom or selected)
      const actualCategory = isCustomCategory && customCategory ? customCategory.toUpperCase() : formData.category;
      
      // Extract the user-entered part (everything after the category prefix)
      const currentId = formData.id || '';
      const oldCategoryPrefix = currentId.match(/^[A-Z]+-/)?.[0] || '';
      const userPart = oldCategoryPrefix 
        ? currentId.slice(oldCategoryPrefix.length)
        : currentId.replace(/^[A-Z]+-/, ''); // Remove any old category prefix
      
      const newCategoryPrefix = `${actualCategory}-`;
      // Only update if the prefix actually changed
      if (oldCategoryPrefix !== newCategoryPrefix) {
        setFormData(prev => ({
          ...prev,
          id: `${actualCategory}-${userPart}`
        }));
      }
    }
  }, [formData.category, isCustomCategory, customCategory, item]); // Only run when category changes

  // Handle ID input - only allow text, '-', and '_'
  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!item) { // Only allow editing ID for new items
      const value = e.target.value;
      // Get the actual category to use (custom or selected)
      const actualCategory = isCustomCategory && customCategory ? customCategory.toUpperCase() : formData.category;
      const categoryPrefix = `${actualCategory}-`;
      
      // Ensure it starts with category prefix
      if (!value.startsWith(categoryPrefix)) {
        // If user deleted the prefix, restore it
        if (value.length < categoryPrefix.length) {
          setFormData(prev => ({ ...prev, id: categoryPrefix }));
          return;
        }
        // If user typed something else, prepend category
        const userPart = value.replace(/^[A-Z]+-/, '');
        setFormData(prev => ({ ...prev, id: `${categoryPrefix}${userPart}` }));
        return;
      }
      
      // Extract user-entered part (after category prefix)
      const userPart = value.slice(categoryPrefix.length);
      
      // Validate: only allow alphanumeric, '-', and '_'
      const validPattern = /^[a-zA-Z0-9_-]*$/;
      if (validPattern.test(userPart)) {
        setFormData(prev => ({ ...prev, id: `${categoryPrefix}${userPart}` }));
      }
    }
  };

  // Handle category change
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCategory = e.target.value;
    if (selectedCategory === 'CUSTOM') {
      setIsCustomCategory(true);
      setFormData(prev => ({ ...prev, category: 'CUSTOM' }));
    } else {
      setIsCustomCategory(false);
      setCustomCategory('');
      setFormData(prev => ({ ...prev, category: selectedCategory }));
    }
  };

  // Handle custom category input
  const handleCustomCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); // Only allow uppercase letters and numbers
    setCustomCategory(value);
    if (value) {
      // Update the ID prefix with custom category
      if (!item) {
        const currentId = formData.id || '';
        const oldCategoryPrefix = currentId.match(/^[A-Z]+-/)?.[0] || '';
        const userPart = oldCategoryPrefix 
          ? currentId.slice(oldCategoryPrefix.length)
          : currentId.replace(/^[A-Z]+-/, '');
        setFormData(prev => ({
          ...prev,
          id: `${value}-${userPart}`
        }));
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validImageTypes.includes(file.type)) {
      alert('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.');
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      alert('File size exceeds 2MB limit.');
      return;
    }

    // Store file in memory and show preview
    setSelectedImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(item?.image_url || null);
    setSelectedImageFile(null);
    if (!item) {
      setFormData(prev => ({ ...prev, image_url: '' }));
    }
  };

  const uploadImageToStorage = async (menuItemId: string): Promise<string | null> => {
    if (!selectedImageFile) {
      return item?.image_url || null;
    }

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedImageFile);
      uploadFormData.append('menuItemId', menuItemId);

      const response = await fetch('/api/menu/upload-image', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload image');
      }

      const data = await response.json();
      return data.url;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      alert('Name and price are required');
      return;
    }
    // For new items, validate ID
    if (!item && (!formData.id || formData.id.endsWith('-'))) {
      alert('Please enter an Item ID');
      return;
    }
    // Validate that name is part of Item-ID (case-insensitive)
    if (!item && formData.id && formData.name) {
      const nameLower = formData.name.toLowerCase().replace(/\s+/g, '-');
      const idLower = formData.id.toLowerCase();
      if (!idLower.includes(nameLower)) {
        alert(`Item-ID must contain the item name. Example: If name is "Almond Milk", ID should be like "ADDON-almond-milk"`);
        return;
      }
    }
    // Validate custom category
    if (isCustomCategory && !customCategory.trim()) {
      alert('Please enter a custom category name');
      return;
    }
    
    // Use custom category if selected, otherwise use selected category
    const finalCategory = isCustomCategory && customCategory ? customCategory.toUpperCase() : formData.category;
    
    // For new items, upload image first if selected
    let imageUrl = formData.image_url;
    if (!item && selectedImageFile) {
      try {
        imageUrl = await uploadImageToStorage(formData.id) || '';
      } catch (error: any) {
        alert(`Failed to upload image: ${error.message}`);
        return;
      }
    }
    
    // For existing items, upload image if a new one was selected
    if (item && selectedImageFile) {
      try {
        imageUrl = await uploadImageToStorage(item.id) || formData.image_url;
      } catch (error: any) {
        alert(`Failed to upload image: ${error.message}`);
        return;
      }
    }
    
    onSave({
      ...formData,
      category: finalCategory as any,
      image_url: imageUrl,
    });
    
    // Clear selected file after save
    setSelectedImageFile(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Item-ID field - only show for new items */}
      {!item && (
        <div>
          <label className="block text-sm font-semibold text-orange-900 mb-1">Item-ID *</label>
          <input
            type="text"
            value={formData.id}
            onChange={handleIdChange}
            className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
            placeholder={`${formData.category}-`}
            required
            pattern="[A-Z]+-[a-zA-Z0-9_-]*"
            title="Must start with category (e.g., HOT-) followed by text, numbers, '-', or '_'"
          />
          <p className="text-xs text-gray-500 mt-1">
            Format: {formData.category}-[text/numbers/-/_]. Only letters, numbers, '-', and '_' are allowed.
          </p>
        </div>
      )}
      
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
            value={isCustomCategory ? 'CUSTOM' : formData.category}
            onChange={handleCategoryChange}
            className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          >
            <option value="HOT">HOT</option>
            <option value="COLD">COLD</option>
            <option value="NON-COFFEE">NON-COFFEE</option>
            <option value="ADDON">ADDON (Coffee Addons)</option>
            <option value="SNACK">SNACK (Snacks & Bites)</option>
            <option value="DESSERT">DESSERT</option>
            {!item && <option value="CUSTOM">Custom</option>}
          </select>
          {isCustomCategory && !item && (
            <div className="mt-2">
              <label className="block text-sm font-semibold text-orange-900 mb-1">Custom Category Name *</label>
              <input
                type="text"
                value={customCategory}
                onChange={handleCustomCategoryChange}
                placeholder="Enter category name (e.g., BEVERAGE)"
                className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 uppercase"
                required={isCustomCategory}
                pattern="[A-Z0-9]+"
                title="Only uppercase letters and numbers are allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter a custom category name (uppercase letters and numbers only)
              </p>
            </div>
          )}
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
      <div>
        <label className="block text-sm font-semibold text-orange-900 mb-1">Item Image</label>
        <div className="space-y-2">
          {imagePreview && (
            <div className="relative w-full max-w-xs">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg border-2 border-orange-300"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600 transition-colors"
                aria-label="Remove image"
              >
                ×
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <label className="flex-1 cursor-pointer">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleImageSelect}
                disabled={uploading || (!item && (!formData.id || !formData.name))}
                className="hidden"
              />
              <span className={`inline-block px-4 py-2 rounded-lg transition-colors font-semibold text-sm ${
                uploading || (!item && (!formData.id || !formData.name))
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-600 cursor-pointer'
              }`}>
                {uploading ? 'Uploading...' : imagePreview ? 'Change Image' : 'Select Image'}
              </span>
            </label>
            {uploading && (
              <span className="text-sm text-orange-600">Uploading...</span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Max file size: 2MB. Supported formats: JPEG, PNG, WebP, GIF
            {!item && (!formData.id || !formData.name) && (
              <span className="block text-orange-600 mt-1">⚠️ Please enter Item-ID and Name first</span>
            )}
          </p>
        </div>
      </div>
      <div className="space-y-3">
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
        {formData.image_url && (
          <div className="flex items-center">
            <input
              type="checkbox"
              id="show_image"
              checked={formData.show_image}
              onChange={(e) => setFormData({ ...formData, show_image: e.target.checked })}
              className="w-4 h-4 text-orange-600 border-orange-300 rounded focus:ring-orange-500"
            />
            <label htmlFor="show_image" className="ml-2 text-sm font-semibold text-orange-900">
              Show Image to Customers (instead of emoji icon)
            </label>
          </div>
        )}
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
                onClick={() => {
                  setSelectedImageFile(null);
                  setImagePreview(item?.image_url || null);
                  onCancel();
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                Cancel
              </button>
      </div>
    </form>
  );
}

