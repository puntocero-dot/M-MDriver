import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

/// M&M Driver text styles — Stitch "Midnight Concierge" editorial voice.
///
/// Headlines → Manrope (via GoogleFonts)
/// Body / Labels → Inter (via GoogleFonts)
///
/// Static getters return non-const TextStyles with Google Fonts applied.
/// The Material theme (AppTheme.dark) also sets these via textTheme so most
/// Text() widgets inherit the right font automatically without referencing
/// these getters directly.
class AppTextStyles {
  AppTextStyles._();

  // ── Brand / Logo ──────────────────────────────────────────────────────────

  static TextStyle get brandTitle => GoogleFonts.manrope(
        fontWeight: FontWeight.w800,
        fontSize: 28,
        color: AppColors.gold,
        letterSpacing: 0.5,
        height: 1.2,
        shadows: const [
          Shadow(color: Color(0x4DF2CA50), blurRadius: 20),
        ],
      );

  // ── Display ───────────────────────────────────────────────────────────────

  static TextStyle get displayLarge => GoogleFonts.manrope(
        fontWeight: FontWeight.w800,
        fontSize: 36,
        color: AppColors.onSurface,
        letterSpacing: -0.5,
        height: 1.1,
      );

  // ── Headlines (Manrope) ───────────────────────────────────────────────────

  static TextStyle get headlineLarge => GoogleFonts.manrope(
        fontWeight: FontWeight.w700,
        fontSize: 28,
        color: AppColors.onSurface,
        letterSpacing: -0.3,
        height: 1.25,
      );

  static TextStyle get headlineMedium => GoogleFonts.manrope(
        fontWeight: FontWeight.w700,
        fontSize: 22,
        color: AppColors.onSurface,
        letterSpacing: -0.2,
        height: 1.3,
      );

  // ── Titles (Inter) ────────────────────────────────────────────────────────

  static TextStyle get titleLarge => GoogleFonts.inter(
        fontWeight: FontWeight.w600,
        fontSize: 18,
        color: AppColors.onSurface,
        height: 1.4,
      );

  static TextStyle get titleMedium => GoogleFonts.inter(
        fontWeight: FontWeight.w500,
        fontSize: 16,
        color: AppColors.onSurface,
        letterSpacing: 0.1,
        height: 1.4,
      );

  // ── Body (Inter) ──────────────────────────────────────────────────────────

  static TextStyle get bodyLarge => GoogleFonts.inter(
        fontWeight: FontWeight.w400,
        fontSize: 16,
        color: AppColors.onSurface,
        letterSpacing: 0.1,
        height: 1.5,
      );

  static TextStyle get bodyMedium => GoogleFonts.inter(
        fontWeight: FontWeight.w400,
        fontSize: 14,
        color: AppColors.secondary,
        letterSpacing: 0.1,
        height: 1.5,
      );

  static TextStyle get bodySmall => GoogleFonts.inter(
        fontWeight: FontWeight.w400,
        fontSize: 12,
        color: AppColors.outline,
        letterSpacing: 0.2,
        height: 1.5,
      );

  // ── Labels (Inter) ────────────────────────────────────────────────────────

  static TextStyle get labelLarge => GoogleFonts.inter(
        fontWeight: FontWeight.w700,
        fontSize: 14,
        color: AppColors.onPrimary,
        letterSpacing: 0.7,
        height: 1.2,
      );

  static TextStyle get labelSmall => GoogleFonts.inter(
        fontWeight: FontWeight.w600,
        fontSize: 11,
        color: AppColors.secondary,
        letterSpacing: 0.4,
        height: 1.2,
      );
}
