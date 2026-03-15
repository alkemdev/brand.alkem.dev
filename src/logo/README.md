# Logo Source Files

Canonical sources for the Alkemical Development logo.

## Files

- `alkemical-logo.blend` — 3D logo source (Blender); export to SVG/PNG via `just export-logo`.
- `flask.svg` — 2D reference paths for the flask mark; used by the site’s Logo Explorer (“Reference” mode).

## Export

- **Blender logo**: Run `just export-logo` to export SVG and PNG variants to `out/logo/`. Uses Blender headless mode via `scripts/export-logo.py`.
- **Generative 3D flask**: Run `just export-flask-3d` to generate a procedural flask mesh (first-principles surface of revolution) as `out/logo/flask-3d.obj`. Interactive 3D explorer: site route `/experiments/flask-3d`.
