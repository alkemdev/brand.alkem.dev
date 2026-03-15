#!/usr/bin/env bash
# Cloudflare Pages build script
# Build command: bash build.sh
# Output directory: site/dist
set -euo pipefail

# Install Rust wasm32 target
rustup target add wasm32-unknown-unknown

# Install Dioxus CLI
cargo install dioxus-cli --locked

# Generate tokens
node scripts/tokens.mjs

# Build flask WASM (release)
cd crates/flaskgen/demo
dx build --platform web --release
cd ../../..

# Copy WASM into site/public
mkdir -p site/public/tools/flask
cp -r target/dx/flaskgen-demo/release/web/public/* site/public/tools/flask/

# Copy brand tokens into site/public
mkdir -p site/public/brand
cp -r out/* site/public/brand/ 2>/dev/null || true

# Build Astro site (skip prebuild since we already built flask)
cd site
npm ci
npm run build --ignore-scripts
