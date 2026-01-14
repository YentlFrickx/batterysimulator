export interface EnergyInterval {
  startTime: Date;
  endTime: Date;
  consumptionKwh: number;
  injectionKwh: number;
}

export interface RateConfig {
  peakRate: number;      // €/kWh
  dalRate: number;       // €/kWh
  superDalRate: number;  // €/kWh
  injectionRate: number; // €/kWh
}

export interface BatteryConfig {
  capacityKwh: number;
  usableCapacityPercent: number;
  roundTripEfficiencyPercent: number;
  purchasePrice: number;
  lifespanYears: number;
}

export interface SimulationResult {
  totalConsumptionKwh: number;
  totalInjectionKwh: number;
  costWithoutBattery: number;
  costWithBattery: number;
  annualSavings: number;
  paybackYears: number;
  selfConsumptionBefore: number;  // percentage
  selfConsumptionAfter: number;   // percentage
  gridReductionPercent: number;
  dailyResults: DailyResult[];
}

export interface DailyResult {
  date: Date;
  consumptionKwh: number;
  injectionKwh: number;
  batteryChargedKwh: number;
  batteryDischargedKwh: number;
  gridPurchasedKwh: number;
  costWithoutBattery: number;
  costWithBattery: number;
}

export type RateTier = 'peak' | 'dal' | 'superDal';
