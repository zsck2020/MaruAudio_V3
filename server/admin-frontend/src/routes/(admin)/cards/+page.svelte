<script>
  import { onMount } from 'svelte';
  import Card from '$lib/components/Card.svelte';
  import Table from '$lib/components/Table.svelte';
  import Dialog from '$lib/components/Dialog.svelte';
  import Button from '$lib/components/Button.svelte';
  import Input from '$lib/components/Input.svelte';
  import Select from '$lib/components/Select.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import { showMessage } from '$lib/components/Message';
  import { getCards, generateCards, disableCard as apiDisableCard, deleteCard as apiDeleteCard, getSettings, updateSettings } from '$lib/api';
  import { currentProduct } from '$lib/stores/product';
  import logger from '$lib/utils/logger';
  
  let loading = $state(false);
  let cards = $state([]);
  let page = $state(1);
  let pageSize = $state(10);
  let total = $state(0);
  let filterStatus = $state('');
  let filterType = $state('');
  
  let generateDialogVisible = $state(false);
  let generating = $state(false);
  let generateForm = $state({
    card_type: 'monthly',
    duration_days: 30,
    count: 10,
    remark: ''
  });
  
  let resultDialogVisible = $state(false);
  let generatedCards = $state([]);
  
  let priceDialogVisible = $state(false);
  let savingPrice = $state(false);
  let priceForm = $state({
    dubbing: { monthly: 29.9, yearly: 199, permanent: 399 },
    comic: { monthly: 19.9, yearly: 149, permanent: 299 }
  });
  
  let currentProductValue = $state('dubbing');
  $effect(() => {
    const unsubscribe = currentProduct.subscribe(value => {
      currentProductValue = value;
    });
    return unsubscribe;
  });
  
  let currentProductName = $derived(currentProductValue === 'comic' ? '丸子漫剧' : '丸子配音');
  let currentPriceForm = $derived(currentProductValue === 'comic' ? priceForm.comic : priceForm.dubbing);
  
  function getTypeColor(type) {
    const colors = { monthly: '', yearly: 'warning', permanent: 'success', custom: 'info' };
    return colors[type] || '';
  }
  
  function getTypeName(type) {
    const names = { monthly: '月卡', yearly: '年卡', permanent: '永久', custom: '自定义' };
    return names[type] || type;
  }
  
  function getStatusColor(status) {
    const colors = { unused: 'success', used: 'info', disabled: 'danger' };
    return colors[status] || '';
  }
  
  function getStatusName(status) {
    const names = { unused: '未使用', used: '已使用', disabled: '已禁用' };
    return names[status] || status;
  }
  
  async function loadCards() {
    loading = true;
    try {
      const res = await getCards({
        page,
        page_size: pageSize,
        status: filterStatus || undefined,
        card_type: filterType || undefined,
        product_code: currentProductValue
      });
      if (res.data) {
        cards = res.data.list || [];
        total = res.data.total || 0;
      }
    } catch (e) {
      logger.error('加载卡密列表失败', e);
      cards = [];
      total = 0;
    } finally {
      loading = false;
    }
  }
  
  function copyCard(card) {
    navigator.clipboard.writeText(card);
    showMessage('已复制', 'success');
  }
  
  function showGenerateDialog() {
    generateForm = {
      card_type: 'monthly',
      duration_days: 30,
      count: 10,
      remark: ''
    };
    generateDialogVisible = true;
  }
  
  async function handleGenerate() {
    generating = true;
    try {
      const res = await generateCards({
        card_type: generateForm.card_type,
        count: generateForm.count,
        duration_days: generateForm.card_type === 'custom' ? generateForm.duration_days : undefined,
        remark: generateForm.remark,
        product_code: currentProductValue
      });
      generatedCards = res.data.cards;
      generateDialogVisible = false;
      resultDialogVisible = true;
      loadCards();
    } catch (e) {
      // 错误已在拦截器处理
    } finally {
      generating = false;
    }
  }
  
  function copyAllCards() {
    navigator.clipboard.writeText(generatedCards.join('\n'));
    showMessage('已复制全部卡密', 'success');
  }
  
  async function disableCard(row) {
    if (!confirm(`确定要禁用卡密 ${row.card_key} 吗？`)) return;
    try {
      await apiDisableCard(row.id);
      showMessage('禁用成功', 'success');
      loadCards();
    } catch (e) {
      // 错误已在拦截器处理
    }
  }
  
  async function deleteCard(row) {
    if (!confirm(`确定要删除卡密 ${row.card_key} 吗？此操作不可恢复！`)) return;
    try {
      await apiDeleteCard(row.id);
      showMessage('删除成功', 'success');
      loadCards();
    } catch (e) {
      // 错误已在拦截器处理
    }
  }
  
  function showPriceDialog() {
    priceDialogVisible = true;
  }
  
  async function savePriceSettings() {
    savingPrice = true;
    try {
      const prefix = currentProductValue === 'comic' ? 'comic_' : '';
      await updateSettings({
        [`${prefix}card_price_monthly`]: String(currentPriceForm.monthly),
        [`${prefix}card_price_yearly`]: String(currentPriceForm.yearly),
        [`${prefix}card_price_permanent`]: String(currentPriceForm.permanent)
      });
      showMessage('价格设置已保存', 'success');
      priceDialogVisible = false;
    } catch (e) {
      // 错误已在拦截器处理
    } finally {
      savingPrice = false;
    }
  }
  
  async function loadPriceSettings() {
    try {
      const res = await getSettings();
      if (res.data) {
        priceForm.dubbing.monthly = parseFloat(res.data.card_price_monthly) || 29.9;
        priceForm.dubbing.yearly = parseFloat(res.data.card_price_yearly) || 199;
        priceForm.dubbing.permanent = parseFloat(res.data.card_price_permanent) || 399;
        priceForm.comic.monthly = parseFloat(res.data.comic_card_price_monthly) || 19.9;
        priceForm.comic.yearly = parseFloat(res.data.comic_card_price_yearly) || 149;
        priceForm.comic.permanent = parseFloat(res.data.comic_card_price_permanent) || 299;
      }
    } catch (e) {}
  }
  
  function exportCards() {
    const unusedCards = cards.filter(c => c.status === 'unused');
    if (unusedCards.length === 0) {
      showMessage('没有可导出的未使用卡密', 'warning');
      return;
    }
    
    const content = unusedCards.map(c => `${c.card_key}\t${getTypeName(c.card_type)}\t${c.duration_days || '永久'}天`).join('\n');
    const header = '卡密\t类型\t时长\n';
    const blob = new Blob([header + content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `卡密导出_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showMessage(`已导出 ${unusedCards.length} 张未使用卡密`, 'success');
  }
  
  function getTableColumns() {
    return [
      { prop: 'id', label: 'ID', width: '60px' },
      { 
        prop: 'card_key', 
        label: '卡密', 
        width: '200px',
        render: ({ row }) => {
          const cardKey = row.card_key || '';
          return `
            <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 12px;">${cardKey}</code>
            <button class="copy-btn" data-card="${cardKey}" style="margin-left: 8px; background: none; border: none; color: #1890ff; cursor: pointer;">复制</button>
          `;
        }
      },
      { 
        prop: 'card_type', 
        label: '类型', 
        width: '80px',
        render: ({ row }) => `<span class="tag tag-${getTypeColor(row.card_type)}">${getTypeName(row.card_type)}</span>`
      },
      { 
        prop: 'duration_days', 
        label: '时长', 
        width: '70px',
        render: ({ row }) => row.duration_days || '永久'
      },
      { 
        prop: 'status', 
        label: '状态', 
        width: '80px',
        render: ({ row }) => `<span class="tag tag-${getStatusColor(row.status)}">${getStatusName(row.status)}</span>`
      },
      { 
        prop: 'used_by_email', 
        label: '激活用户', 
        render: ({ row }) => row.status === 'used' && row.used_by_email ? row.used_by_email : '<span style="color: #999;">-</span>'
      },
      { 
        prop: 'machine_code', 
        label: '绑定机器码',
        render: ({ row }) => row.status === 'used' && row.machine_code ? `<code style="background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 11px;">${row.machine_code}</code>` : '<span style="color: #999;">-</span>'
      },
      { prop: 'created_at', label: '创建时间', width: '165px' },
      { 
        prop: 'used_at', 
        label: '使用时间', 
        width: '165px',
        render: ({ row }) => row.used_at || '-'
      },
      { 
        prop: 'actions', 
        label: '操作', 
        width: '100px',
        render: ({ row }) => {
          const actions = [];
          if (row.status === 'unused') {
            actions.push(`<button class="action-btn disable-btn" data-id="${row.id}" style="background: none; border: none; color: #faad14; cursor: pointer; margin-right: 8px;">禁用</button>`);
          }
          actions.push(`<button class="action-btn delete-btn" data-id="${row.id}" style="background: none; border: none; color: #f5222d; cursor: pointer;">删除</button>`);
          return actions.join('');
        }
      }
    ];
  }
  
  
  $effect(() => {
    loadCards();
  });
  
  $effect(() => {
    if (currentProductValue) {
      loadCards();
    }
  });
  
  onMount(() => {
    loadPriceSettings();
  });
</script>

<Card title="卡密管理">
  <div class="page-header">
    <div class="action-buttons" style="display: flex; gap: 10px; margin-bottom: 16px;">
      <Button onclick={showPriceDialog}>价格设置</Button>
      <Button onclick={exportCards}>导出</Button>
      <Button type="primary" onclick={showGenerateDialog}>生成卡密</Button>
    </div>
    
    <div style="margin-bottom: 16px; display: flex; gap: 10px;">
      <Select 
        bind:value={filterStatus}
        options={[
          { value: '', label: '全部状态' },
          { value: 'unused', label: '未使用' },
          { value: 'used', label: '已使用' },
          { value: 'disabled', label: '已禁用' }
        ]}
        placeholder="状态"
        onchange={() => { page = 1; loadCards(); }}
      />
      <Select 
        bind:value={filterType}
        options={[
          { value: '', label: '全部类型' },
          { value: 'monthly', label: '月卡' },
          { value: 'yearly', label: '年卡' },
          { value: 'permanent', label: '永久' }
        ]}
        placeholder="类型"
        onchange={() => { page = 1; loadCards(); }}
      />
    </div>
    
    <Table
      data={cards}
      columns={getTableColumns()}
      loading={loading}
      stripe={true}
    />
    
    <Pagination
      bind:currentPage={page}
      bind:pageSize={pageSize}
      {total}
      pageSizes={[10, 20, 50, 100]}
      onPageChange={loadCards}
      onSizeChange={loadCards}
    />
  </div>
</Card>

<Dialog bind:visible={generateDialogVisible} title="{currentProductName} - 生成卡密" width="500px">
  <div style="display: flex; flex-direction: column; gap: 16px;">
    <div>
      <label for="cards-generate-card-type" style="display: block; margin-bottom: 8px;">卡密类型</label>
      <Select 
        id="cards-generate-card-type"
        bind:value={generateForm.card_type}
        options={[
          { value: 'monthly', label: '月卡 (30天)' },
          { value: 'yearly', label: '年卡 (365天)' },
          { value: 'permanent', label: '永久' },
          { value: 'custom', label: '自定义天数' }
        ]}
      />
    </div>
    {#if generateForm.card_type === 'custom'}
      <div>
        <label for="cards-generate-duration-days" style="display: block; margin-bottom: 8px;">自定义天数</label>
        <Input 
          id="cards-generate-duration-days"
          type="number"
          bind:value={generateForm.duration_days}
          min="1"
          max="9999"
        />
      </div>
    {/if}
    <div>
      <label for="cards-generate-count" style="display: block; margin-bottom: 8px;">生成数量</label>
      <Input 
        id="cards-generate-count"
        type="number"
        bind:value={generateForm.count}
        min="1"
        max="100"
      />
    </div>
    <div>
      <label for="cards-generate-remark" style="display: block; margin-bottom: 8px;">备注</label>
      <Input 
        id="cards-generate-remark"
        bind:value={generateForm.remark}
        placeholder="可选，用于标记卡密用途"
      />
    </div>
  </div>
  <div slot="footer" style="display: flex; gap: 10px; justify-content: flex-end;">
    <Button onclick={() => generateDialogVisible = false}>取消</Button>
    <Button type="primary" onclick={handleGenerate} loading={generating}>生成卡密</Button>
  </div>
</Dialog>

<Dialog bind:visible={resultDialogVisible} title="生成成功" width="600px">
  <p>成功生成 {generatedCards.length} 张卡密：</p>
  <textarea readonly style="width: 100%; height: 200px; padding: 8px; border: 1px solid #d9d9d9; border-radius: 4px;">
    {generatedCards.join('\n')}
  </textarea>
  <div slot="footer" style="display: flex; gap: 10px; justify-content: flex-end;">
    <Button onclick={copyAllCards}>复制全部</Button>
    <Button type="primary" onclick={() => resultDialogVisible = false}>关闭</Button>
  </div>
</Dialog>

<Dialog bind:visible={priceDialogVisible} title="{currentProductName} - 卡密价格设置" width="500px">
  <div style="display: flex; flex-direction: column; gap: 16px;">
    <div>
      <label for="cards-price-monthly" style="display: block; margin-bottom: 8px;">月卡价格</label>
      <Input 
        id="cards-price-monthly"
        type="number"
        bind:value={currentPriceForm.monthly}
        min="0"
        step="0.01"
      />
    </div>
    <div>
      <label for="cards-price-yearly" style="display: block; margin-bottom: 8px;">年卡价格</label>
      <Input 
        id="cards-price-yearly"
        type="number"
        bind:value={currentPriceForm.yearly}
        min="0"
        step="0.01"
      />
    </div>
    <div>
      <label for="cards-price-permanent" style="display: block; margin-bottom: 8px;">永久价格</label>
      <Input 
        id="cards-price-permanent"
        type="number"
        bind:value={currentPriceForm.permanent}
        min="0"
        step="0.01"
      />
    </div>
  </div>
  <div slot="footer" style="display: flex; gap: 10px; justify-content: flex-end;">
    <Button onclick={() => priceDialogVisible = false}>取消</Button>
    <Button type="primary" onclick={savePriceSettings} loading={savingPrice}>保存设置</Button>
  </div>
</Dialog>

<style>
  .page-header {
    padding: 0;
  }
  
  .action-buttons {
    display: flex;
    gap: 10px;
    margin-bottom: 16px;
  }
</style>

  import Card from '$lib/components/Card.svelte';
  import Table from '$lib/components/Table.svelte';
  import Dialog from '$lib/components/Dialog.svelte';
  import Button from '$lib/components/Button.svelte';
  import Input from '$lib/components/Input.svelte';
  import Select from '$lib/components/Select.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import { showMessage } from '$lib/components/Message';
  import { getCards, generateCards, disableCard as apiDisableCard, deleteCard as apiDeleteCard, getSettings, updateSettings } from '$lib/api';
  import { currentProduct } from '$lib/stores/product';
  import logger from '$lib/utils/logger';
  
  let loading = $state(false);
  let cards = $state([]);
  let page = $state(1);
  let pageSize = $state(10);
  let total = $state(0);
  let filterStatus = $state('');
  let filterType = $state('');
  
  let generateDialogVisible = $state(false);
  let generating = $state(false);
  let generateForm = $state({
    card_type: 'monthly',
    duration_days: 30,
    count: 10,
    remark: ''
  });
  
  let resultDialogVisible = $state(false);
  let generatedCards = $state([]);
  
  let priceDialogVisible = $state(false);
  let savingPrice = $state(false);
  let priceForm = $state({
    dubbing: { monthly: 29.9, yearly: 199, permanent: 399 },
    comic: { monthly: 19.9, yearly: 149, permanent: 299 }
  });
  
  let currentProductValue = $state('dubbing');
  $effect(() => {
    const unsubscribe = currentProduct.subscribe(value => {
      currentProductValue = value;
    });
    return unsubscribe;
  });
  
  let currentProductName = $derived(currentProductValue === 'comic' ? '丸子漫剧' : '丸子配音');
  let currentPriceForm = $derived(currentProductValue === 'comic' ? priceForm.comic : priceForm.dubbing);
  
  function getTypeColor(type) {
    const colors = { monthly: '', yearly: 'warning', permanent: 'success', custom: 'info' };
    return colors[type] || '';
  }
  
  function getTypeName(type) {
    const names = { monthly: '月卡', yearly: '年卡', permanent: '永久', custom: '自定义' };
    return names[type] || type;
  }
  
  function getStatusColor(status) {
    const colors = { unused: 'success', used: 'info', disabled: 'danger' };
    return colors[status] || '';
  }
  
  function getStatusName(status) {
    const names = { unused: '未使用', used: '已使用', disabled: '已禁用' };
    return names[status] || status;
  }
  
  async function loadCards() {
    loading = true;
    try {
      const res = await getCards({
        page,
        page_size: pageSize,
        status: filterStatus || undefined,
        card_type: filterType || undefined,
        product_code: currentProductValue
      });
      if (res.data) {
        cards = res.data.list || [];
        total = res.data.total || 0;
      }
    } catch (e) {
      logger.error('加载卡密列表失败', e);
      cards = [];
      total = 0;
    } finally {
      loading = false;
    }
  }
  
  function copyCard(card) {
    navigator.clipboard.writeText(card);
    showMessage('已复制', 'success');
  }
  
  function showGenerateDialog() {
    generateForm = {
      card_type: 'monthly',
      duration_days: 30,
      count: 10,
      remark: ''
    };
    generateDialogVisible = true;
  }
  
  async function handleGenerate() {
    generating = true;
    try {
      const res = await generateCards({
        card_type: generateForm.card_type,
        count: generateForm.count,
        duration_days: generateForm.card_type === 'custom' ? generateForm.duration_days : undefined,
        remark: generateForm.remark,
        product_code: currentProductValue
      });
      generatedCards = res.data.cards;
      generateDialogVisible = false;
      resultDialogVisible = true;
      loadCards();
    } catch (e) {
      // 错误已在拦截器处理
    } finally {
      generating = false;
    }
  }
  
  function copyAllCards() {
    navigator.clipboard.writeText(generatedCards.join('\n'));
    showMessage('已复制全部卡密', 'success');
  }
  
  async function disableCard(row) {
    if (!confirm(`确定要禁用卡密 ${row.card_key} 吗？`)) return;
    try {
      await apiDisableCard(row.id);
      showMessage('禁用成功', 'success');
      loadCards();
    } catch (e) {
      // 错误已在拦截器处理
    }
  }
  
  async function deleteCard(row) {
    if (!confirm(`确定要删除卡密 ${row.card_key} 吗？此操作不可恢复！`)) return;
    try {
      await apiDeleteCard(row.id);
      showMessage('删除成功', 'success');
      loadCards();
    } catch (e) {
      // 错误已在拦截器处理
    }
  }
  
  function showPriceDialog() {
    priceDialogVisible = true;
  }
  
  async function savePriceSettings() {
    savingPrice = true;
    try {
      const prefix = currentProductValue === 'comic' ? 'comic_' : '';
      await updateSettings({
        [`${prefix}card_price_monthly`]: String(currentPriceForm.monthly),
        [`${prefix}card_price_yearly`]: String(currentPriceForm.yearly),
        [`${prefix}card_price_permanent`]: String(currentPriceForm.permanent)
      });
      showMessage('价格设置已保存', 'success');
      priceDialogVisible = false;
    } catch (e) {
      // 错误已在拦截器处理
    } finally {
      savingPrice = false;
    }
  }
  
  async function loadPriceSettings() {
    try {
      const res = await getSettings();
      if (res.data) {
        priceForm.dubbing.monthly = parseFloat(res.data.card_price_monthly) || 29.9;
        priceForm.dubbing.yearly = parseFloat(res.data.card_price_yearly) || 199;
        priceForm.dubbing.permanent = parseFloat(res.data.card_price_permanent) || 399;
        priceForm.comic.monthly = parseFloat(res.data.comic_card_price_monthly) || 19.9;
        priceForm.comic.yearly = parseFloat(res.data.comic_card_price_yearly) || 149;
        priceForm.comic.permanent = parseFloat(res.data.comic_card_price_permanent) || 299;
      }
    } catch (e) {}
  }
  
  function exportCards() {
    const unusedCards = cards.filter(c => c.status === 'unused');
    if (unusedCards.length === 0) {
      showMessage('没有可导出的未使用卡密', 'warning');
      return;
    }
    
    const content = unusedCards.map(c => `${c.card_key}\t${getTypeName(c.card_type)}\t${c.duration_days || '永久'}天`).join('\n');
    const header = '卡密\t类型\t时长\n';
    const blob = new Blob([header + content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `卡密导出_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showMessage(`已导出 ${unusedCards.length} 张未使用卡密`, 'success');
  }
  
  function getTableColumns() {
    return [
      { prop: 'id', label: 'ID', width: '60px' },
      { 
        prop: 'card_key', 
        label: '卡密', 
        width: '200px',
        render: ({ row }) => {
          const cardKey = row.card_key || '';
          return `
            <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 12px;">${cardKey}</code>
            <button class="copy-btn" data-card="${cardKey}" style="margin-left: 8px; background: none; border: none; color: #1890ff; cursor: pointer;">复制</button>
          `;
        }
      },
      { 
        prop: 'card_type', 
        label: '类型', 
        width: '80px',
        render: ({ row }) => `<span class="tag tag-${getTypeColor(row.card_type)}">${getTypeName(row.card_type)}</span>`
      },
      { 
        prop: 'duration_days', 
        label: '时长', 
        width: '70px',
        render: ({ row }) => row.duration_days || '永久'
      },
      { 
        prop: 'status', 
        label: '状态', 
        width: '80px',
        render: ({ row }) => `<span class="tag tag-${getStatusColor(row.status)}">${getStatusName(row.status)}</span>`
      },
      { 
        prop: 'used_by_email', 
        label: '激活用户', 
        render: ({ row }) => row.status === 'used' && row.used_by_email ? row.used_by_email : '<span style="color: #999;">-</span>'
      },
      { 
        prop: 'machine_code', 
        label: '绑定机器码',
        render: ({ row }) => row.status === 'used' && row.machine_code ? `<code style="background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 11px;">${row.machine_code}</code>` : '<span style="color: #999;">-</span>'
      },
      { prop: 'created_at', label: '创建时间', width: '165px' },
      { 
        prop: 'used_at', 
        label: '使用时间', 
        width: '165px',
        render: ({ row }) => row.used_at || '-'
      },
      { 
        prop: 'actions', 
        label: '操作', 
        width: '100px',
        render: ({ row }) => {
          const actions = [];
          if (row.status === 'unused') {
            actions.push(`<button class="action-btn disable-btn" data-id="${row.id}" style="background: none; border: none; color: #faad14; cursor: pointer; margin-right: 8px;">禁用</button>`);
          }
          actions.push(`<button class="action-btn delete-btn" data-id="${row.id}" style="background: none; border: none; color: #f5222d; cursor: pointer;">删除</button>`);
          return actions.join('');
        }
      }
    ];
  }
  
  
  $effect(() => {
    loadCards();
  });
  
  $effect(() => {
    if (currentProductValue) {
      loadCards();
    }
  });
  
  onMount(() => {
    loadPriceSettings();
  });
</script>

<Card title="卡密管理">
  <div class="page-header">
    <div class="action-buttons" style="display: flex; gap: 10px; margin-bottom: 16px;">
      <Button onclick={showPriceDialog}>价格设置</Button>
      <Button onclick={exportCards}>导出</Button>
      <Button type="primary" onclick={showGenerateDialog}>生成卡密</Button>
    </div>
    
    <div style="margin-bottom: 16px; display: flex; gap: 10px;">
      <Select 
        bind:value={filterStatus}
        options={[
          { value: '', label: '全部状态' },
          { value: 'unused', label: '未使用' },
          { value: 'used', label: '已使用' },
          { value: 'disabled', label: '已禁用' }
        ]}
        placeholder="状态"
        onchange={() => { page = 1; loadCards(); }}
      />
      <Select 
        bind:value={filterType}
        options={[
          { value: '', label: '全部类型' },
          { value: 'monthly', label: '月卡' },
          { value: 'yearly', label: '年卡' },
          { value: 'permanent', label: '永久' }
        ]}
        placeholder="类型"
        onchange={() => { page = 1; loadCards(); }}
      />
    </div>
    
    <Table
      data={cards}
      columns={getTableColumns()}
      loading={loading}
      stripe={true}
    />
    
    <Pagination
      bind:currentPage={page}
      bind:pageSize={pageSize}
      {total}
      pageSizes={[10, 20, 50, 100]}
      onPageChange={loadCards}
      onSizeChange={loadCards}
    />
  </div>
</Card>

<Dialog bind:visible={generateDialogVisible} title="{currentProductName} - 生成卡密" width="500px">
  <div style="display: flex; flex-direction: column; gap: 16px;">
    <div>
      <label for="cards-generate-card-type" style="display: block; margin-bottom: 8px;">卡密类型</label>
      <Select 
        id="cards-generate-card-type"
        bind:value={generateForm.card_type}
        options={[
          { value: 'monthly', label: '月卡 (30天)' },
          { value: 'yearly', label: '年卡 (365天)' },
          { value: 'permanent', label: '永久' },
          { value: 'custom', label: '自定义天数' }
        ]}
      />
    </div>
    {#if generateForm.card_type === 'custom'}
      <div>
        <label for="cards-generate-duration-days" style="display: block; margin-bottom: 8px;">自定义天数</label>
        <Input 
          id="cards-generate-duration-days"
          type="number"
          bind:value={generateForm.duration_days}
          min="1"
          max="9999"
        />
      </div>
    {/if}
    <div>
      <label for="cards-generate-count" style="display: block; margin-bottom: 8px;">生成数量</label>
      <Input 
        id="cards-generate-count"
        type="number"
        bind:value={generateForm.count}
        min="1"
        max="100"
      />
    </div>
    <div>
      <label for="cards-generate-remark" style="display: block; margin-bottom: 8px;">备注</label>
      <Input 
        id="cards-generate-remark"
        bind:value={generateForm.remark}
        placeholder="可选，用于标记卡密用途"
      />
    </div>
  </div>
  <div slot="footer" style="display: flex; gap: 10px; justify-content: flex-end;">
    <Button onclick={() => generateDialogVisible = false}>取消</Button>
    <Button type="primary" onclick={handleGenerate} loading={generating}>生成卡密</Button>
  </div>
</Dialog>

<Dialog bind:visible={resultDialogVisible} title="生成成功" width="600px">
  <p>成功生成 {generatedCards.length} 张卡密：</p>
  <textarea readonly style="width: 100%; height: 200px; padding: 8px; border: 1px solid #d9d9d9; border-radius: 4px;">
    {generatedCards.join('\n')}
  </textarea>
  <div slot="footer" style="display: flex; gap: 10px; justify-content: flex-end;">
    <Button onclick={copyAllCards}>复制全部</Button>
    <Button type="primary" onclick={() => resultDialogVisible = false}>关闭</Button>
  </div>
</Dialog>

<Dialog bind:visible={priceDialogVisible} title="{currentProductName} - 卡密价格设置" width="500px">
  <div style="display: flex; flex-direction: column; gap: 16px;">
    <div>
      <label for="cards-price-monthly" style="display: block; margin-bottom: 8px;">月卡价格</label>
      <Input 
        id="cards-price-monthly"
        type="number"
        bind:value={currentPriceForm.monthly}
        min="0"
        step="0.01"
      />
    </div>
    <div>
      <label for="cards-price-yearly" style="display: block; margin-bottom: 8px;">年卡价格</label>
      <Input 
        id="cards-price-yearly"
        type="number"
        bind:value={currentPriceForm.yearly}
        min="0"
        step="0.01"
      />
    </div>
    <div>
      <label for="cards-price-permanent" style="display: block; margin-bottom: 8px;">永久价格</label>
      <Input 
        id="cards-price-permanent"
        type="number"
        bind:value={currentPriceForm.permanent}
        min="0"
        step="0.01"
      />
    </div>
  </div>
  <div slot="footer" style="display: flex; gap: 10px; justify-content: flex-end;">
    <Button onclick={() => priceDialogVisible = false}>取消</Button>
    <Button type="primary" onclick={savePriceSettings} loading={savingPrice}>保存设置</Button>
  </div>
</Dialog>

<style>
  .page-header {
    padding: 0;
  }
  
  .action-buttons {
    display: flex;
    gap: 10px;
    margin-bottom: 16px;
  }
</style>
