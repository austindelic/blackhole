# Blackhole — third-party notices

Blackhole is distributed under GNU GPL version 3 only; see LICENSE. This applies to the combined shader-bearing application and packages, including adapted renderer code. Third-party components retain their own terms. This notice does not relicense them.

## Canonical black-hole shader

The Kerr–Newman renderer derives from baopinshui/NPGS, including BlackHole_common.glsl. Upstream license: GNU GPL version 3. Verified at commit `91305ca1661f18b60d6d33ed4616e4cd5b977b9f`:

- Source: https://github.com/baopinshui/NPGS/blob/91305ca1661f18b60d6d33ed4616e4cd5b977b9f/NPGS/Sources/Engine/Shaders/BlackHole_common.glsl
- License: https://github.com/baopinshui/NPGS/blob/91305ca1661f18b60d6d33ed4616e4cd5b977b9f/LICENSE
- Author's development article retained by the source: https://zhuanlan.zhihu.com/p/2003513260645830673

Blackhole modifications include WebGL2 multipass integration, WGSL translation, ASCII analysis and presentation, authored copper/gold emission, browser and native controls, and removal of the separately credited code-rain effect for release. Generated GLSL/WGSL and embedded shader strings retain the same provenance. Corresponding source, generation scripts and build configuration are distributed in the repository and release source archive at the same version as binaries.

The historical source credited code rain from https://www.shadertoy.com/view/4t3BWl. A redistribution grant for that fragment was not verified. Release preparation removes its rain/rune/hash helpers and replaces its negative-mass/antiverse background branch with the existing stars. The normal positive-mass background remains the existing stars. This historical attribution records the removal; it does not assert permission to redistribute the removed code.

## Departure Mono

Copyright 2022–2024 Helena Zhang (helenazhang.com). Font software uses SIL Open Font License 1.1. The upstream website's root MIT license is distinct from the font license:

https://github.com/rektdeckard/departure-mono/blob/75152a3f1e6dacdd248a6c397c97dbf27e33eea0/public/assets/LICENSE

Full font license: `release/licenses/DepartureMono-OFL-1.1.txt` in source, or the corresponding license file bundled beside font assets. Retain it with any redistributed font, including embedded font data and font-derived glyph data.

## DSEG

Copyright (c) 2020, keshikan (https://www.keshikan.net), with Reserved Font Name "DSEG". SIL Open Font License 1.1:

https://github.com/keshikan/DSEG/blob/a32644015f2c81b98bc6a80e897770780003b15e/DSEG-LICENSE.txt

Full font license: `release/licenses/DSEG-OFL-1.1.txt` in source, or the corresponding license file bundled beside font assets. The font remains OFL-licensed when bundled with this GPL application.

## Other bundled material

Dependency licenses are not replaced by the application license. Native release packages include DEPENDENCY_NOTICES.md generated from locked Cargo dependency source license files. Package managers also distribute dependency metadata and notices with JavaScript dependencies.

Portfolio-specific content, résumé, favicons and README artwork are not required Blackhole renderer assets. Do not copy them into reusable packages. The source portfolio's assets/readme/ARTWORK.md documents the generated masthead and authored SVGs; it does not supply a license for unrelated images. Audit any newly bundled media separately and retain its source notice.
