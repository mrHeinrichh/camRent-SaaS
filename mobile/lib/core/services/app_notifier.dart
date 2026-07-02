import 'dart:async';

import 'package:flutter/foundation.dart';

import '../../data/models/notification.dart';
import '../../data/repositories/notification_repository.dart';
import '../storage/cache_service.dart';
import 'notification_service.dart';

/// While any user is logged in (customer, merchant or admin), periodically
/// polls the backend notification feed, fires a local notification for each
/// newly arrived entry and exposes the unread count for badges.
///
/// Note: this runs while the app is open (foreground or recently active). True
/// background/push delivery would require FCM + server integration.
class AppNotifier {
  AppNotifier(this._repo, this._notif, this._cache);

  final NotificationRepository _repo;
  final NotificationService _notif;
  final CacheService _cache;

  static const Duration _interval = Duration(seconds: 60);

  /// Unread notification count for the signed-in user, for bell badges.
  final ValueNotifier<int> unreadCount = ValueNotifier<int>(0);

  /// Latest fetched feed so screens can render instantly before refreshing.
  List<AppNotification> lastFeed = const [];

  Timer? _timer;
  String? _userId;
  bool _busy = false;

  String get _seenKey => 'notif_seen_ids_${_userId ?? 'anon'}';

  Future<void> start(String userId) async {
    if (_timer != null && _userId == userId) return;
    stop();
    _userId = userId;
    await _notif.init();
    await _notif.requestPermission();
    await _tick(); // seed / initial check
    _timer = Timer.periodic(_interval, (_) => _tick());
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
    _userId = null;
    lastFeed = const [];
    unreadCount.value = 0;
  }

  /// Re-fetches immediately (e.g. after the user opens the notification list
  /// or marks items as read) so the badge updates without waiting a minute.
  Future<void> refresh() => _tick();

  Future<void> _tick() async {
    if (_busy || _userId == null) return;
    _busy = true;
    try {
      final feed = await _repo.feed();
      lastFeed = feed.notifications;
      unreadCount.value = feed.unreadCount;

      final currentIds = feed.notifications.map((n) => n.id).toList();
      final stored = _cache.readStale(_seenKey);
      final seeded = stored is Map && stored['seeded'] == true;
      final seen = (stored is Map && stored['ids'] is List)
          ? (stored['ids'] as List).map((e) => e.toString()).toSet()
          : <String>{};

      // First run for this user on this device: seed silently so the existing
      // history doesn't fire a burst of notifications.
      if (!seeded) {
        await _cache.write(_seenKey, {'seeded': true, 'ids': currentIds});
        return;
      }

      final fresh =
          feed.notifications.where((n) => !seen.contains(n.id)).toList();
      for (final notification in fresh) {
        await _notif.show(
          id: notification.id.hashCode & 0x7fffffff,
          title: notification.title,
          body: notification.body,
        );
      }
      if (fresh.isNotEmpty || seen.length != currentIds.length) {
        await _cache.write(_seenKey, {'seeded': true, 'ids': currentIds});
      }
    } catch (e) {
      debugPrint('[app-notifier] tick failed: $e');
    } finally {
      _busy = false;
    }
  }
}
