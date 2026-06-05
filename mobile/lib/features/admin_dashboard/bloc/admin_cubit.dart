import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/network/api_exception.dart';
import '../../../data/models/content.dart';
import '../../../data/models/dashboard.dart';
import '../../../data/repositories/admin_repository.dart';

enum AdminStatus { loading, ready, error }

class AdminState extends Equatable {
  const AdminState({
    this.status = AdminStatus.loading,
    this.dashboard,
    this.fraudList = const [],
    this.supportTickets = const [],
    this.announcements = const [],
    this.error,
  });

  final AdminStatus status;
  final AdminDashboardData? dashboard;
  final List<FraudListEntry> fraudList;
  final List<SupportTicket> supportTickets;
  final List<Announcement> announcements;
  final String? error;

  AdminState copyWith({
    AdminStatus? status,
    AdminDashboardData? dashboard,
    List<FraudListEntry>? fraudList,
    List<SupportTicket>? supportTickets,
    List<Announcement>? announcements,
    String? error,
  }) =>
      AdminState(
        status: status ?? this.status,
        dashboard: dashboard ?? this.dashboard,
        fraudList: fraudList ?? this.fraudList,
        supportTickets: supportTickets ?? this.supportTickets,
        announcements: announcements ?? this.announcements,
        error: error,
      );

  @override
  List<Object?> get props =>
      [status, dashboard?.summary, fraudList, supportTickets, announcements, error];
}

class AdminCubit extends Cubit<AdminState> {
  AdminCubit(this._repo) : super(const AdminState());

  final AdminRepository _repo;

  Future<void> load({bool forceRefresh = false}) async {
    emit(state.copyWith(status: AdminStatus.loading, error: null));
    try {
      final dashboard = await _repo.dashboard(forceRefresh: forceRefresh);
      final fraud = await _repo.fraudList().catchError((_) => <FraudListEntry>[]);
      final support =
          await _repo.supportTickets().catchError((_) => <SupportTicket>[]);
      final announcements =
          await _repo.announcements().catchError((_) => <Announcement>[]);
      emit(state.copyWith(
        status: AdminStatus.ready,
        dashboard: dashboard,
        fraudList: fraud,
        supportTickets: support,
        announcements: announcements,
      ));
    } on ApiException catch (e) {
      emit(state.copyWith(status: AdminStatus.error, error: e.message));
    }
  }

  Future<void> approveStore(String id) async {
    await _repo.approveStore(id);
    await load(forceRefresh: true);
  }

  Future<void> suspendStore(String id) async {
    await _repo.suspendStore(id);
    await load(forceRefresh: true);
  }

  Future<void> replySupport(String id, String reply, String status) async {
    await _repo.replySupportTicket(id, reply, status);
    await load(forceRefresh: true);
  }
}
