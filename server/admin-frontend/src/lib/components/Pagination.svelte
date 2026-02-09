<script lang="ts">
  let {
    currentPage = $bindable(1),
    pageSize = $bindable(10),
    total = 0,
    pageSizes = [10, 20, 50],
    showTotal = true,
    showSizes = true,
    onPageChange = () => {},
    onSizeChange = () => {}
  }: {
    currentPage?: number;
    pageSize?: number;
    total?: number;
    pageSizes?: number[];
    showTotal?: boolean;
    showSizes?: boolean;
    onPageChange?: (page: number) => void;
    onSizeChange?: (size: number) => void;
  } = $props();
  
  let totalPages = $derived(Math.ceil(total / pageSize));
  
  function handlePageChange(page: number) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
      onPageChange(page);
    }
  }
  
  function handleSizeChange(size: number) {
    pageSize = size;
    currentPage = 1;
    onSizeChange(size);
  }

  function getVisiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, start + maxVisible - 1);
      
      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }
  
  let visiblePages = $derived(getVisiblePages());
</script>

<div class="pagination">
  {#if showTotal}
    <span class="pagination-total">共 {total} 条</span>
  {/if}
  
  {#if showSizes}
    <select class="pagination-sizes" value={pageSize} onchange={(e) => {
      const target = e.target as HTMLSelectElement;
      if (target) {
        handleSizeChange(Number(target.value));
      }
    }}>
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
    
    {#each visiblePages as page}
      <button 
        class="pagination-btn" 
        class:active={currentPage === page}
        onclick={() => handlePageChange(page)}
      >
        {page}
      </button>
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
