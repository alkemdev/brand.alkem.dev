/**
 * Reference flask generator — uses the original canonical paths from src/logo/flask.svg.
 * Produces pixel-perfect match to the existing logo. Only colors/stroke are parameterized.
 * @module vector-builder/generators/reference-flask
 */

/** Original liquid path (full flask interior) — shared by both liquid layers in source */
const LIQUID_PATH =
  "M13.4913,13.4754 c0.5303-0.5138,1.1804-1.4472,0.9987-2.7977c-0.0691-0.5136-0.2643-1.1484-1.1932-1.9023 c-0.2124-0.1727-1.4783-1.0976-2.6143-1.9363C9.5627,7.5954,8.9867,7.8289,8.0305,7.83C6.9966,7.8311,6.4777,7.6235,5.3498,6.8455 c-1.145,0.8451-2.4054,1.7481-2.6193,1.922c-0.929,0.754-1.1241,1.3888-1.1932,1.9023c-0.1817,1.3506,0.5231,2.2918,1.0534,2.8055 s2.3429,1.6887,5.4249,1.6613C11.0977,15.1641,12.961,13.9892,13.4913,13.4754z";

/** Liquid surface / meniscus line */
const LIQUID_TOP_PATH =
  "M10.6825,6.839C9.5627,7.5954,8.9867,7.8289,8.0305,7.83 C6.9966,7.8311,6.4777,7.6235,5.3498,6.8455";

/** Flask outline (neck + body) */
const OUTLINE_PATH =
  "M6.645,2.457v3.4453C5.1238,7.0014,3.0341,8.5206,2.7305,8.7675c-0.929,0.754-1.1241,1.3888-1.1932,1.9023 c-0.1817,1.3506,0.5231,2.2918,1.0534,2.8055s2.3429,1.6887,5.4249,1.6613c3.082,0.0273,4.8946-1.1476,5.4249-1.6613 c0.5303-0.5138,1.2351-1.455,1.0534-2.8055c-0.0691-0.5136-0.2643-1.1484-1.1932-1.9023 c-0.3035-0.2469-2.3925-1.7661-3.9137-2.8652V2.457";

/** Stopper */
const STOPPER_PATH =
  "M8.0146,1.3292c0.3701,0,0.87,0.0369,1.305,0.2655C8.8846,1.3661,8.3847,1.3292,8.0146,1.3292 c-0.3208,0.0104-0.87,0.0369-1.305,0.2655c-0.435,0.2286-0.435,0.5125-0.4214,0.6342c0.0136,0.1217,0.1365,0.2544,0.1365,0.2544 S6.733,2.9247,7.9965,2.9247s1.6089-0.4414,1.6089-0.4414c0,0,0.122-0.1327,0.1356-0.2544s0.0136-0.4056-0.4214-0.6342 C8.8846,1.3661,8.3509,1.3397,8.0146,1.3292c-0.3208,0.0104-0.87,0.0369-1.305,0.2655C7.1446,1.3661,7.6938,1.3292,8.0146,1.3292z";

/**
 * Reference flask generator. Uses original paths; only style is parameterized.
 * @type {import("../types.js").Generator}
 */
export function referenceFlask(_params, style) {
  const sw = style.strokeWidth ?? 0.5;
  const swt = sw * 1.5;
  const stroke = style.stroke ?? "#0a0b14";
  const liquid1 = style.liquid1 ?? "#60A879";
  const liquid2 = style.liquid2 ?? "#9955BB";

  // Original: green path first, then purple (purple on top). We keep that order.
  const body = [
    `<g id="FlaskLiquid">`,
    `  <path fill="${liquid1}" stroke="${stroke}" stroke-width="${sw}" d="${LIQUID_PATH}"/>`,
    `  <path fill="${liquid2}" stroke="${stroke}" stroke-width="${sw}" d="${LIQUID_PATH}"/>`,
    `</g>`,
    `<g id="FlaskLines">`,
    `  <path fill="none" stroke="${stroke}" stroke-width="${swt}" d="${LIQUID_TOP_PATH}"/>`,
    `  <path fill="none" stroke="${stroke}" stroke-width="${swt}" d="${OUTLINE_PATH}"/>`,
    `  <path fill="none" stroke="${stroke}" stroke-width="${swt}" d="${STOPPER_PATH}"/>`,
    `</g>`,
  ].join("\n");

  return { defs: "", body };
}
