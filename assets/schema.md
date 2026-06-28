# Ellis Design Schema (v0.1)

The canonical source of truth for the Ellis Biosecurity Network site. All pages MUST pull from this schema — do not redefine tokens, components, or naming locally.

## 1. Brand

- **Name:** Ellis
- **Sub-line:** Biosecurity Network
- **Tagline:** *Clean air is a decision, not an accident.*
- **Voice:** plain, sourced, slightly editorial. Cites before claims. No marketing hype.
- **Mark:** filled circle in `--ink` with a centered play-triangle in `--paper` (see `assets/logo.svg`).
- **Logo lockups:**
  - `brand-lockup` — horizontal: mark + "ellis" wordmark + "biosecurity network" subtitle.
  - `brand-mark` — mark only.
  - `brand-stack` — mark over stacked wordmark + subtitle (footer use).

## 2. Color tokens

Declared once on `:root`. Never hard-code hex in page CSS.

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#1C2933` | Primary text, nav CTA, dark panels |
| `--ink-soft` | `#46545E` | Secondary text, captions |
| `--paper` | `#F2F3F0` | Page background |
| `--paper-deep` | `#E6E8E2` | Track fills, deep surfaces |
| `--line` | `#CFD3CA` | Hairlines, dividers, borders |
| `--white` | `#FFFFFF` | Card backgrounds |
| `--uv` | `#3D6B8A` | Primary accent (UV / sci-tech) |
| `--uv-soft` | `#E3EAEE` | UV hover wash |
| `--sage` | `#6B7553` | Secondary accent (readiness/growth) |
| `--sage-soft` | `#E9EBE2` | Sage hover wash |
| `--amber` | `#B8762E` | Tertiary accent (caution/plan) |
| `--amber-soft` | `#F5EDE1` | Amber hover wash |
| `--red` | `#9C4A37` | Alert / at-risk |
| `--red-soft` | `#F3E8E3` | Red hover wash |
| `--uv-glow` | `rgba(61,107,138,0.16)` | Glow effects |

**Accent rules:**
- Card top-borders rotate UV → sage → amber across siblings.
- Hover wash matches the card's accent.
- Text accents: `--uv` for informational, `--sage` for good, `--amber` for caution, `--red` for alert.

## 3. Typography

Loaded once via Google Fonts; declared on `body`.

| Role | Family | Weight | Size |
|---|---|---|---|
| Display (h1, h2, dial numerals) | Source Serif 4 | 500 | h1: 54px / h2: 30px |
| Body | IBM Plex Sans | 400 / 500 | 14–17px |
| Mono (eyebrows, labels, meta) | IBM Plex Mono | 400 / 500 | 10.5–13px |

**Tracking:** display `-0.015em`, mono labels `0.06em` UPPERCASE.

## 4. Layout primitives

- `.wrap` — `max-width: 1180px; margin: 0 auto;` (top-level containers; nav/footer use their own inner wrap).
- `section` — `border-bottom: 1px solid var(--line);` separates vertical regions.
- `.section-pad` — `padding: 72px 32px;`
- `.section-head` — eyebrow + h2 + sub, max-width 600px.
- Three-column card grids collapse to one column below 900px; four-column strips collapse at 820px.

## 5. Components

### 5.1 Nav (`nav`)
- Sticky, top 0, paper background, hairline bottom.
- Left: brand lockup. Right: links + CTA. Links hide below 760px.

### 5.2 Eyebrow (`.eyebrow`, `.section-eyebrow`)
- IBM Plex Mono, 11.5–12px, UPPERCASE, letter-spacing 0.1em, color `--uv`.
- Optional leading square indicator: `::before { content: ''; width: 6px; height: 6px; background: var(--uv); }`.

### 5.3 Buttons
- `.btn` — ink fill, paper text, 13–14px, padding 13×22.
- `.btn.secondary` — transparent fill, ink border, ink text.
- On dark panels, use `--paper` border + `--paper` text.

### 5.4 Status strip (`.status-strip`)
- 4 equal cells on white, hairline dividers, each with mono label + serif value + soft sub-label.
- Optional `.pulse-dot` indicator (animated ring, respects `prefers-reduced-motion`).

### 5.5 Tool card (`.tool-card`)
- White panel, 3px top-border in rotating accent, hairline right.
- Structure: `.tool-num` → `.tool-name` (serif) → `.tool-desc` → `.tool-link` (mono).
- Hover: bg becomes the matching `-soft` wash; link recolors.

### 5.6 Why card (`.why-card`)
- Like tool card but vertical `wc-label` + paragraph body. No link.

### 5.7 Shepherd block (`.shepherd-block`)
- White surface, two columns: intro (with mark, blurb, email signup) + post list.
- `.post-row` — date on right, title + desc on left, hairline divider between.
- `.email-row` — input + button sharing one hairline border.

### 5.8 Act card (`.act-card`)
- Three-up grid, one featured (ink fill, paper text, lavender-ish tag).
- Tag in mono UPPERCASE; title in serif; desc in soft text.

### 5.9 Footer
- Four-column grid (brand + three link cols).
- `.footer-bottom` hairline above, mono UPPERCASE meta.

### 5.10 Quiz primitives (Tool 02 only)
- `.progress-rail` — equal hairline-divided steps with active/done states.
- `.progress-step` — mono label; underline color = active `--uv`, done `--sage`.
- `.quiz-stage` — cat-label + q-text (serif) + q-why + `.options` list + nav-row.
- `.opt` — selectable tile, points badge right-aligned. Selected → `--uv-soft` + `--uv` border.
- `.results` — overall dial (SVG ring) + per-category bars + priority cards.
- `.priority-card` — rank + title + desc + link CTA, separated by hairlines.
- `.cat-bar-fill` color by tier: good `--sage`, warn `--amber`, bad `--red`.

## 6. Motion

- One ambient motion only: `.pulse-dot::after` 2.2s pulse.
- Honors `prefers-reduced-motion: reduce` → animation off.
- No other transitions beyond 0.15–0.4s color/width shifts on hover or score reveal.

## 7. Content rules

- Page titles: `Title — Ellis` for tool pages; `Ellis — tag-line` for the landing.
- Eyebrow for tool pages: `Tool NN — short label` (NN = 01, 02, ...).
- All claims cite source on the page (ASHRAE / CDC / NIOSH).
- Disclaimer at the bottom of every tool: states it's a planning-stage self-assessment, not a substitute for an industrial hygienist or HVAC engineer.

## 8. File map

```
ellis/
  index.html              Home — hero + status strip + section teasers
  tools.html              Tools — tool grid + roadmap
  learn.html              Learn — principles + reading list + references
  map.html                Surveillance map — US states (NNDSS) + world choropleth
  timeline.html           Biodefense & infectious-disease timeline (~34 events)
  shepherd.html           Shepherd — newsletter + recent posts + archive
  act.html                Act — three paths + scorecard-drive playbook
  building-scorecard.html Tool 02 — 12-question indoor air self-assessment
  guv-deployment-engine.html (reserved — placeholder page)
  data/
    surveillance.json     Map page data (seed + fetched overlay)
    timeline.json         Timeline events
  scripts/
    fetch-data.js         Refresh surveillance data (NNDSS + WHO)
  assets/
    logo.svg              Brand mark + lockup variants
    site.css              Shared stylesheet (imported by every page)
    geo/                  TopoJSON files for the map (us-states, world)
    schema.md             This file
```

### Page anatomy (sub-pages)

Every sub-page (Tools, Learn, Map, Timeline, Shepherd, Act) follows the same skeleton:

1. Sticky **nav** — brand on the left, six links + CTA on the right.
   The active link gets `class="active"` and a 2px ink underline.
2. **`.page-hero`** — back-link (`← Section` or `← Ellis`) + eyebrow + h1 + lede.
3. One or more **`.section-pad`** blocks using `.tool-grid`, `.why-grid`, `.shepherd-block`, `.act-grid`, or `.learn-list` (in that order of preference for new content).
4. **Footer** — identical across all pages.

### Map page specifics

- Built on D3 v7 + topojson-client (CDN, no build step).
- Data file: `data/surveillance.json`. Seed data ships in this directory.
- The fetcher `scripts/fetch-data.js` overwrites `surveillance.json` on each run.
  Schedule it weekly from cron / Task Scheduler.
- Controls: layer (US / World), disease (COVID-19 / Influenza / RSV), scale (linear / log).
- States / countries with no data render in `--paper-deep` (clearly a gap, not zero).

### Timeline page specifics (single-line, modern)

- Events: `data/timeline.json`. Each event has year, optional end, title, pathogen, deaths, cases, R\u2080, regions, status, citation, why-it-matters, tag, ongoing flag, icon, and a **source** object `{ label, url }` pointing to a credible institution (WHO, CDC, EPA, ECDC, UKHSA, NIH, National Academies, etc.). External URLs open in a new tab; in-site URLs (like `map.html`) navigate normally.
- Visualization: **a single horizontal hairline** with a linear time scale (3 px/yr across the full span).
- **Local spread**: when dots would overlap, a force-based pass pushes later dots rightward by `MIN_DOT_SPACING = 34px` (dot diameter + 10px gap). Two passes settle clusters of 3+ dots evenly. The total canvas width grows to fit the spread.
- Each event is a **24px colored circle with a unique SVG glyph** (plague, rat, ships, syringe, droplet, vaccine, flu, pill, mask, cow, bird, ebola, coronavirus, etc.). Icons are stroke-based line art at 24×24, sized 14px in the dot.
- Hover a dot → inline card rises above or below it (alternating to reduce collisions). Click → card pins open and a quiet detail row beneath the timeline shows the full event.
- Drag the canvas to pan; scroll-wheel pans sideways; arrow keys step events; Escape closes.
- Year labels include a `PAST` endcap at the left and a `NOW` badge at the right. Major year labels every 200, minor every 100.
- Tag colors on dots: pandemic = red, outbreak = amber, science = uv-blue, intervention = sage, policy = ink-soft.
- **Ongoing events** have a soft pulsing red glow.
- **Tag filters** re-render the dots.
- **Play** auto-advances every 1.1s, scrolling to each event as it goes.
- **List view** below for accessibility / scanning, also showing the icon.

## 9. Asset checklist (for new pages)

- [ ] Pulled `font-family` from §3 (no local re-declaration).
- [ ] All colors referenced via tokens from §2.
- [ ] Used one of the components in §5 rather than inventing layout.
- [ ] Eyebrow follows §5.2.
- [ ] Footer included if page is user-facing.
- [ ] Disclaimer included if page is a tool.