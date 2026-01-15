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
