export type UserRole = 'renter' | 'owner' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
}

export interface Store {
  id: string;
  name: string;
  description: string;
  address: string;
  logo_url: string;
  banner_url: string;
  rating: number;
}

export interface Booking {
  start_date: string;
  end_date: string;
  status: string;
}

export interface ManualBlock {
  id: string;
  item_id: string;
  start_date: string;
  end_date: string;
  reason: string;
}

export interface Item {
  id: string;
  store_id: string;
  name: string;
  description: string;
  daily_price: number;
  deposit_amount: number;
  image_url: string;
  category: string;
  bookings?: Booking[];
  manualBlocks?: ManualBlock[];
}

export interface CartItem {
  id: string;
  name: string;
  daily_price: number;
  deposit_amount: number;
  image_url: string;
  startDate: string;
  endDate: string;
  store_id: string;
}

export interface OrderHistoryItem {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  daily_price: number;
  image_url: string;
}

export interface OrderHistory {
  id: string;
  store_id: string;
  store_name: string;
  created_at: string;
  status: string;
  total_amount: number;
  items: OrderHistoryItem[];
}

export interface FraudListEntry {
  id: string;
  store_id: string | null;
  full_name: string;
  email: string;
  contact_number: string;
  billing_address: string;
  reason: string;
  store_name: string | null;
  reported_by_email: string;
}

export interface FraudAnalytics {
  mostReportedEmails: Array<{ email: string; count: number }>;
  mostReportedPhones: Array<{ contact_number: string; count: number }>;
  fraudRatePerStore: Array<{ name: string; fraud_rate: number }>;
}

export interface OwnerApplication {
  id: string;
  renter_name: string;
  renter_email: string;
  renter_phone: string;
  renter_address: string;
  delivery_mode: string;
  payment_mode: string;
  total_amount: number;
  created_at: string;
  status: string;
  fraud_flag: boolean | number;
  items: Array<{ id: string; name: string; start_date: string; end_date: string }>;
}

export interface OwnerDashboardData {
  store?: Store & {
    status: string;
  };
  stats?: {
    total_rentals: number;
    total_revenue: number;
  };
  items: Item[];
  recentOrders: Array<Record<string, unknown>>;
}
