"""Prepare logo assets for the frontend (one-off utility).
- Copies Logo4.png to src/assets/logo-exauce.png (original)
- Creates a white "Exauce" variant for dark backgrounds (logo-exauce-light.png)
- Creates square favicons (original + white-on-dark)
"""
from PIL import Image
import os

SRC = os.path.join('..', 'Analyse', 'Logo4.png')
OUT = os.path.join('src', 'assets')
os.makedirs(OUT, exist_ok=True)

logo = Image.open(SRC).convert('RGBA')
logo.save(os.path.join(OUT, 'logo-exauce.png'))


def recolor_white(im):
    """Return a copy where dark pixels (the "Exauce" wordmark) become white."""
    out = im.copy()
    px = out.load()
    w, h = out.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            # achromatic (black wordmark + its anti-aliasing) -> white
            if a > 0 and max(r, g, b) - min(r, g, b) < 30 and r < 240:
                px[x, y] = (255, 255, 255, a)
    return out


white = recolor_white(logo)
white.save(os.path.join(OUT, 'logo-exauce-light.png'))

# Favicon: letter crop not reliable; simply resize the full logo onto transparent
favicon = logo.copy()
favicon.thumbnail((96, 128), Image.LANCZOS)
favicon.save(os.path.join(OUT, 'favicon.ico'), sizes=[(32, 32), (16, 16)])

print('assets written:', os.listdir(OUT))
