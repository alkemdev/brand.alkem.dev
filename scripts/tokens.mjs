#!/usr/bin/env node
/**
 * Read src/palette/tokens.json and generate out/stylesheets/brand.css and brand.scss.
 * Run from repo root: node scripts/tokens.mjs (or via just tokens).
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const SECTIONS = ["color", "typography", "spacing", "radius", "shadow"];

function flatten(obj, prefix = "") {
  const entries = [];
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) return entries;
  for (const [key, value] of Object.entries(obj)) {
    const sanitized = key.replace(".", "_");
    const name = prefix ? `${prefix}-${sanitized}` : sanitized;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      entries.push(...flatten(value, name));
    } else {
      const str = typeof value === "string" ? value.replace(/^"|"$/g, "") : String(value);
      entries.push([name, str]);
    }
  }
  return entries;
}

function resolveRef(value, tokens) {
  let out = String(value);
  for (;;) {
    const start = out.indexOf("{");
    if (start === -1) break;
    const end = out.indexOf("}", start);
    if (end === -1) break;
    const pathStr = out.slice(start + 1, end);
    const parts = pathStr.split(".");
    let current = tokens;
    for (const part of parts) {
      current = current?.[part];
    }
    if (current == null) {
      out = out.slice(0, start) + `/* unresolved: ${pathStr} */` + out.slice(end + 1);
      continue;
    }
    const resolved =
      typeof current === "string" ? resolveRef(current, tokens) : String(current).replace(/^"|"$/g, "");
    out = out.slice(0, start) + resolved + out.slice(end + 1);
  }
  return out;
}

function generateCss(tokens) {
  const lines = [
    "/* Alkemical Development — Brand Tokens",
    " * Auto-generated from src/palette/tokens.json",
    " * Do not edit directly — run `just tokens` to regenerate",
    " */",
    "",
    ":root {",
  ];
  for (const section of SECTIONS) {
    const sect = tokens[section];
    if (!sect) continue;
    lines.push(`  /* ${section} */`);
    for (const [name, value] of flatten(sect, section)) {
      let resolved = resolveRef(value, tokens);
      // Font-family values must be valid CSS: "Font Name", fallback. If the leading quote was stripped (e.g. Ubuntu" -> fix to "Ubuntu")
      if (name.includes("family") && resolved.length > 0 && resolved.charAt(0) !== '"') {
        resolved = '"' + resolved;
      }
      lines.push(`  --brand-${name}: ${resolved};`);
    }
    lines.push("");
  }
  lines.push("  /* Short semantic aliases — use these in your CSS */");
  lines.push("  --color-primary: var(--brand-color-semantic-primary);");
  lines.push("  --color-primary-light: var(--brand-color-semantic-primary-light);");
  lines.push("  --color-primary-dark: var(--brand-color-semantic-primary-dark);");
  lines.push("  --color-secondary: var(--brand-color-semantic-secondary);");
  lines.push("  --color-accent: var(--brand-color-semantic-accent);");
  lines.push("  --color-surface: var(--brand-color-semantic-surface);");
  lines.push("  --color-surface-raised: var(--brand-color-semantic-surface-raised);");
  lines.push("  --color-text: var(--brand-color-semantic-text);");
  lines.push("  --color-text-muted: var(--brand-color-semantic-text-muted);");
  lines.push("  --color-border: var(--brand-color-semantic-border);");
  lines.push("  --font-display: var(--brand-typography-family-display);");
  lines.push("  --font-body: var(--brand-typography-family-body);");
  lines.push("  --font-mono: var(--brand-typography-family-mono);");
  for (const [short, brand] of [
    ["space-0", "spacing-0"],
    ["space-1", "spacing-1"],
    ["space-2", "spacing-2"],
    ["space-3", "spacing-3"],
    ["space-4", "spacing-4"],
    ["space-6", "spacing-6"],
    ["space-8", "spacing-8"],
    ["space-12", "spacing-12"],
  ]) {
    lines.push(`  --${short}: var(--brand-${brand});`);
  }
  lines.push("  --radius-sm: var(--brand-radius-sm);");
  lines.push("  --radius-md: var(--brand-radius-md);");
  lines.push("  --radius-lg: var(--brand-radius-lg);");
  lines.push("  --shadow-sm: var(--brand-shadow-sm);");
  lines.push("  --shadow-glow: var(--brand-shadow-glow-gold);");
  lines.push("}");
  return lines.join("\n");
}

function generateScss(tokens) {
  const lines = [
    "// Alkemical Development — Brand Tokens",
    "// Auto-generated from src/palette/tokens.json",
    "// Do not edit directly — run `just tokens` to regenerate",
    "",
  ];
  for (const section of SECTIONS) {
    const sect = tokens[section];
    if (!sect) continue;
    lines.push(`// ${section}`);
    for (const [name, value] of flatten(sect, section)) {
      const resolved = resolveRef(value, tokens);
      lines.push(`$brand-${name}: ${resolved};`);
    }
    lines.push("");
  }
  lines.push("// Convenience map for iteration");
  lines.push("$brand-colors: (");
  const semantic = tokens.color?.semantic;
  if (semantic && typeof semantic === "object") {
    for (const [name, value] of Object.entries(semantic)) {
      const resolved = resolveRef(String(value).replace(/^"|"$/g, ""), tokens);
      lines.push(`  "${name}": ${resolved},`);
    }
  }
  lines.push(");");
  return lines.join("\n");
}

const tokensPath = path.join(root, "src/palette/tokens.json");
const outDir = path.join(root, "out/stylesheets");
const content = fs.readFileSync(tokensPath, "utf8");
const tokens = JSON.parse(content);

fs.mkdirSync(outDir, { recursive: true });
const css = generateCss(tokens);
const scss = generateScss(tokens);
const cssPath = path.join(outDir, "brand.css");
const scssPath = path.join(outDir, "brand.scss");
fs.writeFileSync(cssPath, css, "utf8");
fs.writeFileSync(scssPath, scss, "utf8");
console.log("✓ Generated", cssPath);
console.log("✓ Generated", scssPath);
