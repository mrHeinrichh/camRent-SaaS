import 'package:flutter/material.dart';

import '../../../app/theme.dart';
import '../../../core/di/service_locator.dart';
import '../../../core/services/app_notifier.dart';
import '../../../core/widgets/app_widgets.dart';
import '../../../data/models/notification.dart';
import '../../../data/repositories/notification_repository.dart';

/// Notification inbox for the signed-in user (customer, merchant or admin):
/// booking activity, pickup/return reminders and platform alerts.
class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final NotificationRepository _repo = sl<NotificationRepository>();

  List<AppNotification> _items = const [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _items = sl<AppNotifier>().lastFeed;
    _loading = _items.isEmpty;
    _load();
  }

  Future<void> _load() async {
    try {
      final feed = await _repo.feed();
      if (!mounted) return;
      setState(() {
        _items = feed.notifications;
        _loading = false;
        _error = null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        if (_items.isEmpty) _error = 'Could not load notifications';
      });
    }
  }

  Future<void> _markAllRead() async {
    try {
      await _repo.markAllRead();
      await _load();
      await sl<AppNotifier>().refresh();
    } catch (_) {
      if (mounted) showSnack(context, 'Failed to update', error: true);
    }
  }

  Future<void> _markRead(AppNotification notification) async {
    if (notification.read) return;
    try {
      await _repo.markRead(notification.id);
      await _load();
      await sl<AppNotifier>().refresh();
    } catch (_) {
      // Non-critical; the item stays unread.
    }
  }

  IconData _iconFor(String type) {
    switch (type) {
      case 'booking_submitted':
      case 'booking_received':
        return Icons.event_available_outlined;
      case 'booking_approved':
        return Icons.check_circle_outline;
      case 'booking_rejected':
      case 'booking_cancelled':
        return Icons.cancel_outlined;
      case 'booking_completed':
        return Icons.task_alt_outlined;
      case 'pickup_reminder':
        return Icons.alarm_outlined;
      case 'return_reminder':
        return Icons.assignment_return_outlined;
      case 'return_overdue':
        return Icons.warning_amber_outlined;
      case 'fraud_alert':
      case 'fraud_reported':
        return Icons.shield_outlined;
      case 'store_review':
        return Icons.star_outline;
      case 'store_approved':
      case 'store_activated':
      case 'store_registered':
        return Icons.storefront_outlined;
      case 'store_deactivated':
      case 'store_report':
        return Icons.report_gmailerrorred_outlined;
      case 'support_ticket':
      case 'support_reply':
        return Icons.support_agent_outlined;
      default:
        return Icons.notifications_outlined;
    }
  }

  String _relativeTime(DateTime? time) {
    if (time == null) return '';
    final diff = DateTime.now().difference(time.toLocal());
    if (diff.inMinutes < 1) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${time.toLocal().year}-${time.toLocal().month.toString().padLeft(2, '0')}-${time.toLocal().day.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final hasUnread = _items.any((n) => !n.read);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (hasUnread)
            TextButton(
              onPressed: _markAllRead,
              child: const Text('Mark all read'),
            ),
        ],
      ),
      body: _loading
          ? const LoadingView()
          : _error != null
              ? ErrorView(message: _error!, onRetry: _load)
              : _items.isEmpty
                  ? const EmptyState(
                      icon: Icons.notifications_none,
                      title: 'No notifications yet',
                      message:
                          'Booking updates and reminders will appear here.',
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.separated(
                        physics: const AlwaysScrollableScrollPhysics(),
                        itemCount: _items.length,
                        separatorBuilder: (_, __) =>
                            Divider(height: 1, color: AppColors.border),
                        itemBuilder: (context, index) {
                          final notification = _items[index];
                          return ListTile(
                            onTap: () => _markRead(notification),
                            tileColor: notification.read
                                ? null
                                : AppColors.accent.withValues(alpha: 0.08),
                            leading: CircleAvatar(
                              backgroundColor:
                                  AppColors.accent.withValues(alpha: 0.15),
                              child: Icon(_iconFor(notification.type),
                                  color: AppColors.accent, size: 20),
                            ),
                            title: Text(
                              notification.title,
                              style: TextStyle(
                                fontWeight: notification.read
                                    ? FontWeight.w500
                                    : FontWeight.w700,
                              ),
                            ),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if (notification.body.isNotEmpty)
                                  Text(notification.body),
                                const SizedBox(height: 2),
                                Text(
                                  _relativeTime(notification.createdAt),
                                  style: TextStyle(
                                      fontSize: 11,
                                      color: AppColors.textMuted),
                                ),
                              ],
                            ),
                            trailing: notification.read
                                ? null
                                : Container(
                                    width: 10,
                                    height: 10,
                                    decoration: const BoxDecoration(
                                      color: AppColors.accent,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                          );
                        },
                      ),
                    ),
    );
  }
}
