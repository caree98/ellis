"""Trace the flag PNG into an SVG path."""
from PIL import Image
import potrace
import numpy as np

img = Image.open(r'C:\Dev\ellis\assets\flag-reference.png').convert('RGBA')
w, h = img.size
print(f"Input: {w}x{h}")

# Composite onto white background
bg = Image.new('RGB', (w, h), (255, 255, 255))
bg.paste(img, mask=img.split()[3] if img.mode == 'RGBA' else None)
arr = np.array(bg)  # RGB, shape (h, w, 3)

# Binarize. Use RGB: yellow flag pixels have R > 200, G > 150, B < 200
# (mean ~217 grayscale). Anything matching = foreground (flag body).
# The pole is darker; we capture it via grayscale threshold.
gray = arr.mean(axis=2)
flag_mask = (arr[:,:,0] > 200) & (arr[:,:,1] > 150) & (arr[:,:,2] < 220)
dark_mask = arr.mean(axis=2) < 100
mask = (flag_mask | dark_mask).astype(bool)
print(f"Foreground pixels: {mask.sum()}")

bmp = potrace.Bitmap(mask)
path = bmp.trace(
    turdsize=2,           # ignore specks smaller than 2 px
    alphamax=1.0,         # corner smoothness (1.0 = corners, less smooth)
    opttolerance=0.2,
)

# Convert to SVG path data
parts = []
for curve in path:
    fm = curve.start_point
    parts.append(f"M{fm.x:.1f} {fm.y:.1f}")
    for segment in curve.segments:
        if segment.is_corner:
            parts.append(f"L{segment.c.x:.1f} {segment.c.y:.1f}")
            parts.append(f"L{segment.end_point.x:.1f} {segment.end_point.y:.1f}")
        else:
            parts.append(f"C{segment.c1.x:.1f} {segment.c1.y:.1f} {segment.c2.x:.1f} {segment.c2.y:.1f} {segment.end_point.x:.1f} {segment.end_point.y:.1f}")
    parts.append("Z")

d = " ".join(parts)
print(f"Path data length: {len(d)} chars")
print(f"Number of subpaths: {len([p for p in parts if p.startswith('M')])}")

# Save
with open(r'C:\Dev\ellis\assets\flag-traced.svg', 'w') as f:
    f.write(f'<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">\n')
    f.write(f'<path d="{d}" fill="#F2C744" stroke="none"/>\n')
    f.write('</svg>\n')
print(f"Saved flag-traced.svg ({w}x{h})")