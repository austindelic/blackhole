#!/usr/bin/env python3
"""Retain locked Cargo dependency license texts (adapted from portfolio)."""
import argparse
import json
from pathlib import Path
import subprocess
parser = argparse.ArgumentParser()
parser.add_argument('--manifest-path', default='Cargo.toml')
args = parser.parse_args()
metadata = json.loads(subprocess.check_output(['cargo', 'metadata', '--locked', '--format-version=1', '--manifest-path', args.manifest_path]))
parts = ['# Cargo dependency notices\n\nDependencies retain their individual licenses. See NOTICE.md for shader and font provenance.\n']
for pkg in sorted(metadata['packages'], key=lambda p: (p['name'], p['version'])):
    if pkg['source'] is None:
        continue
    root = Path(pkg['manifest_path']).parent
    parts.append(f"\n## {pkg['name']} {pkg['version']}\n\nLicense: {pkg.get('license') or 'See license file'}\nAuthors from package metadata: {', '.join(pkg.get('authors', [])) or 'Not specified'}\nSource: {pkg.get('repository') or 'https://crates.io/crates/' + pkg['name']}\n")
    candidates = [p for p in root.iterdir() if p.name.upper().startswith(('LICENSE', 'LICENCE', 'COPYING', 'NOTICE'))]
    if pkg.get('license_file'):
        candidates.append(root / pkg['license_file'])
    files = sorted({f for p in candidates for f in ([p] if p.is_file() else p.rglob('*')) if f.is_file()})
    if not files:
        catalog = Path(__file__).parent / 'licenses/cargo/sources.json'
        entries = json.loads(catalog.read_text(encoding='utf-8')).get(f"{pkg['name']}-{pkg['version']}")
        if not entries:
            raise SystemExit(f"Missing dependency license text: {pkg['name']} {pkg['version']}")
        for source in entries['sources']:
            file = catalog.parent / source['file']
            parts.append(f"\n### {file.name}\n\nSource: {source['url']}\n\n```text\n{file.read_text(encoding='utf-8')}\n```\n")
        continue
    for file in files:
        parts.append(f'\n### {file.relative_to(root).as_posix()}\n\n```text\n{file.read_text(encoding="utf-8", errors="replace")}\n```\n')
Path('artifacts').mkdir(exist_ok=True)
with Path('artifacts/DEPENDENCY_NOTICES.md').open('w', encoding='utf-8', newline='\n') as output:
    output.write('\n'.join(parts))
