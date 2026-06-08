import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../app/theme.dart';
import '../../../core/utils/currency.dart';
import '../../../core/utils/date_utils.dart';
import '../../../core/widgets/animations.dart';
import '../../../core/widgets/app_widgets.dart';
import '../bloc/owner_cubit.dart';
import 'owner_detail_sheets.dart';

/// Rental history / recent transactions.
class OwnerTransactionsTab extends StatelessWidget {
  const OwnerTransactionsTab({super.key, required this.state});
  final OwnerState state;

  @override
  Widget build(BuildContext context) {
    final txns = state.dashboard?.recentTransactions ?? const [];
    if (txns.isEmpty) {
      return const EmptyState(
          title: 'No transactions yet', icon: Icons.receipt_long_outlined);
    }
    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: txns.length,
      itemBuilder: (context, index) {
        final t = txns[index];
        return EntranceEffect(
          index: index % 8,
          child: Card(
            child: InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: () => showTransactionDetail(context, t),
              child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(t.renterName,
                            style:
                                const TextStyle(fontWeight: FontWeight.w700)),
                      ),
                      if (t.documents.isNotEmpty) ...[
                        Icon(Icons.badge_outlined,
                            size: 15, color: AppColors.textMuted),
                        const SizedBox(width: 6),
                      ],
                      StatusBadge(t.status, color: statusColor(t.status)),
                    ],
                  ),
                  Text(t.renterEmail,
                      style: TextStyle(
                          color: AppColors.textMuted, fontSize: 12)),
                  const SizedBox(height: 4),
                  Text(prettyDateTime(t.createdAt),
                      style: TextStyle(
                          color: AppColors.textMuted, fontSize: 11)),
                  const SizedBox(height: 6),
                  ...t.items.map((it) => Text(
                        '• ${it.name} ×${it.quantity}  (${prettyDate(it.startDate)} → ${prettyDate(it.endDate)})',
                        style: const TextStyle(fontSize: 12),
                      )),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      if (t.paymentMode != null)
                        _pill(Icons.payments_outlined, t.paymentMode!),
                      if (t.deliveryMode != null)
                        _pill(Icons.local_shipping_outlined, t.deliveryMode!),
                      const Spacer(),
                      Text(formatPHP(t.totalAmount),
                          style: const TextStyle(
                              color: AppColors.accent,
                              fontWeight: FontWeight.bold)),
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

  Widget _pill(IconData icon, String text) => Padding(
        padding: const EdgeInsets.only(right: 8),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 13, color: AppColors.textMuted),
            const SizedBox(width: 3),
            Text(text,
                style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
          ],
        ),
      );
}

/// Renter records.
class OwnerCustomersTab extends StatelessWidget {
  const OwnerCustomersTab({super.key, required this.state});
  final OwnerState state;

  @override
  Widget build(BuildContext context) {
    final customers = state.dashboard?.customers ?? const [];
    if (customers.isEmpty) {
      return const EmptyState(
          title: 'No customers yet', icon: Icons.people_outline);
    }
    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: customers.length,
      itemBuilder: (context, index) {
        final c = customers[index];
        return EntranceEffect(
          index: index % 8,
          child: Card(
            child: InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: () => showCustomerDetail(context, c),
              child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 18,
                        backgroundColor: AppColors.surface,
                        child: Text(
                          c.renterName.isEmpty
                              ? '?'
                              : c.renterName[0].toUpperCase(),
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(c.renterName,
                                style: const TextStyle(
                                    fontWeight: FontWeight.w700)),
                            Text(c.renterEmail,
                                style: TextStyle(
                                    color: AppColors.textMuted, fontSize: 12)),
                          ],
                        ),
                      ),
                      StatusBadge('${c.transactionCount} rentals'),
                    ],
                  ),
                  if (c.renterPhone != null || c.renterAddress != null) ...[
                    const SizedBox(height: 6),
                    if (c.renterPhone != null)
                      Row(children: [
                        Icon(Icons.phone_outlined,
                            size: 13, color: AppColors.textMuted),
                        const SizedBox(width: 4),
                        Text(c.renterPhone!,
                            style: TextStyle(
                                color: AppColors.textMuted, fontSize: 12)),
                      ]),
                    if (c.renterAddress != null)
                      Row(children: [
                        Icon(Icons.location_on_outlined,
                            size: 13, color: AppColors.textMuted),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(c.renterAddress!,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                  color: AppColors.textMuted, fontSize: 12)),
                        ),
                      ]),
                  ],
                  if (c.mostlyRentedGears.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: c.mostlyRentedGears
                          .take(4)
                          .map((g) => Chip(
                                visualDensity: VisualDensity.compact,
                                label: Text('${g.name} ×${g.count}',
                                    style: const TextStyle(fontSize: 11)),
                              ))
                          .toList(),
                    ),
                  ],
                ],
              ),
            ),
            ),
          ),
        );
      },
    );
  }
}

/// Fraud list + report.
class OwnerFraudTab extends StatelessWidget {
  const OwnerFraudTab({super.key, required this.state});
  final OwnerState state;

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<OwnerCubit>();
    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _report(context, cubit),
        icon: const Icon(Icons.report_gmailerrorred_outlined),
        label: const Text('Report fraud'),
      ),
      body: state.fraudList.isEmpty
          ? const EmptyState(
              title: 'No fraud reports',
              message: 'Reported renters appear here.',
              icon: Icons.shield_outlined)
          : ListView.builder(
              padding: const EdgeInsets.fromLTRB(12, 12, 12, 88),
              itemCount: state.fraudList.length,
              itemBuilder: (context, index) {
                final f = state.fraudList[index];
                return EntranceEffect(
                  index: index % 8,
                  child: Card(
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
                  ),
                );
              },
            ),
    );
  }

  void _report(BuildContext context, OwnerCubit cubit) {
    final name = TextEditingController();
    final email = TextEditingController();
    final phone = TextEditingController();
    final reason = TextEditingController();
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Report fraudulent renter'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                  controller: name,
                  decoration: const InputDecoration(labelText: 'Full name')),
              const SizedBox(height: 8),
              TextField(
                  controller: email,
                  decoration: const InputDecoration(labelText: 'Email')),
              const SizedBox(height: 8),
              TextField(
                  controller: phone,
                  decoration:
                      const InputDecoration(labelText: 'Contact number')),
              const SizedBox(height: 8),
              TextField(
                  controller: reason,
                  maxLines: 2,
                  decoration: const InputDecoration(labelText: 'Reason')),
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
              try {
                await cubit.reportFraud({
                  'full_name': name.text.trim(),
                  'email': email.text.trim(),
                  'contact_number': phone.text.trim(),
                  'reason': reason.text.trim(),
                });
                if (context.mounted) showSnack(context, 'Report submitted');
              } catch (e) {
                if (context.mounted) {
                  showSnack(context, 'Could not submit: $e', error: true);
                }
              }
            },
            child: const Text('Submit'),
          ),
        ],
      ),
    );
  }
}
