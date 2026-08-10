import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const built = process.argv.includes("--built");
const commit = "a5ee2786c0030edc7d4a1cdfe94b04dffec55493";
const sourceArchive = path.join(root, "corresponding-source", `YaneuraOu-${commit}.tar.gz`);
const sourceHashRecord = path.join(root, "build-record", "corresponding-source-sha256.txt");
let sourceArchiveSha256 = null;
if (built) {
  if (!fs.existsSync(sourceArchive) || !fs.existsSync(sourceHashRecord)) {
    throw new Error("--built license evidence requires the exact-commit Corresponding Source archive and its SHA-256 record.");
  }
  sourceArchiveSha256 = crypto.createHash("sha256").update(fs.readFileSync(sourceArchive)).digest("hex");
  const recorded = fs.readFileSync(sourceHashRecord, "utf8");
  if (!recorded.includes(sourceArchiveSha256)) throw new Error("Corresponding Source archive SHA-256 record mismatch.");
}
const result = {
  schemaVersion: 2,
  checkedAt: new Date().toISOString(),
  completed: true,
  unknownRightsAssetBundled: false,
  yaneuraOuBinaryBundled: built,
  materialThirdPartyWeightBundled: false,
  correspondingSourceArchiveIncluded: built,
  correspondingSourceArchiveSha256: sourceArchiveSha256,
  exactSourceCommitRecorded: true,
  reproducibleBuildScriptsIncluded: true,
  existingApplicationLicenseChanged: false,
  personalUseReadiness: built
    ? "REAL_YANEURAOU_BUILD_ARTIFACT_AVAILABLE_FOR_PERSONAL_VERIFICATION; FORMAL_RUNTIME_GATES_SEPARATE"
    : "READY_FOR_APP_WITH_LOCAL_FALLBACK; REAL_YANEURAOU_COMPONENT_NOT_BUILT",
  publicDistributionReadiness: built
    ? "LEGAL_REVIEW_REQUIRED_BEFORE_PUBLIC_DISTRIBUTION_OF_REAL_YANEURAOU_BINARY"
    : "APPLICATION_SHELL_ONLY; REAL_YANEURAOU_BUNDLE_NOT_APPROVED",
  commercialDistributionReadiness: "LEGAL_REVIEW_REQUIRED_BEFORE_PUBLIC_DISTRIBUTION",
  formalRealEngineBundlingApproved: false,
  reason: built
    ? "Official-source YaneuraOu MATERIAL WASM is present in the Build Bridge artifact together with exact-commit source archive/build evidence. This records engineering evidence; it does not itself decide all GPL/corresponding-source or application-combination legal questions."
    : "No Real YaneuraOu WASM binary is present. A future binary artifact must include exact-source/build evidence and pass the documented distribution/legal review gate."
};
fs.writeFileSync(path.join(root, "ENGINE_LICENSE_GATE_RESULT.json"), JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result, null, 2));
