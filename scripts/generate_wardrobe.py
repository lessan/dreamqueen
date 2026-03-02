#!/usr/bin/env python3
"""
Dream Queen — Wardrobe Asset Generator

Generates isolated clothing assets in the same "Modern Editorial 3D" style
as the base avatars. Each item is shaped to the standard A-pose and saved
as a transparent PNG ready to layer over avatars.

Usage:
    export GEMINI_API_KEY=your_key_here
    python3 scripts/generate_wardrobe.py --dry-run        # preview prompts
    python3 scripts/generate_wardrobe.py --item hoodie_red # single item
    python3 scripts/generate_wardrobe.py                   # full set

Background removal:
    Default: PIL corner flood-fill (no extra dependencies, good for coloured items)
    Better:  pip3 install rembg   → script auto-detects and uses it instead
             (recommended for white/light-coloured items like the white t-shirt)

Output: assets/wardrobe/{id}.png  (RGBA transparent PNG)
"""

import os
import sys
import time
import io
import argparse
from pathlib import Path
from collections import deque


# ── Wardrobe Matrix ───────────────────────────────────────────────────────────

# Each item:
#   id       → filename slug  (also used as --item filter)
#   name     → human label
#   category → top / bottom / outerwear / dress
#   shape    → garment silhouette description (drives A-pose geometry)
#   material → texture/fabric description (drives style quality)
#   color    → precise color description

WARDROBE = [
    # ── Tops ─────────────────────────────────────────────────────────────────
    {
        "id":       "tshirt_white",
        "name":     "White Crewneck T-Shirt",
        "category": "top",
        "shape":    "relaxed-fit short-sleeve crewneck t-shirt, "
                    "Neutral anatomical standing position, perfectly symmetrical, no tilt, no rotation",
        "material": "soft cotton jersey, smooth matte surface with subtle woven grain, "
                    "diffused soft highlights, no specular reflections, "
                    "gentle natural folds at chest and sleeve hems",
        "color":    "crisp white, with very soft cool-grey shadow folds to distinguish from background",
    },
    {
        "id":       "hoodie_red",
        "name":     "Red Pullover Hoodie",
        "category": "top",
        "shape":    "relaxed-fit pullover hoodie with drawstring hood, kangaroo front pocket, "
                    "ribbed cuffs and hem, "
                    "Neutral anatomical standing position, perfectly symmetrical, no tilt, no rotation",
        "material": "brushed fleece cotton, soft matte pillowy surface with subtle fabric grain, "
                    "diffused soft highlights, no specular, clean stylized folds at elbows and pocket",
        "color":    "vibrant cherry red (#D72638)",
    },
    {
        "id":       "jacket_black_leather",
        "name":     "Black Leather Moto Jacket",
        "category": "top",
        "shape":    "fitted moto-style jacket, zip-front closure, small lapel collar, "
                    "zippered cuffs, "
                    "Neutral anatomical standing position, perfectly symmetrical, no tilt, no rotation",
        "material": "soft-grain leather, satin finish, diffused highlights on shoulders, "
                    "stylized clean 3D folds, no high-gloss or mirror reflections, "
                    "defined panel seams, sharp clean folds at elbow and waist",
        "color":    "deep charcoal black (#1A1A1A)",
    },
    {
        "id":       "jacket_olive_bomber",
        "name":     "Olive Bomber Jacket",
        "category": "top",
        "shape":    "relaxed-fit bomber jacket, ribbed collar, cuffs, and hem, zip-front, "
                    "Neutral anatomical standing position,"
                    "perfectly symmetrical, no tilt, no rotation",
        "material": "matte nylon ripstop, diffused satin sheen, ribbed knit sections in matte contrast, "
                    "no harsh specular reflections, clean minimal folds",
        "color":    "muted olive green (#6B7A4C)",
    },
    {
        "id":       "top_pink_crop",
        "name":     "Pink Crop Top",
        "category": "top",
        "shape":    "fitted cropped short-sleeve top, hem sits at mid-torso, small round neckline, "
                    "Neutral anatomical standing position,"
                    "perfectly symmetrical, no tilt, no rotation",
        "material": "smooth ribbed cotton-jersey, fine horizontal rib texture, "
                    "diffused soft highlights, no specular, gentle stretch folds at chest",
        "color":    "soft bubblegum pink (#F4A5BE)",
    },

    # ── Bottoms ───────────────────────────────────────────────────────────────
    {
        "id":       "chinos_navy",
        "name":     "Navy Slim Chinos",
        "category": "bottom",
        "shape":    "slim straight-leg chinos, high waist, front crease, cuffed hem, "
                    "Neutral anatomical standing position, legs slightly apart,"
                    "perfectly symmetrical, no tilt, no rotation",
        "material": "smooth cotton twill, structured and clean, diffused soft highlights, "
                    "no specular reflections, minimal fabric folds at hip and cuff",
        "color":    "deep navy blue (#1B2A4A)",
    },
    {
        "id":       "jeans_distressed",
        "name":     "Distressed Denim Jeans",
        "category": "bottom",
        "shape":    "slim straight-leg jeans, mid-rise, ripped detail at one knee, "
                    "Neutral anatomical standing position, legs slightly apart,"
                    "perfectly symmetrical, no tilt, no rotation",
        "material": "mid-weight denim, stylized worn-in fade texture, "
                    "defined horizontal distress marks at knee, "
                    "diffused fabric highlights, no specular sheen, "
                    "clean warp-and-weft weave visible in surface texture",
        "color":    "faded mid-wash indigo with white frayed fibre detail",
    },
    {
        "id":       "sweatpants_grey",
        "name":     "Grey Jogger Sweatpants",
        "category": "bottom",
        "shape":    "relaxed jogger sweatpants, elastic waistband, tapered leg, ribbed ankle cuffs, "
                    "Neutral anatomical standing position, legs slightly apart,"
                    "perfectly symmetrical, no tilt, no rotation",
        "material": "heavyweight fleece jersey, soft matte surface with slight fabric pile, "
                    "diffused highlights, no specular, gentle drape folds at hip",
        "color":    "heather grey (#A8A8A8) with subtle marled texture",
    },
    {
        "id":       "skirt_pink_pleated",
        "name":     "Pink Pleated Mini Skirt",
        "category": "bottom",
        "shape":    "high-waist pleated mini skirt, flared hem sitting mid-thigh, "
                    "neat accordion pleats around circumference, "
                    "Neutral anatomical standing position, perfectly symmetrical,no tilt, no rotation",
        "material": "lightweight chiffon-like fabric, soft and flowy pleats with delicate drape, "
                    "diffused satin sheen on pleat ridges, no harsh specular",
        "color":    "soft blush pink (#F5C6D0)",
    },

    # ── Dresses ───────────────────────────────────────────────────────────────
    {
        "id":       "dress_floral_sundress",
        "name":     "Floral Sundress",
        "category": "dress",
        "shape":    "sleeveless A-line sundress, sweetheart neckline, "
                    "knee length with slightly flared skirt, fitted bodice, "
                    "Neutral anatomical standing position, perfectly symmetrical,no tilt, no rotation",
        "material": "soft lightweight cotton, gentle body drape, diffused matte surface, "
                    "clean modern floral print with bold graphic blooms, "
                    "no wrinkle texture, flat crisp print, no specular reflections",
        "color":    "white base with large colorful floral pattern in pink, coral, and green",
    },

    # ── Outerwear ─────────────────────────────────────────────────────────────
    {
        "id":       "coat_camel_trench",
        "name":     "Camel Trench Coat",
        "category": "outerwear",
        "shape":    "double-breasted trench coat, knee length, belted waist, wide lapel collar, "
                    "Neutral anatomical standing position,"
                    "perfectly symmetrical, no tilt, no rotation",
        "material": "structured gabardine cotton, clean crisp matte surface, "
                    "diffused highlights, no specular reflections, "
                    "sharp tailored folds at lapel, belt, and sleeve crease",
        "color":    "warm camel (#C19A6B) with slightly darker shadow folds",
    },
]


# ── Prompt Constants ──────────────────────────────────────────────────────────

# Shared style modifier — identical to avatar generation to ensure matching aesthetics
STYLE_MODIFIER = (
    "Modern Editorial 3D style, high-fidelity 3D render, "
    "front-facing orthographic view, no perspective distortion, "
    "polished clean material rendering, stylized-but-defined fabric texture, "
    "three-point studio lighting with soft diffused highlights, "
    "no harsh specular reflections, Sims 4 and Fortnite visual quality"
)

# The key isolation/geometry constraint
GHOST_MANNEQUIN = (
    "invisible ghost mannequin technique: garment holds a Neutral anatomical standing position, "
    "perfectly symmetrical, front-on view, no tilt, no rotation, "
    "only the garment itself floating upright"
)

# White background for easy masking
BACKGROUND = (
    "pure white background #FFFFFF, fully isolated garment, "
    "no shadows on background, no floor, no surface"
)

TECHNICAL = (
    "1:1 square canvas, garment centered and fills 75% of frame, "
    "single item only, no accessories, no text, no labels, no watermarks"
)


def build_prompt(item):
    return (
        f"[CLOTHING ASSET] {item['shape']}. "
        f"[MATERIAL] {item['material']}. "
        f"[COLOR] {item['color']}. "
        f"[POSE GEOMETRY] {GHOST_MANNEQUIN}. "
        f"[BACKGROUND] {BACKGROUND}. "
        f"[STYLE] {STYLE_MODIFIER}. "
        f"[TECHNICAL] {TECHNICAL}."
    )


# ── Background Removal ────────────────────────────────────────────────────────

def _remove_bg_rembg(img_bytes):
    """AI-based removal via rembg — best quality, handles white items."""
    from rembg import remove
    return remove(img_bytes)


def _remove_bg_pil(img_bytes, threshold=245):
    """
    Corner flood-fill background removal using PIL only.
    Seeds from all 4 corners and removes connected near-white pixels.
    Works well for coloured items; may leave halos on white/light items.
    """
    from PIL import Image

    img = Image.open(io.BytesIO(img_bytes)).convert("RGBA")
    data = img.load()
    w, h = img.size

    visited = set()
    queue = deque([(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)])
    for pt in queue:
        visited.add(pt)

    while queue:
        x, y = queue.popleft()
        r, g, b, a = data[x, y]
        if r >= threshold and g >= threshold and b >= threshold:
            data[x, y] = (255, 255, 255, 0)
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in visited:
                    visited.add((nx, ny))
                    queue.append((nx, ny))

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def remove_background(img_bytes, use_rembg=None):
    """
    Remove background from image bytes. Returns RGBA PNG bytes.
    use_rembg=None  → auto-detect (prefer rembg if installed)
    use_rembg=True  → force rembg (error if not installed)
    use_rembg=False → force PIL flood-fill
    """
    if use_rembg is None:
        try:
            import rembg  # noqa: F401
            use_rembg = True
        except ImportError:
            use_rembg = False

    if use_rembg:
        return _remove_bg_rembg(img_bytes)
    else:
        return _remove_bg_pil(img_bytes)


# ── Generation ────────────────────────────────────────────────────────────────

MODEL      = "gemini-3.1-flash-image-preview"
OUTPUT_DIR = Path(__file__).parent.parent / "assets" / "wardrobe"
RETRY_MAX  = 3


def generate_item(client, item, dry_run=False, skip_bg_removal=False):
    filename = f"{item['id']}.png"
    out_path  = OUTPUT_DIR / filename

    prompt = build_prompt(item)

    if dry_run:
        print(f"  📝 {item['id']}  [{item['category']}]  {item['name']}")
        print(f"     {prompt}")
        return "ok"

    if out_path.exists():
        print(f"  ↩  skip  {filename}")
        return "skip"

    for attempt in range(1, RETRY_MAX + 1):
        try:
            from google.genai import types as _types

            response = client.models.generate_content(
                model=MODEL,
                contents=prompt,
                config=_types.GenerateContentConfig(
                    response_modalities=["IMAGE"],
                ),
            )

            img_bytes = None
            for part in response.candidates[0].content.parts:
                if getattr(part, "inline_data", None):
                    img_bytes = part.inline_data.data
                    break

            if not img_bytes:
                raise ValueError("No image data in response")

            # Remove background
            if not skip_bg_removal:
                try:
                    img_bytes = remove_background(img_bytes)
                    bg_note = "(bg removed)"
                except Exception as e:
                    print(f"     ⚠  bg removal failed: {e} — saving with white bg")
                    bg_note = "(white bg)"
            else:
                bg_note = "(white bg, removal skipped)"

            OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
            out_path.write_bytes(img_bytes)
            kb = len(img_bytes) // 1024
            print(f"  ✓  {filename}  {bg_note}  ({kb} KB)")
            return "ok"

        except Exception as e:
            err = str(e)
            print(f"  ✗  attempt {attempt}/{RETRY_MAX} — {filename}: {err[:200]}")

            if "RESOURCE_EXHAUSTED" in err or "429" in err:
                print(f"     Rate limited — waiting 60s...")
                time.sleep(60)
            elif attempt < RETRY_MAX:
                wait = 15 * attempt
                print(f"     Retrying in {wait}s...")
                time.sleep(wait)

    print(f"  ✗  FAILED  {filename} — skipping")
    return "fail"


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Generate Dream Queen wardrobe assets")
    parser.add_argument("--dry-run",       action="store_true", help="Print prompts without calling API")
    parser.add_argument("--rpm",           type=int, default=10, help="Requests per minute (default: 10)")
    parser.add_argument("--item",          help="Generate only one item by id (e.g. hoodie_red)")
    parser.add_argument("--no-bg-removal", action="store_true", help="Skip background removal, keep white bg")
    parser.add_argument("--rembg",         action="store_true", help="Force rembg for background removal")
    args = parser.parse_args()

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key and not args.dry_run:
        print("Error: GEMINI_API_KEY environment variable not set.")
        print("  export GEMINI_API_KEY=your_key_here")
        sys.exit(1)

    client = None
    if not args.dry_run:
        try:
            from google import genai
        except ImportError:
            print("Error: google-genai not installed.  Run: pip3 install google-genai")
            sys.exit(1)
        client = genai.Client(api_key=api_key)

    items = WARDROBE
    if args.item:
        items = [i for i in WARDROBE if i["id"] == args.item]
        if not items:
            print(f"Error: item '{args.item}' not found.")
            print("Available ids:", ", ".join(i["id"] for i in WARDROBE))
            sys.exit(1)

    total = len(items)
    gap   = 60.0 / args.rpm

    # Check bg removal method
    if not args.dry_run and not args.no_bg_removal:
        try:
            import rembg  # noqa: F401
            bg_method = "rembg (AI)"
        except ImportError:
            bg_method = "PIL flood-fill  (install rembg for better quality on light items)"
    else:
        bg_method = "disabled" if args.no_bg_removal else "n/a"

    print(f"Dream Queen Wardrobe Generator")
    print(f"Model     : {MODEL}")
    print(f"Items     : {total}")
    print(f"Rate      : {args.rpm} RPM → {gap:.1f}s between requests")
    print(f"Output    : {OUTPUT_DIR}")
    print(f"BG removal: {bg_method}")
    print(f"Mode      : {'DRY RUN — no API calls' if args.dry_run else 'LIVE'}")
    print("─" * 60)

    counts = {"ok": 0, "skip": 0, "fail": 0}
    start  = time.time()

    for i, item in enumerate(items, 1):
        print(f"[{i:2}/{total}] {item['id']}")
        result = generate_item(
            client, item,
            dry_run=args.dry_run,
            skip_bg_removal=args.no_bg_removal,
        )
        counts[result] += 1

        if not args.dry_run and result != "skip" and i < total:
            time.sleep(gap)

    elapsed = time.time() - start
    print("─" * 60)
    print(f"Done in {elapsed:.0f}s  —  {counts['ok']} saved, {counts['skip']} skipped, {counts['fail']} failed")
    if counts["fail"]:
        print("Re-run to retry failed items (existing files are skipped).")


if __name__ == "__main__":
    main()
