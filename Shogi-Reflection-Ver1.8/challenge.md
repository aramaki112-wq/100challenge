# Shogi Reflection Interlude — Ver.1.8 Challenge

## Challenge

Ver.1.7をSource of Truthとして、大規模なDomain再構成をせず次を同時成立させる。

1. MockではなくLocal Real Engineで実局面を解析する。
2. EngineはKeyPositionの判定者ではなくReview Candidate提示者に留める。
3. STEP3を「解析→候補→Replay確認」の順にする。
4. Board Flipを盤面操作列へ移し390px前後でも横scrollさせない。
5. Smartphoneでは最大棋力よりStability/Memory/Responsiveness/Cancelを優先する。
6. 外部Engine/ModelのLicenseをArchitecture Gateとして扱う。
7. 権利不明Assetを正式ZIPへ混入させない。

## Non-goals

- 最強棋力の保証
- AIによるFACT/INTERPRETATION/HYPOTHESIS自動生成
- Candidate専用Board/KeyPosition Domain
- STEP8追加
- third-party Engine/Weightを出所不明のままBundling
- Physical iPhoneの性能保証

## Completion Flow

```text
KIF -> Save -> STEP3 -> Real Local Engine -> Progress
-> Candidate -> Replay -> User Decision -> KeyPosition
-> STEP4 -> Reflection -> Observation Theme -> Rule -> Report
```
