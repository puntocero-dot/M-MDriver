import 'package:flutter/material.dart';
import 'app_colors.dart';

/// M&M Driver text styles.
/// PlayfairDisplay — brand/logo/headings.
/// Inter — all UI body and label text.
class AppTextStyles {
  AppTextStyles._();

  // ---------------------------------------------------------------------------
  // Brand (PlayfairDisplay)
  // ---------------------------------------------------------------------------

  /// Main logo / brand wordmark — "M&M Driver"
  static const TextStyle brandTitle = TextStyle(
    fontFamily: 'PlayfairDisplay',
    fontWeight: FontWeight.w700,
    fontSize: 32,
    color: AppColors.gold,
    letterSpacing: 1.5,
    height: 1.2,
  );

  /// Large display heading — screen titles, splash
  static const TextStyle headlineLarge = TextStyle(
    fontFamily: 'PlayfairDisplay',
    fontWeight: FontWeight.w700,
    fontSize: 28,
    color: AppColors.white,
    letterSpacing: 0.5,
    height: 1.3,
  );

  /// Medium heading — section titles
  static const TextStyle headlineMedium = TextStyle(
    fontFamily: 'PlayfairDisplay',
    fontWeight: FontWeight.w700,
    fontSize: 22,
    color: AppColors.white,
    letterSpacing: 0.3,
    height: 1.3,
  );

  // ---------------------------------------------------------------------------
  // Titles (Inter)
  // ---------------------------------------------------------------------------

  /// Card or dialog title
  static const TextStyle titleLarge = TextStyle(
    fontFamily: 'Inter',
    fontWeight: FontWeight.w600,
    fontSize: 18,
    color: AppColors.white,
    letterSpacing: 0.15,
    height: 1.4,
  );

  /// Sub-title, list header
  static const TextStyle titleMedium = TextStyle(
    fontFamily: 'Inter',
    fontWeight: FontWeight.w500,
    fontSize: 16,
    color: AppColors.white,
    letterSpacing: 0.1,
    height: 1.4,
  );

  // ---------------------------------------------------------------------------
  // Body (Inter)
  // ---------------------------------------------------------------------------

  /// Primary body copy
  static const TextStyle bodyLarge = TextStyle(
    fontFamily: 'Inter',
    fontWeight: FontWeight.w400,
    fontSize: 16,
    color: AppColors.grey100,
    letterSpacing: 0.15,
    height: 1.5,
  );

  /// Secondary body copy
  static const TextStyle bodyMedium = TextStyle(
    fontFamily: 'Inter',
    fontWeight: FontWeight.w400,
    fontSize: 14,
    color: AppColors.grey300,
    letterSpacing: 0.25,
    height: 1.5,
  );

  /// Fine print, captions
  static const TextStyle bodySmall = TextStyle(
    fontFamily: 'Inter',
    fontWeight: FontWeight.w400,
    fontSize: 12,
    color: AppColors.grey500,
    letterSpacing: 0.4,
    height: 1.5,
  );

  // ---------------------------------------------------------------------------
  // Labels (Inter)
  // ---------------------------------------------------------------------------

  /// Button label, prominent action text
  static const TextStyle labelLarge = TextStyle(
    fontFamily: 'Inter',
    fontWeight: FontWeight.w700,
    fontSize: 14,
    color: AppColors.navyDark,
    letterSpacing: 0.8,
    height: 1.2,
  );

  /// Small tag or badge text
  static const TextStyle labelSmall = TextStyle(
    fontFamily: 'Inter',
    fontWeight: FontWeight.w600,
    fontSize: 11,
    color: AppColors.grey300,
    letterSpacing: 0.5,
    height: 1.2,
  );
}
