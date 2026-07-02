import '../../core/utils/json.dart';

/// An in-app notification delivered by the backend (`/api/notifications`).
class AppNotification {
  const AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.read,
    required this.createdAt,
    this.data = const {},
  });

  final String id;
  final String type;
  final String title;
  final String body;
  final bool read;
  final DateTime? createdAt;
  final Map<String, dynamic> data;

  String? get orderId => data['order_id']?.toString();
  String? get storeId => data['store_id']?.toString();

  factory AppNotification.fromJson(Map<String, dynamic> json) =>
      AppNotification(
        id: Json.str(json['id']),
        type: Json.str(json['type']),
        title: Json.str(json['title']),
        body: Json.str(json['body']),
        read: Json.boolVal(json['read']),
        createdAt: DateTime.tryParse(Json.str(json['created_at'])),
        data: Json.obj(json['data']),
      );
}

/// One page of notifications plus the total unread count.
class NotificationFeed {
  const NotificationFeed({required this.notifications, required this.unreadCount});

  final List<AppNotification> notifications;
  final int unreadCount;

  factory NotificationFeed.fromJson(Map<String, dynamic> json) =>
      NotificationFeed(
        notifications: (json['notifications'] is List)
            ? (json['notifications'] as List)
                .map((e) => AppNotification.fromJson(Json.obj(e)))
                .toList()
            : const [],
        unreadCount: Json.intVal(json['unread_count']),
      );
}
