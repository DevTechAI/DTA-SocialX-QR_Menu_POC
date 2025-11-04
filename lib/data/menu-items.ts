export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'HOT' | 'COLD' | 'NON-COFFEE';
  available: boolean;
  icon?: string; // Emoji or image path
}

export const menuItems: MenuItem[] = [
  // HOT
  {
    id: 'hot-latte',
    name: 'Latte',
    description: 'espresso + more milk, less coffee more milk',
    price: 228,
    category: 'HOT',
    available: true,
    icon: '☕',
  },
  {
    id: 'hot-cappuccino',
    name: 'Cappuccino',
    description: 'espresso + less foam, stronger than latte',
    price: 228,
    category: 'HOT',
    available: true,
    icon: '🥤',
  },
  {
    id: 'hot-mocha',
    name: 'Mocha',
    description: 'espresso + homemade chocolate + milk, our recommendation',
    price: 178,
    category: 'HOT',
    available: true,
    icon: '🍫',
  },
  {
    id: 'hot-americano',
    name: 'Americano',
    description: 'espresso + hot water, pure and raw',
    price: 178,
    category: 'HOT',
    available: true,
    icon: '☕',
  },
  {
    id: 'hot-vietnamese',
    name: 'Vietnamese Coffee',
    description: 'espresso + condensed milk, bold, sweet, and intense',
    price: 198,
    category: 'HOT',
    available: true,
    icon: '🍵',
  },
  // COLD
  {
    id: 'cold-coffee',
    name: 'Cold Coffee',
    description: 'blended coffee, milk, sweet, ice, mostly sweet and rich',
    price: 228,
    category: 'COLD',
    available: true,
    icon: '🧊',
  },
  {
    id: 'cold-cranberry',
    name: 'Cranberry Espresso',
    description: 'espresso cranberry, juicy and intense, our recommendation',
    price: 178,
    category: 'COLD',
    available: true,
    icon: '🫐',
  },
  {
    id: 'cold-americano',
    name: 'Iced Americano',
    description: 'espresso + ice, cold water, pure and raw and cold',
    price: 228,
    category: 'COLD',
    available: true,
    icon: '🧋',
  },
  {
    id: 'cold-mocha',
    name: 'Iced Mocha',
    description: 'chilled mocha, chocolate + cold milk + ice',
    price: 178,
    category: 'COLD',
    available: true,
    icon: '🍨',
  },
  {
    id: 'cold-vietnamese',
    name: 'Iced Vietnamese',
    description: 'espresso + condensed milk + ice, bold, sweet, and intense',
    price: 198,
    category: 'COLD',
    available: true,
    icon: '🥤',
  },
  // NON-COFFEE
  {
    id: 'nc-hot-chocolate',
    name: 'Hot Chocolate',
    description: 'velvety chocolate + milk, not too sweet, not too dark, balanced',
    price: 78,
    category: 'NON-COFFEE',
    available: true,
    icon: '🍫',
  },
  {
    id: 'nc-coke',
    name: 'Coke/Diet Coke',
    description: 'coke + ice, fizzy and refreshing',
    price: 168,
    category: 'NON-COFFEE',
    available: true,
    icon: '🥤',
  },
  {
    id: 'nc-redbull',
    name: 'Redbull',
    description: 'chilled redbull + ice, No caption needed',
    price: 198,
    category: 'NON-COFFEE',
    available: true,
    icon: '⚡',
  },
];

export const categories = ['HOT', 'COLD', 'NON-COFFEE'] as const;

export function getMenuItemsByCategory(category: string): MenuItem[] {
  return menuItems.filter(item => item.category === category);
}

