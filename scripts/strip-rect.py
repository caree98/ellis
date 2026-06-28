"""Strip the leading bounding-rectangle from the traced SVG path,
crop and scale to a clean logo viewBox."""
import re

with open(r'C:\Dev\ellis\assets\flag-traced.svg') as f:
    svg = f.read()
m = re.search(r'd="([^"]+)"', svg)
d = m.group(1)

# The path starts with: M0 189 L0 0 L214 0 L428 0 L428 189 L428 378 ...
# That's the image's bounding rectangle (6 line segments + the rectangle's
# right side at L428 378). Strip the prefix: everything up to and including
# the rectangle's bottom-right corner.

# Find the rectangle prefix. The image is 428x378. The rect is:
# M0 189  L0 0   L214 0   L428 0   L428 189  L428 378
prefix_pat = re.compile(
    r'^M\s*0\.0\s+189\.0\s+'
    r'L\s*0\.0\s+0\.0\s+'
    r'L\s*214\.0\s+0\.0\s+'
    r'L\s*428\.0\s+0\.0\s+'
    r'L\s*428\.0\s+189\.0\s+'
    r'L\s*428\.0\s+378\.0\s+',
    re.DOTALL
)
m = prefix_pat.match(d)
if not m:
    print("ERROR: leading rectangle prefix not matched.")
    print("Path start:", d[:200])
    raise SystemExit(1)
d = d[m.end():]
print(f"Stripped prefix. Path now starts with: {d[:80]}")

# The original path uses an even-odd fill: the rectangle outline plus
# the flag outline traced together. Stripping the rectangle leaves an
# invalid path that starts with L. Replace the leading L with M (the
# closing Z + the rectangle traced the rectangle in reverse direction).
if d.startswith('L'):
    d = 'M ' + d[2:].lstrip()

# Strip trailing duplicate close (if path ends with Z Z)
d = re.sub(r'(Z\s*)+$', 'Z', d.strip())

# Crop bounds: the flag actually spans x=44..377, y=19..377 in original 428x378 coords.
# The trace coords are in original (0..428, 0..378) space. Crop to that.
min_x, max_x = 44, 377
min_y, max_y = 19, 377
src_w = max_x - min_x
src_h = max_y - min_y

# Target viewBox: 50x36 — preserves aspect ratio (~0.95)
target_w, target_h = 50, 36
scale = min(target_w / src_w, target_h / src_h)
print(f"Scale: {scale:.3f}")
scaled_w = src_w * scale
scaled_h = src_h * scale
offset_x = (target_w - scaled_w) / 2
offset_y = (target_h - scaled_h) / 2

def tx(n, is_x):
    if is_x: return (n - min_x) * scale + offset_x
    return (n - min_y) * scale + offset_y

tokens = re.findall(r'[MLCZ]|-?\d+\.?\d*', d)
out = []
i = 0
while i < len(tokens):
    t = tokens[i]
    if t in 'MLCZ':
        out.append(t); i += 1
    else:
        x = float(t); y = float(tokens[i+1])
        out.append(f"{tx(x, True):.2f}")
        out.append(f"{tx(y, False):.2f}")
        i += 2

new_d = ' '.join(out)

with open(r'C:\Dev\ellis\assets\flag-cleaned.svg', 'w') as f:
    f.write(f'<?xml version="1.0"?>\n')
    f.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {target_w} {target_h}" width="{target_w}" height="{target_h}">\n')
    f.write(f'  <path d="{new_d}" fill="#F2C744" stroke="none"/>\n')
    f.write(f'</svg>\n')

print(f"Final viewBox: {target_w}x{target_h}")
print(f"Final path length: {len(new_d)} chars")
print(f"Saved flag-cleaned.svg")