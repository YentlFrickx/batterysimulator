import type {
  EnergyInterval,
  BatteryConfig,
  RateSchedule,
  SimulationResult,
  DailyResult,
} from '../types';
import { classifyRate } from './classifier';

function getRate(tierId: string, schedule: RateSchedule): number {
  const tier = schedule.tiers.find(t => t.id === tierId);
  return tier?.rate ?? 0;
}

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function simulateBattery(
  intervals: EnergyInterval[],
  batteryConfig: BatteryConfig,
  rateSchedule: RateSchedule
): SimulationResult {
  const usableCapacity =
    batteryConfig.capacityKwh * (batteryConfig.usableCapacityPercent / 100);
  const efficiency = batteryConfig.roundTripEfficiencyPercent / 100;

  let batteryLevel = 0;
  let totalCostWithout = 0;
  let totalCostWith = 0;
  let totalConsumption = 0;
  let totalInjection = 0;
  let totalSolarUsedDirectly = 0;
  let totalSolarUsedViaBattery = 0;

  // Group results by day
  const dailyMap = new Map<string, DailyResult>();

  for (const interval of intervals) {
    const dateKey = formatDateKey(interval.startTime);
    const tierId = classifyRate(interval.startTime, rateSchedule);
    const rate = getRate(tierId, rateSchedule);

    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, {
        date: new Date(dateKey),
        consumptionKwh: 0,
        injectionKwh: 0,
        batteryChargedKwh: 0,
        batteryDischargedKwh: 0,
        gridPurchasedKwh: 0,
        costWithoutBattery: 0,
        costWithBattery: 0,
      });
    }
    const daily = dailyMap.get(dateKey)!;

    // Track totals
    totalConsumption += interval.consumptionKwh;
    totalInjection += interval.injectionKwh;
    daily.consumptionKwh += interval.consumptionKwh;
    daily.injectionKwh += interval.injectionKwh;

    // Cost without battery: pay for consumption, receive for injection
    const costWithout =
      interval.consumptionKwh * rate - interval.injectionKwh * rateSchedule.injectionRate;
    totalCostWithout += costWithout;
    daily.costWithoutBattery += costWithout;

    // With battery simulation
    let costWith = 0;

    // First: charge battery from injection
    if (interval.injectionKwh > 0) {
      const spaceInBattery = usableCapacity - batteryLevel;
      const canStore = Math.min(interval.injectionKwh, spaceInBattery);
      const actualStored = canStore * efficiency; // Account for charging losses

      batteryLevel += actualStored;
      daily.batteryChargedKwh += canStore;

      // Remaining injection goes to grid
      const remainingInjection = interval.injectionKwh - canStore;
      costWith -= remainingInjection * rateSchedule.injectionRate;
    }

    // Then: use battery for consumption
    if (interval.consumptionKwh > 0) {
      const canDischarge = Math.min(interval.consumptionKwh, batteryLevel);
      batteryLevel -= canDischarge;
      daily.batteryDischargedKwh += canDischarge;
      totalSolarUsedViaBattery += canDischarge;

      // Remaining consumption from grid
      const remainingConsumption = interval.consumptionKwh - canDischarge;
      costWith += remainingConsumption * rate;
      daily.gridPurchasedKwh += remainingConsumption;
    }

    totalCostWith += costWith;
    daily.costWithBattery += costWith;
  }

  // Calculate self-consumption rates
  const totalSolarProduction = totalInjection + totalSolarUsedDirectly;
  const selfConsumptionBefore =
    totalSolarProduction > 0 ? (totalSolarUsedDirectly / totalSolarProduction) * 100 : 0;

  // After battery: solar used = direct + via battery
  const totalSolarUsedAfter = totalSolarUsedDirectly + totalSolarUsedViaBattery;
  const selfConsumptionAfter =
    totalSolarProduction > 0
      ? (Math.min(totalSolarUsedAfter, totalSolarProduction) / totalSolarProduction) * 100
      : 0;

  // Calculate grid reduction
  const gridWithout = totalConsumption;
  const gridWith = Array.from(dailyMap.values()).reduce(
    (sum, d) => sum + d.gridPurchasedKwh,
    0
  );
  const gridReductionPercent =
    gridWithout > 0 ? ((gridWithout - gridWith) / gridWithout) * 100 : 0;

  // Extrapolate to annual
  const daysInData = dailyMap.size;
  const annualMultiplier = daysInData > 0 ? 365 / daysInData : 1;
  const annualSavings = (totalCostWithout - totalCostWith) * annualMultiplier;
  const paybackYears =
    annualSavings > 0 ? batteryConfig.purchasePrice / annualSavings : Infinity;

  return {
    totalConsumptionKwh: totalConsumption,
    totalInjectionKwh: totalInjection,
    costWithoutBattery: totalCostWithout,
    costWithBattery: totalCostWith,
    annualSavings,
    paybackYears,
    selfConsumptionBefore,
    selfConsumptionAfter,
    gridReductionPercent,
    dailyResults: Array.from(dailyMap.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    ),
  };
}
