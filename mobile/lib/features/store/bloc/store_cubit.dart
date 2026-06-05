import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/network/api_exception.dart';
import '../../../data/models/item.dart';
import '../../../data/models/store.dart';
import '../../../data/repositories/catalog_repository.dart';

enum StoreStatus { loading, ready, error }

class StoreState extends Equatable {
  const StoreState({
    this.status = StoreStatus.loading,
    this.store,
    this.items = const [],
    this.reviews = const [],
    this.eligibleToReview = false,
    this.error,
  });

  final StoreStatus status;
  final Store? store;
  final List<Item> items;
  final List<StoreReview> reviews;
  final bool eligibleToReview;
  final String? error;

  StoreState copyWith({
    StoreStatus? status,
    Store? store,
    List<Item>? items,
    List<StoreReview>? reviews,
    bool? eligibleToReview,
    String? error,
  }) =>
      StoreState(
        status: status ?? this.status,
        store: store ?? this.store,
        items: items ?? this.items,
        reviews: reviews ?? this.reviews,
        eligibleToReview: eligibleToReview ?? this.eligibleToReview,
        error: error,
      );

  @override
  List<Object?> get props =>
      [status, store?.id, items, reviews, eligibleToReview, error];
}

class StoreCubit extends Cubit<StoreState> {
  StoreCubit(this._repo) : super(const StoreState());

  final CatalogRepository _repo;

  Future<void> load(String storeId) async {
    emit(const StoreState(status: StoreStatus.loading));
    try {
      final store = await _repo.store(storeId);
      final feed = await _repo.feed();
      final reviews = await _repo.reviews(storeId).catchError((_) => <StoreReview>[]);
      bool eligible = false;
      try {
        eligible = await _repo.reviewEligibility(storeId);
      } catch (_) {}
      emit(state.copyWith(
        status: StoreStatus.ready,
        store: store,
        items: feed.where((item) => item.storeId == storeId).toList(),
        reviews: reviews,
        eligibleToReview: eligible,
      ));
    } on ApiException catch (e) {
      emit(state.copyWith(status: StoreStatus.error, error: e.message));
    }
  }

  Future<bool> submitReview(int rating, String description) async {
    if (state.store == null) return false;
    try {
      await _repo.submitReview(state.store!.id,
          rating: rating, description: description);
      await load(state.store!.id);
      return true;
    } on ApiException {
      return false;
    }
  }
}
