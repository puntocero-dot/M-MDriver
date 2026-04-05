## Design System: M&M Driver

### Pattern
- **Name:** Storytelling + Feature-Rich
- **CTA Placement:** Above fold
- **Sections:** Hero > Features > CTA

### Style
- **Name:** Liquid Glass
- **Keywords:** Flowing glass, morphing, smooth transitions, fluid effects, translucent, animated blur, iridescent, chromatic aberration
- **Best For:** Premium SaaS, high-end e-commerce, creative platforms, branding experiences, luxury portfolios
- **Performance:** ÔÜá Moderate-Poor | **Accessibility:** ÔÜá Text contrast

### Colors
| Role | Hex |
|------|-----|
| Primary | #1C1917 |
| Secondary | #44403C |
| CTA | #CA8A04 |
| Background | #FAFAF9 |
| Text | #0C0A09 |

*Notes: Premium black + gold accent*

### Typography
- **Heading:** Bodoni Moda
- **Body:** Jost
- **Mood:** luxury, minimalist, high-end, sophisticated, refined, premium
- **Best For:** Luxury minimalist brands, high-end fashion, premium products
- **Google Fonts:** https://fonts.google.com/share?selection.family=Bodoni+Moda:wght@400;500;600;700|Jost:wght@300;400;500;600;700
- **CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:wght@400;500;600;700&family=Jost:wght@300;400;500;600;700&display=swap');
```

### Key Effects
Morphing elements (SVG/CSS), fluid animations (400-600ms curves), dynamic blur (backdrop-filter), color transitions

### Avoid (Anti-patterns)
- Cheap visuals
- Fast animations

### Pre-Delivery Checklist
- [ ] No emojis as icons (use SVG: Heroicons/Lucide)
- [ ] cursor-pointer on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard nav
- [ ] prefers-reduced-motion respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px

