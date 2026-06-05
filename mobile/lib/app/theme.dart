import 'package:flutter/material.dart';

/// App palette ported 1:1 from the web app's `siteTheme.palette`
/// (`frontend/src/config/siteTheme.ts`) — a warm, light, beige/tan look with a
/// gold accent.
class AppColors {
  AppColors._();

  static const Color bg = Color(0xFFF0ECE6);
  static const Color surface = Color(0xFFF7F4EF);
  static const Color surfaceSoft = Color(0xFFFCFBF8);
  static const Color border = Color(0xFFE2DBD1);
  static const Color text = Color(0xFF2F1E12);
  static const Color textMuted = Color(0xFF5B554E);
  static const Color accent = Color(0xFFD9A26A);
  static const Color accentText = Color(0xFF2F1F12);
  static const Color nav = Color(0xFFF7F3EE);
  static const Color navBorder = Color(0xFFDED7CD);

  static const Color success = Color(0xFF2E7D5B);
  static const Color danger = Color(0xFFC0392B);
  static const Color warning = Color(0xFFB9803F);

  /// Soft elevation shadow used by the `.i3d-card` hover/press effect.
  static const Color shadow = Color(0x1A0F172A); // rgba(15,23,42,0.10)
}

ThemeData buildAppTheme() {
  final base = ThemeData.light(useMaterial3: true);
  final scheme = ColorScheme.fromSeed(
    seedColor: AppColors.accent,
    brightness: Brightness.light,
  ).copyWith(
    surface: AppColors.surface,
    onSurface: AppColors.text,
    primary: AppColors.accent,
    onPrimary: AppColors.accentText,
    secondary: AppColors.accent,
  );

  return base.copyWith(
    scaffoldBackgroundColor: AppColors.bg,
    colorScheme: scheme,
    textTheme: base.textTheme.apply(
      bodyColor: AppColors.text,
      displayColor: AppColors.text,
    ),
    iconTheme: const IconThemeData(color: AppColors.text),
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.nav,
      foregroundColor: AppColors.text,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0.5,
      centerTitle: false,
    ),
    cardTheme: CardThemeData(
      color: AppColors.surfaceSoft,
      elevation: 0,
      shadowColor: AppColors.shadow,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: AppColors.border),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.surfaceSoft,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.accent, width: 1.6),
      ),
      hintStyle: const TextStyle(color: AppColors.textMuted),
      labelStyle: const TextStyle(color: AppColors.textMuted),
      floatingLabelStyle: const TextStyle(color: AppColors.accentText),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.accent,
        foregroundColor: AppColors.accentText,
        elevation: 2,
        shadowColor: AppColors.shadow,
        textStyle: const TextStyle(fontWeight: FontWeight.w700),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(999),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.accentText,
        side: const BorderSide(color: AppColors.border),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(999),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(foregroundColor: AppColors.accentText),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: AppColors.nav,
      surfaceTintColor: Colors.transparent,
      indicatorColor: AppColors.accent.withValues(alpha: 0.22),
      elevation: 0,
      labelTextStyle: WidgetStateProperty.all(
        const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
      ),
    ),
    drawerTheme: const DrawerThemeData(
      backgroundColor: AppColors.surface,
      surfaceTintColor: Colors.transparent,
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: AppColors.surfaceSoft,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
    ),
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: AppColors.surface,
      surfaceTintColor: Colors.transparent,
    ),
    dividerColor: AppColors.border,
    chipTheme: base.chipTheme.copyWith(
      backgroundColor: AppColors.surfaceSoft,
      selectedColor: AppColors.accent.withValues(alpha: 0.25),
      side: const BorderSide(color: AppColors.border),
      labelStyle: const TextStyle(color: AppColors.text),
      shape:
          RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
    ),
    progressIndicatorTheme:
        const ProgressIndicatorThemeData(color: AppColors.accent),
    snackBarTheme: const SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: AppColors.text,
      contentTextStyle: TextStyle(color: AppColors.surfaceSoft),
    ),
  );
}
