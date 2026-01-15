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
