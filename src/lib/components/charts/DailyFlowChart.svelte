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
