import 'package:intl/intl.dart';

/// PHP currency formatter, mirroring `frontend/src/lib/currency.ts`.
final NumberFormat _phpFormat = NumberFormat.currency(
  locale: 'en_PH',
  symbol: '₱',
  decimalDigits: 0,
);

String formatPHP(num? value) {
  final v = value ?? 0;
  if (v.isNaN || v.isInfinite) return _phpFormat.format(0);
  return _phpFormat.format(v);
}
