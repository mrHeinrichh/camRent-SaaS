import 'dart:async';

import 'package:flutter/foundation.dart';

import '../../data/repositories/owner_repository.dart';
import '../storage/cache_service.dart';
import '../utils/currency.dart';
import 'notification_service.dart';

/// While a store owner is logged in, periodically checks for newly submitted
/// rental applications and fires a local notification for each new one.
///
/// Note: this runs while the app is open (foreground or recently active). True
/// background/push delivery would require FCM + server integration.
class OwnerNotifier {
  OwnerNotifier(this._owner, this._notif, this._cache);

  final OwnerRepository _owner;
  final NotificationService _notif;
  final CacheService _cache;

  static const Duration _interval = Duration(seconds: 60);

  Timer? _timer;
  String? _ownerId;
  bool _busy = false;

  String get _seenKey => 'owner_seen_app_ids_${_ownerId ?? 'anon'}';

  Future<void> start(String ownerId) async {
    if (_timer != null && _ownerId == ownerId) return;
    stop();
    _ownerId = ownerId;
    await _notif.init();
    await _notif.requestPermission();
    await _tick(); // seed / initial check
    _timer = Timer.periodic(_interval, (_) => _tick());
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
    _ownerId = null;
  }

  Future<void> _tick() async {
    if (_busy) return;
    _busy = true;
    try {
      final apps = await _owner.applications(forceRefresh: true);
      final currentIds = apps.map((a) => a.id).toList();

      final stored = _cache.readStale(_seenKey);
      final seeded = stored is Map && stored['seeded'] == true;
      final seen = (stored is Map && stored['ids'] is List)
          ? (stored['ids'] as List).map((e) => e.toString()).toSet()
          : <String>{};

      // First run for this owner on this device: seed silently so existing
      // applications don't all fire notifications.
      if (!seeded) {
        await _cache.write(_seenKey, {'seeded': true, 'ids': currentIds});
        return;
      }

      final newOnes = apps.where((a) => !seen.contains(a.id)).toList();
      for (final app in newOnes) {
        await _notif.show(
          id: app.id.hashCode & 0x7fffffff,
          title: 'New rental application',
          body:
              '${app.renterName} applied to rent · ${formatPHP(app.totalAmount)}',
        );
      }
      if (newOnes.isNotEmpty || seen.length != currentIds.length) {
        await _cache.write(_seenKey, {'seeded': true, 'ids': currentIds});
      }
    } catch (e) {
      debugPrint('[owner-notifier] tick failed: $e');
    } finally {
      _busy = false;
    }
  }
}
