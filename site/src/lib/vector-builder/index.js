/**
 * Generic vector image builder — declarative scene composition with pluggable generators.
 * Generates SVG from scene definitions; supports reference (canonical paths) and procedural modes.
 * @module vector-builder
 */

import { assembleSvg } from "./assembler.js";
import { VIEWBOX_DEFAULT } from "./types.js";
import { referenceFlask } from "./generators/reference-flask.js";
import { flask } from "./generators/flask.js";

/** @type {Map<string, import("./types.js").Generator>} */
const generators = new Map();

/**
 * Register a generator by name.
 * @param {string} name - Generator identifier
 * @param {import("./types.js").Generator} fn - Generator function
 */
export function registerGenerator(name, fn) {
  generators.set(name, fn);
}

/**
 * Get a registered generator.
 * @param {string} name
 * @returns {import("./types.js").Generator}
 * @throws {Error} if generator not found
 */
export function getGenerator(name) {
  const fn = generators.get(name);
  if (!fn) throw new Error(`Unknown generator: ${name}`);
  return fn;
}

// Register built-in generators
registerGenerator("reference-flask", referenceFlask);
registerGenerator("flask", flask);

/**
 * Build an SVG document from a scene definition.
 * @param {import("./types.js").Scene} scene - Scene with layers
 * @param {Object} [options] - Build options
 * @param {string} [options.comment] - Optional SVG comment
 * @returns {string} Complete SVG markup
 */
export function buildScene(scene, options = {}) {
  const {
    viewBox = VIEWBOX_DEFAULT,
    width = 128,
    height = 128,
    style = {},
    layers = [],
  } = scene;

  let defs = "";
  const bodyParts = [];

  for (const layer of layers) {
    const mergedStyle = { ...style, ...(layer.style || {}) };
    const gen = getGenerator(layer.generator);
    const params = layer.params ?? {};
    const result = gen(params, mergedStyle, { width, height });

    if (result.defs) defs += result.defs;
    if (result.body) bodyParts.push(result.body);
  }

  const body = bodyParts.join("\n");

  return assembleSvg({
    viewBox,
    width,
    height,
    defs: defs || undefined,
    body,
    comment: options.comment,
  });
}

/**
 * Preset scene definitions for common use cases.
 */
export const SCENES = {
  /** Pixel-perfect original flask — reference paths, style only */
  referenceFlask: {
    viewBox: VIEWBOX_DEFAULT,
    style: {
      liquid1: "#60A879",
      liquid2: "#9955BB",
      stroke: "#0a0b14",
      strokeWidth: 0.5,
    },
    layers: [{ generator: "reference-flask", params: {} }],
  },

  /** Procedural flask — full geometry control, defaults match reference */
  proceduralFlask: {
    viewBox: VIEWBOX_DEFAULT,
    style: {
      liquid1: "#60A879",
      liquid2: "#9955BB",
      stroke: "#0a0b14",
      strokeWidth: 0.5,
    },
    layers: [
      {
        generator: "flask",
        params: {
          neckHW: 1.355,        // neck tube half-width
          shoulderHW: 5.27,     // half-width at shoulder landing (≠ bodyHW)
          bodyHW: 6.46,         // max body half-width (widest point)
          neckH: 3.445,         // neck tube height
          bodyH: 9.24,          // total body height (neckBot → flask bottom)
          shoulderRatio: 0.31,  // fraction of bodyH for shoulder curve
          flareRatio: 0.21,     // fraction of bodyH for flare zone
          shoulderCurve: 0.5,   // shoulder curve shape (0=early 0.5=sym 1=late)
          bottomH: 1.66,        // height of the flat bottom arc
          cornerBotHWfrac: 0.838, // bottom-arc half-width as fraction of bodyHW
          liquidLevel: 1.0,
          stopperH: 1.13,
          stopperHW: 1.355,
        },
      },
    ],
  },
};
