import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../../../app/theme.dart';
import '../../../core/widgets/app_widgets.dart';
import '../../../data/models/store.dart';
import '../bloc/admin_cubit.dart';

/// Philippines centroid — fallback map view when no store has coordinates.
const _philippinesCenter = LatLng(12.8797, 121.7740);

class _StorePin {
  const _StorePin({
    required this.store,
    required this.point,
    required this.label,
  });

  final Store store;
  final LatLng point;
  final String label;
}

/// Super-admin map of every registered store (main location + branches),
/// each pin labelled with the store name. OpenStreetMap tiles, no API key.
class AdminStoreMapTab extends StatelessWidget {
  const AdminStoreMapTab({super.key, required this.state});
  final AdminState state;

  List<_StorePin> _collectPins() {
    final pins = <_StorePin>[];
    for (final store in state.dashboard?.allStores ?? const <Store>[]) {
      if (store.locationLat != null && store.locationLng != null) {
        pins.add(_StorePin(
          store: store,
          point: LatLng(store.locationLat!, store.locationLng!),
          label: store.name,
        ));
      }
      for (final branch in store.branches) {
        if (branch.locationLat == null || branch.locationLng == null) continue;
        final branchName = (branch.name ?? '').trim();
        pins.add(_StorePin(
          store: store,
          point: LatLng(branch.locationLat!, branch.locationLng!),
          label: branchName.isEmpty || branchName == store.name
              ? store.name
              : '${store.name} · $branchName',
        ));
      }
    }
    return pins;
  }

  @override
  Widget build(BuildContext context) {
    final pins = _collectPins();
    if (pins.isEmpty) {
      return const EmptyState(
        title: 'No store locations yet',
        message: 'Stores appear on the map once they have a pinned location.',
        icon: Icons.map_outlined,
      );
    }

    return Stack(
      children: [
        FlutterMap(
          options: MapOptions(
            initialCameraFit: pins.length == 1
                ? CameraFit.coordinates(
                    coordinates: [pins.first.point], minZoom: 6, maxZoom: 14)
                : CameraFit.coordinates(
                    coordinates: pins.map((p) => p.point).toList(),
                    padding: const EdgeInsets.all(48),
                    maxZoom: 15,
                  ),
            initialCenter: _philippinesCenter,
            initialZoom: 5.5,
          ),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'com.camrent.mobile',
            ),
            MarkerLayer(
              markers: pins
                  .map((pin) => Marker(
                        point: pin.point,
                        width: 150,
                        height: 64,
                        alignment: Alignment.topCenter,
                        child: GestureDetector(
                          onTap: () => _showStoreSheet(context, pin),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppColors.surface,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: AppColors.border),
                                  boxShadow: const [
                                    BoxShadow(
                                        color: AppColors.shadow,
                                        blurRadius: 4,
                                        offset: Offset(0, 2)),
                                  ],
                                ),
                                child: Text(
                                  pin.label,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.text),
                                ),
                              ),
                              Icon(
                                Icons.location_pin,
                                size: 30,
                                color: pin.store.isActive &&
                                        pin.store.status == 'approved'
                                    ? AppColors.danger
                                    : AppColors.textMuted,
                              ),
                            ],
                          ),
                        ),
                      ))
                  .toList(),
            ),
          ],
        ),
        // OSM attribution (required by the tile usage policy).
        Positioned(
          right: 6,
          bottom: 6,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: AppColors.surface.withValues(alpha: 0.85),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text('© OpenStreetMap contributors',
                style: TextStyle(fontSize: 10, color: AppColors.textMuted)),
          ),
        ),
        Positioned(
          left: 12,
          top: 12,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.border),
            ),
            child: Text(
              '${pins.length} store location${pins.length == 1 ? '' : 's'}',
              style:
                  const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
            ),
          ),
        ),
      ],
    );
  }

  void _showStoreSheet(BuildContext context, _StorePin pin) {
    final store = pin.store;
    showModalBottomSheet(
      context: context,
      showDragHandle: true,
      builder: (sheetContext) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  RemoteImage(
                    url: store.logoUrl,
                    width: 44,
                    height: 44,
                    borderRadius: BorderRadius.circular(22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(pin.label,
                            style: const TextStyle(
                                fontSize: 16, fontWeight: FontWeight.w800)),
                        Text(store.address,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                                fontSize: 12, color: AppColors.textMuted)),
                      ],
                    ),
                  ),
                  StatusBadge(
                    store.isActive ? store.status : 'suspended',
                    color: store.isActive
                        ? statusColor(store.status)
                        : AppColors.danger,
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(Icons.star, size: 14, color: AppColors.accent),
                  const SizedBox(width: 4),
                  Text(store.rating.toStringAsFixed(1)),
                  const SizedBox(width: 16),
                  Icon(Icons.place_outlined,
                      size: 14, color: AppColors.textMuted),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      '${pin.point.latitude.toStringAsFixed(5)}, ${pin.point.longitude.toStringAsFixed(5)}',
                      style: TextStyle(
                          fontSize: 12, color: AppColors.textMuted),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
