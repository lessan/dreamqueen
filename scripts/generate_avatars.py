#!/usr/bin/env python3
"""
Dream Queen — Bulk Avatar Generator
Generates base character models in "Modern Editorial 3D" style.

Usage:
    export GEMINI_API_KEY=your_key_here
    python3 scripts/generate_avatars.py --dry-run   # preview prompts only
    python3 scripts/generate_avatars.py             # run for real
    python3 scripts/generate_avatars.py --rpm 60    # paid tier (higher rate limit)

Outputs:
    assets/avatars/{gender}_{body}_{skin}_{hair}.png
    Re-running skips already-generated files.
"""

import os
import sys
import time
import argparse
from pathlib import Path

def _import_genai():
    try:
        from google import genai
        from google.genai import types
        return genai, types
    except ImportError:
        print("Error: google-genai not installed.")
        print("  Run: pip3 install google-genai")
        sys.exit(1)


# ── Parameter Matrix ─────────────────────────────────────────────────────────

GENDERS = {
    "female": "female character, feminine features",
    "male":   "male character, masculine features",
}

BODY_SHAPES = {
    "slim":      "slim build, lean limbs, narrow waist",
    "athletic":  "athletic build, toned muscles, broad shoulders",
    "plus":      "plus-size build, soft curves, full figure",
    "petite":    "petite build, small frame, compact proportions",
}

SKIN_TONES = {
    "deep":       "deep dark brown skin, rich ebony complexion",
    "olive":      "olive skin, warm Mediterranean complexion",
    "fair":       "fair porcelain skin, light cool complexion",
    "warmbrown":  "warm brown skin, golden-brown complexion",
}

HAIRSTYLES = {
    "braids":     "long box braids with small gold rings, polished clay hair texture",
    "undercut":   "sleek side undercut with short textured top, matte silicone hair texture",
    "longwaves":  "long flowing waves past shoulders, glossy polished clay hair texture",
    "shaved":     "close-shaved head, very short buzz cut, smooth sculpted scalp",
}


# ── Style & Pose Constants ───────────────────────────────────────────────────

# Included verbatim in every prompt to prevent style drift
STYLE_MODIFIER = (
    "Modern Editorial 3D style, high-fidelity 3D render, "
    "polished clay skin texture with subtle subsurface scattering, "
    "three-point studio lighting with soft defined shadows and polished surfaces, "
    "expressive stylized features with human-like proportions, "
    "Sims 4 and Fortnite visual quality, high-fidelity character art"
)

BASE_POSE = (
    "subtle A-pose, arms angled 5 degrees away from the body, "
    "full body visible from head to feet, front-facing, centered, "
    "solid light-grey background (#E8E8E8), "
    "1:1 square canvas, character fills 80% of frame"
)

# Modest, intentionally plain base layer — not real clothing, just a canvas.
# Nude-toned so it reads as a base mesh rather than an outfit to override.
MANNEQUIN_BASE_FEMALE = (
    "wearing a plain seamless nude-beige compression base layer: "
    "thin-strap fitted camisole and high-waist shorts, "
    "smooth matte fabric with no texture, patterns, logos, or seams, "
    "not stylish, not fashionable, serves purely as a neutral canvas "
    "for virtual clothing to be layered over digitally, "
    "no shoes, no accessories, no jewellery"
)

MANNEQUIN_BASE_MALE = (
    "wearing a plain seamless nude-beige compression base layer: "
    "fitted sleeveless undershirt and compression shorts, "
    "smooth matte fabric with no texture, patterns, logos, or seams, "
    "not stylish, not fashionable, serves purely as a neutral canvas "
    "for virtual clothing to be layered over digitally, "
    "no shoes, no accessories, no jewellery"
)

SAFETY_NOTE = (
    "safe for children, appropriate for all ages, non-sexualised, "
    "single character only, no background elements, no text, no watermarks, "
    "no additional characters"
)


# ── Prompt Builder ────────────────────────────────────────────────────────────

def build_prompt(gender_key, body_key, skin_key, hair_key):
    gender_desc = GENDERS[gender_key]
    body_desc   = BODY_SHAPES[body_key]
    skin_desc   = SKIN_TONES[skin_key]
    hair_desc   = HAIRSTYLES[hair_key]
    outfit      = MANNEQUIN_BASE_FEMALE if gender_key == "female" else MANNEQUIN_BASE_MALE

    return (
        f"[3D CHARACTER MODEL] {BASE_POSE}. "
        f"[ATTRIBUTES] {gender_desc}, {body_desc}, {skin_desc}, {hair_desc}. "
        f"[OUTFIT] {outfit}. "
        f"[STYLE MODIFIERS] {STYLE_MODIFIER}. "
        f"[CONSTRAINTS] {SAFETY_NOTE}."
    )


# ── Generation ────────────────────────────────────────────────────────────────

MODEL      = "gemini-3.1-flash-image-preview"
OUTPUT_DIR = Path(__file__).parent.parent / "assets" / "avatars"
RETRY_MAX  = 3


def generate_avatar(client, gender, body, skin, hair, dry_run=False):
    filename = f"{gender}_{body}_{skin}_{hair}.png"
    out_path  = OUTPUT_DIR / filename

    prompt = build_prompt(gender, body, skin, hair)

    if dry_run:
        print(f"  📝 {filename}")
        print(f"     {prompt}")

    if not dry_run and out_path.exists():
        print(f"  ↩  skip  {filename}")
        return "skip"
        return "ok"

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

            image_bytes = None
            for part in response.candidates[0].content.parts:
                if getattr(part, "inline_data", None):
                    image_bytes = part.inline_data.data
                    break

            if not image_bytes:
                raise ValueError("No image data in response")

            OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
            out_path.write_bytes(image_bytes)
            kb = len(image_bytes) // 1024
            print(f"  ✓  {filename}  ({kb} KB)")
            return "ok"

        except Exception as e:
            err = str(e)
            # Surface the exact error message for easier debugging
            print(f"  ✗  attempt {attempt}/{RETRY_MAX} — {filename}: {err[:200]}")

            if "RESOURCE_EXHAUSTED" in err or "429" in err:
                wait = 60
                print(f"     Rate limited — waiting {wait}s...")
                time.sleep(wait)
            elif attempt < RETRY_MAX:
                wait = 15 * attempt
                print(f"     Retrying in {wait}s...")
                time.sleep(wait)

    print(f"  ✗  FAILED  {filename} — skipping")
    return "fail"


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Bulk generate Dream Queen avatars")
    parser.add_argument("--dry-run",  action="store_true", help="Print prompts without calling API")
    parser.add_argument("--rpm",      type=int, default=10, help="Requests per minute (default: 10 for free tier)")
    parser.add_argument("--gender",   choices=list(GENDERS), help="Generate only one gender")
    parser.add_argument("--body",     choices=list(BODY_SHAPES), help="Generate only one body type")
    parser.add_argument("--skin",     choices=list(SKIN_TONES), help="Generate only one skin tone")
    parser.add_argument("--hair",     choices=list(HAIRSTYLES), help="Generate only one hairstyle")
    args = parser.parse_args()

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key and not args.dry_run:
        print("Error: GEMINI_API_KEY environment variable not set.")
        print("  export GEMINI_API_KEY=your_key_here")
        sys.exit(1)

    if not args.dry_run:
        genai, types = _import_genai()
    else:
        genai = types = None

    client = genai.Client(api_key=api_key) if (genai and api_key) else None

    # Build filtered matrix
    genders = [args.gender] if args.gender else list(GENDERS)
    bodies  = [args.body]   if args.body   else list(BODY_SHAPES)
    skins   = [args.skin]   if args.skin   else list(SKIN_TONES)
    hairs   = [args.hair]   if args.hair   else list(HAIRSTYLES)

    combos = [(g, b, s, h) for g in genders for b in bodies for s in skins for h in hairs]
    total  = len(combos)
    gap    = 60.0 / args.rpm

    print(f"Dream Queen Avatar Generator")
    print(f"Model  : {MODEL}")
    print(f"Total  : {total} avatars  ({len(genders)}g × {len(bodies)}b × {len(skins)}s × {len(hairs)}h)")
    print(f"Rate   : {args.rpm} RPM → {gap:.1f}s between requests")
    print(f"Output : {OUTPUT_DIR}")
    print(f"Mode   : {'DRY RUN — no API calls' if args.dry_run else 'LIVE'}")
    print("─" * 60)

    counts = {"ok": 0, "skip": 0, "fail": 0}
    start  = time.time()

    for i, (gender, body, skin, hair) in enumerate(combos, 1):
        print(f"[{i:3}/{total}] {gender:6} / {body:8} / {skin:10} / {hair}")
        result = generate_avatar(client, gender, body, skin, hair, dry_run=args.dry_run)
        counts[result] += 1

        if not args.dry_run and result != "skip" and i < total:
            time.sleep(gap)

    elapsed = time.time() - start
    print("─" * 60)
    print(f"Done in {elapsed:.0f}s  —  {counts['ok']} saved, {counts['skip']} skipped, {counts['fail']} failed")
    if counts["fail"]:
        print("Re-run to retry failed items (existing files are skipped automatically).")


if __name__ == "__main__":
    main()
