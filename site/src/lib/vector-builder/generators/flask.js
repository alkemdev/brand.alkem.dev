/**
 * Procedural flask generator — wide-bodied Erlenmeyer flask.
 *
 * ═══════════════════════════════════════════════════════════════════
 * ANATOMY OF THE FLASK (top → bottom)
 * ═══════════════════════════════════════════════════════════════════
 *
 *   stopperTopY ──┤ STOPPER (pill/cork cap, rounded top) ├── stopperTopY
 *   neckTopY    ──┤ NECK (straight vertical tube)         ├── neckTopY
 *   neckBotY    ─────────────────────────────────────────── neckBotY
 *                \  SHOULDER                              /
 *                 \  one cubic bezier per side,          /
 *   shoulderBotY   \ from neckHW to shoulderHW          /  shoulderBotY
 *                  /  FLARE                              \
 *                 /   one cubic bezier per side,         \
 *   maxWidthY   /     from shoulderHW to bodyHW          \  maxWidthY
 *               \  CORNER                                /
 *                \  one cubic bezier per side,          /
 *   cornerBotY    \ bodyHW curving back to cornerHW    /  cornerBotY
 *                 (                                    )
 *                  ╰── BOTTOM (half-ellipse, 2 cubic  ╯
 *   botCenterY         bezier arcs)                      botCenterY
 *
 * ═══════════════════════════════════════════════════════════════════
 * G1 CONTINUITY — NO KINKS BETWEEN SEGMENTS
 * ═══════════════════════════════════════════════════════════════════
 *
 * At every joint between segments, tangents match:
 *
 *   Neck → Shoulder (at neckBotY):
 *     Neck wall is vertical. So shoulder CP1 has the SAME X as the
 *     neck-bottom point — guaranteeing a vertical tangent at the joint.
 *
 *   Shoulder → Flare (at shoulderBotY):
 *     For G1, the tangent at the end of the shoulder equals the tangent
 *     at the start of the flare. Both are controlled by their adjacent
 *     control points. We enforce this by choosing CP2 of shoulder and
 *     CP1 of flare to be collinear with (shoulderBotX, shoulderBotY).
 *     The "shoulderCurve" parameter picks where along the shoulder the
 *     curve turns (early vs. late), and the joint tangent is implicitly
 *     determined. We give the user a single intuitive knob.
 *
 *   Flare → Corner (at maxWidthY):
 *     The body reaches its widest point here. By convention this tangent
 *     is HORIZONTAL (purely vertical motion at the widest point, as in
 *     the reference). Both flare CP2 and corner CP1 must have the SAME Y
 *     as maxWidthY and be symmetric about bLX/bRX.
 *
 *   Corner → Bottom arc (at cornerBotY):
 *     The corner arrives at cornerBotX, cornerBotY. The bottom arc
 *     starts here. For G1, we need the corner's ending tangent to match
 *     the arc's starting tangent. The half-ellipse at the sides has a
 *     vertical tangent, so corner CP2 must have the SAME X as the
 *     endpoint (cornerBotX).
 *
 *   Bottom arc (at center):
 *     Two quarter-ellipse bezier arcs meet at the center bottom.
 *     Tangent at center is horizontal. Both arcs naturally satisfy this
 *     with the ellipse's κ control points.
 *
 * ═══════════════════════════════════════════════════════════════════
 * USER PARAMETERS (all have geometric meaning)
 * ═══════════════════════════════════════════════════════════════════
 *
 *   neckHW          neck tube half-width               default 1.355
 *   shoulderHW      half-width where shoulder lands    default 5.27
 *   bodyHW          max body half-width (widest)       default 6.46
 *   neckH           neck tube height                   default 3.445
 *   bodyH           total body height (neckBot→bottom) default 9.24
 *   shoulderRatio   fraction of bodyH for shoulder     default 0.31
 *   flareRatio      fraction of bodyH for flare zone   default 0.21
 *   shoulderCurve   shoulder curve shape 0=early 1=late default 0.5
 *   bottomH         height of the flat bottom arc      default 1.66
 *   liquidLevel     fill fraction 0–1                  default 1.0
 *   stopperH        stopper height                     default 1.13
 *   stopperHW       stopper half-width                 default neckHW
 *
 * @module vector-builder/generators/flask
 */

import { round, pt } from "../assembler.js";

/** @type {import("../types.js").Generator} */
export function flask(params, style) {
  const p = params ?? {};
  const cx = 8; // horizontal center (viewBox 0 0 16 16)

  // ════════════════════════════════════════════════════════════════════
  // PRIMARY SHAPE PARAMETERS
  // ════════════════════════════════════════════════════════════════════

  const neckHW     = p.neckHW     ?? p.neckWidth    ?? 1.355;
  const shoulderHW = p.shoulderHW ?? p.bodyWidth    ?? 5.27;
  const bodyHW     = p.bodyHW     ?? 6.46;

  const neckH      = p.neckH      ?? p.neckHeight   ?? 3.445;
  const bodyH      = p.bodyH      ?? p.bodyHeight   ?? 9.24;

  // Fraction of bodyH used by shoulder (neck→shoulder transition)
  const shoulderRatio = clamp(p.shoulderRatio ?? 0.31, 0.10, 0.70);
  // Fraction of bodyH used by flare (shoulder→max-width)
  const flareRatio    = clamp(p.flareRatio    ?? 0.21, 0.05, 0.45);
  // Height of the bottom half-ellipse closing arc
  const bottomH       = clamp(p.bottomH       ?? 1.66,  0.5,  4.0);

  // shoulderCurve: 0 = S-curve leans toward neck (curves out early),
  //                1 = S-curve leans toward body (hugs neck, late flare)
  // This biases where along the shoulder the outward sweep peaks.
  const shoulderCurve = clamp(p.shoulderCurve ?? 0.5, 0.0, 1.0);

  // Stopper
  const stopperH   = p.stopperH   ?? p.stopperHeight ?? 1.13;
  const stopperHW  = Math.max(p.stopperHW ?? p.stopperWidth ?? neckHW, neckHW);
  const stopperTopY = p.stopperTopY ?? 1.33;

  // ════════════════════════════════════════════════════════════════════
  // DERIVED Y ANCHOR POINTS
  // ════════════════════════════════════════════════════════════════════

  const neckTopY     = stopperTopY + stopperH;
  const neckBotY     = neckTopY + neckH;

  const shoulderH    = bodyH * shoulderRatio;
  const flareH       = bodyH * flareRatio;
  // cornerH = space between flare-end and bottom-arc-start
  const cornerH      = Math.max(0.1, bodyH - shoulderH - flareH - bottomH);

  const shoulderBotY = neckBotY   + shoulderH;   // shoulder ends, flare begins
  const maxWidthY    = shoulderBotY + flareH;    // widest point of body
  const cornerBotY   = maxWidthY    + cornerH;   // bottom arc begins
  const botCenterY   = cornerBotY   + bottomH;   // very bottom

  // ════════════════════════════════════════════════════════════════════
  // X ANCHOR POINTS
  // ════════════════════════════════════════════════════════════════════

  const nLX  = cx - neckHW,     nRX  = cx + neckHW;
  const shLX = cx - shoulderHW, shRX = cx + shoulderHW;
  const mxLX = cx - bodyHW,     mxRX = cx + bodyHW;
  const cbLX = cx - bodyHW,     cbRX = cx + bodyHW; // corner-bottom X = same as maxWidth

  // Note: the "corner" brings the body from bodyHW back down to cornerBotHW.
  // cornerBotHW is the half-width at the start of the bottom arc.
  // We allow a separate param but default it to bodyHW * 0.838 (reference ratio).
  const cornerBotHWfrac = clamp(p.cornerBotHWfrac ?? 0.838, 0.50, 1.00);
  const cornerBotHW = bodyHW * cornerBotHWfrac;
  const cBotLX = cx - cornerBotHW, cBotRX = cx + cornerBotHW;

  // ════════════════════════════════════════════════════════════════════
  // G1-CONTINUOUS BEZIER CONTROL POINTS
  // ════════════════════════════════════════════════════════════════════

  // ── SHOULDER bezier (left): (nLX,neckBotY) → (shLX,shoulderBotY)
  //
  // G1 at start: neck wall is vertical → CP1 has same X as start (nLX).
  //   This gives a smooth continuation of the vertical neck wall.
  //
  // G1 at shoulder→flare joint: the shoulder bezier and the flare bezier
  //   must share a tangent at (shLX, shoulderBotY). We achieve this by
  //   constraining shoulder CP2 and flare CP1 to be collinear with the
  //   joint point, but we don't force them to be vertical.
  //   Instead, we pick the JOINT TANGENT ANGLE via shoulderCurve:
  //     shoulderCurve=0: tangent is steep (near-vertical) at joint → gradual shoulder
  //     shoulderCurve=1: tangent is shallow (angled outward) → aggressive flare
  //
  //   Tangent at joint: angle from vertical = shoulderCurve * 60°
  //   We express this as a ratio: dx/dy = tan(angle)
  //   At shoulderCurve=0.5 (reference): ~35° → dx/dy ≈ 0.7
  const jointAngleTan = shoulderCurve * 1.2; // dx/dy ratio at shoulder→flare joint
  // Pull distance for shoulder CP2 (how far from joint along the tangent):
  const shPull2 = shoulderH * 0.35;
  // shoulder CP2: pulled along reverse tangent from (shLX, shoulderBotY)
  const shCP2x = shLX + jointAngleTan * shPull2;  // biased toward neck (right)
  const shCP2y = shoulderBotY - shPull2;
  // shoulder CP1: vertical tangent at start (same X as nLX)
  const shCP1x = nLX;
  const shCP1y = neckBotY + shoulderH * (0.45 + 0.40 * shoulderCurve);

  // ── FLARE bezier (left): (shLX,shoulderBotY) → (mxLX,maxWidthY)
  //
  // G1 at start: CP1 must be the reflection of shoulder CP2 through (shLX,shoulderBotY).
  //   Reflection: flCP1 = 2*(shLX,shoulderBotY) - (shCP2x,shCP2y)
  const flCP1x = 2*shLX - shCP2x;  // reflection of shCP2 through joint
  const flCP1y = 2*shoulderBotY - shCP2y;
  //
  // G1 at end: at maxWidthY the tangent is purely vertical (x-velocity = 0).
  //   This is the "widest point" where the body transitions from widening to narrowing.
  //   flCP2.x = mxLX (same X as endpoint enforces vertical tangent at end).
  const flCP2x = mxLX;
  const flCP2y = maxWidthY - flareH * 0.12;

  // ── CORNER bezier (left): (mxLX,maxWidthY) → (cBotLX,cornerBotY)
  //
  // G1 at start: flare ends with vertical tangent → corner CP1 has same X (mxLX).
  const coCP1x = mxLX;
  const coCP1y = maxWidthY + cornerH * 0.55;
  //
  // G1 at end: arrives at (cBotLX,cornerBotY) where the bottom arc starts.
  //   The half-ellipse has vertical tangent at its ends, so corner CP2.x = cBotLX.
  const coCP2x = cBotLX;
  const coCP2y = cornerBotY - cornerH * 0.18;

  // ── BOTTOM arc: half-ellipse from (cBotLX,cornerBotY) to (cBotRX,cornerBotY)
  //    through (cx, botCenterY).
  //
  // G1 at start/end: vertical tangent (matching corner ends).
  //   CP1 of left arc has same X as start (cBotLX). ✓
  //   CP2 of right arc has same X as end (cBotRX). ✓
  //
  // G1 at center: horizontal tangent (both arcs arrive/leave horizontally).
  //   CP2 of left arc has same Y as center (botCenterY). ✓
  //   CP1 of right arc has same Y as center (botCenterY). ✓
  //
  // Cubic bezier approximation of quarter-ellipse:
  //   κ ≈ 0.5523 for minimal deviation from true ellipse.
  const κ = 0.5523;
  const arcCP1Ly = cornerBotY + κ * bottomH;     // CP1 of left arc (same X = cBotLX)
  const arcCP2Lx = cx - κ * cornerBotHW;         // CP2 of left arc (same Y = botCenterY)
  const arcCP1Rx = cx + κ * cornerBotHW;         // CP1 of right arc (same Y = botCenterY)
  const arcCP2Ry = cornerBotY + κ * bottomH;     // CP2 of right arc (same X = cBotRX)

  // ════════════════════════════════════════════════════════════════════
  // BUILD OUTLINE PATH
  // ════════════════════════════════════════════════════════════════════

  const outD = [
    // Left neck top
    `M${pt(nLX, neckTopY)}`,
    // Neck: straight down
    `V${pt(neckBotY)}`,
    // Shoulder: bezier sweeping left from neck to shoulder width
    `C${pt(shCP1x, shCP1y)} ${pt(shCP2x, shCP2y)} ${pt(shLX, shoulderBotY)}`,
    // Flare: bezier sweeping further left to max body width
    `C${pt(flCP1x, flCP1y)} ${pt(flCP2x, flCP2y)} ${pt(mxLX, maxWidthY)}`,
    // Corner: bezier sweeping right to corner-bottom width
    `C${pt(coCP1x, coCP1y)} ${pt(coCP2x, coCP2y)} ${pt(cBotLX, cornerBotY)}`,
    // Bottom left quarter-arc to center
    `C${pt(cBotLX, arcCP1Ly)} ${pt(arcCP2Lx, botCenterY)} ${pt(cx, botCenterY)}`,
    // Bottom right quarter-arc to right corner (mirror)
    `C${pt(arcCP1Rx, botCenterY)} ${pt(cBotRX, arcCP2Ry)} ${pt(cBotRX, cornerBotY)}`,
    // Corner right (mirror of left): same CP distances, X mirrored
    `C${pt(cx + (cx - coCP2x), coCP2y)} ${pt(cx + (cx - coCP1x), coCP1y)} ${pt(mxRX, maxWidthY)}`,
    // Flare right (mirror of left)
    `C${pt(cx + (cx - flCP2x), flCP2y)} ${pt(cx + (cx - flCP1x), flCP1y)} ${pt(shRX, shoulderBotY)}`,
    // Shoulder right (mirror of left)
    `C${pt(cx + (cx - shCP2x), shCP2y)} ${pt(cx + (cx - shCP1x), shCP1y)} ${pt(nRX, neckBotY)}`,
    // Right neck: straight up
    `V${pt(neckTopY)}`,
    "Z",
  ].join(" ");

  // ════════════════════════════════════════════════════════════════════
  // STOPPER PATH — rounded pill cap
  // ════════════════════════════════════════════════════════════════════
  //
  // A simple rounded-arch shape connecting at neckTopY.
  // The stopper is symmetric about cx, slightly wider than the neck.
  // Corner radius = min(stopperHW, stopperH/2) for nice shape.

  const stHW  = stopperHW;
  const stR   = Math.min(stHW, stopperH * 0.6); // top arch radius
  const stD   = [
    `M${pt(cx - neckHW, neckTopY)}`,
    `V${pt(stopperTopY + stR)}`,
    `Q${pt(cx - stHW, stopperTopY)} ${pt(cx, stopperTopY)}`,
    `Q${pt(cx + stHW, stopperTopY)} ${pt(cx + stHW, stopperTopY + stR)}`,
    `V${pt(neckTopY)}`,
  ].join(" ");

  // ════════════════════════════════════════════════════════════════════
  // LIQUID FILL
  // ════════════════════════════════════════════════════════════════════

  const sw     = style?.strokeWidth ?? 0.5;
  const swt    = round(sw * 1.5);
  const stroke = style?.stroke  ?? "#0a0b14";
  const l1     = style?.liquid1 ?? "#60A879";
  const l2     = style?.liquid2 ?? "#9955BB";
  const ll     = clamp(p.liquidLevel ?? 1.0, 0, 1);

  let defs = "";
  let liquidBody = "";

  if (ll > 0.005) {
    // Surface Y: at ll=1, sits at the meniscus position in the shoulder zone.
    // Reference: surface is at 32.9% of the way down the shoulder.
    // At ll=0: surface is at botCenterY.
    const surfFullY  = neckBotY + shoulderH * 0.33;
    const surfEmptyY = botCenterY;
    const surfY      = surfFullY + (1.0 - ll) * (surfEmptyY - surfFullY);

    // Find wall half-width at surfY using the same bezier formulas
    const surfHW = wallHWatY(surfY, {
      neckBotY, shoulderBotY, maxWidthY, cornerBotY, botCenterY,
      neckHW, shoulderHW, bodyHW, cornerBotHW, bottomH,
      shCP1y, shCP2y, flCP1y, flCP2y,
    });

    const sL = cx - surfHW, sR = cx + surfHW;

    // Meniscus S-curve: dips at center, tips at sL/sR
    const dipAmt = clamp(surfHW * 0.18, 0.15, 1.1);
    const dipY   = surfY + dipAmt;
    const span   = sR - sL;
    // Meniscus bezier control points (derived from reference LiquidTop path fractions)
    const mCP1Lx = sR - span * 0.422, mCP1Ly = surfY + dipAmt * 0.763;
    const mCP2Lx = sR - span * 0.638, mCP2Ly = dipY;
    const mCP1Rx = sL + span * 0.638, mCP1Ry = dipY;
    const mCP2Rx = sL + span * 0.422, mCP2Ry = surfY + dipAmt * 0.763;

    const surfD = [
      `M${pt(sL, surfY)}`,
      `C${pt(mCP1Lx, mCP1Ly)} ${pt(mCP2Lx, mCP2Ly)} ${pt(cx, dipY)}`,
      `C${pt(mCP1Rx, mCP1Ry)} ${pt(mCP2Rx, mCP2Ry)} ${pt(sR, surfY)}`,
    ].join(" ");

    const pad  = 2;
    const bx   = cx - bodyHW - pad;
    const rx   = cx + bodyHW + pad;
    const botY = botCenterY + pad;

    // l1: full fill rect, clipped to flask. l2: same but bounded above by meniscus.
    const liq1D = `M${pt(bx, surfY)} V${pt(botY)} H${pt(rx)} V${pt(surfY)} Z`;
    const liq2D = [
      `M${pt(bx, surfY)} H${pt(sL)}`,
      `C${pt(mCP1Lx, mCP1Ly)} ${pt(mCP2Lx, mCP2Ly)} ${pt(cx, dipY)}`,
      `C${pt(mCP1Rx, mCP1Ry)} ${pt(mCP2Rx, mCP2Ry)} ${pt(sR, surfY)}`,
      `H${pt(rx)} V${pt(botY)} H${pt(bx)} Z`,
    ].join(" ");

    defs = `<clipPath id="flask-clip"><path d="${outD}"/></clipPath>`;
    liquidBody =
      `<g clip-path="url(#flask-clip)">` +
      `<path d="${liq1D}" fill="${l1}"/>` +
      `<path d="${liq2D}" fill="${l2}"/>` +
      `<path d="${surfD}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>` +
      `</g>`;
  }

  const body =
    (liquidBody ? liquidBody + "\n" : "") +
    `<path d="${outD}" fill="none" stroke="${stroke}" stroke-width="${swt}" stroke-linejoin="round" stroke-linecap="round"/>` +
    "\n" +
    `<path d="${stD}" fill="none" stroke="${stroke}" stroke-width="${swt}" stroke-linejoin="round" stroke-linecap="round"/>`;

  return { defs, body };
}

// ════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Approximate wall half-width at a given Y position.
 * Used for placing the liquid surface meniscus tips on the flask wall.
 * Uses piecewise linear interpolation through the zone anchor points —
 * close enough for meniscus positioning.
 */
function wallHWatY(y, z) {
  const { neckBotY, shoulderBotY, maxWidthY, cornerBotY, botCenterY,
          neckHW, shoulderHW, bodyHW, cornerBotHW } = z;

  if (y <= neckBotY)     return neckHW;
  if (y <= shoulderBotY) return lerp(neckHW,    shoulderHW, (y - neckBotY)    / (shoulderBotY - neckBotY));
  if (y <= maxWidthY)    return lerp(shoulderHW, bodyHW,    (y - shoulderBotY) / (maxWidthY - shoulderBotY));
  if (y <= cornerBotY)   return lerp(bodyHW,    cornerBotHW,(y - maxWidthY)    / (cornerBotY - maxWidthY));
  if (y <= botCenterY) {
    const frac = (y - cornerBotY) / (botCenterY - cornerBotY);
    return cornerBotHW * Math.sqrt(Math.max(0, 1 - frac * frac));
  }
  return 0;
}

function lerp(a, b, t) {
  return a + (b - a) * clamp(t, 0, 1);
}
