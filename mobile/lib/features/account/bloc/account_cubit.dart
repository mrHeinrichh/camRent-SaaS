import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/network/api_exception.dart';
import '../../../data/models/order.dart';
import '../../../data/repositories/order_repository.dart';

enum AccountStatus { loading, ready, error }

class AccountState extends Equatable {
  const AccountState({
    this.status = AccountStatus.loading,
    this.orders = const [],
    this.error,
  });

  final AccountStatus status;
  final List<OrderHistory> orders;
  final String? error;

  AccountState copyWith({
    AccountStatus? status,
    List<OrderHistory>? orders,
    String? error,
  }) =>
      AccountState(
        status: status ?? this.status,
        orders: orders ?? this.orders,
        error: error,
      );

  @override
  List<Object?> get props => [status, orders, error];
}

class AccountCubit extends Cubit<AccountState> {
  AccountCubit(this._repo) : super(const AccountState());

  final OrderRepository _repo;

  Future<void> load({bool forceRefresh = false}) async {
    emit(state.copyWith(status: AccountStatus.loading, error: null));
    try {
      emit(state.copyWith(
        status: AccountStatus.ready,
        orders: await _repo.accountOrders(forceRefresh: forceRefresh),
      ));
    } on ApiException catch (e) {
      emit(state.copyWith(status: AccountStatus.error, error: e.message));
    }
  }

  Future<bool> cancel(String id, String reason) async {
    try {
      await _repo.cancelOrder(id, reason);
      await load(forceRefresh: true);
      return true;
    } on ApiException {
      return false;
    }
  }
}
