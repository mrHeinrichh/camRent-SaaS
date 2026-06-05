import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../app/theme.dart';
import '../../../core/constants/home_constants.dart';
import '../bloc/home_cubit.dart';

/// Home filter bar, ported from the web `HomeFilterBar`: Gears/Stores toggle,
/// Clear Search, category + brand (gears) or sort (stores), rating filter, and
/// Near me.
class HomeFilterBar extends StatelessWidget {
  const HomeFilterBar({super.key, required this.state});
  final HomeState state;

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<HomeCubit>();
    final isGears = state.viewMode == ViewMode.gears;

    return Container(
      margin: const EdgeInsets.fromLTRB(12, 4, 12, 8),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
      ),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          _SegToggle(
            label: 'Gears',
            selected: isGears,
            onTap: () => cubit.setViewMode(ViewMode.gears),
          ),
          _SegToggle(
            label: 'Stores',
            selected: !isGears,
            onTap: () => cubit.setViewMode(ViewMode.stores),
          ),
          _OutlineChip(
            label: 'Clear Search',
            icon: Icons.close,
            onTap: cubit.clearSearch,
          ),
          if (isGears) ...[
            _DropdownChip<String>(
              value: state.availableCategories.contains(state.category)
                  ? state.category
                  : kAllGear,
              items: state.availableCategories
                  .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                  .toList(),
              onChanged: (v) => cubit.setCategory(v ?? kAllGear),
            ),
            _BrandField(value: state.brand, onChanged: cubit.setBrand),
          ] else
            _DropdownChip<SortMode>(
              value: state.sortMode,
              items: const [
                DropdownMenuItem(
                    value: SortMode.defaultOrder, child: Text('Show all stores')),
                DropdownMenuItem(
                    value: SortMode.storeAz, child: Text('Store name A-Z')),
                DropdownMenuItem(
                    value: SortMode.storeZa, child: Text('Store name Z-A')),
              ],
              onChanged: (v) => cubit.setSortMode(v ?? SortMode.defaultOrder),
            ),
          _DropdownChip<double>(
            value: state.minRating,
            items: const [
              DropdownMenuItem(value: 0.0, child: Text('Filter by ratings')),
              DropdownMenuItem(value: 4.5, child: Text('4.5+')),
              DropdownMenuItem(value: 4.0, child: Text('4.0+')),
              DropdownMenuItem(value: 3.5, child: Text('3.5+')),
              DropdownMenuItem(value: 3.0, child: Text('3.0+')),
            ],
            onChanged: (v) => cubit.setMinRating(v ?? 0),
          ),
          _SegToggle(
            label: state.locating
                ? 'Getting location…'
                : state.nearMeOnly
                    ? 'Near me: ON'
                    : 'Near me',
            icon: Icons.location_on_outlined,
            selected: state.nearMeOnly,
            onTap: cubit.toggleNearMe,
          ),
        ],
      ),
    );
  }
}

class _SegToggle extends StatelessWidget {
  const _SegToggle({
    required this.label,
    required this.selected,
    required this.onTap,
    this.icon,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? AppColors.text : AppColors.surfaceSoft,
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        borderRadius: BorderRadius.circular(999),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            border: Border.all(
                color: selected ? AppColors.text : AppColors.border),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon,
                    size: 15,
                    color: selected ? AppColors.surfaceSoft : AppColors.text),
                const SizedBox(width: 5),
              ],
              Text(label,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: selected ? AppColors.surfaceSoft : AppColors.text,
                  )),
            ],
          ),
        ),
      ),
    );
  }
}

class _OutlineChip extends StatelessWidget {
  const _OutlineChip({required this.label, required this.onTap, this.icon});
  final String label;
  final VoidCallback onTap;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return _SegToggle(
        label: label, selected: false, onTap: onTap, icon: icon);
  }
}

class _DropdownChip<T> extends StatelessWidget {
  const _DropdownChip({
    required this.value,
    required this.items,
    required this.onChanged,
  });

  final T value;
  final List<DropdownMenuItem<T>> items;
  final ValueChanged<T?> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: AppColors.surfaceSoft,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppColors.border),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<T>(
          value: value,
          isDense: true,
          borderRadius: BorderRadius.circular(14),
          style: TextStyle(fontSize: 13, color: AppColors.text),
          dropdownColor: AppColors.surfaceSoft,
          items: items,
          onChanged: onChanged,
        ),
      ),
    );
  }
}

class _BrandField extends StatefulWidget {
  const _BrandField({required this.value, required this.onChanged});
  final String value;
  final ValueChanged<String> onChanged;

  @override
  State<_BrandField> createState() => _BrandFieldState();
}

class _BrandFieldState extends State<_BrandField> {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: AppColors.surfaceSoft,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppColors.border),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: kBrandOptions.contains(widget.value)
              ? widget.value
              : kAllBrands,
          isDense: true,
          borderRadius: BorderRadius.circular(14),
          style: TextStyle(fontSize: 13, color: AppColors.text),
          dropdownColor: AppColors.surfaceSoft,
          items: kBrandOptions
              .map((b) => DropdownMenuItem(value: b, child: Text(b)))
              .toList(),
          onChanged: (v) => widget.onChanged(v ?? kAllBrands),
        ),
      ),
    );
  }
}
