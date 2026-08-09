# Ver.1.8 Design Novel — Engineを入れる前に、境界を守る

強いEngineを見つけてBrowserへ載せれば終わり、ではなかった。

将棋振り返りアプリが欲しいのは、対局中の代わりに考えてくれる王様ではない。終局後、「ここはもう一度見た方がよさそうだ」と静かに印を付けてくれる案内役である。

Ver.1.7までに、その案内役が立つ場所は作ってあった。`ShogiEnginePort`という扉である。Ver.1.8では、その扉を壊さずに本物のEngineを入れる。

最初に調べたのは、やねうら王だった。強く、USIに対応し、WASMへの道もSourceに残っている。しかし「Sourceが公開されている」と「このZIPへ安全に入れられる」は同じではない。Engine本体のLicense、Evaluation Weight、Build Toolchain、BinaryとSourceの対応、配布時のSource提供。棋力以外にも盤上には駒が並んでいた。

そこで一手を急がない。

正式ZIPには出所の説明できないBinaryを入れない。まずApplication自身の軽量EngineをWorkerに置いた。強豪Engineほど深くは読めない。それでも局面を読み、候補手を作り、評価値を返し、棋譜を通して候補局面を探せる。Mockではない。しかもSourceもLicenseもこのApplicationの中にある。

強さを諦めたのではない。交換できるようにしたのである。

将来、やねうら王WASMのBuildとEvaluation Fileの権利が揃えば、扉の外側だけを交換する。Replayはそのまま。KeyPositionもそのまま。本人がFACTを書く場所も変わらない。

画面の順序も同じ思想で直した。STEP3を開けば、まずEngine Panelがある。「解析する」。候補が出る。「局面を見る」。その下にある、いつものReplay盤へ移る。盤面を反転したければ、前・次・最初・最後と同じ場所に反転ボタンがある。

Engineは局面を選ぶ材料を出す。しかし最後に「これは自分の重要局面だ」と決めるのは本人である。

Ver.1.8で作ったのは最強Engineではない。

**強さ・権利・資源・人間の判断を、それぞれ正しい境界へ置いたEngine Integration**である。
