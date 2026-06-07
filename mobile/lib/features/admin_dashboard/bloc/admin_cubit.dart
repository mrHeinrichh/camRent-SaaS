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
    this.donationSettings,
    this.announcementsEnabled = true,
    this.error,
  });

  final AdminStatus status;
  final AdminDashboardData? dashboard;
  final List<FraudListEntry> fraudList;
  final List<SupportTicket> supportTickets;
  final List<Announcement> announcements;
  final DonationSettings? donationSettings;
  final bool announcementsEnabled;
  final String? error;

  AdminState copyWith({
    AdminStatus? status,
    AdminDashboardData? dashboard,
    List<FraudListEntry>? fraudList,
    List<SupportTicket>? supportTickets,
    List<Announcement>? announcements,
    DonationSettings? donationSettings,
    bool? announcementsEnabled,
    String? error,
  }) =>
      AdminState(
        status: status ?? this.status,
        dashboard: dashboard ?? this.dashboard,
        fraudList: fraudList ?? this.fraudList,
        supportTickets: supportTickets ?? this.supportTickets,
        announcements: announcements ?? this.announcements,
        donationSettings: donationSettings ?? this.donationSettings,
        announcementsEnabled: announcementsEnabled ?? this.announcementsEnabled,
        error: error,
      );

  @override
  List<Object?> get props => [
        status,
        dashboard?.summary,
        fraudList,
        supportTickets,
        announcements,
        donationSettings?.message,
        announcementsEnabled,
        error,
      ];
}

class AdminCubit extends Cubit<AdminState> {
  AdminCubit(this._repo) : super(const AdminState());

  final AdminRepository _repo;

  Future<void> load({bool forceRefresh = false}) async {
    emit(state.copyWith(status: AdminStatus.loading, error: null));
    try {
      final dashboard = await _repo.dashboard(forceRefresh: forceRefresh);
      final fraud = await _repo
          .fraudList(forceRefresh: forceRefresh)
          .catchError((_) => <FraudListEntry>[]);
      final support = await _repo
          .supportTickets(forceRefresh: forceRefresh)
          .catchError((_) => <SupportTicket>[]);
      final announcements = await _repo
          .announcements(forceRefresh: forceRefresh)
          .catchError((_) => <Announcement>[]);
      final donation = await _repo
          .donationSettings(forceRefresh: forceRefresh)
          .catchError((_) => const DonationSettings());
      final annEnabled = await _repo
          .announcementSettings(forceRefresh: forceRefresh)
          .catchError((_) => true);
      emit(state.copyWith(
        status: AdminStatus.ready,
        dashboard: dashboard,
        fraudList: fraud,
        supportTickets: support,
        announcements: announcements,
        donationSettings: donation,
        announcementsEnabled: annEnabled,
      ));
    } on ApiException catch (e) {
      emit(state.copyWith(status: AdminStatus.error, error: e.message));
    }
  }

  Future<void> _run(Future<void> Function() action) async {
    await action();
    await load(forceRefresh: true);
  }

  // Stores
  Future<void> approveStore(String id) => _run(() => _repo.approveStore(id));
  Future<void> setStoreActive(String id, bool active) =>
      _run(() => _repo.setStoreActive(id, active));
  Future<void> deleteStore(String id, String pw) =>
      _run(() => _repo.deleteStore(id, pw));

  // Customers
  Future<void> setCustomerActive(String id, bool active) =>
      _run(() => _repo.setCustomerActive(id, active));
  Future<void> deleteUser(String id, String pw) =>
      _run(() => _repo.deleteUser(id, pw));

  // Fraud
  Future<void> createFraud(Map<String, dynamic> p) =>
      _run(() => _repo.createFraud(p));
  Future<void> updateFraud(String id, Map<String, dynamic> p) =>
      _run(() => _repo.updateFraud(id, p));
  Future<void> deleteFraud(String id) => _run(() => _repo.deleteFraud(id));
  Future<void> globalizeFraud(String id) =>
      _run(() => _repo.globalizeFraud(id));
  Future<void> approveGlobalFraud(String id) =>
      _run(() => _repo.approveGlobalFraud(id));

  // Support
  Future<void> replySupport(String id, String reply, String status) =>
      _run(() => _repo.replySupportTicket(id, reply, status));
  Future<void> deleteSupport(String id) =>
      _run(() => _repo.deleteSupportTicket(id));

  // Announcements
  Future<void> createAnnouncement(Map<String, dynamic> p) =>
      _run(() => _repo.createAnnouncement(p));
  Future<void> updateAnnouncement(String id, Map<String, dynamic> p) =>
      _run(() => _repo.updateAnnouncement(id, p));
  Future<void> deleteAnnouncement(String id) =>
      _run(() => _repo.deleteAnnouncement(id));
  Future<void> setAnnouncementsEnabled(bool v) =>
      _run(() => _repo.updateAnnouncementSettings(v));

  // Donations
  Future<void> updateDonation(Map<String, dynamic> p) =>
      _run(() => _repo.updateDonationSettings(p));

  // Site content
  Future<Map<String, dynamic>> siteContentRaw() => _repo.siteContentRaw();
  Future<void> updateSiteContent(Map<String, dynamic> p) =>
      _run(() => _repo.updateSiteContent(p));
}
