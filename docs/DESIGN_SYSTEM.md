# Design System

ATMOS is a weather publication. The system follows editorial minimalism: paper-white surfaces, black ink, serif display type, small tracked sans-serif labels, and geometric artwork.

## Colour

Monochrome. There are no weather-coloured gradients. An accent exists only as a token (`--accent-alert`) for future severe-weather messaging and for error text, and is used sparingly.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--paper` | `#FAFAF8` | `#0D0D0C` | Page background |
| `--white` | `#FFFFFF` | `#141413` | Input and list surfaces |
| `--ink` | `#111111` | `#F2F2EF` | Primary text, strong marks |
| `--black` | `#050505` | `#FAFAF8` | Buttons, rules, art ink |
| `--ink-2` | `#626262` | `#B4B4AF` | Labels and metadata |
| `--soft` | `#E9E9E6` | `#3A3A36` | Atmospheric shapes |
| `--pale` | `#F2F2EF` | `#222220` | Secondary surfaces |
| `--border` | `#E2E2DE` | `#2C2C29` | Separators |
| `--muted` | `#7A7A76` | `#8F8F8A` | De-emphasised marks |

Dark mode is a separate palette, tuned by hand. It is not an automatic inversion.

Contrast: primary text and metadata were chosen to meet WCAG 2.2 AA on the paper background. A full contrast audit across every token pair has not been run; see the project status document.

## Typography

| Role | Family | Size (desktop) |
|---|---|---|
| Temperature | Instrument Serif | `clamp(120px, 26vw, 232px)` |
| Statement | Instrument Serif | `clamp(28px, 4.2vw, 46px)` |
| Section title | Instrument Serif | `clamp(32px, 4.5vw, 48px)` |
| Component title | Instrument Serif | `clamp(22px, 2.6vw, 28px)` |
| Labels | Inter 500, uppercase, tracked 0.12 to 0.16em | 11px |
| Body | Inter 400 | 15px, line height 1.55 |
| Metadata | Inter 400 | 12px |

Two families, three weights of the sans, one serif weight. Numerals use lining figures; temperature uses tabular-friendly sizing.

## Spacing and layout

- Gutters: `clamp(20px, 5vw, 80px)`.
- Max content width: 1440px.
- Section spacing: `clamp(56px, 8vw, 104px)`.
- Mobile first. The first layout breakpoint is 900px. Below it, navigation is a bottom bar. Above it, navigation is a top bar.
- The hero is a single column on mobile and a two-column spread on desktop (text left, artwork right).
- Conditions strip: two columns on mobile, six on desktop, divided by hairline rules instead of cards.
- Cards are used only for search results. Everything else sits on the page with rules and spacing.

## Shape

- Radii: 14px for inputs and banners, 28px for the artwork frame, pill for buttons and segmented choices.
- No shadows. Depth comes from tone (`--soft`, `--pale`) and rules.

## Controls

- **Primary button:** black fill, paper text, 44px minimum height.
- **Ghost button:** outlined, for secondary actions.
- **Link button:** underlined text, 44px hit area.
- **Segmented choices:** radio inputs styled as pills. Native inputs keep keyboard and screen reader behavior.
- Focus: 2px ink outline, 3px offset. Never removed.

## Iconography

Bottom navigation uses a thin 20px line glyph at 1.4 stroke. The ATMOS mark is a half sun resting on two horizon bars. The same geometry generates the app icons.

## Artwork language

The artwork is the signature element. Each condition is a composition built from the same vocabulary:

| Condition | Composition |
|---|---|
| Clear, day | Pale disk, dot texture, a black horizon bar and a vertical cut |
| Clear, night | Inverted field, dark disk over a pale moon, sparse star dots |
| Partly cloudy | Overlapping soft forms, black sun cutout |
| Overcast | Large grey masses with halftone |
| Fog | Staggered horizontal bands |
| Drizzle and rain | Diagonal hatch, cloud forms, falling strokes |
| Thunderstorm | Black diagonal block, minimal zigzag bolt, slow flash |
| Snow | Sparse dots falling over a pale disk |
| Unknown | Dashed outline circle (no guessing) |

Motion: slow drift on the day art, falling marks for precipitation, a stepped flash for thunder. All motion is disabled under `prefers-reduced-motion`. Art changes with a short enter animation keyed on condition and day/night.

Not yet built: a dedicated wind composition with curved linework (described in the brief). The current build has no wind artwork.

## Motion principles

- Page enter: 8px rise and fade over 420ms.
- Small transitions: 160ms.
- Navigation underline: 420ms sweep.
- Nothing loops except weather art and skeleton shimmer, and both stop under reduced motion.
