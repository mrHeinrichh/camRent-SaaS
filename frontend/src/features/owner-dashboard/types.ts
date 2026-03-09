export type OwnerTab = 'overview' | 'applications' | 'inventory' | 'calendar' | 'customers' | 'transactions' | 'form' | 'fraud' | 'support' | 'vouchers';

export type ItemEditor = {
  id?: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  daily_price: string;
  stock: string;
  is_available: boolean;
  image_url: string;
};
