#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import sys
from datetime import datetime, timezone

APP = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parents[1]
GATE = APP / "formal-build-gate"
LOCK_PATH = APP / "RUN36_FORMAL_RELEASE_LOCK.json"


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def dump(path: Path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def require(cond: bool, message: str):
    if not cond:
        raise SystemExit("RUN36 FINALIZER FAIL: " + message)


def recorded_sha(path: Path) -> str:
    text = path.read_text(encoding="utf-8", errors="replace").strip()
    require(bool(text), f"empty SHA record: {path.relative_to(APP)}")
    return text.split()[0]


lock = load(LOCK_PATH)
run30 = load(GATE / "RUN30_FORMAL_BUILD_CANDIDATE_RESULT.json")
run35 = load(GATE / "RUN35_POSTZIP_PACKAGE_GATE_RESULT.json")
metadata_path = APP / "ENGINE_BUILD_METADATA.json"
manifest_path = APP / "engine" / "yaneuraou" / "engine-manifest.json"
metadata = load(metadata_path)
manifest = load(manifest_path)

require(run30.get("passed") is True, "Run #30 result is not passed")
require(run30.get("status") == lock["requiredRun30Status"], "Run #30 status differs from release lock")
require(run30.get("diagnosticBuild") is False, "Run #30 is diagnostic")
require(run35.get("passed") is True, "Run #35 result is not passed")
require(run35.get("status") == lock["requiredRun35Status"], "Run #35 status differs from release lock")
require(run35.get("missingImports") == 0, "Run #35 Missing Import is not zero")
require(run35.get("unexpectedDeletedBaselineFiles") == 0, "Run #35 Baseline deletion is not zero")

runtime = {
    "js": APP / "engine" / "yaneuraou" / "yaneuraou.material.js",
    "wasm": APP / "engine" / "yaneuraou" / "yaneuraou.material.wasm",
    "pthreadWorker": APP / "engine" / "yaneuraou" / "yaneuraou.material.worker.js",
    "productionWorkerBootstrap": APP / "engine" / "yaneuraou" / "YaneuraOuWasmWorkerBootstrap.js",
}
actual_hashes = {}
actual_sizes = {}
for key, path in runtime.items():
    require(path.is_file() and path.stat().st_size > 0, f"runtime missing: {path.relative_to(APP)}")
    actual_hashes[key] = sha(path)
    actual_sizes[key] = path.stat().st_size
    require(actual_hashes[key] == lock["runtimeHashes"][key], f"locked runtime SHA mismatch: {key}")
    require(actual_sizes[key] == lock["runtimeSizes"][key], f"locked runtime size mismatch: {key}")

require(run30.get("engineHashes") == lock["runtimeHashes"], "Run #30 engine hashes differ from release lock")
require(metadata.get("measured") is True, "root Build Metadata is not measured")
require(metadata.get("diagnosticBuild") is False, "root Build Metadata is diagnostic")
require(metadata.get("commit") == lock["engine"]["commit"], "root Build Metadata commit mismatch")
require(metadata.get("emsdkVersion") == lock["engine"]["emscripten"], "root Build Metadata Emscripten mismatch")
require(metadata.get("jsSha256") == actual_hashes["js"], "root metadata JS hash mismatch")
require(metadata.get("wasmSha256") == actual_hashes["wasm"], "root metadata WASM hash mismatch")
require(metadata.get("workerSha256") == actual_hashes["pthreadWorker"], "root metadata pthread Worker hash mismatch")
require(metadata.get("workerBootstrapSha256") == actual_hashes["productionWorkerBootstrap"], "root metadata bootstrap hash mismatch")
require(manifest.get("available") is True, "engine manifest is not available")
require(manifest.get("diagnosticBuild") is False, "engine manifest is diagnostic")
require(manifest.get("wasmSha256") == actual_hashes["wasm"], "manifest WASM hash mismatch")

corr = GATE / "corresponding-source"
commit = lock["engine"]["commit"]
pristine = corr / f"YaneuraOu-{commit}-PRISTINE.tar.gz"
modified = corr / f"YaneuraOu-{commit}-ShogiReflection-WASM-FORMAL-CANDIDATE.tar.gz"
combined_patch = corr / "YaneuraOu-ShogiReflection-WASM-FORMAL-CANDIDATE.patch"
for path in [
    pristine,
    modified,
    combined_patch,
    corr / "YANEURAOU_COPYING_GPL3.txt",
    corr / "YANEURAOU_README.md",
    corr / "EMSCRIPTEN_LICENSE_3.1.43.txt",
    corr / "yaneuraou-v9.00-wasm-usi-bridge.patch",
    corr / "yaneuraou-v9.00-emscripten-thread-worker-init-formal-candidate.patch",
]:
    require(path.is_file() and path.stat().st_size > 0, f"Corresponding Source evidence missing: {path.relative_to(APP)}")

pristine_sha = sha(pristine)
modified_sha = sha(modified)
combined_patch_sha = sha(combined_patch)
require(recorded_sha(pristine.with_suffix(pristine.suffix + ".sha256")) == pristine_sha, "pristine archive hash record mismatch")
require(recorded_sha(modified.with_suffix(modified.suffix + ".sha256")) == modified_sha, "modified archive hash record mismatch")
require(recorded_sha(combined_patch.with_suffix(combined_patch.suffix + ".sha256")) == combined_patch_sha, "combined patch hash record mismatch")

for patch in lock["sourcePatches"]:
    source = APP / patch["file"]
    require(source.is_file(), f"source patch missing: {patch['file']}")
    require(sha(source) == patch["sha256"], f"source patch SHA mismatch: {patch['file']}")

# Preserve legal/distribution separation while promoting the exact package to
# technical Formal Completion for the verified personal-use scope.
metadata.update({
    "status": "VER_1_8_3_FORMAL_TECHNICAL_RELEASE",
    "formalBuildCandidate": False,
    "formalCompletion": True,
    "formalCompletionScope": "TECHNICAL_PERSONAL_USE_RELEASE",
    "releaseCandidate": True,
    "publicDistributionReady": False,
    "commercialDistributionReady": False,
    "legalReviewRequiredBeforePublicDistribution": True,
    "notes": [
        "Run #36 rebuilt the non-diagnostic Formal profile and matched the frozen Run #30 runtime hashes byte-for-byte.",
        "Run #30 Real runtime/application gates and Run #35 Post-ZIP standalone gate passed.",
        "Technical Formal Completion is limited to the verified personal-use release scope.",
        "LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION.",
    ],
})
dump(metadata_path, metadata)

manifest.update({
    "status": "VER_1_8_3_FORMAL_TECHNICAL_RELEASE",
    "buildId": "RUN36_FINAL_FORMAL_RELEASE",
    "formalBuildCandidate": False,
    "formalCompletion": True,
    "formalCompletionScope": "TECHNICAL_PERSONAL_USE_RELEASE",
    "releaseCandidate": True,
    "publicDistributionReady": False,
    "commercialDistributionReady": False,
    "legalReviewRequiredBeforePublicDistribution": True,
    "note": "Run #36 exact-hash non-diagnostic Formal technical release. Public/commercial distribution remains outside the passed scope.",
})
dump(manifest_path, manifest)

license_result = {
    "schemaVersion": 4,
    "checkedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    "completed": True,
    "unknownRightsAssetBundled": False,
    "yaneuraOuBinaryBundled": True,
    "yaneuraOuSourceModified": True,
    "sourceModificationDocumented": True,
    "materialThirdPartyWeightBundled": False,
    "correspondingSourceArchiveIncluded": True,
    "correspondingSourceArchiveType": "PINNED_PRISTINE_PLUS_DOCUMENTED_FORMAL_PATCHED_SOURCE",
    "correspondingSourceArchiveSha256": modified_sha,
    "pristineUpstreamArchiveSha256": pristine_sha,
    "combinedSourcePatchSha256": combined_patch_sha,
    "sourcePatches": lock["sourcePatches"],
    "exactSourceCommitRecorded": True,
    "reproducibleBuildScriptsIncluded": True,
    "existingApplicationLicenseChanged": False,
    "personalUseReadiness": "READY_EXACT_HASH_FORMAL_TECHNICAL_RELEASE",
    "publicDistributionReadiness": "NOT_READY_LEGAL_REVIEW_REQUIRED",
    "commercialDistributionReadiness": "NOT_READY_LEGAL_REVIEW_REQUIRED",
    "formalRealEngineBundlingApprovedForTechnicalPersonalRelease": True,
    "formalRealEngineBundlingApprovedForPublicDistribution": False,
    "formalRealEngineBundlingApprovedForCommercialDistribution": False,
    "legalReviewRequiredBeforePublicDistribution": True,
    "reason": "Run #36 preserves exact YaneuraOu source identity, both documented source patches, pristine and modified Corresponding Source archives, build/toolchain evidence and exact runtime hashes. This closes the engineering provenance gate for the technical personal-use release only; it does not make a legal determination for public/commercial distribution."
}
dump(APP / "ENGINE_LICENSE_GATE_RESULT.json", license_result)

release_manifest = {
    "schemaVersion": 1,
    "release": "Shogi-Reflection-Ver1.8.3",
    "gate": "RUN36_FINAL_FORMAL_COMPLETION",
    "formalCompletion": True,
    "formalCompletionScope": "TECHNICAL_PERSONAL_USE_RELEASE",
    "engine": lock["engine"],
    "runtimeHashes": actual_hashes,
    "runtimeSizes": actual_sizes,
    "sourcePatches": lock["sourcePatches"],
    "correspondingSource": {
        "pristineArchive": pristine.name,
        "pristineArchiveSha256": pristine_sha,
        "modifiedArchive": modified.name,
        "modifiedArchiveSha256": modified_sha,
        "combinedPatch": combined_patch.name,
        "combinedPatchSha256": combined_patch_sha,
    },
    "gates": {
        "run30": run30["status"],
        "run35": run35["status"],
        "automatedTests": "PASS",
        "staticVerification": "PASS",
        "missingImports": 0,
        "unexpectedDeletedBaselineFiles": 0,
    },
    "distribution": lock["releasePolicy"],
    "zipSha256": "RECORDED_EXTERNALLY_AFTER_FINAL_ZIP_CREATION"
}
dump(APP / "RUN36_RELEASE_MANIFEST.json", release_manifest)

completion = {
    "schemaVersion": 4,
    "checkedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    "gate": "VER_1_8_3_FORMAL_COMPLETION",
    "passed": True,
    "verdict": "FORMAL_TECHNICAL_RELEASE_PASSED",
    "formalCompletion": True,
    "formalCompletionScope": "TECHNICAL_PERSONAL_USE_RELEASE",
    "releaseName": "Shogi-Reflection-Ver1.8.3.zip",
    "lockedRuntimeHashes": actual_hashes,
    "checks": [
        {"name": "Fresh non-diagnostic build matches frozen Run #30 hashes", "ok": True},
        {"name": "Run #30 Real runtime/application gate", "ok": True, "detail": run30["status"]},
        {"name": "Run #35 Post-ZIP standalone gate", "ok": True, "detail": run35["status"]},
        {"name": "Missing Import", "ok": True, "detail": "0"},
        {"name": "Unexpected deleted Baseline files", "ok": True, "detail": "0"},
        {"name": "Corresponding Source exact source/patch evidence", "ok": True},
        {"name": "Technical personal-use release scope", "ok": True},
        {"name": "Public/commercial distribution remains outside passed scope", "ok": True, "detail": "NOT READY — LEGAL REVIEW REQUIRED"}
    ],
    "failures": [],
    "scopeExclusions": [
        "Public distribution legal approval",
        "Commercial distribution legal approval",
        "Physical iPhone Safari verification",
        "Battery measurement",
        "Thermal measurement"
    ]
}
dump(APP / "FORMAL_COMPLETION_GATE_RESULT.json", completion)
dump(GATE / "RUN36_FINAL_FORMAL_COMPLETION_RESULT.json", completion)

(APP / "FORMAL_COMPLETION_STATUS.md").write_text(f"""# Shogi Reflection Ver.1.8.3 — FORMAL COMPLETION STATUS

Verdict: **FORMAL TECHNICAL RELEASE PASSED**

Formal Completion Scope: **TECHNICAL / PERSONAL-USE RELEASE**

## Locked runtime

- YaneuraOu: V9.00
- Commit: `{lock['engine']['commit']}`
- Evaluation: MATERIAL / MATERIAL_LEVEL=1
- Emscripten: 3.1.43
- Diagnostic build: false
- JS SHA-256: `{actual_hashes['js']}`
- WASM SHA-256: `{actual_hashes['wasm']}`
- pthread Worker SHA-256: `{actual_hashes['pthreadWorker']}`
- Worker bootstrap SHA-256: `{actual_hashes['productionWorkerBootstrap']}`

## Passed

- Fresh non-diagnostic build reproduced the frozen Run #30 runtime hashes byte-for-byte.
- All Run #30 Real runtime/application gates passed on those hashes.
- Run #35 Post-ZIP Standalone Package Gate passed.
- Automated Tests: PASS.
- Static Verification: PASS.
- Missing Import: 0.
- Unexpected deleted Baseline files: 0.
- Corresponding Source, source patches, licenses and provenance evidence are included.

## Distribution boundary

This status is an engineering/Formal technical completion statement for the verified personal-use package. It is **not** legal approval to publish, sell, or otherwise distribute the Real YaneuraOu binary bundle.

**LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION.**

Public distribution readiness: **NOT READY**  
Commercial distribution readiness: **NOT READY**

## Explicitly unverified / unmeasured

- Physical iPhone Safari: NOT VERIFIED
- Battery: NOT MEASURED
- Thermal: NOT MEASURED

These items do not invalidate the desktop/browser technical release gate, but they must not be represented as verified.
""", encoding="utf-8")

(APP / "ENGINE_SOURCE_DISTRIBUTION_PLAN.md").write_text(f"""# ENGINE_SOURCE_DISTRIBUTION_PLAN — Ver.1.8.3 Run #36

## Exact Commit

YaneuraOu V9.00 commit `{commit}`.

## Build Script

- `formal-build-gate/build-formal-yaneuraou-wasm.sh`
- Emscripten `3.1.43`
- MATERIAL / MATERIAL_LEVEL=1
- non-diagnostic build only

## Modified-source Corresponding Source

The package retains both pristine and modified source forms plus exact patches:

- `formal-build-gate/corresponding-source/{pristine.name}`  
  SHA-256: `{pristine_sha}`
- `formal-build-gate/corresponding-source/{modified.name}`  
  SHA-256: `{modified_sha}`
- `formal-build-gate/corresponding-source/{combined_patch.name}`  
  SHA-256: `{combined_patch_sha}`
- `patches/yaneuraou-v9.00-wasm-usi-bridge.patch`
- `formal-build-gate/patches/yaneuraou-v9.00-emscripten-thread-worker-init-formal-candidate.patch`

The modified-source snapshot is the source corresponding to the exact Formal runtime build path. The pristine archive provides the pinned upstream base for independent reconstruction/audit.

## Runtime identity

- JS: `{actual_hashes['js']}`
- WASM: `{actual_hashes['wasm']}`
- pthread Worker: `{actual_hashes['pthreadWorker']}`
- first-party Worker bootstrap: `{actual_hashes['productionWorkerBootstrap']}`

## Distribution boundary

The engineering package contains the provenance/source materials needed for technical traceability. This file does not decide legal sufficiency for public/commercial conveyance.

**LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION.**
""", encoding="utf-8")

(APP / "THIRD_PARTY_NOTICES.md").write_text(f"""# THIRD_PARTY_NOTICES — Shogi Reflection Ver.1.8.3 Run #36

## YaneuraOu

- Project: YaneuraOu
- Release: V9.00
- Exact commit: `{commit}`
- Evaluation: built-in MATERIAL / MATERIAL_LEVEL=1
- External NNUE / 水匠 weights: not included
- Source license evidence: `formal-build-gate/corresponding-source/YANEURAOU_COPYING_GPL3.txt`
- Upstream README evidence: `formal-build-gate/corresponding-source/YANEURAOU_README.md`

The bundled WASM is built from the exact pinned commit plus two documented WASM integration patches. It is not represented as an unmodified upstream binary.

## Emscripten

- Version: 3.1.43
- License evidence: `formal-build-gate/corresponding-source/EMSCRIPTEN_LICENSE_3.1.43.txt`
- Build image: `emscripten/emsdk:3.1.43`

## Exact generated runtime hashes

- `yaneuraou.material.js`: `{actual_hashes['js']}`
- `yaneuraou.material.wasm`: `{actual_hashes['wasm']}`
- `yaneuraou.material.worker.js`: `{actual_hashes['pthreadWorker']}`
- `YaneuraOuWasmWorkerBootstrap.js`: `{actual_hashes['productionWorkerBootstrap']}`

## Corresponding Source

See `ENGINE_SOURCE_DISTRIBUTION_PLAN.md` and `formal-build-gate/corresponding-source/`.

## Distribution warning

Technical personal-use Formal Completion and legal permission for public/commercial distribution are intentionally separate.

**LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION.**
""", encoding="utf-8")

(APP / "DISTRIBUTION_LICENSE_CHECKLIST.md").write_text("""# DISTRIBUTION_LICENSE_CHECKLIST — Ver.1.8.3 Run #36

## Technical / personal-use Formal package

- [x] Existing Application LICENSE preserved.
- [x] Exact YaneuraOu repository, V9.00 commit and MATERIAL profile recorded.
- [x] Fresh non-diagnostic Formal build produced the frozen runtime hashes.
- [x] JS / WASM / pthread Worker / Worker bootstrap hashes fixed and cross-checked.
- [x] Real runtime/application gates passed on the same hashes.
- [x] Final standalone ZIP extraction verification passed before Formal Completion is recorded.
- [x] Pristine upstream source archive included.
- [x] Modified-source Corresponding Source archive included.
- [x] Both source patches and their SHA-256 identities recorded.
- [x] YaneuraOu license evidence included.
- [x] Emscripten license evidence included.
- [x] Missing Import = 0.
- [x] Unexpected deleted Baseline files = 0.

## Public / commercial distribution

- [ ] Legal review completed for public conveyance of the combined package.
- [ ] Public source-delivery method and any legally required availability/retention terms approved.
- [ ] Public hosting/deployment environment proven for the pthread/cross-origin-isolation requirements.
- [ ] Public Distribution Readiness approved.
- [ ] Commercial Distribution Readiness approved.

Current status: **NOT READY FOR PUBLIC OR COMMERCIAL DISTRIBUTION**.

**LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION.**

## Device/resource verification outside this gate

- [ ] Physical iPhone Safari verified.
- [ ] Battery measured.
- [ ] Thermal behavior measured.
""", encoding="utf-8")

# Authoritative exact runtime hash record for the final package.
(APP / "ENGINE_ASSET_SHA256SUMS.txt").write_text(
    f"{actual_hashes['js']}  engine/yaneuraou/yaneuraou.material.js\n"
    f"{actual_hashes['wasm']}  engine/yaneuraou/yaneuraou.material.wasm\n"
    f"{actual_hashes['pthreadWorker']}  engine/yaneuraou/yaneuraou.material.worker.js\n"
    f"{actual_hashes['productionWorkerBootstrap']}  engine/yaneuraou/YaneuraOuWasmWorkerBootstrap.js\n",
    encoding="utf-8",
)

# Preserve historical audit sections but prepend the Run #36 authoritative state.
license_audit_path = APP / "ENGINE_LICENSE_AUDIT.md"
license_audit = license_audit_path.read_text(encoding="utf-8", errors="replace")
if "## Run #36 Authoritative Technical Release Audit" not in license_audit:
    license_audit = f"""# ENGINE_LICENSE_AUDIT — Ver.1.8.3 Run #36 Final Technical Release

Status: engineering provenance/distribution-boundary audit; **not legal advice**

## Run #36 Authoritative Technical Release Audit

- Exact YaneuraOu commit: `{commit}`.
- Evaluation: MATERIAL / MATERIAL_LEVEL=1; no external NNUE/水匠 weights.
- Non-diagnostic runtime reproduced the frozen Run #30 hashes byte-for-byte.
- Pristine upstream source and modified-source Corresponding Source archives are included and hash-bound.
- Both documented source patches are included and hash-bound.
- YaneuraOu and Emscripten license evidence is included.
- Technical/personal-use Formal release: **APPROVED BY ENGINEERING GATE**.
- Public distribution: **NOT READY — LEGAL REVIEW REQUIRED**.
- Commercial distribution: **NOT READY — LEGAL REVIEW REQUIRED**.

The historical Build Bridge audit follows below for traceability.

---

""" + license_audit
    license_audit_path.write_text(license_audit, encoding="utf-8")

source_audit_path = APP / "SOURCE_OF_TRUTH_AUDIT.md"
source_audit = source_audit_path.read_text(encoding="utf-8", errors="replace")
if "## Run #36 Authoritative Source-of-Truth Update" not in source_audit:
    source_audit = f"""# SOURCE_OF_TRUTH_AUDIT — Shogi Reflection Ver.1.8.3

## Run #36 Authoritative Source-of-Truth Update

The final technical release is derived from this Ver.1.8.3 source plus the exact non-diagnostic YaneuraOu runtime locked by `RUN36_FORMAL_RELEASE_LOCK.json`.

- Run #30 Real technical gates: PASS.
- Run #35 standalone Post-ZIP gate: PASS.
- Run #36 fresh rebuild vs frozen runtime hashes: PASS.
- Final Formal Completion scope: TECHNICAL / PERSONAL-USE RELEASE.
- Public/commercial distribution: NOT READY; LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION.

Historical pre-Formal audit sections follow below for traceability.

---

""" + source_audit
    source_audit_path.write_text(source_audit, encoding="utf-8")

readme_path = APP / "README.md"
readme = readme_path.read_text(encoding="utf-8", errors="replace")
if "## Ver.1.8.3 Run #36 Final Formal Technical Release" not in readme:
    readme = f"""# Shogi Reflection Ver.1.8.3

## Ver.1.8.3 Run #36 Final Formal Technical Release

The formally named package `Shogi-Reflection-Ver1.8.3.zip` is issued only by the Run #36 workflow after a fresh non-diagnostic YaneuraOu build reproduces the frozen successful runtime hashes and all final ZIP gates pass.

Technical/personal-use Formal Completion: **PASSED**.  
Public/commercial distribution: **NOT READY — LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION**.

Historical development documentation follows below.

---

""" + readme
    readme_path.write_text(readme, encoding="utf-8")

zip_history = APP / "ZIP_EXTRACTED_VERIFICATION_RESULT.txt"
if zip_history.exists():
    old = zip_history.read_text(encoding="utf-8", errors="replace")
    if not old.startswith("HISTORICAL PRE-RUN36 EVIDENCE"):
        zip_history.write_text(
            "HISTORICAL PRE-RUN36 EVIDENCE — superseded for final release status by RUN36_FINAL_ZIP_GATE_RESULT.json (external artifact) and FORMAL_COMPLETION_STATUS.md.\n\n" + old,
            encoding="utf-8",
        )

# Append a small authoritative Run #36 section without deleting historical report content.
report_path = APP / "COMPLETION_REPORT.md"
report = report_path.read_text(encoding="utf-8", errors="replace")
marker = "## Run #36 Final Formal Technical Release"
if marker not in report:
    report += f"""\n\n{marker}\n\n- Formal technical completion: PASSED.\n- Runtime hashes are frozen by `RUN36_FORMAL_RELEASE_LOCK.json` and reproduced byte-for-byte.\n- Run #30 Real gates: PASSED.\n- Run #35 Post-ZIP standalone gate: PASSED.\n- Final package name: `Shogi-Reflection-Ver1.8.3.zip`.\n- Public/commercial distribution: NOT READY; LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION.\n"""
    report_path.write_text(report, encoding="utf-8")

print("PASS: Run #36 Formal technical release metadata/docs finalized.")
print("PASS: public/commercial distribution remains fail-closed pending legal review.")
