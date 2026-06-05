import '../../core/utils/json.dart';
import 'enums.dart';

class CartItem {
  const CartItem({
    required this.id,
    required this.name,
    required this.dailyPrice,
    required this.depositAmount,
    required this.imageUrl,
    required this.storeId,
    this.stock,
    this.quantity = 1,
    required this.startDate,
    required this.endDate,
    this.startTime,
    this.endTime,
    this.rentalBillingMode,
  });

  final String id;
  final String name;
  final double dailyPrice;
  final double depositAmount;
  final String imageUrl;
  final String storeId;
  final int? stock;
  final int quantity;
  final String startDate;
  final String endDate;
  final String? startTime;
  final String? endTime;
  final RentalBillingMode? rentalBillingMode;

  /// Uniqueness key, matching the web store's identity comparison.
  String get lineKey =>
      '$id|$startDate|$endDate|${startTime ?? ''}|${endTime ?? ''}';

  CartItem copyWith({int? quantity}) => CartItem(
        id: id,
        name: name,
        dailyPrice: dailyPrice,
        depositAmount: depositAmount,
        imageUrl: imageUrl,
        storeId: storeId,
        stock: stock,
        quantity: quantity ?? this.quantity,
        startDate: startDate,
        endDate: endDate,
        startTime: startTime,
        endTime: endTime,
        rentalBillingMode: rentalBillingMode,
      );

  factory CartItem.fromJson(Map<String, dynamic> json) => CartItem(
        id: Json.str(json['id']),
        name: Json.str(json['name']),
        dailyPrice: Json.dbl(json['daily_price']),
        depositAmount: Json.dbl(json['deposit_amount']),
        imageUrl: Json.str(json['image_url']),
        storeId: Json.str(json['store_id']),
        stock: Json.intOrNull(json['stock']),
        quantity: Json.intVal(json['quantity'], 1),
        startDate: Json.str(json['startDate']),
        endDate: Json.str(json['endDate']),
        startTime: Json.strOrNull(json['startTime']),
        endTime: Json.strOrNull(json['endTime']),
        rentalBillingMode: json['rentalBillingMode'] == null
            ? null
            : rentalBillingModeFromString(
                Json.strOrNull(json['rentalBillingMode'])),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'daily_price': dailyPrice,
        'deposit_amount': depositAmount,
        'image_url': imageUrl,
        'store_id': storeId,
        'stock': stock,
        'quantity': quantity,
        'startDate': startDate,
        'endDate': endDate,
        'startTime': startTime,
        'endTime': endTime,
        'rentalBillingMode': rentalBillingMode == null
            ? null
            : rentalBillingModeToString(rentalBillingMode!),
      };
}
