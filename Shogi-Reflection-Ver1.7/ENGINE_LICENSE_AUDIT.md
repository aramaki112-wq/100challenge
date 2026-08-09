# ENGINE_LICENSE_AUDIT — Ver.1.7 Delta

## 今回のAsset監査
Ver.1.7で新規採用した駒Graphicsは`ShogiPieceSvg.js`内で作成したApplication専用SVG Geometryであり、外部画像Assetを取り込んでいない。既存Application `LICENSE`は変更しない。

| Asset | Source | License扱い | Commercial Use | Redistribution | Modification | Attribution | Bundling |
|---|---|---|---|---|---|---|---|
| Ver.1.7 Piece SVG Geometry | Application内オリジナル実装 | 既存Application LICENSEの範囲 | 既存LICENSEに従う | 既存LICENSEに従う | 既存LICENSEに従う | 既存LICENSEに従う | Yes |
| Piece Font File | 同梱なし | N/A | N/A | N/A | N/A | N/A | No |
| External Piece Image | 使用なし | N/A | N/A | N/A | N/A | N/A | No |

CSSはOSに存在するJapanese Serif系System Font名をFont Stackとして参照するだけで、Font FileをApplicationへコピー・再配布しない。`@font-face`も追加しない。

## Engine側
Ver.1.7は実Engine Binary / Evaluation Modelを新規同梱しない。Ver.1.6のEngine License分離方針を維持し、今回のUI移動を理由に外部Engine AssetのLicense状態を変更しない。外部Engineを将来Bundleする場合は、その時点の配布条件を改めて確認する。

---

# ENGINE LICENSE AUDIT — Ver.1.6

監査日: 2026-08-09

> この文書は開発上のLicense境界を記録するものであり、法的助言ではない。第三者配布・販売前には対象VersionのLicense本文と配布条件を再確認する。

## 1. Application Source License

- `LICENSE` はVer.1.4.1から変更していない。
- Application Sourceは既存のMIT Licenseを維持する。
- Engine LicenseをApplication Licenseと混同しない。

## 2. YaneuraOu Source License

公式Repositoryは、やねうら王ProjectがGPLv3に従うことを明記している。

分類:

| 項目 | 判定 |
|---|---|
| Source License | GPLv3 |
| Commercial Use | GPLv3条件を満たす範囲で一般に可能。ただし個別配布物の確認が必要 |
| Binary Redistribution | GPLv3上の義務を伴うため、配布時にSource提供等のCompliance確認が必要 |
| Application MITとの混同 | 不可 |
| Ver.1.6 ZIPへのBundling | **しない** |

また公式Blogは、やねうら王実行Fileを二次配布する際、GitHubとWikiを同時に紹介してほしいという開発者からの要望を示している。

## 3. Evaluation Model License

評価FileはEngine Sourceとは別Assetであり、**ModelごとにLicenseを確認する**。

やねうら王READMEは特定の「リゼロ評価関数File」について自由利用の記載があるが、これは他の評価Fileへ自動的に一般化しない。

## 4. Suisho / 水匠

公式Wikiでは水匠11、水匠11β、水匠11α、水匠10等の頒布時期・Architectureを確認できる。
しかし、今回取得できた公式一次資料には、水匠11評価Fileを第三者Applicationへ再配布・商用Bundlingできることを包括的に確認できるLicense本文が見つからなかった。

したがってVer.1.6では:

- Redistribution Permission: **UNCONFIRMED**
- Commercial Bundling: **UNCONFIRMED**
- App ZIP Bundling: **NO**
- 推奨: Userが正規の配布元から別途取得し、将来の外部Engine設定で参照する方式

「支援者向け頒布されている」事実を「再配布許可」と読み替えない。

## 5. FukauraOu / Runtime

ふかうら王はDirectML/TensorRT等を利用する配布構成がある。
採用する場合は、Engine LicenseだけでなくCUDA、cuDNN、TensorRT、ONNX Runtime等のBundling条件を対象Versionごとに監査する必要がある。
Ver.1.6では不採用。

## 6. WebAssembly

YaneuraOuのWebAssembly build workflowが存在しても、WASM Binaryを配布する場合には、元ProjectのGPLv3義務が消えるわけではない。
WASM Worker、Glue Code、評価Fileの組み合わせごとに配布境界を再確認する。

## 7. Redistribution Policy for this App

Ver.1.6 ZIPは以下を同梱しない。

- YaneuraOu binary
- Suisho evaluation file
- NNUE/SFNN third-party evaluation file
- CUDA/TensorRT/DirectML runtime
- Remote analysis credential

したがってApplicationのMIT SourceとEngine GPLv3/Model LicenseのBundlingを今回発生させない。

## 8. Distribution before Sale Checklist

1. 採用Engineの正確なVersion/tag/commitを固定。
2. Engine LICENSE全文を確認。
3. Evaluation Modelの配布元とLicenseを確認。
4. Commercial Use、Redistribution、Bundlingを別々に確認。
5. 必要なCopyright/Notice/Source offerを準備。
6. Engine公式GitHub/Wiki等への案内を同梱。
7. Runtime Licenseを確認。
8. 法務確認が必要なら第三者専門家へ相談。
9. 不明点が残るAssetは同梱しない。

## 9. Official Sources

- https://github.com/yaneurao/YaneuraOu
- https://github.com/yaneurao/YaneuraOu/releases
- https://github.com/yaneurao/YaneuraOu/wiki/やねうら王のインストール手順
- https://yaneuraou.yaneu.com/2024/07/01/about-the-redistribution-of-yaneuraou/
- https://yaneuraou.yaneu.com/2026/05/07/wcsc36-petashock-suisho11/
