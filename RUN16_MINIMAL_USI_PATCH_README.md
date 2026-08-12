# Shogi Reflection Ver.1.8.3 — Run #16 Minimal USI Harness Fix

Run #15 produced the first successful Real Browser USI handshake:

- `usiok`: PASS
- `readyok`: PASS
- crossOriginIsolated: true
- SharedArrayBuffer: available
- Browser page errors: none

The GitHub Actions job was red only because the Node probe used CommonJS
`require()` from a `.js` file inside an application package that declares
`"type": "module"`.

Run #16 does not change YaneuraOu, the candidate thread patch, MATERIAL,
Emscripten, or the Browser harness.

It only:

1. renames the Node probe to `minimal_node_usi_probe.cjs`;
2. creates a byte-identical `yaneuraou.material.cjs` copy for the Node-only
   probe while keeping `yaneuraou.material.js` unchanged for browsers;
3. updates the minimal workflow to execute/check the `.cjs` probe.

The Run #15 artifact was replayed locally with exactly this loading approach.
The Node harness then returned:

- `usiok`: PASS
- `readyok`: PASS

Run #16 remains NOT FORMAL. Its purpose is only to obtain a clean green
minimal Real USI gate in both Node and Chromium before reconnecting the engine
to the Shogi Reflection application stack.
