import 'package:shared_preferences/shared_preferences.dart';

/// Lightweight wrapper over [SharedPreferences] for non-sensitive flags such as
/// whether the user has already seen the onboarding splash.
class AppPreferences {
  AppPreferences(this._prefs);

  final SharedPreferences _prefs;

  static const String _kSeenOnboarding = 'has_seen_onboarding';

  /// True once an "initial user" has completed (or skipped) onboarding.
  bool get hasSeenOnboarding => _prefs.getBool(_kSeenOnboarding) ?? false;

  Future<void> markOnboardingSeen() =>
      _prefs.setBool(_kSeenOnboarding, true);
}
