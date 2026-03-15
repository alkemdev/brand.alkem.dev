/**
 * Build a surface-of-revolution mesh from a profile (y, r) array.
 *
 * Each profile point becomes a ring of vertices at height y with radius r.
 * Rings are connected by quads (two triangles each). Normals are computed
 * from the profile slope for correct lighting.
 *
 * @module flask-3d/mesh
 */

/**
 * Build revolution mesh data: positions, normals, and triangle indices.
 *
 * @param {{ points: Array<{y: number, r: number}> }} profile - From getProfile()
 * @param {{ azimuthSegments?: number }} options - azimuthSegments = segments around the axis (default 32)
 * @returns {{ positions: Float32Array, normals: Float32Array, indices: Uint32Array }}
 */
export function buildRevolutionMesh(profile, options = {}) {
  const { points } = profile;
  const azimuthSegments = options.azimuthSegments ?? 32;
  const nRings = points.length;
  const first = points[0];
  const last = points[nRings - 1];
  if (first && last && typeof console !== "undefined" && console.debug) {
    console.debug("[flask-3d] bottom ring (y, r) =", first.y.toFixed(3), first.r.toFixed(3), "| top ring =", last.y.toFixed(3), last.r.toFixed(3));
  }

  const ringVerts = nRings * (azimuthSegments + 1);
  const capVertex = 1;
  const nVerts = ringVerts + capVertex;

  const positions = new Float32Array(nVerts * 3);
  const normals = new Float32Array(nVerts * 3);

  for (let i = 0; i < nRings; i++) {
    const { y, r } = points[i];
    const dr = i === 0
      ? (points[1].r - points[0].r) / (points[1].y - points[0].y || 1)
      : i === nRings - 1
        ? (points[nRings - 1].r - points[nRings - 2].r) / (points[nRings - 1].y - points[nRings - 2].y || 1)
        : (points[i + 1].r - points[i - 1].r) / (points[i + 1].y - points[i - 1].y || 1);
    const dy = 1;
    const len = Math.hypot(dr, dy) || 1;
    const nr = 1 / len;
    const ny = -dr / len;

    for (let j = 0; j <= azimuthSegments; j++) {
      const theta = (j / azimuthSegments) * Math.PI * 2;
      const c = Math.cos(theta);
      const s = Math.sin(theta);
      const idx = (i * (azimuthSegments + 1) + j) * 3;
      positions[idx] = r * c;
      positions[idx + 1] = y;
      positions[idx + 2] = r * s;
      normals[idx] = nr * c;
      normals[idx + 1] = ny;
      normals[idx + 2] = nr * s;
    }
  }

  const bottomCenterIdx = ringVerts;
  positions[bottomCenterIdx * 3] = 0;
  positions[bottomCenterIdx * 3 + 1] = 0;
  positions[bottomCenterIdx * 3 + 2] = 0;
  normals[bottomCenterIdx * 3] = 0;
  normals[bottomCenterIdx * 3 + 1] = -1;
  normals[bottomCenterIdx * 3 + 2] = 0;

  const nQuadTris = (nRings - 1) * azimuthSegments * 6;
  const nCapTris = azimuthSegments * 3;
  const indices = new Uint32Array(nQuadTris + nCapTris);
  let triIdx = 0;
  for (let i = 0; i < nRings - 1; i++) {
    for (let j = 0; j < azimuthSegments; j++) {
      const a = i * (azimuthSegments + 1) + j;
      const b = a + 1;
      const c = a + (azimuthSegments + 1);
      const d = c + 1;
      indices[triIdx++] = a;
      indices[triIdx++] = c;
      indices[triIdx++] = b;
      indices[triIdx++] = b;
      indices[triIdx++] = c;
      indices[triIdx++] = d;
    }
  }
  for (let j = 0; j < azimuthSegments; j++) {
    const a = j;
    const b = (j + 1) % (azimuthSegments + 1);
    indices[triIdx++] = bottomCenterIdx;
    indices[triIdx++] = a;
    indices[triIdx++] = b;
  }

  return { positions, normals, indices };
}

/**
 * Convert mesh to a Three.js BufferGeometry (if Three is available).
 * Caller must pass THREE to avoid hard dependency.
 *
 * @param {{ positions: Float32Array, normals: Float32Array, indices: Uint32Array }} mesh
 * @param {import("three")} THREE
 * @returns {import("three").BufferGeometry}
 */
export function toThreeBufferGeometry(mesh, THREE) {
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(mesh.positions, 3));
  geom.setAttribute("normal", new THREE.BufferAttribute(mesh.normals, 3));
  geom.setIndex(new THREE.BufferAttribute(mesh.indices, 1));
  geom.computeBoundingSphere();
  return geom;
}
