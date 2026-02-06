<script>
  let {
    currentPage = $bindable(1),
    pageSize = $bindable(10),
    total = 0,
    pageSizes = [10, 20, 50],
    showTotal = true,
    showSizes = true,
    onPageChange = () => {},
    onSizeChange = () => {}
  } = $props();
  
  let totalPages = $derived(Math.ceil(total / pageSize));
  
  function handlePageChange(page) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
      onPageChange(page);
    }
  }
  
  function handleSizeChange(size) {
    pageSize = size;
    currentPage = 1;
    onSizeChange(size);
  }
</script>

<div class="pagination">
  {#if showTotal}
    <span class="pagination-total">共 {total} 条</span>
  {/if}
  
  {#if showSizes}
    <select class="pagination-sizes" value={pageSize} onchange={(e) => handleSizeChange(Number(e.target.value))}>
      {#each pageSizes as size}
        <option value={size}>{size} 条/页</option>
      {/each}
    </select>
  {/if}
  
  <div class="pagination-pages">
    <button 
      class="pagination-btn" 
      class:disabled={currentPage === 1}
      onclick={() => handlePageChange(currentPage - 1)}
      disabled={currentPage === 1}
    >
      上一页
    </button>
    
    {#each Array(Math.min(5, totalPages)) as _, i}
      {@const page = i + 1}
      {#if totalPages <= 5 || (currentPage <= 3 && page <= 5) || (currentPage >= totalPages - 2 && page >= totalPages - 4) || (page >= currentPage - 1 && page <= currentPage + 1)}
        <button 
          class="pagination-btn" 
          class:active={currentPage === page}
          onclick={() => handlePageChange(page)}
        >
          {page}
        </button>
      {/if}
    {/each}
    
    <button 
      class="pagination-btn" 
      class:disabled={currentPage === totalPages}
      onclick={() => handlePageChange(currentPage + 1)}
      disabled={currentPage === totalPages}
    >
      下一页
    </button>
  </div>
</div>

<style>
  .pagination {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 20px;
    justify-content: flex-end;
  }
  
  .pagination-total {
    color: #666;
    font-size: 14px;
  }
  
  .pagination-sizes {
    padding: 4px 8px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
  }
  
  .pagination-pages {
    display: flex;
    gap: 4px;
  }
  
  .pagination-btn {
    min-width: 32px;
    height: 32px;
    padding: 0 8px;
    border: 1px solid #d9d9d9;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }
  
  .pagination-btn:hover:not(.disabled) {
    border-color: #40a9ff;
    color: #40a9ff;
  }
  
  .pagination-btn.active {
    background: #1890ff;
    border-color: #1890ff;
    color: white;
  }
  
  .pagination-btn.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
