# 生成 PWA 图标组：public/icons/*.png（与 app/icon.svg 同视觉：深空底 + 渐变四角星）
# 用法：python scripts/make-icons.py
import numpy as np
from PIL import Image, ImageDraw

OUT = "public/icons"
SIZE = 512

def star_points(cx, cy, s):
    # 近似 icon.svg 的四角星路径（二次曲线采样）
    pts = []
    segs = [((cx, cy - s), (cx + 0.1 * s, cy - 0.375 * s), (cx + 0.6875 * s, cy)),
            ((cx + 0.6875 * s, cy), (cx + 0.1 * s, cy + 0.375 * s), (cx, cy + s)),
            ((cx, cy + s), (cx - 0.1 * s, cy + 0.375 * s), (cx - 0.6875 * s, cy)),
            ((cx - 0.6875 * s, cy), (cx - 0.1 * s, cy - 0.375 * s), (cx, cy - s))]
    for p0, c, p1 in segs:
        for t in np.linspace(0, 1, 24, endpoint=False):
            x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t ** 2 * p1[0]
            y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t ** 2 * p1[1]
            pts.append((x, y))
    return pts

def gradient_canvas(size, top=(233, 236, 255), mid=(142, 162, 255), bot=(245, 217, 160)):
    """对角三色渐变图"""
    xx, yy = np.meshgrid(np.linspace(0, 1, size), np.linspace(0, 1, size))
    t = np.clip((xx + yy) / 2, 0, 1)
    arr = np.zeros((size, size, 3), dtype=np.float32)
    for k in range(3):
        arr[:, :, k] = np.where(t < 0.5,
                                top[k] + (mid[k] - top[k]) * (t / 0.5),
                                mid[k] + (bot[k] - mid[k]) * ((t - 0.5) / 0.5))
    return Image.fromarray(arr.astype(np.uint8), "RGB")

def draw_icon(size, content_scale=1.0, rounded=True):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    bg = (4, 5, 13, 255)
    if rounded:
        d.rounded_rectangle((0, 0, size - 1, size - 1), radius=int(size * 14 / 64), fill=bg)
    else:
        d.rectangle((0, 0, size, size), fill=bg)

    # 星星渐变（按内容区生成后裁切贴入）
    s = size * content_scale
    ox, oy = (size - s) / 2, (size - s) / 2
    grad = gradient_canvas(int(s))
    mask = Image.new("L", (int(s), int(s)), 0)
    md = ImageDraw.Draw(mask)
    md.polygon([(x - ox, y - oy) for x, y in star_points(s / 2, s / 2, s * 0.4)], fill=255)
    img.paste(grad, (int(ox), int(oy)), mask)

    # 点缀星
    dd = ImageDraw.Draw(img)
    dd.ellipse((size * 0.72, size * 0.19, size * 0.72 + size * 0.05, size * 0.19 + size * 0.05),
               fill=(245, 217, 160, 230))
    dd.ellipse((size * 0.23, size * 0.73, size * 0.23 + size * 0.04, size * 0.73 + size * 0.04),
               fill=(142, 162, 255, 205))
    return img

import os
os.makedirs(OUT, exist_ok=True)
draw_icon(SIZE, 1.0, rounded=True).resize((192, 192), Image.LANCZOS).save(f"{OUT}/icon-192.png")
draw_icon(SIZE, 1.0, rounded=True).save(f"{OUT}/icon-512.png")
draw_icon(SIZE, 0.78, rounded=False).save(f"{OUT}/icon-maskable-512.png")  # 全出血 + 80% 安全区
draw_icon(180, 0.9, rounded=False).save(f"{OUT}/apple-touch-icon.png")
print("icons ok:", os.listdir(OUT))
