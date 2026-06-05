import 'dart:math' as math;

import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:geolocator/geolocator.dart';

import '../../../core/constants/home_constants.dart';
import '../../../core/network/api_exception.dart';
import '../../../data/models/content.dart';
import '../../../data/models/item.dart';
import '../../../data/models/store.dart';
import '../../../data/repositories/catalog_repository.dart';

enum HomeStatus { initial, loading, ready, error }

enum ViewMode { gears, stores }

enum SortMode { defaultOrder, storeAz, storeZa }

class HomeState extends Equatable {
  const HomeState({
    this.status = HomeStatus.initial,
    this.items = const [],
    this.stores = const [],
    this.announcements = const [],
    this.content = SiteContent.fallback,
    this.query = '',
    this.viewMode = ViewMode.gears,
    this.category = kAllGear,
    this.brand = kAllBrands,
    this.minRating = 0,
    this.sortMode = SortMode.defaultOrder,
    this.nearMeOnly = false,
    this.locating = false,
    this.userLat,
    this.userLng,
    this.error,
  });

  final HomeStatus status;
  final List<Item> items;
  final List<Store> stores;
  final List<Announcement> announcements;
  final SiteContent content;
  final String query;
  final ViewMode viewMode;
  final String category;
  final String brand;
  final double minRating;
  final SortMode sortMode;
  final bool nearMeOnly;
  final bool locating;
  final double? userLat;
  final double? userLng;
  final String? error;

  int get storeCount => stores.length;
  int get gearCount => items.length;

  List<String> get availableCategories {
    final set = <String>{};
    for (final item in items) {
      final c = item.category.trim();
      if (c.isNotEmpty) set.add(c);
    }
    return [kAllGear, ...set];
  }

  static String _normBrand(String value) =>
      (value.isEmpty ? 'Others' : value).toLowerCase().replaceAll(RegExp(r'\s+'), '');

  static final Set<String> _knownBrands = kBrandOptions
      .where((b) => b != 'All Brands' && b != 'Others')
      .map(_normBrand)
      .toSet();

  static double _distanceKm(double aLat, double aLng, double bLat, double bLng) {
    double toRad(double v) => v * math.pi / 180;
    const r = 6371.0;
    final dLat = toRad(bLat - aLat);
    final dLng = toRad(bLng - aLng);
    final x = math.pow(math.sin(dLat / 2), 2) +
        math.cos(toRad(aLat)) *
            math.cos(toRad(bLat)) *
            math.pow(math.sin(dLng / 2), 2);
    return r * 2 * math.atan2(math.sqrt(x), math.sqrt(1 - x));
  }

  bool _matchesNearMe(List<({double? lat, double? lng})> candidates) {
    if (!nearMeOnly) return true;
    if (userLat == null || userLng == null) return false;
    for (final c in candidates) {
      if (c.lat == null || c.lng == null) continue;
      if (_distanceKm(userLat!, userLng!, c.lat!, c.lng!) <= 25) return true;
    }
    return false;
  }

  List<Item> get filteredGears {
    final q = query.trim().toLowerCase();
    return items.where((gear) {
      final brandValue = gear.brand ?? 'Others';
      final matchesSearch = q.isEmpty ||
          '${gear.name} ${gear.description} ${gear.category} $brandValue ${gear.store?.name ?? ''}'
              .toLowerCase()
              .contains(q);
      final matchesCategory = category == kAllGear ||
          gear.category.toLowerCase() == category.toLowerCase();
      final matchesBrand = brand == kAllBrands
          ? true
          : brand == 'Others'
              ? !_knownBrands.contains(_normBrand(brandValue)) ||
                  _normBrand(brandValue) == 'others'
              : _normBrand(brandValue).contains(_normBrand(brand));
      final matchesRating = (gear.store?.rating ?? 0) >= minRating;
      final near = _matchesNearMe([
        (lat: gear.store?.locationLat, lng: gear.store?.locationLng),
      ]);
      return matchesSearch &&
          matchesCategory &&
          matchesBrand &&
          matchesRating &&
          near;
    }).toList();
  }

  List<Store> get filteredStores {
    final q = query.trim().toLowerCase();
    final filtered = stores.where((store) {
      final matchesSearch = q.isEmpty ||
          '${store.name} ${store.address} ${store.description}'
              .toLowerCase()
              .contains(q);
      final matchesRating = store.rating >= minRating;
      final near = _matchesNearMe([
        (lat: store.locationLat, lng: store.locationLng),
        ...store.branches
            .map((b) => (lat: b.locationLat, lng: b.locationLng)),
      ]);
      return matchesSearch && matchesRating && near;
    }).toList();
    if (sortMode == SortMode.storeAz) {
      filtered.sort((a, b) => a.name.compareTo(b.name));
    } else if (sortMode == SortMode.storeZa) {
      filtered.sort((a, b) => b.name.compareTo(a.name));
    }
    return filtered;
  }

  HomeState copyWith({
    HomeStatus? status,
    List<Item>? items,
    List<Store>? stores,
    List<Announcement>? announcements,
    SiteContent? content,
    String? query,
    ViewMode? viewMode,
    String? category,
    String? brand,
    double? minRating,
    SortMode? sortMode,
    bool? nearMeOnly,
    bool? locating,
    double? userLat,
    double? userLng,
    String? error,
  }) =>
      HomeState(
        status: status ?? this.status,
        items: items ?? this.items,
        stores: stores ?? this.stores,
        announcements: announcements ?? this.announcements,
        content: content ?? this.content,
        query: query ?? this.query,
        viewMode: viewMode ?? this.viewMode,
        category: category ?? this.category,
        brand: brand ?? this.brand,
        minRating: minRating ?? this.minRating,
        sortMode: sortMode ?? this.sortMode,
        nearMeOnly: nearMeOnly ?? this.nearMeOnly,
        locating: locating ?? this.locating,
        userLat: userLat ?? this.userLat,
        userLng: userLng ?? this.userLng,
        error: error,
      );

  @override
  List<Object?> get props => [
        status,
        items,
        stores,
        announcements,
        query,
        viewMode,
        category,
        brand,
        minRating,
        sortMode,
        nearMeOnly,
        locating,
        userLat,
        userLng,
        error,
      ];
}

class HomeCubit extends Cubit<HomeState> {
  HomeCubit(this._repo) : super(const HomeState());

  final CatalogRepository _repo;

  Future<void> load({bool forceRefresh = false}) async {
    emit(state.copyWith(status: HomeStatus.loading, error: null));
    try {
      final results = await Future.wait([
        _repo.feed(forceRefresh: forceRefresh),
        _repo.stores(forceRefresh: forceRefresh),
        _repo.siteContent(forceRefresh: forceRefresh),
        _repo.announcements(forceRefresh: forceRefresh)
            .catchError((_) => <Announcement>[]),
      ]);
      emit(state.copyWith(
        status: HomeStatus.ready,
        items: results[0] as List<Item>,
        stores: results[1] as List<Store>,
        content: results[2] as SiteContent,
        announcements: results[3] as List<Announcement>,
      ));
    } on ApiException catch (e) {
      emit(state.copyWith(status: HomeStatus.error, error: e.message));
    }
  }

  void setQuery(String value) => emit(state.copyWith(query: value));
  void clearSearch() => emit(state.copyWith(query: ''));
  void setViewMode(ViewMode mode) => emit(state.copyWith(viewMode: mode));
  void setCategory(String value) => emit(state.copyWith(category: value));
  void setBrand(String value) => emit(state.copyWith(brand: value));
  void setMinRating(double value) => emit(state.copyWith(minRating: value));
  void setSortMode(SortMode value) => emit(state.copyWith(sortMode: value));

  /// Toggles the "Near me" filter, requesting device location on first enable.
  Future<void> toggleNearMe() async {
    if (state.nearMeOnly) {
      emit(state.copyWith(nearMeOnly: false));
      return;
    }
    if (state.userLat != null && state.userLng != null) {
      emit(state.copyWith(nearMeOnly: true));
      return;
    }
    emit(state.copyWith(locating: true, error: null));
    try {
      if (!await Geolocator.isLocationServiceEnabled()) {
        emit(state.copyWith(locating: false, error: 'Location services are disabled.'));
        return;
      }
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        emit(state.copyWith(locating: false, error: 'Location permission denied.'));
        return;
      }
      final pos = await Geolocator.getCurrentPosition();
      emit(state.copyWith(
        locating: false,
        nearMeOnly: true,
        userLat: pos.latitude,
        userLng: pos.longitude,
      ));
    } catch (_) {
      emit(state.copyWith(locating: false, error: 'Unable to get your location.'));
    }
  }
}
