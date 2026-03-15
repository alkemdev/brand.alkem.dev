#!/usr/bin/env python3
"""
Blender headless export script for the Alkemical Development logo.

Usage (via justfile):
    blender --background src/logo/alkemical-logo.blend --python scripts/export-logo.py

Exports:
    out/logo/svg/alkemical-logo.svg
    out/logo/png/alkemical-logo-{size}.png  (64, 128, 256, 512, 1024)

Requires Blender 3.0+ with Freestyle SVG export enabled.
"""

import os
import sys

SIZES = [64, 128, 256, 512, 1024]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_SVG = os.path.join(ROOT, "out", "logo", "svg")
OUT_PNG = os.path.join(ROOT, "out", "logo", "png")

try:
    import bpy
except ImportError:
    print("ERROR: This script must be run inside Blender.")
    print(
        "  blender --background src/logo/alkemical-logo.blend --python scripts/export-logo.py"
    )
    sys.exit(1)


def ensure_dirs():
    os.makedirs(OUT_SVG, exist_ok=True)
    os.makedirs(OUT_PNG, exist_ok=True)


def export_png(size):
    """Render the current scene to PNG at the given square size."""
    scene = bpy.context.scene
    scene.render.resolution_x = size
    scene.render.resolution_y = size
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.compression = 15
    scene.render.film_transparent = True

    output_path = os.path.join(OUT_PNG, f"alkemical-logo-{size}.png")
    scene.render.filepath = output_path

    bpy.ops.render.render(write_still=True)
    print(f"  ✓ PNG {size}x{size} → {output_path}")


def export_svg():
    """
    Export SVG via Freestyle.

    This is a basic approach — for complex logos, you may want to
    configure Freestyle line sets in the .blend file itself.
    """
    scene = bpy.context.scene
    scene.render.use_freestyle = True
    scene.svg_export.use_svg_export = True

    output_path = os.path.join(OUT_SVG, "alkemical-logo.svg")
    scene.render.filepath = output_path

    bpy.ops.render.render(write_still=True)
    print(f"  ✓ SVG → {output_path}")


def main():
    ensure_dirs()

    print("Alkemical Development — Logo Export")
    print(f"  Blender: {bpy.app.version_string}")
    print(f"  File:    {bpy.data.filepath}")
    print()

    print("Exporting PNG variants...")
    for size in SIZES:
        export_png(size)

    print()
    print("Exporting SVG...")
    try:
        export_svg()
    except Exception as e:
        print(f"  ⚠ SVG export failed (Freestyle may need setup): {e}")
        print("  Skipping SVG — configure Freestyle in the .blend file.")

    print()
    print("Done.")


if __name__ == "__main__":
    main()
