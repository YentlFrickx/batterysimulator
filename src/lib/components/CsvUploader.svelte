<script lang="ts">
  import type { EnergyInterval } from '../types';
  import { parseFluviusCsv } from '../simulation/parser';

  export let onDataLoaded: (intervals: EnergyInterval[]) => void;

  let isDragging = false;
  let error = '';
  let loadedCount = 0;

  function handleFile(file: File) {
    error = '';
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const intervals = parseFluviusCsv(content);

        if (intervals.length === 0) {
          error = 'No valid data found in CSV';
          return;
        }

        loadedCount = intervals.length;
        onDataLoaded(intervals);
      } catch (err) {
        error = `Failed to parse CSV: ${err}`;
      }
    };

    reader.onerror = () => {
      error = 'Failed to read file';
    };

    reader.readAsText(file);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;

    const file = e.dataTransfer?.files[0];
    if (file) handleFile(file);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    isDragging = true;
  }

  function handleDragLeave() {
    isDragging = false;
  }

  function handleInputChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) handleFile(file);
  }
</script>

<div
  class="dropzone"
  class:dragging={isDragging}
  on:drop={handleDrop}
  on:dragover={handleDragOver}
  on:dragleave={handleDragLeave}
  role="button"
  tabindex="0"
>
  <input type="file" accept=".csv" on:change={handleInputChange} />
  <p>Drop your Fluvius CSV here or click to browse</p>
</div>

{#if error}
  <p class="error">{error}</p>
{/if}

{#if loadedCount > 0}
  <p class="success">Loaded {loadedCount} intervals</p>
{/if}

<style>
  .dropzone {
    border: 2px dashed #ccc;
    border-radius: 8px;
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.2s, background-color 0.2s;
    position: relative;
  }

  .dropzone:hover,
  .dropzone.dragging {
    border-color: #007bff;
    background-color: #f0f7ff;
  }

  .dropzone input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }

  .error {
    color: #dc3545;
    margin-top: 0.5rem;
  }

  .success {
    color: #28a745;
    margin-top: 0.5rem;
  }
</style>
