import { ReplayPositionSnapshot } from "./ReplayPositionSnapshot.js";

export class ReplayPositionSnapshotSerializer {
  serialize(snapshot) {
    return JSON.stringify(ReplayPositionSnapshot.fromSnapshot(snapshot).toSnapshot());
  }

  deserialize(jsonOrObject) {
    if (jsonOrObject instanceof ReplayPositionSnapshot) return jsonOrObject;
    const source = typeof jsonOrObject === "string" ? JSON.parse(jsonOrObject) : jsonOrObject;
    return ReplayPositionSnapshot.fromSnapshot(source);
  }
}
