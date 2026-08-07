import {
  ERROR_CODES,
  createApplicationError,
  wrapUnexpectedError
} from "./DiagnosisErrors.js";
import { assertClock, readClockNow } from "./Clock.js";
import {
  assertDiagnosisExecutionDataSnapshotService
} from "./DiagnosisExecutionDataSnapshotService.js";

function deepFreeze(value) {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function fileDate(dateTime) {
  return dateTime.slice(0, 10);
}

export class DiagnosisExecutionDataJsonExporter {
  #snapshotService;
  #clock;

  constructor({ snapshotService, clock } = {}) {
    this.#snapshotService = assertDiagnosisExecutionDataSnapshotService(
      snapshotService
    );
    this.#clock = assertClock(clock);
    Object.freeze(this);
  }

  execute({ pretty = true, exportedAt = null } = {}) {
    if (typeof pretty !== "boolean") {
      throw createApplicationError(
        ERROR_CODES.INVALID_EXTERNAL_DATA_EXPORT_SERVICE,
        "pretty must be a boolean.",
        { pretty }
      );
    }

    try {
      const timestamp = exportedAt ?? readClockNow(this.#clock);
      const snapshot = this.#snapshotService.createSnapshot({
        exportedAt: timestamp
      });
      const validation = this.#snapshotService.validateSnapshot(snapshot);
      const jsonText = JSON.stringify(snapshot, null, pretty ? 2 : 0);

      return deepFreeze({
        fileName: `DAY29-to-DAY30-external-data-${fileDate(timestamp)}.json`,
        exportedAt: timestamp,
        jsonText,
        snapshot,
        count: validation.count,
        summaries: validation.summaries
      });
    } catch (error) {
      if (error?.code) throw error;
      throw createApplicationError(
        ERROR_CODES.EXTERNAL_DATA_EXPORT_FAILED,
        "External diagnosis data could not be exported.",
        {},
        wrapUnexpectedError(error, {
          component: "DiagnosisExecutionDataJsonExporter"
        })
      );
    }
  }
}

export function assertDiagnosisExecutionDataJsonExporter(value) {
  if (
    value === null ||
    typeof value !== "object" ||
    typeof value.execute !== "function"
  ) {
    throw createApplicationError(
      ERROR_CODES.INVALID_EXTERNAL_DATA_EXPORT_SERVICE,
      "value does not satisfy the external data exporter contract.",
      {}
    );
  }
  return value;
}
