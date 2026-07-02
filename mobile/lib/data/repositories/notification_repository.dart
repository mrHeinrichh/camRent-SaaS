import '../../core/constants/api_endpoints.dart';
import '../../core/network/api_client.dart';
import '../../core/utils/json.dart';
import '../models/notification.dart';

class NotificationRepository {
  NotificationRepository(this._api);
  final ApiClient _api;

  Future<NotificationFeed> feed({int limit = 50}) async =>
      NotificationFeed.fromJson(Json.obj(
        await _api.get(ApiEndpoints.notifications, query: {'limit': '$limit'}),
      ));

  Future<void> markRead(String id) =>
      _api.post(ApiEndpoints.notificationRead(id));

  Future<void> markAllRead() => _api.post(ApiEndpoints.notificationsReadAll);
}
