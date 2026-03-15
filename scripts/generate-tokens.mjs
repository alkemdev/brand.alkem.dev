#!/usr/bin/env node

/**
 * Reads src/palette/tokens.json and generates:
 *   - out/stylesheets/brand.css  (CSS custom properties)
 *   - out/stylesheets/brand.scss (SCSS variables + map)
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const TOKENS_PATH = resolve(ROOT, "src/palette/tokens.json");
const OUT_DIR = resolve(ROOT, "out/stylesheets");

const tokens = JSON.parse(readFileSync(TOKENS_PATH, "utf-8"));

function flatten(obj, prefix = "") {
  const entries = [];
  for (const [key, value] of Object.entries(obj)) {
    const sanitized = key.replace(/\./g, "_");
    const name = prefix ? `${prefix}-${sanitized}` : sanitized;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      entries.push(...flatten(value, name));
    } else {
      entries.push([name, value]);
    }
  }
  return entries;
}

function resolveRef(value, allTokens) {
  if (typeof value !== "string") return String(value);
  return value.replace(/\{([^}]+)\}/g, (_match, path) => {
    const parts = path.split(".");
    let current = allTokens;
    for (const part of parts) {
      current = current?.[part];
    }
    if (current === undefined) return `/* unresolved: ${path} */`;
    if (typeof current === "string" && current.includes("{")) {
      return resolveRef(current, allTokens);
    }
    return String(current);
  });
}

function generateCSS(tokens) {
  const lines = [
    "/* Alkemical Development — Brand Tokens",
    " * Auto-generated from src/palette/tokens.json",
    " * Do not edit directly — run `just tokens` to regenerate",
    " */",
    "",
    ":root {",
  ];

  const sections = ["color", "typography", "spacing", "radius", "shadow"];

  for (const section of sections) {
    if (!tokens[section]) continue;

    lines.push(`  /* ${section} */`);
    const entries = flatten(tokens[section], section);

    for (const [name, value] of entries) {
      const cssName = `--brand-${name}`;
      const resolved = resolveRef(String(value), tokens);
      lines.push(`  ${cssName}: ${resolved};`);
    }
    lines.push("");
  }

  lines.push("}");
  return lines.join("\n");
}

function generateSCSS(tokens) {
  const lines = [
    "// Alkemical Development — Brand Tokens",
    "// Auto-generated from src/palette/tokens.json",
    "// Do not edit directly — run `just tokens` to regenerate",
    "",
  ];

  const sections = ["color", "typography", "spacing", "radius", "shadow"];

  for (const section of sections) {
    if (!tokens[section]) continue;

    lines.push(`// ${section}`);
    const entries = flatten(tokens[section], section);

    for (const [name, value] of entries) {
      const scssName = `$brand-${name}`;
      const resolved = resolveRef(String(value), tokens);
      lines.push(`${scssName}: ${resolved};`);
    }
    lines.push("");
  }

  lines.push("// Convenience map for iteration");
  lines.push("$brand-colors: (");

  if (tokens.color?.semantic) {
    for (const [name, value] of Object.entries(tokens.color.semantic)) {
      const resolved = resolveRef(String(value), tokens);
      lines.push(`  "${name}": ${resolved},`);
    }
  }

  lines.push(");");

  return lines.join("\n");
}

mkdirSync(OUT_DIR, { recursive: true });

const css = generateCSS(tokens);
const scss = generateSCSS(tokens);

writeFileSync(resolve(OUT_DIR, "brand.css"), css, "utf-8");
writeFileSync(resolve(OUT_DIR, "brand.scss"), scss, "utf-8");

console.log(`✓ Generated ${OUT_DIR}/brand.css`);
console.log(`✓ Generated ${OUT_DIR}/brand.scss`);
