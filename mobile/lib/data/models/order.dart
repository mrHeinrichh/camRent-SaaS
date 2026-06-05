import '../../core/utils/json.dart';

class OrderHistoryItem {
  const OrderHistoryItem({
    required this.id,
    required this.name,
    this.description,
    required this.startDate,
    required this.endDate,
    this.startTime,
    this.endTime,
    required this.dailyPrice,
    required this.imageUrl,
    this.quantity = 1,
  });

  final String id;
  final String name;
  final String? description;
  final String startDate;
  final String endDate;
  final String? startTime;
  final String? endTime;
  final double dailyPrice;
  final String imageUrl;
  final int quantity;

  factory OrderHistoryItem.fromJson(Map<String, dynamic> json) =>
      OrderHistoryItem(
        id: Json.str(json['id']),
        name: Json.str(json['name']),
        description: Json.strOrNull(json['description']),
        startDate: Json.str(json['start_date']),
        endDate: Json.str(json['end_date']),
        startTime: Json.strOrNull(json['start_time']),
        endTime: Json.strOrNull(json['end_time']),
        dailyPrice: Json.dbl(json['daily_price']),
        imageUrl: Json.str(json['image_url']),
        quantity: Json.intVal(json['quantity'], 1),
      );
}

class OrderDocument {
  const OrderDocument({required this.type, required this.url});
  final String type;
  final String url;

  factory OrderDocument.fromJson(Map<String, dynamic> json) => OrderDocument(
        type: Json.str(json['type']),
        url: Json.str(json['url']),
      );
}

class OrderHistory {
  const OrderHistory({
    required this.id,
    required this.storeId,
    required this.storeName,
    required this.createdAt,
    required this.status,
    required this.totalAmount,
    this.voucherCode,
    this.voucherDiscount,
    this.renterName,
    this.renterEmail,
    this.renterPhone,
    this.renterAddress,
    this.deliveryMode,
    this.deliveryAddress,
    this.paymentMode,
    this.storeBranchName,
    this.storeBranchAddress,
    this.cancellationReason,
    this.customAnswers = const {},
    this.documents = const [],
    this.items = const [],
  });

  final String id;
  final String storeId;
  final String storeName;
  final String createdAt;
  final String status;
  final double totalAmount;
  final String? voucherCode;
  final double? voucherDiscount;
  final String? renterName;
  final String? renterEmail;
  final String? renterPhone;
  final String? renterAddress;
  final String? deliveryMode;
  final String? deliveryAddress;
  final String? paymentMode;
  final String? storeBranchName;
  final String? storeBranchAddress;
  final String? cancellationReason;
  final Map<String, String> customAnswers;
  final List<OrderDocument> documents;
  final List<OrderHistoryItem> items;

  factory OrderHistory.fromJson(Map<String, dynamic> json) => OrderHistory(
        id: Json.str(json['id']),
        storeId: Json.str(json['store_id']),
        storeName: Json.str(json['store_name']),
        createdAt: Json.str(json['created_at']),
        status: Json.str(json['status']),
        totalAmount: Json.dbl(json['total_amount']),
        voucherCode: Json.strOrNull(json['voucher_code']),
        voucherDiscount: Json.dblOrNull(json['voucher_discount']),
        renterName: Json.strOrNull(json['renter_name']),
        renterEmail: Json.strOrNull(json['renter_email']),
        renterPhone: Json.strOrNull(json['renter_phone']),
        renterAddress: Json.strOrNull(json['renter_address']),
        deliveryMode: Json.strOrNull(json['delivery_mode']),
        deliveryAddress: Json.strOrNull(json['delivery_address']),
        paymentMode: Json.strOrNull(json['payment_mode']),
        storeBranchName: Json.strOrNull(json['store_branch_name']),
        storeBranchAddress: Json.strOrNull(json['store_branch_address']),
        cancellationReason: Json.strOrNull(json['cancellation_reason']),
        customAnswers: Json.stringMap(json['custom_answers']),
        documents:
            Json.list(json['documents']).map(OrderDocument.fromJson).toList(),
        items: Json.list(json['items'])
            .map(OrderHistoryItem.fromJson)
            .toList(),
      );
}

class Voucher {
  const Voucher({
    required this.id,
    required this.storeId,
    required this.code,
    required this.discountAmount,
    required this.isActive,
    this.isUsed = false,
  });

  final String id;
  final String storeId;
  final String code;
  final double discountAmount;
  final bool isActive;
  final bool isUsed;

  factory Voucher.fromJson(Map<String, dynamic> json) => Voucher(
        id: Json.str(json['id']),
        storeId: Json.str(json['store_id']),
        code: Json.str(json['code']),
        discountAmount: Json.dbl(json['discount_amount']),
        isActive: Json.boolVal(json['is_active'], true),
        isUsed: Json.boolVal(json['is_used']),
      );
}

/// Result of POST /api/orders/voucher/validate
class AppliedVoucher {
  const AppliedVoucher({
    required this.code,
    required this.discountAmount,
    required this.storeId,
  });

  final String code;
  final double discountAmount;
  final String storeId;

  factory AppliedVoucher.fromJson(Map<String, dynamic> json, String storeId) =>
      AppliedVoucher(
        code: Json.str(json['code']),
        discountAmount: Json.dbl(json['discount_amount']),
        storeId: storeId,
      );
}
