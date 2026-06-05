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

  Future<OwnerDashboardData> dashboard() async => OwnerDashboardData.fromJson(
        Json.obj(await _api.get(ApiEndpoints.ownerDashboard)),
      );

  Future<List<OwnerApplication>> applications() async {
    final data = await _api.get(ApiEndpoints.ownerApplications);
    return (data as List)
        .map((e) => OwnerApplication.fromJson(Json.obj(e)))
        .toList();
  }

  Future<void> approveApplication(String id) =>
      _api.post(ApiEndpoints.approveOrder(id));

  Future<void> rejectApplication(String id, String reason) =>
      _api.post(ApiEndpoints.rejectOrder(id), body: {'reason': reason});

  Future<List<Voucher>> vouchers() async {
    final data = await _api.get(ApiEndpoints.ownerVouchers);
    return (data as List).map((e) => Voucher.fromJson(Json.obj(e))).toList();
  }

  Future<Voucher> createVoucher(String code, double discount) async =>
      Voucher.fromJson(Json.obj(await _api.post(
        ApiEndpoints.ownerVouchers,
        body: {'code': code, 'discount_amount': discount},
      )));

  Future<void> deleteVoucher(String id) =>
      _api.delete('${ApiEndpoints.ownerVouchers}/$id');

  Future<List<FraudListEntry>> fraudList() async {
    final data = await _api.get(ApiEndpoints.ownerFraudList);
    return (data as List)
        .map((e) => FraudListEntry.fromJson(Json.obj(e)))
        .toList();
  }

  Future<void> reportFraud(Map<String, dynamic> payload) =>
      _api.post(ApiEndpoints.ownerReportFraud, body: payload);

  Future<List<SupportTicket>> supportTickets() async {
    final data = await _api.get(ApiEndpoints.ownerSupportTickets);
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

  Future<RentalFormSchema> rentalForm() async => RentalFormSchema.fromJson(
        Json.obj(await _api.get(ApiEndpoints.ownerRentalForm)),
      );

  Future<void> updateRentalForm(Map<String, dynamic> payload) =>
      _api.put(ApiEndpoints.ownerRentalForm, body: payload);
}
