import '../../core/constants/api_endpoints.dart';
import '../../core/network/api_client.dart';
import '../../core/utils/json.dart';
import '../models/content.dart';
import '../models/dashboard.dart';

class AdminRepository {
  AdminRepository(this._api);
  final ApiClient _api;

  Future<AdminDashboardData> dashboard() async => AdminDashboardData.fromJson(
        Json.obj(await _api.get(ApiEndpoints.adminDashboard)),
      );

  Future<void> approveStore(String storeId) =>
      _api.post('${ApiEndpoints.stores}/$storeId/approve');

  Future<void> suspendStore(String storeId) =>
      _api.post('${ApiEndpoints.stores}/$storeId/suspend');

  Future<List<FraudListEntry>> fraudList() async {
    final data = await _api.get(ApiEndpoints.adminFraudList);
    return (data as List)
        .map((e) => FraudListEntry.fromJson(Json.obj(e)))
        .toList();
  }

  Future<Map<String, dynamic>> fraudAnalytics() async =>
      Json.obj(await _api.get(ApiEndpoints.adminFraudAnalytics));

  Future<List<SupportTicket>> supportTickets() async {
    final data = await _api.get(ApiEndpoints.adminSupportTickets);
    return (data as List)
        .map((e) => SupportTicket.fromJson(Json.obj(e)))
        .toList();
  }

  Future<void> replySupportTicket(String id, String reply, String status) =>
      _api.patch(
        '${ApiEndpoints.adminSupportTickets}/$id',
        body: {'admin_reply': reply, 'status': status},
      );

  Future<List<Announcement>> announcements() async {
    final data = await _api.get(ApiEndpoints.adminAnnouncements);
    return (data as List)
        .map((e) => Announcement.fromJson(Json.obj(e)))
        .toList();
  }

  Future<void> saveAnnouncement(Map<String, dynamic> payload) =>
      _api.post(ApiEndpoints.adminAnnouncements, body: payload);

  Future<void> deleteAnnouncement(String id) =>
      _api.delete('${ApiEndpoints.adminAnnouncements}/$id');

  Future<DonationSettings> donationSettings() async => DonationSettings.fromJson(
        Json.obj(await _api.get(ApiEndpoints.adminDonationSettings)),
      );

  Future<void> updateDonationSettings(Map<String, dynamic> payload) =>
      _api.put(ApiEndpoints.adminDonationSettings, body: payload);

  Future<void> updateSiteContent(Map<String, dynamic> payload) =>
      _api.put(ApiEndpoints.adminSiteContent, body: payload);
}
