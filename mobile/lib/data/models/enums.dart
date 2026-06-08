// Domain enums mirroring `frontend/src/types/domain.ts`.

enum UserRole { renter, owner, admin }

UserRole userRoleFromString(String? value) {
  switch (value) {
    case 'owner':
      return UserRole.owner;
    case 'admin':
      return UserRole.admin;
    default:
      return UserRole.renter;
  }
}

String userRoleToString(UserRole role) => role.name;

enum RentalBillingMode { calendarDay, twentyFourHour }

RentalBillingMode rentalBillingModeFromString(String? value) =>
    value == 'calendar_day'
        ? RentalBillingMode.calendarDay
        : RentalBillingMode.twentyFourHour;

String rentalBillingModeToString(RentalBillingMode mode) =>
    mode == RentalBillingMode.calendarDay ? 'calendar_day' : 'twenty_four_hour';
