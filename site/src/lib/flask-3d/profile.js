/**
 * First-principles flask profile: r(y) from explicit control points.
 *
 * Shape: torus-like rounded base → straight cone → constant-radius neck → small lip bump.
 * Radius is interpolated between points with cubic Hermite (C1 smooth).
 * Base is a circular arc (tangent to axis at bottom); cone and neck are linear/constant.
 *
 * @module flask-3d/profile
 */

/**
 * Cubic Hermite basis. t in [0,1]. Returns r given r0, m0, r1, m1 (values and slopes in t).
 * r(t) = r0*h00(t) + m0*h10(t) + r1*h01(t) + m1*h11(t)
 */
function hermite(t, r0, m0, r1, m1) {
  const t2 = t * t;
  const t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;
  return h00 * r0 + h10 * m0 + h01 * r1 + h11 * m1;
}

/**
 * Circular arc for torus-like base: center (R, 0) in (y,r), radius R, through (0,0) and (baseHeight, baseRadius).
 * R = (baseRadius^2 + baseHeight^2) / (2*baseHeight). r(y) = sqrt(R^2 - (y-R)^2).
 * dr/dy = -(y-R) / sqrt(R^2 - (y-R)^2).
 */
function torusBaseRadius(y, baseHeight, baseRadius) {
  if (baseHeight <= 0 || baseRadius <= 0) return y <= 0 ? 0 : baseRadius;
  const R = (baseRadius * baseRadius + baseHeight * baseHeight) / (2 * baseHeight);
  const d = y - R;
  const r2 = R * R - d * d;
  return r2 <= 0 ? 0 : Math.sqrt(r2);
}

function torusBaseSlope(y, baseHeight, baseRadius) {
  if (baseHeight <= 0 || baseRadius <= 0) return 0;
  const R = (baseRadius * baseRadius + baseHeight * baseHeight) / (2 * baseHeight);
  const d = y - R;
  const r2 = R * R - d * d;
  if (r2 <= 0) return 0;
  return -d / Math.sqrt(r2);
}

/**
 * Build control points from high-level parameters.
 * Order: torus base (arc) → straight cone → constant neck → lip bump.
 *
 * @param {Record<string, number>} p
 * @returns {{ y: number, r: number }[]}
 */
function controlPointsFromParams(p) {
  const baseHeight = p.baseHeight ?? 0.05;
  const baseRadius = p.baseRadius ?? 0.2;
  const bodyHeight = p.bodyHeight ?? 0.45;
  const neckRadius = p.neckRadius ?? 0.07;
  const neckHeight = p.neckHeight ?? 0.2;
  const lipHeight = p.lipHeight ?? 0.03;
  const lipBump = p.lipBump ?? 0.015;

  const yBase = baseHeight;
  const yConeEnd = yBase + bodyHeight;
  const yNeckEnd = yConeEnd + neckHeight;
  const H = yNeckEnd + lipHeight;

  // Torus base: 5 points on the circular arc so Hermite follows it closely
  const torusPoints = [];
  for (let i = 0; i <= 4; i++) {
    const y = (i / 4) * yBase;
    torusPoints.push({ y, r: torusBaseRadius(y, baseHeight, baseRadius) });
  }

  const coneSlope = (neckRadius - baseRadius) / bodyHeight;

  return [
    ...torusPoints,
    { y: yConeEnd, r: neckRadius },
    { y: yNeckEnd, r: neckRadius },
    { y: yNeckEnd + lipHeight * 0.4, r: neckRadius + lipBump },
    { y: H, r: neckRadius },
  ];
}

/**
 * Slopes for control points. For torus segment we use the circle derivative; others use finite-diff.
 */
function slopes(points, p) {
  const n = points.length;
  const m = new Array(n);
  const baseHeight = p?.baseHeight ?? 0.05;
  const baseRadius = p?.baseRadius ?? 0.2;

  const useTorusBase = p != null && baseHeight > 0 && baseRadius > 0
    && points[0]?.y === 0 && points[0]?.r === 0;

  for (let i = 0; i < n; i++) {
    const pt = points[i];
    if (useTorusBase && pt.y <= baseHeight) {
      m[i] = torusBaseSlope(pt.y, baseHeight, baseRadius);
      continue;
    }
    if (n === 1) {
      m[i] = 0;
      continue;
    }
    if (i === 0) {
      const dy = points[1].y - points[0].y;
      m[i] = dy !== 0 ? (points[1].r - points[0].r) / dy : 0;
    } else if (i === n - 1) {
      const dy = points[n - 1].y - points[n - 2].y;
      m[i] = dy !== 0 ? (points[n - 1].r - points[n - 2].r) / dy : 0;
    } else {
      const dy = points[i + 1].y - points[i - 1].y;
      m[i] = dy !== 0 ? (points[i + 1].r - points[i - 1].r) / dy : 0;
    }
  }
  return m;
}

/**
 * Evaluate r(y) by torus arc (base) or Hermite between control points.
 * When p is provided and y <= p.baseHeight, uses circular arc for exact torus base.
 */
function radiusAtY(y, points, slopesArr, H, p) {
  if (y <= 0) return 0;
  if (y >= H) return points[points.length - 1].r;
  const baseHeight = p?.baseHeight;
  const baseRadius = p?.baseRadius;
  if (baseHeight != null && baseRadius != null && baseHeight > 0 && y <= baseHeight)
    return Math.max(0, torusBaseRadius(y, baseHeight, baseRadius));

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    if (y >= p0.y && y <= p1.y) {
      const dy = p1.y - p0.y;
      if (dy <= 0) return Math.max(0, p0.r);
      const t = (y - p0.y) / dy;
      const m0 = slopesArr[i] * dy;
      const m1 = slopesArr[i + 1] * dy;
      return Math.max(0, hermite(t, p0.r, m0, p1.r, m1));
    }
  }
  return Math.max(0, points[points.length - 1].r);
}

export const DEFAULT_PARAMS = {
  baseHeight: 0.05,
  baseRadius: 0.2,
  bodyHeight: 0.45,
  neckRadius: 0.07,
  neckHeight: 0.2,
  lipHeight: 0.03,
  lipBump: 0.015,
};

function totalHeight(p) {
  return (p.baseHeight ?? 0) + (p.bodyHeight ?? 0) + (p.neckHeight ?? 0) + (p.lipHeight ?? 0);
}

/**
 * Get radius at height y (for compatibility / single-point queries).
 */
export function radiusAt(y, params) {
  const p = { ...DEFAULT_PARAMS, ...params };
  const points = Array.isArray(p.controlPoints) && p.controlPoints.length > 0
    ? p.controlPoints
    : controlPointsFromParams(p);
  const H = totalHeight(p);
  const slopesArr = slopes(points, p);
  const r = radiusAtY(y, points, slopesArr, H, p);
  let segment = "base";
  if (y > (p.baseHeight ?? 0)) segment = "cone";
  if (y > (p.baseHeight ?? 0) + (p.bodyHeight ?? 0)) segment = "neck";
  if (y > H - (p.lipHeight ?? 0)) segment = "lip";
  return { r, segment };
}

/**
 * Sample the profile at N heights. Uses torus base arc + Hermite for rest.
 * If params.controlPoints is provided, those points are used directly (no torus arc).
 */
export function getProfile(params, options = {}) {
  const p = { ...DEFAULT_PARAMS, ...params };
  const points = Array.isArray(p.controlPoints) && p.controlPoints.length > 0
    ? p.controlPoints
    : controlPointsFromParams(p);
  const H = totalHeight(p);
  const n = options.verticalSegments ?? 64;
  const slopesArr = slopes(points, p);

  const out = [];
  const eps = H * 0.001;
  for (let i = 0; i <= n; i++) {
    const y = i === 0 ? eps : (i / n) * H;
    const r = radiusAtY(y, points, slopesArr, H, p);
    out.push({ y, r });
  }

  const rMax = Math.max(...points.map((pt) => pt.r));
  return {
    points: out,
    bounds: { yMin: 0, yMax: H, rMax },
    controlPoints: points,
  };
}

export { controlPointsFromParams };
