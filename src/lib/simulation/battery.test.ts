import { describe, it, expect } from 'vitest';
import { simulateBattery } from './battery';
import type { EnergyInterval, BatteryConfig, RateSchedule } from '../types';
import { DEFAULT_RATE_SCHEDULE } from '../types';

const defaultBatteryConfig: BatteryConfig = {
  capacityKwh: 10,
  usableCapacityPercent: 100,
  roundTripEfficiencyPercent: 100, // 100% for easy test math
  purchasePrice: 6000,
  lifespanYears: 15,
};

const defaultRateSchedule: RateSchedule = DEFAULT_RATE_SCHEDULE;

describe('simulateBattery', () => {
  it('charges battery from excess solar injection', () => {
    const intervals: EnergyInterval[] = [
      {
        startTime: new Date('2026-01-12T12:00:00'),
        endTime: new Date('2026-01-12T12:15:00'),
        consumptionKwh: 0,
        injectionKwh: 2,
      },
    ];

    const result = simulateBattery(intervals, defaultBatteryConfig, defaultRateSchedule);
    expect(result.dailyResults[0].batteryChargedKwh).toBe(2);
  });

  it('discharges battery for consumption', () => {
    const intervals: EnergyInterval[] = [
      {
        startTime: new Date('2026-01-12T12:00:00'),
        endTime: new Date('2026-01-12T12:15:00'),
        consumptionKwh: 0,
        injectionKwh: 5,
      },
      {
        startTime: new Date('2026-01-12T19:00:00'),
        endTime: new Date('2026-01-12T19:15:00'),
        consumptionKwh: 3,
        injectionKwh: 0,
      },
    ];

    const result = simulateBattery(intervals, defaultBatteryConfig, defaultRateSchedule);
    expect(result.dailyResults[0].batteryDischargedKwh).toBe(3);
  });

  it('respects battery capacity limits', () => {
    const intervals: EnergyInterval[] = [
      {
        startTime: new Date('2026-01-12T12:00:00'),
        endTime: new Date('2026-01-12T12:15:00'),
        consumptionKwh: 0,
        injectionKwh: 15, // More than 10 kWh capacity
      },
    ];

    const config = { ...defaultBatteryConfig, capacityKwh: 10 };
    const result = simulateBattery(intervals, config, defaultRateSchedule);
    expect(result.dailyResults[0].batteryChargedKwh).toBe(10);
  });

  it('calculates savings correctly', () => {
    // Inject 5 kWh at dal time (would get €0.05/kWh = €0.25 injection revenue)
    // Use 5 kWh at peak time (would cost €0.35/kWh = €1.75)
    // With battery: store the 5 kWh, use it later
    // Savings = €1.75 (avoided purchase) - €0.25 (lost injection) = €1.50
    const intervals: EnergyInterval[] = [
      {
        startTime: new Date('2026-01-12T12:00:00'), // dal on weekday
        endTime: new Date('2026-01-12T12:15:00'),
        consumptionKwh: 0,
        injectionKwh: 5,
      },
      {
        startTime: new Date('2026-01-12T19:00:00'), // peak on weekday
        endTime: new Date('2026-01-12T19:15:00'),
        consumptionKwh: 5,
        injectionKwh: 0,
      },
    ];

    const result = simulateBattery(intervals, defaultBatteryConfig, defaultRateSchedule);

    // Without battery: pay €1.75 for consumption, receive €0.25 for injection = net €1.50
    // With battery: pay €0 (use stored), receive €0 (stored instead) = net €0
    expect(result.costWithoutBattery).toBeCloseTo(1.50, 2);
    expect(result.costWithBattery).toBeCloseTo(0, 2);
  });

  it('calculates payback period', () => {
    const intervals: EnergyInterval[] = [];
    // Create a year of data with daily pattern: inject in day, consume at night
    for (let day = 0; day < 365; day++) {
      const date = new Date(2026, 0, 1 + day);
      intervals.push(
        {
          startTime: new Date(date.setHours(12, 0, 0)),
          endTime: new Date(date.setHours(12, 15, 0)),
          consumptionKwh: 0,
          injectionKwh: 10,
        },
        {
          startTime: new Date(date.setHours(19, 0, 0)),
          endTime: new Date(date.setHours(19, 15, 0)),
          consumptionKwh: 10,
          injectionKwh: 0,
        }
      );
    }

    const config = { ...defaultBatteryConfig, purchasePrice: 3000 };
    const result = simulateBattery(intervals, config, defaultRateSchedule);

    // Should have positive savings and finite payback
    expect(result.annualSavings).toBeGreaterThan(0);
    expect(result.paybackYears).toBeGreaterThan(0);
    expect(result.paybackYears).toBeLessThan(100);
  });
});
