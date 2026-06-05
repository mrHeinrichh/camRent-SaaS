import 'package:intl/intl.dart';

final DateFormat _isoDate = DateFormat('yyyy-MM-dd');
final DateFormat _prettyDate = DateFormat('MMM d, yyyy');
final DateFormat _prettyDateTime = DateFormat('MMM d, yyyy • h:mm a');

String toIsoDate(DateTime date) => _isoDate.format(date);

String prettyDate(String? iso) {
  if (iso == null || iso.isEmpty) return '—';
  final parsed = DateTime.tryParse(iso);
  if (parsed == null) return iso;
  return _prettyDate.format(parsed.toLocal());
}

String prettyDateTime(String? iso) {
  if (iso == null || iso.isEmpty) return '—';
  final parsed = DateTime.tryParse(iso);
  if (parsed == null) return iso;
  return _prettyDateTime.format(parsed.toLocal());
}
