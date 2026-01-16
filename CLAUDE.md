# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm run dev      # Start development server (Vite)
npm run build    # Production build
npm run check    # TypeScript and Svelte type checking
npm run test     # Run tests with Vitest
npm run preview  # Preview production build
```

Run a single test file:
```bash
npx vitest run src/lib/simulation/battery.test.ts
```

## Architecture

This is a **Svelte 4 + TypeScript + Vite** application that simulates home battery ROI based on energy consumption data from Fluvius (Belgian energy provider).

### Data Flow

1. **CSV Upload** → User uploads Fluvius energy export CSV
2. **Parsing** ([parser.ts](src/lib/simulation/parser.ts)) → `parseFluviusCsv()` converts CSV to `EnergyInterval[]`
3. **Rate Classification** ([classifier.ts](src/lib/simulation/classifier.ts)) → `classifyRate()` determines peak/dal/superDal based on time
4. **Simulation** ([battery.ts](src/lib/simulation/battery.ts)) → `simulateBattery()` runs the core simulation algorithm, producing `SimulationResult`
5. **Visualization** → Charts (Chart.js via svelte-chartjs) display savings and energy flow

### Key Types ([types.ts](src/lib/types.ts))

- `EnergyInterval` - 15-min energy reading (consumption/injection kWh)
- `RateConfig` - Electricity rates (peak/dal/superDal/injection in €/kWh)
- `BatteryConfig` - Battery specs (capacity, efficiency, price, lifespan)
- `SimulationResult` - Output with costs, savings, payback period, daily breakdowns

### Component Structure

```
App.svelte                    # Main orchestrator, holds state
├── CsvUploader.svelte        # File upload + parsing
├── RateConfig.svelte         # Rate input form
├── BatteryConfig.svelte      # Battery specs form
├── ResultsDashboard.svelte   # Key metrics display
└── charts/
    ├── SavingsChart.svelte   # Cumulative savings over time
    └── DailyFlowChart.svelte # Daily energy flow visualization
```

## Belgian Energy Rate Context

The app uses Belgian electricity rate tiers:
- **Peak**: Weekdays 7:00-22:00 (excluding holidays)
- **Dal**: Weekdays 22:00-7:00, weekends/holidays
- **SuperDal**: Not currently implemented but defined in types
