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
import 'owner_calendar_tab.dart';
import 'owner_charts.dart';
import 'owner_detail_sheets.dart';
import 'owner_form_builder_tab.dart';
import 'owner_simple_tabs.dart';
import 'store_profile_header.dart';

class OwnerDashboardScreen extends StatelessWidget {
  const OwnerDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => OwnerCubit(sl<OwnerRepository>())..load(),
      child: DefaultTabController(
        length: 10,
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
                Tab(icon: Icon(Icons.dashboard_outlined), text: 'Overview'),
                Tab(icon: Icon(Icons.inbox_outlined), text: 'Applications'),
                Tab(icon: Icon(Icons.photo_camera_outlined), text: 'Inventory'),
                Tab(icon: Icon(Icons.calendar_month_outlined), text: 'Calendar'),
                Tab(icon: Icon(Icons.people_outline), text: 'Customers'),
                Tab(icon: Icon(Icons.receipt_long_outlined), text: 'Transactions'),
                Tab(icon: Icon(Icons.tune), text: 'Form Builder'),
                Tab(icon: Icon(Icons.shield_outlined), text: 'Fraud List'),
                Tab(icon: Icon(Icons.support_agent), text: 'Support'),
                Tab(icon: Icon(Icons.local_offer_outlined), text: 'Vouchers'),
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
                  EntranceEffect(child: _ApplicationsTab(state: state)),
                  EntranceEffect(child: _GearTab(state: state)),
                  EntranceEffect(child: OwnerCalendarTab(state: state)),
                  EntranceEffect(child: OwnerCustomersTab(state: state)),
                  EntranceEffect(child: OwnerTransactionsTab(state: state)),
                  EntranceEffect(child: OwnerFormBuilderTab(state: state)),
                  EntranceEffect(child: OwnerFraudTab(state: state)),
                  EntranceEffect(child: _SupportTab(state: state)),
                  EntranceEffect(child: _VouchersTab(state: state)),
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
    final peak = analytics?.peakRentalDates ?? const [];
    final gear = analytics?.mostRentedCameras ?? const [];
    final renters = analytics?.topRenters ?? const [];
    final peakMax = peak.isEmpty ? 1 : peak.first.count;
    final gearMax = gear.isEmpty
        ? 1
        : gear.map((e) => e.count).reduce((a, b) => a > b ? a : b);
    final renterMax = renters.isEmpty
        ? 1
        : renters.map((e) => e.rentals).reduce((a, b) => a > b ? a : b);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (d.store != null)
          StoreProfileHeader(
            store: d.store!,
            cubit: context.read<OwnerCubit>(),
          ),
        const SizedBox(height: 12),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.5,
          children: [
            StatTile(
                label: 'Total rentals',
                value: '${d.totalRentals}',
                icon: Icons.event_available),
            StatTile(
                label: 'Revenue',
                value: formatPHP(d.totalRevenue),
                icon: Icons.payments_outlined,
                color: AppColors.success),
            StatTile(
                label: 'Gear listed',
                value: '${d.items.length}',
                icon: Icons.photo_camera),
            StatTile(
                label: 'Pending',
                value: '${analytics?.pendingCount ?? 0}',
                icon: Icons.hourglass_bottom,
                color: AppColors.warning),
            StatTile(
                label: 'Reserved',
                value: '${analytics?.reservedCount ?? 0}',
                icon: Icons.bookmark_added_outlined),
            StatTile(
                label: 'Customers',
                value: '${analytics?.totalCustomers ?? d.customers.length}',
                icon: Icons.people_outline),
          ],
        ),
        const SizedBox(height: 16),
        ChartCard(
          title: 'Peak rental dates',
          icon: Icons.calendar_month_outlined,
          child: peak.isEmpty
              ? _empty('No peak date data yet.')
              : Column(
                  children: peak
                      .take(7)
                      .map((e) => BarRow(
                            label: prettyDate(e.date),
                            value: '${e.count}',
                            fraction: e.count / peakMax,
                          ))
                      .toList(),
                ),
        ),
        ChartCard(
          title: 'Most rented gear',
          icon: Icons.trending_up,
          child: gear.isEmpty
              ? _empty('No rental data yet.')
              : Column(
                  children: gear
                      .take(6)
                      .map((e) => BarRow(
                            label: e.name,
                            value: '${e.count}×',
                            fraction: e.count / gearMax,
                            color: AppColors.success,
                          ))
                      .toList(),
                ),
        ),
        ChartCard(
          title: 'Top renters this month',
          icon: Icons.workspace_premium_outlined,
          child: renters.isEmpty
              ? _empty('No top renter data this month yet.')
              : Column(
                  children: renters
                      .take(6)
                      .map((e) => BarRow(
                            label: e.name,
                            sublabel: e.email,
                            value: '${e.rentals} • ${formatPHP(e.amount)}',
                            fraction: e.rentals / renterMax,
                            color: const Color(0xFF6366F1),
                          ))
                      .toList(),
                ),
        ),
        if (d.storeRatings.isNotEmpty)
          ChartCard(
            title: 'Recent ratings',
            icon: Icons.star_outline,
            child: Column(
              children: d.storeRatings
                  .take(5)
                  .map((r) => ListTile(
                        contentPadding: EdgeInsets.zero,
                        dense: true,
                        title: Text(r.renterName),
                        subtitle: r.description.isEmpty
                            ? null
                            : Text(r.description),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.star,
                                size: 14, color: AppColors.accent),
                            Text('${r.rating}'),
                          ],
                        ),
                      ))
                  .toList(),
            ),
          ),
      ],
    );
  }

  Widget _empty(String msg) => Text(msg,
      style: TextStyle(color: AppColors.textMuted, fontSize: 13));
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
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          StatusBadge(
                            item.isAvailable ? 'Available' : 'Hidden',
                            color: item.isAvailable
                                ? AppColors.success
                                : AppColors.textMuted,
                          ),
                          IconButton(
                            tooltip: 'Edit',
                            icon: const Icon(Icons.edit_outlined, size: 20),
                            onPressed: () => showGearEditor(context,
                                cubit: cubit,
                                storeId: _storeId ?? item.storeId,
                                existing: item),
                          ),
                          IconButton(
                            tooltip: 'Delete',
                            icon: const Icon(Icons.delete_outline,
                                size: 20, color: AppColors.danger),
                            onPressed: () =>
                                _confirmDelete(context, cubit, item.id, item.name),
                          ),
                        ],
                      ),
                      onTap: () => showGearEditor(context,
                          cubit: cubit,
                          storeId: _storeId ?? item.storeId,
                          existing: item),
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
          child: InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: () => showApplicationDetail(context,
                app: app, cubit: context.read<OwnerCubit>()),
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
