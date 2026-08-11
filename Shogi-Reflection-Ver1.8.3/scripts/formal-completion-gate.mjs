import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [], checks = [];
const record = (name, ok, detail = "") => { checks.push({name,ok,detail}); if(!ok) failures.push(`${name}${detail?`: ${detail}`:""}`); };
const readJson = (name) => { try { return JSON.parse(fs.readFileSync(path.join(root,name),"utf8")); } catch { return null; } };
const read = (name) => { try { return fs.readFileSync(path.join(root,name),"utf8"); } catch { return ""; } };

try { execFileSync(process.execPath,[path.join(root,"scripts","real-yaneuraou-artifact-gate.mjs")],{cwd:root,stdio:"pipe"}); record("Real YaneuraOu artifact gate",true); }
catch(error){
  const artifactGate=readJson("REAL_YANEURAOU_ARTIFACT_GATE_RESULT.json");
  const detail=artifactGate?.failures?.slice(0,3).join(" | ") || error.stderr?.toString().trim() || "failed";
  record("Real YaneuraOu artifact gate",false,detail);
}

const metadata=readJson("ENGINE_BUILD_METADATA.json")??{};
record("Official Source fixed commit", metadata.commit === "a5ee2786c0030edc7d4a1cdfe94b04dffec55493", String(metadata.commit??""));
record("Fixed Emscripten SDK", metadata.emsdkVersion === "3.1.43" && metadata.expectedEmscriptenReleaseCommit === "bf3c159888633d232c0507f4c76cc156a43c32dc", `${metadata.emsdkVersion??""}/${metadata.expectedEmscriptenReleaseCommit??""}`);
record("Measured compiler metadata", metadata.measured===true && Boolean(metadata.emccVersion&&metadata.emppVersion&&metadata.llvmVersion));
record("MATERIAL WASM profile", metadata.evaluationModel==="MATERIAL" && metadata.materialLevel===1 && metadata.targetCpu==="WASM" && metadata.threads===true);
record("Documented YaneuraOu source modification", metadata.sourceModified===true && metadata.sourcePatchFile==="patches/yaneuraou-v9.00-wasm-usi-bridge.patch" && Boolean(metadata.sourcePatchSha256));
record("Measured WASM USI command export", ["usi_command","_usi_command"].includes(metadata.wasmUsiCommandExport), String(metadata.wasmUsiCommandExport??""));

const wasmPath = metadata.wasmFile ? path.join(root,"engine","yaneuraou",metadata.wasmFile) : null;
const wasmHash = wasmPath && fs.existsSync(wasmPath) ? crypto.createHash("sha256").update(fs.readFileSync(wasmPath)).digest("hex") : null;

const usi=readJson("REAL_YANEURAOU_USI_RESULT.json");
if (!usi) record("Real YaneuraOu USI evidence",false,"REAL_YANEURAOU_USI_RESULT.json missing");
else {
  record("Real YaneuraOu USI passed",usi.passed===true,`passed=${usi.passed}`);
  record("Real USI matches current WASM",Boolean(wasmHash&&usi.wasmSha256===wasmHash),`usi=${usi.wasmSha256??"null"}, current=${wasmHash??"null"}`);
  const requiredUsi=[
    "usi","usiok","isready","readyok","usinewgame","position","go","info","cp","mate","pv","multipv","depth","nodes","time","bestmove","stop","quit",
    "evaluationSanityInitial","evaluationSanityMaterialGain","evaluationSanityMaterialLoss","evaluationSanityAdvantage","evaluationSanityDisadvantage","evaluationSanityMate"
  ];
  for(const k of requiredUsi) record(`Real USI ${k}`,usi.checks?.[k]===true,String(usi.checks?.[k]));
}

const e2e=readJson("REAL_YANEURAOU_E2E_RESULT.json");
if (!e2e) record("Real YaneuraOu application E2E evidence",false,"REAL_YANEURAOU_E2E_RESULT.json missing");
else {
  record("Real YaneuraOu application E2E passed",e2e.passed===true,`passed=${e2e.passed}`);
  record("Real application E2E matches current WASM",Boolean(wasmHash&&e2e.wasmSha256===wasmHash),`e2e=${e2e.wasmSha256??"null"}, current=${wasmHash??"null"}`);
  const requiredApp=[
    "realEngineMetadata","sampleKif","fullPly","evaluationGraph","goodCandidate","badCandidate","bestEvaluation","actualEvaluation","difference","pv",
    "candidateJump","boardScroll","keyPosition","graphMarker","graphToStep4","fact","interpretation","hypothesis","cancel","reanalysis"
  ];
  for(const k of requiredApp) record(`Real application E2E ${k}`,e2e.checks?.[k]===true,String(e2e.checks?.[k]));
}

const license=readJson("ENGINE_LICENSE_GATE_RESULT.json");
if (!license) record("License gate evidence",false,"missing");
else {
  record("License gate completed",license.completed===true,String(license.completed));
  record("No unknown-rights asset bundled",license.unknownRightsAssetBundled===false,String(license.unknownRightsAssetBundled));
  record("Distribution readiness separated",Boolean(license.personalUseReadiness&&license.publicDistributionReadiness&&license.commercialDistributionReadiness));
  if (license.yaneuraOuBinaryBundled === true) {
    record("Corresponding Source archive bundled with Real binary evidence", license.correspondingSourceArchiveIncluded===true && Boolean(license.correspondingSourceArchiveSha256));
    record("Exact source/build evidence recorded", license.exactSourceCommitRecorded===true && license.reproducibleBuildScriptsIncluded===true);
    record("Patched-source provenance recorded", license.yaneuraOuSourceModified===true && license.sourceModificationDocumented===true && Boolean(license.sourcePatchSha256) && license.sourcePatchSha256===metadata.sourcePatchSha256);
  }
}
record("Corresponding Source plan",read("ENGINE_SOURCE_DISTRIBUTION_PLAN.md").includes("Exact Commit") && read("ENGINE_SOURCE_DISTRIBUTION_PLAN.md").includes("Build Script") && read("ENGINE_SOURCE_DISTRIBUTION_PLAN.md").includes("modified-source Corresponding Source"));
record("Third-party notices",read("THIRD_PARTY_NOTICES.md").includes("YaneuraOu") && read("THIRD_PARTY_NOTICES.md").includes("Emscripten"));
record("Automated test evidence",/Failed:\s*0/.test(read("TEST_RESULT.txt")));
record("Browser test evidence",/Failed:\s*0/.test(read("BROWSER_VERIFICATION_RESULT.txt")));
record("Static verification evidence",/Failed checks:\s*0/.test(read("STATIC_VERIFICATION_RESULT.txt")) && /Missing imports:\s*0/.test(read("STATIC_VERIFICATION_RESULT.txt")));
record("Visual verification evidence",/Failed:\s*0/.test(read("VISUAL_VERIFICATION_RESULT.txt")));
record("Source of Truth audit",read("SOURCE_OF_TRUTH_AUDIT.md").includes("Ver.1.8.3"));
record("Completion report",read("COMPLETION_REPORT.md").includes("Ver.1.8.3"));

const result={schemaVersion:3,checkedAt:new Date().toISOString(),gate:"VER_1_8_3_FORMAL_COMPLETION",passed:failures.length===0,checks,failures,verdict:failures.length?"NOT_FORMAL":"FORMAL_GATE_PASSED_PRE_ZIP_REVERIFICATION"};
fs.writeFileSync(path.join(root,"FORMAL_COMPLETION_GATE_RESULT.json"),JSON.stringify(result,null,2)+"\n");
console.log(JSON.stringify(result,null,2));
if(failures.length) process.exit(1);
