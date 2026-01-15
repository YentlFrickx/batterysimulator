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
