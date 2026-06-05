import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../core/di/service_locator.dart';
import '../../../core/widgets/animations.dart';
import '../../../core/utils/currency.dart';
import '../../../core/widgets/app_widgets.dart';
import '../../../data/models/store.dart';
import '../../../data/repositories/admin_repository.dart';
import '../../auth/cubit/auth_cubit.dart';
import '../bloc/admin_cubit.dart';

class AdminDashboardScreen extends StatelessWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => AdminCubit(sl<AdminRepository>())..load(),
      child: DefaultTabController(
        length: 5,
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
                Tab(text: 'Overview'),
                Tab(text: 'Stores'),
                Tab(text: 'Customers'),
                Tab(text: 'Fraud'),
                Tab(text: 'Support'),
              ],
            ),
          ),
          body: BlocBuilder<AdminCubit, AdminState>(
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
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.6,
          children: [
            _stat('Total income', formatPHP(s?.totalIncome ?? 0),
                Icons.payments_outlined),
            _stat('Assets value', formatPHP(s?.totalAssetsValue ?? 0),
                Icons.inventory_2_outlined),
            _stat('Customers', '${s?.totalCustomers ?? 0}',
                Icons.people_outline),
            _stat('Stores', '${s?.totalStores ?? state.dashboard!.allStores.length}',
                Icons.storefront_outlined),
            _stat('Pending merchants', '${s?.pendingMerchants ?? state.dashboard!.pendingStores.length}',
                Icons.pending_actions),
            _stat('Open tickets', '${s?.openSupportTickets ?? 0}',
                Icons.support_agent),
          ],
        ),
        const SizedBox(height: 16),
        if (state.dashboard!.storeInsights.isNotEmpty) ...[
          const Text('Top stores',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          ...state.dashboard!.storeInsights.take(8).map((i) => Card(
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
                      fontSize: 16, fontWeight: FontWeight.bold)),
              Text(label,
                  style: const TextStyle(
                      color: AppColors.textMuted, fontSize: 12)),
            ],
          ),
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
          ...pending.map((store) => _storeCard(context, store, pending: true)),
          const SizedBox(height: 16),
        ],
        const Text('All stores',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 8),
        if (all.isEmpty)
          const EmptyState(title: 'No stores', icon: Icons.storefront_outlined)
        else
          ...all.map((store) => _storeCard(context, store)),
      ],
    );
  }

  Widget _storeCard(BuildContext context, Store store, {bool pending = false}) {
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
            ? Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    icon: const Icon(Icons.check_circle,
                        color: AppColors.success),
                    onPressed: () =>
                        context.read<AdminCubit>().approveStore(store.id),
                  ),
                ],
              )
            : PopupMenuButton<String>(
                onSelected: (v) {
                  if (v == 'suspend') {
                    context.read<AdminCubit>().suspendStore(store.id);
                  } else if (v == 'approve') {
                    context.read<AdminCubit>().approveStore(store.id);
                  }
                },
                itemBuilder: (_) => [
                  if (store.status != 'approved')
                    const PopupMenuItem(
                        value: 'approve', child: Text('Approve')),
                  if (store.status != 'suspended')
                    const PopupMenuItem(
                        value: 'suspend', child: Text('Suspend')),
                ],
                child: StatusBadge(store.status,
                    color: statusColor(store.status)),
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
              backgroundColor: AppColors.surfaceSoft,
              child: Text(c.fullName.isEmpty ? '?' : c.fullName[0]),
            ),
            title: Text(c.fullName),
            subtitle: Text(
                '${c.email}\n${c.transactionCount} rentals · ${formatPHP(c.totalSpent)} spent'),
            isThreeLine: true,
            trailing: StatusBadge(
              c.isActive ? 'Active' : 'Disabled',
              color: c.isActive ? AppColors.success : AppColors.danger,
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
    if (state.fraudList.isEmpty) {
      return const EmptyState(
          title: 'No fraud reports', icon: Icons.shield_outlined);
    }
    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: state.fraudList.length,
      itemBuilder: (context, index) {
        final f = state.fraudList[index];
        return Card(
          child: ListTile(
            leading: const Icon(Icons.warning_amber_rounded,
                color: AppColors.danger),
            title: Text(f.fullName),
            subtitle: Text(
                '${f.email} · ${f.contactNumber}\nReason: ${f.reason}'),
            isThreeLine: true,
            trailing: f.scope == null
                ? null
                : StatusBadge(f.scope!.toUpperCase(),
                    color: f.scope == 'global'
                        ? AppColors.danger
                        : AppColors.warning),
          ),
        );
      },
    );
  }
}

class _SupportTab extends StatelessWidget {
  const _SupportTab({required this.state});
  final AdminState state;

  @override
  Widget build(BuildContext context) {
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
            subtitle: Text(
                '${t.storeName ?? ''} · ${t.type}\n${t.message}',
                maxLines: 3,
                overflow: TextOverflow.ellipsis),
            isThreeLine: true,
            trailing: StatusBadge(t.status, color: statusColor(t.status)),
            onTap: () => _reply(context, t.id, t.status),
          ),
        );
      },
    );
  }

  void _reply(BuildContext context, String id, String currentStatus) {
    final reply = TextEditingController();
    String status = currentStatus;
    final cubit = context.read<AdminCubit>();
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
                decoration: const InputDecoration(labelText: 'Reply'),
              ),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                initialValue: ['open', 'in_progress', 'resolved', 'closed']
                        .contains(status)
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
