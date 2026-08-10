# ENGINE_LICENSE_AUDIT — Ver.1.8.3

Date: 2026-08-10
Status: engineering license/provenance audit; **not legal advice**

## Component separation: YaneuraOu Source / WASM Build / Evaluation / Emscripten

## Mandatory rule

Build success and distribution permission are separate. No component is accepted for public/commercial bundling merely because it compiles or runs.

| Component | Version / Commit | Source | Copyright | License | Commercial Use | Modification | Redistribution / Bundling | Source Disclosure / Notice | Patent / Trademark / Unknown | Adoption Decision | Reason |
|---|---|---|---|---|---|---|---|---|---|---|---|
| YaneuraOu Source | V9.00 / `a5ee278...` | official GitHub repo | upstream project/contributors; exact per-file ownership not exhaustively audited | upstream README says project follows GPLv3 because of Stockfish-derived/reference portions | GPL does not mean “sale prohibited”; compliance still required | GPL terms apply; Ver.1.8.3 build forbids local source modifications | potential binary/source redistribution subject to GPL obligations | exact source, license, modifications and corresponding-source method required | patent independently unreviewed; naming must not imply endorsement | BUILD SOURCE ADOPTED | exact official commit; no external weight |
| YaneuraOu WASM | generated from above | Build Bridge output | derivative binary provenance tied to above | GPL obligations expected to remain relevant; generated-runtime notices also need review | not categorically prohibited | generated build only in 1.8.3 | **NOT PRESENT IN CURRENT ZIP**; future public bundle requires gate | matching Corresponding Source + notices required | work-boundary legal characterization unresolved | NOT YET DISTRIBUTION-APPROVED | no Real build in current sandbox |
| MATERIAL evaluation | MATERIAL_LEVEL=1 in same source | pinned Makefile/source | part of upstream source | treated with YaneuraOu source license | subject to same compliance analysis | no separate weight modification | no separate external model file | covered by exact source evidence | no separate model-rights claim made | ADOPTED | removes third-party NNUE/水匠 weight layer |
| Emscripten compiler/runtime | target 4.0.15; release mapping `b412...` | official emsdk/Emscripten | Emscripten authors | MIT OR University of Illinois/NCSA; bundled subcomponents may have their own notices | permissive licenses generally allow commercial use subject to terms | toolchain may be used/modified under licenses | toolchain not bundled in app; generated JS/runtime must retain applicable notices | inspect generated output and SDK license/third-party notices before binary distribution | patent not independently cleared | BUILD TOOL ADOPTED | official supported emsdk path, fixed version |
| generated JS glue | actual file determined after build | Emscripten output + YaneuraOu link | mixed/generated provenance | requires post-build notice audit; do not assume “no license because generated” | unresolved until generated artifact reviewed | generated | NOT PRESENT CURRENTLY | preserve applicable Emscripten/upstream notices | UNKNOWN until actual output audit | CONDITIONAL | hash and inspect after build |
| separate generated pthread Worker | none under pinned Emscripten 4.0.15 (`MAIN_JS_SELF_WORKER`) | Emscripten runtime packaging | N/A as standalone file | pthread code remains in generated JS and must be audited there | conditional | generated-in-JS | NOT A SEPARATE FILE | notice/source association applies to generated JS | legal separation from app is NOT assumed | CONDITIONAL | Absence of a separate file does not change license characterization |
| emsdk installer | installer HEAD recorded at CI run; SDK target fixed 4.0.15 | official emsdk repo | upstream contributors | inspect official repo license at build time; installer not app runtime | build-time only | none planned | not bundled in app | record commit/version | no product runtime adoption | BUILD-TIME ONLY | provenance recorded |
| Node.js | measured on runner after emsdk activation | official Node project / runner | Node.js contributors | main Node license is MIT with separately licensed dependencies | build-time use | none planned | not bundled in app | version recorded; dependency notices only if actually conveyed | build-time component | BUILD-TIME ONLY | used by Emscripten/metadata tooling |
| Python | measured on runner | Python project / hosted runner | Python contributors / PSF | PSF License Version 2 plus incorporated components | build-time use | none planned | not bundled in app | version recorded | build-time component | BUILD-TIME ONLY | emsdk driver / scripts |
| GitHub Actions runner / image | exact run image recorded | GitHub hosted runner service / runner-images | GitHub and image package owners | service + each preinstalled tool has its own terms; runner image is not redistributed by this app | build service use | none | not bundled | record image identifiers and SBOM/log link where available | not an app runtime component | BUILD HOST ADOPTED | hosted images update, therefore provenance is recorded |
| actions/checkout | v4.2.2 | official `actions/checkout` | GitHub | official action license must be retained per its repo; action not bundled in app | CI use | none | no app bundling | workflow pin recorded | build-only | ADOPTED | stable CI checkout |
| actions/upload-artifact | v4.6.2 | official `actions/upload-artifact` | GitHub | official action license applies; action not bundled in app | CI use | none | no app bundling | workflow pin recorded | build-only | ADOPTED | artifact preservation |
| Docker image | none | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | NOT ADOPTED | avoids needless extra dependency/digest layer in this version |
| ReflectionLocalEngine | first-party | this repository | application project | existing Application LICENSE | follows app license | first-party | bundled | existing notice | none introduced here | KEEP | explicit graceful fallback |
| NNUE / 水匠 weights | none | N/A | asset-specific | UNKNOWN until separately audited | UNKNOWN | UNKNOWN | NOT BUNDLED | separate rights gate required | weight rights/patent/terms UNKNOWN | NOT ADOPTED | outside current Real Integration goal |

## YaneuraOu GPL fact

The pinned upstream README states that the project follows GPLv3 because it contains substantial Stockfish-derived portions and references other GPLv3 projects. This audit therefore never uses the false shortcuts “GPL = cannot sell”, “free distribution = automatically compliant”, or “WASM/Worker = GPL irrelevant”.

## Emscripten fact

Official Emscripten documentation states Emscripten is offered under MIT and University of Illinois/NCSA licenses. The license text also identifies incorporated code with additional licenses. Generated JS/runtime must therefore be audited from the actual fixed build rather than described as rights-free output.

## Distribution readiness

### Personal Use Readiness

- Existing app + ReflectionLocal fallback: **READY** under existing project rules.
- Real YaneuraOu in this Ver.1.8.3 package: **NOT AVAILABLE**, because no Real assets were built in this sandbox.
- After a successful CI build and hash/Real runtime verification, personal testing may proceed; that does not automatically approve public redistribution.

### Public Distribution Readiness

- Current NOT-FORMAL package without YaneuraOu binary: Engine binary GPL conveyance is not occurring here.
- Future package bundling YaneuraOu WASM: **NOT READY** until actual generated-output notice audit, Corresponding Source delivery decision, and legal boundary review are complete.

**LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION**

### Commercial Distribution Readiness

- Real YaneuraOu bundle: **NOT READY**.
- “Commercial use” is not rejected merely because GPL is involved; the unresolved issue is satisfying all applicable obligations and deciding the combined-distribution architecture.

**LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION**

## Existing Application LICENSE

The existing `LICENSE` file is intentionally unchanged. This audit does not silently relicense the application. If future legal review concludes the distribution architecture requires a change, document reason, legal basis, impact and alternatives before editing it.

## Primary sources rechecked

- pinned YaneuraOu README license statement;
- pinned YaneuraOu Makefile and wasm_pre.js;
- official Emscripten license and installation documentation;
- official emsdk release registry;
- official Node.js LICENSE;
- official Python license documentation;
- official GitHub-hosted runner documentation.
