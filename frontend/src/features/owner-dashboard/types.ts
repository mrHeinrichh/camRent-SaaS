export type OwnerTab = 'overview' | 'applications' | 'inventory' | 'calendar' | 'customers' | 'transactions' | 'form' | 'fraud' | 'support';

export type ItemEditor = {
  id?: string;
  name: string;
  description: string;
  category: string;
  daily_price: string;
  stock: string;
  is_available: boolean;
  image_url: string;
};
