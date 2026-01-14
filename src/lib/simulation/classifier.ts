import type { RateTier } from '../types';

export function classifyRate(date: Date): RateTier {
  const hour = date.getHours();
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Super-dal: 1:00-7:00 daily; weekends also 11:00-17:00
  const isSuperDalHour = hour >= 1 && hour < 7;
  const isWeekendMidday = isWeekend && hour >= 11 && hour < 17;

  if (isSuperDalHour || isWeekendMidday) {
    return 'superDal';
  }

  // No peak on weekends
  if (isWeekend) {
    return 'dal';
  }

  // Weekday dal: 11:00-17:00 and 22:00-1:00
  const isWeekdayDal = (hour >= 11 && hour < 17) || (hour >= 22) || (hour < 1);

  if (isWeekdayDal) {
    return 'dal';
  }

  return 'peak';
}
