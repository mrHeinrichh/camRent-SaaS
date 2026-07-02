import '../../core/constants/api_endpoints.dart';
import '../../core/network/api_client.dart';
import '../../core/utils/json.dart';
import '../models/content.dart';
import '../models/dashboard.dart';
import '../models/order.dart';
import '../models/rental_form.dart';

class OwnerRepository {
  OwnerRepository(this._api);
  final ApiClient _api;

  Future<OwnerDashboardData> dashboard({bool forceRefresh = false}) async =>
      OwnerDashboardData.fromJson(
        Json.obj(await _api.getCached(ApiEndpoints.ownerDashboard,
            ttl: const Duration(minutes: 2), forceRefresh: forceRefresh)),
      );

  // ── Gear (item) CRUD ──────────────────────────────────────────────
  Future<void> createItem(Map<String, dynamic> payload) =>
      _api.post(ApiEndpoints.items, body: payload);

  Future<void> updateItem(String id, Map<String, dynamic> payload) =>
      _api.put(ApiEndpoints.item(id), body: payload);

  Future<void> deleteItem(String id) => _api.delete(ApiEndpoints.item(id));

  Future<List<OwnerApplication>> applications({bool forceRefresh = false}) async {
    final data = await _api.getCached(ApiEndpoints.ownerApplications,
        ttl: const Duration(minutes: 2), forceRefresh: forceRefresh);
    return (data as List)
        .map((e) => OwnerApplication.fromJson(Json.obj(e)))
        .toList();
  }

  Future<void> approveApplication(String id) =>
      _api.post(ApiEndpoints.approveOrder(id));

  Future<void> rejectApplication(String id, String reason) =>
      _api.post(ApiEndpoints.rejectOrder(id), body: {'reason': reason});

  Future<void> completeApplication(String id) =>
      _api.post(ApiEndpoints.completeOrder(id));

  Future<List<Voucher>> vouchers({bool forceRefresh = false}) async {
    final data = await _api.getCached(ApiEndpoints.ownerVouchers,
        ttl: const Duration(minutes: 5), forceRefresh: forceRefresh);
    return (data as List).map((e) => Voucher.fromJson(Json.obj(e))).toList();
  }

  Future<Voucher> createVoucher(String code, double discount) async =>
      Voucher.fromJson(Json.obj(await _api.post(
        ApiEndpoints.ownerVouchers,
        body: {'code': code, 'discount_amount': discount},
      )));

  Future<void> deleteVoucher(String id) =>
      _api.delete('${ApiEndpoints.ownerVouchers}/$id');

  Future<List<FraudListEntry>> fraudList({bool forceRefresh = false}) async {
    final data = await _api.getCached(ApiEndpoints.ownerFraudList,
        ttl: const Duration(minutes: 5), forceRefresh: forceRefresh);
    return (data as List)
        .map((e) => FraudListEntry.fromJson(Json.obj(e)))
        .toList();
  }

  Future<void> reportFraud(Map<String, dynamic> payload) =>
      _api.post(ApiEndpoints.ownerReportFraud, body: payload);

  Future<List<SupportTicket>> supportTickets({bool forceRefresh = false}) async {
    final data = await _api.getCached(ApiEndpoints.ownerSupportTickets,
        ttl: const Duration(minutes: 5), forceRefresh: forceRefresh);
    return (data as List)
        .map((e) => SupportTicket.fromJson(Json.obj(e)))
        .toList();
  }

  Future<void> createSupportTicket(Map<String, dynamic> payload) =>
      _api.post(ApiEndpoints.ownerSupportTickets, body: payload);

  Future<Map<String, dynamic>> storeProfile() async =>
      Json.obj(await _api.get(ApiEndpoints.ownerStoreProfile));

  Future<void> updateStoreProfile(Map<String, dynamic> payload) =>
      _api.put(ApiEndpoints.ownerStoreProfile, body: payload);

  Future<RentalFormSchema> rentalForm({bool forceRefresh = false}) async =>
      RentalFormSchema.fromJson(
        Json.obj(await _api.getCached(ApiEndpoints.ownerRentalForm,
            ttl: const Duration(minutes: 10), forceRefresh: forceRefresh)),
      );

  Future<void> updateRentalForm(Map<String, dynamic> payload) =>
      _api.put(ApiEndpoints.ownerRentalForm, body: payload);

  // ── Rental calendar / manual blocks ───────────────────────────────
  Future<void> addManualBlock({
    required String itemId,
    required String startDate,
    required String endDate,
    required String reason,
  }) =>
      _api.post(ApiEndpoints.manualBlocksBase, body: {
        'item_id': itemId,
        'start_date': startDate,
        'end_date': endDate,
        'reason': reason,
      });

  Future<void> deleteManualBlock(String id) =>
      _api.delete(ApiEndpoints.deleteManualBlock(id));
}
