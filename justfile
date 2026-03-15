set dotenv-load := false
root := justfile_directory()

default:
    @just --list

tokens:
    node {{root}}/scripts/tokens.mjs

build-flask:
    cd {{root}}/crates/flaskgen/demo && dx build --platform web --release
    mkdir -p {{root}}/site/public/tools/flask
    cp -r {{root}}/target/dx/flaskgen-demo/release/web/public/* {{root}}/site/public/tools/flask/

build-site: build-flask
build-site:
    #!/usr/bin/env bash
    set -euo pipefail
    mkdir -p {{root}}/site/public/brand
    [ -d "{{root}}/out" ] && cp -r {{root}}/out/* {{root}}/site/public/brand/ 2>/dev/null || true
    cd {{root}}/site && npm run build

build: tokens build-site

dev:
    cd {{root}}/site && npm run dev

dev-flask:
    cd {{root}}/crates/flaskgen/demo && dx serve --platform web

clean:
    rm -rf {{root}}/out {{root}}/site/dist {{root}}/site/.astro {{root}}/site/public/brand {{root}}/site/public/tools

setup:
    cd {{root}}/site && npm install
