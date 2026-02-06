<script>
  import { onMount } from 'svelte';
  import { getOperationLogs } from '$lib/api';
  import logger from '$lib/utils/logger';
  import Card from '$lib/components/Card.svelte';
  import Table from '$lib/components/Table.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  
  let loading = $state(false);
  let logs = $state([]);
  let page = $state(1);
  let pageSize = $state(20);
  let total = $state(0);
  
  function getTargetTypeName(type) {
    const names = {
      user: '用户',
      card: '卡密',
      announcement: '公告',
      setting: '设置',
      withdrawal: '提现'
    };
    return names[type] || type || '-';
  }
  
  function formatDetails(details) {
    if (!details) return '-';
    try {
      const obj = typeof details === 'string' ? JSON.parse(details) : details;
      const keyNames = {
        count: '数量',
        card_type: '卡密类型',
        product_code: '产品',
        batch_id: '批次号',
        title: '标题',
        keys: '设置项',
        action: '操作',
        amount: '金额',
        reason: '原因',
        user_group: '用户组',
        expire_time: '到期时间',
        status: '状态',
        email: '邮箱'
      };
      const typeNames = {
        monthly: '月卡',
        yearly: '年卡',
        permanent: '永久',
        dubbing: '丸子配音',
        comic: '丸子漫剧',
        approve: '通过',
        reject: '拒绝'
      };
      return Object.entries(obj).map(([k, v]) => {
        const keyName = keyNames[k] || k;
        const valueName = typeNames[v] || v;
        return `${keyName}: ${valueName}`;
      }).join(' | ');
    } catch {
      return details;
    }
  }
  
  async function loadLogs() {
    loading = true;
    try {
      const res = await getOperationLogs({
        page: page,
        page_size: pageSize
      });
      logs = res.data?.list || [];
      total = res.data?.total || 0;
    } catch (e) {
      logger.error('加载日志失败', e);
    } finally {
      loading = false;
    }
  }
  
  onMount(() => {
    loadLogs();
  });
  
  const tableColumns = [
    { prop: 'id', label: 'ID', width: '60px' },
    { prop: 'admin_username', label: '操作人', width: '100px' },
    { prop: 'action', label: '操作', width: '120px' },
    { 
      prop: 'target_type', 
      label: '目标类型', 
      width: '100px',
      render: ({ row }) => getTargetTypeName(row.target_type)
    },
    { 
      prop: 'target_id', 
      label: '目标ID', 
      width: '80px',
      render: ({ row }) => row.target_id || '-'
    },
    { 
      prop: 'details', 
      label: '详情', 
      minWidth: '300px',
      render: ({ row }) => `<div class="details-content">${formatDetails(row.details)}</div>`
    },
    { prop: 'ip', label: 'IP地址', width: '130px' },
    { prop: 'created_at', label: '时间', width: '165px' }
  ];
</script>

<Card title="操作日志">
  <Table
    data={logs}
    columns={tableColumns}
    loading={loading}
    stripe={true}
  />
  
  <Pagination
    bind:currentPage={page}
    bind:pageSize={pageSize}
    {total}
    pageSizes={[20, 50, 100]}
    onPageChange={loadLogs}
    onSizeChange={loadLogs}
  />
</Card>

<style>
  :global(.details-content) {
    white-space: normal;
    word-break: break-all;
    line-height: 1.5;
    color: #606266;
  }
</style>
