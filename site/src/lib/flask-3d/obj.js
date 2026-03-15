/**
 * Export mesh to Wavefront OBJ format.
 *
 * @module flask-3d/obj
 */

/**
 * @param {Float32Array} positions - x,y,z per vertex (length = n*3)
 * @param {Float32Array} normals - nx,ny,nz per vertex (length = n*3)
 * @param {Uint32Array} indices - triangle list (three indices per triangle)
 * @returns {string} OBJ file content
 */
export function meshToOBJ(positions, normals, indices) {
  const lines = ["# Alkemical Development — Generative 3D Flask", "# First-principles surface of revolution", ""];

  for (let i = 0; i < positions.length; i += 3) {
    lines.push(`v ${positions[i]} ${positions[i + 1]} ${positions[i + 2]}`);
  }
  lines.push("");

  for (let i = 0; i < normals.length; i += 3) {
    lines.push(`vn ${normals[i]} ${normals[i + 1]} ${normals[i + 2]}`);
  }
  lines.push("");

  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i] + 1;
    const b = indices[i + 1] + 1;
    const c = indices[i + 2] + 1;
    lines.push(`f ${a}//${a} ${b}//${b} ${c}//${c}`);
  }

  return lines.join("\n");
}
