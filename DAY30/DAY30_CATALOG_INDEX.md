# DAY30 Catalog Index

| Catalog | 内容 | Source of Truth |
|---|---|---|
| [Status・Code Catalog](./DAY30_Status_Code_Catalog.md) | Status、Category、Reason、Import、Stale等の正式Code | `DiagnosisCodes.js` |
| [Error Catalog](./DAY30_Error_Catalog.md) | 全Error Code、日本語の意味、推奨対処 | `DiagnosisErrors.js` |
| [Domain Catalog](./DAY30_Domain_Catalog.md) | Entity、Result、Service、Application、Infrastructure | 各Source File |
| [Domain Event Catalog](./DAY30_Domain_Event_Catalog.md) | Aggregate別のDomain Eventと影響 | 各Entityの`*_EVENT_TYPE` |

## 正本

- 実装CodeがSource of Truthです。
- CatalogはCodeから抽出した名称を保持し、日本語説明を付けます。
- Codeを変更した場合はCatalogとManualの整合性Testを再実行します。
