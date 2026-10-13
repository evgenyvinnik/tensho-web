#!/usr/bin/env python3
"""Rebuild runtime copies from preserved PNG masters, verified by source SHA-256.
Requires Pillow. Usage: python scripts/prepare-generated-art.py /path/to/extracted/masters
No network access, image generation, or vector input is used.
"""
import hashlib
import json
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
manifest_path = ROOT / 'docs/generated-art-manifest.json'
manifest = json.loads(manifest_path.read_text())
masters = Path(sys.argv[1]).resolve()
needed = {item['sourceSha256'] for item in manifest['assets']}
found = {}
for path in masters.rglob('*.png'):
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    if digest in needed:
        found[digest] = path
missing = needed - found.keys()
if missing:
    raise SystemExit(f'Missing {len(missing)} original PNG master hashes; no files written.')

for item in manifest['assets']:
    image = Image.open(found[item['sourceSha256']]).convert('RGBA')
    image.thumbnail((item['maxDimension'], item['maxDimension']), Image.Resampling.LANCZOS)
    output = ROOT / 'public' / item['path']
    output.parent.mkdir(parents=True, exist_ok=True)
    if item['category'] == 'controls':
        image.quantize(colors=item['paletteColors'], method=Image.Quantize.FASTOCTREE).save(output, optimize=True)
    else:
        image.save(output, 'WEBP', quality=item['quality'], method=6)
    item['deliverySha256'] = hashlib.sha256(output.read_bytes()).hexdigest()
    item['bytes'] = output.stat().st_size
    item['width'], item['height'] = image.size
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
print(f"Prepared {len(manifest['assets'])} verified runtime images. Run build and asset tests after regeneration.")
