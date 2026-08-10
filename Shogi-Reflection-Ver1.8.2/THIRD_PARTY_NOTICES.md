# THIRD_PARTY_NOTICES — Ver.1.8 Candidate

## Bundled third-party executable/model assets

**NOT BUNDLED:** YaneuraOu executable / JS glue / WASM / pthread worker / NNUE / 水匠 weight.

The repository contains integration code and metadata that can connect to a future verified official-source YaneuraOu WASM build, but `engine/yaneuraou/engine-manifest.json` is `available:false` until such a build exists and is hashed.

## Referenced build components

### YaneuraOu
- Project: YaneuraOu
- Source: https://github.com/yaneurao/YaneuraOu
- Selected integration baseline: V9.00, commit `a5ee2786c0030edc7d4a1cdfe94b04dffec55493`
- License: GPLv3 per official project README
- Bundled in this ZIP: **NO**

### Emscripten
- Project: Emscripten / emsdk
- Source: https://emscripten.org/ and https://github.com/emscripten-core/emsdk
- License: MIT + University of Illinois/NCSA per official Emscripten documentation
- Bundled in this ZIP: **NO**

## Future update rule

If any third-party binary/model is later added, this file must be regenerated from the actual final ZIP inventory. A reference in documentation is not equivalent to bundling.
## Ver.1.8.2 Finalization Record

### YaneuraOu
Status in this artifact: **NOT BUNDLED as executable JS/WASM binary**. Integration code names the component and pins V9.00/commit for future official-source build. YaneuraOu project license is GPLv3 per official project documentation.

### Emscripten
Status in this artifact: **NOT BUNDLED as SDK/toolchain**. Planned build tool version is 4.0.15. Official Emscripten project documents MIT + University of Illinois/NCSA licensing.

### NNUE / Suisho
Status: **NOT BUNDLED**.
