---
title: "DAY30 Review Checklist"
type: review-checklist
day: 30
status: formal-draft
created: 2026-08-02
tags:
  - 100アプリチャレンジ
  - Review
---

# DAY30 Review Checklist

## 1. Domain境界

- [ ] Production PlanとCapacity Snapshotを分離している
- [ ] Diagnosis ResultをPlanへ書き戻していない
- [ ] DAY29 Capacity計算をDAY30へ複製していない
- [ ] Actual Productionを診断上の実行可能数量と混同していない

## 2. UNKNOWNと0

- [ ] `availableMinutes=0`と`null`を区別している
- [ ] Rule未登録を能力0へ変換していない
- [ ] UNKNOWN数量を0へ変換していない
- [ ] UNKNOWNをINFEASIBLEと表示していない

## 3. Capacity Allocation

- [ ] Capacity Ledgerを診断Runごとに生成している
- [ ] 総割当時間が利用可能時間を超えない
- [ ] 部分割当と不足時間が一致する
- [ ] DAY粒度でShift間を跨ぐ場合も二重計上しない

## 4. Capacity Rule

- [ ] Operation Overrideを最優先している
- [ ] 属性RuleとDefault Ruleを区別している
- [ ] 有効期間外Ruleを除外している
- [ ] 競合Ruleを黙って選択していない
- [ ] 数量単位不一致を拒否している

## 5. Assumption

- [ ] EXPECTEDへConfidenceがある
- [ ] CONFIRMEDへ確認日時と確認者がある
- [ ] REJECTEDへEvidenceがある
- [ ] EXPIREDを有効な事実として扱っていない
- [ ] blockingとnon-blockingを区別している
- [ ] RelationがactiveなAssumptionだけを評価している

## 6. Routing・Coverage

- [ ] 明確な前後逆転をINVALIDにしている
- [ ] 同日順序不明をUNKNOWNにしている
- [ ] 隣接Operation欠落を即INVALIDにしていない
- [ ] DIRECT_MODEL、ASSUMPTION、UNMODELEDを分けている

## 7. Status決定

- [ ] 確認済み不成立をUNKNOWNが上書きしない
- [ ] blocking Assumption未確認をFEASIBLEにしない
- [ ] Capacity partialを数量と整合させている
- [ ] FEASIBLEの実行可能数量が計画数量と一致する

## 8. Explainability

- [ ] Primary ReasonがStatusと一致する
- [ ] FindingへSourceとConfidenceがある
- [ ] 必要・利用可能・不足値が整合する
- [ ] Next Checkへ担当、期限、Statusを持てる
- [ ] 完了・確認不能理由を記録できる

## 9. Version・Validity

- [ ] Plan VersionとDiagnosis Scenarioを分けている
- [ ] 診断時点のRevisionを保存している
- [ ] CURRENT、STALE、INVALIDを分けている
- [ ] Revision後退をINVALIDにしている
- [ ] Presentation-only変更でSTALEにしていない

## 10. Repository・Transaction

- [ ] addとsaveを分けている
- [ ] ID重複を拒否している
- [ ] Plan内Version番号重複を拒否している
- [ ] 複数Repository更新をRollbackできる
- [ ] Repository RevisionもRollbackできる

## 11. Import

- [ ] Header・必須項目・型を検証している
- [ ] Preview前に保存していない
- [ ] ADD／UPDATE／UNCHANGED／ERRORを表示できる
- [ ] Stale Previewを拒否している
- [ ] Commit失敗時に全件Rollbackする
- [ ] 他VersionのEntityを上書きしない

## 12. Browser

- [ ] Plan変更時に旧Scenario Dataを残さない
- [ ] Scenario変更時に旧Resultを残さない
- [ ] Loading中にButtonを無効化する
- [ ] Empty Stateを理由別に表示する
- [ ] Error時に既存Dataを可能な範囲で保持する
- [ ] 古い非同期Responseを無視する
- [ ] User入力をHTML Escapeする

## 13. Persistence

- [ ] LocalStorage DataをSchema検証している
- [ ] BackupへRepositoryと外部Dataを含める
- [ ] 旧Schemaとの互換方針がある
- [ ] 壊れたBackupで現在Dataを変更しない
- [ ] Restore後に参照整合性を確認する

## 14. Scenario比較

- [ ] 同じPlan Versionを比較している
- [ ] INVALID Resultを比較しない
- [ ] UNKNOWNを改善・悪化と断定しない
- [ ] 数量単位別に差分を集計する
- [ ] 因果効果の証明ではない注意を表示する

## 15. Test・成果物

- [ ] `npm test`が全件成功する
- [ ] `npm run check`が成功する
- [ ] `TEST_RESULT.txt`が全体Test結果である
- [ ] End-to-End Acceptance Testが成功する
- [ ] GitHub正式Fileが存在する
- [ ] Obsidian正式成果物7点が存在する
- [ ] 日本語Word Manualが存在する
- [ ] Excel Templateが存在する
- [ ] ZIP展開後もTestが成功する
