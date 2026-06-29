---
name: TutorDesk
description: All-in-one private dashboard for the independent tutor
colors:
  indigo: "#4F46E5"
  indigo-dark: "#4338CA"
  indigo-light: "#EEF2FF"
  violet-gradient: "#7C3AED"
  body-bg: "#F8FAFC"
  surface: "#FFFFFF"
  surface-subtle: "#FCFCFD"
  surface-muted: "#F1F5F9"
  ink: "#1E293B"
  ink-muted: "#64748B"
  ink-light: "#94A3B8"
  border: "#E2E8F0"
  green: "#16A34A"
  green-bg: "#DCFCE7"
  yellow: "#CA8A04"
  yellow-bg: "#FEF9C3"
  red: "#DC2626"
  red-bg: "#FEE2E2"
  blue: "#2563EB"
  blue-bg: "#DBEAFE"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.25
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.06em"
rounded:
  full: "9999px"
  xl: "12px"
  lg: "8px"
  md: "6px"
  sm: "4px"
  "2xl": "16px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  "2xl": "32px"
components:
  button-primary:
    backgroundColor: "{colors.indigo}"
    textColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "9px 16px"
    typography: "14px / font-semibold"
  button-primary-hover:
    backgroundColor: "{colors.indigo-dark}"
    textColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "9px 16px"
  button-ghost:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "9px 16px"
    typography: "14px / font-semibold"
  button-ghost-hover:
    backgroundColor: "{colors.body-bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "9px 16px"
  nav-item-active:
    backgroundColor: "{colors.indigo-light}"
    textColor: "{colors.indigo}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
    typography: "14px / font-semibold"
  nav-item-default:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
    typography: "14px / font-medium"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.2xl}"
    padding: "20px"
---

# Design System: TutorDesk

## 1. Overview

**Creative North Star: "The Tutor's Practice"**

TutorDesk looks and feels like a polished private professional practice — the visual equivalent of a well-prepared consultant's workspace. Not corporate-cold, not startup-exuberant: confident and warm, with the unhurried exactness of someone who has done this for years. Every screen says *I know what I'm doing* without raising its voice. The indigo primary is the tutor's signature color — authoritative, focused, present. Everything else steps back so data can lead.

The layout is dense by design. A tutor opens this between lessons; they need status at a glance, not guided tours. Cards contain real information, not decorative content. Motion is fast and purposeful — confirmation that something happened, never a performance for its own sake. The interface earns the tutor's daily attention by never wasting a second of it.

This system explicitly rejects: generic Tailwind-starter card grids (identical icon + heading + text blocks on a cream background), cold enterprise admin tables with zero personality, and bloated SaaS apps that design for ten use cases when this tool has one.

**Key Characteristics:**
- Indigo as the single accent voice — used precisely, not decoratively
- Tonal layering: white cards over cool-gray body, light shadows structural not ornamental
- System sans-serif at 14px body — readable, unsexy, correct
- Status badges carry meaning (green/yellow/red/blue) — never used as decoration
- Cards with `border-radius: 16px` and `border: 1px solid #E2E8F0` as the primary container vocabulary

## 2. Colors: The Practice Palette

A restrained professional palette: one primary accent, semantic status colors, and a cool-neutral foundation that keeps data legible without getting in its way.

### Primary
- **Signal Indigo** (`#4F46E5`): The tutor's signature. Active nav items, primary buttons, focus rings, interactive highlights. Used on ≤15% of any given screen surface — its restraint is the point.
- **Deep Indigo** (`#4338CA`): Hover state for Signal Indigo. Not used independently.
- **Soft Indigo** (`#EEF2FF`): Active nav item background, icon backgrounds on metric cards. The ambient field of the primary accent.
- **Gradient Violet** (`#7C3AED`): Only inside the logo gradient (`Signal Indigo → Gradient Violet`). Never used as a standalone surface or text color.

### Neutral
- **Practice White** (`#FFFFFF`): All cards, modals, top navigation, input backgrounds.
- **Cool Slate** (`#F8FAFC`): Page body background. The base layer every card floats over.
- **Surface Subtle** (`#FCFCFD`): Table header rows and calendar headers — one step above Cool Slate, below Practice White.
- **Surface Muted** (`#F1F5F9`): Hover states inside tables (row hover), tag backgrounds.
- **Ink** (`#1E293B`): All headings and primary body text. Deep neutral-blue, never pure black.
- **Ink Muted** (`#64748B`): Secondary text, table header labels, nav item defaults, meta information.
- **Ink Light** (`#94A3B8`): Timestamps, placeholder text, quieter metadata.
- **Edge** (`#E2E8F0`): All borders — cards, inputs, dividers, table separators. One token, used consistently.

### Semantic Status
- **Cleared** (`#16A34A`) on **Cleared Ground** (`#DCFCE7`): Paid, completed, checked. Success state.
- **Pending** (`#CA8A04`) on **Amber Field** (`#FEF9C3`): Awaiting action. Warn but don't alarm.
- **Alert** (`#DC2626`) on **Alert Ground** (`#FEE2E2`): Overdue, cancelled, failed. Reserve for genuine urgency.
- **Info** (`#2563EB`) on **Info Ground** (`#DBEAFE`): Confirmed sessions, informational context.

**The One Accent Rule.** Signal Indigo appears in one role per screen: the active state, the primary CTA, or the data highlight — never all three simultaneously. When everything is accented, nothing is.

**The Semantic Contract.** Green = done/paid. Yellow = pending. Red = overdue/alert. Blue = confirmed/info. These four pairs are not available for decorative or arbitrary use. A new UI element that reaches for a status color must actually represent that status.

## 3. Typography

**Display / Body Font:** System sans-serif stack — `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

**Character:** No custom typeface. The system font is the right call for a daily-use tool: it renders at native quality on macOS (the target platform), costs zero latency, and carries zero aesthetic ego. The hierarchy is established through weight and size, not personality.

### Hierarchy
- **Display** (700, 28px, tracking -0.02em): Metric values on dashboard cards — the biggest numbers the tutor scans. Also: modal titles.
- **Headline** (700, 24px): Page titles (`Дашборд`, `Ученики`, `Расписание`).
- **Title** (700, 18px): Logo wordmark.
- **Section Label** (700, 15px): Panel headers inside cards (`Занятия сегодня`, `Последние события`).
- **Body** (400, 14px, line-height 1.5): All table cells, list items, descriptions, meta. The default reading size.
- **Body Semibold** (600, 14px): Student names in tables, nav item labels, card metric labels.
- **Small** (400–600, 13px): Secondary text inside cells, badge labels, timestamps.
- **Label** (600, 11–12px, tracking 0.06em, uppercase): Table column headers only. Uppercase tracked labels mark the structural columns; they do not appear as eyebrows above section headings.

**The No-Eyebrow Rule.** Uppercase tracked labels (`УЧЕНИК`, `ПРЕДМЕТ`, `ОПЛАТА`) appear exclusively as table column headers, where they mark scannable data columns. They are not used as section kickers, eyebrows above page headings, or decorative dividers elsewhere. This rule prevents the AI-grammar pattern of small-all-caps text above every section.

## 4. Elevation

TutorDesk uses tonal layering as its primary depth signal, with ambient shadows as a secondary confirmation layer. The body sits at Cool Slate (`#F8FAFC`); Practice White cards float above it. Shadows are structural — they mark the boundary between the page and a component, not its importance.

**The Flat-at-Rest Principle.** Cards and panels carry a 1px `#E2E8F0` border and a subtle shadow at rest. Hover states on cards add a small transform (`-translate-y-0.5`) and a slightly larger shadow to confirm interactivity. Shadows never increase in size when content is static; shadow growth is reserved for state changes.

### Shadow Vocabulary
- **Ambient** (`0 1px 2px rgba(0,0,0,0.04)`): Cards at rest (`shadow-sm`). The minimum structural separation from the body.
- **Lifted** (`0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)`): Cards on hover, sticky navigation.
- **Modal** (`0 10px 25px rgba(0,0,0,0.10), 0 4px 10px rgba(0,0,0,0.05)`): Modals and dialogs only. The deepest layer.

**The Border-First Rule.** Every card or panel carries `border: 1px solid #E2E8F0` as its primary definition. The shadow is additive confirmation, not the primary visual boundary. On white-on-white surfaces (modal inside modal), the border does the work; the shadow is absent.

## 5. Components

### Buttons
- **Shape:** Gently curved (8px radius)
- **Primary:** Signal Indigo (`#4F46E5`) fill, Practice White text, 9px top/bottom × 16px left/right padding, 14px semibold. Hover: Deep Indigo (`#4338CA`). Transition: `colors 0.15s`.
- **Small variant:** 6px × 12px padding, 13px semibold. Same radius.
- **Ghost:** Practice White fill, Ink text (`#1E293B`), Edge border (`1px #E2E8F0`). Hover: Cool Slate fill.
- **Disabled:** 60% opacity on both variants. No pointer-events change needed — the opacity communicates it.
- **No icon-only buttons.** Text always accompanies the action.

### Status Badges
The semantic status vocabulary made concrete. Each badge is a pill (`border-radius: 9999px`) with 2.5px × 10px padding.
- **Green (Cleared):** `#DCFCE7` bg, `#16A34A` text
- **Yellow (Pending):** `#FEF9C3` bg, `#CA8A04` text
- **Red (Alert):** `#FEE2E2` bg, `#DC2626` text
- **Blue (Info):** `#DBEAFE` bg, `#2563EB` text
- **Gray (Neutral):** `#F1F5F9` bg, `#64748B` text

Each badge carries a leading dot (`::before`, `width: 6px, height: 6px, border-radius: 50%, background: currentColor`). Clickable badges get `cursor: pointer; hover:brightness-95`. Badges are 12px semibold, never uppercase.

**The Contract Rule.** Badges only use these five semantic color pairs. Inventing a purple badge for a new status violates the contract and breaks the at-a-glance scan pattern that makes the UI fast to read.

### Cards / Containers
- **Corner Style:** `border-radius: 16px` (`rounded-2xl`) for all primary containers
- **Background:** Practice White (`#FFFFFF`) on Cool Slate body
- **Border:** 1px solid Edge (`#E2E8F0`) always present; defines the container boundary
- **Shadow:** Ambient shadow at rest; lifts 0.5px with `shadow` on hover
- **Internal padding:** 20px standard; panel headers use 16px top/bottom × 20px left/right
- **Panel structure:** Header row (border-b, `py-3.5 px-5`) separates label + action from content body

**The No-Nested-Cards Rule.** Cards never contain cards. A list item inside a card uses row hover (`hover:bg-[#F8FAFC]`) and a `border-b` divider, not another card.

### Inputs / Fields
- **Style:** Cool Slate (`#F8FAFC`) background, Edge border, 8px radius, 10px × 12px padding, 14px body
- **Focus:** Border shifts to Signal Indigo (`#4F46E5`), background shifts to Practice White. No box-shadow ring — the border change is the focus signal.
- **Placeholder:** Ink Light (`#94A3B8`). Must meet 4.5:1 against Cool Slate background — verify on implementation.
- **Select / Dropdown:** Same style as text input. Native `<select>` element.

### Navigation (Top Bar)
- **Style:** Practice White (`#FFFFFF`), 60px height, Ambient shadow, `position: sticky; top: 0; z-index: 50`
- **Logo mark:** 32px square, 8px radius, `linear-gradient(135deg, #4F46E5, #7C3AED)`
- **Nav items (default):** Ink Muted text (`#64748B`), transparent background, 8px × 16px padding, 14px medium weight
- **Nav items (hover):** Cool Slate background, Ink text (`#1E293B`)
- **Nav items (active):** Soft Indigo background (`#EEF2FF`), Signal Indigo text (`#4F46E5`), 14px semibold
- **Transition:** `all 0.15s ease`

### Avatars
- **Shape:** Perfect circle (`border-radius: 50%`)
- **Sizes:** sm (32px, 12px text), md (38px, 13px text), lg (64px, 22px text)
- **Color:** Tutor-assigned per student. Signal Indigo (`#4F46E5`) for the tutor's own avatar.
- **Text:** White, semibold, initials (1–2 characters)

### Weekly Calendar Grid (Signature Component)
The schedule view's defining surface. A CSS grid with 56px time-label column + 7 equal-width day columns, 46px row height per hour slot.
- **Day headers:** Surface Subtle (`#FCFCFD`) background; today's column uses Soft Indigo (`#EEF2FF`) with Signal Indigo text
- **Time labels:** Ink Light (`#94A3B8`), 11px, right-aligned, monospaced digits
- **Session blocks:** Absolute-positioned inside each cell, `inset: 3px`, rounded-lg, colored by subject (4-color mapping: Math→Info Blue, English→Cleared Green, Physics→Purple, Chemistry→Orange). Left border 3px in the subject accent color. Hover: `scale(1.02)` + shadow.
- **Empty cells:** Hover reveals `+ Добавить` in Signal Indigo, 11px semibold, centered

### Modal
- **Backdrop:** `rgba(15,23,42,0.45)` with `backdrop-filter: blur(4px)`
- **Container:** Practice White, `border-radius: 16px`, Modal shadow, `max-width: 720px`
- **Animation:** `pop 0.25s ease` — scale from 0.96 + translateY(10px) to identity
- **Close button:** Top-right absolute, `34×34px`, `bg-white/70 hover:bg-white`, rounded-lg
- **Footer:** Surface Subtle (`#F8FAFC`) background, `border-top: 1px solid #E2E8F0`, flex row with `justify-between`

## 6. Do's and Don'ts

### Do:
- **Do** use Signal Indigo (`#4F46E5`) as the single interactive accent: active nav, primary CTA, focus indicator. Pick one role per screen.
- **Do** lead every data panel with a header row (`border-b, py-3.5 px-5`) that names the content and optionally carries a single action link (right-aligned).
- **Do** use the five semantic badge pairs exactly as specified. Green = done. Yellow = pending. Red = alert. Blue = confirmed. Gray = neutral.
- **Do** keep body type at 14px. The tutor reads at a desk, not on a projector. Density is a feature.
- **Do** give every card a `border: 1px solid #E2E8F0`. This is non-optional — the border defines the container; the shadow is additive.
- **Do** use `border-radius: 16px` (`rounded-2xl`) for primary cards/panels and `border-radius: 8px` (`rounded-lg`) for buttons and inputs. Keep the hierarchy consistent.
- **Do** implement `@media (prefers-reduced-motion: reduce)` — the `pop` modal animation and `slideIn` toast animation must be instant crossfades under reduced motion.
- **Do** maintain minimum 4.5:1 contrast for all body text including placeholder text and badge labels.
- **Do** put uppercase tracked labels (`text-xs uppercase tracking-wide`) exclusively on table column headers. Nowhere else.

### Don't:
- **Don't** use generic Tailwind-starter-kit layouts — identical icon + heading + text cards on a gray/cream background. This is the first-order AI reflex for "dashboard." If a screen could have been generated from a shadcn/ui template without modification, it's wrong.
- **Don't** use cold enterprise admin panel aesthetics — zero-personality dense tables, no hover states, audit-log spacing, no color except gray. The tool is built for one professional, not auditors.
- **Don't** invent new badge colors for new statuses. Five pairs are the entire contract. A sixth color breaks the semantic map.
- **Don't** use `border-left` wider than 1px as a decorative accent on cards, list items, or callouts. The calendar session blocks use a 3px subject-color left border as a data-encoding convention, not a decorative pattern. Do not extend this to other components.
- **Don't** use gradient text (`background-clip: text`). Gradient lives in the logo mark only. Text is solid.
- **Don't** use glassmorphism on surfaces other than the modal backdrop. `backdrop-filter: blur` on arbitrary cards is decorative and inconsistent.
- **Don't** add uppercase tracked eyebrows above section headings, page titles, or card panels. `ABOUT`, `STATISTICS`, `OVERVIEW` as kickers above headings are the AI grammar pattern; this system uses section label typography (`15px bold`) in panel headers instead, without tracking or uppercase.
- **Don't** build nested cards. A card inside a card means a layout mistake — refactor to rows with dividers.
- **Don't** put the same shadow on interactive and non-interactive cards. Static cards get Ambient; hover/interactive cards earn Lifted.
- **Don't** use Signal Indigo on more than one role simultaneously per screen. Active nav + primary button + a highlighted stat all in indigo at once dilutes the accent to noise.
