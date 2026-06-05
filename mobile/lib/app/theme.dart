import 'package:flutter/material.dart';

/// Palette tokens that differ between light and dark modes.
class _Palette {
  const _Palette({
    required this.bg,
    required this.surface,
    required this.surfaceSoft,
    required this.border,
    required this.text,
    required this.textMuted,
    required this.nav,
    required this.navBorder,
  });

  final Color bg;
  final Color surface;
  final Color surfaceSoft;
  final Color border;
  final Color text;
  final Color textMuted;
  final Color nav;
  final Color navBorder;
}

/// Light = the web app's warm beige palette. Dark = a warm charcoal variant
/// that keeps the same gold accent.
const _light = _Palette(
  bg: Color(0xFFF0ECE6),
  surface: Color(0xFFF7F4EF),
  surfaceSoft: Color(0xFFFCFBF8),
  border: Color(0xFFE2DBD1),
  text: Color(0xFF2F1E12),
  textMuted: Color(0xFF5B554E),
  nav: Color(0xFFF7F3EE),
  navBorder: Color(0xFFDED7CD),
);

const _dark = _Palette(
  bg: Color(0xFF14110D),
  surface: Color(0xFF1E1A14),
  surfaceSoft: Color(0xFF262019),
  border: Color(0xFF3A3026),
  text: Color(0xFFF5EFE6),
  textMuted: Color(0xFFB5AA99),
  nav: Color(0xFF1A1611),
  navBorder: Color(0xFF3A3026),
);

/// Semantic colors used across the app. Surface/text tokens resolve against the
/// current [brightness]; brand tokens (accent, status colors) are mode-invariant.
class AppColors {
  AppColors._();

  /// Updated by [CamRentApp] whenever the theme mode changes so custom widgets
  /// stay in sync with the active [ThemeData].
  static Brightness brightness = Brightness.light;
  static bool get _isDark => brightness == Brightness.dark;
  static _Palette get _p => _isDark ? _dark : _light;

  static Color get bg => _p.bg;
  static Color get surface => _p.surface;
  static Color get surfaceSoft => _p.surfaceSoft;
  static Color get border => _p.border;
  static Color get text => _p.text;
  static Color get textMuted => _p.textMuted;
  static Color get nav => _p.nav;
  static Color get navBorder => _p.navBorder;

  // Brand / status — same in both modes.
  static const Color accent = Color(0xFFD9A26A);
  static const Color accentText = Color(0xFF2F1F12);
  static const Color success = Color(0xFF2E7D5B);
  static const Color danger = Color(0xFFC0392B);
  static const Color warning = Color(0xFFB9803F);
  static const Color shadow = Color(0x1A0F172A);
}

ThemeData buildAppTheme(Brightness brightness) {
  final isDark = brightness == Brightness.dark;
  final p = isDark ? _dark : _light;
  final base = isDark ? ThemeData.dark(useMaterial3: true) : ThemeData.light(useMaterial3: true);
  final scheme = ColorScheme.fromSeed(
    seedColor: AppColors.accent,
    brightness: brightness,
  ).copyWith(
    surface: p.surface,
    onSurface: p.text,
    primary: AppColors.accent,
    onPrimary: AppColors.accentText,
    secondary: AppColors.accent,
  );

  return base.copyWith(
    scaffoldBackgroundColor: p.bg,
    colorScheme: scheme,
    textTheme: base.textTheme.apply(bodyColor: p.text, displayColor: p.text),
    iconTheme: IconThemeData(color: p.text),
    appBarTheme: AppBarTheme(
      backgroundColor: p.nav,
      foregroundColor: p.text,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0.5,
      centerTitle: false,
    ),
    cardTheme: CardThemeData(
      color: p.surfaceSoft,
      elevation: 0,
      shadowColor: AppColors.shadow,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: p.border),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: p.surfaceSoft,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: p.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: p.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.accent, width: 1.6),
      ),
      hintStyle: TextStyle(color: p.textMuted),
      labelStyle: TextStyle(color: p.textMuted),
      floatingLabelStyle: const TextStyle(color: AppColors.accent),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.accent,
        foregroundColor: AppColors.accentText,
        elevation: 2,
        shadowColor: AppColors.shadow,
        textStyle: const TextStyle(fontWeight: FontWeight.w700),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: p.text,
        side: BorderSide(color: p.border),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(foregroundColor: AppColors.accent),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: p.nav,
      surfaceTintColor: Colors.transparent,
      indicatorColor: AppColors.accent.withValues(alpha: 0.22),
      elevation: 0,
      labelTextStyle: WidgetStateProperty.all(
        const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
      ),
    ),
    drawerTheme: DrawerThemeData(
      backgroundColor: p.surface,
      surfaceTintColor: Colors.transparent,
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: p.surfaceSoft,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
    ),
    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: p.surface,
      surfaceTintColor: Colors.transparent,
    ),
    dividerColor: p.border,
    chipTheme: base.chipTheme.copyWith(
      backgroundColor: p.surfaceSoft,
      selectedColor: AppColors.accent.withValues(alpha: 0.25),
      side: BorderSide(color: p.border),
      labelStyle: TextStyle(color: p.text),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
    ),
    progressIndicatorTheme:
        const ProgressIndicatorThemeData(color: AppColors.accent),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: isDark ? AppColors.accent : p.text,
      contentTextStyle:
          TextStyle(color: isDark ? AppColors.accentText : p.surfaceSoft),
    ),
  );
}
