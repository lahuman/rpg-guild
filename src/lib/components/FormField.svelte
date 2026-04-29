<script lang="ts">
  export let type: 'text' | 'select' | 'textarea' = 'text';
  export let label: string;
  export let id: string;
  export let value: any = '';
  export let placeholder: string = '';
  export let options: Array<{ value: any; label: string }> = [];
  export let rows: number = 3;
  export let error: string = '';
</script>

<div class="space-y-2">
  <label for={id} class="block text-sm font-medium text-[var(--text-primary)]">
    {label}
  </label>

  {#if type === 'text'}
    <input
      {id}
      bind:value
      class="app-input"
      class:app-input-error={!!error}
      {placeholder}
      type="text"
    />
  {:else if type === 'select'}
    <select
      {id}
      bind:value
      class="app-select"
      class:app-input-error={!!error}
    >
      {#each options as option}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>
  {:else if type === 'textarea'}
    <textarea
      {id}
      bind:value
      class="app-input"
      class:app-input-error={!!error}
      {rows}
      {placeholder}
    ></textarea>
  {/if}

  {#if error}
    <p class="text-xs font-medium text-[var(--red)]">{error}</p>
  {/if}
</div>