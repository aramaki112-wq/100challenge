import { CapacityRuleSelector } from "./CapacityRuleSelector.js";
import { EquipmentCapacityRule } from "./EquipmentCapacityRule.js";
import { EquipmentMasterRecord } from "./EquipmentMasterRecord.js";
import { ProductionOrder } from "./ProductionOrder.js";
import { Routing } from "./Routing.js";
import { REASON_CODES } from "./Day29Constants.js";

function sortOrders(a, b) { return a.priority - b.priority || a.dueDate.localeCompare(b.dueDate) || a.orderId.localeCompare(b.orderId); }
function sortBuckets(a, b) { return a.startAt.localeCompare(b.startAt) || a.equipmentId.localeCompare(b.equipmentId); }

export class RunProductionSimulation {
  constructor({ capacityRuleSelector = new CapacityRuleSelector() } = {}) { this.capacityRuleSelector = capacityRuleSelector; }

  execute({ scenarioId, data, capacityResult }) {
    const orders = (data.orders ?? []).map((item) => item instanceof ProductionOrder ? item : new ProductionOrder(item)).sort(sortOrders);
    const routings = (data.routings ?? []).map((item) => item instanceof Routing ? item : new Routing(item));
    const equipment = (data.equipmentMasters ?? []).map((item) => item instanceof EquipmentMasterRecord ? item : new EquipmentMasterRecord(item));
    const rules = (data.capacityRules ?? []).map((item) => item instanceof EquipmentCapacityRule ? item : new EquipmentCapacityRule(item));
    const buckets = capacityResult.capacityBuckets.map((item) => ({ ...item })).sort(sortBuckets);
    const allocations = [];
    const orderResults = [];
    const operationResults = [];

    for (const order of orders) {
      const routing = routings.find((item) => item.routingId === order.routingId);
      if (!routing) {
        orderResults.push({ orderId: order.orderId, requiredQuantity: order.requiredQuantity, achievedQuantity: 0, unprocessedQuantity: order.requiredQuantity, dueDate: order.dueDate, dueDateMet: false, completionAt: null, reasonCode: REASON_CODES.ROUTING_MISSING });
        continue;
      }
      let readyAt = `${capacityResult.month}-01T00:00:00`;
      let finalAchieved = order.requiredQuantity;
      let orderCompletionAt = null;
      let failureReason = null;
      for (const operation of routing.operations) {
        let remaining = Math.max(0, order.requiredQuantity - (operation.sequence === 1 ? order.initialWip : 0));
        let achieved = order.requiredQuantity - remaining;
        const candidateBuckets = buckets.filter((bucket) => operation.eligibleEquipmentIds.includes(bucket.equipmentId) && bucket.startAt >= readyAt && bucket.remainingMinutes > 0);
        for (const bucket of candidateBuckets) {
          if (remaining <= 1e-9) break;
          const equipmentRecord = equipment.find((item) => item.equipmentId === bucket.equipmentId);
          let rule = null;
          try { rule = this.capacityRuleSelector.select({ rules, equipment: equipmentRecord, date: bucket.date, context: order.attributes }); }
          catch (error) { failureReason = error.code; continue; }
          if (!rule || rule.unit !== order.unit) { failureReason = REASON_CODES.MISSING_CAPACITY_RULE; continue; }
          const quantityForRemainingTime = rule.calculateQuantity({ availableMinutes: bucket.remainingMinutes, shiftMinutes: bucket.shiftMinutes, standardDailyMinutes: bucket.standardDailyMinutes, calendarMultiplier: bucket.calendarMultiplier });
          if (quantityForRemainingTime <= 0) continue;
          const quantity = Math.min(remaining, quantityForRemainingTime);
          const minutesUsed = bucket.remainingMinutes * (quantity / quantityForRemainingTime);
          bucket.remainingMinutes -= minutesUsed;
          remaining -= quantity;
          achieved += quantity;
          orderCompletionAt = bucket.endAt;
          allocations.push({ scenarioId, orderId: order.orderId, operationId: operation.operationId, processId: operation.processId, equipmentId: bucket.equipmentId, bucketId: bucket.bucketId, date: bucket.date, shiftId: bucket.shiftId, quantity, minutesUsed, capacityRuleId: rule.capacityRuleId });
        }
        const unprocessed = Math.max(0, remaining);
        operationResults.push({ orderId: order.orderId, operationId: operation.operationId, processId: operation.processId, requiredQuantity: order.requiredQuantity, achievedQuantity: achieved, unprocessedQuantity: unprocessed, completionAt: unprocessed <= 1e-9 ? orderCompletionAt : null, reasonCode: unprocessed <= 1e-9 ? null : (failureReason ?? REASON_CODES.OVERLOAD) });
        if (unprocessed > 1e-9) {
          finalAchieved = Math.min(finalAchieved, achieved);
          failureReason = failureReason ?? REASON_CODES.OVERLOAD;
          break;
        }
        readyAt = orderCompletionAt ?? readyAt;
      }
      const unprocessedQuantity = Math.max(0, order.requiredQuantity - finalAchieved);
      const dueDateMet = unprocessedQuantity <= 1e-9 && orderCompletionAt != null && orderCompletionAt.slice(0, 10) <= order.dueDate;
      orderResults.push({ orderId: order.orderId, requiredQuantity: order.requiredQuantity, achievedQuantity: finalAchieved, unprocessedQuantity, dueDate: order.dueDate, dueDateMet, completionAt: unprocessedQuantity <= 1e-9 ? orderCompletionAt : null, reasonCode: unprocessedQuantity <= 1e-9 ? (dueDateMet ? null : "DUE_DATE_EXCEEDED") : failureReason });
    }

    const usedMinutesByBucket = new Map();
    for (const allocation of allocations) usedMinutesByBucket.set(allocation.bucketId, (usedMinutesByBucket.get(allocation.bucketId) ?? 0) + allocation.minutesUsed);
    const equipmentUsage = equipment.map((item) => {
      const equipmentBuckets = buckets.filter((bucket) => bucket.equipmentId === item.equipmentId);
      const availableMinutes = equipmentBuckets.reduce((sum, bucket) => sum + bucket.availableMinutes, 0);
      const remainingMinutes = equipmentBuckets.reduce((sum, bucket) => sum + bucket.remainingMinutes, 0);
      const usedMinutes = availableMinutes - remainingMinutes;
      return { equipmentId: item.equipmentId, processId: item.processId, availableMinutes, usedMinutes, remainingMinutes, utilization: availableMinutes === 0 ? 0 : usedMinutes / availableMinutes };
    });
    const constrainedOperations = operationResults.filter((item) => item.unprocessedQuantity > 1e-9).sort((a, b) => b.unprocessedQuantity - a.unprocessedQuantity);
    const highestUtilization = [...equipmentUsage].sort((a, b) => b.utilization - a.utilization || a.equipmentId.localeCompare(b.equipmentId))[0] ?? null;
    const bottleneckProcessId = constrainedOperations[0]?.processId ?? highestUtilization?.processId ?? null;
    const bottleneckEquipmentId = highestUtilization?.equipmentId ?? null;
    const unprocessedQuantity = orderResults.reduce((sum, item) => sum + item.unprocessedQuantity, 0);
    const achievedQuantity = orderResults.reduce((sum, item) => sum + item.achievedQuantity, 0);
    const overloadDates = [...new Set(orderResults.filter((item) => item.unprocessedQuantity > 0 || !item.dueDateMet).map((item) => item.dueDate))].sort();
    const impossiblePeriods = constrainedOperations.map((item) => ({ orderId: item.orderId, operationId: item.operationId, processId: item.processId, reasonCode: item.reasonCode }));

    return { scenarioId, orderResults, operationResults, allocations, equipmentUsage, achievedQuantity, unprocessedQuantity, usedCapacityMinutes: allocations.reduce((sum, item) => sum + item.minutesUsed, 0), remainingCapacityMinutes: buckets.reduce((sum, item) => sum + item.remainingMinutes, 0), overloadDates, impossiblePeriods, bottleneckEquipmentId, bottleneckProcessId, primaryConstraintReason: constrainedOperations[0]?.reasonCode ?? null, dueDateAchievementRate: orderResults.length === 0 ? 0 : orderResults.filter((item) => item.dueDateMet).length / orderResults.length, buckets };
  }
}
