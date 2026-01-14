import type { EnergyInterval } from '../types';

interface ParsedRow {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  register: string;
  volume: number;
}

function parseDate(dateStr: string, timeStr: string): Date {
  // Date format: DD-MM-YYYY
  const [day, month, year] = dateStr.split('-').map(Number);
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, seconds);
}

function parseVolume(volumeStr: string): number {
  // Replace comma with dot for decimal separator
  // Handle empty values (e.g., "Geen verbruik" entries)
  if (!volumeStr || volumeStr.trim() === '') return 0;
  const value = parseFloat(volumeStr.replace(',', '.'));
  return isNaN(value) ? 0 : value;
}

export function parseFluviusCsv(csvContent: string): EnergyInterval[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];

  // Skip header row
  const dataLines = lines.slice(1);

  // Group by time interval
  const intervalMap = new Map<string, EnergyInterval>();

  for (const line of dataLines) {
    const columns = line.split(';');
    if (columns.length < 9) continue;

    const startDate = columns[0];
    const startTime = columns[1];
    const endDate = columns[2];
    const endTime = columns[3];
    const register = columns[7];
    const volume = parseVolume(columns[8]);

    const key = `${startDate}-${startTime}`;

    if (!intervalMap.has(key)) {
      intervalMap.set(key, {
        startTime: parseDate(startDate, startTime),
        endTime: parseDate(endDate, endTime),
        consumptionKwh: 0,
        injectionKwh: 0,
      });
    }

    const interval = intervalMap.get(key)!;

    if (register.toLowerCase().includes('afname')) {
      interval.consumptionKwh = volume;
    } else if (register.toLowerCase().includes('injectie')) {
      interval.injectionKwh = volume;
    }
  }

  // Sort by start time
  return Array.from(intervalMap.values()).sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime()
  );
}
