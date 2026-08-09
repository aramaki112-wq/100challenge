# Review Checklist — Ver.1.6

## Source of Truth

- [x] Ver.1.4.1 ZIPを正式Source of Truthとして展開した
- [x] 元File数を記録した
- [x] baseline SHA-256 manifestを作成した
- [x] LICENSEを変更していない
- [x] ReplayScrollPolicyを不用意に変更していない
- [x] GameReviewをEngine都合で変更していない

## Checkpoint 1

- [x] FACT記入例をplaceholderで追加
- [x] INTERPRETATION記入例をplaceholderで追加
- [x] HYPOTHESIS記入例をplaceholderで追加
- [x] 例文が保存値へ混ざらない
- [x] 駒の五角形を維持
- [x] 同じviewBox内で角へ軽い丸み
- [x] Square Size不変
- [x] 2文字駒Size不変
- [x] Board Flip / Snapshot regression

## Engine Boundary

- [x] ShogiEnginePort
- [x] Adapter contract
- [x] YaneuraOu Adapter
- [x] USI protocol isolation
- [x] SFEN mapper
- [x] USI move mapper
- [x] MultiPV parse model
- [x] Browser Worker transport
- [x] Node child process transport
- [x] Engine missing graceful degradation

## Analysis

- [x] Player perspective normalize
- [x] 先手/後手 sign test
- [x] Evaluation delta
- [x] Mate transition separate from CP
- [x] Metadata
- [x] Settings preset
- [x] Re-analysis history
- [x] Cancel
- [x] Initialization error
- [x] Analysis error

## Candidate

- [x] Major dropoff
- [x] Review candidate
- [x] Good move candidate
- [x] Best move match
- [x] Shape change scoring
- [x] Near-position duplicate suppression
- [x] Primary max 5
- [x] Candidate -> Replay
- [x] Candidate -> KeyPosition
- [x] Auto KeyPositionなし
- [x] Manual KeyPosition維持

## Persistence / Compatibility

- [x] Engine Analysisは別Repository
- [x] 別LocalStorage key
- [x] GameReview Backup schema 1維持
- [x] Existing Backup / Restore regression
- [x] Markdown Export regression
- [x] Observation Card rule維持

## Browser

- [x] 390×844 automation
- [x] Engine status/progress
- [x] Candidate display
- [x] Candidate -> replay
- [x] Candidate -> KeyPosition
- [x] cancel
- [x] Replay Scroll
- [x] Fixed Grid
- [x] 成桂/成香/成銀/馬/龍
- [x] Flip
- [x] Snapshot
- [x] Touch target checks in existing verifier
- [ ] Real Engine Browser E2E（未実施）
- [ ] Smartphone実機でのReal Engine発熱/Battery/Memory（未実施）

## License

- [x] YaneuraOu GPLv3確認
- [x] public Releaseとdevelopment lineを分離
- [x] 水匠11頒布状態を公式Sourceで確認
- [x] 水匠11再配布条件を不明のまま許可扱いしない
- [x] Engine binary/modelをZIPへ同梱しない
- [x] Application LICENSEを維持
