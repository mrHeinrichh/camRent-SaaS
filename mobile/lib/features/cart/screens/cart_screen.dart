import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../core/widgets/animations.dart';
import '../../../core/utils/currency.dart';
import '../../../core/utils/date_utils.dart';
import '../../../core/utils/rental_pricing.dart';
import '../../../core/widgets/app_widgets.dart';
import '../../auth/cubit/auth_cubit.dart';
import '../cubit/cart_cubit.dart';

class CartScreen extends StatelessWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Cart')),
      body: BlocBuilder<CartCubit, CartState>(
        builder: (context, state) {
          if (state.items.isEmpty) {
            return EmptyState(
              icon: Icons.shopping_cart_outlined,
              title: 'Your cart is empty',
              message: 'Browse gear and add it here to start a rental.',
              action: ElevatedButton(
                onPressed: () => context.go('/'),
                child: const Text('Browse gear'),
              ),
            );
          }
          return Column(
            children: [
              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.all(12),
                  itemCount: state.items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final item = state.items[index];
                    final days = cartItemRentalDays(item);
                    return EntranceEffect(
                      index: index % 8,
                      child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(10),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            RemoteImage(
                              url: item.imageUrl,
                              width: 70,
                              height: 70,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(item.name,
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w700)),
                                  Text(
                                    '${prettyDate(item.startDate)} → ${prettyDate(item.endDate)}',
                                    style: const TextStyle(
                                        color: AppColors.textMuted,
                                        fontSize: 12),
                                  ),
                                  Text('$days day(s)',
                                      style: const TextStyle(
                                          color: AppColors.textMuted,
                                          fontSize: 12)),
                                  const SizedBox(height: 4),
                                  Text(formatPHP(cartItemRentalTotal(item)),
                                      style: const TextStyle(
                                          color: AppColors.accent,
                                          fontWeight: FontWeight.bold)),
                                ],
                              ),
                            ),
                            Column(
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.delete_outline),
                                  color: AppColors.danger,
                                  onPressed: () =>
                                      context.read<CartCubit>().removeAt(index),
                                ),
                                Row(
                                  children: [
                                    _StepBtn(
                                      icon: Icons.remove,
                                      onTap: () => context
                                          .read<CartCubit>()
                                          .updateQuantity(
                                              item.lineKey, item.quantity - 1),
                                    ),
                                    Padding(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 8),
                                      child: Text('${item.quantity}'),
                                    ),
                                    _StepBtn(
                                      icon: Icons.add,
                                      onTap: () => context
                                          .read<CartCubit>()
                                          .updateQuantity(
                                              item.lineKey, item.quantity + 1),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    );
                  },
                ),
              ),
              _Summary(state: state),
            ],
          );
        },
      ),
    );
  }
}

class _StepBtn extends StatelessWidget {
  const _StepBtn({required this.icon, required this.onTap});
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(6),
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.border),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Icon(icon, size: 16),
      ),
    );
  }
}

class _Summary extends StatelessWidget {
  const _Summary({required this.state});
  final CartState state;

  @override
  Widget build(BuildContext context) {
    final isRenter = context.watch<AuthCubit>().state.isRenter;
    final loggedIn =
        context.watch<AuthCubit>().state.status == AuthStatus.authenticated;
    return Container(
      padding: EdgeInsets.fromLTRB(
          16, 16, 16, 16 + MediaQuery.of(context).padding.bottom),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _row('Rental subtotal', formatPHP(state.rentalSubtotal)),
          _row('Deposits', formatPHP(state.depositTotal)),
          if (state.voucherDiscount > 0)
            _row('Voucher (${state.appliedVoucher!.code})',
                '- ${formatPHP(state.voucherDiscount)}',
                accent: true),
          const Divider(),
          _row('Total', formatPHP(state.total), bold: true),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                if (!loggedIn) {
                  context.push('/login');
                  return;
                }
                if (!isRenter) {
                  showSnack(context,
                      'Only renter accounts can checkout.', error: true);
                  return;
                }
                context.push('/checkout');
              },
              child: Text(loggedIn ? 'Proceed to checkout' : 'Sign in to checkout'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _row(String label, String value,
      {bool bold = false, bool accent = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: TextStyle(
                  color: bold ? AppColors.text : AppColors.textMuted,
                  fontWeight: bold ? FontWeight.bold : FontWeight.normal)),
          Text(value,
              style: TextStyle(
                  color: accent ? AppColors.accent : AppColors.text,
                  fontWeight: bold ? FontWeight.bold : FontWeight.w600,
                  fontSize: bold ? 18 : 14)),
        ],
      ),
    );
  }
}
