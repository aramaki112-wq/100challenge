# ENGINE_CANDIDATE_SELECTION_DESIGN — Ver.1.8

## 1. Principle

Engine Candidateは「重要局面」ではなく「考え直す価値がありそうな局面」である。

```text
Engine Candidate
  ↓
本人がReplayで確認
  ↓
本人が重要局面へ追加するか判断
```

自動KeyPosition登録は禁止する。

## 2. Input

既存Position Historyから各plyを解析し、利用者本人の手について次を比較する。

- Evaluation Before
- Evaluation After
- Evaluation Delta
- actualMove
- bestMove / candidateMoves
- depth/nodes/time metadata

Perspectiveは`EvaluationNormalizer`で本人視点へNormalizeしてから比較する。

## 3. Candidate Types

- `MAJOR_DROPOFF`: 大きく悪化した可能性
- `REVIEW_CANDIDATE`: 振り返り候補
- `GOOD_MOVE_CANDIDATE`: 良かった可能性

悪手だけのApplicationにしない。

## 4. 3〜5 Rule

Primary Candidate上限は5件。通常は3〜5件を目標にするが、短い棋譜・評価変化不足・近接重複抑制等で合理的Candidateが3件未満なら水増ししない。

UIでは候補数が3件未満の場合に理由を明示する。`otherCandidates`はAnalysis Resultに保持可能だが、STEP3主一覧はPrimary Candidateに限定する。

## 5. Ranking

既存Threshold/Rankingを維持する。

- 大きいnegative deltaを高く扱う
- band crossingを補助scoreにする
- bestmove一致かつ形勢を大きく損ねない手をGood候補にできる
- positive swingもGood候補になり得る
- 同typeで近接するplyを抑制する

Engine strengthとCandidate valueを同一視しない。

## 6. Mate

Mate gained/lost/mated-created/mated-escapedはCP差へ変換しない。既存`EvaluationDelta`のMate TransitionをCandidate reasonへ接続する。

## 7. Real Local Engine Limitation

Ver.1.8 Local EngineはMaterial中心の軽量評価であり、戦略的な序盤評価や深い終盤読みのCandidate品質を保証しない。そのためCandidate CardにはEngine評価が参考情報であることを表示する。

## 8. Candidate → Replay Integrity

Candidate `ply`を既存Replayへ渡し、以下を同一Stateから一致させる。

- ply/moveNumber
- actualMove
- Current Move
- Position
- Board
- Move List Highlight
- Snapshot source

## 9. Candidate → KeyPosition Integrity

対象Replay位置を既存KeyPosition Application Serviceへ渡す。

- 0手目拒否
- duplicate拒否
- 5件上限
- Snapshot生成
- source KIF move保持
- STEP4 edit

を手動追加と共通化する。
