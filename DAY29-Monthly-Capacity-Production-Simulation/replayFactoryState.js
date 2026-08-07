import {
  applyFactoryEvent
} from "./applyFactoryEvent.js";

export function replayFactoryState({
  initialState,
  events,
  targetTime
}) {
  const target = new Date(targetTime);
  if (Number.isNaN(target.getTime())) {
    throw new TypeError(`Invalid targetTime: ${targetTime}`);
  }

  return [...events]
    .filter((event) => new Date(event.occurredAt) <= target)
    .sort((a, b) => {
      const timeDifference =
        new Date(a.occurredAt) - new Date(b.occurredAt);
      return timeDifference !== 0
        ? timeDifference
        : String(a.eventId).localeCompare(String(b.eventId));
    })
    .reduce(
      (state, event) => applyFactoryEvent(state, event),
      structuredClone(initialState)
    );
}
