/**
 * Assembles a complete SVG document from scene definition and generator outputs.
 * @param {Object} opts
 * @param {[number, number, number, number]} opts.viewBox
 * @param {number} [opts.width]
 * @param {number} [opts.height]
 * @param {string} [opts.defs]
 * @param {string} opts.body
 * @param {string} [opts.comment]
 * @returns {string} Complete SVG document
 */
export function assembleSvg({ viewBox, width, height, defs = "", body, comment, embedded = true }) {
  const [x, y, w, h] = viewBox;
  const vb = `${x} ${y} ${w} ${h}`;
  const sizeAttrs =
    width != null && height != null ? ` width="${width}" height="${height}"` : "";
  const commentLine = comment ? `<!-- ${comment} -->\n` : "";
  const preamble = embedded ? "" : "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n";
  return (
    preamble +
    commentLine +
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"${sizeAttrs}>\n` +
    (defs ? `  <defs>\n${defs.trim().replace(/^/gm, "    ")}\n  </defs>\n` : "") +
    body
      .trim()
      .split("\n")
      .map((line) => "  " + line)
      .join("\n") +
    "\n</svg>"
  );
}

/**
 * Rounds a number for SVG output (avoids long decimals).
 * @param {number} v
 * @param {number} [places=3]
 * @returns {number}
 */
export function round(v, places = 3) {
  const p = 10 ** places;
  return Math.round(v * p) / p;
}

/** Alias for round(v, 3) — common for path coordinates */
export function round3(v) {
  return round(v, 3);
}

/**
 * Formats coordinates for SVG path d attribute.
 * @param {...number} coords
 * @returns {string}
 */
export function pt(...coords) {
  return coords.map((c) => round(c)).join(",");
}
