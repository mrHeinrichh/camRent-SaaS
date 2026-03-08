export type UserRole = 'renter' | 'owner' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  avatar_url: string;
  is_active?: boolean;
}

export interface Store {
  id: string;
  name: string;
  description: string;
  address: string;
  logo_url: string;
  banner_url: string;
  status: 'pending' | 'approved' | 'suspended';
  is_active: boolean;
  approved_at?: string | null;
  payment_due_date?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  facebook_url?: string;
  instagram_url?: string;
  payment_details?: string;
  delivery_modes?: string[];
  branches?: Array<{
    _id?: string;
    name?: string;
    address: string;
    location_lat?: number | null;
    location_lng?: number | null;
  }>;
  lease_agreement_file_url?: string;
  security_deposit?: number;
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

export type RentalFormFieldType = 'text' | 'textarea' | 'number' | 'date' | 'select';

export interface RentalFormField {
  id: string;
  label: string;
  type: RentalFormFieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface RentalFormSchemaResponse {
  standard_version: string;
  fields: RentalFormField[];
  settings?: {
    show_branch_map: boolean;
    reference_text?: string;
    reference_image_url?: string;
    reference_image_position?: 'top' | 'mid';
  };
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
  stock?: number;
  is_available?: boolean;
  bookings?: Booking[];
  manualBlocks?: ManualBlock[];
}

export interface CartItem {
  id: string;
  name: string;
  daily_price: number;
  deposit_amount: number;
  image_url: string;
  stock?: number;
  quantity?: number;
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
  quantity?: number;
}

export interface OrderHistory {
  id: string;
  store_id: string;
  store_name: string;
  created_at: string;
  status: string;
  total_amount: number;
  renter_emergency_contact?: string;
  store_branch_id?: string;
  store_branch_name?: string;
  store_branch_address?: string;
  lease_agreement_submission_url?: string;
  items: OrderHistoryItem[];
}

export interface FraudListEntry {
  id: string;
  store_id: string | null;
  scope?: 'internal' | 'global';
  status?: 'approved' | 'pending';
  full_name: string;
  email: string;
  contact_number: string;
  billing_address?: string;
  reason: string;
  evidence_image_url?: string;
  global_request_reason?: string;
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
  custom_answers?: Record<string, string>;
  items: Array<{ id: string; name: string; start_date: string; end_date: string; quantity?: number }>;
}

export interface OwnerDashboardData {
  store?: Store;
  stats?: {
    total_rentals: number;
    total_revenue: number;
  };
  items: Item[];
  recentOrders: Array<Record<string, unknown>>;
  recentTransactions?: Array<{
    id: string;
    renter_name: string;
    renter_email: string;
    total_amount: number;
    status: string;
    created_at: string;
    id_types: string[];
  }>;
  customers?: Array<{
    renter_name: string;
    renter_email: string;
    renter_phone: string;
    renter_address?: string;
    transaction_count: number;
    id_types: string[];
    requirements?: Array<{ type: string; url: string }>;
    mostly_rented_gears: Array<{ name: string; count: number }>;
  }>;
  ownerAnalytics?: {
    totalCustomers: number;
    totalCustomersRented: number;
    totalProfit: number;
    pendingCount: number;
    reservedCount: number;
    peakRentalDates: Array<{ date: string; count: number }>;
  };
}

export interface AdminDashboardData {
  pendingStores: Store[];
  allStores: Store[];
  storeInsights?: Array<{
    store_id: string;
    store_name: string;
    income: number;
    assets_value: number;
    assets_count: number;
    customers_count: number;
    pending_count: number;
    approved_count: number;
  }>;
  customers?: Array<User>;
  systemSummary?: {
    totalIncome: number;
    totalAssetsValue: number;
    totalCustomers: number;
    disabledCustomers: number;
  };
}

export interface SubmittedApplication {
  orderId: string;
  submittedAt: string;
  storeName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerEmergencyContact?: string;
  customerAddress: string;
  storeBranchId?: string;
  storeBranchName?: string;
  storeBranchAddress?: string;
  deliveryMode: string;
  deliveryAddress: string;
  paymentMode: string;
  leaseAgreementSubmissionUrl: string;
  customAnswers?: Record<string, string>;
  items: Array<{ name: string; startDate: string; endDate: string; daily_price: number; deposit_amount: number; quantity?: number }>;
  totalAmount: number;
}
