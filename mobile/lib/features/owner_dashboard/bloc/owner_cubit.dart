import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/network/api_exception.dart';
import '../../../data/models/content.dart';
import '../../../data/models/dashboard.dart';
import '../../../data/models/order.dart';
import '../../../data/models/rental_form.dart';
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
    this.rentalForm,
    this.error,
  });

  final OwnerStatus status;
  final OwnerDashboardData? dashboard;
  final List<OwnerApplication> applications;
  final List<Voucher> vouchers;
  final List<FraudListEntry> fraudList;
  final List<SupportTicket> supportTickets;
  final RentalFormSchema? rentalForm;
  final String? error;

  OwnerState copyWith({
    OwnerStatus? status,
    OwnerDashboardData? dashboard,
    List<OwnerApplication>? applications,
    List<Voucher>? vouchers,
    List<FraudListEntry>? fraudList,
    List<SupportTicket>? supportTickets,
    RentalFormSchema? rentalForm,
    String? error,
  }) =>
      OwnerState(
        status: status ?? this.status,
        dashboard: dashboard ?? this.dashboard,
        applications: applications ?? this.applications,
        vouchers: vouchers ?? this.vouchers,
        fraudList: fraudList ?? this.fraudList,
        supportTickets: supportTickets ?? this.supportTickets,
        rentalForm: rentalForm ?? this.rentalForm,
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
        rentalForm?.fields.length,
        error,
      ];
}

class OwnerCubit extends Cubit<OwnerState> {
  OwnerCubit(this._repo) : super(const OwnerState());

  final OwnerRepository _repo;

  Future<void> load({bool forceRefresh = false}) async {
    emit(state.copyWith(status: OwnerStatus.loading, error: null));
    try {
      final dashboard = await _repo.dashboard(forceRefresh: forceRefresh);
      final applications = await _repo
          .applications(forceRefresh: forceRefresh)
          .catchError((_) => <OwnerApplication>[]);
      final vouchers = await _repo
          .vouchers(forceRefresh: forceRefresh)
          .catchError((_) => <Voucher>[]);
      final fraud = await _repo
          .fraudList(forceRefresh: forceRefresh)
          .catchError((_) => <FraudListEntry>[]);
      final support = await _repo
          .supportTickets(forceRefresh: forceRefresh)
          .catchError((_) => <SupportTicket>[]);
      final form = await _repo.rentalForm(forceRefresh: forceRefresh).catchError(
          (_) => const RentalFormSchema(standardVersion: '', fields: []));
      emit(state.copyWith(
        status: OwnerStatus.ready,
        dashboard: dashboard,
        applications: applications,
        vouchers: vouchers,
        fraudList: fraud,
        supportTickets: support,
        rentalForm: form,
      ));
    } on ApiException catch (e) {
      emit(state.copyWith(status: OwnerStatus.error, error: e.message));
    }
  }

  Future<void> approve(String id) async {
    await _repo.approveApplication(id);
    await load(forceRefresh: true);
  }

  Future<void> reject(String id, String reason) async {
    await _repo.rejectApplication(id, reason);
    await load(forceRefresh: true);
  }

  Future<void> complete(String id) async {
    await _repo.completeApplication(id);
    await load(forceRefresh: true);
  }

  Future<void> createVoucher(String code, double discount) async {
    await _repo.createVoucher(code, discount);
    await load(forceRefresh: true);
  }

  Future<void> deleteVoucher(String id) async {
    await _repo.deleteVoucher(id);
    await load(forceRefresh: true);
  }

  Future<void> createSupportTicket(Map<String, dynamic> payload) async {
    await _repo.createSupportTicket(payload);
    await load(forceRefresh: true);
  }

  Future<void> createItem(Map<String, dynamic> payload) async {
    await _repo.createItem(payload);
    await load(forceRefresh: true);
  }

  Future<void> updateItem(String id, Map<String, dynamic> payload) async {
    await _repo.updateItem(id, payload);
    await load(forceRefresh: true);
  }

  Future<void> deleteItem(String id) async {
    await _repo.deleteItem(id);
    await load(forceRefresh: true);
  }

  Future<void> updateStoreProfile(Map<String, dynamic> payload) async {
    await _repo.updateStoreProfile(payload);
    await load(forceRefresh: true);
  }

  Future<void> saveRentalForm(List<RentalFormField> fields,
      {Map<String, dynamic>? settings}) async {
    await _repo.updateRentalForm({
      'fields': fields
          .map((f) => {
                'id': f.id,
                'label': f.label,
                'type': f.type.name,
                'required': f.required,
                'placeholder': f.placeholder,
                'options': f.options,
              })
          .toList(),
      if (settings != null) 'settings': settings,
    });
    final form = await _repo.rentalForm(forceRefresh: true);
    emit(state.copyWith(rentalForm: form));
  }

  Future<void> addManualBlock({
    required String itemId,
    required String startDate,
    required String endDate,
    required String reason,
  }) =>
      _repo.addManualBlock(
        itemId: itemId,
        startDate: startDate,
        endDate: endDate,
        reason: reason,
      );

  Future<void> deleteManualBlock(String id) => _repo.deleteManualBlock(id);

  Future<void> reportFraud(Map<String, dynamic> payload) async {
    await _repo.reportFraud(payload);
    await load(forceRefresh: true);
  }
}
