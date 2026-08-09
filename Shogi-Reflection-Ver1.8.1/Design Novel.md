# Ver.1.8 Design Novel — Engineを答えではなく鏡にする

棋譜を振り返るとき、欲しいのは「47手目は間違いだった」という判決だけではない。

本当に役立つのは、その局面へ戻り、自分が指した手と、別の可能性を盤面で並べて考えることだ。

Ver.1.8では、Candidateを二つに分けた。良かった手と、考え直したい手。どちらも最大5件で、数字合わせのために水増しはしない。悪かった手にはEngine推奨、推奨評価、実戦後評価、その差、短い読み筋を添える。

しかしCardを読んだだけでは振り返りは終わらない。

「局面を見る」を押す。新しいEngine専用盤は開かない。これまで使ってきたReplayがその手数へ進み、Current Move、Snapshot、Board、Move List Highlightが同時に更新される。そして、この操作だけは盤面が見える位置まで画面が動く。

そこから先は本人の仕事である。

なぜその手を選んだのか。相手の何を見落としたのか。Engine推奨手はなぜ候補に入らなかったのか。盤面を見て必要だと思ったときだけ重要局面へ追加し、STEP4でFACT、INTERPRETATION、HYPOTHESISを書く。

Engineは答えを押し付ける先生ではない。自分の思考との差を見せる鏡である。

もう一つ、Ver.1.8には別の境界がある。YaneuraOuは強力だが、「Sourceが公開されている」と「このApplicationへ安全にBundleできる」は同じではない。Source、WASM、Evaluation、Build Toolchain、Corresponding Source。それぞれを説明できなければ正式配布物へ入れない。

今回はV9.00 MATERIAL WASMへの道筋をArchitectureとして作った。しかしBuild環境にEmscriptenが無く、本物のWASMを実行できなかった。だから「完成した」と名前だけ先へ進めない。

最強Engineを急いで載せるより、交換できる境界、止められる探索、壊れないReplay、説明できるLicenseを先に整える。

その上で本物のYaneuraOuが入ったとき、Applicationの中心は変わらない。

**Engineの答えを見ることではなく、その差から自分の思考を振り返ること。**
