import '../../core/utils/json.dart';
import 'enums.dart';

class Booking {
  const Booking({
    required this.startDate,
    required this.endDate,
    this.startTime,
    this.endTime,
    required this.status,
    this.renterName,
  });

  final String startDate;
  final String endDate;
  final String? startTime;
  final String? endTime;
  final String status;
  final String? renterName;

  factory Booking.fromJson(Map<String, dynamic> json) => Booking(
        startDate: Json.str(json['start_date']),
        endDate: Json.str(json['end_date']),
        startTime: Json.strOrNull(json['start_time']),
        endTime: Json.strOrNull(json['end_time']),
        status: Json.str(json['status']),
        renterName: Json.strOrNull(json['renter_name']),
      );
}

class ManualBlock {
  const ManualBlock({
    required this.id,
    required this.itemId,
    required this.startDate,
    required this.endDate,
    required this.reason,
  });

  final String id;
  final String itemId;
  final String startDate;
  final String endDate;
  final String reason;

  factory ManualBlock.fromJson(Map<String, dynamic> json) => ManualBlock(
        id: Json.str(json['id']),
        itemId: Json.str(json['item_id']),
        startDate: Json.str(json['start_date']),
        endDate: Json.str(json['end_date']),
        reason: Json.str(json['reason']),
      );
}

/// Lightweight store summary embedded in the items feed.
class FeedStore {
  const FeedStore({
    required this.id,
    required this.name,
    required this.logoUrl,
    required this.rating,
    this.locationLat,
    this.locationLng,
  });

  final String id;
  final String name;
  final String logoUrl;
  final double rating;
  final double? locationLat;
  final double? locationLng;

  factory FeedStore.fromJson(Map<String, dynamic> json) => FeedStore(
        id: Json.str(json['id']),
        name: Json.str(json['name'], 'Store'),
        logoUrl: Json.str(json['logo_url']),
        rating: Json.dbl(json['rating']),
        locationLat: Json.dblOrNull(json['location_lat']),
        locationLng: Json.dblOrNull(json['location_lng']),
      );
}

class Item {
  const Item({
    required this.id,
    required this.storeId,
    required this.name,
    required this.description,
    required this.dailyPrice,
    required this.depositAmount,
    required this.imageUrl,
    required this.category,
    this.brand,
    this.stock,
    this.isAvailable = true,
    this.rentalBillingMode,
    this.bookings = const [],
    this.manualBlocks = const [],
    this.store,
  });

  final String id;
  final String storeId;
  final String name;
  final String description;
  final double dailyPrice;
  final double depositAmount;
  final String imageUrl;
  final String category;
  final String? brand;
  final int? stock;
  final bool isAvailable;
  final RentalBillingMode? rentalBillingMode;
  final List<Booking> bookings;
  final List<ManualBlock> manualBlocks;
  final FeedStore? store;

  factory Item.fromJson(Map<String, dynamic> json) => Item(
        id: Json.str(json['id']),
        storeId: Json.str(json['store_id']),
        name: Json.str(json['name']),
        description: Json.str(json['description']),
        dailyPrice: Json.dbl(json['daily_price']),
        depositAmount: Json.dbl(json['deposit_amount']),
        imageUrl: Json.str(json['image_url']),
        category: Json.str(json['category']),
        brand: Json.strOrNull(json['brand']),
        stock: Json.intOrNull(json['stock']),
        isAvailable: Json.boolVal(json['is_available'], true),
        rentalBillingMode: json['rental_billing_mode'] == null
            ? null
            : rentalBillingModeFromString(
                Json.strOrNull(json['rental_billing_mode'])),
        bookings: Json.list(json['bookings']).map(Booking.fromJson).toList(),
        manualBlocks:
            Json.list(json['manualBlocks']).map(ManualBlock.fromJson).toList(),
        store: json['store'] is Map
            ? FeedStore.fromJson(Json.obj(json['store']))
            : null,
      );
}
