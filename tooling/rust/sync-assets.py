#!/usr/bin/env python3
"""Copy canonical assets into the publishable crate; --check detects drift (stdlib only)."""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / 'crates/renderer/assets'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--check', action='store_true')
parser.add_argument('--source-root', type=Path, default=ROOT, help='Alternate checkout containing canonical assets')
args = parser.parse_args()
SOURCE = args.source_root.resolve()
names = ['buffer-a.wgsl', 'buffer-b.wgsl', 'buffer-c.wgsl', 'buffer-d.wgsl', 'image.wgsl', 'ascii-analysis.wgsl', 'uniform-layout.json']
mappings = [(SOURCE / 'packages/blackhole/shaders/webgpu' / name, ASSETS / name) for name in names]
mappings.append((SOURCE / 'packages/blackhole/routes.json', ASSETS / 'routes.json'))
manifest = {}
stale = []
for source, target in mappings:
    data = source.read_bytes()
    manifest[source.relative_to(SOURCE).as_posix()] = hashlib.sha256(data).hexdigest()
    if args.check:
        if not target.exists() or target.read_bytes() != data:
            stale.append(str(target.relative_to(ROOT)))
    else:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
# This calibrated table is authored outside the canonical shader directory.
manifest['crates/renderer/assets/glyph-metrics.json'] = hashlib.sha256((ASSETS / 'glyph-metrics.json').read_bytes()).hexdigest()
path = ASSETS / 'manifest.json'
expected = json.dumps(manifest, indent=2, sort_keys=True) + '\n'
if args.check:
    if not path.exists() or path.read_text() != expected:
        stale.append(str(path.relative_to(ROOT)))
else:
    path.write_text(expected)
if stale:
    raise SystemExit('Stale Rust assets; run python3 tooling/rust/sync-assets.py:\n' + '\n'.join(stale))
print('Rust assets match canonical sources.' if args.check else 'Synced Rust assets.')
