import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../app/theme.dart';
import '../../../core/constants/home_constants.dart';
import '../bloc/home_cubit.dart';

/// Compact, modern home controls: a Gears/Stores segmented toggle plus a single
/// "Filters" button (with an active-count badge) that opens a bottom sheet —
/// instead of a row of scattered chips. Active filters are summarised as small
/// removable chips below.
class HomeControlsBar extends StatelessWidget {
  const HomeControlsBar({super.key, required this.state});
  final HomeState state;

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<HomeCubit>();
    final isGears = state.viewMode == ViewMode.gears;
    final count = state.activeFilterCount;

    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: _Segmented(
                  isGears: isGears,
                  onChanged: (g) => cubit.setViewMode(
                      g ? ViewMode.gears : ViewMode.stores),
                ),
              ),
              const SizedBox(width: 10),
              _FiltersButton(
                count: count,
                onTap: () => showHomeFilters(context),
              ),
            ],
          ),
          _ActiveFilterChips(state: state),
        ],
      ),
    );
  }
}

class _Segmented extends StatelessWidget {
  const _Segmented({required this.isGears, required this.onChanged});
  final bool isGears;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 56,
      padding: const EdgeInsets.all(5),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          _seg('Gears', Icons.photo_camera_outlined, isGears,
              () => onChanged(true)),
          _seg('Stores', Icons.storefront_outlined, !isGears,
              () => onChanged(false)),
        ],
      ),
    );
  }

  Widget _seg(String label, IconData icon, bool selected, VoidCallback onTap) {
    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
          height: double.infinity,
          decoration: BoxDecoration(
            color: selected ? AppColors.accent : Colors.transparent,
            borderRadius: BorderRadius.circular(999),
            boxShadow: selected
                ? const [
                    BoxShadow(
                        color: AppColors.shadow,
                        blurRadius: 8,
                        offset: Offset(0, 2))
                  ]
                : null,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon,
                  size: 20,
                  color: selected ? AppColors.accentText : AppColors.textMuted),
              const SizedBox(width: 8),
              Text(label,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color:
                        selected ? AppColors.accentText : AppColors.textMuted,
                  )),
            ],
          ),
        ),
      ),
    );
  }
}

class _FiltersButton extends StatelessWidget {
  const _FiltersButton({required this.count, required this.onTap});
  final int count;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 56,
        padding: const EdgeInsets.symmetric(horizontal: 18),
        decoration: BoxDecoration(
          color: count > 0 ? AppColors.accent : AppColors.surface,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
              color: count > 0 ? AppColors.accent : AppColors.border),
        ),
        child: Row(
          children: [
            Icon(Icons.tune,
                size: 20,
                color: count > 0 ? AppColors.accentText : AppColors.text),
            const SizedBox(width: 8),
            Text('Filters',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: count > 0 ? AppColors.accentText : AppColors.text,
                )),
            if (count > 0) ...[
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.all(5),
                decoration: const BoxDecoration(
                    color: AppColors.accentText, shape: BoxShape.circle),
                constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                alignment: Alignment.center,
                child: Text('$count',
                    style: const TextStyle(
                        color: AppColors.accent,
                        fontSize: 10,
                        fontWeight: FontWeight.w800)),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _ActiveFilterChips extends StatelessWidget {
  const _ActiveFilterChips({required this.state});
  final HomeState state;

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<HomeCubit>();
    final chips = <Widget>[];

    void chip(String label, VoidCallback onClear) {
      chips.add(Padding(
        padding: const EdgeInsets.only(right: 8),
        child: InputChip(
          label: Text(label, style: const TextStyle(fontSize: 12)),
          onDeleted: onClear,
          deleteIcon: const Icon(Icons.close, size: 15),
          visualDensity: VisualDensity.compact,
          materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
        ),
      ));
    }

    if (state.viewMode == ViewMode.gears) {
      if (state.category != kAllGear) {
        chip(state.category, () => cubit.setCategory(kAllGear));
      }
      if (state.brand != kAllBrands) {
        chip(state.brand, () => cubit.setBrand(kAllBrands));
      }
    } else if (state.sortMode != SortMode.defaultOrder) {
      chip(state.sortMode == SortMode.storeAz ? 'A–Z' : 'Z–A',
          () => cubit.setSortMode(SortMode.defaultOrder));
    }
    if (state.minRating > 0) {
      chip('${state.minRating}★', () => cubit.setMinRating(0));
    }
    if (state.nearMeOnly) {
      chip('Near me', () => cubit.toggleNearMe());
    }

    if (chips.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: SizedBox(
        height: 34,
        child: ListView(scrollDirection: Axis.horizontal, children: chips),
      ),
    );
  }
}

/// Modal bottom sheet holding all filter controls.
void showHomeFilters(BuildContext context) {
  final cubit = context.read<HomeCubit>();
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
    ),
    builder: (_) => BlocProvider.value(
      value: cubit,
      child: const _FiltersSheet(),
    ),
  );
}

class _FiltersSheet extends StatelessWidget {
  const _FiltersSheet();

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<HomeCubit>();
    return BlocBuilder<HomeCubit, HomeState>(
      builder: (context, state) {
        final isGears = state.viewMode == ViewMode.gears;
        return Padding(
          padding: EdgeInsets.only(
            left: 18,
            right: 18,
            top: 14,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                        color: AppColors.border,
                        borderRadius: BorderRadius.circular(2)),
                  ),
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    const Text('Filters',
                        style: TextStyle(
                            fontSize: 18, fontWeight: FontWeight.bold)),
                    const Spacer(),
                    TextButton(
                      onPressed: cubit.resetFilters,
                      child: const Text('Reset all'),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                if (isGears) ...[
                  _label('Category'),
                  _Dropdown<String>(
                    value: state.availableCategories.contains(state.category)
                        ? state.category
                        : kAllGear,
                    items: state.availableCategories
                        .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                        .toList(),
                    onChanged: (v) => cubit.setCategory(v ?? kAllGear),
                  ),
                  const SizedBox(height: 14),
                  _label('Brand'),
                  _Dropdown<String>(
                    value: kBrandOptions.contains(state.brand)
                        ? state.brand
                        : kAllBrands,
                    items: kBrandOptions
                        .map((b) => DropdownMenuItem(value: b, child: Text(b)))
                        .toList(),
                    onChanged: (v) => cubit.setBrand(v ?? kAllBrands),
                  ),
                ] else ...[
                  _label('Sort stores'),
                  _Dropdown<SortMode>(
                    value: state.sortMode,
                    items: const [
                      DropdownMenuItem(
                          value: SortMode.defaultOrder,
                          child: Text('Show all stores')),
                      DropdownMenuItem(
                          value: SortMode.storeAz,
                          child: Text('Store name A–Z')),
                      DropdownMenuItem(
                          value: SortMode.storeZa,
                          child: Text('Store name Z–A')),
                    ],
                    onChanged: (v) =>
                        cubit.setSortMode(v ?? SortMode.defaultOrder),
                  ),
                ],
                const SizedBox(height: 16),
                _label('Minimum rating'),
                Wrap(
                  spacing: 8,
                  children: [
                    _ratingChip(context, 'Any', 0, state.minRating),
                    _ratingChip(context, '3.0+', 3, state.minRating),
                    _ratingChip(context, '3.5+', 3.5, state.minRating),
                    _ratingChip(context, '4.0+', 4, state.minRating),
                    _ratingChip(context, '4.5+', 4.5, state.minRating),
                  ],
                ),
                const SizedBox(height: 8),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  secondary: const Icon(Icons.location_on_outlined),
                  title: const Text('Near me'),
                  subtitle: Text(
                    state.locating
                        ? 'Getting your location…'
                        : 'Show gear/stores within 25 km',
                    style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                  ),
                  value: state.nearMeOnly,
                  activeThumbColor: AppColors.accent,
                  onChanged: (_) => cubit.toggleNearMe(),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Show results'),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _label(String t) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Text(t,
            style: const TextStyle(
                fontWeight: FontWeight.w700, fontSize: 13.5)),
      );

  Widget _ratingChip(
      BuildContext context, String label, double value, double current) {
    final selected = current == value;
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => context.read<HomeCubit>().setMinRating(value),
    );
  }
}

class _Dropdown<T> extends StatelessWidget {
  const _Dropdown(
      {required this.value, required this.items, required this.onChanged});
  final T value;
  final List<DropdownMenuItem<T>> items;
  final ValueChanged<T?> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(
        color: AppColors.surfaceSoft,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<T>(
          value: value,
          isExpanded: true,
          borderRadius: BorderRadius.circular(14),
          style: TextStyle(fontSize: 14, color: AppColors.text),
          dropdownColor: AppColors.surfaceSoft,
          items: items,
          onChanged: onChanged,
        ),
      ),
    );
  }
}
