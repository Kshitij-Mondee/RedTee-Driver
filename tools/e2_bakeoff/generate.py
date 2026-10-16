"""E2 variant C: generate the five art layers with OpenAI's image API, on Kshitij's PC (the Cowork sandbox cannot reach
the API). Paid: about $1 at high quality for five images (an estimate; the script asks before it spends).

    py tools/e2_bakeoff/generate.py            # asks once, then writes assets/vendor/e2gen/{room,priya,dev,desk,report}.png
    py tools/e2_bakeoff/generate.py --yes      # no question
    py tools/e2_bakeoff/generate.py --only dev # redo one layer

The key is read from the engine's .env (OPENAI_API_KEY) and sent only in the Authorization header; it is never printed
or written. Every prompt, the model id and the API's usage numbers go to assets/vendor/e2gen/GENERATION.json, so the
layers can be judged and reproduced. Outputs are NOT cleared for client work until the provider's terms are read.
"""
from __future__ import annotations

import argparse
import base64
import io
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from loom.agents.llm.base import env_value  # noqa: E402

OUT = ROOT / "assets" / "vendor" / "e2gen"
STYLE = ("Flat vector-style editorial illustration for a corporate training video. Warm muted palette: cream walls, walnut wood, "
         "deep teal and burnt orange accents. Soft window light from the left, subtle gradients and soft shadows, clean designed "
         "shapes, no outlines, no text, no logos. Mature and professional, like a modern explainer studio; not childish, not a cartoon.")
LAYERS = {
    "room": ("1536x1024", False, "An empty modern meeting room seen straight on: a large window on the left with a soft city skyline, a framed "
             "abstract print on the right wall, a low wooden credenza with a plant at the far right, a pendant lamp hanging in the middle. "
             "No people and no table. The lower quarter of the image is floor. Wide 16:9 composition."),
    "priya": ("1024x1536", True, "A woman in her thirties of South Asian appearance, shoulder-length dark hair, a deep teal blazer over a cream top, "
              "seated, shown from the waist up, three-quarter view facing to the RIGHT, calm and attentive, arms relaxed forward as if "
              "resting on a table just below the frame. Isolated on a transparent background; no table and no chair visible."),
    "dev": ("1024x1536", True, "A man in his thirties of South Asian appearance, short dark hair, thin dark-framed glasses, a burnt orange sweater "
            "over a collared shirt, seated, shown from the waist up, three-quarter view facing to the LEFT, thoughtful, arms relaxed forward "
            "as if resting on a table just below the frame. Isolated on a transparent background; no table and no chair visible."),
    "desk": ("1536x1024", True, "A long walnut meeting table seen from the front at eye level: the top surface as a thin band, a dark front panel "
             "below it, a closed teal notebook on the left of the top and a white mug on the right. Isolated on a transparent background."),
    "report": ("1024x1024", True, "A printed report lying flat on a table, seen at a low angle: cream paper, a teal band along the far edge, a small "
               "bar chart with one orange bar, no readable text. Isolated on a transparent background."),
}
PRICE_HIGH = {"1024x1024": 0.17, "1536x1024": 0.25, "1024x1536": 0.25}   # USD per image, an estimate (check the pricing page)


def _req(method: str, url: str, key: str, body: dict | None = None, timeout: int = 300):
    data = json.dumps(body).encode() if body is not None else None
    rq = urllib.request.Request(url, data=data, method=method, headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(rq, timeout=timeout) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", "replace")
        try:
            return e.code, json.loads(raw)
        except json.JSONDecodeError:
            return e.code, {"error": {"message": raw[:400]}}


def pick_model(key: str, want: str | None) -> str:
    if want:
        return want
    st, body = _req("GET", "https://api.openai.com/v1/models", key)
    ids = sorted((m["id"] for m in body.get("data", []) if "image" in m["id"] and m["id"].startswith("gpt-image")), reverse=True) if st == 200 else []
    return ids[0] if ids else "gpt-image-1"


def post(img, cutout: bool, name: str):
    from PIL import Image
    img = img.convert("RGBA")
    if cutout:
        bbox = img.getchannel("A").getbbox()
        if bbox:
            img = img.crop(bbox)
        if img.getchannel("A").getextrema()[0] == 255:
            print(f"  warning: {name} came back without transparency; it will show as a rectangle in the scene")
    else:
        w, h = img.size
        k = max(1920 / w, 1080 / h)
        img = img.resize((round(w * k), round(h * k)), Image.LANCZOS)
        x, y = (img.width - 1920) // 2, (img.height - 1080) // 2
        img = img.crop((x, y, x + 1920, y + 1080))
    return img


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--yes", action="store_true"); ap.add_argument("--only"); ap.add_argument("--model"); ap.add_argument("--quality", default="high")
    a = ap.parse_args()
    key = env_value("OPENAI_API_KEY")
    if not key:
        print("OPENAI_API_KEY is not set in the engine's .env"); return 2
    names = [a.only] if a.only else list(LAYERS)
    est = sum(PRICE_HIGH[LAYERS[n][0]] for n in names) if a.quality == "high" else None
    model = pick_model(key, a.model)
    print(f"model {model}, {len(names)} image(s), quality {a.quality}" + (f", about ${est:.2f} (estimate)" if est else ""))
    if not a.yes and input("generate? [y/N] ").strip().lower() != "y":
        return 1
    from PIL import Image
    OUT.mkdir(parents=True, exist_ok=True)
    logf = OUT / "GENERATION.json"
    log = json.loads(logf.read_text(encoding="utf-8")) if logf.exists() else {"layers": {}}
    for n in names:
        size, cut, what = LAYERS[n]
        prompt = STYLE + " " + what
        body = {"model": model, "prompt": prompt, "size": size, "n": 1, "quality": a.quality}
        if cut:
            body["background"] = "transparent"; body["output_format"] = "png"
        t0 = time.time()
        st, res = _req("POST", "https://api.openai.com/v1/images/generations", key, body)
        if st != 200 and cut and "background" in json.dumps(res).lower():
            body.pop("background", None); st, res = _req("POST", "https://api.openai.com/v1/images/generations", key, body)
        if st != 200:
            print(f"  {n}: HTTP {st}: {json.dumps(res)[:300]}"); return 3
        img = Image.open(io.BytesIO(base64.b64decode(res["data"][0]["b64_json"])))
        post(img, cut, n).save(OUT / f"{n}.png")
        log["layers"][n] = {"model": model, "size": size, "quality": a.quality, "transparent": cut, "prompt": prompt,
                            "usage": res.get("usage"), "seconds": round(time.time() - t0, 1), "at": time.strftime("%Y-%m-%dT%H:%M:%S")}
        print(f"  {n}: saved ({round(time.time() - t0)} s)")
    logf.write_text(json.dumps(log, indent=1), encoding="utf-8")
    print("next: py tools/e2_bakeoff/prepare_rating.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
