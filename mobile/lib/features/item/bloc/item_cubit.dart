import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/network/api_exception.dart';
import '../../../data/models/item.dart';
import '../../../data/repositories/catalog_repository.dart';

enum ItemStatus { loading, ready, error }

class ItemState extends Equatable {
  const ItemState({this.status = ItemStatus.loading, this.item, this.error});

  final ItemStatus status;
  final Item? item;
  final String? error;

  ItemState copyWith({ItemStatus? status, Item? item, String? error}) =>
      ItemState(
        status: status ?? this.status,
        item: item ?? this.item,
        error: error,
      );

  @override
  List<Object?> get props => [status, item?.id, error];
}

class ItemCubit extends Cubit<ItemState> {
  ItemCubit(this._repo) : super(const ItemState());

  final CatalogRepository _repo;

  Future<void> load(String id) async {
    emit(const ItemState(status: ItemStatus.loading));
    try {
      emit(state.copyWith(status: ItemStatus.ready, item: await _repo.item(id)));
    } on ApiException catch (e) {
      emit(state.copyWith(status: ItemStatus.error, error: e.message));
    }
  }
}
