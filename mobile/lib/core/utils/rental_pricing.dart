import '../../data/models/cart_item.dart';
import '../../data/models/enums.dart';

const int _msPerDay = 24 * 60 * 60 * 1000;

/// Number of billable days for a rental window, mirroring
/// `frontend/src/lib/rentalPricing.ts`.
int rentalDayCount({
  required String startDate,
  required String endDate,
  String? startTime,
  String? endTime,
  RentalBillingMode? billingMode,
}) {
  if (billingMode == RentalBillingMode.calendarDay) {
    final start = DateTime.tryParse('${startDate}T00:00');
    final end = DateTime.tryParse('${endDate}T00:00');
    if (start == null || end == null) return 1;
    final diff = end.difference(start).inMilliseconds;
    if (diff < 0) return 1;
    return (diff ~/ _msPerDay) + 1 < 1 ? 1 : (diff ~/ _msPerDay) + 1;
  }
  final start = DateTime.tryParse('${startDate}T${startTime ?? '00:00'}');
  final end = DateTime.tryParse('${endDate}T${endTime ?? '23:59'}');
  if (start == null || end == null) return 1;
  final diff = end.difference(start).inMilliseconds;
  if (diff <= 0) return 1;
  final days = (diff / _msPerDay).ceil();
  return days < 1 ? 1 : days;
}

int cartItemRentalDays(CartItem item) => rentalDayCount(
      startDate: item.startDate,
      endDate: item.endDate,
      startTime: item.startTime,
      endTime: item.endTime,
      billingMode: item.rentalBillingMode,
    );

double cartItemRentalTotal(CartItem item) =>
    item.dailyPrice *
    cartItemRentalDays(item) *
    (item.quantity < 1 ? 1 : item.quantity);

String rentalBillingModeLabel(RentalBillingMode? mode) =>
    mode == RentalBillingMode.calendarDay ? 'calendar days' : '24-hour periods';
