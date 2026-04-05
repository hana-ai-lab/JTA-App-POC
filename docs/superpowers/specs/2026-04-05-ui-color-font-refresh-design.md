# UI Color & Font Refresh Design

## Goal

Update the JTA Quiz App's color palette and typography to match the new brand guidelines. White background is maintained. Content and layout are untouched.

## Scope

Single file change: `client/src/index.css`

## Color Changes

### CSS Custom Properties

| Variable | Before | After | Notes |
|----------|--------|-------|-------|
| `--color-primary` | `#1B2A4A` | `#0B0D1E` | Deep navy black |
| `--color-primary-light` | `#2D4470` | `#101326` | Dark navy |
| `--color-primary-lighter` | `#3D5A8A` | `#1A1633` | Violet navy |
| `--color-text` | `#1B2A4A` | `#0B0D1E` | Match primary |
| `--color-text-muted` | `#7A8BA0` | `#AEB4C0` | Silver gray |
| `--color-border` | `#E2E8F0` | rgba(174, 180, 192, 0.35) | Silver gray at low opacity |

### Unchanged

- Background colors (`--color-bg`, `--color-bg-secondary`, `--color-bg-card`, etc.) — kept white/light
- Gold accent (`--color-accent: #D4A853`, `--color-accent-light: #F0D48A`) — kept as-is
- Success green (`#2ECC71`) and error red (`#E74C3C`) — kept as-is

### Shadow Adjustments

Update `rgba(27, 42, 74, ...)` references in shadow variables to `rgba(11, 13, 30, ...)` to match the new primary color base.

| Variable | Before | After |
|----------|--------|-------|
| `--shadow-sm` | `rgba(27, 42, 74, 0.06)` | `rgba(11, 13, 30, 0.06)` |
| `--shadow-md` | `rgba(27, 42, 74, 0.08)` | `rgba(11, 13, 30, 0.08)` |
| `--shadow-lg` | `rgba(27, 42, 74, 0.10)` | `rgba(11, 13, 30, 0.10)` |
| `--color-glow` | `rgba(27, 42, 74, 0.12)` | `rgba(11, 13, 30, 0.12)` |

### Inline rgba References

All hardcoded rgba values derived from the old primary palette must be updated. Use global find-and-replace:

| Old value | New value | Occurrences (lines) |
|-----------|-----------|---------------------|
| `rgba(27, 42, 74,` | `rgba(11, 13, 30,` | 68, 74, 75, 136, 143, 243, 244, 299, 604, 693, 762, 940, 968, 969 |
| `rgba(45, 68, 112,` | `rgba(16, 19, 38,` | 973 (`.chapter-card-compact.in-progress` border) |

### Hardcoded Border rgba References

Two selectors use `rgba(226, 232, 240, 0.6)` (derived from old `--color-border`). Update to match the new border color:

| Selector | Line | Old | New |
|----------|------|-----|-----|
| `.nav-bar` border-top | 119 | `rgba(226, 232, 240, 0.6)` | `rgba(174, 180, 192, 0.3)` |
| `.card` border | 281 | `rgba(226, 232, 240, 0.6)` | `rgba(174, 180, 192, 0.3)` |

### Unchanged Inline rgba

Gold-derived values (`rgba(212, 168, 83, ...)`) remain untouched.

## Font Changes

### Google Fonts Import

Replace the current `@import` line with:

```css
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600;700;800&family=Inter:wght@400;500;700&family=DM+Mono:wght@400;500&display=swap');
```

### CSS Custom Properties

| Variable | Before | After |
|----------|--------|-------|
| `--font-display` | `'Shippori Mincho', serif` | `'Noto Serif JP', serif` |
| `--font-body` | `'Zen Kaku Gothic New', sans-serif` | `'Inter', sans-serif` |
| `--font-mono` | `'DM Mono', monospace` | unchanged |

## Out of Scope

- Layout, spacing, or component structure changes
- Dark mode / dark background
- Content or data changes
- JavaScript logic changes
