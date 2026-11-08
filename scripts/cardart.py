"""صور كروت الأدوات: بياخد مجسّمات Microsoft Fluent Emoji (3D، رخصة MIT) ويحولها WebP 240px في public/cards.
الاستخدام: python3 scripts/cardart.py <مجلد نسخة fluentui-emoji> <ملف JSON: {اسم المجسّم: [مسار الـPNG, اسم الملف]}>
القايمة نفسها في lib/cardart.js (كل أداة ومجسّمها)."""
import json, os, sys
from PIL import Image

src, mapping = sys.argv[1], json.load(open(sys.argv[2], encoding="utf8"))
out = os.path.join(os.path.dirname(__file__), "..", "public", "cards")
os.makedirs(out, exist_ok=True)
for name, (path, file) in mapping.items():
    im = Image.open(os.path.join(src, path)).convert("RGBA")
    im.thumbnail((240, 240), Image.LANCZOS)
    im.save(os.path.join(out, file), "WEBP", quality=88, method=6)
print(len(mapping), "images")
