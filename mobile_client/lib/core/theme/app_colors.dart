import 'package:flutter/material.dart';

/// M&M Driver — "Midnight Concierge" Design System
/// Token source: Stitch project #7647697055610317184
class AppColors {
  AppColors._();

  // ── Surface / Background (tonal depth layers) ─────────────────────────────
  static const Color surface                = Color(0xFF131313); // void canvas
  static const Color surfaceContainerLowest = Color(0xFF0E0E0E);
  static const Color surfaceContainerLow    = Color(0xFF1C1B1B);
  static const Color surfaceContainer       = Color(0xFF201F1F);
  static const Color surfaceContainerHigh   = Color(0xFF2A2A2A);
  static const Color surfaceContainerHighest= Color(0xFF353534);
  static const Color surfaceBright          = Color(0xFF3A3939);

  // ── Primary / Gold ───────────────────────────────────────────────────────
  static const Color gold      = Color(0xFFF2CA50); // primary
  static const Color goldDim   = Color(0xFFD4AF37); // primary_container (135° gradient end)
  static const Color goldLight = Color(0xFFFFE088); // primary_fixed
  static const Color goldDark  = Color(0xFFE9C349); // primary_fixed_dim

  // ── Text ──────────────────────────────────────────────────────────────────
  static const Color onSurface        = Color(0xFFE5E2E1); // warm cream — never pure white
  static const Color onSurfaceVariant = Color(0xFFD0C5AF);
  static const Color onPrimary        = Color(0xFF3C2F00); // dark brown for gold buttons
  static const Color inverseSurface   = Color(0xFFE5E2E1);

  // ── Secondary ─────────────────────────────────────────────────────────────
  static const Color secondary          = Color(0xFFC7C6C4);
  static const Color secondaryContainer = Color(0xFF464746);

  // ── Tertiary / Accent blue ────────────────────────────────────────────────
  static const Color tertiary          = Color(0xFFBFCDFF);
  static const Color tertiaryContainer = Color(0xFF97B0FF);

  // ── Outline ───────────────────────────────────────────────────────────────
  static const Color outline        = Color(0xFF99907C);
  static const Color outlineVariant = Color(0xFF4D4635);

  // ── Semantic ──────────────────────────────────────────────────────────────
  static const Color success = Color(0xFF4CAF50);
  static const Color error   = Color(0xFFFFB4AB); // Stitch M3 error
  static const Color warning = Color(0xFFF9A825);
  static const Color info    = Color(0xFFBFCDFF); // tertiary

  // ── SOS ───────────────────────────────────────────────────────────────────
  static const Color sosRed = Color(0xFFD32F2F);

  // ── Backwards-compatible aliases ─────────────────────────────────────────
  // Other files still reference these names; aliases prevent a mass rename.
  static const Color navyDark   = surface;                   // #131313
  static const Color navyMedium = surfaceContainer;          // #201F1F
  static const Color navyLight  = surfaceContainerHighest;   // #353534
  static const Color white      = onSurface;                 // #E5E2E1
  static const Color grey100    = onSurfaceVariant;          // #D0C5AF
  static const Color grey300    = secondary;                 // #C7C6C4
  static const Color grey500    = outline;                   // #99907C
  static const Color grey800    = surfaceContainerHigh;      // #2A2A2A
  static const Color black      = surfaceContainerLowest;    // #0E0E0E
}
