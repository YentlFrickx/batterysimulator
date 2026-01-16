import { describe, it, expect } from 'vitest';
import { classifyRate, getConsumptionRate } from './classifier';
import { DEFAULT_RATE_SCHEDULE, type RateSchedule } from '../types';

describe('classifyRate', () => {
  describe('weekdays', () => {
    it('returns superDal for 3:00 on Monday', () => {
      const date = new Date('2026-01-12T03:00:00'); // Monday
      expect(classifyRate(date)).toBe('superDal');
    });

    it('returns dal for 12:00 on Monday', () => {
      const date = new Date('2026-01-12T12:00:00'); // Monday
      expect(classifyRate(date)).toBe('dal');
    });

    it('returns dal for 23:00 on Monday', () => {
      const date = new Date('2026-01-12T23:00:00'); // Monday
      expect(classifyRate(date)).toBe('dal');
    });

    it('returns peak for 8:00 on Monday', () => {
      const date = new Date('2026-01-12T08:00:00'); // Monday
      expect(classifyRate(date)).toBe('peak');
    });

    it('returns peak for 19:00 on Monday', () => {
      const date = new Date('2026-01-12T19:00:00'); // Monday
      expect(classifyRate(date)).toBe('peak');
    });
  });

  describe('weekends', () => {
    it('returns superDal for 3:00 on Saturday', () => {
      const date = new Date('2026-01-17T03:00:00'); // Saturday
      expect(classifyRate(date)).toBe('superDal');
    });

    it('returns superDal for 14:00 on Saturday', () => {
      const date = new Date('2026-01-17T14:00:00'); // Saturday
      expect(classifyRate(date)).toBe('superDal');
    });

    it('returns dal for 9:00 on Sunday', () => {
      const date = new Date('2026-01-18T09:00:00'); // Sunday
      expect(classifyRate(date)).toBe('dal');
    });

    it('returns dal for 20:00 on Sunday', () => {
      const date = new Date('2026-01-18T20:00:00'); // Sunday
      expect(classifyRate(date)).toBe('dal');
    });

    it('never returns peak on weekends', () => {
      const saturday = new Date('2026-01-17T08:00:00');
      const sunday = new Date('2026-01-18T19:00:00');
      expect(classifyRate(saturday)).not.toBe('peak');
      expect(classifyRate(sunday)).not.toBe('peak');
    });
  });

  describe('custom schedule', () => {
    it('uses custom schedule when provided', () => {
      const customSchedule: RateSchedule = {
        ...DEFAULT_RATE_SCHEDULE,
        weekdaySchedule: { ...DEFAULT_RATE_SCHEDULE.weekdaySchedule, 3: 'peak' },
      };
      const date = new Date('2026-01-12T03:00:00'); // Monday 3am
      expect(classifyRate(date, customSchedule)).toBe('peak');
    });

    it('uses custom weekend schedule', () => {
      const customSchedule: RateSchedule = {
        ...DEFAULT_RATE_SCHEDULE,
        weekendSchedule: { ...DEFAULT_RATE_SCHEDULE.weekendSchedule, 14: 'peak' },
      };
      const date = new Date('2026-01-17T14:00:00'); // Saturday 2pm
      expect(classifyRate(date, customSchedule)).toBe('peak');
    });
  });

  describe('getConsumptionRate', () => {
    it('returns the rate for the classified tier', () => {
      const date = new Date('2026-01-12T08:00:00'); // Monday 8am = peak
      const rate = getConsumptionRate(date, DEFAULT_RATE_SCHEDULE);
      expect(rate).toBe(0.35); // peak rate
    });

    it('returns rate from custom tier', () => {
      const customSchedule: RateSchedule = {
        tiers: [
          { id: 'custom', name: 'Custom', rate: 0.50, color: '#000' },
        ],
        weekdaySchedule: { ...DEFAULT_RATE_SCHEDULE.weekdaySchedule, 8: 'custom' },
        weekendSchedule: DEFAULT_RATE_SCHEDULE.weekendSchedule,
        injectionRate: 0.05,
      };
      const date = new Date('2026-01-12T08:00:00'); // Monday 8am
      const rate = getConsumptionRate(date, customSchedule);
      expect(rate).toBe(0.50);
    });
  });
});
