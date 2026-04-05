# UI Color & Font Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the JTA Quiz App's colors and typography in `client/src/index.css` to match new brand guidelines.

**Architecture:** Pure CSS variable + inline rgba find-and-replace. Single file change, no JS modifications. White background and gold accent are preserved.

**Tech Stack:** CSS custom properties, Google Fonts

**Spec:** `docs/superpowers/specs/2026-04-05-ui-color-font-refresh-design.md`

---

### Task 1: Update Google Fonts import

**Files:**
- Modify: `client/src/index.css:1`

- [ ] **Step 1: Replace the @import URL**

Replace line 1:
```css
@import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;600;700;800&family=Zen+Kaku+Gothic+New:wght@400;500;700&family=DM+Mono:wght@400;500&display=swap');
```
With:
```css
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600;700;800&family=Inter:wght@400;500;700&family=DM+Mono:wght@400;500&display=swap');
```

- [ ] **Step 2: Update font CSS custom properties**

In `:root`, replace:
```css
  --font-display: 'Shippori Mincho', serif;
  --font-body: 'Zen Kaku Gothic New', sans-serif;
```
With:
```css
  --font-display: 'Noto Serif JP', serif;
  --font-body: 'Inter', sans-serif;
```

- [ ] **Step 3: Commit**

```bash
git add client/src/index.css
git commit -m "style: update fonts to Noto Serif JP + Inter"
```

---

### Task 2: Update color CSS custom properties

**Files:**
- Modify: `client/src/index.css:3-35` (`:root` block)

- [ ] **Step 1: Replace color variables in :root**

Replace the following variables (leave all others unchanged):

| Variable | Old | New |
|----------|-----|-----|
| `--color-primary` | `#1B2A4A` | `#0B0D1E` |
| `--color-primary-light` | `#2D4470` | `#101326` |
| `--color-primary-lighter` | `#3D5A8A` | `#1A1633` |
| `--color-text` | `#1B2A4A` | `#0B0D1E` |
| `--color-text-muted` | `#7A8BA0` | `#AEB4C0` |
| `--color-border` | `#E2E8F0` | `rgba(174, 180, 192, 0.35)` |
| `--color-glow` | `rgba(27, 42, 74, 0.12)` | `rgba(11, 13, 30, 0.12)` |

- [ ] **Step 2: Replace shadow variables in :root**

| Variable | Old | New |
|----------|-----|-----|
| `--shadow-sm` | `0 1px 3px rgba(27, 42, 74, 0.06)` | `0 1px 3px rgba(11, 13, 30, 0.06)` |
| `--shadow-md` | `0 4px 16px rgba(27, 42, 74, 0.08)` | `0 4px 16px rgba(11, 13, 30, 0.08)` |
| `--shadow-lg` | `0 8px 32px rgba(27, 42, 74, 0.10)` | `0 8px 32px rgba(11, 13, 30, 0.10)` |

- [ ] **Step 3: Commit**

```bash
git add client/src/index.css
git commit -m "style: update color palette to new brand navy"
```

---

### Task 3: Update all inline rgba references

**Files:**
- Modify: `client/src/index.css` (multiple lines throughout file)

- [ ] **Step 1: Global replace old primary rgba**

Find and replace ALL occurrences in `client/src/index.css`:

`rgba(27, 42, 74,` → `rgba(11, 13, 30,`

This covers lines: 68, 74, 75, 136, 143, 243, 244, 299, 604, 693, 762, 940, 968, 969.

- [ ] **Step 2: Replace primary-light derived rgba**

Line 973: Replace:
```css
  border-color: rgba(45, 68, 112, 0.2);
```
With:
```css
  border-color: rgba(16, 19, 38, 0.2);
```

- [ ] **Step 3: Replace old border-derived rgba**

Lines 119 and 281: Replace both occurrences of:
```css
rgba(226, 232, 240, 0.6)
```
With:
```css
rgba(174, 180, 192, 0.3)
```

- [ ] **Step 4: Verify no old color values remain**

Run these searches and confirm zero matches:
```bash
grep -c "rgba(27, 42, 74" client/src/index.css    # expect: 0
grep -c "rgba(45, 68, 112" client/src/index.css   # expect: 0
grep -c "rgba(226, 232, 240" client/src/index.css # expect: 0
grep -c "#1B2A4A" client/src/index.css             # expect: 0
grep -c "#2D4470" client/src/index.css             # expect: 0
grep -c "#3D5A8A" client/src/index.css             # expect: 0
grep -c "#7A8BA0" client/src/index.css             # expect: 0
grep -c "#E2E8F0" client/src/index.css             # expect: 0
grep -c "Shippori" client/src/index.css            # expect: 0
grep -c "Zen Kaku" client/src/index.css            # expect: 0
```

- [ ] **Step 5: Commit**

```bash
git add client/src/index.css
git commit -m "style: update all inline rgba values to new palette"
```

---

### Task 4: Visual verification

- [ ] **Step 1: Start dev server and check visually**

```bash
cd client && npm run dev
```

Open the app and verify:
- White background is maintained
- Text is darker navy (`#0B0D1E`)
- Sub-text is silver gray
- Gold accent (level badge, master bars) is unchanged
- Fonts render as Noto Serif JP (headings) and Inter (body)
- Success/error colors are unchanged
- Borders are subtle silver gray

- [ ] **Step 2: Final commit if any touch-ups needed**

If no further changes needed, plan is complete.
