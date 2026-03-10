export type UserRole = 'renter' | 'owner' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  avatar_url: string;
  phone?: string;
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
  tiktok_url?: string;
  custom_social_links?: string[];
  payment_details?: string;
  payment_detail_images?: string[];
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
  total_reviews?: number;
}

export interface StoreReview {
  id: string;
  store_id: string;
  renter_id: string;
  renter_name: string;
  rating: number;
  description: string;
  created_at: string;
}

export interface Booking {
  start_date: string;
  end_date: string;
  status: string;
  renter_name?: string;
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
  brand?: string;
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
  description?: string;
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
  voucher_code?: string;
  voucher_discount?: number;
  renter_name?: string;
  renter_email?: string;
  renter_phone?: string;
  renter_address?: string;
  renter_emergency_contact?: string;
  renter_emergency_contact_name?: string;
  store_branch_id?: string;
  store_branch_name?: string;
  store_branch_address?: string;
  delivery_mode?: string;
  delivery_address?: string;
  payment_mode?: string;
  lease_agreement_submission_url?: string;
  cancellation_reason?: string;
  custom_answers?: Record<string, string>;
  documents?: Array<{ type: string; url: string }>;
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
  requirement_files?: Array<{ type: string; url: string }>;
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
  renter_emergency_contact_name?: string;
  renter_emergency_contact?: string;
  renter_address: string;
  delivery_mode: string;
  payment_mode: string;
  total_amount: number;
  created_at: string;
  status: string;
  fraud_flag: boolean | number;
  custom_answers?: Record<string, string>;
  documents?: Array<{ type: string; url: string }>;
  items: Array<{ id: string; name: string; description?: string; image_url?: string; start_date: string; end_date: string; quantity?: number }>;
}

export interface SupportTicket {
  id: string;
  store_id: string;
  owner_id: string;
  type: 'feedback' | 'support' | 'bug';
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  admin_reply?: string;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
  store_name?: string;
  owner_email?: string;
  owner_name?: string;
}

export interface Announcement {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  cta_label?: string;
  cta_url?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DonationSettings {
  id?: string | null;
  message: string;
  qr_codes: Array<{ label: string; url: string }>;
  bank_details: Array<{ label: string; url: string }>;
  is_active?: boolean;
}

export interface Voucher {
  id: string;
  store_id: string;
  code: string;
  discount_amount: number;
  is_active: boolean;
  is_used?: boolean;
  usages?: Array<{ user_id?: string; email?: string; order_id?: string; used_at?: string }>;
  created_at?: string;
  updated_at?: string;
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
    renter_phone?: string;
    renter_emergency_contact_name?: string;
    renter_emergency_contact?: string;
    renter_address?: string;
    store_branch_name?: string;
    store_branch_address?: string;
    delivery_mode?: string;
    delivery_address?: string;
    payment_mode?: string;
    total_amount: number;
    status: string;
    created_at: string;
    id_types: string[];
    start_date?: string | null;
    end_date?: string | null;
    items?: Array<{ name: string; description?: string; start_date: string; end_date: string; quantity?: number }>;
    documents?: Array<{ type: string; url: string }>;
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
    transactions?: Array<{
      id: string;
      status: string;
      total_amount: number;
      created_at: string;
      payment_mode?: string;
      delivery_mode?: string;
      renter_address?: string;
      store_branch_name?: string;
      store_branch_address?: string;
      items: Array<{ name: string; description?: string; start_date: string; end_date: string; quantity?: number }>;
      documents?: Array<{ type: string; url: string }>;
    }>;
  }>;
  ownerAnalytics?: {
    totalCustomers: number;
    totalCustomersRented: number;
    totalProfit: number;
    pendingCount: number;
    reservedCount: number;
    peakRentalDates: Array<{ date: string; count: number }>;
    mostRentedCameras?: Array<{ name: string; count: number }>;
    topRentersOfMonth?: Array<{ renter_name: string; renter_email: string; rentals: number; amount: number }>;
  };
  storeRatings?: Array<{ renter_name: string; rating: number; description: string; created_at: string }>;
}

export interface AdminDashboardData {
  pendingStores: Store[];
  allStores: Store[];
  storeInsights?: Array<{
    store_id: string;
    store_name: string;
    store_logo_url?: string;
    owner_id?: string;
    owner_name?: string;
    owner_email?: string;
    owner_avatar_url?: string;
    income: number;
    assets_value: number;
    assets_count: number;
    customers_count: number;
    pending_count: number;
    approved_count: number;
    total_orders?: number;
    total_items?: number;
    average_rating?: number;
    total_reviews?: number;
    due_days_remaining?: number | null;
    near_due?: boolean;
    overdue?: boolean;
    last_order_at?: string | null;
  }>;
  customers?: Array<User>;
  customerInsights?: Array<{
    customer_id: string;
    full_name: string;
    email: string;
    is_active: boolean;
    transaction_count: number;
    successful_transactions: number;
    total_spent: number;
    last_transaction_at?: string | null;
  }>;
  topCustomers?: Array<{
    customer_id: string;
    full_name: string;
    email: string;
    is_active: boolean;
    transaction_count: number;
    successful_transactions: number;
    total_spent: number;
    last_transaction_at?: string | null;
  }>;
  topGears?: Array<{
    item_id: string;
    name: string;
    brand: string;
    category: string;
    store_id: string;
    store_name: string;
    rent_count: number;
    revenue_estimate: number;
  }>;
  topStores?: Array<{
    store_id: string;
    store_name: string;
    store_logo_url?: string;
    owner_id?: string;
    owner_name?: string;
    owner_email?: string;
    owner_avatar_url?: string;
    income: number;
    assets_value: number;
    assets_count: number;
    customers_count: number;
    pending_count: number;
    approved_count: number;
    total_orders?: number;
    total_items?: number;
    average_rating?: number;
    total_reviews?: number;
    due_days_remaining?: number | null;
    near_due?: boolean;
    overdue?: boolean;
    last_order_at?: string | null;
  }>;
  recentRatings?: Array<{
    id: string;
    store_id: string;
    store_name: string;
    renter_name: string;
    rating: number;
    description: string;
    created_at: string;
  }>;
  systemSummary?: {
    totalIncome: number;
    totalAssetsValue: number;
    totalCustomers: number;
    disabledCustomers: number;
    totalStores?: number;
    pendingMerchants?: number;
    nearDueStores?: number;
    overdueStores?: number;
    pendingGlobalFraud?: number;
    totalFeedback?: number;
    totalRatings?: number;
    openSupportTickets?: number;
    inProgressSupportTickets?: number;
    resolvedSupportTickets?: number;
  };
}

export interface SubmittedApplication {
  orderId: string;
  submittedAt: string;
  storeName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerEmergencyContactName?: string;
  customerEmergencyContact?: string;
  customerAddress: string;
  billingAddressFileUrl?: string;
  storeBranchId?: string;
  storeBranchName?: string;
  storeBranchAddress?: string;
  deliveryMode: string;
  deliveryAddress: string;
  paymentMode: string;
  leaseAgreementSubmissionUrl: string;
  customAnswers?: Record<string, string>;
  items: Array<{ name: string; image_url?: string; startDate: string; endDate: string; daily_price: number; deposit_amount: number; quantity?: number }>;
  totalAmount: number;
}
