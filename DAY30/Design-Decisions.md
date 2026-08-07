# DAY30 Design Decisions

## DD-01 DAY29 Capacityを再計算しない

DAY30はDAY29の責任を取り込まず、`CapacitySnapshot`として読み取ります。

## DD-02 Production PlanとDiagnosis Resultを分離する

Planは入力、Diagnosis ResultはDerived Resultです。診断結果をPlanへ書き戻しません。

## DD-03 UNKNOWNを0へ変換しない

未確認Capacity、未登録Rule、未確認Assumptionは判断不能として残します。

## DD-04 確認済み不成立をUNKNOWNへ弱めない

Capacity 0分やREJECTED blocking Assumptionなど、確定した不成立は`INFEASIBLE`です。

## DD-05 Assumptionを独立Entityにする

材料到着・設備復旧・応援配置などの前提をPlanやCapacityへ埋め込みません。

## DD-06 EXPECTEDとCONFIRMEDを分ける

見込みを事実として扱わないため、Evidence、確認者、確認日時を管理します。

## DD-07 Capacity Ledgerを診断Run内だけで使う

Capacity Allocationは保存Planではなく、診断中の一時的な割当台帳です。

## DD-08 Operation順序を決定論的に固定する

入力配列順ではなく、粒度、Priority、納期、Routing、IDで並べます。

## DD-09 Capacity Rule競合を黙って解決しない

同順位・同具体性のRuleは`CONFLICT`です。

## DD-10 Routing同日順序を推測しない

時刻やShift順がなければ`UNKNOWN`です。

## DD-11 Model外条件を係数へ押し込まない

DIRECT_MODEL、ASSUMPTION、UNMODELEDを分けます。

## DD-12 Diagnosis StatusとResult Validityを分ける

当時FEASIBLEでも、入力変更後はSTALEになり得ます。

## DD-13 Revision後退はINVALID

単なる古いDataとはみなさず、履歴整合性不明として扱います。

## DD-14 ImportはPreviewとCommitを分離する

File選択だけでは保存しません。CommitはTransaction内で原子的に行います。

## DD-15 Relationを独立保存する

Assumption本体とScenarioへの適用を分け、意図しない自動適用を防ぎます。

## DD-16 Read Modelを画面専用にする

Browser ControllerがDomain EntityやRepository内部構造へ直接依存しないようにします。

## DD-17 画面Stateを不変にする

描画処理が選択状態や診断結果を書き換えないようDeep Freezeします。

## DD-18 古い非同期応答を無視する

Request番号により、後から到着した古いResponseで現在画面を上書きしません。

## DD-19 Backup Restoreを非破壊にする

全Entity再生成と参照整合性確認が成功した場合だけRepositoryを置換します。

## DD-20 External DataのSource RevisionとLocal Revisionを分ける

Import元RevisionをLocal変更回数へ直接上書きしません。

## DD-21 Excelを第二の診断Engineにしない

Excelは入力・一次確認、JavaScriptは正式検証・JSON生成・診断を担当します。

## DD-22 Scenario差を因果効果と断定しない

差分は条件変更後の結果差であり、単独で原因を証明しません。

## DD-23 Solverを助言層に限定する

将来Solverを追加してもBase Planを自動上書きしません。

## DD-24 Manualを操作と判断の両方へ接続する

Button位置だけでなく、観察項目、判定理由、次の行動、再診断条件を説明します。
