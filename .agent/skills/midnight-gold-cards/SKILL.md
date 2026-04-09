---
name: midnight-gold-cards
description: Guidelines and specifications for designing UI Cards, Modals, and containers in the Midnight Gold premium standard. Focuses on proper proportional padding, gaps, scrollbars, and luxury aesthetics.
---

# 🌙 Midnight Gold: Standard Card & Layout Guidelines

When creating new features, pages, or components (such as **Modals**, **Containers**, or **Cards**), it is strictly mandatory to follow this standard to avoid visual collapse, saturated interfaces, or overlapping content (especially on mobile).

## 1. Modals & Large Overlays

Modals are prone to overflowing the viewport. To maintain a functional, luxury feel, they must support smooth scrolling without squishing inner content.

*   **Wrapper Properties:** Always set an explicit max-height and add scroll functionality to the *content container* (not the backdrop). 
*   **Example Wrapper:** `max-h-[85vh] overflow-y-auto`
*   **Container Padding:**
    *   **Desktop:** `p-12` or `p-14` max
    *   **Mobile:** `p-8` (Do **not** use `p-16` or `p-24`)
*   **Border Radius:** `rounded-[2rem] md:rounded-[2.5rem]` (32px to 40px)
*   **Background/Aesthetics:** `bg-[#05080F]/95 backdrop-blur-xl border border-white/10 shadow-2xl`. Subtle gradients like `bg-gradient-to-br` can be used.

### ❌ What not to do:
```tsx
// 🚫 BAD: No max-h, excessive padding (p-16/p-24) will cause overflow.
<div className="p-16 md:p-24 flex flex-col items-center">
```

### ✅ What to do:
```tsx
// ✅ GOOD: Scrollable, proportional padding.
<div className="max-h-[85vh] overflow-y-auto p-8 md:p-14 flex flex-col items-center custom-scrollbar">
```

## 2. Inner Cards (Options, Selections, Metrics)

For nested items such as platform selections, service options, or metric indicators.

*   **Paddings:** `p-6` or `p-8`. (Avoid padding over 32px for inner sub-elements).
*   **Border Radius:** `rounded-[1.5rem]` (24px)
*   **Gaps (Espacios Conexos):** 
    *   Inner flex items (Icon + text): `gap-4`
    *   Grid gaps: `gap-6` (Avoid `gap-10` on small internal elements).
*   **Background:** `bg-white/[0.04] border border-white/10 hover:bg-white/[0.06] transition-all`
*   **Icons Container inside Card:** `w-12 h-12 rounded-xl` (Avoid making them massive, keep them elegant).

## 3. Contextual Spaces & Typography Margins

Text inside cards needs to breathe but not drift away.

*   **Headers to Paragraphs:** `mb-4` or `mb-6`.
*   **Between Sections:** `mb-10` or `mb-8`. (Avoid `mb-16` unless it's a massive Hero section).
*   **Typography:** Text size should be proportionate. `text-3xl md:text-4xl` for modal titles. `text-[9px] uppercase tracking-[0.3em]` for sub-labels.

## 4. Layout Architecture checklist

1. **Does it fit?** On a screen of `h-800px`, check if the combined paddings + margins exceed viewport height. If yes -> add `overflow-y-auto`.
2. **Is it squished?** Don't force `items-center` without sufficient space. Use flex gaps `gap-6` instead of heavy manual margins.
3. **Is it luxurious?** Utilize glassmorphism correctly (`border-white/10`, `backdrop-blur`). Avoid solid bright colors; use `gold` strictly as an accent.
