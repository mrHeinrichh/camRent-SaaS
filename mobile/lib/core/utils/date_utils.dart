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

/// True if the [endIso] date is strictly before today (date-only). Used to hide
/// expired rentals/blocks — past periods only matter if they extend to today
/// or later (still ongoing).
bool periodEnded(String? endIso) {
  if (endIso == null || endIso.isEmpty) return false;
  final end = DateTime.tryParse(endIso);
  if (end == null) return false;
  final now = DateTime.now();
  final endDay = DateTime(end.year, end.month, end.day);
  final today = DateTime(now.year, now.month, now.day);
  return endDay.isBefore(today);
}

/// True if [day] (date-only) is before today.
bool isPastDay(DateTime day) {
  final now = DateTime.now();
  final d = DateTime(day.year, day.month, day.day);
  final today = DateTime(now.year, now.month, now.day);
  return d.isBefore(today);
}
