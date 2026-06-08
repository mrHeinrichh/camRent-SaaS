/// Central registry of REST endpoints, mirroring the backend routes consumed
/// by the web frontend (`frontend/src/lib/*`).
class ApiEndpoints {
  ApiEndpoints._();

  // Auth
  static const String login = '/api/auth/login';
  static const String register = '/api/auth/register';
  static const String profile = '/api/auth/profile';
  static const String google = '/api/auth/google';
  static const String sendOtp = '/api/auth/send-otp';
  static const String verifyOtp = '/api/auth/verify-otp';

  // Public catalogue
  static const String stores = '/api/stores';
  static String store(String id) => '/api/stores/$id';
  static String storeRentalForm(String id) => '/api/stores/$id/rental-form';
  static String storeReviews(String id) => '/api/stores/$id/reviews';
  static String storeReviewEligibility(String id) =>
      '/api/stores/$id/review-eligibility';
  static String storeReport(String id) => '/api/stores/$id/report';

  static const String items = '/api/items';
  static const String itemsFeed = '/api/items/feed';
  static String item(String id) => '/api/items/$id';

  static String manualBlocks(String itemId) => '/api/manual-blocks/$itemId';
  static const String manualBlocksBase = '/api/manual-blocks';
  static String deleteManualBlock(String id) => '/api/manual-blocks/$id';

  // Orders / checkout
  static const String orders = '/api/orders';
  static const String voucherValidate = '/api/orders/voucher/validate';
  static const String accountOrders = '/api/account/orders';
  static String cancelAccountOrder(String id) =>
      '/api/account/orders/$id/cancel';

  // Uploads
  static const String upload = '/api/upload';
  static const String uploadPublic = '/api/upload/public';
  static const String uploadPublicStrict =
      '/api/upload/public/strict-cloudinary';

  // Content
  static const String siteContent = '/api/site-content';
  static const String announcements = '/api/announcements';

  // Dashboards
  static const String ownerDashboard = '/api/dashboard/owner';
  static const String adminDashboard = '/api/dashboard/admin';

  // Owner
  static const String ownerApplications = '/api/owner/applications';
  static const String ownerStoreProfile = '/api/owner/store-profile';
  static const String ownerRentalForm = '/api/owner/rental-form';
  static const String ownerVouchers = '/api/owner/vouchers';
  static const String ownerFraudList = '/api/owner/fraud-list';
  static const String ownerReportFraud = '/api/owner/customers/report-fraud';
  static const String ownerSupportTickets = '/api/owner/support-tickets';
  static String approveOrder(String id) => '/api/orders/$id/approve';
  static String rejectOrder(String id) => '/api/orders/$id/reject';

  // Admin
  static const String adminFraudList = '/api/admin/fraud-list';
  static String adminFraudItem(String id) => '/api/admin/fraud-list/$id';
  static String adminFraudGlobalize(String id) =>
      '/api/admin/fraud-list/globalize/$id';
  static String adminFraudApproveGlobal(String id) =>
      '/api/admin/fraud-list/$id/approve-global';
  static const String adminFraudAnalytics = '/api/admin/fraud-analytics';
  static const String adminSupportTickets = '/api/admin/support-tickets';
  static String adminSupportTicket(String id) =>
      '/api/admin/support-tickets/$id';
  static const String adminAnnouncements = '/api/admin/announcements';
  static String adminAnnouncementItem(String id) =>
      '/api/admin/announcements/$id';
  static const String adminAnnouncementSettings =
      '/api/admin/announcement-settings';
  static const String adminDonationSettings = '/api/admin/donation-settings';
  static const String adminSiteContent = '/api/admin/site-content';

  // Admin store / customer actions
  static String adminApproveStore(String id) =>
      '/api/admin/stores/$id/approve';
  static String adminStoreActive(String id) => '/api/admin/stores/$id/active';
  static String adminDeleteStore(String id) => '/api/admin/stores/$id/delete';
  static String adminCustomerActive(String id) =>
      '/api/admin/customers/$id/active';
  static String adminDeleteUser(String id) => '/api/admin/users/$id/delete';
}
