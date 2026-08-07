import test from "node:test";
import assert from "node:assert/strict";
import { DiagnosisExecutionDataCsvBundleBuilder } from "./DiagnosisExecutionDataCsvBundleBuilder.js";

const csv = {
  settings: `capacityScenarioId,targetMonth,generatedAt,defaultFactoryId,standardShiftMinutes,standardDayMinutes,quantityPrecision\nCAP-01,2026-08,2026-08-02T06:00:00+09:00,F-01,420,840,2\n`,
  capacityBuckets: `factoryId,equipmentId,date,shiftId,availableMinutes,availabilityStatus,workerStatus,skillStatus,assignmentStatus,reasonCodes,dataConfidence\nF-01,EQ-01,2026-08-03,,420,AVAILABLE,SATISFIED,SATISFIED,SATISFIED,,A\n`,
  equipments: `equipmentId,factoryId,name\nEQ-01,F-01,設備1\n`,
  orders: `orderId,priority,dueDate,productGroup,materialGroup,dimensionGroup,outsideDiameter,wallThickness,processingType,difficultyClass,operationType\nORD-01,1,2026-08-10,PIPE-A,SUS,OD100,100,5,COLD,NORMAL,DRAW\n`,
  routingOperations: `routingOperationId,routingId,sequence\nROP-01,ROUTING-01,1\n`,
  shifts: `shiftId,sequence\nS1,1\n`,
  capacityRules: `capacityRuleId,equipmentId,source,active,priority,validFrom,validTo,plannedOperationId,productGroup,materialGroup,dimensionGroup,outsideDiameter,wallThickness,processingType,difficultyClass,operationType,capacityValue,quantityUnit,capacityBasis,capacityMultiplier\nCR-01,EQ-01,DEFAULT_RULE,TRUE,100,2026-01-01,2026-12-31,,,,,,,,,,10,PIECE,HOUR,1\n`,
  operationFactories: `plannedOperationId,factoryId\nPOP-01,F-01\n`,
  revisions: `scope,key,value\nCAPACITY_SOURCE,capacity,1\nCAPACITY_SOURCE,calendar,2\nEXTERNAL_INPUT,routing,3\n`
};

function build(overrides = {}) {
  return new DiagnosisExecutionDataCsvBundleBuilder().build({
    settingsCsv: csv.settings,
    capacityBucketsCsv: csv.capacityBuckets,
    equipmentsCsv: csv.equipments,
    ordersCsv: csv.orders,
    routingOperationsCsv: csv.routingOperations,
    shiftsCsv: csv.shifts,
    capacityRulesCsv: csv.capacityRules,
    operationFactoriesCsv: csv.operationFactories,
    revisionsCsv: csv.revisions,
    exportedAt: "2026-08-02T09:30:00+09:00",
    ...overrides
  });
}

test("Excel由来CSV一式から正式外部Data JSONを生成する", () => {
  const result = build();
  const parsed = JSON.parse(result.jsonText);
  assert.equal(parsed.application, "DAY30_DIAGNOSIS_EXECUTION_DATA");
  assert.equal(parsed.items[0].capacitySnapshot.buckets[0].availableMinutes, 420);
  assert.equal(parsed.items[0].capacityRules[0].capacityValue, 10);
  assert.equal(result.summary.capacityRuleCount, 1);
});

test("availableMinutes空欄はnullとして保持する", () => {
  const result = build({
    capacityBucketsCsv: `factoryId,equipmentId,date,shiftId,availableMinutes,availabilityStatus,workerStatus,skillStatus,assignmentStatus,reasonCodes,dataConfidence\nF-01,EQ-01,2026-08-03,,,UNKNOWN,UNKNOWN,UNKNOWN,UNKNOWN,DATA_NOT_READY,C\n`
  });
  assert.equal(result.snapshot.items[0].capacitySnapshot.buckets[0].availableMinutes, null);
});

test("Header順序の違いを拒否する", () => {
  assert.throws(
    () => build({ settingsCsv: `targetMonth,capacityScenarioId\n2026-08,CAP-01\n` }),
    (error) => error.code === "EXTERNAL_DATA_CSV_BUNDLE_VALIDATION_FAILED"
  );
});

test("CAPACITY_SOURCE Revisionなしを拒否する", () => {
  assert.throws(
    () => build({ revisionsCsv: `scope,key,value\nEXTERNAL_INPUT,routing,1\n` }),
    (error) => error.code === "EXTERNAL_DATA_CSV_BUNDLE_VALIDATION_FAILED"
  );
});

test("不整合Capacity BucketをDomainで拒否する", () => {
  assert.throws(
    () => build({
      capacityBucketsCsv: `factoryId,equipmentId,date,shiftId,availableMinutes,availabilityStatus,workerStatus,skillStatus,assignmentStatus,reasonCodes,dataConfidence\nF-01,EQ-01,2026-08-03,,420,UNAVAILABLE,SATISFIED,SATISFIED,SATISFIED,,A\n`
    }),
    (error) => error.code === "EXTERNAL_DATA_CSV_BUNDLE_VALIDATION_FAILED"
  );
});
