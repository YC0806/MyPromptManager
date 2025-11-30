#!/usr/bin/env python3
"""
Generate browser extension icons from the source SVG file.
Converts icon.svg to PNG files at various sizes needed for browser extensions.
"""

from PIL import Image
import io
import os
import sys
import platform

# Set up library path for macOS if needed
if platform.system() == 'Darwin':
    lib_path = '/opt/homebrew/lib'
    if os.path.exists(lib_path):
        os.environ['DYLD_LIBRARY_PATH'] = f"{lib_path}:{os.environ.get('DYLD_LIBRARY_PATH', '')}"

# Import cairosvg after setting library path
try:
    import cairosvg
except OSError as e:
    if 'cairo' in str(e).lower():
        print("❌ Error: Cairo library not found.")
        print("\nPlease install Cairo:")
        if platform.system() == 'Darwin':
            print("  brew install cairo")
        elif platform.system() == 'Linux':
            print("  sudo apt-get install libcairo2  # Ubuntu/Debian")
            print("  sudo yum install cairo          # RHEL/CentOS")
        else:
            print("  Please install Cairo for your system")
        sys.exit(1)
    raise

def generate_icon_from_svg(svg_path, size, output_path):
    """Generate a PNG icon of the specified size from SVG."""
    # Convert SVG to PNG bytes at the target size
    png_bytes = cairosvg.svg2png(
        url=svg_path,
        output_width=size,
        output_height=size
    )

    # Open the PNG with PIL and save it
    img = Image.open(io.BytesIO(png_bytes))
    img.save(output_path, 'PNG')
    print(f"Generated: {output_path} ({size}x{size})")

def main():
    """Generate all required icon sizes from SVG."""
    # Icon sizes required by Chrome extension manifest
    sizes = [16, 32, 48, 128]

    # Get the script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    icons_dir = os.path.join(script_dir, 'icons')
    svg_path = os.path.join(icons_dir, 'icon.svg')

    # Check if SVG source file exists
    if not os.path.exists(svg_path):
        print(f"❌ Error: Source SVG file not found at {svg_path}")
        return

    # Create icons directory if it doesn't exist
    os.makedirs(icons_dir, exist_ok=True)

    # Generate each size from SVG
    for size in sizes:
        output_path = os.path.join(icons_dir, f'icon{size}.png')
        generate_icon_from_svg(svg_path, size, output_path)

    print("\n✅ All icons generated successfully from icon.svg!")
    print("Icons match the web version design: teal-emerald gradient with Layers icon")

if __name__ == '__main__':
    main()
