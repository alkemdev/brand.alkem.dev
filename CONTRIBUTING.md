# Contributing to Alkemical Development Brand

Thank you for your interest in contributing to our brand resources.

## Getting Started

1. Fork and clone the repository
2. Install [Just](https://github.com/casey/just) (`brew install just` on macOS)
3. Install Node.js dependencies: `cd site && npm install`
4. Run `just build` to verify everything works

## What You Can Contribute

- **Logo refinements** — edit `src/logo/*.blend` in Blender, export via `just export-logo`; 2D reference paths in `src/logo/flask.svg`
- **3D flask** — procedural mesh in `site/src/lib/flask-3d/`; export OBJ with `just export-flask-3d`, explore at `/experiments/flask-3d`
- **Color / token tweaks** — modify `src/palette/tokens.json`, regenerate with `just tokens`
- **Typography suggestions** — update `src/typography/FONT_CHOICES.md`
- **Site improvements** — work in `site/` (Astro)
- **Pipeline enhancements** — improve scripts in `scripts/`

## Workflow

1. **Edit source files** in `src/` — never hand-edit files in `out/`
2. **Run the pipeline** — `just build` regenerates everything
3. **Preview the site** — `just dev` starts the Astro dev server
4. **Commit source + generated output** together

## Conventions

- The **site** is the source of truth for guidelines and how assets are used; `src/` holds the minimal sources that feed it
- Generated files in `out/` are derived and reproducible
- Design tokens in `src/palette/tokens.json` drive all color/type/spacing values
- Use `just` recipes — don't run build scripts directly

## Licensing

By contributing, you agree that:
- Creative assets are licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- Code and scripts are licensed under [MIT](https://opensource.org/licenses/MIT)

## Tools You'll Need

| Tool     | Purpose                        | Install                        |
|----------|--------------------------------|--------------------------------|
| Just     | Task runner                    | `brew install just`            |
| Node.js  | Token generation, Astro site   | `brew install node`            |
| Blender  | Logo source editing & export   | [blender.org](https://blender.org) |
| svgo     | Optional: SVG optimization     | `npm install -g svgo`          |
| cwebp    | Optional: WebP conversion      | `brew install webp`            |
