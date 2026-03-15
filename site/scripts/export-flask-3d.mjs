#!/usr/bin/env node
/**
 * Export the generative 3D flask to OBJ.
 * Run from repo root: just export-flask-3d
 * Or from site: node scripts/export-flask-3d.mjs
 *
 * Writes: out/logo/flask-3d.obj (relative to repo root when run via just).
 */

import { writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { buildFlask, DEFAULT_PARAMS } from "../src/lib/flask-3d/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(__dirname, "..");
const repoRoot = join(siteRoot, "..");
const outDir = join(repoRoot, "out", "logo");
const outPath = join(outDir, "flask-3d.obj");

const params = { ...DEFAULT_PARAMS };
const { obj } = buildFlask(params, { verticalSegments: 96, azimuthSegments: 64 });

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, obj, "utf8");
console.log(`  ✓ OBJ → ${outPath}`);
