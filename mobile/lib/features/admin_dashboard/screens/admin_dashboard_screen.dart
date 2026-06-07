import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../core/di/service_locator.dart';
import '../../../core/utils/currency.dart';
import '../../../core/utils/date_utils.dart';
import '../../../core/widgets/animations.dart';
import '../../../core/widgets/app_widgets.dart';
import '../../../data/models/content.dart';
import '../../../data/models/store.dart';
import '../../../data/repositories/admin_repository.dart';
import '../../auth/cubit/auth_cubit.dart';
import '../bloc/admin_cubit.dart';
import 'admin_sheets.dart';

class AdminDashboardScreen extends StatelessWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => AdminCubit(sl<AdminRepository>())..load(),
      child: DefaultTabController(
        length: 7,
        child: Scaffold(
          appBar: AppBar(
            title: const Text('Admin console'),
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
                Tab(icon: Icon(Icons.storefront_outlined), text: 'Stores'),
                Tab(icon: Icon(Icons.people_outline), text: 'Customers'),
                Tab(icon: Icon(Icons.shield_outlined), text: 'Fraud'),
                Tab(icon: Icon(Icons.support_agent), text: 'Support'),
                Tab(icon: Icon(Icons.campaign_outlined), text: 'Announcements'),
                Tab(icon: Icon(Icons.tune), text: 'Content'),
              ],
            ),
          ),
          body: BlocConsumer<AdminCubit, AdminState>(
            listenWhen: (p, c) => p.error != c.error && c.error != null,
            listener: (context, state) =>
                showSnack(context, state.error!, error: true),
            builder: (context, state) {
              if (state.status == AdminStatus.loading) {
                return const LoadingView();
              }
              if (state.status == AdminStatus.error) {
                return ErrorView(
                  message: state.error ?? 'Failed to load',
                  onRetry: () => context.read<AdminCubit>().load(),
                );
              }
              return TabBarView(
                children: [
                  EntranceEffect(child: _OverviewTab(state: state)),
                  EntranceEffect(child: _StoresTab(state: state)),
                  EntranceEffect(child: _CustomersTab(state: state)),
                  EntranceEffect(child: _FraudTab(state: state)),
                  EntranceEffect(child: _SupportTab(state: state)),
                  EntranceEffect(child: _AnnouncementsTab(state: state)),
                  EntranceEffect(child: _ContentTab(state: state)),
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
  final AdminState state;

  @override
  Widget build(BuildContext context) {
    final s = state.dashboard!.summary;
    final d = state.dashboard!;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.5,
          children: [
            _stat('Total income', formatPHP(s?.totalIncome ?? 0),
                Icons.payments_outlined),
            _stat('Assets value', formatPHP(s?.totalAssetsValue ?? 0),
                Icons.inventory_2_outlined),
            _stat('Customers', '${s?.totalCustomers ?? 0}',
                Icons.people_outline),
            _stat('Stores', '${s?.totalStores ?? d.allStores.length}',
                Icons.storefront_outlined),
            _stat('Pending merchants',
                '${s?.pendingMerchants ?? d.pendingStores.length}',
                Icons.pending_actions),
            _stat('Open tickets', '${s?.openSupportTickets ?? 0}',
                Icons.support_agent),
          ],
        ),
        const SizedBox(height: 16),
        if (d.storeInsights.isNotEmpty) ...[
          const Text('Top stores',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          ...d.storeInsights.take(8).map((i) => Card(
                child: ListTile(
                  title: Text(i.storeName),
                  subtitle: Text(
                      'Income ${formatPHP(i.income)} · ${i.assetsCount} gear · ${i.customersCount} customers'),
                  trailing: i.averageRating == null
                      ? null
                      : Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.star,
                                size: 14, color: AppColors.accent),
                            Text(i.averageRating!.toStringAsFixed(1)),
                          ],
                        ),
                ),
              )),
        ],
      ],
    );
  }

  Widget _stat(String label, String value, IconData icon) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surfaceSoft,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: AppColors.accent),
            const SizedBox(height: 8),
            Text(value,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text(label,
                style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
          ],
        ),
      );
}

class _StoresTab extends StatelessWidget {
  const _StoresTab({required this.state});
  final AdminState state;

  @override
  Widget build(BuildContext context) {
    final pending = state.dashboard!.pendingStores;
    final all = state.dashboard!.allStores;
    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        if (pending.isNotEmpty) ...[
          const Text('Pending approval',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          ...pending.map((s) => _storeCard(context, s, pending: true)),
          const SizedBox(height: 16),
        ],
        const Text('All stores',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 8),
        if (all.isEmpty)
          const EmptyState(title: 'No stores', icon: Icons.storefront_outlined)
        else
          ...all.map((s) => _storeCard(context, s)),
      ],
    );
  }

  Widget _storeCard(BuildContext context, Store store, {bool pending = false}) {
    final cubit = context.read<AdminCubit>();
    return Card(
      child: ListTile(
        leading: RemoteImage(
          url: store.logoUrl,
          width: 44,
          height: 44,
          borderRadius: BorderRadius.circular(22),
        ),
        title: Text(store.name),
        subtitle: Text(store.address,
            maxLines: 1, overflow: TextOverflow.ellipsis),
        trailing: pending
            ? FilledButton(
                onPressed: () async {
                  await cubit.approveStore(store.id);
                  if (context.mounted) showSnack(context, 'Store approved');
                },
                child: const Text('Approve'),
              )
            : PopupMenuButton<String>(
                onSelected: (v) async {
                  if (v == 'approve') {
                    await cubit.approveStore(store.id);
                  } else if (v == 'activate') {
                    await cubit.setStoreActive(store.id, true);
                  } else if (v == 'suspend') {
                    await cubit.setStoreActive(store.id, false);
                  } else if (v == 'delete') {
                    final pw = await askAdminPassword(
                        context, 'Delete "${store.name}"');
                    if (pw == null || pw.isEmpty) return;
                    try {
                      await cubit.deleteStore(store.id, pw);
                      if (context.mounted) showSnack(context, 'Store deleted');
                    } catch (e) {
                      if (context.mounted) {
                        showSnack(context, '$e', error: true);
                      }
                    }
                  }
                },
                itemBuilder: (_) => [
                  if (store.status != 'approved')
                    const PopupMenuItem(value: 'approve', child: Text('Approve')),
                  if (store.isActive)
                    const PopupMenuItem(value: 'suspend', child: Text('Suspend'))
                  else
                    const PopupMenuItem(
                        value: 'activate', child: Text('Activate')),
                  const PopupMenuItem(
                      value: 'delete', child: Text('Delete store')),
                ],
                child: StatusBadge(store.isActive ? store.status : 'suspended',
                    color: store.isActive
                        ? statusColor(store.status)
                        : AppColors.danger),
              ),
      ),
    );
  }
}

class _CustomersTab extends StatelessWidget {
  const _CustomersTab({required this.state});
  final AdminState state;

  @override
  Widget build(BuildContext context) {
    final customers = state.dashboard!.customerInsights;
    final cubit = context.read<AdminCubit>();
    if (customers.isEmpty) {
      return const EmptyState(
          title: 'No customers yet', icon: Icons.people_outline);
    }
    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: customers.length,
      itemBuilder: (context, index) {
        final c = customers[index];
        return Card(
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: AppColors.surface,
              child: Text(c.fullName.isEmpty ? '?' : c.fullName[0]),
            ),
            title: Text(c.fullName),
            subtitle: Text(
                '${c.email}\n${c.transactionCount} rentals · ${formatPHP(c.totalSpent)} spent'),
            isThreeLine: true,
            trailing: PopupMenuButton<String>(
              onSelected: (v) async {
                if (v == 'toggle') {
                  await cubit.setCustomerActive(c.customerId, !c.isActive);
                } else if (v == 'delete') {
                  final pw = await askAdminPassword(
                      context, 'Delete "${c.fullName}"');
                  if (pw == null || pw.isEmpty) return;
                  try {
                    await cubit.deleteUser(c.customerId, pw);
                    if (context.mounted) showSnack(context, 'Customer deleted');
                  } catch (e) {
                    if (context.mounted) showSnack(context, '$e', error: true);
                  }
                }
              },
              itemBuilder: (_) => [
                PopupMenuItem(
                    value: 'toggle',
                    child: Text(c.isActive ? 'Disable' : 'Enable')),
                const PopupMenuItem(value: 'delete', child: Text('Delete')),
              ],
              child: StatusBadge(
                c.isActive ? 'Active' : 'Disabled',
                color: c.isActive ? AppColors.success : AppColors.danger,
              ),
            ),
          ),
        );
      },
    );
  }
}

class _FraudTab extends StatelessWidget {
  const _FraudTab({required this.state});
  final AdminState state;

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<AdminCubit>();
    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => showFraudEditor(context, cubit: cubit),
        icon: const Icon(Icons.add),
        label: const Text('Add entry'),
      ),
      body: state.fraudList.isEmpty
          ? const EmptyState(
              title: 'No fraud reports', icon: Icons.shield_outlined)
          : ListView.builder(
              padding: const EdgeInsets.fromLTRB(12, 12, 12, 88),
              itemCount: state.fraudList.length,
              itemBuilder: (context, index) {
                final f = state.fraudList[index];
                final pendingGlobal =
                    f.scope == 'global' && f.status == 'pending';
                return Card(
                  child: ListTile(
                    leading: const Icon(Icons.warning_amber_rounded,
                        color: AppColors.danger),
                    title: Text(f.fullName),
                    subtitle: Text(
                        '${f.email} · ${f.contactNumber}\nReason: ${f.reason}'),
                    isThreeLine: true,
                    trailing: PopupMenuButton<String>(
                      onSelected: (v) async {
                        if (v == 'edit') {
                          showFraudEditor(context, cubit: cubit, existing: f);
                        } else if (v == 'delete') {
                          await cubit.deleteFraud(f.id);
                        } else if (v == 'approve_global') {
                          await cubit.approveGlobalFraud(f.id);
                        } else if (v == 'globalize') {
                          await cubit.globalizeFraud(f.id);
                        }
                      },
                      itemBuilder: (_) => [
                        const PopupMenuItem(value: 'edit', child: Text('Edit')),
                        if (pendingGlobal)
                          const PopupMenuItem(
                              value: 'approve_global',
                              child: Text('Approve global')),
                        if (f.scope != 'global')
                          const PopupMenuItem(
                              value: 'globalize', child: Text('Make global')),
                        const PopupMenuItem(
                            value: 'delete', child: Text('Delete')),
                      ],
                      child: StatusBadge(
                        (f.scope ?? 'internal').toUpperCase() +
                            (pendingGlobal ? ' • PENDING' : ''),
                        color: pendingGlobal
                            ? AppColors.warning
                            : (f.scope == 'global'
                                ? AppColors.danger
                                : AppColors.textMuted),
                      ),
                    ),
                  ),
                );
              },
            ),
    );
  }
}

class _SupportTab extends StatelessWidget {
  const _SupportTab({required this.state});
  final AdminState state;

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<AdminCubit>();
    if (state.supportTickets.isEmpty) {
      return const EmptyState(
          title: 'No support tickets', icon: Icons.support_agent);
    }
    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: state.supportTickets.length,
      itemBuilder: (context, index) {
        final t = state.supportTickets[index];
        return Card(
          child: ListTile(
            title: Text(t.subject),
            subtitle: Text('${t.storeName ?? ''} · ${t.type}\n${t.message}',
                maxLines: 3, overflow: TextOverflow.ellipsis),
            isThreeLine: true,
            trailing: PopupMenuButton<String>(
              onSelected: (v) {
                if (v == 'reply') {
                  _reply(context, cubit, t.id, t.status);
                } else if (v == 'delete') {
                  cubit.deleteSupport(t.id);
                }
              },
              itemBuilder: (_) => [
                const PopupMenuItem(value: 'reply', child: Text('Reply')),
                const PopupMenuItem(value: 'delete', child: Text('Delete')),
              ],
              child: StatusBadge(t.status, color: statusColor(t.status)),
            ),
            onTap: () => _reply(context, cubit, t.id, t.status),
          ),
        );
      },
    );
  }

  void _reply(
      BuildContext context, AdminCubit cubit, String id, String currentStatus) {
    final reply = TextEditingController();
    String status = currentStatus;
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Reply to ticket'),
        content: StatefulBuilder(
          builder: (context, setState) => Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                  controller: reply,
                  maxLines: 3,
                  decoration: const InputDecoration(labelText: 'Reply')),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                initialValue:
                    ['open', 'in_progress', 'resolved', 'closed'].contains(status)
                        ? status
                        : 'open',
                decoration: const InputDecoration(labelText: 'Status'),
                items: const [
                  DropdownMenuItem(value: 'open', child: Text('Open')),
                  DropdownMenuItem(
                      value: 'in_progress', child: Text('In progress')),
                  DropdownMenuItem(value: 'resolved', child: Text('Resolved')),
                  DropdownMenuItem(value: 'closed', child: Text('Closed')),
                ],
                onChanged: (v) => setState(() => status = v ?? status),
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
              await cubit.replySupport(id, reply.text.trim(), status);
            },
            child: const Text('Send'),
          ),
        ],
      ),
    );
  }
}

class _AnnouncementsTab extends StatelessWidget {
  const _AnnouncementsTab({required this.state});
  final AdminState state;

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<AdminCubit>();
    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => showAnnouncementEditor(context, cubit: cubit),
        icon: const Icon(Icons.add),
        label: const Text('New'),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 88),
        children: [
          Card(
            child: SwitchListTile(
              title: const Text('Announcements enabled'),
              subtitle: const Text('Master toggle for the homepage banner'),
              value: state.announcementsEnabled,
              activeThumbColor: AppColors.accent,
              onChanged: (v) => cubit.setAnnouncementsEnabled(v),
            ),
          ),
          const SizedBox(height: 8),
          if (state.announcements.isEmpty)
            const Padding(
              padding: EdgeInsets.all(24),
              child: EmptyState(
                  title: 'No announcements', icon: Icons.campaign_outlined),
            )
          else
            ...state.announcements.map((a) => Card(
                  child: ListTile(
                    leading: a.imageUrl == null || a.imageUrl!.isEmpty
                        ? const Icon(Icons.campaign_outlined)
                        : RemoteImage(
                            url: a.imageUrl,
                            width: 48,
                            height: 48,
                            borderRadius: BorderRadius.circular(8),
                          ),
                    title: Text(a.title.isEmpty ? '(no title)' : a.title),
                    subtitle: Text(a.description ?? '',
                        maxLines: 2, overflow: TextOverflow.ellipsis),
                    trailing: PopupMenuButton<String>(
                      onSelected: (v) {
                        if (v == 'edit') {
                          showAnnouncementEditor(context,
                              cubit: cubit, existing: a);
                        } else if (v == 'delete') {
                          cubit.deleteAnnouncement(a.id);
                        }
                      },
                      itemBuilder: (_) => [
                        const PopupMenuItem(value: 'edit', child: Text('Edit')),
                        const PopupMenuItem(
                            value: 'delete', child: Text('Delete')),
                      ],
                      child: StatusBadge(a.isActive ? 'Active' : 'Hidden',
                          color: a.isActive
                              ? AppColors.success
                              : AppColors.textMuted),
                    ),
                  ),
                )),
        ],
      ),
    );
  }
}

class _ContentTab extends StatelessWidget {
  const _ContentTab({required this.state});
  final AdminState state;

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<AdminCubit>();
    final donation = state.donationSettings ?? const DonationSettings();
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: ListTile(
            leading: const Icon(Icons.home_outlined, color: AppColors.accent),
            title: const Text('Home page content'),
            subtitle: const Text('Badge, title and subtitle'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => showSiteContentEditor(context, cubit: cubit),
          ),
        ),
        Card(
          child: ListTile(
            leading:
                const Icon(Icons.volunteer_activism_outlined, color: AppColors.accent),
            title: const Text('Donation settings'),
            subtitle: Text(
              donation.isActive ? 'Visible to users' : 'Hidden',
              style: TextStyle(
                  color: donation.isActive
                      ? AppColors.success
                      : AppColors.textMuted),
            ),
            trailing: const Icon(Icons.chevron_right),
            onTap: () =>
                showDonationEditor(context, cubit: cubit, settings: donation),
          ),
        ),
        Card(
          child: SwitchListTile(
            secondary:
                const Icon(Icons.campaign_outlined, color: AppColors.accent),
            title: const Text('Announcements enabled'),
            value: state.announcementsEnabled,
            activeThumbColor: AppColors.accent,
            onChanged: (v) => cubit.setAnnouncementsEnabled(v),
          ),
        ),
        const SizedBox(height: 12),
        Center(
          child: Text('Last refreshed ${prettyDateTime(DateTime.now().toIso8601String())}',
              style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
        ),
      ],
    );
  }
}
