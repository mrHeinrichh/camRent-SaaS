import '../../core/constants/api_endpoints.dart';
import '../../core/network/api_client.dart';
import '../../core/utils/json.dart';
import '../models/content.dart';
import '../models/item.dart';
import '../models/rental_form.dart';
import '../models/store.dart';

/// Public catalogue: stores, items feed, reviews, site content, announcements.
class CatalogRepository {
  CatalogRepository(this._api);
  final ApiClient _api;

  Future<List<Store>> stores({bool forceRefresh = false}) async {
    final data = await _api.getCached(ApiEndpoints.stores,
        forceRefresh: forceRefresh);
    return (data as List).map((e) => Store.fromJson(Json.obj(e))).toList();
  }

  Future<Store> store(String id, {bool forceRefresh = false}) async =>
      Store.fromJson(Json.obj(
          await _api.getCached(ApiEndpoints.store(id), forceRefresh: forceRefresh)));

  Future<List<Item>> feed({bool forceRefresh = false}) async {
    final data = await _api.getCached(ApiEndpoints.itemsFeed,
        forceRefresh: forceRefresh);
    return (data as List).map((e) => Item.fromJson(Json.obj(e))).toList();
  }

  Future<Item> item(String id, {bool forceRefresh = false}) async =>
      Item.fromJson(Json.obj(
          await _api.getCached(ApiEndpoints.item(id), forceRefresh: forceRefresh)));

  Future<RentalFormSchema> rentalForm(String storeId) async => RentalFormSchema
      .fromJson(Json.obj(await _api.get(ApiEndpoints.storeRentalForm(storeId))));

  Future<List<StoreReview>> reviews(String storeId) async {
    final data = await _api.get(ApiEndpoints.storeReviews(storeId));
    return (data as List)
        .map((e) => StoreReview.fromJson(Json.obj(e)))
        .toList();
  }

  Future<bool> reviewEligibility(String storeId) async {
    final data = Json.obj(await _api.get(
      ApiEndpoints.storeReviewEligibility(storeId),
    ));
    return Json.boolVal(data['eligible']);
  }

  Future<void> submitReview(
    String storeId, {
    required int rating,
    required String description,
  }) =>
      _api.post(
        ApiEndpoints.storeReviews(storeId),
        body: {'rating': rating, 'description': description},
      );

  Future<void> reportStore(
    String storeId, {
    required String reason,
    String? evidenceImageUrl,
  }) =>
      _api.post(
        ApiEndpoints.storeReport(storeId),
        body: {'reason': reason, 'evidence_image_url': evidenceImageUrl},
      );

  Future<SiteContent> siteContent({bool forceRefresh = false}) async {
    try {
      return SiteContent.fromJson(Json.obj(await _api.getCached(
          ApiEndpoints.siteContent,
          ttl: const Duration(hours: 6),
          forceRefresh: forceRefresh)));
    } catch (_) {
      return SiteContent.fallback;
    }
  }

  Future<List<Announcement>> announcements({bool forceRefresh = false}) async {
    final data = await _api.getCached(ApiEndpoints.announcements,
        ttl: const Duration(minutes: 30), forceRefresh: forceRefresh);
    return (data as List).map((e) => Announcement.fromJson(Json.obj(e))).toList();
  }
}
