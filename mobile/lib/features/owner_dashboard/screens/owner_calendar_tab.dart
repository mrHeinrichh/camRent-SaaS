import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';

import '../../../app/theme.dart';
import '../../../core/di/service_locator.dart';
import '../../../core/utils/date_utils.dart';
import '../../../core/widgets/app_widgets.dart';
import '../../../data/models/item.dart';
import '../../../data/repositories/catalog_repository.dart';
import '../bloc/owner_cubit.dart';

/// Rental calendar: pick a gear, see its booked + manually-blocked dates on a
/// month grid, and add/remove manual blocks.
class OwnerCalendarTab extends StatefulWidget {
  const OwnerCalendarTab({super.key, required this.state});
  final OwnerState state;

  @override
  State<OwnerCalendarTab> createState() => _OwnerCalendarTabState();
}

class _OwnerCalendarTabState extends State<OwnerCalendarTab> {
  String? _itemId;
  Item? _detail;
  bool _loading = false;
  late DateTime _month = DateTime(DateTime.now().year, DateTime.now().month);

  List<Item> get _items => widget.state.dashboard?.items ?? const [];

  @override
  void initState() {
    super.initState();
    if (_items.isNotEmpty) {
      _itemId = _items.first.id;
      _fetch();
    }
  }

  Future<void> _fetch() async {
    if (_itemId == null) return;
    setState(() => _loading = true);
    try {
      final detail = await sl<CatalogRepository>().item(_itemId!);
      if (mounted) setState(() => _detail = detail);
    } catch (_) {
      // ignore
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  // Returns the tone for a given day: 'blocked' | 'approved' | 'pending' | null.
  String? _toneFor(DateTime day) {
    final detail = _detail;
    if (detail == null) return null;
    // Past days are never marked — only current/upcoming availability matters.
    if (isPastDay(day)) return null;
    bool within(String s, String e) {
      final sd = DateTime.tryParse(s);
      final ed = DateTime.tryParse(e);
      if (sd == null || ed == null) return false;
      final d0 = DateTime(day.year, day.month, day.day);
      final s0 = DateTime(sd.year, sd.month, sd.day);
      final e0 = DateTime(ed.year, ed.month, ed.day);
      return !d0.isBefore(s0) && !d0.isAfter(e0);
    }

    for (final b in detail.manualBlocks) {
      if (within(b.startDate, b.endDate)) return 'blocked';
    }
    for (final b in detail.bookings) {
      if (within(b.startDate, b.endDate)) {
        return (b.status == 'APPROVED' || b.status == 'ONGOING')
            ? 'approved'
            : 'pending';
      }
    }
    return null;
  }

  Color _toneColor(String tone) {
    switch (tone) {
      case 'blocked':
        return AppColors.danger;
      case 'approved':
        return AppColors.success;
      default:
        return AppColors.warning;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_items.isEmpty) {
      return const EmptyState(
          title: 'No gear to schedule',
          message: 'Add gear first to manage its calendar.',
          icon: Icons.calendar_month_outlined);
    }
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          children: [
            Expanded(
              child: DropdownButtonFormField<String>(
                initialValue: _itemId,
                decoration: const InputDecoration(labelText: 'Select gear'),
                items: _items
                    .map((i) =>
                        DropdownMenuItem(value: i.id, child: Text(i.name)))
                    .toList(),
                onChanged: (v) {
                  setState(() => _itemId = v);
                  _fetch();
                },
              ),
            ),
            IconButton(
              tooltip: 'Refresh',
              onPressed: _fetch,
              icon: const Icon(Icons.refresh),
            ),
          ],
        ),
        const SizedBox(height: 12),
        _MonthHeader(
          month: _month,
          onPrev: () => setState(() =>
              _month = DateTime(_month.year, _month.month - 1)),
          onNext: () => setState(() =>
              _month = DateTime(_month.year, _month.month + 1)),
        ),
        const SizedBox(height: 8),
        if (_loading)
          const Padding(
            padding: EdgeInsets.all(24),
            child: Center(child: CircularProgressIndicator()),
          )
        else
          _buildGrid(),
        const SizedBox(height: 12),
        _legend(),
        const SizedBox(height: 16),
        Row(
          children: [
            const Text('Unavailable periods',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            const Spacer(),
            TextButton.icon(
              onPressed: _addBlock,
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Add block'),
            ),
          ],
        ),
        ..._periodsList(),
      ],
    );
  }

  Widget _buildGrid() {
    final first = DateTime(_month.year, _month.month, 1);
    final daysInMonth = DateTime(_month.year, _month.month + 1, 0).day;
    final leading = first.weekday % 7; // Sun=0
    final cells = <Widget>[];
    const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    for (final w in weekdays) {
      cells.add(Center(
        child: Text(w,
            style: TextStyle(
                color: AppColors.textMuted,
                fontSize: 11,
                fontWeight: FontWeight.w700)),
      ));
    }
    for (var i = 0; i < leading; i++) {
      cells.add(const SizedBox.shrink());
    }
    for (var d = 1; d <= daysInMonth; d++) {
      final day = DateTime(_month.year, _month.month, d);
      final tone = _toneFor(day);
      cells.add(Container(
        margin: const EdgeInsets.all(2),
        decoration: BoxDecoration(
          color: tone == null
              ? Colors.transparent
              : _toneColor(tone).withValues(alpha: 0.18),
          borderRadius: BorderRadius.circular(8),
          border: tone == null
              ? null
              : Border.all(color: _toneColor(tone).withValues(alpha: 0.6)),
        ),
        child: Center(
          child: Text('$d',
              style: TextStyle(
                  fontSize: 12,
                  fontWeight:
                      tone == null ? FontWeight.normal : FontWeight.w700,
                  color: tone == null ? AppColors.text : _toneColor(tone))),
        ),
      ));
    }
    return GridView.count(
      crossAxisCount: 7,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 1.1,
      children: cells,
    );
  }

  Widget _legend() {
    Widget dot(Color c, String t) => Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
                width: 10,
                height: 10,
                decoration:
                    BoxDecoration(color: c, borderRadius: BorderRadius.circular(3))),
            const SizedBox(width: 4),
            Text(t, style: const TextStyle(fontSize: 11)),
          ],
        );
    return Wrap(spacing: 14, runSpacing: 6, children: [
      dot(AppColors.success, 'Approved / ongoing'),
      dot(AppColors.warning, 'Pending'),
      dot(AppColors.danger, 'Manually blocked'),
    ]);
  }

  List<Widget> _periodsList() {
    final detail = _detail;
    if (detail == null) return [];
    final widgets = <Widget>[];
    for (final b in detail.bookings.where((b) => !periodEnded(b.endDate))) {
      widgets.add(Card(
        child: ListTile(
          dense: true,
          leading: Icon(Icons.event,
              color: (b.status == 'APPROVED' || b.status == 'ONGOING')
                  ? AppColors.success
                  : AppColors.warning),
          title: Text('${prettyDate(b.startDate)} → ${prettyDate(b.endDate)}'),
          subtitle: Text('${b.renterName ?? 'Renter'} · ${b.status}'),
        ),
      ));
    }
    for (final b in detail.manualBlocks.where((b) => !periodEnded(b.endDate))) {
      widgets.add(Card(
        child: ListTile(
          dense: true,
          leading: const Icon(Icons.block, color: AppColors.danger),
          title: Text('${prettyDate(b.startDate)} → ${prettyDate(b.endDate)}'),
          subtitle: Text(b.reason.isEmpty ? 'Manual block' : b.reason),
          trailing: IconButton(
            icon: const Icon(Icons.delete_outline, color: AppColors.danger),
            onPressed: () async {
              final messenger = ScaffoldMessenger.of(context);
              await context.read<OwnerCubit>().deleteManualBlock(b.id);
              await _fetch();
              messenger.showSnackBar(
                  const SnackBar(content: Text('Block removed')));
            },
          ),
        ),
      ));
    }
    if (widgets.isEmpty) {
      widgets.add(Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Text('No bookings or blocks for this gear.',
            style: TextStyle(color: AppColors.textMuted)),
      ));
    }
    return widgets;
  }

  Future<void> _addBlock() async {
    if (_itemId == null) return;
    final now = DateTime.now();
    final range = await showDateRangePicker(
      context: context,
      firstDate: DateTime(now.year, now.month, now.day),
      lastDate: now.add(const Duration(days: 365)),
    );
    if (range == null || !mounted) return;
    final reason = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Block dates'),
        content: TextField(
          controller: reason,
          decoration: const InputDecoration(labelText: 'Reason (optional)'),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(dialogContext, false),
              child: const Text('Cancel')),
          ElevatedButton(
              onPressed: () => Navigator.pop(dialogContext, true),
              child: const Text('Block')),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    final df = DateFormat('yyyy-MM-dd');
    try {
      await context.read<OwnerCubit>().addManualBlock(
            itemId: _itemId!,
            startDate: df.format(range.start),
            endDate: df.format(range.end),
            reason: reason.text.trim(),
          );
      await _fetch();
      if (mounted) showSnack(context, 'Dates blocked');
    } catch (e) {
      if (mounted) showSnack(context, 'Could not block: $e', error: true);
    }
  }
}

class _MonthHeader extends StatelessWidget {
  const _MonthHeader(
      {required this.month, required this.onPrev, required this.onNext});
  final DateTime month;
  final VoidCallback onPrev;
  final VoidCallback onNext;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        IconButton(onPressed: onPrev, icon: const Icon(Icons.chevron_left)),
        Text(DateFormat('MMMM yyyy').format(month),
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
        IconButton(onPressed: onNext, icon: const Icon(Icons.chevron_right)),
      ],
    );
  }
}
