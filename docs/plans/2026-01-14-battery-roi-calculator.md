# Battery ROI Calculator Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a web-based battery ROI calculator that simulates savings using real Fluvius 15-minute energy data.

**Architecture:** Client-side Svelte app with TypeScript. CSV parsing and battery simulation happen in the browser. Chart.js renders visualizations. No backend required.

**Tech Stack:** Svelte 5, TypeScript, Vite, Chart.js, svelte-chartjs

---

### Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `src/main.ts`
- Create: `src/App.svelte`
- Create: `index.html`

**Step 1: Initialize project with Vite + Svelte + TypeScript**

Run:
```bash
npm create vite@latest . -- --template svelte-ts
```

Select: Overwrite existing files if prompted

**Step 2: Install dependencies**

Run:
```bash
npm install
npm install chart.js svelte-chartjs
```

**Step 3: Verify setup works**

Run:
```bash
npm run dev
```

Expected: Dev server starts at http://localhost:5173, shows Svelte welcome page

**Step 4: Clean up boilerplate**

Replace `src/App.svelte` with:

```svelte
<script lang="ts">
</script>

<main>
  <h1>Battery ROI Simulator</h1>
</main>

<style>
  main {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem;
    font-family: system-ui, -apple-system, sans-serif;
  }

  h1 {
    margin-bottom: 1.5rem;
  }
</style>
```

Delete: `src/lib/Counter.svelte` (if exists)

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: initialize Svelte + TypeScript project with Vite"
```

---

### Task 2: TypeScript Types

**Files:**
- Create: `src/lib/types.ts`

**Step 1: Define core types**

Create `src/lib/types.ts`:

```typescript
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
```

**Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add TypeScript type definitions"
```

---

### Task 3: Rate Classifier

**Files:**
- Create: `src/lib/simulation/classifier.ts`
- Create: `src/lib/simulation/classifier.test.ts`

**Step 1: Create test file**

Create `src/lib/simulation/classifier.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { classifyRate } from './classifier';

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
});
```

**Step 2: Install vitest**

Run:
```bash
npm install -D vitest
```

Add to `package.json` scripts:
```json
"test": "vitest"
```

**Step 3: Run test to verify it fails**

Run:
```bash
npm test -- --run
```

Expected: FAIL - cannot find module './classifier'

**Step 4: Implement classifier**

Create `src/lib/simulation/classifier.ts`:

```typescript
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
```

**Step 5: Run tests to verify they pass**

Run:
```bash
npm test -- --run
```

Expected: All tests PASS

**Step 6: Commit**

```bash
git add src/lib/simulation/classifier.ts src/lib/simulation/classifier.test.ts package.json package-lock.json
git commit -m "feat: add ENGIE Flextime rate classifier with tests"
```

---

### Task 4: CSV Parser

**Files:**
- Create: `src/lib/simulation/parser.ts`
- Create: `src/lib/simulation/parser.test.ts`

**Step 1: Create test file**

Create `src/lib/simulation/parser.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { parseFluviusCsv } from './parser';

const sampleCsv = `Van (datum);Van (tijdstip);Tot (datum);Tot (tijdstip);EAN-code;Meter;Metertype;Register;Volume;Eenheid;Validatiestatus;Omschrijving
02-09-2025;00:00:00;02-09-2025;00:15:00;="541448820050357909";1SAG3200193141;Digitale meter;Afname Nacht;0,065;kWh;Uitgelezen;
02-09-2025;00:00:00;02-09-2025;00:15:00;="541448820050357909";1SAG3200193141;Digitale meter;Injectie Nacht;0,000;kWh;Uitgelezen;
02-09-2025;00:15:00;02-09-2025;00:30:00;="541448820050357909";1SAG3200193141;Digitale meter;Afname Nacht;0,120;kWh;Uitgelezen;
02-09-2025;00:15:00;02-09-2025;00:30:00;="541448820050357909";1SAG3200193141;Digitale meter;Injectie Nacht;0,050;kWh;Uitgelezen;`;

describe('parseFluviusCsv', () => {
  it('parses intervals from CSV', () => {
    const result = parseFluviusCsv(sampleCsv);
    expect(result).toHaveLength(2);
  });

  it('extracts correct timestamps', () => {
    const result = parseFluviusCsv(sampleCsv);
    expect(result[0].startTime).toEqual(new Date(2025, 8, 2, 0, 0, 0));
    expect(result[0].endTime).toEqual(new Date(2025, 8, 2, 0, 15, 0));
  });

  it('extracts consumption values', () => {
    const result = parseFluviusCsv(sampleCsv);
    expect(result[0].consumptionKwh).toBeCloseTo(0.065, 3);
    expect(result[1].consumptionKwh).toBeCloseTo(0.120, 3);
  });

  it('extracts injection values', () => {
    const result = parseFluviusCsv(sampleCsv);
    expect(result[0].injectionKwh).toBeCloseTo(0.0, 3);
    expect(result[1].injectionKwh).toBeCloseTo(0.050, 3);
  });

  it('handles comma decimal separator', () => {
    const csv = `Van (datum);Van (tijdstip);Tot (datum);Tot (tijdstip);EAN-code;Meter;Metertype;Register;Volume;Eenheid;Validatiestatus;Omschrijving
02-09-2025;00:00:00;02-09-2025;00:15:00;="541448820050357909";1SAG3200193141;Digitale meter;Afname Nacht;1,234;kWh;Uitgelezen;
02-09-2025;00:00:00;02-09-2025;00:15:00;="541448820050357909";1SAG3200193141;Digitale meter;Injectie Nacht;0,567;kWh;Uitgelezen;`;
    const result = parseFluviusCsv(csv);
    expect(result[0].consumptionKwh).toBeCloseTo(1.234, 3);
    expect(result[0].injectionKwh).toBeCloseTo(0.567, 3);
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm test -- --run
```

Expected: FAIL - cannot find module './parser'

**Step 3: Implement parser**

Create `src/lib/simulation/parser.ts`:

```typescript
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
  return parseFloat(volumeStr.replace(',', '.'));
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
```

**Step 4: Run tests to verify they pass**

Run:
```bash
npm test -- --run
```

Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/lib/simulation/parser.ts src/lib/simulation/parser.test.ts
git commit -m "feat: add Fluvius CSV parser with tests"
```

---

### Task 5: Battery Simulation Engine

**Files:**
- Create: `src/lib/simulation/battery.ts`
- Create: `src/lib/simulation/battery.test.ts`

**Step 1: Create test file**

Create `src/lib/simulation/battery.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { simulateBattery } from './battery';
import type { EnergyInterval, BatteryConfig, RateConfig } from '../types';

const defaultBatteryConfig: BatteryConfig = {
  capacityKwh: 10,
  usableCapacityPercent: 100,
  roundTripEfficiencyPercent: 100, // 100% for easy test math
  purchasePrice: 6000,
  lifespanYears: 15,
};

const defaultRateConfig: RateConfig = {
  peakRate: 0.35,
  dalRate: 0.28,
  superDalRate: 0.19,
  injectionRate: 0.05,
};

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

    const result = simulateBattery(intervals, defaultBatteryConfig, defaultRateConfig);
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

    const result = simulateBattery(intervals, defaultBatteryConfig, defaultRateConfig);
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
    const result = simulateBattery(intervals, config, defaultRateConfig);
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

    const result = simulateBattery(intervals, defaultBatteryConfig, defaultRateConfig);

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
    const result = simulateBattery(intervals, config, defaultRateConfig);

    // Should have positive savings and finite payback
    expect(result.annualSavings).toBeGreaterThan(0);
    expect(result.paybackYears).toBeGreaterThan(0);
    expect(result.paybackYears).toBeLessThan(100);
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm test -- --run
```

Expected: FAIL - cannot find module './battery'

**Step 3: Implement battery simulation**

Create `src/lib/simulation/battery.ts`:

```typescript
import type {
  EnergyInterval,
  BatteryConfig,
  RateConfig,
  SimulationResult,
  DailyResult,
  RateTier,
} from '../types';
import { classifyRate } from './classifier';

function getRate(tier: RateTier, config: RateConfig): number {
  switch (tier) {
    case 'peak':
      return config.peakRate;
    case 'dal':
      return config.dalRate;
    case 'superDal':
      return config.superDalRate;
  }
}

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function simulateBattery(
  intervals: EnergyInterval[],
  batteryConfig: BatteryConfig,
  rateConfig: RateConfig
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
    const tier = classifyRate(interval.startTime);
    const rate = getRate(tier, rateConfig);

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
      interval.consumptionKwh * rate - interval.injectionKwh * rateConfig.injectionRate;
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
      costWith -= remainingInjection * rateConfig.injectionRate;
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
```

**Step 4: Run tests to verify they pass**

Run:
```bash
npm test -- --run
```

Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/lib/simulation/battery.ts src/lib/simulation/battery.test.ts
git commit -m "feat: add battery simulation engine with tests"
```

---

### Task 6: CSV Uploader Component

**Files:**
- Create: `src/lib/components/CsvUploader.svelte`
- Modify: `src/App.svelte`

**Step 1: Create CsvUploader component**

Create `src/lib/components/CsvUploader.svelte`:

```svelte
<script lang="ts">
  import type { EnergyInterval } from '../types';
  import { parseFluviusCsv } from '../simulation/parser';

  export let onDataLoaded: (intervals: EnergyInterval[]) => void;

  let isDragging = false;
  let error = '';
  let loadedCount = 0;

  function handleFile(file: File) {
    error = '';
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const intervals = parseFluviusCsv(content);

        if (intervals.length === 0) {
          error = 'No valid data found in CSV';
          return;
        }

        loadedCount = intervals.length;
        onDataLoaded(intervals);
      } catch (err) {
        error = `Failed to parse CSV: ${err}`;
      }
    };

    reader.onerror = () => {
      error = 'Failed to read file';
    };

    reader.readAsText(file);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;

    const file = e.dataTransfer?.files[0];
    if (file) handleFile(file);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    isDragging = true;
  }

  function handleDragLeave() {
    isDragging = false;
  }

  function handleInputChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) handleFile(file);
  }
</script>

<div
  class="dropzone"
  class:dragging={isDragging}
  on:drop={handleDrop}
  on:dragover={handleDragOver}
  on:dragleave={handleDragLeave}
  role="button"
  tabindex="0"
>
  <input type="file" accept=".csv" on:change={handleInputChange} />
  <p>Drop your Fluvius CSV here or click to browse</p>
</div>

{#if error}
  <p class="error">{error}</p>
{/if}

{#if loadedCount > 0}
  <p class="success">Loaded {loadedCount} intervals</p>
{/if}

<style>
  .dropzone {
    border: 2px dashed #ccc;
    border-radius: 8px;
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.2s, background-color 0.2s;
    position: relative;
  }

  .dropzone:hover,
  .dropzone.dragging {
    border-color: #007bff;
    background-color: #f0f7ff;
  }

  .dropzone input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }

  .error {
    color: #dc3545;
    margin-top: 0.5rem;
  }

  .success {
    color: #28a745;
    margin-top: 0.5rem;
  }
</style>
```

**Step 2: Update App.svelte to use CsvUploader**

Replace `src/App.svelte` with:

```svelte
<script lang="ts">
  import type { EnergyInterval } from './lib/types';
  import CsvUploader from './lib/components/CsvUploader.svelte';

  let intervals: EnergyInterval[] = [];

  function handleDataLoaded(data: EnergyInterval[]) {
    intervals = data;
  }
</script>

<main>
  <h1>Battery ROI Simulator</h1>

  <section>
    <h2>Step 1: Upload Data</h2>
    <CsvUploader onDataLoaded={handleDataLoaded} />
  </section>

  {#if intervals.length > 0}
    <section>
      <p>Data loaded: {intervals.length} intervals</p>
      <p>
        From: {intervals[0].startTime.toLocaleDateString()} to{' '}
        {intervals[intervals.length - 1].endTime.toLocaleDateString()}
      </p>
    </section>
  {/if}
</main>

<style>
  main {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem;
    font-family: system-ui, -apple-system, sans-serif;
  }

  h1 {
    margin-bottom: 1.5rem;
  }

  section {
    margin-bottom: 2rem;
  }

  h2 {
    font-size: 1.2rem;
    margin-bottom: 1rem;
  }
</style>
```

**Step 3: Test manually in browser**

Run:
```bash
npm run dev
```

Test: Upload `real_usage.csv`, verify it shows interval count and date range

**Step 4: Commit**

```bash
git add src/lib/components/CsvUploader.svelte src/App.svelte
git commit -m "feat: add CSV uploader component"
```

---

### Task 7: Rate Configuration Component

**Files:**
- Create: `src/lib/components/RateConfig.svelte`
- Modify: `src/App.svelte`

**Step 1: Create RateConfig component**

Create `src/lib/components/RateConfig.svelte`:

```svelte
<script lang="ts">
  import type { RateConfig } from '../types';

  export let config: RateConfig;
</script>

<div class="rate-config">
  <h2>Step 2: Configure Rates</h2>

  <div class="grid">
    <label>
      Peak rate (€/kWh)
      <input type="number" step="0.01" min="0" bind:value={config.peakRate} />
    </label>

    <label>
      Dal rate (€/kWh)
      <input type="number" step="0.01" min="0" bind:value={config.dalRate} />
    </label>

    <label>
      Super-dal rate (€/kWh)
      <input type="number" step="0.01" min="0" bind:value={config.superDalRate} />
    </label>

    <label>
      Injection rate (€/kWh)
      <input type="number" step="0.01" min="0" bind:value={config.injectionRate} />
    </label>
  </div>
</div>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.9rem;
  }

  input {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
  }

  h2 {
    font-size: 1.2rem;
    margin-bottom: 1rem;
  }
</style>
```

**Step 2: Commit**

```bash
git add src/lib/components/RateConfig.svelte
git commit -m "feat: add rate configuration component"
```

---

### Task 8: Battery Configuration Component

**Files:**
- Create: `src/lib/components/BatteryConfig.svelte`

**Step 1: Create BatteryConfig component**

Create `src/lib/components/BatteryConfig.svelte`:

```svelte
<script lang="ts">
  import type { BatteryConfig } from '../types';

  export let config: BatteryConfig;
</script>

<div class="battery-config">
  <h2>Step 3: Battery Parameters</h2>

  <div class="grid">
    <label>
      Capacity (kWh)
      <input type="number" step="0.5" min="0" bind:value={config.capacityKwh} />
    </label>

    <label>
      Usable capacity (%)
      <input
        type="number"
        step="1"
        min="0"
        max="100"
        bind:value={config.usableCapacityPercent}
      />
    </label>

    <label>
      Round-trip efficiency (%)
      <input
        type="number"
        step="1"
        min="0"
        max="100"
        bind:value={config.roundTripEfficiencyPercent}
      />
    </label>

    <label>
      Purchase price (€)
      <input type="number" step="100" min="0" bind:value={config.purchasePrice} />
    </label>

    <label>
      Expected lifespan (years)
      <input type="number" step="1" min="1" bind:value={config.lifespanYears} />
    </label>
  </div>
</div>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.9rem;
  }

  input {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
  }

  h2 {
    font-size: 1.2rem;
    margin-bottom: 1rem;
  }
</style>
```

**Step 2: Commit**

```bash
git add src/lib/components/BatteryConfig.svelte
git commit -m "feat: add battery configuration component"
```

---

### Task 9: Results Dashboard Component

**Files:**
- Create: `src/lib/components/ResultsDashboard.svelte`

**Step 1: Create ResultsDashboard component**

Create `src/lib/components/ResultsDashboard.svelte`:

```svelte
<script lang="ts">
  import type { SimulationResult } from '../types';

  export let result: SimulationResult;

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('nl-BE', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  }

  function formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  function formatYears(value: number): string {
    if (!isFinite(value)) return 'Never';
    if (value < 1) return `${Math.round(value * 12)} months`;
    return `${value.toFixed(1)} years`;
  }
</script>

<div class="dashboard">
  <h2>Results</h2>

  <div class="cards">
    <div class="card">
      <div class="value">{formatCurrency(result.annualSavings)}</div>
      <div class="label">Annual Savings</div>
    </div>

    <div class="card">
      <div class="value">{formatYears(result.paybackYears)}</div>
      <div class="label">Payback Period</div>
    </div>

    <div class="card">
      <div class="value">
        {formatPercent(result.selfConsumptionBefore)} → {formatPercent(
          result.selfConsumptionAfter
        )}
      </div>
      <div class="label">Self-consumption</div>
    </div>

    <div class="card">
      <div class="value">{formatPercent(result.gridReductionPercent)}</div>
      <div class="label">Grid Reduction</div>
    </div>
  </div>

  <div class="details">
    <h3>Period Summary</h3>
    <table>
      <tr>
        <td>Total consumption</td>
        <td>{result.totalConsumptionKwh.toFixed(1)} kWh</td>
      </tr>
      <tr>
        <td>Total injection</td>
        <td>{result.totalInjectionKwh.toFixed(1)} kWh</td>
      </tr>
      <tr>
        <td>Cost without battery</td>
        <td>{formatCurrency(result.costWithoutBattery)}</td>
      </tr>
      <tr>
        <td>Cost with battery</td>
        <td>{formatCurrency(result.costWithBattery)}</td>
      </tr>
      <tr>
        <td>Savings (period)</td>
        <td>{formatCurrency(result.costWithoutBattery - result.costWithBattery)}</td>
      </tr>
    </table>
  </div>
</div>

<style>
  .dashboard {
    margin-top: 2rem;
  }

  h2 {
    font-size: 1.2rem;
    margin-bottom: 1rem;
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .card {
    background: #f5f5f5;
    border-radius: 8px;
    padding: 1rem;
    text-align: center;
  }

  .card .value {
    font-size: 1.25rem;
    font-weight: bold;
    color: #333;
  }

  .card .label {
    font-size: 0.85rem;
    color: #666;
    margin-top: 0.25rem;
  }

  .details {
    background: #fafafa;
    border-radius: 8px;
    padding: 1rem;
  }

  .details h3 {
    font-size: 1rem;
    margin-bottom: 0.75rem;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  td {
    padding: 0.5rem 0;
    border-bottom: 1px solid #eee;
  }

  td:last-child {
    text-align: right;
    font-weight: 500;
  }

  @media (max-width: 600px) {
    .cards {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
```

**Step 2: Commit**

```bash
git add src/lib/components/ResultsDashboard.svelte
git commit -m "feat: add results dashboard component"
```

---

### Task 10: Wire Up Complete App

**Files:**
- Modify: `src/App.svelte`

**Step 1: Update App.svelte with all components and simulation**

Replace `src/App.svelte` with:

```svelte
<script lang="ts">
  import type { EnergyInterval, RateConfig, BatteryConfig, SimulationResult } from './lib/types';
  import { simulateBattery } from './lib/simulation/battery';
  import CsvUploader from './lib/components/CsvUploader.svelte';
  import RateConfigComponent from './lib/components/RateConfig.svelte';
  import BatteryConfigComponent from './lib/components/BatteryConfig.svelte';
  import ResultsDashboard from './lib/components/ResultsDashboard.svelte';

  let intervals: EnergyInterval[] = [];

  let rateConfig: RateConfig = {
    peakRate: 0.35,
    dalRate: 0.28,
    superDalRate: 0.19,
    injectionRate: 0.05,
  };

  let batteryConfig: BatteryConfig = {
    capacityKwh: 10,
    usableCapacityPercent: 90,
    roundTripEfficiencyPercent: 90,
    purchasePrice: 6000,
    lifespanYears: 15,
  };

  let result: SimulationResult | null = null;

  function handleDataLoaded(data: EnergyInterval[]) {
    intervals = data;
    runSimulation();
  }

  function runSimulation() {
    if (intervals.length === 0) {
      result = null;
      return;
    }
    result = simulateBattery(intervals, batteryConfig, rateConfig);
  }

  // Re-run simulation when configs change
  $: if (intervals.length > 0) {
    result = simulateBattery(intervals, batteryConfig, rateConfig);
  }
</script>

<main>
  <h1>Battery ROI Simulator</h1>

  <section>
    <h2>Step 1: Upload Data</h2>
    <CsvUploader onDataLoaded={handleDataLoaded} />
    {#if intervals.length > 0}
      <p class="data-summary">
        Data loaded: {intervals.length} intervals
        ({intervals[0].startTime.toLocaleDateString('nl-BE')} -
        {intervals[intervals.length - 1].endTime.toLocaleDateString('nl-BE')})
      </p>
    {/if}
  </section>

  {#if intervals.length > 0}
    <div class="config-grid">
      <section>
        <RateConfigComponent bind:config={rateConfig} />
      </section>

      <section>
        <BatteryConfigComponent bind:config={batteryConfig} />
      </section>
    </div>

    {#if result}
      <ResultsDashboard {result} />
    {/if}
  {/if}
</main>

<style>
  main {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem;
    font-family: system-ui, -apple-system, sans-serif;
  }

  h1 {
    margin-bottom: 1.5rem;
  }

  section {
    margin-bottom: 2rem;
  }

  h2 {
    font-size: 1.2rem;
    margin-bottom: 1rem;
  }

  .data-summary {
    margin-top: 1rem;
    color: #28a745;
    font-size: 0.9rem;
  }

  .config-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }

  @media (max-width: 700px) {
    .config-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
```

**Step 2: Test the complete flow**

Run:
```bash
npm run dev
```

Test:
1. Upload `real_usage.csv`
2. Verify rates and battery config appear
3. Verify results dashboard shows calculations
4. Adjust battery capacity slider, verify results update

**Step 3: Commit**

```bash
git add src/App.svelte
git commit -m "feat: wire up complete simulation flow"
```

---

### Task 11: Savings Chart

**Files:**
- Create: `src/lib/components/charts/SavingsChart.svelte`
- Modify: `src/App.svelte`

**Step 1: Create SavingsChart component**

Create `src/lib/components/charts/SavingsChart.svelte`:

```svelte
<script lang="ts">
  import { Line } from 'svelte-chartjs';
  import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
  } from 'chart.js';
  import type { SimulationResult } from '../../types';

  ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale);

  export let result: SimulationResult;
  export let purchasePrice: number;

  $: cumulativeSavings = result.dailyResults.reduce<{ date: string; savings: number }[]>(
    (acc, day) => {
      const prevSavings = acc.length > 0 ? acc[acc.length - 1].savings : 0;
      const dailySaving = day.costWithoutBattery - day.costWithBattery;
      acc.push({
        date: day.date.toLocaleDateString('nl-BE', { month: 'short', day: 'numeric' }),
        savings: prevSavings + dailySaving,
      });
      return acc;
    },
    []
  );

  $: data = {
    labels: cumulativeSavings.map((d) => d.date),
    datasets: [
      {
        label: 'Cumulative Savings',
        data: cumulativeSavings.map((d) => d.savings),
        borderColor: '#28a745',
        backgroundColor: 'rgba(40, 167, 69, 0.1)',
        fill: true,
        tension: 0.1,
      },
      {
        label: 'Break-even',
        data: cumulativeSavings.map(() => purchasePrice),
        borderColor: '#dc3545',
        borderDash: [5, 5],
        pointRadius: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: { dataset: { label: string }; parsed: { y: number } }) => {
            return `${context.dataset.label}: €${context.parsed.y.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => `€${value}`,
        },
      },
    },
  };
</script>

<div class="chart-container">
  <h3>Cumulative Savings Over Time</h3>
  <div class="chart">
    <Line {data} {options} />
  </div>
</div>

<style>
  .chart-container {
    margin-top: 2rem;
  }

  h3 {
    font-size: 1rem;
    margin-bottom: 1rem;
  }

  .chart {
    height: 300px;
  }
</style>
```

**Step 2: Add chart to App.svelte**

In `src/App.svelte`, add import at top:

```svelte
import SavingsChart from './lib/components/charts/SavingsChart.svelte';
```

Add after `<ResultsDashboard {result} />`:

```svelte
<SavingsChart {result} purchasePrice={batteryConfig.purchasePrice} />
```

**Step 3: Test chart renders**

Run:
```bash
npm run dev
```

Upload CSV, verify cumulative savings chart appears with break-even line

**Step 4: Commit**

```bash
git add src/lib/components/charts/SavingsChart.svelte src/App.svelte
git commit -m "feat: add cumulative savings chart"
```

---

### Task 12: Daily Flow Chart

**Files:**
- Create: `src/lib/components/charts/DailyFlowChart.svelte`
- Modify: `src/App.svelte`

**Step 1: Create DailyFlowChart component**

Create `src/lib/components/charts/DailyFlowChart.svelte`:

```svelte
<script lang="ts">
  import { Bar } from 'svelte-chartjs';
  import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    BarElement,
    CategoryScale,
    LinearScale,
  } from 'chart.js';
  import type { SimulationResult } from '../../types';

  ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

  export let result: SimulationResult;

  $: data = {
    labels: result.dailyResults.map((d) =>
      d.date.toLocaleDateString('nl-BE', { month: 'short', day: 'numeric' })
    ),
    datasets: [
      {
        label: 'Consumption (kWh)',
        data: result.dailyResults.map((d) => d.consumptionKwh),
        backgroundColor: 'rgba(220, 53, 69, 0.7)',
      },
      {
        label: 'Solar Injection (kWh)',
        data: result.dailyResults.map((d) => d.injectionKwh),
        backgroundColor: 'rgba(255, 193, 7, 0.7)',
      },
      {
        label: 'Battery Charged (kWh)',
        data: result.dailyResults.map((d) => d.batteryChargedKwh),
        backgroundColor: 'rgba(40, 167, 69, 0.7)',
      },
      {
        label: 'Battery Discharged (kWh)',
        data: result.dailyResults.map((d) => d.batteryDischargedKwh),
        backgroundColor: 'rgba(0, 123, 255, 0.7)',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      x: {
        stacked: false,
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'kWh',
        },
      },
    },
  };
</script>

<div class="chart-container">
  <h3>Daily Energy Flow</h3>
  <div class="chart">
    <Bar {data} {options} />
  </div>
</div>

<style>
  .chart-container {
    margin-top: 2rem;
  }

  h3 {
    font-size: 1rem;
    margin-bottom: 1rem;
  }

  .chart {
    height: 300px;
  }
</style>
```

**Step 2: Add chart to App.svelte**

In `src/App.svelte`, add import:

```svelte
import DailyFlowChart from './lib/components/charts/DailyFlowChart.svelte';
```

Add after `<SavingsChart ... />`:

```svelte
<DailyFlowChart {result} />
```

**Step 3: Test chart renders**

Run:
```bash
npm run dev
```

Upload CSV, verify daily flow bar chart appears

**Step 4: Commit**

```bash
git add src/lib/components/charts/DailyFlowChart.svelte src/App.svelte
git commit -m "feat: add daily energy flow chart"
```

---

### Task 13: Build & Deploy Verification

**Files:**
- None (verification only)

**Step 1: Run production build**

Run:
```bash
npm run build
```

Expected: Build succeeds, output in `dist/` folder

**Step 2: Preview production build**

Run:
```bash
npm run preview
```

Test: Open http://localhost:4173, verify app works identically to dev mode

**Step 3: Run all tests**

Run:
```bash
npm test -- --run
```

Expected: All tests pass

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: verify production build"
```

---

## Summary

After completing all tasks you will have:

1. A working Svelte + TypeScript web app
2. CSV parser for Fluvius data format
3. ENGIE Flextime rate classifier with tests
4. Battery simulation engine with tests
5. UI components for configuration and results
6. Two charts: cumulative savings and daily flow
7. Production-ready build

Future extensions (not in this plan):
- Day profile chart (24h average)
- Monthly breakdown chart
- Battery comparison mode
- NPV/IRR calculations
- Battery degradation modeling
