# Theme Switcher — Design Spec

**Date:** 2026-04-24
**Owner:** Ayaan Ahmed
**Project:** Exercise1 — Personal Website
**Builds on:** `2026-04-24-personal-website-design.md`

## Purpose

Add a user-controlled theme switcher to the existing personal website. Visitors can pick from five accent colors (blue, green, orange, purple, teal) and toggle between light and dark mode independently — for ten total combinations. The selected theme persists across visits.

## Scope

In scope:
- Floating bottom-right picker button + popover panel
- Five color themes: blue (default), green, orange, purple, teal
- Light and dark mode toggle, independent of color choice
- `localStorage` persistence of both the color theme and the mode
- Pre-render application of saved theme so dark-mode visitors don't see a light flash on load

Out of scope (YAGNI):
- Matching system `prefers-color-scheme`
- Custom user-defined colors
- Per-section theming (entire page changes together)
- Animated theme transitions beyond a simple CSS color transition
- Server-side persistence or accounts

## User Experience

**Picker placement:** Fixed-position circular floating action button (FAB) in the bottom-right corner of the viewport (1.5rem from the right edge, 1.5rem from the bottom). The FAB itself uses the current accent color — so the button reflects the active theme.

**FAB icon:** Inline SVG of an artist's palette icon (a circle with three small dots arranged inside, evoking color swatches). White fill on the colored background. Button size: 44px circle.

**Popover panel** (opens above the FAB on click):
- White card (in light mode) or dark card (in dark mode), rounded, subtle shadow, ~220px wide
- Two labelled sections:
  1. **Color** — a row of five small (24px) colored circles, one per theme color, in this order: blue, green, orange, purple, teal. The currently-selected circle has a 2px ring around it.
  2. **Mode** — a two-button pill: `☀ Light` and `☾ Dark`. The currently-selected button is filled with the accent color and has white text; the other is transparent with subtle text.

**Interactions:**
- Click FAB → toggle popover open/closed
- Click a color circle → switch accent color, update FAB color, save to `localStorage`, keep popover open
- Click a mode button → switch light/dark, save to `localStorage`, keep popover open
- Click anywhere outside the popover → close it
- Press `Escape` → close popover

## Color Palettes

**Light mode** — page background `#f3f2ef`, card background `#ffffff`, primary text `#1d1d1f`, secondary text `#5f6368`, border `rgba(0, 0, 0, 0.08)`. Accent and banner gradient vary by theme:

| Theme  | Accent    | Banner gradient (135deg) |
|--------|-----------|--------------------------|
| Blue   | `#0a66c2` | `#0a66c2 → #378fe9`      |
| Green  | `#2e7d32` | `#2e7d32 → #66bb6a`      |
| Orange | `#e65100` | `#e65100 → #ff9800`      |
| Purple | `#6a1b9a` | `#6a1b9a → #ab47bc`      |
| Teal   | `#00796b` | `#00796b → #26a69a`      |

**Dark mode** — page background `#15202b`, card background `#1e2732`, primary text `#e7e9ea`, secondary text `#71767b`, border `rgba(255, 255, 255, 0.1)`. Accent and banner gradient use brighter values:

| Theme  | Accent    | Banner gradient (135deg) |
|--------|-----------|--------------------------|
| Blue   | `#1d9bf0` | `#1d9bf0 → #4cb5f9`      |
| Green  | `#4caf50` | `#4caf50 → #81c784`      |
| Orange | `#ff7043` | `#ff7043 → #ffab91`      |
| Purple | `#ab47bc` | `#ab47bc → #ce93d8`      |
| Teal   | `#26a69a` | `#26a69a → #4db6ac`      |

## Architecture

**Mechanism:** Two HTML attributes on the `<html>` element drive the theme:
- `data-theme="blue|green|orange|purple|teal"` — selects the accent color
- `data-mode="light|dark"` — selects the surface palette

CSS uses custom properties (`--accent`, `--banner-start`, `--banner-end`, `--page-bg`, `--card-bg`, `--text-primary`, `--text-secondary`, `--border`). The default `:root` block defines blue + light. Additional selectors override them:
- `[data-mode="dark"]` overrides surface variables
- `[data-theme="green"]`, `[data-theme="orange"]`, etc. override accent + banner variables (light values)
- `[data-mode="dark"][data-theme="green"]` (and similar combinations) override accent + banner with the dark-mode variants

Existing styles already reference variables like `var(--accent)` — they remain unchanged.

**Persistence:**
- `localStorage.theme` ∈ `{"blue","green","orange","purple","teal"}`, default `"blue"`
- `localStorage.mode` ∈ `{"light","dark"}`, default `"light"`
- An inline script in `<head>` (placed after the `<style>` block) reads both keys and sets the attributes on `<html>` **before body renders** to avoid a flash of unstyled / wrong-mode content
- The picker control script runs from a `<script>` block at the end of `<body>`

**No new files.** All HTML, CSS, and JS go into the existing `Exercise1/index.html`.

## File Changes

- Modify: `c:/Users/AyaanAhmed/Desktop/Practice/Exercise1/index.html`
  - Extend the existing `<style>` block with theme variable overrides and picker styles (~80 lines added)
  - Add the picker HTML (FAB + popover) just before `</body>` (~20 lines)
  - Add a small `<script>` block in `<head>` (after `<style>`) for the pre-render attribute application (~5 lines)
  - Add a `<script>` block before `</body>` for picker behavior (~30 lines)

## Success Criteria

- On first visit (no `localStorage`), page loads with blue accent + light mode (matches the original LinkedIn-style look exactly)
- Clicking the FAB opens the popover; clicking outside or pressing Escape closes it
- Selecting any of the 5 colors changes the accent (name divider hover, icons, banner gradient, FAB color, and any other accent-colored element) immediately, with no page reload
- Toggling light/dark changes the page background, card background, and text colors immediately
- Reloading the page preserves the previously selected color and mode
- Loading the page with `localStorage.mode = "dark"` does not show a flash of light theme before settling into dark
- All 10 theme combinations are legible: text contrasts cleanly with backgrounds, accent is distinguishable from surface colors, and SVG icons remain visible
- Mobile layout (375px viewport) still works: FAB doesn't overlap the card content, popover stays within the viewport, picker is tappable
- Zero external network requests, no console errors, no new dependencies
