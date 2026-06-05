import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../core/di/service_locator.dart';
import '../../../core/widgets/animations.dart';
import '../../../core/utils/currency.dart';
import '../../../core/utils/date_utils.dart';
import '../../../core/widgets/app_widgets.dart';
import '../../../data/repositories/owner_repository.dart';
import '../../auth/cubit/auth_cubit.dart';
import '../bloc/owner_cubit.dart';
import 'gear_editor_sheet.dart';
import 'store_profile_sheet.dart';

class OwnerDashboardScreen extends StatelessWidget {
  const OwnerDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => OwnerCubit(sl<OwnerRepository>())..load(),
      child: DefaultTabController(
        length: 5,
        child: Scaffold(
          appBar: AppBar(
            title: const Text('Store dashboard'),
            actions: [
              IconButton(
                icon: const Icon(Icons.logout),
                onPressed: () {
                  context.read<AuthCubit>().logout();
                  context.go('/');
                },
              ),
            ],
            bottom: const TabBar(
              isScrollable: true,
              tabs: [
                Tab(text: 'Overview'),
                Tab(text: 'Gear'),
                Tab(text: 'Applications'),
                Tab(text: 'Vouchers'),
                Tab(text: 'Support'),
              ],
            ),
          ),
          body: BlocBuilder<OwnerCubit, OwnerState>(
            builder: (context, state) {
              if (state.status == OwnerStatus.loading) {
                return const LoadingView();
              }
              if (state.status == OwnerStatus.error) {
                return ErrorView(
                  message: state.error ?? 'Failed to load dashboard',
                  onRetry: () => context.read<OwnerCubit>().load(),
                );
              }
              return TabBarView(
                children: [
                  EntranceEffect(child: _OverviewTab(state: state)),
                  EntranceEffect(child: _GearTab(state: state)),
                  EntranceEffect(child: _ApplicationsTab(state: state)),
                  EntranceEffect(child: _VouchersTab(state: state)),
                  EntranceEffect(child: _SupportTab(state: state)),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class _OverviewTab extends StatelessWidget {
  const _OverviewTab({required this.state});
  final OwnerState state;

  @override
  Widget build(BuildContext context) {
    final d = state.dashboard!;
    final analytics = d.analytics;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (d.store != null)
          Card(
            child: ListTile(
              leading: RemoteImage(
                url: d.store!.logoUrl,
                width: 44,
                height: 44,
                borderRadius: BorderRadius.circular(22),
              ),
              title: Text(d.store!.name),
              subtitle: Text('Status: ${d.store!.status}'),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  StatusBadge(d.store!.status,
                      color: statusColor(d.store!.status)),
                  IconButton(
                    tooltip: 'Edit store',
                    icon: const Icon(Icons.edit_outlined),
                    onPressed: () => showStoreProfileEditor(
                      context,
                      cubit: context.read<OwnerCubit>(),
                      store: d.store!,
                    ),
                  ),
                ],
              ),
            ),
          ),
        const SizedBox(height: 12),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.6,
          children: [
            _stat('Total rentals', '${d.totalRentals}', Icons.event_available),
            _stat('Revenue', formatPHP(d.totalRevenue), Icons.payments_outlined),
            _stat('Gear listed', '${d.items.length}', Icons.photo_camera),
            _stat('Pending', '${analytics?.pendingCount ?? 0}',
                Icons.hourglass_bottom),
          ],
        ),
        if (analytics != null && analytics.mostRentedCameras.isNotEmpty) ...[
          const SizedBox(height: 16),
          const Text('Most rented gear',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          ...analytics.mostRentedCameras.map((c) => ListTile(
                dense: true,
                leading: const Icon(Icons.trending_up),
                title: Text(c.name),
                trailing: Text('${c.count}×'),
              )),
        ],
        if (d.storeRatings.isNotEmpty) ...[
          const SizedBox(height: 16),
          const Text('Recent ratings',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          ...d.storeRatings.map((r) => Card(
                child: ListTile(
                  title: Text(r.renterName),
                  subtitle: Text(r.description),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.star, size: 14, color: AppColors.accent),
                      Text('${r.rating}'),
                    ],
                  ),
                ),
              )),
        ],
      ],
    );
  }

  Widget _stat(String label, String value, IconData icon) => Card(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: AppColors.accent),
              const SizedBox(height: 6),
              Text(value,
                  style: const TextStyle(
                      fontSize: 18, fontWeight: FontWeight.bold)),
              Text(label,
                  style: TextStyle(
                      color: AppColors.textMuted, fontSize: 12)),
            ],
          ),
        ),
      );
}

class _GearTab extends StatelessWidget {
  const _GearTab({required this.state});
  final OwnerState state;

  String? get _storeId => state.dashboard?.store?.id;

  @override
  Widget build(BuildContext context) {
    final items = state.dashboard!.items;
    final cubit = context.read<OwnerCubit>();
    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: _storeId == null
          ? null
          : FloatingActionButton.extended(
              onPressed: () =>
                  showGearEditor(context, cubit: cubit, storeId: _storeId!),
              icon: const Icon(Icons.add),
              label: const Text('Add gear'),
            ),
      body: items.isEmpty
          ? const EmptyState(
              title: 'No gear listed yet',
              message: 'Tap "Add gear" to list your first item.',
              icon: Icons.photo_camera_back_outlined,
            )
          : ListView.builder(
              padding: const EdgeInsets.fromLTRB(12, 12, 12, 88),
              itemCount: items.length,
              itemBuilder: (context, index) {
                final item = items[index];
                return EntranceEffect(
                  index: index % 8,
                  child: Card(
                    child: ListTile(
                      leading: RemoteImage(
                        url: item.imageUrl,
                        width: 48,
                        height: 48,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      title: Text(item.name),
                      subtitle: Text(
                          '${formatPHP(item.dailyPrice)}/day · stock ${item.stock ?? 0}'),
                      trailing: PopupMenuButton<String>(
                        onSelected: (v) {
                          if (v == 'edit') {
                            showGearEditor(context,
                                cubit: cubit,
                                storeId: _storeId ?? item.storeId,
                                existing: item);
                          } else if (v == 'delete') {
                            _confirmDelete(context, cubit, item.id, item.name);
                          }
                        },
                        itemBuilder: (_) => [
                          const PopupMenuItem(
                              value: 'edit',
                              child: ListTile(
                                  dense: true,
                                  leading: Icon(Icons.edit_outlined),
                                  title: Text('Edit'))),
                          const PopupMenuItem(
                              value: 'delete',
                              child: ListTile(
                                  dense: true,
                                  leading: Icon(Icons.delete_outline,
                                      color: AppColors.danger),
                                  title: Text('Delete'))),
                        ],
                        child: Padding(
                          padding: const EdgeInsets.all(6),
                          child: StatusBadge(
                            item.isAvailable ? 'Available' : 'Hidden',
                            color: item.isAvailable
                                ? AppColors.success
                                : AppColors.textMuted,
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
    );
  }

  void _confirmDelete(
      BuildContext context, OwnerCubit cubit, String id, String name) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Delete gear'),
        content: Text('Remove "$name"? This cannot be undone.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
            onPressed: () async {
              Navigator.pop(dialogContext);
              try {
                await cubit.deleteItem(id);
                if (context.mounted) showSnack(context, 'Gear deleted');
              } catch (e) {
                if (context.mounted) {
                  showSnack(context, 'Could not delete: $e', error: true);
                }
              }
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}

class _ApplicationsTab extends StatelessWidget {
  const _ApplicationsTab({required this.state});
  final OwnerState state;

  @override
  Widget build(BuildContext context) {
    if (state.applications.isEmpty) {
      return const EmptyState(
          title: 'No applications yet', icon: Icons.inbox_outlined);
    }
    return ListView.separated(
      padding: const EdgeInsets.all(12),
      itemCount: state.applications.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final app = state.applications[index];
        return EntranceEffect(
          index: index % 8,
          child: Card(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(app.renterName,
                          style:
                              const TextStyle(fontWeight: FontWeight.w700)),
                    ),
                    if (app.fraudFlag)
                      const StatusBadge('FRAUD', color: AppColors.danger),
                    const SizedBox(width: 6),
                    StatusBadge(app.status, color: statusColor(app.status)),
                  ],
                ),
                Text('${app.renterEmail} · ${app.renterPhone}',
                    style: TextStyle(
                        color: AppColors.textMuted, fontSize: 12)),
                const SizedBox(height: 6),
                ...app.items.map((it) => Text(
                      '• ${it.name} ×${it.quantity}  (${prettyDate(it.startDate)} → ${prettyDate(it.endDate)})',
                      style: const TextStyle(fontSize: 12),
                    )),
                const SizedBox(height: 6),
                Text('Total: ${formatPHP(app.totalAmount)}',
                    style: const TextStyle(
                        color: AppColors.accent, fontWeight: FontWeight.bold)),
                if (app.status.toUpperCase() == 'PENDING_REVIEW' ||
                    app.status.toUpperCase() == 'PENDING')
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton(
                        onPressed: () => _reject(context, app.id),
                        style: TextButton.styleFrom(
                            foregroundColor: AppColors.danger),
                        child: const Text('Reject'),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        onPressed: () async {
                          await context.read<OwnerCubit>().approve(app.id);
                          if (context.mounted) {
                            showSnack(context, 'Application approved');
                          }
                        },
                        child: const Text('Approve'),
                      ),
                    ],
                  ),
              ],
            ),
          ),
        ),
        );
      },
    );
  }

  void _reject(BuildContext context, String id) {
    final controller = TextEditingController();
    final cubit = context.read<OwnerCubit>();
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Reject application'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(labelText: 'Reason'),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(dialogContext);
              await cubit.reject(id, controller.text.trim());
            },
            child: const Text('Reject'),
          ),
        ],
      ),
    );
  }
}

class _VouchersTab extends StatelessWidget {
  const _VouchersTab({required this.state});
  final OwnerState state;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _create(context),
        icon: const Icon(Icons.add),
        label: const Text('New voucher'),
      ),
      body: state.vouchers.isEmpty
          ? const EmptyState(
              title: 'No vouchers', icon: Icons.local_offer_outlined)
          : ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: state.vouchers.length,
              itemBuilder: (context, index) {
                final v = state.vouchers[index];
                return Card(
                  child: ListTile(
                    leading: const Icon(Icons.local_offer_outlined),
                    title: Text(v.code),
                    subtitle: Text('Discount ${formatPHP(v.discountAmount)}'),
                    trailing: IconButton(
                      icon: const Icon(Icons.delete_outline,
                          color: AppColors.danger),
                      onPressed: () =>
                          context.read<OwnerCubit>().deleteVoucher(v.id),
                    ),
                  ),
                );
              },
            ),
    );
  }

  void _create(BuildContext context) {
    final code = TextEditingController();
    final discount = TextEditingController();
    final cubit = context.read<OwnerCubit>();
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Create voucher'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
                controller: code,
                decoration: const InputDecoration(labelText: 'Code')),
            const SizedBox(height: 8),
            TextField(
              controller: discount,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Discount amount'),
            ),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(dialogContext);
              await cubit.createVoucher(
                  code.text.trim().toUpperCase(),
                  double.tryParse(discount.text.trim()) ?? 0);
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }
}

class _SupportTab extends StatelessWidget {
  const _SupportTab({required this.state});
  final OwnerState state;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _create(context),
        icon: const Icon(Icons.support_agent),
        label: const Text('New ticket'),
      ),
      body: state.supportTickets.isEmpty
          ? const EmptyState(
              title: 'No support tickets', icon: Icons.support_agent)
          : ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: state.supportTickets.length,
              itemBuilder: (context, index) {
                final t = state.supportTickets[index];
                return Card(
                  child: ListTile(
                    title: Text(t.subject),
                    subtitle: Text(t.message,
                        maxLines: 2, overflow: TextOverflow.ellipsis),
                    trailing:
                        StatusBadge(t.status, color: statusColor(t.status)),
                  ),
                );
              },
            ),
    );
  }

  void _create(BuildContext context) {
    final subject = TextEditingController();
    final message = TextEditingController();
    String type = 'support';
    final cubit = context.read<OwnerCubit>();
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('New ticket'),
        content: StatefulBuilder(
          builder: (context, setState) => Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                initialValue: type,
                decoration: const InputDecoration(labelText: 'Type'),
                items: const [
                  DropdownMenuItem(value: 'support', child: Text('Support')),
                  DropdownMenuItem(value: 'feedback', child: Text('Feedback')),
                  DropdownMenuItem(value: 'bug', child: Text('Bug report')),
                ],
                onChanged: (v) => setState(() => type = v ?? type),
              ),
              const SizedBox(height: 8),
              TextField(
                  controller: subject,
                  decoration: const InputDecoration(labelText: 'Subject')),
              const SizedBox(height: 8),
              TextField(
                controller: message,
                maxLines: 3,
                decoration: const InputDecoration(labelText: 'Message'),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(dialogContext);
              await cubit.createSupportTicket({
                'type': type,
                'subject': subject.text.trim(),
                'message': message.text.trim(),
                'priority': 'medium',
              });
            },
            child: const Text('Submit'),
          ),
        ],
      ),
    );
  }
}
