import '../../core/constants/api_endpoints.dart';
import '../../core/network/api_client.dart';
import '../../core/utils/json.dart';
import '../models/item.dart';
import '../models/order.dart';

class OrderRepository {
  OrderRepository(this._api);
  final ApiClient _api;

  /// Creates an order. [payload] is the full checkout body (renter details,
  /// items, document_urls, custom_answers, voucher_code, etc.).
  Future<String> createOrder(Map<String, dynamic> payload) async {
    final data = Json.obj(await _api.post(ApiEndpoints.orders, body: payload));
    return Json.str(data['id'] ?? data['order_id']);
  }

  Future<AppliedVoucher> validateVoucher(String storeId, String code) async {
    final data = Json.obj(await _api.post(
      ApiEndpoints.voucherValidate,
      body: {'store_id': storeId, 'code': code},
    ));
    return AppliedVoucher.fromJson(data, storeId);
  }

  Future<List<OrderHistory>> accountOrders() async {
    final data = await _api.get(ApiEndpoints.accountOrders);
    return (data as List)
        .map((e) => OrderHistory.fromJson(Json.obj(e)))
        .toList();
  }

  Future<void> cancelOrder(String id, String reason) => _api.post(
        ApiEndpoints.cancelAccountOrder(id),
        body: {'cancellation_reason': reason},
      );

  Future<List<ManualBlock>> manualBlocks(String itemId) async {
    final data = await _api.get(ApiEndpoints.manualBlocks(itemId));
    return (data as List).map((e) => ManualBlock.fromJson(Json.obj(e))).toList();
  }
}
