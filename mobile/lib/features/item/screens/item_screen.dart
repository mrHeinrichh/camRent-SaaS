import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../core/di/service_locator.dart';
import '../../../core/utils/currency.dart';
import '../../../core/utils/date_utils.dart';
import '../../../core/utils/rental_pricing.dart';
import '../../../core/widgets/app_widgets.dart';
import '../../../data/models/cart_item.dart';
import '../../../data/models/enums.dart';
import '../../../data/repositories/catalog_repository.dart';
import '../../cart/cubit/cart_cubit.dart';
import '../bloc/item_cubit.dart';

class ItemScreen extends StatelessWidget {
  const ItemScreen({super.key, required this.itemId});
  final String itemId;

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => ItemCubit(sl<CatalogRepository>())..load(itemId),
      child: Scaffold(
        appBar: AppBar(title: const Text('Gear details')),
        body: BlocBuilder<ItemCubit, ItemState>(
          builder: (context, state) {
            if (state.status == ItemStatus.loading) {
              return const LoadingView();
            }
            if (state.status == ItemStatus.error || state.item == null) {
              return ErrorView(
                message: state.error ?? 'Item not found',
                onRetry: () => context.read<ItemCubit>().load(itemId),
              );
            }
            return _ItemBody(state: state);
          },
        ),
      ),
    );
  }
}

class _ItemBody extends StatefulWidget {
  const _ItemBody({required this.state});
  final ItemState state;

  @override
  State<_ItemBody> createState() => _ItemBodyState();
}

class _ItemBodyState extends State<_ItemBody> {
  DateTimeRange? _range;
  int _quantity = 1;

  @override
  Widget build(BuildContext context) {
    final item = widget.state.item!;
    final billingMode = item.rentalBillingMode ?? RentalBillingMode.twentyFourHour;
    final days = _range == null
        ? 0
        : rentalDayCount(
            startDate: toIsoDate(_range!.start),
            endDate: toIsoDate(_range!.end),
            billingMode: billingMode,
          );
    final estimate = item.dailyPrice * days * _quantity;
    final maxStock = (item.stock ?? 1).clamp(1, 9999);

    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              RemoteImage(
                url: item.imageUrl,
                height: 240,
                width: double.infinity,
                borderRadius: BorderRadius.circular(16),
              ),
              const SizedBox(height: 16),
              Text(item.name,
                  style: const TextStyle(
                      fontSize: 22, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Wrap(
                spacing: 8,
                children: [
                  if (item.brand != null && item.brand!.isNotEmpty)
                    StatusBadge(item.brand!, color: AppColors.textMuted),
                  StatusBadge(item.category),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Text(formatPHP(item.dailyPrice),
                      style: const TextStyle(
                          fontSize: 20,
                          color: AppColors.accent,
                          fontWeight: FontWeight.bold)),
                  const Text(' / ',
                      style: TextStyle(color: AppColors.textMuted)),
                  Text(rentalBillingModeLabel(billingMode),
                      style: const TextStyle(color: AppColors.textMuted)),
                ],
              ),
              if (item.depositAmount > 0)
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    'Refundable deposit: ${formatPHP(item.depositAmount)}',
                    style: const TextStyle(
                        color: AppColors.textMuted, fontSize: 13),
                  ),
                ),
              const SizedBox(height: 16),
              if (item.description.isNotEmpty) ...[
                const Text('Description',
                    style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text(item.description,
                    style: const TextStyle(color: AppColors.textMuted)),
                const SizedBox(height: 16),
              ],
              if (item.store != null)
                Card(
                  child: ListTile(
                    leading: RemoteImage(
                      url: item.store!.logoUrl,
                      width: 40,
                      height: 40,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    title: Text(item.store!.name),
                    subtitle: Row(
                      children: [
                        const Icon(Icons.star,
                            size: 13, color: AppColors.accent),
                        const SizedBox(width: 2),
                        Text(item.store!.rating.toStringAsFixed(1)),
                      ],
                    ),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.push('/store/${item.store!.id}'),
                  ),
                ),
              const SizedBox(height: 16),
              _BookingsNotice(item: item),
              const SizedBox(height: 16),
              const Text('Rental period',
                  style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: _pickRange,
                icon: const Icon(Icons.calendar_month_outlined),
                label: Text(_range == null
                    ? 'Select dates'
                    : '${prettyDate(toIsoDate(_range!.start))}  →  ${prettyDate(toIsoDate(_range!.end))}'),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  const Text('Quantity',
                      style: TextStyle(fontWeight: FontWeight.bold)),
                  const Spacer(),
                  IconButton(
                    onPressed: _quantity > 1
                        ? () => setState(() => _quantity--)
                        : null,
                    icon: const Icon(Icons.remove_circle_outline),
                  ),
                  Text('$_quantity',
                      style: const TextStyle(fontSize: 16)),
                  IconButton(
                    onPressed: _quantity < maxStock
                        ? () => setState(() => _quantity++)
                        : null,
                    icon: const Icon(Icons.add_circle_outline),
                  ),
                ],
              ),
            ],
          ),
        ),
        _AddBar(
          estimate: estimate,
          days: days,
          enabled: _range != null,
          onAdd: () => _addToCart(item),
        ),
      ],
    );
  }

  Future<void> _pickRange() async {
    final now = DateTime.now();
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(now.year, now.month, now.day),
      lastDate: now.add(const Duration(days: 365)),
      initialDateRange: _range,
    );
    if (picked != null) setState(() => _range = picked);
  }

  void _addToCart(item) {
    if (_range == null) return;
    context.read<CartCubit>().addToCart(
          CartItem(
            id: item.id,
            name: item.name,
            dailyPrice: item.dailyPrice,
            depositAmount: item.depositAmount,
            imageUrl: item.imageUrl,
            storeId: item.storeId,
            stock: item.stock,
            quantity: _quantity,
            startDate: toIsoDate(_range!.start),
            endDate: toIsoDate(_range!.end),
            rentalBillingMode:
                item.rentalBillingMode ?? RentalBillingMode.twentyFourHour,
          ),
        );
    final conflict = context.read<CartCubit>().state.conflictMessage;
    if (conflict != null) {
      _showConflictDialog(conflict);
    } else {
      showSnack(context, 'Added to cart');
    }
  }

  void _showConflictDialog(String message) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('One store at a time'),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () {
              context.read<CartCubit>().dismissConflict();
              Navigator.pop(dialogContext);
            },
            child: const Text('Close'),
          ),
          ElevatedButton(
            onPressed: () {
              context.read<CartCubit>().clearCart();
              Navigator.pop(dialogContext);
            },
            child: const Text('Clear cart'),
          ),
        ],
      ),
    );
  }
}

class _BookingsNotice extends StatelessWidget {
  const _BookingsNotice({required this.item});
  final dynamic item;

  @override
  Widget build(BuildContext context) {
    final blocks = [...item.bookings, ...item.manualBlocks];
    if (blocks.isEmpty) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.warning.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.warning.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.event_busy, size: 16, color: AppColors.warning),
              SizedBox(width: 6),
              Text('Some dates are unavailable',
                  style: TextStyle(
                      color: AppColors.warning, fontWeight: FontWeight.w600)),
            ],
          ),
          const SizedBox(height: 6),
          ...item.bookings.map<Widget>((b) => Text(
                '${prettyDate(b.startDate)} → ${prettyDate(b.endDate)} (${b.status})',
                style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
              )),
          ...item.manualBlocks.map<Widget>((b) => Text(
                '${prettyDate(b.startDate)} → ${prettyDate(b.endDate)} (blocked)',
                style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
              )),
        ],
      ),
    );
  }
}

class _AddBar extends StatelessWidget {
  const _AddBar({
    required this.estimate,
    required this.days,
    required this.enabled,
    required this.onAdd,
  });

  final double estimate;
  final int days;
  final bool enabled;
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(
          16, 12, 16, 12 + MediaQuery.of(context).padding.bottom),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Estimated',
                  style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
              Text(formatPHP(estimate),
                  style: const TextStyle(
                      fontSize: 18, fontWeight: FontWeight.bold)),
              if (days > 0)
                Text('$days day(s)',
                    style: const TextStyle(
                        color: AppColors.textMuted, fontSize: 11)),
            ],
          ),
          const Spacer(),
          ElevatedButton.icon(
            onPressed: enabled ? onAdd : null,
            icon: const Icon(Icons.add_shopping_cart),
            label: const Text('Add to cart'),
          ),
        ],
      ),
    );
  }
}
