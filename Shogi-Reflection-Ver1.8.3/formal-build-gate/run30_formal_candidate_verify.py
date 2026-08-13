from __future__ import annotations
import json, hashlib
from pathlib import Path

APP = Path(__file__).resolve().parent.parent
GATE = Path(__file__).resolve().parent
OUT_JSON = GATE / "RUN30_FORMAL_BUILD_CANDIDATE_RESULT.json"
OUT_MD = GATE / "RUN30_FORMAL_BUILD_CANDIDATE_REPORT.md"

def load(rel):
    p=APP/rel
    if not p.exists():
        raise FileNotFoundError(rel)
    return json.loads(p.read_text(encoding="utf-8"))

def file_sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()

fail=[]
build=load("formal-build-gate/FORMAL_BUILD_METADATA.json")
manifest=load("engine/yaneuraou/engine-manifest.json")

if build.get("diagnosticBuild") is not False or build.get("diagnosticFlags") is not None:
    fail.append("Formal candidate still contains diagnostic compiler flags")
if build.get("status") != "RUN30_FORMAL_BUILD_PROFILE_CANDIDATE":
    fail.append("Formal build metadata status mismatch")
if build.get("wasmUsiCommandExport") is not True:
    fail.append("usi_command export missing")
if build.get("sourceModified") is not True or len(build.get("sourcePatches") or []) != 2:
    fail.append("source patch provenance incomplete")

for key,rel in [
    ("js","engine/yaneuraou/yaneuraou.material.js"),
    ("wasm","engine/yaneuraou/yaneuraou.material.wasm"),
    ("pthreadWorker","engine/yaneuraou/yaneuraou.material.worker.js"),
    ("productionWorkerBootstrap","engine/yaneuraou/YaneuraOuWasmWorkerBootstrap.js"),
]:
    p=APP/rel
    if not p.exists():
        fail.append(f"runtime asset missing: {rel}")
    elif file_sha(p) != build["hashes"][key]:
        fail.append(f"runtime hash mismatch: {key}")

gates = {
    "minimalNodeSearch": load("minimal-real-usi/MINIMAL_NODE_SEARCH_RESULT.json"),
    "minimalBrowserSearch": load("minimal-real-usi/MINIMAL_BROWSER_SEARCH_RESULT.json"),
    "minimalNodeRuntime": load("minimal-real-usi/MINIMAL_NODE_RUNTIME_RESULT.json"),
    "minimalBrowserRuntime": load("minimal-real-usi/MINIMAL_BROWSER_RUNTIME_RESULT.json"),
    "adapter": load("adapter-real-gate/REAL_ADAPTER_INTEGRATION_RESULT.json"),
    "sampleFullPly": load("sample-fullply-real-gate/REAL_SAMPLE_FULLPLY_RESULT.json"),
    "reflectionFlow": load("real-reflection-flow-gate/REAL_REFLECTION_FLOW_RESULT.json"),
    "cancelReanalysis": load("real-cancel-reanalysis-gate/REAL_CANCEL_REANALYSIS_RESULT.json"),
}
for name,d in gates.items():
    if d.get("passed") is not True:
        fail.append(f"{name} failed: {d.get('status')}")

sample=gates["sampleFullPly"]
reflection=gates["reflectionFlow"]
cancel=gates["cancelReanalysis"]

if sample.get("positionsAnalyzed") != 153 or sample.get("analysisTruncated") is not False:
    fail.append("full-ply 153-position evidence missing")
if reflection.get("candidateBoardVisible") is not True:
    fail.append("Candidate -> Board Scroll evidence missing")
for k in ("graphToReplay","candidateToReplay","keyPositionAdded","graphKeyPositionMarker","graphToStep4","step4ExactCard","engineDidNotAutofillReflection"):
    if reflection.get(k) is not True:
        fail.append(f"Reflection Flow evidence missing: {k}")
for k in ("stopSent","quitSentAfterCancel","workerTerminatedAfterCancel","replayUsableAfterCancel","secondUsiObserved"):
    if cancel.get(k) is not True:
        fail.append(f"Cancel/Re-analysis evidence missing: {k}")
if cancel.get("reanalysisStatus") != "COMPLETED" or "153 / 153" not in str(cancel.get("reanalysisProgress") or ""):
    fail.append("Cancel re-analysis did not return to 153/153 COMPLETED")

corr=GATE/"corresponding-source"
required_corr=[
    f"YaneuraOu-{build['commit']}-PRISTINE.tar.gz",
    f"YaneuraOu-{build['commit']}-ShogiReflection-WASM-FORMAL-CANDIDATE.tar.gz",
    "YaneuraOu-ShogiReflection-WASM-FORMAL-CANDIDATE.patch",
    "YANEURAOU_COPYING_GPL3.txt",
    "EMSCRIPTEN_LICENSE_3.1.43.txt",
]
for n in required_corr:
    if not (corr/n).is_file():
        fail.append(f"Corresponding Source evidence missing: {n}")

technical_pass = not fail
result={
    "schemaVersion":1,
    "gate":"RUN30_FORMAL_BUILD_PROFILE_CANDIDATE",
    "passed":technical_pass,
    "status":"PASS_RUN30_FORMAL_BUILD_PROFILE_CANDIDATE" if technical_pass else "FAIL_RUN30_FORMAL_BUILD_PROFILE_CANDIDATE",
    "diagnosticBuild":build.get("diagnosticBuild"),
    "engineHashes":build.get("hashes"),
    "engineSizes":build.get("sizes"),
    "sourcePatches":build.get("sourcePatches"),
    "technicalRuntimeAndApplicationGates":{k:{"passed":v.get("passed"),"status":v.get("status")} for k,v in gates.items()},
    "personalUseReadiness":"READY_FOR_FINAL_ZIP_GATE" if technical_pass else "NOT_READY",
    "publicDistributionReadiness":"NOT_READY_LEGAL_REVIEW_REQUIRED",
    "commercialDistributionReadiness":"NOT_READY_LEGAL_REVIEW_REQUIRED",
    "formalCompletion":False,
    "formalCompletionReason":"FINAL_DISTRIBUTION_ZIP_NOT_YET_ISSUED_OR_POSTZIP_FORMAL_GATE_NOT_YET_COMPLETED",
    "physicalIPhoneSafari":"NOT_VERIFIED",
    "githubPagesCrossOriginIsolation":"NOT_PROVEN_FOR_FORMAL_DISTRIBUTION",
    "battery":"NOT_MEASURED",
    "thermal":"NOT_MEASURED",
    "failures":fail,
}
OUT_JSON.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

lines=[
"# Shogi Reflection Ver.1.8.3 — Run #30 Formal Build Profile Candidate",
"",
f"Status: **{result['status']}**",
"",
"## What Run #30 proves",
"",
"- A fresh YaneuraOu V9.00 MATERIAL WASM is built from the fixed official commit.",
"- The two documented Shogi Reflection WASM source patches are hash-bound.",
"- **Diagnostic compiler flags are removed.**",
"- The exact new JS/WASM/pthread Worker hashes are re-tested through Minimal USI/Search/Runtime, production Adapter, Sample full-ply, Reflection Flow and Cancel/Re-analysis.",
"- Corresponding Source evidence is generated for the exact patched build.",
"",
"## Formal status",
"",
"Run #30 is intentionally **not the final Formal Completion declaration**.",
"Passing Run #30 means the non-diagnostic Real Engine build is ready for the final ZIP packaging/extraction gate.",
"",
"## Distribution readiness",
"",
"- Personal use: " + result["personalUseReadiness"],
"- Public distribution: **NOT READY — LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION**",
"- Commercial distribution: **NOT READY — LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION**",
"- Existing application LICENSE: unchanged.",
"",
"YaneuraOu is GPL-3.0 at the pinned source; exact object-code conveyance and combined-distribution obligations remain a separate legal/compliance decision.",
"",
"## Explicitly unverified",
"",
"- Physical iPhone Safari: NOT VERIFIED",
"- GitHub Pages cross-origin isolation as production hosting: NOT PROVEN",
"- Battery: NOT MEASURED",
"- Thermal behavior: NOT MEASURED",
"",
"## Failures",
"",
*(["- none"] if not fail else [f"- {x}" for x in fail]),
]
OUT_MD.write_text("\n".join(lines)+"\n",encoding="utf-8")
print(OUT_MD.read_text(encoding="utf-8"))
raise SystemExit(0 if technical_pass else 1)
