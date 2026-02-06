<script>
  let {
    data = [],
    columns = [],
    loading = false,
    stripe = false,
    border = true
  } = $props();
</script>

<div class="table-wrapper">
  <table class="table" class:table-stripe={stripe} class:table-border={border}>
    <thead>
      <tr>
        {#each columns as col}
          <th style="width: {col.width || 'auto'}">{col.label}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#if loading}
        <tr>
          <td colspan={columns.length} class="table-loading">
            <div class="loading-spinner">加载中...</div>
          </td>
        </tr>
      {:else if data.length === 0}
        <tr>
          <td colspan={columns.length} class="table-empty">
            暂无数据
          </td>
        </tr>
      {:else}
        {#each data as row, index}
          <tr>
            {#each columns as col}
              <td>
            {#if col.render}
              {@html col.render({ row, index })}
            {:else}
              {row[col.prop] || ''}
            {/if}
              </td>
            {/each}
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>

<style>
  .table-wrapper {
    width: 100%;
    overflow-x: auto;
  }
  
  .table {
    width: 100%;
    border-collapse: collapse;
    background: white;
  }
  
  .table-border {
    border: 1px solid #f0f0f0;
  }
  
  .table th {
    background: #fafafa;
    padding: 12px;
    text-align: left;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.85);
    border-bottom: 1px solid #f0f0f0;
  }
  
  .table td {
    padding: 12px;
    border-bottom: 1px solid #f0f0f0;
    color: rgba(0, 0, 0, 0.65);
  }
  
  .table-stripe tbody tr:nth-child(even) {
    background: #fafafa;
  }
  
  .table tbody tr:hover {
    background: rgba(24, 144, 255, 0.04);
  }
  
  .table-loading,
  .table-empty {
    text-align: center;
    padding: 40px !important;
    color: rgba(0, 0, 0, 0.45);
  }
  
  .loading-spinner {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
</style>


    data = [],
    columns = [],
    loading = false,
    stripe = false,
    border = true
  } = $props();
</script>

<div class="table-wrapper">
  <table class="table" class:table-stripe={stripe} class:table-border={border}>
    <thead>
      <tr>
        {#each columns as col}
          <th style="width: {col.width || 'auto'}">{col.label}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#if loading}
        <tr>
          <td colspan={columns.length} class="table-loading">
            <div class="loading-spinner">加载中...</div>
          </td>
        </tr>
      {:else if data.length === 0}
        <tr>
          <td colspan={columns.length} class="table-empty">
            暂无数据
          </td>
        </tr>
      {:else}
        {#each data as row, index}
          <tr>
            {#each columns as col}
              <td>
            {#if col.render}
              {@html col.render({ row, index })}
            {:else}
              {row[col.prop] || ''}
            {/if}
              </td>
            {/each}
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>

<style>
  .table-wrapper {
    width: 100%;
    overflow-x: auto;
  }
  
  .table {
    width: 100%;
    border-collapse: collapse;
    background: white;
  }
  
  .table-border {
    border: 1px solid #f0f0f0;
  }
  
  .table th {
    background: #fafafa;
    padding: 12px;
    text-align: left;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.85);
    border-bottom: 1px solid #f0f0f0;
  }
  
  .table td {
    padding: 12px;
    border-bottom: 1px solid #f0f0f0;
    color: rgba(0, 0, 0, 0.65);
  }
  
  .table-stripe tbody tr:nth-child(even) {
    background: #fafafa;
  }
  
  .table tbody tr:hover {
    background: rgba(24, 144, 255, 0.04);
  }
  
  .table-loading,
  .table-empty {
    text-align: center;
    padding: 40px !important;
    color: rgba(0, 0, 0, 0.45);
  }
  
  .loading-spinner {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
</style>

