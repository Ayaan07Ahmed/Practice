# Countdown Timer App — Design

**Date:** 2026-04-24
**Project:** Exercise4
**Status:** Spec — awaiting implementation plan

## Context

Exercise4 is a small standalone web app: a countdown timer in a single browser page. It runs entirely client-side (no backend, no build step) and supports two distinct kinds of countdowns running concurrently in a list:

- **Duration timers** — user enters a duration (e.g. `5:00`), presses Start, sees it count down to zero. Pause / Resume / Reset controls.
- **Target-date countdowns** — user enters a future date/time, sees a live countdown to it (`12d 03h 17m 42s`). No controls beyond delete.

The entire timer list persists to `localStorage` and survives page reloads, including detecting timers that finished while the tab was closed.

## Approach

Single-file vanilla web app — `Exercise4/index.html` with embedded `<style>` and `<script>`. No frameworks, no dependencies, no build step. Chosen for proportionality (this is a small app) and zero-friction "open the file and it works" UX.

## UI Layout

Top to bottom:

1. **Header** — page title + brief subtitle.
2. **Add panel** — two tabs (`Duration` | `Target date`) sharing a single Add button. Active tab determines which input fields are shown. Inline error message slot beneath inputs.
3. **Timer list** — vertical stack of timer cards, newest on top. Empty-state message when list is empty.

### Card anatomy

| Element | Duration card | Target-date card |
|---|---|---|
| Title | user label (default "Timer") | user label (default "Countdown") |
| Big display | `mm:ss` or `hh:mm:ss` | `Dd HHh MMm SSs` |
| Controls (running) | `Pause`, `Reset`, `×` delete | `×` delete only |
| Controls (paused) | `Resume`, `Reset`, `×` delete | n/a |
| Controls (finished) | `Reset`, `×` delete | n/a |
| Finished state | `--finished` class, pulse animation, persistent tint | n/a (just shows zeros) |

**Reset semantics:** Reset returns the timer to its original `durationMs`, sets `running: false` (paused, not auto-restarting), clears the `--finished` state, and persists. The user then presses Resume to start it counting again.

## Data Model

One array stored in `localStorage` under the key `exercise4.timers`:

```js
// Duration timer
{
  id: string,            // crypto.randomUUID()
  kind: 'duration',
  label: string,
  durationMs: number,    // original duration, used by Reset
  remainingMs: number,   // snapshot — see "live remaining math" below
  running: boolean,
  lastTickAt: number|null  // Date.now() when remainingMs was snapshotted; null when paused
}

// Target-date countdown
{
  id: string,
  kind: 'target',
  label: string,
  targetIso: string      // ISO 8601 absolute moment
}
```

### Live remaining math (duration timers)

- Running: `live = max(0, remainingMs - (Date.now() - lastTickAt))`
- Paused: `live = remainingMs`
- Target: `live = max(0, new Date(targetIso) - Date.now())`

The `remainingMs` + `lastTickAt` snapshot pattern means we don't have to write to storage on every tick — the live value is reconstructible from the snapshot at any moment.

## Tick Loop & Display Updates

A single global `setInterval(tick, 250)` runs while the page is open.

Each `tick()`:

1. Walks every card already in the DOM.
2. Recomputes that card's live remaining ms.
3. Updates only the time-display text (and the `--finished` modifier on first hit).

The card list is fully re-rendered **only** on add / delete / pause / resume / reset / finish — never on tick. This keeps form inputs stable, avoids flicker, and is cheap.

**Why 250ms not 1000ms:** at 1Hz the seconds digit can lag up to a second behind reality after browser tab-throttling. 250ms keeps the display tight without burning CPU.

## Persistence & Resume

**Writes:** the full timers array is serialized to `localStorage['exercise4.timers']` on every state change (add, delete, pause, resume, reset, finish). Never on tick.

**Reads on page load:** `JSON.parse` wrapped in try/catch, defaulting to `[]` on corrupt or missing data. Then for each duration timer:

- If `running: true` — compute `live = remainingMs - (Date.now() - lastTickAt)`. If `live <= 0`, the timer finished while the page was closed → flip to finished state (display `00:00`, fire finish behaviors immediately, persist). Otherwise restore as running.
- If `running: false` — restore as paused with its stored `remainingMs`.

Target-date countdowns need no resume logic — they're stateless beyond `targetIso`.

No schema version field. If the data shape ever changes, that's the moment to add one.

## Finish Behaviors (duration timers only)

When a duration timer's live remaining first reaches 0 inside `tick()`, three things fire in parallel:

1. **Beep** — Web Audio API: an `OscillatorNode` (sine wave, 880 Hz) gated by a short gain envelope, ringing 3× over ~1.2s. No audio asset file needed. Wrapped in try/catch — silently no-ops if Web Audio is blocked or unavailable.
2. **Visual flash** — the card receives a `--finished` class. A CSS keyframe pulses its background 3× over the same ~1.2s, then settles into a permanent "finished" tint until the user resets or deletes it.
3. **Browser notification** — `new Notification('Timer done', { body: <label> })`, but only if `Notification.permission === 'granted'`. Permission is requested lazily the first time the user **creates** a duration timer (not on page load — less spammy). If permission is denied, beep + flash still work.

Target-date countdowns do not fire alarms when they hit zero — they're informational displays.

## Input Validation

At the Add form boundary:

- **Duration field:** accept `mm:ss`, `hh:mm:ss`, or a plain number interpreted as minutes. Reject anything else with an inline error. Cap at 24 hours.
- **Target-date field:** must parse to a `Date` in the future. Reject past or unparseable input with an inline error.
- **Label:** trimmed. Default to `"Timer"` (duration) or `"Countdown"` (target) if empty. Capped at 60 characters.

No validation needed for internal state transitions — those are driven by trusted code, not user input.

## Files

- `Exercise4/index.html` — the entire app (HTML + embedded `<style>` + embedded `<script>` in an IIFE).

That's it. No other files.

## Verification (manual, in browser)

1. Open `Exercise4/index.html` in a browser.
2. **Duration — happy path:** Add a 5-second duration timer with label "Test". Press Start. It counts down to 0; on finish you hear a beep, see the card flash, and (if you grant permission) see a browser notification. Display reads `00:00` with the finished tint.
3. **Pause / Resume / Reset:** Add another duration timer, start it, pause mid-countdown, confirm it freezes; resume and confirm it continues from the same point; reset and confirm it returns to the original duration.
4. **Multiple concurrent:** Add three duration timers of different lengths and a target-date countdown. All four tick simultaneously without lag.
5. **Persistence:** With a running timer mid-countdown, reload the page. Timer resumes from the correct live remaining time (account for the reload itself).
6. **Finish-while-closed:** Add a 10-second duration timer, start it, close the tab. Reopen 30+ seconds later. Timer is in finished state and the finish behaviors fire on load.
7. **Target-date:** Add a target-date countdown for ~2 minutes from now. Watch it count down. When it hits zero, no alarm fires (by design); display shows `0d 00h 00m 00s`.
8. **Validation:** Try submitting `garbage` as a duration — inline error shown, nothing added. Try submitting a past date — inline error shown, nothing added.
9. **Delete:** Click `×` on each card and confirm it's removed and persistence updates.
10. **Empty state:** Delete all timers and confirm the empty-state message appears.
11. **DevTools sanity check:** Application → Local Storage → confirm `exercise4.timers` holds the expected JSON.
