from PIL import Image, ImageDraw
import math

def make_icon(size):
    img = Image.new('RGBA', (size, size), (10, 10, 10, 255))
    draw = ImageDraw.Draw(img)
    cx, cy = size / 2, size / 2
    r = size * 0.28
    # circle
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(255, 255, 255, 30), width=max(2, int(size * 0.02)))
    # hands
    lw = max(2, int(size * 0.015))
    draw.line([cx, cy, cx, cy - r * 0.6], fill=(255, 255, 255, 110), width=lw)
    draw.line([cx, cy, cx + r * 0.45, cy], fill=(255, 255, 255, 110), width=lw)
    # center dot
    dot_r = max(3, size * 0.035)
    draw.ellipse([cx - dot_r, cy - dot_r, cx + dot_r, cy + dot_r], fill=(74, 222, 128, 160))
    # rounded corners via mask
    rad = int(size * 0.18)
    mask = Image.new('L', (size, size), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([0, 0, size - 1, size - 1], rad, fill=255)
    img.putalpha(mask)
    img.save(f'icon-{size}.png')

make_icon(192)
make_icon(512)
print('icons done')
