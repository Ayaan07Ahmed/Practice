# Personal Website — Design Spec

**Date:** 2026-04-24
**Owner:** Ayaan Ahmed

## Purpose

A single-page personal website introducing Ayaan Ahmed with a brief "about" section listing three facts. The page should look like a simplified LinkedIn profile: clean, professional, and colorful with SVG graphics.

## Scope

In scope:
- Single HTML page (`index.html`) with embedded CSS
- Name displayed in bold
- Short headline under the name
- "About" section listing three items with inline SVG icons

Out of scope (explicit YAGNI):
- Profile photo / cover banner
- Experience and Education cards
- Navigation, links, contact form
- Build tools, frameworks, external CSS/JS
- Analytics, SEO metadata beyond a basic `<title>`

## Content

- **Name:** Ayaan Ahmed (bold)
- **Headline:** Social Sciences Student
- **About section heading:** "About"
- **Three items:**
  1. Interested in politics
  2. Studying Social Sciences in college
  3. Works part-time at Hiper Group (Thursdays & Fridays)

## Visual Design

**Layout (LinkedIn-inspired):**
- Centered white card on a soft grey page background
- Blue gradient header strip at the top of the card (decorative, no content)
- Name → headline → divider → "About" heading → three icon+text rows stacked vertically
- Card max-width ~700px, responsive to a single column on mobile

**Colors:**
- Accent / icons: LinkedIn blue `#0a66c2`
- Page background: `#f3f2ef`
- Card background: `#ffffff`
- Primary text: `#1d1d1f` (near-black)
- Secondary text: `#5f6368` (grey)

**Typography:**
- System font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
- Name: ~2rem, weight 700
- Headline: ~1.1rem, weight 400, secondary text color
- About heading: ~1.25rem, weight 600
- About items: ~1rem, primary text color

**Icons (inline SVGs, colored in LinkedIn blue):**
1. **Politics:** government/columned-building icon
2. **Education:** graduation cap icon
3. **Work:** briefcase icon

Each icon sits left of its text, vertically centered, ~24px square.

**Card styling:**
- Border radius: ~8px
- Subtle box shadow: `0 0 0 1px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)`
- Generous internal padding (~2rem)

## File Structure

```
index.html    ← everything (HTML + <style> + inline SVGs)
```

One file, no dependencies. Opening `index.html` in any modern browser renders the complete page.

## Success Criteria

- Page loads with no console errors and no network requests for external assets
- Name is visually the most prominent element and is bold
- Three about-items each show an SVG icon (not an emoji) next to their text
- Layout is centered and readable on both desktop and a 375px-wide mobile viewport
- Overall feel matches a simplified LinkedIn profile: clean, professional, blue-accented
