<script lang="ts">
  import type { HourlySchedule, RateTierDefinition } from '../types';

  export let weekdaySchedule: HourlySchedule;
  export let weekendSchedule: HourlySchedule;
  export let tiers: RateTierDefinition[];

  const hours = Array.from({ length: 24 }, (_, i) => i);

  function getTierColor(tierId: string): string {
    const tier = tiers.find(t => t.id === tierId);
    return tier?.color ?? '#ccc';
  }

  function getTierName(tierId: string): string {
    const tier = tiers.find(t => t.id === tierId);
    return tier?.name ?? tierId;
  }

  function cycleTier(schedule: 'weekday' | 'weekend', hour: number) {
    const currentSchedule = schedule === 'weekday' ? weekdaySchedule : weekendSchedule;
    const currentTierId = currentSchedule[hour];
    const currentIndex = tiers.findIndex(t => t.id === currentTierId);
    const nextIndex = (currentIndex + 1) % tiers.length;
    const nextTierId = tiers[nextIndex].id;

    if (schedule === 'weekday') {
      weekdaySchedule = { ...weekdaySchedule, [hour]: nextTierId };
    } else {
      weekendSchedule = { ...weekendSchedule, [hour]: nextTierId };
    }
  }

  function formatHour(hour: number): string {
    return hour.toString().padStart(2, '0');
  }
</script>

<div class="schedule-grid">
  <div class="grid-header">
    <div class="row-label"></div>
    {#each hours as hour}
      <div class="hour-label">{formatHour(hour)}</div>
    {/each}
  </div>

  <div class="grid-row">
    <div class="row-label">Weekday</div>
    {#each hours as hour}
      <button
        class="cell"
        style="background-color: {getTierColor(weekdaySchedule[hour])}"
        title="{formatHour(hour)}:00 - {getTierName(weekdaySchedule[hour])}"
        on:click={() => cycleTier('weekday', hour)}
      ></button>
    {/each}
  </div>

  <div class="grid-row">
    <div class="row-label">Weekend</div>
    {#each hours as hour}
      <button
        class="cell"
        style="background-color: {getTierColor(weekendSchedule[hour])}"
        title="{formatHour(hour)}:00 - {getTierName(weekendSchedule[hour])}"
        on:click={() => cycleTier('weekend', hour)}
      ></button>
    {/each}
  </div>

  <div class="legend">
    {#each tiers as tier}
      <div class="legend-item">
        <span class="legend-color" style="background-color: {tier.color}"></span>
        <span class="legend-name">{tier.name}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .schedule-grid {
    overflow-x: auto;
  }

  .grid-header,
  .grid-row {
    display: flex;
    gap: 1px;
    align-items: center;
  }

  .grid-header {
    margin-bottom: 2px;
  }

  .grid-row {
    margin-bottom: 1px;
  }

  .row-label {
    width: 70px;
    flex-shrink: 0;
    font-size: 0.8rem;
    font-weight: 500;
  }

  .hour-label {
    width: 24px;
    flex-shrink: 0;
    text-align: center;
    font-size: 0.65rem;
    color: #666;
  }

  .cell {
    width: 24px;
    height: 28px;
    flex-shrink: 0;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 2px;
    cursor: pointer;
    transition: transform 0.1s, box-shadow 0.1s;
    padding: 0;
  }

  .cell:hover {
    transform: scale(1.1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    z-index: 1;
  }

  .legend {
    display: flex;
    gap: 1rem;
    margin-top: 0.75rem;
    flex-wrap: wrap;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.8rem;
  }

  .legend-color {
    width: 14px;
    height: 14px;
    border-radius: 2px;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
</style>
