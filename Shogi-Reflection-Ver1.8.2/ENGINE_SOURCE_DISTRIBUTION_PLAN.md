# ENGINE_SOURCE_DISTRIBUTION_PLAN

## Current ZIP

YaneuraOu JS/WASM binary: **NOT BUNDLED**.
YaneuraOu source copy: **NOT BUNDLED**.
Therefore this current candidate ZIP does not attempt to satisfy GPL binary Corresponding Source delivery by silently embedding an incomplete source snapshot.

## If YaneuraOu WASM is bundled later

Before release, record and ship/offer a defensible Corresponding Source path including at least:

1. exact YaneuraOu source commit used;
2. any local patches, including resource/thread/memory changes;
3. exact build scripts used by this project;
4. exact Emscripten/emsdk version;
5. build command;
6. license text and required notices;
7. generated JS/WASM/worker SHA-256;
8. source availability method that remains valid for the required period;
9. review of whether app-side glue/Worker integration changes source obligations.

Do not replace this with “source is on GitHub” unless the exact conveyed source and required availability obligations have been reviewed.

**LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION** of a bundled YaneuraOu WASM package.
## Ver.1.8.2 Finalization Record

Current candidate conveys no YaneuraOu binary, so there is no binary-specific Corresponding Source payload to match in this artifact.

If a future ZIP conveys `yaneuraou.js/.wasm/.worker.js`, before public distribution it must record the exact source commit, local patches if any, build script/command, Emscripten version, output hashes, license/notice, and a tested method of providing Corresponding Source for the conveyed binary. Merely linking to a moving repository branch is not accepted as this project's reproducibility evidence.

Public/commercial bundle remains: **LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION**.
