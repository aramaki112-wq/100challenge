# 100アプリチャレンジ Interlude — Shogi Reflection Ver.1.6

## Theme

**交換可能な外部能力として将棋EngineをApplicationへ接続する。**

## Problem

手動振り返りでは、初心者・中級者ほど「どの局面を振り返るべきか」を探す負担が大きい。
Engineで候補を絞りたいが、特定Engineへ密結合すると更新・License・Browser/Smartphone負荷の問題が生じる。

## Challenge

- Ver.1.4.1をSource of Truthとして壊さない。
- Engine Port / Adapterを設計する。
- USIをApplication Domainへ漏らさない。
- Evaluation perspectiveを正規化する。
- MateをCPと分離する。
- CandidateをRule-based Rankingする。
- 良かった可能性も扱う。
- 3〜5件中心へ絞る。
- User final selectionを残す。
- EngineなしでもAppを使える。
- Version Metadata / Re-analysisを可能にする。
- License Boundaryを明文化する。
- Fixed Grid / Replay ScrollをRegressionさせない。

## Definition of Done

- Engine Architecture docs
- License audit
- Candidate design
- Automated tests
- Browser Mock E2E
- Source of Truth audit
- Completion Report
- full ZIP
- ZIP extracted retest

Real Engineが実行できない場合は、MockのみでReal Engine確認済みと書かない。
