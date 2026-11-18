---
name: brand
description: Change the site's look — colour preset, light/dark theme, fonts, the owner's own brand colours, icon, corner radius, type scale — keeping contrast readable. Use when the owner asks for their brand colours, a different font, dark mode, their logo or a lighter/darker feel.
---

# brand — the look, through the config and the tokens

The look is chosen in `src/site.config.ts`; the values live in CSS (`src/styles/`). Change
**values**, never token names.

1. **Ask**: the closest preset or their own accent colour (hex); light, dark or "follow the
   device"; whether visitors get a light/dark switch; the feel of headings and body text.
2. **Preset and theme** — `brand` in the config:
   - `preset`: `forma` (violet) · `ocean` (blue) · `forest` (green) · `ember` (burnt orange) ·
     `rose` (raspberry) · `graphite` (monochrome). Each has a light and a dark variant.
   - `theme`: `light` · `dark` · `system`. `themeToggle: true` adds the navbar switch, which keeps
     the visitor's choice in their browser (`smoketest:theme`, listed in the privacy policy). Turn
     it off if the owner wants nothing at all stored in visitors' browsers.
3. **Their own colours**: pick the nearest preset and edit both of its blocks in
   `src/styles/presets.css` (light and dark, eleven values each). The accent
   (`--color-yellow-alpha-100`; the name is historical) must carry white text; `--text-accent` is
   the accent for text (darker on light, lighter on dark); `--color-highlight` is the second hue
   for gradients and glows. Everything else — alpha scales, lines, the craft gradients and shadows,
   the ASCII effects, the hero image — is derived from these. Keep every text colour at a contrast
   of at least 4.5:1 on its background, in both themes.
4. **Fonts**: `brand.fonts` — `geometric` (Manrope + DM Sans) · `editorial` (Fraunces + Inter) ·
   `technical` (Space Grotesk + IBM Plex Sans). For another pair: self-hosted woff2 files under an
   open licence (e.g. SIL OFL, licence text next to them) in `public/fonts/`, `@font-face` rules and
   a `:root[data-fonts="…"]` block in `src/styles/fonts.css`, the name in `FONT_PAIRS`
   (`src/config/schema.ts`) and its preload files in `src/lib/theme.ts`. Headings use 500 and 600.
5. **Name and icon**: the navbar logo and the footer wordmark show `product.name` (in lowercase;
   `text-transform` in `src/styles/craft.css` sets that); the small icon beside the logo is drawn
   there too (`.company-logo::before`): swap its SVG for theirs. Their square icon (SVG) replaces
   `public/favicon.svg`; `npm run icons` renders `favicon.ico`, `apple-touch-icon.png` (on the
   preset's page colour) and `icon-192/512.png`. The web manifest takes its name and colours from
   the config by itself. The social image is `public/og-default.png` (1200×630): replace it too.
6. **Radius / scale**: `--radius-*`, `--font-titles-*` per breakpoint in `src/styles/tokens.css`.
7. `npm run build` and `npx astro check`. Look at 375 px and 1280 px, in light and dark.
