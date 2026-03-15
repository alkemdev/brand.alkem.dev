/**
 * 3D Generative Flask — first-principles surface of revolution.
 *
 * @module flask-3d
 */

export { getProfile, radiusAt, DEFAULT_PARAMS, controlPointsFromParams } from "./profile.js";
export { buildRevolutionMesh, toThreeBufferGeometry } from "./mesh.js";
export { meshToOBJ } from "./obj.js";

import { getProfile } from "./profile.js";
import { buildRevolutionMesh } from "./mesh.js";
import { meshToOBJ } from "./obj.js";

/**
 * Build full flask: profile + mesh + OBJ string.
 *
 * @param {Record<string, number>} params - Override DEFAULT_PARAMS
 * @param {{ verticalSegments?: number, azimuthSegments?: number }} options
 * @returns {{ profile: object, mesh: { positions, normals, indices }, obj: string }}
 */
export function buildFlask(params = {}, options = {}) {
  const profile = getProfile(params, {
    verticalSegments: options.verticalSegments ?? 64,
  });
  const mesh = buildRevolutionMesh(profile, {
    azimuthSegments: options.azimuthSegments ?? 48,
  });
  const obj = meshToOBJ(mesh.positions, mesh.normals, mesh.indices);
  return { profile, mesh, obj };
}
