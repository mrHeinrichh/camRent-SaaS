import 'package:flutter/material.dart';

import '../../../app/theme.dart';
import '../../../core/utils/currency.dart';
import '../../../core/utils/date_utils.dart';
import '../../../core/widgets/app_widgets.dart';
import '../../../core/widgets/document_gallery.dart';
import '../../../data/models/dashboard.dart';
import '../bloc/owner_cubit.dart';

Future<T?> _sheet<T>(BuildContext context, Widget child) {
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (_) => DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.85,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (_, controller) => _SheetFrame(controller: controller, child: child),
    ),
  );
}

class _SheetFrame extends StatelessWidget {
  const _SheetFrame({required this.controller, required this.child});
  final ScrollController controller;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return ListView(
      controller: controller,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
      children: [
        Center(
          child: Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.only(bottom: 14),
            decoration: BoxDecoration(
              color: AppColors.border,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        ),
        child,
      ],
    );
  }
}

Widget _row(IconData icon, String label, String? value) {
  if (value == null || value.isEmpty) return const SizedBox.shrink();
  return Padding(
    padding: const EdgeInsets.symmetric(vertical: 5),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: AppColors.textMuted),
        const SizedBox(width: 8),
        SizedBox(
          width: 110,
          child: Text(label,
              style: TextStyle(color: AppColors.textMuted, fontSize: 12.5)),
        ),
        Expanded(
          child: Text(value,
              style: const TextStyle(
                  fontSize: 13, fontWeight: FontWeight.w600)),
        ),
      ],
    ),
  );
}

Widget _sectionTitle(String t) => Padding(
      padding: const EdgeInsets.only(top: 16, bottom: 8),
      child: Text(t, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
    );

Widget _itemsList(
    List<({String name, String startDate, String endDate, int quantity})> items) {
  return Column(
    children: items
        .map((it) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 3),
              child: Row(
                children: [
                  Icon(Icons.photo_camera_outlined,
                      size: 15, color: AppColors.textMuted),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      '${it.name} ×${it.quantity}  (${prettyDate(it.startDate)} → ${prettyDate(it.endDate)})',
                      style: const TextStyle(fontSize: 12.5),
                    ),
                  ),
                ],
              ),
            ))
        .toList(),
  );
}

// ── Application detail ──────────────────────────────────────────────
Future<void> showApplicationDetail(
  BuildContext context, {
  required OwnerApplication app,
  required OwnerCubit cubit,
}) {
  final pending = app.status.toUpperCase() == 'PENDING_REVIEW' ||
      app.status.toUpperCase() == 'PENDING';
  return _sheet(
    context,
    Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(app.renterName,
                  style: const TextStyle(
                      fontSize: 20, fontWeight: FontWeight.w800)),
            ),
            if (app.fraudFlag)
              const StatusBadge('FRAUD', color: AppColors.danger),
            const SizedBox(width: 6),
            StatusBadge(app.status, color: statusColor(app.status)),
          ],
        ),
        const SizedBox(height: 10),
        _row(Icons.email_outlined, 'Email', app.renterEmail),
        _row(Icons.phone_outlined, 'Phone', app.renterPhone),
        _row(Icons.location_on_outlined, 'Address', app.renterAddress),
        _row(Icons.local_shipping_outlined, 'Delivery', app.deliveryMode),
        _row(Icons.payments_outlined, 'Payment', app.paymentMode),
        _row(Icons.event_outlined, 'Applied', prettyDateTime(app.createdAt)),
        _row(Icons.receipt_long_outlined, 'Total', formatPHP(app.totalAmount)),
        _sectionTitle('Requested gear'),
        _itemsList(app.items),
        if (app.customAnswers.isNotEmpty) ...[
          _sectionTitle('Additional answers'),
          ...app.customAnswers.entries.map((e) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 3),
                child: Text('${e.key}: ${e.value}',
                    style: const TextStyle(fontSize: 12.5)),
              )),
        ],
        _sectionTitle('Identity documents'),
        DocumentGallery(documents: app.documents),
        if (pending) ...[
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.danger),
                  onPressed: () {
                    Navigator.pop(context);
                    _rejectDialog(context, cubit, app.id);
                  },
                  child: const Text('Reject'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ElevatedButton(
                  onPressed: () async {
                    Navigator.pop(context);
                    await cubit.approve(app.id);
                    if (context.mounted) {
                      showSnack(context, 'Application approved');
                    }
                  },
                  child: const Text('Approve'),
                ),
              ),
            ],
          ),
        ],
      ],
    ),
  );
}

void _rejectDialog(BuildContext context, OwnerCubit cubit, String id) {
  final controller = TextEditingController();
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

// ── Transaction detail ──────────────────────────────────────────────
Future<void> showTransactionDetail(
    BuildContext context, OwnerTransaction t) {
  return _sheet(
    context,
    Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(t.renterName,
                  style: const TextStyle(
                      fontSize: 20, fontWeight: FontWeight.w800)),
            ),
            StatusBadge(t.status, color: statusColor(t.status)),
          ],
        ),
        const SizedBox(height: 10),
        _row(Icons.email_outlined, 'Email', t.renterEmail),
        _row(Icons.phone_outlined, 'Phone', t.renterPhone),
        _row(Icons.contact_emergency_outlined, 'Emergency',
            t.renterEmergencyContactName == null
                ? t.renterEmergencyContact
                : '${t.renterEmergencyContactName} · ${t.renterEmergencyContact ?? ''}'),
        _row(Icons.location_on_outlined, 'Address', t.renterAddress),
        _row(Icons.store_outlined, 'Branch', t.storeBranchName),
        _row(Icons.local_shipping_outlined, 'Delivery',
            t.deliveryMode == null ? null : '${t.deliveryMode} ${t.deliveryAddress ?? ''}'),
        _row(Icons.payments_outlined, 'Payment', t.paymentMode),
        _row(Icons.event_outlined, 'Date', prettyDateTime(t.createdAt)),
        _row(Icons.receipt_long_outlined, 'Total', formatPHP(t.totalAmount)),
        _sectionTitle('Rented gear'),
        _itemsList(t.items),
        _sectionTitle('Identity documents'),
        DocumentGallery(documents: t.documents),
      ],
    ),
  );
}

// ── Customer detail ─────────────────────────────────────────────────
Future<void> showCustomerDetail(BuildContext context, OwnerCustomer c) {
  return _sheet(
    context,
    Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            CircleAvatar(
              radius: 22,
              backgroundColor: AppColors.surfaceSoft,
              child: Text(
                c.renterName.isEmpty ? '?' : c.renterName[0].toUpperCase(),
                style: const TextStyle(
                    fontWeight: FontWeight.bold, fontSize: 18),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(c.renterName,
                      style: const TextStyle(
                          fontSize: 18, fontWeight: FontWeight.w800)),
                  Text('${c.transactionCount} rentals',
                      style: TextStyle(
                          color: AppColors.textMuted, fontSize: 12.5)),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        _row(Icons.email_outlined, 'Email', c.renterEmail),
        _row(Icons.phone_outlined, 'Phone', c.renterPhone),
        _row(Icons.location_on_outlined, 'Address', c.renterAddress),
        if (c.idTypes.isNotEmpty)
          _row(Icons.badge_outlined, 'ID types', c.idTypes.join(', ')),
        if (c.mostlyRentedGears.isNotEmpty) ...[
          _sectionTitle('Most rented gear'),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: c.mostlyRentedGears
                .map((g) => Chip(
                      visualDensity: VisualDensity.compact,
                      label: Text('${g.name} ×${g.count}',
                          style: const TextStyle(fontSize: 11)),
                    ))
                .toList(),
          ),
        ],
        _sectionTitle('Submitted requirements'),
        DocumentGallery(
            documents: c.requirements, title: 'Verification documents'),
      ],
    ),
  );
}
