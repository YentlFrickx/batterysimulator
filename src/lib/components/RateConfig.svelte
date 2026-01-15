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
