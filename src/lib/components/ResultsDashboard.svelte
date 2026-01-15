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
