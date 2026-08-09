# DISTRIBUTION_LICENSE_CHECKLIST — 将来配布前の確認表

確認日: 2026-08-09

このChecklistは法律相談の代替ではない。目的は「何を配っているのか説明できない状態」で公開・販売しないためのGateである。

## A. 配布物そのもの

- [ ] 配布するZIPを最終版として固定した
- [ ] ZIP内の全File一覧を作った
- [ ] 外部Binary / WASM / Model / Weight / Font / Image / Libraryを洗い出した
- [ ] 出所不明Fileが0件である
- [ ] 各外部ComponentのVersion/Commit/Hashを記録した

## B. Application License

- [ ] 既存`LICENSE`の条件を確認した
- [ ] License変更が必要かを監査した
- [ ] 不要なら勝手にLicenseを変更していない
- [ ] Copyright/Noticeを必要な場所へ含めた

## C. EngineとEvaluationを別々に確認

- [ ] Engine本体のLicenseを一次資料で確認した
- [ ] Evaluation File / NNUE / Model / Weightの権利を別Componentとして確認した
- [ ] 「EngineがGPLだからWeightもGPL」と推定していない
- [ ] Commercial Use条件を確認した
- [ ] Modification条件を確認した
- [ ] Redistribution条件を確認した
- [ ] Bundling条件を確認した
- [ ] Attribution/Notice条件を確認した
- [ ] Patent/Trademark記載を確認した

## D. GPL系Componentを配る場合

- [ ] GPLのLicense本文/Noticeを必要な形で含めた
- [ ] Modified/Unmodifiedを記録した
- [ ] Binaryと対応するCorresponding Sourceを特定した
- [ ] Build Script/Build Optionを保存した
- [ ] Source提供方法を決めた
- [ ] JavaScript/Applicationとの結合方法を記録した
- [ ] AggregateかCombined Workか法的に不明なら専門家確認を行う
- [ ] Application全体のLicense影響を推測だけで決めていない

## E. Public / Commercial

- [ ] Personal UseとPublic Distributionを別判定した
- [ ] Public DistributionとCommercial Distributionを別判定した
- [ ] 「無料だからOK」「販売だからNG」の単純化をしていない
- [ ] 未解決論点があれば`LEGAL REVIEW REQUIRED`としてReleaseを止める

## Ver.1.8正式ZIPの現状

- Personal Use Readiness: **READY**
- Public Distribution License Gate: **READY for this exact ZIP**
- Commercial Distribution License Gate: **READY for this exact ZIP**
- YaneuraOu Binary/WASM bundled: **NO**
- External Evaluation Weight bundled: **NO**
- Unknown-license Asset bundled: **NO**
- Existing Application License changed: **NO**

上記READYは「このZIPに含まれるComponentのLicense Gateで未解決外部Assetがない」という意味であり、特定地域の全法令・商標・契約等について100%合法を保証する法律意見ではない。将来YaneuraOuや第三者Modelを同梱すると判定は再監査となる。
