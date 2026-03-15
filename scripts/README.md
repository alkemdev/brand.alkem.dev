# Build & Automation Scripts

These scripts are called by `justfile` recipes. Run them via `just`, not directly.

| Script                | Recipe             | Purpose                                    |
|-----------------------|--------------------|--------------------------------------------|
| `generate-tokens.mjs` | `just tokens`      | `tokens.json` → CSS custom properties + SCSS |
| `export-logo.py`      | `just export-logo` | Blender headless → SVG + PNG at multiple sizes |
| `optimize-images.sh`  | `just optimize`    | svgo + sharp optimization pass              |
