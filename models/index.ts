// Data Models for SocialX QR Menu POC

export interface User {
  id: string;
  email: string;
  role: 'user' | 'manager' | 'superadmin';
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'HOT' | 'COLD' | 'NON-COFFEE' | 'ADDON' | 'SNACK' | 'DESSERT';
  available: boolean;
  image_url?: string;
  icon?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phno: string;
  items: OrderItem[];
  total_amount: number;
  status: 'received' | 'accepted' | 'rejected' | 'delivered' | 'paid' | 'unpaid';
  table_number?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  menu_item_id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface AuthorizedEmail {
  id: string;
  email: string;
  role: 'manager' | 'superadmin';
  created_at: string;
  created_by?: string;
  updated_at: string;
}

