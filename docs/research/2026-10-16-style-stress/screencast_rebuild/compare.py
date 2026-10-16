"""Side by side: the screenshot, the shell in the pack's own look (before), the shell themed from the screenshot (after).
    py docs/research/2026-10-16-style-stress/screencast_rebuild/compare.py  ->  screencast_rebuild/compare.jpg"""
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
R = HERE.parent
shots = [("the screenshot (tallyroom.png)", HERE / "tallyroom.png"),
         ("before: the pack's own look", R / "out_screencast_rebuild_default/frames/screencast_rebuild_default__screencast__03.00.png"),
         ("after: themed and laid out from the screenshot", R / "out_screencast_rebuild/frames/screencast_rebuild__screencast__03.00.png")]
W, H, pad, lab = 960, 540, 16, 34
out = Image.new("RGB", (3 * W + 4 * pad, H + lab + 2 * pad), (24, 24, 28))
d = ImageDraw.Draw(out)
for i, (name, p) in enumerate(shots):
    im = Image.open(p).convert("RGB")
    im.thumbnail((W, H))
    x = pad + i * (W + pad)
    out.paste(im, (x + (W - im.width) // 2, pad + lab + (H - im.height) // 2))
    d.text((x, pad + 6), name, fill=(235, 235, 235))
out.save(HERE / "compare.jpg", quality=90)
print(HERE / "compare.jpg")
