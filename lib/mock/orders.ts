/**
 * Mock order data for UI demo/testing without database
 */

export interface MockOrder {
  id: string;
  customer_name: string;
  customer_phNo: string; // Keep camelCase for mock data interface
  items: Array<{
    menu_item_id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  total_amount: number;
  status: 'received' | 'delivered' | 'paid' | 'unpaid';
  table_number?: string;
  created_at: string;
  updated_at?: string;
}

// Store mock orders in memory
let mockOrders: MockOrder[] = [
  {
    id: 'mock-1',
    customer_name: 'Rahul Sharma',
    customer_phNo: '+91 98765 43210',
    items: [
      { menu_item_id: 'hot-latte', name: 'Latte', quantity: 2, price: 228 },
      { menu_item_id: 'hot-mocha', name: 'Mocha', quantity: 1, price: 178 },
    ],
    total_amount: 634,
    status: 'received',
    table_number: 'Table 5',
    created_at: new Date(Date.now() - 5 * 60000).toISOString(), // 5 min ago
  },
  {
    id: 'mock-2',
    customer_name: 'Priya Patel',
    customer_phNo: '+91 98765 43211',
    items: [
      { menu_item_id: 'cold-coffee', name: 'Cold Coffee', quantity: 1, price: 228 },
      { menu_item_id: 'nc-coke', name: 'Coke/Diet Coke', quantity: 1, price: 168 },
    ],
    total_amount: 396,
    status: 'delivered',
    table_number: 'Table 3',
    created_at: new Date(Date.now() - 15 * 60000).toISOString(), // 15 min ago
  },
  {
    id: 'mock-3',
    customer_name: 'Amit Kumar',
    customer_phNo: '+91 98765 43212',
    items: [
      { menu_item_id: 'hot-cappuccino', name: 'Cappuccino', quantity: 3, price: 228 },
      { menu_item_id: 'nc-hot-chocolate', name: 'Hot Chocolate', quantity: 2, price: 78 },
    ],
    total_amount: 840,
    status: 'unpaid',
    table_number: 'Table 7',
    created_at: new Date(Date.now() - 25 * 60000).toISOString(), // 25 min ago
  },
  {
    id: 'mock-4',
    customer_name: 'Sneha Reddy',
    customer_phNo: '+91 98765 43213',
    items: [
      { menu_item_id: 'cold-cranberry', name: 'Cranberry Espresso', quantity: 1, price: 178 },
    ],
    total_amount: 178,
    status: 'paid',
    table_number: 'Table 2',
    created_at: new Date(Date.now() - 35 * 60000).toISOString(), // 35 min ago
  },
  {
    id: 'mock-5',
    customer_name: 'Vikram Singh',
    customer_phNo: '+91 98765 43214',
    items: [
      { menu_item_id: 'hot-vietnamese', name: 'Vietnamese Coffee', quantity: 2, price: 198 },
      { menu_item_id: 'cold-mocha', name: 'Iced Mocha', quantity: 1, price: 178 },
    ],
    total_amount: 574,
    status: 'received',
    table_number: 'Table 8',
    created_at: new Date(Date.now() - 2 * 60000).toISOString(), // 2 min ago
  },
  {
    id: 'mock-6',
    customer_name: 'Anjali Gupta',
    customer_phNo: '+91 98765 43215',
    items: [
      { menu_item_id: 'cold-americano', name: 'Iced Americano', quantity: 1, price: 228 },
      { menu_item_id: 'nc-redbull', name: 'Redbull', quantity: 1, price: 198 },
    ],
    total_amount: 426,
    status: 'delivered',
    table_number: 'Table 1',
    created_at: new Date(Date.now() - 20 * 60000).toISOString(), // 20 min ago
  },
];

// Get all mock orders
export function getMockOrders(): MockOrder[] {
  return [...mockOrders].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

// Get a single mock order by ID
export function getMockOrderById(id: string): MockOrder | undefined {
  return mockOrders.find(order => order.id === id);
}

// Add a new mock order
export function addMockOrder(order: Omit<MockOrder, 'id' | 'created_at'>): MockOrder {
  const newOrder: MockOrder = {
    ...order,
    id: `mock-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  mockOrders.unshift(newOrder);
  return newOrder;
}

// Update mock order status
export function updateMockOrderStatus(
  id: string,
  status: MockOrder['status']
): MockOrder | undefined {
  const order = mockOrders.find(o => o.id === id);
  if (order) {
    order.status = status;
    order.updated_at = new Date().toISOString();
  }
  return order;
}

// Clear all mock orders (for testing)
export function clearMockOrders(): void {
  mockOrders = [];
}

// Reset to initial mock data
export function resetMockOrders(): void {
  mockOrders = [
    {
      id: 'mock-1',
      customer_name: 'Rahul Sharma',
      customer_phNo: '+91 98765 43210',
      items: [
        { menu_item_id: 'hot-latte', name: 'Latte', quantity: 2, price: 228 },
        { menu_item_id: 'hot-mocha', name: 'Mocha', quantity: 1, price: 178 },
      ],
      total_amount: 634,
      status: 'received',
      table_number: 'Table 5',
      created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    },
    {
      id: 'mock-2',
      customer_name: 'Priya Patel',
      customer_phNo: '+91 98765 43211',
      items: [
        { menu_item_id: 'cold-coffee', name: 'Cold Coffee', quantity: 1, price: 228 },
        { menu_item_id: 'nc-coke', name: 'Coke/Diet Coke', quantity: 1, price: 168 },
      ],
      total_amount: 396,
      status: 'delivered',
      table_number: 'Table 3',
      created_at: new Date(Date.now() - 15 * 60000).toISOString(),
    },
    {
      id: 'mock-3',
      customer_name: 'Amit Kumar',
      customer_phNo: '+91 98765 43212',
      items: [
        { menu_item_id: 'hot-cappuccino', name: 'Cappuccino', quantity: 3, price: 228 },
        { menu_item_id: 'nc-hot-chocolate', name: 'Hot Chocolate', quantity: 2, price: 78 },
      ],
      total_amount: 840,
      status: 'unpaid',
      table_number: 'Table 7',
      created_at: new Date(Date.now() - 25 * 60000).toISOString(),
    },
    {
      id: 'mock-4',
      customer_name: 'Sneha Reddy',
      customer_phNo: '+91 98765 43213',
      items: [
        { menu_item_id: 'cold-cranberry', name: 'Cranberry Espresso', quantity: 1, price: 178 },
      ],
      total_amount: 178,
      status: 'paid',
      table_number: 'Table 2',
      created_at: new Date(Date.now() - 35 * 60000).toISOString(),
    },
    {
      id: 'mock-5',
      customer_name: 'Vikram Singh',
      customer_phNo: '+91 98765 43214',
      items: [
        { menu_item_id: 'hot-vietnamese', name: 'Vietnamese Coffee', quantity: 2, price: 198 },
        { menu_item_id: 'cold-mocha', name: 'Iced Mocha', quantity: 1, price: 178 },
      ],
      total_amount: 574,
      status: 'received',
      table_number: 'Table 8',
      created_at: new Date(Date.now() - 2 * 60000).toISOString(),
    },
    {
      id: 'mock-6',
      customer_name: 'Anjali Gupta',
      customer_phNo: '+91 98765 43215',
      items: [
        { menu_item_id: 'cold-americano', name: 'Iced Americano', quantity: 1, price: 228 },
        { menu_item_id: 'nc-redbull', name: 'Redbull', quantity: 1, price: 198 },
      ],
      total_amount: 426,
      status: 'delivered',
      table_number: 'Table 1',
      created_at: new Date(Date.now() - 20 * 60000).toISOString(),
    },
  ];
}

