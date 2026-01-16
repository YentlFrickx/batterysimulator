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

export type RateTier = 'peak' | 'dal' | 'superDal' | string;

export interface RateTierDefinition {
  id: string;
  name: string;
  rate: number;
  color: string;
}

export type HourlySchedule = Record<number, string>;

export interface RateSchedule {
  tiers: RateTierDefinition[];
  weekdaySchedule: HourlySchedule;
  weekendSchedule: HourlySchedule;
  injectionRate: number;
}

export const DEFAULT_RATE_SCHEDULE: RateSchedule = {
  tiers: [
    { id: 'peak', name: 'Peak', rate: 0.35, color: '#FF6B6B' },
    { id: 'dal', name: 'Dal', rate: 0.28, color: '#4DABF7' },
    { id: 'superDal', name: 'Super-Dal', rate: 0.19, color: '#51CF66' },
  ],
  weekdaySchedule: {
    0: 'dal',
    1: 'superDal',
    2: 'superDal',
    3: 'superDal',
    4: 'superDal',
    5: 'superDal',
    6: 'superDal',
    7: 'peak',
    8: 'peak',
    9: 'peak',
    10: 'peak',
    11: 'dal',
    12: 'dal',
    13: 'dal',
    14: 'dal',
    15: 'dal',
    16: 'dal',
    17: 'peak',
    18: 'peak',
    19: 'peak',
    20: 'peak',
    21: 'peak',
    22: 'dal',
    23: 'dal',
  },
  weekendSchedule: {
    0: 'dal',
    1: 'superDal',
    2: 'superDal',
    3: 'superDal',
    4: 'superDal',
    5: 'superDal',
    6: 'superDal',
    7: 'dal',
    8: 'dal',
    9: 'dal',
    10: 'dal',
    11: 'superDal',
    12: 'superDal',
    13: 'superDal',
    14: 'superDal',
    15: 'superDal',
    16: 'superDal',
    17: 'dal',
    18: 'dal',
    19: 'dal',
    20: 'dal',
    21: 'dal',
    22: 'dal',
    23: 'dal',
  },
  injectionRate: 0.05,
};
