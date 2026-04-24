# Personal Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page personal website for Ayaan Ahmed styled like a simplified LinkedIn profile, with a bold name, headline, and an About section listing three facts with inline SVG icons.

**Architecture:** One static file (`index.html`) containing HTML, an embedded `<style>` block, and inline SVG icons. No build step, no dependencies, no external requests. Open the file in any modern browser to view it.

**Tech Stack:** HTML5, CSS3, inline SVG. System font stack (no web fonts).

**Spec reference:** `docs/superpowers/specs/2026-04-24-personal-website-design.md`

**Note on git:** The working directory is not a git repository, so commit steps are omitted. If the user wants version control, they can run `git init` and commit the final file.

---

## File Structure

- Create: `c:/Users/AyaanAhmed/Desktop/Practice/index.html` — the entire website (HTML + embedded CSS + inline SVGs)

One file. One responsibility: render the personal page.

---

### Task 1: Scaffold `index.html` with HTML structure and content

**Files:**
- Create: `c:/Users/AyaanAhmed/Desktop/Practice/index.html`

- [ ] **Step 1: Create `index.html` with the full semantic structure and text content (no styling yet, placeholder icons)**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ayaan Ahmed</title>
</head>
<body>
  <main class="card">
    <div class="banner" aria-hidden="true"></div>
    <section class="profile">
      <h1 class="name">Ayaan Ahmed</h1>
      <p class="headline">Social Sciences Student</p>
      <hr class="divider" />

      <h2 class="about-heading">About</h2>
      <ul class="about-list">
        <li class="about-item">
          <span class="icon" data-icon="politics" aria-hidden="true"></span>
          <span class="about-text">Interested in politics</span>
        </li>
        <li class="about-item">
          <span class="icon" data-icon="education" aria-hidden="true"></span>
          <span class="about-text">Studying Social Sciences in college</span>
        </li>
        <li class="about-item">
          <span class="icon" data-icon="work" aria-hidden="true"></span>
          <span class="about-text">Works part-time at Hiper Group (Thursdays &amp; Fridays)</span>
        </li>
      </ul>
    </section>
  </main>
</body>
</html>
```

- [ ] **Step 2: Verify structure by opening in a browser**

Action: Open `c:/Users/AyaanAhmed/Desktop/Practice/index.html` in a browser.
Expected: Unstyled page showing "Ayaan Ahmed" as the page heading, "Social Sciences Student" underneath, an "About" heading, and three bulleted items with the correct text. Empty icon spans have no visible content yet. Browser tab title is "Ayaan Ahmed". No console errors.

---

### Task 2: Replace icon placeholders with inline SVGs

**Files:**
- Modify: `c:/Users/AyaanAhmed/Desktop/Practice/index.html` — replace the three `<span class="icon" data-icon="..."></span>` elements with inline SVGs.

- [ ] **Step 1: Replace the politics icon (government/columned-building SVG)**

Find:
```html
<span class="icon" data-icon="politics" aria-hidden="true"></span>
```

Replace with:
```html
<span class="icon" aria-hidden="true">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M12 2 2 7v2h20V7L12 2Zm-7 9v7H3v2h18v-2h-2v-7h-2v7h-2v-7h-2v7h-2v-7H9v7H7v-7H5Z"/>
  </svg>
</span>
```

- [ ] **Step 2: Replace the education icon (graduation cap SVG)**

Find:
```html
<span class="icon" data-icon="education" aria-hidden="true"></span>
```

Replace with:
```html
<span class="icon" aria-hidden="true">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M12 3 1 9l11 6 9-4.91V17h2V9L12 3Zm-7 10.18v3.82l7 3.82 7-3.82v-3.82l-7 3.82-7-3.82Z"/>
  </svg>
</span>
```

- [ ] **Step 3: Replace the work icon (briefcase SVG)**

Find:
```html
<span class="icon" data-icon="work" aria-hidden="true"></span>
```

Replace with:
```html
<span class="icon" aria-hidden="true">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M10 2h4a2 2 0 0 1 2 2v2h4a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4V4a2 2 0 0 1 2-2Zm0 4h4V4h-4v2Z"/>
  </svg>
</span>
```

- [ ] **Step 4: Reload the browser and verify the three icons render**

Action: Reload `index.html` in the browser.
Expected: Three black SVG icons (building, cap, briefcase) appear inline with each about-item. No missing-image glyphs. No console errors.

---

### Task 3: Apply LinkedIn-style CSS

**Files:**
- Modify: `c:/Users/AyaanAhmed/Desktop/Practice/index.html` — add a `<style>` block inside `<head>`.

- [ ] **Step 1: Insert the complete `<style>` block just before `</head>`**

Find:
```html
  <title>Ayaan Ahmed</title>
</head>
```

Replace with:
```html
  <title>Ayaan Ahmed</title>
  <style>
    :root {
      --accent: #0a66c2;
      --page-bg: #f3f2ef;
      --card-bg: #ffffff;
      --text-primary: #1d1d1f;
      --text-secondary: #5f6368;
      --border: rgba(0, 0, 0, 0.08);
    }

    * { box-sizing: border-box; }

    html, body {
      margin: 0;
      padding: 0;
      background: var(--page-bg);
      color: var(--text-primary);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 16px;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }

    .card {
      max-width: 700px;
      margin: 2.5rem auto;
      background: var(--card-bg);
      border-radius: 8px;
      box-shadow: 0 0 0 1px var(--border), 0 2px 4px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }

    .banner {
      height: 96px;
      background: linear-gradient(135deg, #0a66c2 0%, #378fe9 100%);
    }

    .profile {
      padding: 2rem;
    }

    .name {
      margin: 0;
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.01em;
    }

    .headline {
      margin: 0.25rem 0 0;
      font-size: 1.1rem;
      font-weight: 400;
      color: var(--text-secondary);
    }

    .divider {
      border: none;
      border-top: 1px solid var(--border);
      margin: 1.5rem 0;
    }

    .about-heading {
      margin: 0 0 1rem;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .about-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .about-item {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.625rem 0;
    }

    .about-item + .about-item {
      border-top: 1px solid var(--border);
    }

    .icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      color: var(--accent);
      flex-shrink: 0;
    }

    .about-text {
      font-size: 1rem;
      color: var(--text-primary);
    }

    @media (max-width: 600px) {
      .card { margin: 0; border-radius: 0; }
      .profile { padding: 1.25rem; }
      .name { font-size: 1.625rem; }
      .banner { height: 72px; }
    }
  </style>
</head>
```

- [ ] **Step 2: Reload the browser and verify the styled result**

Action: Reload `index.html` in the browser at desktop width.
Expected:
- Soft grey page background
- Centered white card (max ~700px wide) with rounded corners and subtle shadow
- Blue gradient banner strip at the top of the card
- "Ayaan Ahmed" appears large and bold
- "Social Sciences Student" sits under the name in grey
- Horizontal divider, then the "About" heading
- Three rows, each with a blue SVG icon on the left and text on the right, separated by thin divider lines
- No console errors, no external network requests in the Network tab

- [ ] **Step 3: Verify mobile layout**

Action: Open browser devtools, set viewport to 375px wide (iPhone SE), reload.
Expected:
- Card fills the full viewport width with no horizontal scroll
- Banner is shorter (~72px)
- Name shrinks slightly but remains bold and readable
- All three about-items remain on single lines or wrap cleanly — no overlapping text or icons

---

## Verification Checklist (run after Task 3)

- [ ] `c:/Users/AyaanAhmed/Desktop/Practice/index.html` exists and is the only file in the project root (aside from the `docs/` folder)
- [ ] Opening the file shows the full styled page with no console errors
- [ ] Browser Network tab shows zero external requests when loading the page
- [ ] Name "Ayaan Ahmed" is visibly the most prominent element on the page and is bold
- [ ] All three about-items show an inline SVG icon (not an emoji, not a broken-image glyph)
- [ ] Page is legible and laid out cleanly at both 1280px and 375px viewport widths
