# 3D Generative Flask

Procedural Erlenmeyer-style flask as a **surface of revolution**: a single radius profile **r(y)** is rotated around the vertical axis to produce the mesh.

## Model

- **Axis**: Vertical Y (height). The flask is rotationally symmetric.
- **Profile** (bottom → top):
  1. **Torus-like base** — Circular arc tangent to the axis at the tip, curving out to `(baseHeight, baseRadius)`.
  2. **Straight cone** — Linear taper from base to neck.
  3. **Constant-radius neck** — Cylinder.
  4. **Lip bump** — Small outward bulge at the rim.

Cone and neck/lip use control points with cubic Hermite interpolation (C1). The base uses an explicit circular arc so the foot is a true torus-like curve.

## Parameters

| Param        | Meaning                              |
|-------------|--------------------------------------|
| `baseHeight`| Height of the base arc.              |
| `baseRadius`| Radius where base meets the cone.   |
| `bodyHeight`| Height of the straight cone.         |
| `neckRadius`| Radius of the cylindrical neck.     |
| `neckHeight`| Length of the neck.                 |
| `lipHeight` | Vertical span of the lip.           |
| `lipBump`   | Outward bulge at the rim.           |

Total height = `baseHeight + bodyHeight + neckHeight + lipHeight`.

## API

- **`getProfile(params)`** — Returns `{ points, bounds, controlPoints }` (sampled profile).
- **`radiusAt(y, params)`** — Returns `{ r, segment }` for a single height.
- **`controlPointsFromParams(p)`** — Builds the control-point array from the params above (exported for inspection).
- **`buildRevolutionMesh(profile, options)`** — `{ positions, normals, indices }` for Three.js or OBJ.
- **`meshToOBJ(positions, normals, indices)`** — OBJ file string.
- **`buildFlask(params, options)`** — Full pipeline: profile + mesh + OBJ string.
- **`DEFAULT_PARAMS`** — Default slider values used by the explorer and export script.

## Usage

- **Interactive**: Open `/experiments/flask-3d`. Adjust sliders; download OBJ from the page.
- **CLI export**: From repo root run `just export-flask-3d` (or from `site/`: `node scripts/export-flask-3d.mjs`). Writes `out/logo/flask-3d.obj`.
