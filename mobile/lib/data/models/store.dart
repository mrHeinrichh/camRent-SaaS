import '../../core/utils/json.dart';
import 'enums.dart';

class StoreBranch {
  const StoreBranch({
    this.id,
    this.name,
    required this.address,
    this.locationLat,
    this.locationLng,
  });

  final String? id;
  final String? name;
  final String address;
  final double? locationLat;
  final double? locationLng;

  factory StoreBranch.fromJson(Map<String, dynamic> json) => StoreBranch(
        id: Json.strOrNull(json['_id'] ?? json['id']),
        name: Json.strOrNull(json['name']),
        address: Json.str(json['address']),
        locationLat: Json.dblOrNull(json['location_lat']),
        locationLng: Json.dblOrNull(json['location_lng']),
      );

  Map<String, dynamic> toJson() => {
        '_id': id,
        'name': name,
        'address': address,
        'location_lat': locationLat,
        'location_lng': locationLng,
      };
}

class Store {
  const Store({
    required this.id,
    required this.name,
    required this.description,
    required this.address,
    required this.logoUrl,
    required this.bannerUrl,
    required this.status,
    required this.isActive,
    this.approvedAt,
    this.paymentDueDate,
    this.locationLat,
    this.locationLng,
    this.facebookUrl,
    this.instagramUrl,
    this.tiktokUrl,
    this.customSocialLinks = const [],
    this.paymentDetails,
    this.paymentDetailImages = const [],
    this.deliveryModes = const [],
    this.branches = const [],
    this.leaseAgreementFileUrl,
    this.securityDeposit = 0,
    this.rentalBillingMode,
    this.rating = 0,
    this.totalReviews = 0,
  });

  final String id;
  final String name;
  final String description;
  final String address;
  final String logoUrl;
  final String bannerUrl;
  final String status; // pending | approved | suspended
  final bool isActive;
  final String? approvedAt;
  final String? paymentDueDate;
  final double? locationLat;
  final double? locationLng;
  final String? facebookUrl;
  final String? instagramUrl;
  final String? tiktokUrl;
  final List<String> customSocialLinks;
  final String? paymentDetails;
  final List<String> paymentDetailImages;
  final List<String> deliveryModes;
  final List<StoreBranch> branches;
  final String? leaseAgreementFileUrl;
  final double securityDeposit;
  final RentalBillingMode? rentalBillingMode;
  final double rating;
  final int totalReviews;

  factory Store.fromJson(Map<String, dynamic> json) => Store(
        id: Json.str(json['id']),
        name: Json.str(json['name']),
        description: Json.str(json['description']),
        address: Json.str(json['address']),
        logoUrl: Json.str(json['logo_url']),
        bannerUrl: Json.str(json['banner_url']),
        status: Json.str(json['status'], 'pending'),
        isActive: Json.boolVal(json['is_active'], true),
        approvedAt: Json.strOrNull(json['approved_at']),
        paymentDueDate: Json.strOrNull(json['payment_due_date']),
        locationLat: Json.dblOrNull(json['location_lat']),
        locationLng: Json.dblOrNull(json['location_lng']),
        facebookUrl: Json.strOrNull(json['facebook_url']),
        instagramUrl: Json.strOrNull(json['instagram_url']),
        tiktokUrl: Json.strOrNull(json['tiktok_url']),
        customSocialLinks: Json.stringList(json['custom_social_links']),
        paymentDetails: Json.strOrNull(json['payment_details']),
        paymentDetailImages: Json.stringList(json['payment_detail_images']),
        deliveryModes: Json.stringList(json['delivery_modes']),
        branches:
            Json.list(json['branches']).map(StoreBranch.fromJson).toList(),
        leaseAgreementFileUrl: Json.strOrNull(json['lease_agreement_file_url']),
        securityDeposit: Json.dbl(json['security_deposit']),
        rentalBillingMode: json['rental_billing_mode'] == null
            ? null
            : rentalBillingModeFromString(
                Json.strOrNull(json['rental_billing_mode'])),
        rating: Json.dbl(json['rating']),
        totalReviews: Json.intVal(json['total_reviews']),
      );
}

class StoreReview {
  const StoreReview({
    required this.id,
    required this.storeId,
    required this.renterName,
    required this.rating,
    required this.description,
    required this.createdAt,
  });

  final String id;
  final String storeId;
  final String renterName;
  final int rating;
  final String description;
  final String createdAt;

  factory StoreReview.fromJson(Map<String, dynamic> json) => StoreReview(
        id: Json.str(json['id']),
        storeId: Json.str(json['store_id']),
        renterName: Json.str(json['renter_name']),
        rating: Json.intVal(json['rating']),
        description: Json.str(json['description']),
        createdAt: Json.str(json['created_at']),
      );
}
