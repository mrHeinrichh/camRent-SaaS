import '../../core/constants/api_endpoints.dart';
import '../../core/network/api_client.dart';
import '../../core/utils/json.dart';
import '../models/content.dart';
import '../models/dashboard.dart';

class AdminRepository {
  AdminRepository(this._api);
  final ApiClient _api;

  Future<AdminDashboardData> dashboard({bool forceRefresh = false}) async =>
      AdminDashboardData.fromJson(
        Json.obj(await _api.getCached(ApiEndpoints.adminDashboard,
            ttl: const Duration(minutes: 2), forceRefresh: forceRefresh)),
      );

  // ── Stores ────────────────────────────────────────────────────────
  Future<void> approveStore(String id) =>
      _api.post(ApiEndpoints.adminApproveStore(id));

  Future<void> setStoreActive(String id, bool isActive) =>
      _api.post(ApiEndpoints.adminStoreActive(id), body: {'isActive': isActive});

  Future<void> deleteStore(String id, String adminPassword) => _api.post(
        ApiEndpoints.adminDeleteStore(id),
        body: {'admin_password': adminPassword},
      );

  // ── Customers / users ─────────────────────────────────────────────
  Future<void> setCustomerActive(String id, bool isActive) => _api.post(
        ApiEndpoints.adminCustomerActive(id),
        body: {'isActive': isActive},
      );

  Future<void> deleteUser(String id, String adminPassword) => _api.post(
        ApiEndpoints.adminDeleteUser(id),
        body: {'admin_password': adminPassword},
      );

  // ── Fraud list ────────────────────────────────────────────────────
  Future<List<FraudListEntry>> fraudList({bool forceRefresh = false}) async {
    final data = await _api.getCached(ApiEndpoints.adminFraudList,
        ttl: const Duration(minutes: 5), forceRefresh: forceRefresh);
    return (data as List)
        .map((e) => FraudListEntry.fromJson(Json.obj(e)))
        .toList();
  }

  Future<void> createFraud(Map<String, dynamic> payload) =>
      _api.post(ApiEndpoints.adminFraudList, body: payload);

  Future<void> updateFraud(String id, Map<String, dynamic> payload) =>
      _api.put(ApiEndpoints.adminFraudItem(id), body: payload);

  Future<void> deleteFraud(String id) =>
      _api.delete(ApiEndpoints.adminFraudItem(id));

  Future<void> globalizeFraud(String id) =>
      _api.post(ApiEndpoints.adminFraudGlobalize(id));

  Future<void> approveGlobalFraud(String id) =>
      _api.post(ApiEndpoints.adminFraudApproveGlobal(id));

  Future<Map<String, dynamic>> fraudAnalytics() async =>
      Json.obj(await _api.get(ApiEndpoints.adminFraudAnalytics));

  // ── Support tickets ───────────────────────────────────────────────
  Future<List<SupportTicket>> supportTickets({bool forceRefresh = false}) async {
    final data = await _api.getCached(ApiEndpoints.adminSupportTickets,
        ttl: const Duration(minutes: 3), forceRefresh: forceRefresh);
    return (data as List)
        .map((e) => SupportTicket.fromJson(Json.obj(e)))
        .toList();
  }

  Future<void> replySupportTicket(String id, String reply, String status) =>
      _api.put(
        ApiEndpoints.adminSupportTicket(id),
        body: {'admin_reply': reply, 'status': status},
      );

  Future<void> deleteSupportTicket(String id) =>
      _api.delete(ApiEndpoints.adminSupportTicket(id));

  // ── Announcements ─────────────────────────────────────────────────
  Future<List<Announcement>> announcements({bool forceRefresh = false}) async {
    final data = await _api.getCached(ApiEndpoints.adminAnnouncements,
        ttl: const Duration(minutes: 5), forceRefresh: forceRefresh);
    return (data as List)
        .map((e) => Announcement.fromJson(Json.obj(e)))
        .toList();
  }

  Future<void> createAnnouncement(Map<String, dynamic> payload) =>
      _api.post(ApiEndpoints.adminAnnouncements, body: payload);

  Future<void> updateAnnouncement(String id, Map<String, dynamic> payload) =>
      _api.put(ApiEndpoints.adminAnnouncementItem(id), body: payload);

  Future<void> deleteAnnouncement(String id) =>
      _api.delete(ApiEndpoints.adminAnnouncementItem(id));

  Future<bool> announcementSettings({bool forceRefresh = false}) async {
    final data = Json.obj(await _api.getCached(
        ApiEndpoints.adminAnnouncementSettings,
        ttl: const Duration(minutes: 10),
        forceRefresh: forceRefresh));
    return Json.boolVal(data['is_enabled'], true);
  }

  Future<void> updateAnnouncementSettings(bool isEnabled) => _api.put(
        ApiEndpoints.adminAnnouncementSettings,
        body: {'is_enabled': isEnabled},
      );

  // ── Donation settings ─────────────────────────────────────────────
  Future<DonationSettings> donationSettings({bool forceRefresh = false}) async =>
      DonationSettings.fromJson(
        Json.obj(await _api.getCached(ApiEndpoints.adminDonationSettings,
            ttl: const Duration(minutes: 10), forceRefresh: forceRefresh)),
      );

  Future<void> updateDonationSettings(Map<String, dynamic> payload) =>
      _api.put(ApiEndpoints.adminDonationSettings, body: payload);

  // ── Site content ──────────────────────────────────────────────────
  Future<Map<String, dynamic>> siteContentRaw({bool forceRefresh = false}) async =>
      Json.obj(await _api.getCached(ApiEndpoints.adminSiteContent,
          ttl: const Duration(minutes: 10), forceRefresh: forceRefresh));

  Future<void> updateSiteContent(Map<String, dynamic> payload) =>
      _api.put(ApiEndpoints.adminSiteContent, body: payload);
}
