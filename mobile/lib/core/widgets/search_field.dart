import 'package:flutter/material.dart';

import '../../app/theme.dart';

/// Compact search box used above CRUD lists in the dashboards.
class SearchField extends StatelessWidget {
  const SearchField({
    super.key,
    required this.hint,
    required this.onChanged,
    this.margin = const EdgeInsets.fromLTRB(12, 12, 12, 4),
  });

  final String hint;
  final ValueChanged<String> onChanged;
  final EdgeInsetsGeometry margin;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: margin,
      child: TextField(
        onChanged: onChanged,
        textInputAction: TextInputAction.search,
        decoration: InputDecoration(
          hintText: hint,
          isDense: true,
          prefixIcon: const Icon(Icons.search, size: 20),
          filled: true,
          fillColor: AppColors.surfaceSoft,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: AppColors.border),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: AppColors.border),
          ),
        ),
      ),
    );
  }
}

/// Case-insensitive "any field contains the query" matcher for search filters.
bool matchesQuery(String query, List<String?> fields) {
  final q = query.trim().toLowerCase();
  if (q.isEmpty) return true;
  return fields.any((field) => (field ?? '').toLowerCase().contains(q));
}

/// Wraps a list body with a [SearchField] on top, passing the live query down
/// so otherwise-stateless CRUD tabs get search without their own state class.
class SearchableList extends StatefulWidget {
  const SearchableList({super.key, required this.hint, required this.builder});

  final String hint;
  final Widget Function(BuildContext context, String query) builder;

  @override
  State<SearchableList> createState() => _SearchableListState();
}

class _SearchableListState extends State<SearchableList> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SearchField(
          hint: widget.hint,
          onChanged: (value) => setState(() => _query = value),
        ),
        Expanded(child: widget.builder(context, _query)),
      ],
    );
  }
}
