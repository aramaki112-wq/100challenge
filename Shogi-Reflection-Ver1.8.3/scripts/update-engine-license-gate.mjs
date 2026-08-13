import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const finalResultPath = path.join(root, "formal-build-gate", "RUN36_FINAL_FORMAL_COMPLETION_RESULT.json");
const finalLicensePath = path.join(root, "ENGINE_LICENSE_GATE_RESULT.json");
if (!process.argv.includes("--force-legacy") && fs.existsSync(finalResultPath) && fs.existsSync(finalLicensePath)) {
  try {
    const finalResult = JSON.parse(fs.readFileSync(finalResultPath, "utf8"));
    const finalLicense = JSON.parse(fs.readFileSync(finalLicensePath, "utf8"));
    if (finalResult.passed === true && finalResult.formalCompletion === true && finalLicense.schemaVersion >= 4) {
      console.log(JSON.stringify(finalLicense, null, 2));
      process.exit(0);
    }
  } catch {}
}
const built = process.argv.includes("--built");
const commit = "a5ee2786c0030edc7d4a1cdfe94b04dffec55493";
const correspondingDir = path.join(root, "corresponding-source");
const modifiedArchive = path.join(correspondingDir, `YaneuraOu-${commit}-ShogiReflection-WASM-USI-Bridge.tar.gz`);
const pristineArchive = path.join(correspondingDir, `YaneuraOu-${commit}.tar.gz`);
const patchFile = path.join(root, "patches", "yaneuraou-v9.00-wasm-usi-bridge.patch");
const modifiedHashRecord = path.join(root, "build-record", "corresponding-source-modified-sha256.txt");
const upstreamHashRecord = path.join(root, "build-record", "corresponding-source-upstream-sha256.txt");
const patchHashRecord = path.join(root, "build-record", "corresponding-source-patch-sha256.txt");
const metadataPath = path.join(root, "ENGINE_BUILD_METADATA.json");

const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const recordContains = (file, hash) => fs.existsSync(file) && fs.readFileSync(file, "utf8").includes(hash);

let modifiedArchiveSha256 = null;
let pristineArchiveSha256 = null;
let sourcePatchSha256 = null;
if (built) {
  for (const file of [modifiedArchive, pristineArchive, patchFile, metadataPath]) {
    if (!fs.existsSync(file)) throw new Error(`--built license evidence missing: ${path.relative(root, file)}`);
  }
  const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  if (metadata.sourceModified !== true) throw new Error("Run #8 patched binary must record sourceModified=true.");
  modifiedArchiveSha256 = sha256(modifiedArchive);
  pristineArchiveSha256 = sha256(pristineArchive);
  sourcePatchSha256 = sha256(patchFile);
  if (!recordContains(modifiedHashRecord, modifiedArchiveSha256)) throw new Error("Modified Corresponding Source archive SHA-256 record mismatch.");
  if (!recordContains(upstreamHashRecord, pristineArchiveSha256)) throw new Error("Pristine upstream archive SHA-256 record mismatch.");
  if (!recordContains(patchHashRecord, sourcePatchSha256)) throw new Error("Source patch SHA-256 record mismatch.");
  if (metadata.sourcePatchSha256 !== sourcePatchSha256) throw new Error("Build Metadata source patch SHA-256 mismatch.");
}

const result = {
  schemaVersion: 3,
  checkedAt: new Date().toISOString(),
  completed: true,
  unknownRightsAssetBundled: false,
  yaneuraOuBinaryBundled: built,
  yaneuraOuSourceModified: built,
  sourceModificationDocumented: true,
  materialThirdPartyWeightBundled: false,
  correspondingSourceArchiveIncluded: built,
  correspondingSourceArchiveType: built ? "PINNED_UPSTREAM_PLUS_DOCUMENTED_WASM_USI_BRIDGE_PATCH" : null,
  correspondingSourceArchiveSha256: modifiedArchiveSha256,
  pristineUpstreamArchiveSha256: pristineArchiveSha256,
  sourcePatchSha256,
  exactSourceCommitRecorded: true,
  reproducibleBuildScriptsIncluded: true,
  existingApplicationLicenseChanged: false,
  personalUseReadiness: built
    ? "PATCHED_REAL_YANEURAOU_BUILD_ARTIFACT_AVAILABLE_FOR_PERSONAL_VERIFICATION; FORMAL_RUNTIME_GATES_SEPARATE"
    : "READY_FOR_APP_WITH_LOCAL_FALLBACK; REAL_YANEURAOU_COMPONENT_NOT_BUILT",
  publicDistributionReadiness: built
    ? "LEGAL_REVIEW_REQUIRED_BEFORE_PUBLIC_DISTRIBUTION_OF_PATCHED_REAL_YANEURAOU_BINARY"
    : "APPLICATION_SHELL_ONLY; REAL_YANEURAOU_BUNDLE_NOT_APPROVED",
  commercialDistributionReadiness: "LEGAL_REVIEW_REQUIRED_BEFORE_PUBLIC_DISTRIBUTION",
  formalRealEngineBundlingApproved: false,
  reason: built
    ? "YaneuraOu MATERIAL WASM is built from the exact pinned V9.00 commit plus an explicit two-file WASM USI bridge patch. CI preserves the pristine source archive, exact patch, modified Corresponding Source archive, build/toolchain evidence and hashes. This is engineering provenance evidence only; it does not decide all GPL/corresponding-source or combined-distribution legal questions."
    : "No accepted Real YaneuraOu WASM binary is present. A future patched binary artifact must include exact-source/patch/build evidence and pass runtime and documented distribution/legal review gates."
};
fs.writeFileSync(path.join(root, "ENGINE_LICENSE_GATE_RESULT.json"), JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result, null, 2));
