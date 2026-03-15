/**
 * @typedef {Object} VectorStyle
 * @property {string} [liquid1] - Fill color for liquid base layer
 * @property {string} [liquid2] - Fill color for liquid top layer
 * @property {string} [stroke] - Stroke color
 * @property {number} [strokeWidth] - Stroke width
 */

/**
 * @typedef {Object} Layer
 * @property {string} generator - Registered generator name
 * @property {Record<string, unknown>} [params] - Generator-specific parameters
 * @property {VectorStyle} [style] - Style overrides for this layer
 */

/**
 * @typedef {Object} Scene
 * @property {[number, number, number, number]} viewBox - SVG viewBox [x, y, w, h]
 * @property {number} [width] - Output width in pixels
 * @property {number} [height] - Output height in pixels
 * @property {VectorStyle} [style] - Default style for all layers
 * @property {Layer[]} layers - Ordered layers (back to front)
 */

/**
 * @typedef {Object} GeneratorResult
 * @property {string} [defs] - SVG defs (clipPath, etc.)
 * @property {string} body - SVG group/path content
 */

/**
 * @typedef {(params: Record<string, unknown>, style: VectorStyle, options: { width: number; height: number }) => GeneratorResult} Generator
 */

export const VIEWBOX_DEFAULT = [0, 0, 16, 16];
