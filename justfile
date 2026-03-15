# Alkemical Development — Brand Build System
# Run `just --list` to see all available recipes.

set dotenv-load := false

root := justfile_directory()

# Show available recipes
default:
    @just --list

# Generate CSS + SCSS from design tokens
tokens:
    node {{root}}/scripts/generate-tokens.mjs

# Export logo from Blender source (SVG + PNG at multiple sizes)
export-logo:
    blender --background {{root}}/src/logo/alkemical-logo.blend \
        --python {{root}}/scripts/export-logo.py

# Export generative 3D flask to OBJ (first-principles surface of revolution)
export-flask-3d:
    cd {{root}}/site && node scripts/export-flask-3d.mjs

# Optimize exported images (SVG via svgo, PNG → WebP)
optimize:
    bash {{root}}/scripts/optimize-images.sh

# Copy exported assets into site/public and build the Astro site
build-site:
    #!/usr/bin/env bash
    set -euo pipefail
    mkdir -p {{root}}/site/public/brand
    if [ -d "{{root}}/out" ]; then
        cp -r {{root}}/out/* {{root}}/site/public/brand/ 2>/dev/null || true
    fi
    cd {{root}}/site && npm run build

# Full pipeline: tokens → exports → optimize → site
build: tokens optimize build-site

# Start Astro dev server
dev:
    cd {{root}}/site && npm run dev

# Remove all generated files
clean:
    rm -rf {{root}}/out
    rm -rf {{root}}/site/dist
    rm -rf {{root}}/site/.astro
    rm -rf {{root}}/site/public/brand

# Install all dependencies
setup:
    cd {{root}}/site && npm install

# Check which optional tools are available
doctor:
    #!/usr/bin/env bash
    echo "Alkemical Development — Environment Check"
    echo
    check() {
        if command -v "$1" &>/dev/null; then
            echo "  ✓ $1 ($($1 --version 2>/dev/null | head -1))"
        else
            echo "  ✗ $1 — $2"
        fi
    }
    check just     "task runner (you have it if you see this)"
    check node     "required for token generation + Astro site"
    check blender  "required for logo export"
    check svgo     "optional: SVG optimization (npm i -g svgo)"
    check cwebp    "optional: WebP conversion (brew install webp)"
