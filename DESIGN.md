# TradeLog — Design System

## Color Tokens (`tailwind.config.js`)

### Backgrounds
| Token | Hex | Usage |
|-------|-----|-------|
| `bg` | `#09090b` | Page background |
| `bg2` | `#0f1014` | Sidebar |
| `bg3` | `#141519` | Cards, inputs, dropdowns |
| `hover-bg` | `#1a1b20` | Interactive surface hover |

### Borders
| Token | Hex | Usage |
|-------|-----|-------|
| `border` | `#1c1d22` | Subtle dividers |
| `border2` | `#242529` | Input borders, stronger dividers |

### Text Hierarchy
| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#f4f4f5` | Headings, values, active labels |
| `secondary` | `#a1a1aa` | Body text, descriptions |
| `muted` | `#52525b` | Placeholders, labels, inactive |

### Semantic / Accent
| Token | Hex | Usage |
|-------|-----|-------|
| `accent` | `#00e5ff` | Cyan — active states, highlights, links |
| `profit` | `#4ade80` | Gain text (accessible at 12px+) |
| `loss` | `#f87171` | Loss text (accessible at 12px+) |
| `green` | `#22c55e` | Large profit indicators, bg fills |
| `red` | `#ef4444` | Large loss indicators, bg fills |
| `yellow` | `#eab308` | Breakeven, warning |
| `purple` | `#a855f7` | Secondary accent, "After" labels |

> **Rule:** Use `text-profit` / `text-loss` for any text under 16px. Use `text-green` / `text-red` only for large display numbers or background fills.

---

## Typography

| Family | Fonts | Usage |
|--------|-------|-------|
| `font-sans` | Inter | All UI text |
| `font-display` | Cal Sans → Inter | Page headings |
| `font-mono` | JetBrains Mono | P&L values, numbers, badges |

---

## Component Classes (`index.css`)

### Surfaces
```
.card   → bg-bg3  border border-border  rounded-xl
.panel  → bg-bg2  border border-border  rounded-xl
```

### Buttons
```
.btn-primary → bg-accent text-zinc-900 font-semibold rounded-lg px-4 py-2
               hover: opacity-90 | active: scale-95

.btn-ghost   → bg-bg3 text-secondary border border-border2 rounded-lg px-4 py-2
               hover: bg-hover-bg, border-accent/40, text-accent

.btn-danger  → bg-red/10 text-loss border border-red/20 rounded-lg px-4 py-2
               hover: bg-red/18

.btn-icon    → bg-bg3 border border-border2 text-muted p-2 rounded-lg
               hover: bg-hover-bg text-primary
```

### Form
```
.input  → bg-bg3 border border-border2 text-primary placeholder-muted
          px-3 py-2.5 rounded-lg text-sm
          focus: border-accent/50

.label  → text-[10.5px] font-semibold text-muted uppercase tracking-wider mb-1.5
```

### Badges
```
.badge-win  → text-profit  bg-profit/10   font-mono text-[10.5px]
.badge-loss → text-loss    bg-loss/10
.badge-be   → text-yellow  bg-yellow/10
.badge-buy  → text-accent  bg-accent/10
.badge-sell → text-loss    bg-loss/10
```

### Navigation
```
.nav-item        → text-muted hover:bg-hover-bg hover:text-primary
                   px-3 py-2.5 rounded-lg text-sm font-medium
.nav-item.active → bg-accent/15  text-accent
```

---

## Spacing Scale

| Context | Value |
|---------|-------|
| Page padding | `p-6` |
| Section gap | `space-y-5` / `gap-4` |
| Card padding | `p-4` / `p-5` |
| Input height | `py-2.5` |
| Border radius — inputs | `rounded-lg` |
| Border radius — cards | `rounded-xl` |

---

## Z-Index Layers

| Layer | Value |
|-------|-------|
| Sidebar | `z-10` |
| Modal backdrop | `z-40` |
| Modal / Dropdown | `z-50` |

---

## Animations

```
fadeIn: opacity 0→1 + translateY 6px→0 over 0.25s ease
.fade-in → applied to page content wrappers
```

---

## Account Status System

| Status | Trade form | Dashboard / Calendar / Trades | Analytics |
|--------|-----------|-------------------------------|-----------|
| `active` | Shown | Included | Included |
| `inactive` | Hidden | Included | Configurable |
| `archived` | Hidden | Hidden | Excluded |
