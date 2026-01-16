<script lang="ts">
  import type { RateSchedule } from '../types';
  import ScheduleGrid from './ScheduleGrid.svelte';

  export let schedule: RateSchedule;

  function addTier() {
    const id = `tier_${Date.now()}`;
    schedule.tiers = [
      ...schedule.tiers,
      { id, name: 'New Tier', rate: 0.25, color: '#9775fa' },
    ];
  }

  function removeTier(id: string) {
    if (schedule.tiers.length <= 1) return;

    const fallbackTier = schedule.tiers.find(t => t.id !== id);
    if (!fallbackTier) return;

    // Reassign any hours using this tier to the fallback
    for (let hour = 0; hour < 24; hour++) {
      if (schedule.weekdaySchedule[hour] === id) {
        schedule.weekdaySchedule[hour] = fallbackTier.id;
      }
      if (schedule.weekendSchedule[hour] === id) {
        schedule.weekendSchedule[hour] = fallbackTier.id;
      }
    }

    schedule.tiers = schedule.tiers.filter(t => t.id !== id);
    schedule.weekdaySchedule = { ...schedule.weekdaySchedule };
    schedule.weekendSchedule = { ...schedule.weekendSchedule };
  }

  function updateTier(index: number, field: 'name' | 'rate' | 'color', value: string | number) {
    schedule.tiers[index] = { ...schedule.tiers[index], [field]: value };
    schedule.tiers = [...schedule.tiers];
  }
</script>

<div class="rate-config">
  <h2>Step 2: Configure Rates</h2>

  <section class="tier-management">
    <h3>Rate Tiers</h3>
    <div class="tiers-list">
      {#each schedule.tiers as tier, index (tier.id)}
        <div class="tier-row">
          <input
            type="color"
            value={tier.color}
            on:input={(e) => updateTier(index, 'color', e.currentTarget.value)}
            title="Tier color"
          />
          <input
            type="text"
            value={tier.name}
            on:input={(e) => updateTier(index, 'name', e.currentTarget.value)}
            placeholder="Tier name"
            class="tier-name"
          />
          <div class="rate-input">
            <input
              type="number"
              step="0.01"
              min="0"
              value={tier.rate}
              on:input={(e) => updateTier(index, 'rate', parseFloat(e.currentTarget.value) || 0)}
            />
            <span class="unit">/kWh</span>
          </div>
          <button
            class="remove-btn"
            on:click={() => removeTier(tier.id)}
            disabled={schedule.tiers.length <= 1}
            title="Remove tier"
          >
            &times;
          </button>
        </div>
      {/each}
    </div>
    <button class="add-btn" on:click={addTier}>+ Add Tier</button>
  </section>

  <section class="schedule-section">
    <h3>Schedule</h3>
    <p class="help-text">Click cells to cycle through rate tiers</p>
    <ScheduleGrid
      bind:weekdaySchedule={schedule.weekdaySchedule}
      bind:weekendSchedule={schedule.weekendSchedule}
      tiers={schedule.tiers}
    />
  </section>

  <section class="injection-section">
    <label>
      Injection Rate (€/kWh)
      <input
        type="number"
        step="0.01"
        min="0"
        bind:value={schedule.injectionRate}
      />
    </label>
  </section>
</div>

<style>
  h2 {
    font-size: 1.2rem;
    margin-bottom: 1rem;
  }

  h3 {
    font-size: 1rem;
    margin-bottom: 0.5rem;
    color: #444;
  }

  section {
    margin-bottom: 1.5rem;
  }

  .tiers-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .tier-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .tier-row input[type="color"] {
    width: 32px;
    height: 32px;
    padding: 2px;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
  }

  .tier-name {
    flex: 1;
    padding: 0.4rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.9rem;
    min-width: 80px;
  }

  .rate-input {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .rate-input input {
    width: 70px;
    padding: 0.4rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .unit {
    font-size: 0.8rem;
    color: #666;
  }

  .remove-btn {
    width: 28px;
    height: 28px;
    border: none;
    background: #ff6b6b;
    color: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1.2rem;
    line-height: 1;
    padding: 0;
  }

  .remove-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .remove-btn:hover:not(:disabled) {
    background: #ee5a5a;
  }

  .add-btn {
    padding: 0.4rem 0.75rem;
    border: 1px dashed #4dabf7;
    background: transparent;
    color: #4dabf7;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
  }

  .add-btn:hover {
    background: #e7f5ff;
  }

  .help-text {
    font-size: 0.8rem;
    color: #666;
    margin-bottom: 0.5rem;
  }

  .injection-section label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.9rem;
    max-width: 200px;
  }

  .injection-section input {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
  }
</style>
