"""Clean the traced flag: crop to the actual flag bounds, scale to logo viewBox."""
import re

with open(r'C:\Dev\ellis\assets\flag-traced.svg') as f:
    svg = f.read()
m = re.search(r'd="([^"]+)"', svg)
d = m.group(1)

# Crop bounds derived from the actual mask analysis (where flag+pole live)
min_x, max_x = 44, 377
min_y, max_y = 19, 377
src_w = max_x - min_x
src_h = max_y - min_y
print(f"Flag bounds: x={min_x}-{max_x} (w={src_w}), y={min_y}-{max_y} (h={src_h})")

# Target viewBox: 52 wide, 36 tall (preserves roughly the original aspect)
target_w, target_h = 52, 36
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
        out.append(f"{tx(x, True):.1f}")
        out.append(f"{tx(y, False):.1f}")
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