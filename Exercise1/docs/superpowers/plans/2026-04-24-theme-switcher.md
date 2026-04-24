# Theme Switcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a floating bottom-right theme picker to `Exercise1/index.html` that lets visitors choose between 5 accent colors (blue, green, orange, purple, teal) and toggle light/dark mode, with the choice persisted in `localStorage`.

**Architecture:** Pure CSS variables + tiny vanilla JS, all inside the existing single `index.html` file. Two `data-*` attributes on `<html>` (`data-theme` and `data-mode`) drive every theme via cascading CSS variable overrides. A pre-render script in `<head>` applies saved attributes before paint to avoid a light-mode flash.

**Tech Stack:** HTML5, CSS custom properties, vanilla JavaScript (no build step), `localStorage`.

**Spec reference:** `Exercise1/docs/superpowers/specs/2026-04-24-theme-switcher-design.md`

**Note on git:** This directory is not a git repository. Commit steps are omitted. The user can `git init` if they want version control later.

---

## File Structure

- Modify: `c:/Users/AyaanAhmed/Desktop/Practice/Exercise1/index.html` — all changes happen in this single file:
  - Existing `<style>` block grows with theme variables, dark-mode overrides, and picker styles
  - A new `<script>` block is added in `<head>` (pre-render attribute application)
  - New picker HTML is added before `</body>`
  - A new `<script>` block is added before `</body>` (picker behavior)

No new files. No dependencies.

---

### Task 1: Add banner variables and dark-mode CSS overrides

This task makes the banner themable and adds the dark-mode surface palette. Color themes come in Tasks 2 and 3.

**Files:**
- Modify: `c:/Users/AyaanAhmed/Desktop/Practice/Exercise1/index.html` — extend `:root` and add a dark-mode override block.

- [ ] **Step 1: Add `--banner-start` and `--banner-end` to `:root` and refactor `.banner` to use them**

Find:
```css
    :root {
      --accent: #0a66c2;
      --page-bg: #f3f2ef;
      --card-bg: #ffffff;
      --text-primary: #1d1d1f;
      --text-secondary: #5f6368;
      --border: rgba(0, 0, 0, 0.08);
    }
```

Replace with:
```css
    :root {
      --accent: #0a66c2;
      --banner-start: #0a66c2;
      --banner-end: #378fe9;
      --page-bg: #f3f2ef;
      --card-bg: #ffffff;
      --text-primary: #1d1d1f;
      --text-secondary: #5f6368;
      --border: rgba(0, 0, 0, 0.08);
    }
```

Find:
```css
    .banner {
      height: 96px;
      background: linear-gradient(135deg, #0a66c2 0%, #378fe9 100%);
    }
```

Replace with:
```css
    .banner {
      height: 96px;
      background: linear-gradient(135deg, var(--banner-start) 0%, var(--banner-end) 100%);
    }
```

- [ ] **Step 2: Add the dark-mode surface override block**

Insert this block immediately AFTER the `:root { ... }` block (before `* { box-sizing: border-box; }`):

```css
    [data-mode="dark"] {
      --page-bg: #15202b;
      --card-bg: #1e2732;
      --text-primary: #e7e9ea;
      --text-secondary: #71767b;
      --border: rgba(255, 255, 255, 0.1);
    }
```

- [ ] **Step 3: Verify no visual change in the default state**

Action: Reload `Exercise1/index.html` in the browser.
Expected: Page looks identical to before — same blue banner, white card, soft grey background. (No `data-mode` attribute is set on `<html>` yet, so the dark overrides don't apply.)

- [ ] **Step 4: Manually verify dark mode works**

Action: Open devtools → Elements → click on `<html>` → add the attribute `data-mode="dark"`.
Expected: Page background turns near-black (`#15202b`), card turns dark grey (`#1e2732`), name and headline text turns light, dividers become faint white. Banner remains the original blue gradient (color themes not yet wired). No console errors.

Action: Remove the attribute again.
Expected: Page reverts to the light look.

---

### Task 2: Add the 5 light-mode color theme overrides

**Files:**
- Modify: `c:/Users/AyaanAhmed/Desktop/Practice/Exercise1/index.html` — add CSS overrides for accent and banner per theme.

- [ ] **Step 1: Insert the 5 theme override blocks**

Insert immediately AFTER the `[data-mode="dark"] { ... }` block from Task 1:

```css
    [data-theme="blue"] {
      --accent: #0a66c2;
      --banner-start: #0a66c2;
      --banner-end: #378fe9;
    }
    [data-theme="green"] {
      --accent: #2e7d32;
      --banner-start: #2e7d32;
      --banner-end: #66bb6a;
    }
    [data-theme="orange"] {
      --accent: #e65100;
      --banner-start: #e65100;
      --banner-end: #ff9800;
    }
    [data-theme="purple"] {
      --accent: #6a1b9a;
      --banner-start: #6a1b9a;
      --banner-end: #ab47bc;
    }
    [data-theme="teal"] {
      --accent: #00796b;
      --banner-start: #00796b;
      --banner-end: #26a69a;
    }
```

- [ ] **Step 2: Manually verify each theme**

Action: In devtools, set `<html data-theme="green">`, then reload-rerender or just observe.
Expected: Banner gradient turns green, SVG icons (politics/education/work) turn green.

Repeat for `data-theme="orange"`, `data-theme="purple"`, `data-theme="teal"`. Each should change the banner gradient and icon colors to the matching color family. Without `data-theme`, the page should look the same as the default blue (because `:root` already defines blue values).

---

### Task 3: Add the 5 dark-mode color theme overrides

**Files:**
- Modify: `c:/Users/AyaanAhmed/Desktop/Practice/Exercise1/index.html` — add CSS overrides for the dark-mode + theme combinations.

- [ ] **Step 1: Insert the 5 dark+theme override blocks**

Insert immediately AFTER the `[data-theme="teal"] { ... }` block from Task 2:

```css
    [data-mode="dark"][data-theme="blue"] {
      --accent: #1d9bf0;
      --banner-start: #1d9bf0;
      --banner-end: #4cb5f9;
    }
    [data-mode="dark"][data-theme="green"] {
      --accent: #4caf50;
      --banner-start: #4caf50;
      --banner-end: #81c784;
    }
    [data-mode="dark"][data-theme="orange"] {
      --accent: #ff7043;
      --banner-start: #ff7043;
      --banner-end: #ffab91;
    }
    [data-mode="dark"][data-theme="purple"] {
      --accent: #ab47bc;
      --banner-start: #ab47bc;
      --banner-end: #ce93d8;
    }
    [data-mode="dark"][data-theme="teal"] {
      --accent: #26a69a;
      --banner-start: #26a69a;
      --banner-end: #4db6ac;
    }
```

- [ ] **Step 2: Manually verify each dark+theme combination**

Action: In devtools, set both `<html data-mode="dark" data-theme="green">`.
Expected: Near-black page background, dark grey card, brighter green banner gradient, brighter green icons, light text — all legible.

Repeat for `data-mode="dark"` paired with each of `blue`, `orange`, `purple`, `teal`. Each should show the dark surface palette with the matching brighter accent. Confirm text and icons are clearly visible against the dark backgrounds.

---

### Task 4: Add the pre-render script (localStorage application)

This script reads the saved theme and mode and applies them to `<html>` BEFORE the body paints, so dark-mode visitors don't see a light flash.

**Files:**
- Modify: `c:/Users/AyaanAhmed/Desktop/Practice/Exercise1/index.html` — insert a `<script>` block immediately after the closing `</style>` and before `</head>`.

- [ ] **Step 1: Insert the pre-render script**

Find:
```html
  </style>
</head>
```

Replace with:
```html
  </style>
  <script>
    (function () {
      var theme = localStorage.getItem('theme') || 'blue';
      var mode = localStorage.getItem('mode') || 'light';
      var html = document.documentElement;
      html.setAttribute('data-theme', theme);
      html.setAttribute('data-mode', mode);
    })();
  </script>
</head>
```

- [ ] **Step 2: Verify default behavior on a fresh browser state**

Action: Open devtools → Application tab → Local Storage → select the file's origin → clear all entries. Reload the page.
Expected: Page renders in blue light mode (default). In Elements, `<html>` has `data-theme="blue"` and `data-mode="light"` attributes set.

- [ ] **Step 3: Verify saved dark mode applies without flashing**

Action: In devtools console, run:
```js
localStorage.setItem('mode', 'dark');
localStorage.setItem('theme', 'purple');
```
Then hard-reload the page (Ctrl+Shift+R).
Expected: Page renders in dark mode with purple accents from the very first paint. NO flash of light theme during load. `<html>` has `data-theme="purple"` and `data-mode="dark"`.

- [ ] **Step 4: Reset to defaults for the next task**

Action: In devtools console:
```js
localStorage.clear();
```
Reload. Page should be blue + light again.

---

### Task 5: Add the picker FAB + popover (HTML + CSS only)

This task adds the floating button and popover markup with full styling, but no JavaScript behavior yet — clicking does nothing. The popover starts hidden.

**Files:**
- Modify: `c:/Users/AyaanAhmed/Desktop/Practice/Exercise1/index.html` — append picker styles to `<style>`, append picker HTML before `</body>`.

- [ ] **Step 1: Append picker CSS to the `<style>` block**

Find the closing of the existing media query and the closing `</style>`:
```css
    @media (max-width: 600px) {
      .card { margin: 0; border-radius: 0; }
      .profile { padding: 1.25rem; }
      .name { font-size: 1.625rem; }
      .banner { height: 72px; }
    }
  </style>
```

Replace with:
```css
    @media (max-width: 600px) {
      .card { margin: 0; border-radius: 0; }
      .profile { padding: 1.25rem; }
      .name { font-size: 1.625rem; }
      .banner { height: 72px; }
    }

    .theme-picker {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 100;
    }

    .theme-picker__fab {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: none;
      background: var(--accent);
      color: #ffffff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
      transition: transform 0.15s ease;
    }

    .theme-picker__fab:hover { transform: scale(1.05); }
    .theme-picker__fab:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }

    .theme-picker__panel {
      position: absolute;
      bottom: calc(100% + 0.75rem);
      right: 0;
      width: 220px;
      background: var(--card-bg);
      color: var(--text-primary);
      border-radius: 8px;
      box-shadow: 0 0 0 1px var(--border), 0 8px 24px rgba(0, 0, 0, 0.15);
      padding: 1rem;
      display: none;
    }

    .theme-picker__panel[data-open="true"] { display: block; }

    .theme-picker__label {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--text-secondary);
      margin: 0 0 0.5rem;
    }

    .theme-picker__colors {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .theme-picker__color {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      padding: 0;
      box-shadow: 0 0 0 2px transparent;
      transition: box-shadow 0.15s ease;
    }

    .theme-picker__color[aria-pressed="true"] {
      box-shadow: 0 0 0 2px var(--card-bg), 0 0 0 4px var(--accent);
    }

    .theme-picker__color--blue   { background: #0a66c2; }
    .theme-picker__color--green  { background: #2e7d32; }
    .theme-picker__color--orange { background: #e65100; }
    .theme-picker__color--purple { background: #6a1b9a; }
    .theme-picker__color--teal   { background: #00796b; }

    .theme-picker__modes {
      display: flex;
      gap: 0.25rem;
      background: var(--page-bg);
      border-radius: 999px;
      padding: 0.25rem;
    }

    .theme-picker__mode {
      flex: 1;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 0.375rem 0.5rem;
      border-radius: 999px;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
    }

    .theme-picker__mode[aria-pressed="true"] {
      background: var(--accent);
      color: #ffffff;
    }
  </style>
```

- [ ] **Step 2: Append picker HTML just before `</body>`**

Find:
```html
  </main>
</body>
</html>
```

Replace with:
```html
  </main>

  <div class="theme-picker" id="themePicker">
    <button type="button" class="theme-picker__fab" id="themePickerFab" aria-label="Open theme picker" aria-expanded="false" aria-controls="themePickerPanel">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
        <path d="M12 3a9 9 0 0 0 0 18 1.5 1.5 0 0 0 1.5-1.5c0-.39-.15-.74-.39-1-.24-.27-.39-.62-.39-1A1.5 1.5 0 0 1 14.22 16H16a5 5 0 0 0 5-5c0-4.42-4.03-8-9-8Zm-5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"/>
      </svg>
    </button>

    <div class="theme-picker__panel" id="themePickerPanel" role="dialog" aria-label="Theme settings">
      <p class="theme-picker__label">Color</p>
      <div class="theme-picker__colors" role="group" aria-label="Accent color">
        <button type="button" class="theme-picker__color theme-picker__color--blue"   data-color="blue"   aria-label="Blue"   aria-pressed="true"></button>
        <button type="button" class="theme-picker__color theme-picker__color--green"  data-color="green"  aria-label="Green"  aria-pressed="false"></button>
        <button type="button" class="theme-picker__color theme-picker__color--orange" data-color="orange" aria-label="Orange" aria-pressed="false"></button>
        <button type="button" class="theme-picker__color theme-picker__color--purple" data-color="purple" aria-label="Purple" aria-pressed="false"></button>
        <button type="button" class="theme-picker__color theme-picker__color--teal"   data-color="teal"   aria-label="Teal"   aria-pressed="false"></button>
      </div>

      <p class="theme-picker__label">Mode</p>
      <div class="theme-picker__modes" role="group" aria-label="Light or dark mode">
        <button type="button" class="theme-picker__mode" data-mode="light" aria-pressed="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
            <path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0-5a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1Zm0 17a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1ZM4.22 4.22a1 1 0 0 1 1.42 0l1.4 1.42a1 1 0 1 1-1.4 1.4L4.22 5.64a1 1 0 0 1 0-1.42Zm12.74 12.74a1 1 0 0 1 1.4 0l1.42 1.4a1 1 0 1 1-1.42 1.42l-1.4-1.42a1 1 0 0 1 0-1.4ZM2 12a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1Zm17 0a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2h-2a1 1 0 0 1-1-1ZM4.22 19.78a1 1 0 0 1 0-1.42l1.4-1.4a1 1 0 1 1 1.42 1.4l-1.42 1.42a1 1 0 0 1-1.4 0Zm12.74-12.74a1 1 0 0 1 0-1.4l1.4-1.42a1 1 0 1 1 1.42 1.42l-1.42 1.4a1 1 0 0 1-1.4 0Z"/>
          </svg>
          Light
        </button>
        <button type="button" class="theme-picker__mode" data-mode="dark" aria-pressed="false">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z"/>
          </svg>
          Dark
        </button>
      </div>
    </div>
  </div>
</body>
</html>
```

- [ ] **Step 3: Verify the FAB renders and the popover is hidden**

Action: Reload `Exercise1/index.html`.
Expected: A blue 44px circular button appears in the bottom-right corner with a small palette icon. The popover is NOT visible. Clicking the FAB does nothing yet. No console errors.

- [ ] **Step 4: Manually verify the popover styling**

Action: In devtools Elements, find `<div class="theme-picker__panel" ...>` and add the attribute `data-open="true"`.
Expected: A white panel appears above the FAB containing:
- "COLOR" label
- Five colored circles (blue ringed, the others not)
- "MODE" label
- A pill with "☀ Light" (filled blue) and "☾ Dark" (transparent)

The panel sits ~12px above the FAB and is right-aligned with it. Remove the `data-open="true"` attribute — panel hides again.

---

### Task 6: Add picker behavior (open/close + selection + persistence)

**Files:**
- Modify: `c:/Users/AyaanAhmed/Desktop/Practice/Exercise1/index.html` — add a `<script>` block before `</body>`.

- [ ] **Step 1: Insert the behavior script just before `</body>`**

Find:
```html
    </div>
  </div>
</body>
</html>
```

Replace with:
```html
    </div>
  </div>

  <script>
    (function () {
      var html = document.documentElement;
      var picker = document.getElementById('themePicker');
      var fab = document.getElementById('themePickerFab');
      var panel = document.getElementById('themePickerPanel');
      var colorButtons = panel.querySelectorAll('.theme-picker__color');
      var modeButtons = panel.querySelectorAll('.theme-picker__mode');

      function syncSelectedState() {
        var currentTheme = html.getAttribute('data-theme') || 'blue';
        var currentMode = html.getAttribute('data-mode') || 'light';
        colorButtons.forEach(function (btn) {
          btn.setAttribute('aria-pressed', btn.dataset.color === currentTheme ? 'true' : 'false');
        });
        modeButtons.forEach(function (btn) {
          btn.setAttribute('aria-pressed', btn.dataset.mode === currentMode ? 'true' : 'false');
        });
      }

      function openPanel() {
        panel.setAttribute('data-open', 'true');
        fab.setAttribute('aria-expanded', 'true');
      }

      function closePanel() {
        panel.removeAttribute('data-open');
        fab.setAttribute('aria-expanded', 'false');
      }

      function isOpen() {
        return panel.getAttribute('data-open') === 'true';
      }

      fab.addEventListener('click', function (e) {
        e.stopPropagation();
        if (isOpen()) { closePanel(); } else { openPanel(); }
      });

      panel.addEventListener('click', function (e) {
        e.stopPropagation();
      });

      document.addEventListener('click', function () {
        if (isOpen()) { closePanel(); }
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && isOpen()) { closePanel(); }
      });

      colorButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var color = btn.dataset.color;
          html.setAttribute('data-theme', color);
          localStorage.setItem('theme', color);
          syncSelectedState();
        });
      });

      modeButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var mode = btn.dataset.mode;
          html.setAttribute('data-mode', mode);
          localStorage.setItem('mode', mode);
          syncSelectedState();
        });
      });

      syncSelectedState();
    })();
  </script>
</body>
</html>
```

- [ ] **Step 2: Verify open / close behavior**

Action: Reload the page. Click the FAB.
Expected: Popover panel appears above the FAB with the blue circle ringed and "Light" pill filled.

Action: Click the FAB again.
Expected: Panel closes.

Action: Click the FAB to open, then click on the page background outside the panel.
Expected: Panel closes.

Action: Click the FAB to open, then press the Escape key.
Expected: Panel closes.

Action: Click the FAB to open, then click inside the panel (on a label, for instance).
Expected: Panel stays open.

- [ ] **Step 3: Verify color selection**

Action: Open the popover. Click the green circle.
Expected: Banner gradient changes to green immediately, icons turn green, FAB itself turns green, the green circle gets a ring (and blue loses its ring). Panel stays open.

Action: Click each of orange, purple, teal in turn.
Expected: Each click changes accent + banner + FAB color immediately. The newly clicked circle has the ring.

Action: Click blue.
Expected: Returns to the original LinkedIn blue look.

- [ ] **Step 4: Verify mode toggle**

Action: With the popover open, click "Dark".
Expected: Page background turns near-black, card turns dark grey, text turns light, the "Dark" pill gets the accent fill, "Light" loses its fill. Banner stays the current accent color (now in the brighter dark variant).

Action: Click "Light".
Expected: Page returns to light surface palette.

- [ ] **Step 5: Verify persistence across reloads**

Action: Set theme to purple and mode to dark using the picker. Reload the page (Ctrl+R).
Expected: Page reloads with purple accents and dark mode already applied (no flash). Popover is closed. Open the popover — purple circle is ringed, "Dark" pill is filled.

Action: In devtools console, run `localStorage.clear()` and reload.
Expected: Page returns to blue + light defaults.

- [ ] **Step 6: Verify each of the 10 combinations is legible**

Action: Cycle through all 10 combinations using the picker:
- light + blue, green, orange, purple, teal
- dark + blue, green, orange, purple, teal

For each: name, headline, "About" heading, the three about-item texts, and all three SVG icons must be clearly visible against their backgrounds. Banner gradient and FAB should be in the matching color family. No element should blend invisibly into its background.

- [ ] **Step 7: Verify mobile layout (375px viewport)**

Action: In devtools, set device toolbar viewport to 375px wide. Reload.
Expected:
- Card fills viewport with no horizontal scroll
- FAB stays visible in the bottom-right, doesn't overlap content
- Tapping FAB opens the popover, which fits within the viewport (~220px wide, ~24px from the right edge)
- All controls are tappable
- Theme + mode changes work the same as on desktop

---

## Verification Checklist (run after Task 6)

- [ ] Default first-load (cleared `localStorage`) shows the original LinkedIn blue + light look
- [ ] Picker FAB is visible in the bottom-right and uses the current accent color
- [ ] Popover opens on FAB click, closes on outside click, FAB click, or Escape
- [ ] All 5 color circles are clickable and switch the accent + banner + FAB color
- [ ] Light/Dark pill correctly toggles the surface palette
- [ ] Selected color circle shows a ring; selected mode pill is filled with the accent
- [ ] Theme + mode persist across page reloads via `localStorage`
- [ ] Loading the page with `localStorage.mode = "dark"` shows no flash of light theme
- [ ] All 10 theme combinations render legibly (text contrasts cleanly with backgrounds)
- [ ] No console errors, no external network requests
- [ ] Mobile (375px) layout still works, picker remains usable
