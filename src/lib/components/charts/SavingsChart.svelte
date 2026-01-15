<script lang="ts">
  import { Line } from 'svelte-chartjs';
  import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
  } from 'chart.js';
  import type { SimulationResult } from '../../types';

  ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale);

  export let result: SimulationResult;
  export let purchasePrice: number;

  $: cumulativeSavings = result.dailyResults.reduce<{ date: string; savings: number }[]>(
    (acc, day) => {
      const prevSavings = acc.length > 0 ? acc[acc.length - 1].savings : 0;
      const dailySaving = day.costWithoutBattery - day.costWithBattery;
      acc.push({
        date: day.date.toLocaleDateString('nl-BE', { month: 'short', day: 'numeric' }),
        savings: prevSavings + dailySaving,
      });
      return acc;
    },
    []
  );

  $: data = {
    labels: cumulativeSavings.map((d) => d.date),
    datasets: [
      {
        label: 'Cumulative Savings',
        data: cumulativeSavings.map((d) => d.savings),
        borderColor: '#28a745',
        backgroundColor: 'rgba(40, 167, 69, 0.1)',
        fill: true,
        tension: 0.1,
      },
      {
        label: 'Break-even',
        data: cumulativeSavings.map(() => purchasePrice),
        borderColor: '#dc3545',
        borderDash: [5, 5],
        pointRadius: 0,
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
      tooltip: {
        callbacks: {
          label: (context: { dataset: { label?: string }; parsed: { y: number | null } }) => {
            const value = context.parsed.y ?? 0;
            return `${context.dataset.label || ''}: €${value.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: string | number) => `€${value}`,
        },
      },
    },
  };
</script>

<div class="chart-container">
  <h3>Cumulative Savings Over Time</h3>
  <div class="chart">
    <Line {data} {options} />
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
