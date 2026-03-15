# Vector Image Builder

A generic, declarative vector image builder for Alkemical Development. Composes SVG from **scene definitions** using pluggable **generators**.

## Architecture

```
Scene → [Layer₁, Layer₂, ...] → Generator(params, style) → { defs, body }
     → Assembler → SVG string
```

- **Scene**: `viewBox`, `width`, `height`, `style`, `layers`
- **Layer**: `generator` (name), `params` (generator-specific), `style` (overrides)
- **Generator**: `(params, style, options) => { defs?, body }`

## Built-in Generators

| Generator         | Description                                      | Params                    |
|------------------|--------------------------------------------------|---------------------------|
| `reference-flask`| Canonical paths from `src/logo/flask.svg`         | None (style only)         |
| `flask`          | Procedural Erlenmeyer flask, tuned to reference   | neckWidth, bodyWidth, …   |

## Usage

```js
import { buildScene, SCENES } from "./index.js";

// Pixel-perfect original
const svg1 = buildScene({
  ...SCENES.referenceFlask,
  style: { liquid1: "#60A879", liquid2: "#9955BB", stroke: "#0a0b14" },
  width: 128,
  height: 128,
});

// Parametric with custom geometry
const svg2 = buildScene({
  ...SCENES.proceduralFlask,
  style: { liquid1: "#ecc55c", liquid2: "#d4990f" },
  layers: [{
    generator: "flask",
    params: { neckWidth: 1.5, bodyWidth: 6, liquidLevel: 0.9 },
  }],
  width: 256,
  height: 256,
});
```

## Adding Generators

```js
import { registerGenerator } from "./index.js";

registerGenerator("my-shape", (params, style) => ({
  defs: "",
  body: `<path d="M0,0 L10,10" stroke="${style.stroke}"/>`,
}));
```

## Files

- `index.js` — `buildScene`, `SCENES`, `registerGenerator`
- `assembler.js` — SVG assembly, `round`, `pt` helpers
- `types.js` — JSDoc types
- `generators/reference-flask.js` — Original canonical paths
- `generators/flask.js` — Procedural Erlenmeyer
