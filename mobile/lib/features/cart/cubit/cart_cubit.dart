import 'package:equatable/equatable.dart';
import 'package:hydrated_bloc/hydrated_bloc.dart';

import '../../../core/utils/json.dart';
import '../../../core/utils/rental_pricing.dart';
import '../../../data/models/cart_item.dart';
import '../../../data/models/order.dart';

part 'cart_state.dart';

/// Cart logic ported from the web zustand store (`frontend/src/store/index.ts`):
/// one store at a time, line-item identity by id+dates+times, voucher cleared
/// when switching stores. Persisted with HydratedBloc.
class CartCubit extends HydratedCubit<CartState> {
  CartCubit() : super(const CartState());

  void addToCart(CartItem item) {
    final existingStoreId = state.items.isEmpty ? null : state.items.first.storeId;
    if (existingStoreId != null && existingStoreId != item.storeId) {
      emit(state.copyWith(
        conflictMessage:
            'You can only add items from one store at a time. Please clear your cart to add items from another store.',
      ));
      return;
    }

    final quantityToAdd = item.quantity < 1 ? 1 : item.quantity;
    final clearVoucher =
        state.appliedVoucher != null && state.appliedVoucher!.storeId != item.storeId;
    final index = state.items.indexWhere((e) => e.lineKey == item.lineKey);

    final next = List<CartItem>.from(state.items);
    if (index == -1) {
      next.add(item.copyWith(quantity: quantityToAdd));
    } else {
      final existing = next[index];
      final maxStock = (existing.stock ?? item.stock ?? 1).clamp(1, 9999);
      final qty = (existing.quantity + quantityToAdd).clamp(1, maxStock);
      next[index] = existing.copyWith(quantity: qty);
    }
    emit(state.copyWith(items: next, clearVoucher: clearVoucher));
  }

  void updateQuantity(String lineKey, int quantity) {
    final next = state.items.map((item) {
      if (item.lineKey != lineKey) return item;
      final max = (item.stock ?? 1).clamp(1, 9999);
      return item.copyWith(quantity: quantity.clamp(1, max));
    }).toList();
    emit(state.copyWith(items: next));
  }

  void removeAt(int index) {
    final next = List<CartItem>.from(state.items)..removeAt(index);
    final nextStoreId = next.isEmpty ? '' : next.first.storeId;
    final clearVoucher = state.appliedVoucher != null &&
        state.appliedVoucher!.storeId != nextStoreId;
    emit(state.copyWith(items: next, clearVoucher: clearVoucher));
  }

  void clearCart() => emit(const CartState());

  void applyVoucher(AppliedVoucher voucher) =>
      emit(state.copyWith(appliedVoucher: voucher));

  void removeVoucher() => emit(state.copyWith(clearVoucher: true));

  void dismissConflict() => emit(state.copyWith(clearConflict: true));

  @override
  CartState fromJson(Map<String, dynamic> json) {
    final items = Json.list(json['cart']).map(CartItem.fromJson).toList();
    AppliedVoucher? voucher;
    if (json['appliedVoucher'] is Map) {
      final v = Json.obj(json['appliedVoucher']);
      voucher = AppliedVoucher(
        code: Json.str(v['code']),
        discountAmount: Json.dbl(v['discount_amount']),
        storeId: Json.str(v['store_id']),
      );
    }
    return CartState(items: items, appliedVoucher: voucher);
  }

  @override
  Map<String, dynamic>? toJson(CartState state) => {
        'cart': state.items.map((e) => e.toJson()).toList(),
        'appliedVoucher': state.appliedVoucher == null
            ? null
            : {
                'code': state.appliedVoucher!.code,
                'discount_amount': state.appliedVoucher!.discountAmount,
                'store_id': state.appliedVoucher!.storeId,
              },
      };
}
