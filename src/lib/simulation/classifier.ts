import type { RateSchedule } from '../types';
import { DEFAULT_RATE_SCHEDULE } from '../types';

export function classifyRate(date: Date, schedule: RateSchedule = DEFAULT_RATE_SCHEDULE): string {
  const hour = date.getHours();
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  return isWeekend ? schedule.weekendSchedule[hour] : schedule.weekdaySchedule[hour];
}

export function getConsumptionRate(date: Date, schedule: RateSchedule): number {
  const tierId = classifyRate(date, schedule);
  const tier = schedule.tiers.find(t => t.id === tierId);
  return tier?.rate ?? 0;
}
