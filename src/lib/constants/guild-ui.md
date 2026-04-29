# RPG Guild UI Design System

## Overview

This document describes the CSS design patterns used throughout the RPG Guild Manager application. The system uses TailwindCSS with custom CSS properties for consistent theming.

## Layout Patterns

### App Shell Structure

```html
<div class="app-shell">
  <header class="app-topbar sticky top-0 z-40">
    <!-- Navigation -->
  </header>
  <main class="pb-10 pt-6">
    <!-- Page content -->
  </main>
</div>
```

**Classes:**
- `app-shell` - Main application wrapper
- `app-topbar` - Top navigation bar
- `page-wrap` - Horizontal page margins container
- `pb-10 pt-6` - Main content padding

### Workspace Panels

**Panels:**
- `app-workspace` - Default panel
- `app-panel` - Base panel styling
- `app-panel-strong` - Higher contrast variant
- `app-ledger-panel` - Form/content panels with subtle edge lines

**Usage:**
```html
<section class="app-workspace reveal-rise mb-5 px-4 py-5 md:mb-6 md:px-6">
  <!-- Content -->
</section>
```

## Typography

### Headings

```html
<h1 class="section-title mt-4 text-3xl text-white md:text-4xl">
  Page Title
</h1>
```

**Classes:**
- `section-title` - Main page headings (h1)
- `text-2xl`/`text-3xl`/`text-4xl` - Size variants
- `text-white` - White text color
- `font-semibold`/`font-bold` - Weight variants

### Eyebrow/Section Labels

```html
<div class="eyebrow">Section Label</div>
```

**Classes:**
- `eyebrow` - Small uppercase section labels
- `tracking-[0.18em]` - Wide letter spacing
- `text-xs`/`text-sm` - Size variants
- `text-slate-500` - Muted text color

### Body Text

**Hierarchy:**
- `text-white` - Primary text
- `text-slate-400` - Secondary/muted text
- `text-slate-300` - Medium emphasis
- `text-sm`/`text-base` - Size variants

## Component Patterns

### Buttons

**Primary Button:**
```html
<button class="app-button app-button-primary px-4 py-3 text-sm">
  Action
</button>
```

**Secondary Button:**
```html
<button class="app-button app-button-secondary px-4 py-3 text-sm">
  Action
</button>
```

**Size Variants:**
- `px-3 py-2` - Small
- `px-4 py-3` - Medium (default)
- `px-5 py-3` - Large

**Icon Buttons:**
```html
<button class="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:text-cyan-200">
  <Pencil size={15} />
</button>
```

**Touch Grid (Mobile):**
```html
<div class="touch-grid-2">
  <button class="app-button">Action 1</button>
  <button class="app-button">Action 2</button>
</div>
```

### Stats Cards (Metal Stats)

```html
<div class="app-metal-stat">
  <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Label</div>
  <div class="mt-2 text-3xl font-bold text-white">Value</div>
  <div class="mt-1 text-sm text-slate-400">Description</div>
</div>
```

**Variants:**
- `app-metal-stat` - Default
- `app-metal-stat-cyan` - Cyan accent
- `app-metal-stat-rose` - Rose accent

**Stat Icons:**
```html
<div class="flex items-center gap-2">
  <Users size={18} class="text-cyan-300" />
  <div class="text-2xl font-bold text-white">Value</div>
</div>
```

### Cards/Containers

**Base Card:**
```html
<article class="app-card app-ledger-panel app-ledger-lines flex flex-col p-5 md:p-6">
  <!-- Card content -->
</article>
```

**Bordered Stats:**
```html
<div class="rounded-2xl border border-white/10 bg-white/4 px-4 py-3">
  <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Label</div>
  <div class="mt-2 text-2xl font-bold text-white">Value</div>
</div>
```

## Grids

### Stagger Grid

**For cards and repeatable items:**
```html
<div class="stagger-grid grid gap-5 md:grid-cols-2 xl:grid-cols-3">
  <!-- Grid items -->
</div>
```

**With animation (reveal-rise):**
```html
<article class="app-card reveal-rise" style="animation-delay: 0.1s">
  <!-- Content -->
</article>
```

### Responsive Grids

- `grid gap-3 md:grid-cols-2` - 2 columns on desktop
- `grid gap-3 md:grid-cols-3` - 3 columns on desktop
- `sm:grid-cols-2 xl:grid-cols-4` - Progressive enhancement

## Form Elements

### Inputs

```html
<input
  class="app-input"
  type="text"
  placeholder="Placeholder"
/>
```

**Textarea:**
```html
<textarea
  class="app-input"
  rows="3"
  placeholder="Placeholder"
></textarea>
```

**Select:**
```html
<select class="app-select">
  <option>Option 1</option>
</select>
```

### Form Layout

```html
<div class="space-y-3">
  <label class="block text-sm font-medium text-slate-300">
    Field Label
  </label>
  <input class="app-input" />
</div>
```

## Effects & Animations

### Reveal Rise

**Base class** - triggers on mount:
```html
<article class="reveal-rise">
  <!-- Content animates on enter -->
</article>
```

**With stagger delay:**
```html
<div class="reveal-rise" style="animation-delay: 0.1s">
```

### Mouse Effects

**Hover lift:**
```html
<article class="transition hover:-translate-y-1">
```

**Hover text color:**
```html
<button class="text-slate-400 transition hover:text-white">
```

### Glow Effects

**Character rank glows (via getRankStyle function):**
```
shadow-[0_0_40px_rgba(251,191,36,0.12)] // High level (amber)
shadow-[0_0_32px_rgba(217,70,239,0.1)]  // Mid level (fuchsia)
shadow-[0_0_28px_rgba(56,189,248,0.12)] // Low level (sky)
```

## Modal Patterns

### Structure

```html
{@if open}
  <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-3 sm:p-4 backdrop-blur-md">
    <div class="flex min-h-full items-start justify-center py-3 sm:items-center sm:py-4">
      <div class="app-modal app-ledger-panel app-modal-scroll w-full max-w-2xl overflow-x-hidden overflow-y-auto">
        <div class="flex items-center justify-between border-b border-white/8 px-6 py-5">
          <div>
            <h3 class="text-2xl font-semibold text-white">Modal Title</h3>
            <p class="mt-1 text-sm text-slate-400">Subtitle</p>
          </div>
          <button class="app-brass-coin p-2 text-slate-400 transition hover:text-white">
            <X size={16} />
          </button>
        </div>
        <div class="px-6 py-6">
          <!-- Modal content -->
        </div>
      </div>
    </div>
  </div>
{/if}
```

## Job Icons

**Mapping (from JOB_ICONS):**
- 검사 (Sword) → ⚔️
- 마법사 (Mage) → 🔮
- 힐러 (Healer) → 🌿
- 사냥꾼 (Hunter) → 🏹
- 도적 (Rogue) → 🗡️
- 탱커 (Tank) → 🛡️

## Grade System

**Rank Visual Styles (via getRankStyle):**

| Level | Border | Glow | Badge | Accent Text |
|-------|--------|------|-------|-------------|
| 30+ | border-amber-300/35 | shadow-[0_0_40px_rgba(251,191,36,0.12)] | bg-amber-300/12 text-amber-100 | text-amber-200 |
| 20-29 | border-fuchsia-300/25 | shadow-[0_0_32px_rgba(217,70,239,0.1)] | bg-fuchsia-300/10 text-fuchsia-100 | text-fuchsia-200 |
| 10-19 | border-sky-300/30 | shadow-[0_0_28px_rgba(56,189,248,0.12)] | bg-sky-300/12 text-sky-100 | text-sky-200 |
| 0-9 | border-white/10 | none | bg-white/8 text-slate-200 | text-slate-200 |

## Colors Reference

**Text Colors:**
- `text-white` - Primary text
- `text-slate-400` - Secondary text
- `text-slate-500` - Muted text
- `text-slate-300` - Medium emphasis
- `text-amber-200` - Gold/rank emphasis
- `text-emerald-300` - Success/check-in
- `text-cyan-200` - Info/sky

**Background Colors:**
- `bg-slate-900/90` - Modal backdrops
- `bg-white/4` - Subtle card backgrounds
- `bg-white/5` - Button backgrounds
- `bg-emerald-300/10` - Success buttons

**Border Colors:**
- `border-white/10` - Default borders
- `border-slate-500/20` - Subtle lines
