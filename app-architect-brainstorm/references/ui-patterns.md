# UI Pattern Catalog — Mobile-First & Dashboards

> Loaded by `ui-ux-design.md` during Step D3/D4. This catalog defines the **quality bar** for HTML mockups: layout patterns, density rules, and hierarchy discipline. It contains no framework code — patterns are described structurally so they survive translation into any stack.

## Table of Contents
1. [Viewport Doctrine](#viewport-doctrine)
2. [App Shell Patterns](#app-shell-patterns)
3. [Screen Patterns](#screen-patterns)
4. [Dashboard Doctrine](#dashboard-doctrine)
5. [Data Density Rules](#data-density-rules)
6. [Visual Hierarchy Discipline](#visual-hierarchy-discipline)
7. [States as First-Class Design](#states-as-first-class-design)
8. [Microcopy Rules](#microcopy-rules)
9. [The Visual Contract (machine-consumable mockups)](#the-visual-contract)

---

## Viewport Doctrine

- **Default: 390px mobile viewport first.** Desktop (1440px) is the adaptation, never the starting point. Exception: data-dense operator tools whose primary user sits at a desk — state the exception explicitly in D1.
- Every mockup file includes `<meta name="viewport" content="width=device-width, initial-scale=1">`.
- **Thumb zones**: primary actions live in the bottom half of the mobile screen. A primary action that requires two hands is a design failure.
- Responsive verification is binary: at 1440px the layout either gains a shell (sidebar appears, content max-width ~1200px centered) or it stretches. Stretching text columns past ~720px is a defect.

## App Shell Patterns

### Mobile shell (default)

```
┌─────────────────────┐
│ Top app bar         │  ← screen title + ONE contextual action max
├─────────────────────┤
│                     │
│ Content (scrolls)   │
│                     │
├─────────────────────┤
│ Bottom tab bar ≤5   │  ← top-level destinations only, icon + label
└─────────────────────┘
```

- Bottom tab bar: 3–5 destinations, never more. If you need 6+, one of them is not top-level.
- Primary creation action: bottom-sticky button or FAB — not both, not a third hidden in a menu.

### Desktop dashboard shell (adaptation)

```
┌──────────┬──────────────────────────────┐
│ Sidebar  │ Topbar: breadcrumb + user    │
│ 240px    ├──────────────────────────────┤
│ nav =    │                              │
│ same     │ Content, max-width ~1200px   │
│ items as │                              │
│ tabs     │                              │
└──────────┴──────────────────────────────┘
```

- **Mapping rule**: bottom tabs on mobile ↔ sidebar items on desktop. Same destinations, same order, same labels. If the two shells diverge, the information architecture is broken.
- Sidebar collapses to icons below ~1024px.

## Screen Patterns

For each pattern: purpose → layout skeleton → the mistake everyone makes.

### Dashboard / Home

Purpose: answer "what needs my attention?" in under 3 seconds.

```
┌─────────────────────┐
│ KPI strip (max 4)   │  ← number + label + delta; horizontally scrollable on mobile
├─────────────────────┤
│ Attention list      │  ← the inbox: items needing action, most urgent first
├─────────────────────┤
│ Recent activity     │  ← secondary, collapsible
└─────────────────────┘
```

- Max 4 KPIs. A KPI without a decision attached to it is decoration — delete it.
- The attention list outranks charts. Charts are for analysts; the home screen is for actors.
- Mistake: 9 stat cards and a gradient chart that answers nothing.

### List / Feed

- Mobile: cards or rows, one primary line + one secondary line + one status affordance. Three data points per row, not seven.
- Overflow into a detail screen; never cram.
- Mistake: reproducing a desktop table on mobile (see Density Rules).

### Detail

- Hero zone (identity + status) → primary action → sections in reading order → danger zone last, visually isolated.
- Related items as links, not embedded editors.

### Form

- Single column, labels above inputs, one primary action bottom-sticky on mobile.
- Group into sections of ≤5 fields; more means two steps or a detail screen.
- Validation errors inline, next to the field, in language ("Ce email est déjà utilisé"), never a summary box at the top.
- Mistake: multi-column forms on mobile; required-field asterisks instead of marking the optional ones.

### Chat / Inbox

- Messages bottom-anchored, composer bottom-sticky with safe-area padding.
- Agent/system actions rendered as structured cards inside the flow (a task created, a run started — with links), not as plain text. A chat that performs actions but shows no trace of them is a black box.
- Empty conversation = a suggested first message, not a void.

### Settings

- Grouped lists, destructive actions at the bottom of their group, separated.
- No settings screen should require its own navigation.

## Dashboard Doctrine

Rules that separate an operator dashboard from a template demo:

1. **Status before stats.** "Is everything fine?" precedes "how many?". A fleet/system screen leads with health, not with counters.
2. **Every number earns its place**: attach each metric to the decision it informs. No decision → no metric.
3. **One chart per screen section**, with real axis labels and a real time range ("last 24h"), never unlabeled placeholder curves.
4. **Severity has one vocabulary** across the whole app: `success / warning / danger / neutral`, mapped to tokens, used identically in badges, dots, and banners.
5. **Loading = skeletons in the shape of the content** (a KPI strip skeleton is 4 gray boxes of the same size), never one centered spinner for a whole dashboard.
6. **Empty dashboard = onboarding**: "Connect your first X" with the action, not a grid of empty charts.

## Data Density Rules

| Situation | Rule |
|---|---|
| Table with >4 columns on mobile | Becomes a card list; columns beyond 3 move to the detail screen |
| Long text values | Truncate with ellipsis + full value on tap/detail; never wrap a table cell into 4 lines |
| Numbers | Right-aligned in tables; consistent decimals; thousands separators in the user's locale |
| Timestamps | Relative under 24h ("il y a 2 h"), absolute beyond; never raw ISO |
| IDs/hashes | Truncated with copy action ("`a1b2…9z`") — full value never breaks layout |

**Stress test (mandatory)**: every mockup includes the *longest realistic value* for its main data point, not the average one. "Rapport trimestriel d'activité du pôle recherche & développement 2026" must fit the row designed for "Q3 report".

## Visual Hierarchy Discipline

- **Three text levels maximum**: primary (content), secondary (metadata), muted (hints). Levels differ by weight and size, not by 12 shades of gray.
- **One accent color**, reserved for primary actions and active states. If the accent appears on a non-interactive element, it's a defect.
- **Spacing**: 4px base unit, scale {4, 8, 12, 16, 24, 32, 48}. No arbitrary values (17px) anywhere.
- **Surfaces**: in light mode, hierarchy comes from background levels (surface-1/2/3) and 1px borders; shadows are for floating elements only (sheets, popovers). Cards inside cards inside cards = one surface too many.
- **Radius**: one scale ({6, 10, 999}), applied consistently — buttons and inputs share a radius, cards share a radius, pills are fully round.
- **Iconography**: one style (outline *or* filled), one stroke width. Emoji are not icons in the product UI.
- Ban without explicit justification: gradients on large surfaces, purple-blue "AI look", glassmorphism, decorative illustrations in functional screens.

## States as First-Class Design

Every P0 screen ships four states, each a real variant in the mockup (or clearly stacked sections in the file):

| State | Requirement |
|---|---|
| **Empty** | Headline + why + primary action. "Aucun projet — créez votre premier projet" beats a blank page. |
| **Loading** | Skeleton matching the content layout. Spinner allowed only for full-screen blocking operations. |
| **Error** | What happened + what to do + retry action. Never a bare red box, never a stack trace. |
| **Success** | The populated state with realistic density (see stress test). |

Real-time UIs add two more: **stale** (data visible but marked as not fresh) and **reconnecting** (banner, non-blocking).

## Microcopy Rules

- Buttons: verb-first, specific ("Créer le projet", not "OK" / "Submit").
- Destructive confirmations state the consequence ("Supprimer ce projet archive ses 12 tâches").
- Errors: what happened, why if known, what to do. No "Error 500", no "Something went wrong" alone.
- Titles name the object, not the operation ("Facture #1042", not "Détails").
- Write copy in the product's real language(s) — FR strings are ~20% longer than EN; the layout must survive the longest one.

## The Visual Contract

In the LaToile workflow, mockups are **the build target for a coding agent** (decision D7), not just a human reference. That raises the bar:

1. **Identical token block across all mockup files** — the same `:root { ... }` custom properties, copy-pasted. Drift between files is a defect; the tokens ARE the design system.
2. **Every screen file opens with an HTML comment header** listing: route, purpose, component inventory (named blocks: `KpiStrip`, `AttentionList`…), states included, and the data each block displays. An implementer — human or agent — must be able to build the screen without opening another file.
3. **Named, reusable measurements**: gaps, paddings, and radii come from the token scale only, so the implementation can map them 1:1 to theme config.
4. **Interactions are annotated, not scripted**: a comment says "tab switch: Inbox / Board / Preview" rather than embedding behavior. Mockup JS stays limited to making the gallery navigable.
5. States that can't coexist in one file get stacked sections with a visible label ("ÉTAT : VIDE"), so a screenshot comparison can target each state.
