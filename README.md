# Alkemical Development — Brand

Brand guidelines and design tokens. The site is the source of truth.

**Live:** [brand.alkem.dev](https://brand.alkem.dev)

## Quick start

```bash
cd site && npm install && cd ..
just dev
```

```bash
just tokens    # regenerate CSS from src/palette/tokens.json
just build     # full pipeline → site/dist
```

## Layout

| Path | Role |
|------|------|
| **site/** | Astro app — `just dev` / deploy `site/dist/` |
| **src/palette/** | `tokens.json` → `just tokens` → `out/stylesheets/` |
| **scripts/** | `tokens.mjs` |
| **crates/flaskgen** | Rust/WASM flask generator — `just build-flask` → `site/public/tools/flask/` |

## License

Assets CC BY-SA 4.0 · Code MIT
