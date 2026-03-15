# Alkemical Development — Brand

Canonical source for Alkemical Development’s visual identity and brand guidelines. **The interactive site is the source of truth** for how everything fits together: run `just dev` and use the site to explore logo, color, typography, identity, and downloads.

**Live site:** [brand.alkem.dev](https://brand.alkem.dev)

## Quick start

```bash
brew install just    # or: cargo install just
cd site && npm install && cd ..
just dev             # start the brand guidelines site
```

To regenerate assets and rebuild the site:

```bash
just tokens          # design tokens → CSS/SCSS
just build           # full pipeline (tokens → optimize → site)
```

## Repository layout

| Path | Role |
|------|------|
| **site/** | Brand guidelines app (Astro). **Source of truth** for guidelines, interactive tools, and how assets are used. Run `just dev` to explore. |
| **src/** | Minimal sources that feed the site or exports. |
| **src/logo/** | Logo: Blender file (`alkemical-logo.blend`), 2D reference SVG (`flask.svg`). |
| **src/palette/** | Design tokens (`tokens.json`) → CSS/SCSS. |
| **src/typography/** | Font choices and references. |
| **scripts/** | Token generator, Blender export, image optimization. |
| **out/** | Generated assets (logo exports, tokens CSS); copied into `site/public/brand/` when you run `just build-site`. |

## Asset pipeline

Everything in `out/` is derived from `src/`. The site consumes `out/` (via `build-site`) and also hosts procedural tools (e.g. 3D flask, logo explorer).

| Recipe | Input | Output |
|--------|--------|--------|
| `just tokens` | `src/palette/tokens.json` | `out/stylesheets/brand.{css,scss}` |
| `just export-logo` | `src/logo/*.blend` | `out/logo/{svg,png}/*` |
| `just export-flask-3d` | (procedural) | `out/logo/flask-3d.obj` |
| `just optimize` | `out/logo/*` | optimized SVG/PNG/WebP |
| `just build-site` | `out/**` + site | `site/dist/` (deployable) |
| `just build` | full pipeline | tokens → optimize → build-site |
| `just clean` | — | removes `out/` and `site/dist/` |

## Tools

- **[Just](https://github.com/casey/just)** — task runner
- **[Node](https://nodejs.org/)** — token generation, Astro site
- **[Blender](https://www.blender.org/)** — 3D logo source, headless export
- **[Astro](https://astro.build/)** — brand guidelines static site
- **svgo** / **cwebp** — optional image optimization

## Licensing

| What | License |
|------|---------|
| Creative assets (logos, palettes, fonts) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| Code & scripts | [MIT](https://opensource.org/licenses/MIT) |

See [LICENSE](LICENSE) and [CONTRIBUTING.md](CONTRIBUTING.md).
