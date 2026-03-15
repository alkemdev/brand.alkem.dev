# Typography — Font Selections

Alkemical Development uses open-source variable fonts licensed under the
SIL Open Font License (OFL-1.1). All fonts are freely available on GitHub.

## Display — Martian Grotesk

**Use for:** headings, hero text, brand marks, logotype

[Martian Grotesk](https://github.com/evilmartians/grotesk) by Evil Martians
is a distinctive variable sans-serif with overhanging terminals and a brutalist
character. It stands out in developer-facing contexts while remaining highly
legible. Variable axes: weight (Thin → Ultra Black), width (Condensed → Ultra Wide).

**Why:** Immediately recognizable without being gimmicky. The wide axis range
gives us flexibility from tight UI labels to dramatic hero text. The "technical
but human" aesthetic matches Alkemical's identity as an open-source org.

## Body — Inter

**Use for:** body text, documentation, UI, long-form reading

[Inter](https://github.com/rsms/inter) by Rasmus Andersson is one of the most
refined screen-optimized typefaces available. 2,500+ glyphs, 147 languages,
variable weight + optical size axes, and extensive OpenType features.

**Why:** Maximum legibility at small sizes, excellent rendering across platforms,
and the optical size axis automatically adjusts letter shapes for text vs display
use. A safe, proven choice that lets Martian Grotesk be the star.

## Monospace — JetBrains Mono

**Use for:** code samples, terminal output, technical content

[JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) is a developer-focused
monospace with increased height for better readability, code ligatures, and
variable weight axis.

**Why:** De facto standard in developer tooling. Our audience knows and trusts
it. The ligatures are optional but nice for code presentation on the brand site.

## Pairing Guidelines

| Context            | Font            | Weight      | Size       |
|--------------------|-----------------|-------------|------------|
| Hero / display     | Martian Grotesk | Bold–Black  | 3xl–7xl    |
| Section heading    | Martian Grotesk | Semibold    | 2xl–4xl    |
| Subheading         | Inter           | Semibold    | lg–xl      |
| Body text          | Inter           | Regular     | base       |
| Small / caption    | Inter           | Regular     | sm–xs      |
| Code               | JetBrains Mono  | Regular     | sm–base    |
| Brand logotype     | Martian Grotesk | Black, Wide | —          |

## Font Files

Download variable font files and place them in `src/typography/fonts/`:

- `MartianGrotesk[wdth,wght].woff2`
- `Inter[opsz,wght].woff2`
- `JetBrainsMono[wght].woff2`

These are committed to the repo (small files, typically < 500KB each).

## Token Integration

Font families are defined in `src/palette/tokens.json` under `typography.family`
and flow through to `out/stylesheets/brand.css` via `just tokens`.
