import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../core/di/service_locator.dart';
import '../../../core/widgets/animations.dart';
import '../../../core/utils/currency.dart';
import '../../../core/utils/date_utils.dart';
import '../../../core/widgets/app_widgets.dart';
import '../../../data/models/order.dart';
import '../../../data/repositories/order_repository.dart';
import '../../auth/cubit/auth_cubit.dart';
import '../bloc/account_cubit.dart';

class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => AccountCubit(sl<OrderRepository>())..load(),
      child: Scaffold(
        appBar: AppBar(
          title: const Text('My account'),
          actions: [
            IconButton(
              tooltip: 'Sign out',
              icon: const Icon(Icons.logout),
              onPressed: () {
                context.read<AuthCubit>().logout();
                context.go('/');
              },
            ),
          ],
        ),
        body: Column(
          children: [
            const _ProfileHeader(),
            const Divider(height: 1),
            Expanded(
              child: BlocBuilder<AccountCubit, AccountState>(
                builder: (context, state) {
                  if (state.status == AccountStatus.loading) {
                    return const LoadingView();
                  }
                  if (state.status == AccountStatus.error) {
                    return ErrorView(
                      message: state.error ?? 'Failed to load orders',
                      onRetry: () => context.read<AccountCubit>().load(),
                    );
                  }
                  if (state.orders.isEmpty) {
                    return const EmptyState(
                      icon: Icons.receipt_long_outlined,
                      title: 'No rentals yet',
                      message: 'Your rental applications will appear here.',
                    );
                  }
                  return RefreshIndicator(
                    onRefresh: () => context.read<AccountCubit>().load(),
                    child: ListView.separated(
                      padding: const EdgeInsets.all(12),
                      itemCount: state.orders.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (context, index) => EntranceEffect(
                        index: index % 8,
                        child: _OrderCard(order: state.orders[index]),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader();

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthCubit>().state.user;
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          RemoteImage(
            url: user?.avatarUrl,
            width: 52,
            height: 52,
            borderRadius: BorderRadius.circular(26),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(user?.fullName ?? 'Guest',
                    style: const TextStyle(
                        fontSize: 16, fontWeight: FontWeight.bold)),
                Text(user?.email ?? '',
                    style: TextStyle(color: AppColors.textMuted)),
              ],
            ),
          ),
          StatusBadge((user?.role.name ?? 'guest').toUpperCase()),
        ],
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  const _OrderCard({required this.order});
  final OrderHistory order;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ExpansionTile(
        shape: const Border(),
        title: Text(order.storeName,
            style: const TextStyle(fontWeight: FontWeight.w700)),
        subtitle: Text(prettyDateTime(order.createdAt),
            style: const TextStyle(fontSize: 12)),
        trailing: StatusBadge(order.status, color: statusColor(order.status)),
        childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        children: [
          ...order.items.map(
            (it) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                children: [
                  RemoteImage(
                    url: it.imageUrl,
                    width: 40,
                    height: 40,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(it.name,
                            style:
                                const TextStyle(fontWeight: FontWeight.w600)),
                        Text(
                          '${prettyDate(it.startDate)} → ${prettyDate(it.endDate)} ×${it.quantity}',
                          style: TextStyle(
                              color: AppColors.textMuted, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const Divider(),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Total'),
              Text(formatPHP(order.totalAmount),
                  style: const TextStyle(
                      fontWeight: FontWeight.bold, color: AppColors.accent)),
            ],
          ),
          if (order.cancellationReason != null &&
              order.cancellationReason!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text('Cancelled: ${order.cancellationReason}',
                  style: const TextStyle(
                      color: AppColors.danger, fontSize: 12)),
            ),
          if (_canCancel(order.status))
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                icon: const Icon(Icons.cancel_outlined, size: 18),
                label: const Text('Cancel'),
                style: TextButton.styleFrom(foregroundColor: AppColors.danger),
                onPressed: () => _confirmCancel(context, order),
              ),
            ),
        ],
      ),
    );
  }

  bool _canCancel(String status) =>
      status.toUpperCase() == 'PENDING_REVIEW' ||
      status.toUpperCase() == 'PENDING';

  void _confirmCancel(BuildContext context, OrderHistory order) {
    final controller = TextEditingController();
    final cubit = context.read<AccountCubit>();
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Cancel rental'),
        content: TextField(
          controller: controller,
          decoration:
              const InputDecoration(labelText: 'Reason for cancellation'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Keep'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(dialogContext);
              final ok = await cubit.cancel(order.id, controller.text.trim());
              if (context.mounted) {
                showSnack(context,
                    ok ? 'Order cancelled' : 'Could not cancel order',
                    error: !ok);
              }
            },
            child: const Text('Cancel rental'),
          ),
        ],
      ),
    );
  }
}
