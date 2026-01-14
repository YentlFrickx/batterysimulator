# Battery ROI Calculator - Design Document

## Overview

A web-based simulator that uses real 15-minute interval energy data to calculate whether a home battery is a worthwhile investment. Part of a larger battery simulator project that will later include self-consumption optimization and energy arbitrage features.

## Context

- User has solar panels with a digital meter
- Injection tariff compensation (paid per kWh exported)
- ENGIE Flextime pricing with three tiers: peak, dal, super-dal
- Data source: Fluvius CSV export with 15-minute intervals

## Core Simulation Logic

For each 15-minute interval:
1. Check if there's injection (excess solar) → charge battery (up to capacity)
2. Check if there's consumption → discharge battery first, then buy from grid
3. Track avoided grid purchases (savings)
4. Track lost injection revenue (opportunity cost)
5. Net savings = avoided purchases - lost injection revenue

A battery is profitable when the spread between consumption rate and injection rate, multiplied by shifted kWh over the battery's lifetime, exceeds the purchase price.

## Data Flow

```
CSV Upload → Parse & Validate → Time-slot Classification → Battery Simulation → Savings Calculation → Visualization
```

## Input Parameters

### CSV Format (Fluvius)
- Semicolon-separated, Dutch headers
- 15-minute intervals with date and time columns
- "Afname" (consumption) and "Injectie" (export) records
- Comma decimal separator (0,065 → 0.065)

### Rate Configuration (ENGIE Flextime)
| Tier | Weekdays | Weekends |
|------|----------|----------|
| Super-dal | 1:00-7:00 | 1:00-7:00, 11:00-17:00 |
| Dal | 11:00-17:00, 22:00-1:00 | 7:00-11:00, 17:00-1:00 |
| Peak | All other hours | None (no peak on weekends) |

Configurable rates:
- Peak rate (€/kWh)
- Dal rate (€/kWh)
- Super-dal rate (€/kWh)
- Injection rate (€/kWh)

### Battery Parameters
- Capacity (kWh)
- Usable capacity (%)
- Round-trip efficiency (%)
- Purchase price (€)
- Expected lifespan (years)

## Output

### Summary Dashboard
- Annual savings (€)
- Simple payback period (years)
- Self-consumption rate: before vs after (%)
- Grid independence improvement (%)

### Charts
1. **Daily energy flow** - Stacked bar: consumption, solar, battery charge/discharge
2. **Savings over time** - Cumulative savings with break-even point
3. **Typical day profile** - Averaged 24h charge/discharge pattern
4. **Monthly breakdown** - Cost comparison per month

### Detailed Analysis
- NPV at configurable discount rate
- Effective €/kWh cost of stored energy
- Battery utilization (cycles/year)
- Degradation impact on long-term savings

### Future: Comparison Mode
- Side-by-side battery size comparison
- Optimal size recommendation

## Technical Architecture

### Project Structure
```
batterysimulator/
├── src/
│   ├── App.svelte
│   ├── lib/
│   │   ├── components/
│   │   │   ├── CsvUploader.svelte
│   │   │   ├── RateConfig.svelte
│   │   │   ├── BatteryConfig.svelte
│   │   │   ├── ResultsDashboard.svelte
│   │   │   └── charts/
│   │   │       ├── DailyFlowChart.svelte
│   │   │       ├── SavingsChart.svelte
│   │   │       └── DayProfileChart.svelte
│   │   ├── simulation/
│   │   │   ├── parser.ts
│   │   │   ├── classifier.ts
│   │   │   ├── battery.ts
│   │   │   └── calculator.ts
│   │   └── types.ts
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### Technology Stack
- Svelte + TypeScript
- Vite (build tool)
- Chart.js + svelte-chartjs
- No backend - all client-side processing

### Deployment
- Works locally via `npm run dev`
- Static build deployable to Vercel/Netlify/GitHub Pages

## UI Layout

Single-page with progressive disclosure:

1. **Upload section** - Drag & drop CSV, shows data summary after load
2. **Configuration** - Rate inputs (with sensible defaults) + battery parameters
3. **Calculate button** - Triggers simulation
4. **Results dashboard** - Key metrics in cards, tabbed chart views

Results update reactively when parameters change.

## Future Extensions

This design supports extension to:
- **Self-consumption optimizer** - Find optimal battery size for maximum self-use
- **Energy arbitrage simulator** - Model charging during cheap hours for later use
