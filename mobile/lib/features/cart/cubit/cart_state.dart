part of 'cart_cubit.dart';

class CartState extends Equatable {
  const CartState({
    this.items = const [],
    this.appliedVoucher,
    this.conflictMessage,
  });

  final List<CartItem> items;
  final AppliedVoucher? appliedVoucher;

  /// Set when the user tries to add gear from a different store; the UI shows a
  /// "one store at a time" dialog.
  final String? conflictMessage;

  String? get storeId => items.isEmpty ? null : items.first.storeId;

  double get rentalSubtotal =>
      items.fold(0, (sum, item) => sum + cartItemRentalTotal(item));

  double get depositTotal => items.fold(
      0, (sum, item) => sum + item.depositAmount * (item.quantity < 1 ? 1 : item.quantity));

  double get voucherDiscount => appliedVoucher?.discountAmount ?? 0;

  double get total {
    final t = rentalSubtotal + depositTotal - voucherDiscount;
    return t < 0 ? 0 : t;
  }

  int get count => items.fold(0, (sum, item) => sum + item.quantity);

  CartState copyWith({
    List<CartItem>? items,
    AppliedVoucher? appliedVoucher,
    bool clearVoucher = false,
    String? conflictMessage,
    bool clearConflict = false,
  }) =>
      CartState(
        items: items ?? this.items,
        appliedVoucher:
            clearVoucher ? null : (appliedVoucher ?? this.appliedVoucher),
        conflictMessage:
            clearConflict ? null : (conflictMessage ?? this.conflictMessage),
      );

  @override
  List<Object?> get props =>
      [items, appliedVoucher?.code, conflictMessage];
}
