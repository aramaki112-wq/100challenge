# Shogi Reflection Ver.1.8.3 — Run #13 Diagnostic Runtime Patch

Run #12 built the diagnostic YaneuraOu artifact successfully, but the Formal
artifact gate correctly rejected `diagnosticBuild=true` before the browser
diagnostic could run. Therefore Run #12 did not actually capture the runtime
assertion/stack that it was created to obtain.

Run #13 separates diagnostic artifact integrity from Formal readiness:

- diagnostic JS/WASM/pthread/bootstrap hashes are verified
- `usi_command` export is verified
- ordinary Formal artifact gate is still run and expected to reject diagnostic builds
- Real USI verifier is explicitly allowed to run only for `diagnosticBuild=true`
- browser console and page errors are preserved in Real USI evidence
- Real application E2E remains deferred
- Formal Completion remains impossible for this diagnostic build

Local verification before delivery:
- Automated Test: 715 / 715 PASS
- Static Verification: 146 / 146 PASS
- Missing Import: 0
- Browser Test: 154 / 154 PASS
- Visual Test: 24 / 24 PASS
- ReflectionLocal Fallback: 16 / 16 PASS
- Root/App workflow YAML parse: PASS
- Shell/Python/Node syntax checks: PASS

Apply this ZIP to the `100challenge` repository root, overwrite same-name files,
commit, and push. Do not delete `Shogi-Reflection-Ver1.8.3`.
