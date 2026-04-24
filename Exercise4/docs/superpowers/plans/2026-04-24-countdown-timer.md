# Countdown Timer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-file vanilla web app (`Exercise4/index.html`) that supports concurrent duration timers and target-date countdowns, persisted to localStorage, with finish alerts (beep, flash, notification) for duration timers — per [the spec](../specs/2026-04-24-countdown-timer-design.md).

**Architecture:** One HTML file with embedded `<style>` and `<script>`. Vanilla JS in an IIFE. State is a single `timers[]` array persisted to `localStorage['exercise4.timers']`. A single global `setInterval` updates only time-display text in-place each tick; the full card list is re-rendered only on add/delete/pause/resume/reset/finish. No build step, no dependencies.

**Tech Stack:** HTML5, CSS3, ES5/ES6 vanilla JavaScript, Web Audio API (beep), Notifications API (browser notification), localStorage (persistence).

**Verification model:** No test runner. Every task ends with an explicit manual check by opening `Exercise4/index.html` in a browser. The spec's *Verification* section is the end-to-end acceptance test after Task 9.

---

## File structure

Single file:
- `Exercise4/index.html` — created in Task 1, modified in every subsequent task.

The file is built up in stages; each task adds a coherent chunk of HTML / CSS / JS. Anchors below say *where* in the file new code goes.

---

## Task 1: Page scaffold + state primitives

**Goal of this task:** A blank-but-styled page loads with a header, an empty Add panel skeleton, an empty list, and the empty-state message visible. The IIFE wires up `load()`, `save()`, an empty `render()`, and DOM lookups. No interactivity yet.

**Files:**
- Create: `Exercise4/index.html`

- [ ] **Step 1: Create the file with this complete content**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Countdown Timer</title>
  <style>
    :root {
      --bg: #0f172a;
      --panel: #1e293b;
      --panel-2: #273449;
      --text: #e2e8f0;
      --text-dim: #94a3b8;
      --accent: #38bdf8;
      --accent-hover: #7dd3fc;
      --danger: #f87171;
      --success: #4ade80;
      --finished: #facc15;
      --border: rgba(255, 255, 255, 0.08);
      --radius: 10px;
    }

    * { box-sizing: border-box; }

    html, body {
      margin: 0;
      padding: 0;
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 16px;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }

    .app {
      max-width: 640px;
      margin: 2.5rem auto;
      padding: 0 1rem;
    }

    .app__title {
      margin: 0 0 0.25rem;
      font-size: 1.75rem;
      font-weight: 700;
      letter-spacing: -0.01em;
    }

    .app__subtitle {
      margin: 0 0 1.5rem;
      color: var(--text-dim);
      font-size: 0.95rem;
    }

    .add {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1rem;
      margin-bottom: 1.5rem;
    }

    .add__tabs {
      display: flex;
      gap: 0.25rem;
      background: var(--panel-2);
      border-radius: 999px;
      padding: 0.25rem;
      margin-bottom: 0.75rem;
    }

    .add__tab {
      flex: 1;
      padding: 0.4rem 0.75rem;
      border: none;
      background: transparent;
      color: var(--text-dim);
      border-radius: 999px;
      cursor: pointer;
      font: inherit;
      font-size: 0.875rem;
    }

    .add__tab[aria-pressed="true"] {
      background: var(--accent);
      color: #0f172a;
      font-weight: 600;
    }

    .add__row {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .add__row > input {
      flex: 1;
      min-width: 0;
      padding: 0.55rem 0.75rem;
      font: inherit;
      color: var(--text);
      background: var(--panel-2);
      border: 1px solid var(--border);
      border-radius: 6px;
      outline: none;
    }

    .add__row > input:focus {
      border-color: var(--accent);
    }

    .add__btn {
      padding: 0.55rem 1.1rem;
      font: inherit;
      font-weight: 600;
      color: #0f172a;
      background: var(--accent);
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }

    .add__btn:hover { background: var(--accent-hover); }

    .add__error {
      margin: 0.5rem 0 0;
      min-height: 1.25rem;
      font-size: 0.85rem;
      color: var(--danger);
    }

    .list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .empty {
      margin: 0;
      padding: 2rem 0;
      text-align: center;
      color: var(--text-dim);
      font-size: 0.95rem;
    }

    .empty[hidden] { display: none; }

    .pane[hidden] { display: none; }
  </style>
</head>
<body>
  <main class="app">
    <h1 class="app__title">Countdown Timer</h1>
    <p class="app__subtitle">Run multiple timers and date countdowns. Saved in your browser.</p>

    <section class="add" id="add">
      <div class="add__tabs">
        <button type="button" class="add__tab" data-tab="duration" aria-pressed="true">Duration</button>
        <button type="button" class="add__tab" data-tab="target" aria-pressed="false">Target date</button>
      </div>

      <form class="add__form" id="addForm" autocomplete="off">
        <div class="pane" id="paneDuration">
          <div class="add__row">
            <input type="text" id="durLabel" placeholder="Label (optional)" aria-label="Timer label" maxlength="60" />
            <input type="text" id="durTime" placeholder="mm:ss, hh:mm:ss, or minutes" aria-label="Duration" />
            <button type="submit" class="add__btn">Add</button>
          </div>
        </div>
        <div class="pane" id="paneTarget" hidden>
          <div class="add__row">
            <input type="text" id="tgtLabel" placeholder="Label (optional)" aria-label="Countdown label" maxlength="60" />
            <input type="datetime-local" id="tgtWhen" aria-label="Target date and time" />
            <button type="submit" class="add__btn">Add</button>
          </div>
        </div>
        <p class="add__error" id="addError" role="alert"></p>
      </form>
    </section>

    <ul class="list" id="list" aria-live="polite"></ul>
    <p class="empty" id="empty">No timers yet &mdash; add one above.</p>
  </main>

  <script>
    (function () {
      'use strict';

      var STORAGE_KEY = 'exercise4.timers';
      var TICK_MS = 250;
      var MAX_DURATION_MS = 24 * 60 * 60 * 1000;

      var timers = load();
      var activeTab = 'duration';

      var els = {};

      function load() {
        try {
          var raw = localStorage.getItem(STORAGE_KEY);
          if (!raw) { return []; }
          var parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          return [];
        }
      }

      function save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(timers));
      }

      function makeId() {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
          return window.crypto.randomUUID();
        }
        return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
      }

      function render() {
        // Filled in Task 2 (cards) and Task 6 (empty-state toggle).
        els.empty.hidden = timers.length > 0;
      }

      function setTab(name) {
        activeTab = name;
        document.querySelectorAll('.add__tab').forEach(function (b) {
          b.setAttribute('aria-pressed', b.dataset.tab === name ? 'true' : 'false');
        });
        els.paneDuration.hidden = name !== 'duration';
        els.paneTarget.hidden = name !== 'target';
        els.error.textContent = '';
      }

      function init() {
        els.list = document.getElementById('list');
        els.empty = document.getElementById('empty');
        els.form = document.getElementById('addForm');
        els.error = document.getElementById('addError');
        els.paneDuration = document.getElementById('paneDuration');
        els.paneTarget = document.getElementById('paneTarget');

        document.querySelectorAll('.add__tab').forEach(function (b) {
          b.addEventListener('click', function () { setTab(b.dataset.tab); });
        });

        render();
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        init();
      }
    })();
  </script>
</body>
</html>
```

- [ ] **Step 2: Open in browser and verify**

Open `Exercise4/index.html` in a browser. Expected:
- Page loads with title "Countdown Timer" and a dark theme.
- An Add panel is visible with two tabs ("Duration" pressed, "Target date" not pressed).
- The Duration pane shows two text inputs and an Add button.
- Clicking "Target date" switches the panel to a label input + datetime input + Add button. Clicking "Duration" switches back.
- "No timers yet — add one above." is visible below the panel.
- DevTools console: no errors.

---

## Task 2: Add a duration timer (parse, validate, render card)

**Goal of this task:** Submitting the Duration form parses the input, creates a timer object in the list, persists, and renders a static card showing the initial time. No ticking yet — just static display. Invalid input shows an inline error.

**Files:**
- Modify: `Exercise4/index.html` — add CSS for `.card`, add JS for `parseDuration`, `addDuration`, full card rendering, form-submit wiring.

- [ ] **Step 1: Add card CSS inside the `<style>` tag, after the `.empty` block**

```css
    .card {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1rem 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .card__row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .card__label {
      flex: 1;
      min-width: 0;
      font-weight: 600;
      color: var(--text);
      word-break: break-word;
    }

    .card__kind {
      font-size: 0.75rem;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .card__time {
      font-variant-numeric: tabular-nums;
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: 0.02em;
    }

    .card__controls {
      display: flex;
      gap: 0.5rem;
    }

    .card__btn {
      padding: 0.4rem 0.85rem;
      font: inherit;
      font-size: 0.875rem;
      color: var(--text);
      background: var(--panel-2);
      border: 1px solid var(--border);
      border-radius: 6px;
      cursor: pointer;
    }

    .card__btn:hover { background: #334155; }

    .card__delete {
      width: 32px;
      height: 32px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      color: var(--text-dim);
      border-radius: 6px;
      cursor: pointer;
      font-size: 1.25rem;
      line-height: 1;
    }

    .card__delete:hover { color: var(--danger); background: rgba(248, 113, 113, 0.1); }
```

- [ ] **Step 2: Replace the placeholder `render()` function with a real one that draws cards**

Find the existing `render()` in the IIFE and replace its entire body with:

```js
      function formatDuration(ms) {
        var total = Math.max(0, Math.ceil(ms / 1000));
        var h = Math.floor(total / 3600);
        var m = Math.floor((total % 3600) / 60);
        var s = total % 60;
        var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
        return h > 0 ? h + ':' + pad(m) + ':' + pad(s) : pad(m) + ':' + pad(s);
      }

      function liveRemaining(t) {
        if (t.kind === 'duration') {
          if (t.running && t.lastTickAt != null) {
            return Math.max(0, t.remainingMs - (Date.now() - t.lastTickAt));
          }
          return Math.max(0, t.remainingMs);
        }
        return Math.max(0, new Date(t.targetIso).getTime() - Date.now());
      }

      function renderCard(t) {
        var li = document.createElement('li');
        li.className = 'card';
        li.dataset.id = t.id;
        li.dataset.kind = t.kind;

        var row1 = document.createElement('div');
        row1.className = 'card__row';

        var label = document.createElement('span');
        label.className = 'card__label';
        label.textContent = t.label;

        var kind = document.createElement('span');
        kind.className = 'card__kind';
        kind.textContent = t.kind === 'duration' ? 'Timer' : 'Countdown';

        var del = document.createElement('button');
        del.type = 'button';
        del.className = 'card__delete';
        del.dataset.action = 'delete';
        del.setAttribute('aria-label', 'Delete ' + t.label);
        del.textContent = '×';

        row1.appendChild(label);
        row1.appendChild(kind);
        row1.appendChild(del);

        var time = document.createElement('div');
        time.className = 'card__time';
        time.dataset.role = 'time';
        time.textContent = t.kind === 'duration'
          ? formatDuration(liveRemaining(t))
          : '—'; // em-dash placeholder, real format added in Task 3

        li.appendChild(row1);
        li.appendChild(time);

        // Controls row added in Task 5 (duration timers only).

        return li;
      }

      // Full re-render of the card list. Call ONLY on add/delete/pause/resume/reset/finish —
      // never inside tick(), which mutates time-display text in place to keep DOM stable.
      function render() {
        els.list.innerHTML = '';
        timers.forEach(function (t) {
          els.list.appendChild(renderCard(t));
        });
        els.empty.hidden = timers.length > 0;
      }
```

- [ ] **Step 3: Add the duration parser and add-handler inside the IIFE, before `init()`**

```js
      function parseDuration(raw) {
        var s = (raw || '').trim();
        if (!s) { return null; }

        // Plain number → minutes
        if (/^\d+(\.\d+)?$/.test(s)) {
          var mins = parseFloat(s);
          return mins > 0 ? Math.round(mins * 60 * 1000) : null;
        }

        // mm:ss or hh:mm:ss
        var parts = s.split(':');
        if (parts.length < 2 || parts.length > 3) { return null; }
        for (var i = 0; i < parts.length; i++) {
          if (!/^\d+$/.test(parts[i])) { return null; }
        }
        var nums = parts.map(function (p) { return parseInt(p, 10); });
        var ms;
        if (nums.length === 2) {
          if (nums[1] >= 60) { return null; }
          ms = (nums[0] * 60 + nums[1]) * 1000;
        } else {
          if (nums[1] >= 60 || nums[2] >= 60) { return null; }
          ms = (nums[0] * 3600 + nums[1] * 60 + nums[2]) * 1000;
        }
        return ms > 0 ? ms : null;
      }

      var MAX_DURATION_MS = 24 * 60 * 60 * 1000;

      function addDuration(rawLabel, rawTime) {
        var ms = parseDuration(rawTime);
        if (ms == null) {
          els.error.textContent = 'Enter a duration like 5:00, 1:30:00, or 5 (minutes).';
          return false;
        }
        if (ms > MAX_DURATION_MS) {
          els.error.textContent = 'Maximum duration is 24 hours.';
          return false;
        }
        var label = (rawLabel || '').trim().slice(0, 60) || 'Timer';
        timers.unshift({
          id: makeId(),
          kind: 'duration',
          label: label,
          durationMs: ms,
          remainingMs: ms,
          running: false,
          lastTickAt: null
        });
        save();
        render();
        els.error.textContent = '';
        return true;
      }
```

- [ ] **Step 4: Wire up the form submit inside `init()`**

In `init()`, after the tab-button forEach block, add:

```js
        els.form.addEventListener('submit', function (e) {
          e.preventDefault();
          if (activeTab === 'duration') {
            var labelEl = document.getElementById('durLabel');
            var timeEl = document.getElementById('durTime');
            if (addDuration(labelEl.value, timeEl.value)) {
              labelEl.value = '';
              timeEl.value = '';
              timeEl.focus();
            }
          }
          // Target tab handled in Task 3.
        });
```

- [ ] **Step 5: Open in browser and verify**

Reload `Exercise4/index.html`. Expected:
- Type `5:00` in the time field, click Add → a card appears with label "Timer", kind "TIMER", time `05:00`, no controls visible yet (just delete `×` which doesn't work yet).
- Empty-state message disappears.
- Add another with label "Tea" and time `2` → second card on top, label "Tea", time `02:00`.
- Submit empty time → inline error "Enter a duration like 5:00, 1:30:00, or 5 (minutes)." Nothing added.
- Submit `garbage` → same error.
- Submit `25:00:00` (25h) → error "Maximum duration is 24 hours."
- Reload page → both cards still there (persistence already working via Task 1's save/load).

---

## Task 3: Add a target-date countdown

**Goal of this task:** The Target date tab works: pick a future date/time, Add creates a target-date timer in the list, the card displays a `Dd HHh MMm SSs` static value (still no live ticking — that's Task 4). Past dates are rejected inline.

**Files:**
- Modify: `Exercise4/index.html` — add `formatTarget`, `addTarget`, branch `renderCard` time text, extend submit handler.

- [ ] **Step 1: Add `formatTarget` next to `formatDuration` in the IIFE**

```js
      function formatTarget(ms) {
        var total = Math.max(0, Math.floor(ms / 1000));
        var d = Math.floor(total / 86400);
        var h = Math.floor((total % 86400) / 3600);
        var m = Math.floor((total % 3600) / 60);
        var s = total % 60;
        var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
        return d + 'd ' + pad(h) + 'h ' + pad(m) + 'm ' + pad(s) + 's';
      }
```

- [ ] **Step 2: Update the time-text branch in `renderCard`**

In `renderCard`, find:

```js
        time.textContent = t.kind === 'duration'
          ? formatDuration(liveRemaining(t))
          : '—'; // em-dash placeholder, real format added in Task 3
```

Replace with:

```js
        time.textContent = t.kind === 'duration'
          ? formatDuration(liveRemaining(t))
          : formatTarget(liveRemaining(t));
```

- [ ] **Step 3: Add `addTarget` near `addDuration` in the IIFE**

```js
      function addTarget(rawLabel, rawWhen) {
        if (!rawWhen) {
          els.error.textContent = 'Pick a date and time.';
          return false;
        }
        var d = new Date(rawWhen);
        if (isNaN(d.getTime())) {
          els.error.textContent = 'Could not parse that date.';
          return false;
        }
        if (d.getTime() <= Date.now()) {
          els.error.textContent = 'Pick a date in the future.';
          return false;
        }
        var label = (rawLabel || '').trim().slice(0, 60) || 'Countdown';
        timers.unshift({
          id: makeId(),
          kind: 'target',
          label: label,
          targetIso: d.toISOString()
        });
        save();
        render();
        els.error.textContent = '';
        return true;
      }
```

- [ ] **Step 4: Extend the form submit handler in `init()`**

Replace the existing comment `// Target tab handled in Task 3.` with:

```js
          if (activeTab === 'target') {
            var tLabelEl = document.getElementById('tgtLabel');
            var tWhenEl = document.getElementById('tgtWhen');
            if (addTarget(tLabelEl.value, tWhenEl.value)) {
              tLabelEl.value = '';
              tWhenEl.value = '';
            }
          }
```

- [ ] **Step 5: Open in browser and verify**

Reload `Exercise4/index.html`. Expected:
- Switch to "Target date" tab. Pick a date ~2 minutes from now, label "Soon", click Add → card appears with kind "COUNTDOWN" and a time like `0d 00h 01m 59s` (static — does not yet tick down).
- Pick a date in the past → inline error "Pick a date in the future."
- Submit with no date → "Pick a date and time."
- Reload page → all three card types persist correctly.

---

## Task 4: Tick loop — live in-place updates

**Goal of this task:** A single `setInterval(tick, 250)` updates the time-display text on every visible card without re-rendering the whole list. Duration timers tick down only when `running: true`; target-date countdowns always tick. (Duration timers are still not running yet — Task 5 wires up Pause/Resume.)

**Files:**
- Modify: `Exercise4/index.html` — add `tick()` and start the interval in `init()`.

- [ ] **Step 1: Add `tick()` inside the IIFE, after `render()`**

```js
      function tick() {
        var nodes = els.list.querySelectorAll('.card');
        nodes.forEach(function (node) {
          var id = node.dataset.id;
          var t = null;
          for (var i = 0; i < timers.length; i++) {
            if (timers[i].id === id) { t = timers[i]; break; }
          }
          if (!t) { return; }

          var ms = liveRemaining(t);
          var text = t.kind === 'duration' ? formatDuration(ms) : formatTarget(ms);
          var timeEl = node.querySelector('[data-role="time"]');
          if (timeEl && timeEl.textContent !== text) {
            timeEl.textContent = text;
          }
        });
      }
```

- [ ] **Step 2: Start the interval in `init()`**

At the end of `init()`, after `render();`, add:

```js
        setInterval(tick, TICK_MS);
```

- [ ] **Step 3: Open in browser and verify**

Reload `Exercise4/index.html`. Expected:
- The target-date countdown card from Task 3 now ticks down every second.
- Duration timer cards still show their static initial time (because `running` is still false — Task 5 fixes this).
- Open DevTools → Performance or just observe: no flicker, no input losing focus.

---

## Task 5: Duration controls — Start/Pause/Resume + Reset

**Goal of this task:** Each duration card shows a Start (or Resume) / Pause / Reset button row. Clicking them mutates `running` and `remainingMs` according to the spec's snapshot model. The tick loop already picks up the new values automatically.

**Files:**
- Modify: `Exercise4/index.html` — extend `renderCard` to add a controls row, add control handlers, attach a single delegated click listener to the list.

- [ ] **Step 1: Extend `renderCard` to add a controls row for duration timers**

In `renderCard`, after the line `li.appendChild(time);` and before `return li;`, add:

```js
        if (t.kind === 'duration') {
          var controls = document.createElement('div');
          controls.className = 'card__controls';

          // Finished cards show only Reset (per spec card anatomy table).
          var isFinished = t.remainingMs <= 0 && !t.running;
          if (!isFinished) {
            var primary = document.createElement('button');
            primary.type = 'button';
            primary.className = 'card__btn';
            if (t.running) {
              primary.dataset.action = 'pause';
              primary.textContent = 'Pause';
            } else {
              primary.dataset.action = 'resume';
              primary.textContent = t.remainingMs === t.durationMs ? 'Start' : 'Resume';
            }
            controls.appendChild(primary);
          }

          var reset = document.createElement('button');
          reset.type = 'button';
          reset.className = 'card__btn';
          reset.dataset.action = 'reset';
          reset.textContent = 'Reset';

          controls.appendChild(reset);
          li.appendChild(controls);
        }
```

- [ ] **Step 2: Add control handlers inside the IIFE, before `init()`**

```js
      function findTimer(id) {
        for (var i = 0; i < timers.length; i++) {
          if (timers[i].id === id) { return timers[i]; }
        }
        return null;
      }

      function startOrResume(id) {
        var t = findTimer(id);
        if (!t || t.kind !== 'duration') { return; }
        if (t.running) { return; }
        if (t.remainingMs <= 0) { return; }
        t.running = true;
        t.lastTickAt = Date.now();
        save();
        render();
      }

      function pause(id) {
        var t = findTimer(id);
        if (!t || t.kind !== 'duration') { return; }
        if (!t.running) { return; }
        t.remainingMs = Math.max(0, t.remainingMs - (Date.now() - t.lastTickAt));
        t.running = false;
        t.lastTickAt = null;
        save();
        render();
      }

      function reset(id) {
        var t = findTimer(id);
        if (!t || t.kind !== 'duration') { return; }
        t.running = false;
        t.lastTickAt = null;
        t.remainingMs = t.durationMs;
        save();
        render();
      }
```

- [ ] **Step 3: Attach a single delegated click listener to the list, inside `init()`**

After the form-submit listener, add:

```js
        els.list.addEventListener('click', function (e) {
          var btn = e.target.closest('button[data-action]');
          if (!btn) { return; }
          var card = btn.closest('.card');
          if (!card) { return; }
          var id = card.dataset.id;
          var action = btn.dataset.action;
          if (action === 'resume') { startOrResume(id); }
          else if (action === 'pause') { pause(id); }
          else if (action === 'reset') { reset(id); }
          // 'delete' handled in Task 6.
        });
```

- [ ] **Step 4: Open in browser and verify**

Reload `Exercise4/index.html`. Expected:
- Each duration card shows a `Start` button + `Reset` button.
- Click Start → button label flips to `Pause`, time begins counting down second by second.
- Click Pause → button flips to `Resume`, time freezes.
- Click Resume → time continues from where it paused.
- Click Reset → time returns to original, button shows `Start` (because `remainingMs === durationMs`).
- Reload mid-countdown → timer continues from approximately where it was (the elapsed reload time is correctly accounted for via `lastTickAt`).

---

## Task 6: Delete + empty-state behavior

**Goal of this task:** The `×` button on every card removes it from the list and persists. Removing the last card brings back the empty-state message.

**Files:**
- Modify: `Exercise4/index.html` — add `removeTimer` and wire the `delete` action in the delegated handler.

- [ ] **Step 1: Add `removeTimer` inside the IIFE, near the other control handlers**

```js
      function removeTimer(id) {
        timers = timers.filter(function (t) { return t.id !== id; });
        save();
        render();
      }
```

- [ ] **Step 2: Wire the `delete` action in the delegated click listener**

In the delegated listener inside `init()`, replace the comment `// 'delete' handled in Task 6.` with:

```js
          else if (action === 'delete') { removeTimer(id); }
```

- [ ] **Step 3: Open in browser and verify**

Reload `Exercise4/index.html`. Expected:
- Click `×` on any card → it's removed and the list re-renders.
- Delete every card → "No timers yet — add one above." reappears.
- Reload → the deletions persist (only undeleted cards return).

---

## Task 7: Resume on load — finish-while-closed detection

**Goal of this task:** When the page loads, any duration timer that was `running` and would have hit zero while the tab was closed is flipped to its finished state. Display shows `00:00`. This task does not yet fire alerts (beep/flash/notification) — that's Task 8 — but it sets up the finished state cleanly.

**Files:**
- Modify: `Exercise4/index.html` — add a `reconcileOnLoad()` function called once at startup before the first `render()`.

- [ ] **Step 1: Add `reconcileOnLoad` inside the IIFE, before `init()`**

```js
      function reconcileOnLoad() {
        var changed = false;
        timers.forEach(function (t) {
          if (t.kind !== 'duration') { return; }
          if (!t.running || t.lastTickAt == null) { return; }
          var live = t.remainingMs - (Date.now() - t.lastTickAt);
          if (live <= 0) {
            t.running = false;
            t.remainingMs = 0;
            t.lastTickAt = null;
            changed = true;
          }
        });
        if (changed) { save(); }
      }
```

- [ ] **Step 2: Call it from `init()` before `render()`**

In `init()`, just before `render();`, add:

```js
        reconcileOnLoad();
```

- [ ] **Step 3: Open in browser and verify**

Reload `Exercise4/index.html`. Then:
- Add a duration timer of `5` (5 minutes) and click Start.
- Wait 3 seconds, reload → timer still has ~4:57, still running. Good.
- Add another timer of `0:05` (5 seconds) and click Start. Immediately close the tab (Cmd/Ctrl+W).
- Wait at least 10 seconds, reopen `Exercise4/index.html`.
- Expected: that 5-second timer's card now shows `00:00`, with `Start` button (because reconcile reset it to `running: false, remainingMs: 0`). No alert fires yet — Task 8 adds that.

---

## Task 8: Finish behaviors — beep, flash, browser notification

**Goal of this task:** The instant a duration timer's live remaining first reaches 0 — whether mid-tick or detected on load — three things fire: Web Audio beep, CSS pulse animation on the card, browser notification (if permission granted). Permission is requested lazily the first time the user creates a duration timer.

**Files:**
- Modify: `Exercise4/index.html` — add `--finished` CSS, add `beep()` / `flashCard()` / `notify()` / `fireFinish()`, hook `tick()` and `reconcileOnLoad()`, request notification permission inside `addDuration()`.

- [ ] **Step 1: Add finished-state CSS inside the `<style>` tag, after the `.card__delete` block**

```css
    .card--finished {
      border-color: var(--finished);
      background: linear-gradient(180deg, rgba(250, 204, 21, 0.08), var(--panel));
    }

    .card--finished .card__time {
      color: var(--finished);
    }

    @keyframes card-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(250, 204, 21, 0); }
      50%      { box-shadow: 0 0 0 6px rgba(250, 204, 21, 0.35); }
    }

    .card--pulsing {
      animation: card-pulse 0.4s ease-in-out 3;
    }
```

- [ ] **Step 2: Add the alert primitives inside the IIFE, before `init()`**

```js
      var audioCtx = null;

      function beep() {
        try {
          if (!audioCtx) {
            var Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) { return; }
            audioCtx = new Ctx();
          }
          var now = audioCtx.currentTime;
          for (var i = 0; i < 3; i++) {
            var osc = audioCtx.createOscillator();
            var gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 880;
            var start = now + i * 0.4;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.25, start + 0.02);
            gain.gain.linearRampToValueAtTime(0, start + 0.25);
            osc.connect(gain).connect(audioCtx.destination);
            osc.start(start);
            osc.stop(start + 0.3);
          }
        } catch (e) { /* silent */ }
      }

      function flashCard(id) {
        var node = els.list.querySelector('.card[data-id="' + id + '"]');
        if (!node) { return; }
        node.classList.add('card--pulsing');
        setTimeout(function () {
          if (node.parentNode) { node.classList.remove('card--pulsing'); }
        }, 1400);
      }

      function notify(label) {
        try {
          if (typeof Notification === 'undefined') { return; }
          if (Notification.permission !== 'granted') { return; }
          new Notification('Timer done', { body: label });
        } catch (e) { /* silent */ }
      }

      function fireFinish(t) {
        beep();
        flashCard(t.id);
        notify(t.label);
      }
```

- [ ] **Step 3: Hook `fireFinish()` into `tick()` (detect first-zero crossings)**

Replace the entire body of `tick()` with:

```js
      function tick() {
        var nodes = els.list.querySelectorAll('.card');
        var finished = [];
        nodes.forEach(function (node) {
          var id = node.dataset.id;
          var t = findTimer(id);
          if (!t) { return; }

          var ms = liveRemaining(t);

          // Detect first-zero crossing for running duration timers.
          if (t.kind === 'duration' && t.running && ms <= 0) {
            t.running = false;
            t.remainingMs = 0;
            t.lastTickAt = null;
            finished.push(t);
            ms = 0;
          }

          var text = t.kind === 'duration' ? formatDuration(ms) : formatTarget(ms);
          var timeEl = node.querySelector('[data-role="time"]');
          if (timeEl && timeEl.textContent !== text) {
            timeEl.textContent = text;
          }
        });
        if (finished.length > 0) {
          save();
          render(); // refreshes button labels (Pause → Start) and adds .card--finished
          // Fire alerts AFTER render so flashCard can target the freshly-rendered DOM node.
          setTimeout(function () {
            finished.forEach(fireFinish);
          }, 0);
        }
      }
```

- [ ] **Step 4: Update `renderCard` to add the finished class on render and persist it**

In `renderCard`, change the first lines that set up `li` from:

```js
        var li = document.createElement('li');
        li.className = 'card';
        li.dataset.id = t.id;
        li.dataset.kind = t.kind;
```

to:

```js
        var li = document.createElement('li');
        li.className = 'card';
        if (t.kind === 'duration' && t.remainingMs <= 0 && !t.running) {
          li.className += ' card--finished';
        }
        li.dataset.id = t.id;
        li.dataset.kind = t.kind;
```

- [ ] **Step 5: Hook `fireFinish()` into `reconcileOnLoad` for finished-while-closed**

Replace the body of `reconcileOnLoad` with:

```js
      function reconcileOnLoad() {
        var fired = [];
        var changed = false;
        timers.forEach(function (t) {
          if (t.kind !== 'duration') { return; }
          if (!t.running || t.lastTickAt == null) { return; }
          var live = t.remainingMs - (Date.now() - t.lastTickAt);
          if (live <= 0) {
            t.running = false;
            t.remainingMs = 0;
            t.lastTickAt = null;
            fired.push(t);
            changed = true;
          }
        });
        if (changed) { save(); }
        // Defer alerts until after the first render so flashCard can find the DOM nodes.
        if (fired.length > 0) {
          setTimeout(function () {
            fired.forEach(fireFinish);
          }, 0);
        }
      }
```

- [ ] **Step 6: Update `reset()` to clear the finished class via re-render**

`reset()` already calls `render()`, which rebuilds cards. Verify `renderCard`'s finished-class branch does NOT mark a freshly-reset timer as finished: after Reset, `remainingMs === durationMs` which is `> 0`, so the `--finished` class is correctly omitted. No code change needed — just confirm during Step 8 verification.

- [ ] **Step 7: Request notification permission lazily on first duration-timer add**

In `addDuration()`, after the line `var label = (rawLabel || '').trim().slice(0, 60) || 'Timer';`, add:

```js
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
          try { Notification.requestPermission(); } catch (e) { /* silent */ }
        }
```

- [ ] **Step 8: Open in browser and verify**

Reload `Exercise4/index.html`. Then:
- Add a duration timer of `0:05` (5 seconds), click Start.
- After ~5s: hear three beeps, see the card border turn yellow with a tinted background, see a brief pulse animation. If the browser asks for notification permission, accept it. (On the *first* duration-timer add of this session you should also see a permission prompt — accept.)
- Add another `0:05` timer with permission granted. After ~5s you should additionally see an OS notification "Timer done — Timer".
- Click Reset on a finished timer → finished tint clears, button reads `Start`.
- Add a `0:05` timer, start it, close the tab. Wait 15 seconds. Reopen the file → card shows `00:00` with finished tint, and you hear the beep + see a notification (the alerts fire on load via `reconcileOnLoad`).
- Add a target-date countdown for ~30 seconds from now. When it hits zero, no alarm fires (by design) — the display just stops at `0d 00h 00m 00s`.

---

## Task 9: Final polish — responsive layout & subtle UX

**Goal of this task:** Tighten the mobile layout and make the Add panel inputs wrap nicely on narrow screens. No new behavior.

**Files:**
- Modify: `Exercise4/index.html` — append a `@media (max-width: 480px)` block to `<style>`.

- [ ] **Step 1: Append the responsive block to the bottom of the `<style>` tag**

```css
    @media (max-width: 480px) {
      .app { margin: 1rem auto; }
      .app__title { font-size: 1.5rem; }
      .add__row { flex-direction: column; align-items: stretch; }
      .add__btn { width: 100%; }
      .card__time { font-size: 1.75rem; }
      .card__row { flex-wrap: wrap; }
    }
```

- [ ] **Step 2: Open in browser and verify**

Reload `Exercise4/index.html`, then in DevTools toggle device toolbar and pick a phone preset (e.g. iPhone SE, 375px wide). Expected:
- Add-panel inputs stack vertically with a full-width Add button.
- Card layout still readable; time display is slightly smaller but legible.
- Resize back up — desktop layout returns smoothly.

---

## End-to-end acceptance test

Run the full *Verification* section from the spec ([2026-04-24-countdown-timer-design.md § Verification](../specs/2026-04-24-countdown-timer-design.md)) — all 11 steps. The plan is complete when every step passes.
