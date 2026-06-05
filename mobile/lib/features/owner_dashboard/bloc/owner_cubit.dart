import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/network/api_exception.dart';
import '../../../data/models/content.dart';
import '../../../data/models/dashboard.dart';
import '../../../data/models/order.dart';
import '../../../data/repositories/owner_repository.dart';

enum OwnerStatus { loading, ready, error }

class OwnerState extends Equatable {
  const OwnerState({
    this.status = OwnerStatus.loading,
    this.dashboard,
    this.applications = const [],
    this.vouchers = const [],
    this.fraudList = const [],
    this.supportTickets = const [],
    this.error,
  });

  final OwnerStatus status;
  final OwnerDashboardData? dashboard;
  final List<OwnerApplication> applications;
  final List<Voucher> vouchers;
  final List<FraudListEntry> fraudList;
  final List<SupportTicket> supportTickets;
  final String? error;

  OwnerState copyWith({
    OwnerStatus? status,
    OwnerDashboardData? dashboard,
    List<OwnerApplication>? applications,
    List<Voucher>? vouchers,
    List<FraudListEntry>? fraudList,
    List<SupportTicket>? supportTickets,
    String? error,
  }) =>
      OwnerState(
        status: status ?? this.status,
        dashboard: dashboard ?? this.dashboard,
        applications: applications ?? this.applications,
        vouchers: vouchers ?? this.vouchers,
        fraudList: fraudList ?? this.fraudList,
        supportTickets: supportTickets ?? this.supportTickets,
        error: error,
      );

  @override
  List<Object?> get props => [
        status,
        dashboard?.store?.id,
        applications,
        vouchers,
        fraudList,
        supportTickets,
        error,
      ];
}

class OwnerCubit extends Cubit<OwnerState> {
  OwnerCubit(this._repo) : super(const OwnerState());

  final OwnerRepository _repo;

  Future<void> load() async {
    emit(state.copyWith(status: OwnerStatus.loading, error: null));
    try {
      final dashboard = await _repo.dashboard();
      final applications =
          await _repo.applications().catchError((_) => <OwnerApplication>[]);
      final vouchers = await _repo.vouchers().catchError((_) => <Voucher>[]);
      final fraud = await _repo.fraudList().catchError((_) => <FraudListEntry>[]);
      final support =
          await _repo.supportTickets().catchError((_) => <SupportTicket>[]);
      emit(state.copyWith(
        status: OwnerStatus.ready,
        dashboard: dashboard,
        applications: applications,
        vouchers: vouchers,
        fraudList: fraud,
        supportTickets: support,
      ));
    } on ApiException catch (e) {
      emit(state.copyWith(status: OwnerStatus.error, error: e.message));
    }
  }

  Future<void> approve(String id) async {
    await _repo.approveApplication(id);
    await load();
  }

  Future<void> reject(String id, String reason) async {
    await _repo.rejectApplication(id, reason);
    await load();
  }

  Future<void> createVoucher(String code, double discount) async {
    await _repo.createVoucher(code, discount);
    await load();
  }

  Future<void> deleteVoucher(String id) async {
    await _repo.deleteVoucher(id);
    await load();
  }

  Future<void> createSupportTicket(Map<String, dynamic> payload) async {
    await _repo.createSupportTicket(payload);
    await load();
  }

  Future<void> createItem(Map<String, dynamic> payload) async {
    await _repo.createItem(payload);
    await load();
  }

  Future<void> updateItem(String id, Map<String, dynamic> payload) async {
    await _repo.updateItem(id, payload);
    await load();
  }

  Future<void> deleteItem(String id) async {
    await _repo.deleteItem(id);
    await load();
  }

  Future<void> updateStoreProfile(Map<String, dynamic> payload) async {
    await _repo.updateStoreProfile(payload);
    await load();
  }
}
