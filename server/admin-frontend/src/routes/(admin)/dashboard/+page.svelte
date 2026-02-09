<script>
  import { onMount } from 'svelte';
  import { getStats, getUsers } from '$lib/api';
  import { currentProduct } from '$lib/stores/product';
  import logger from '$lib/utils/logger';
  import Card from '$lib/components/Card.svelte';
  import Table from '$lib/components/Table.svelte';
  import Button from '$lib/components/Button.svelte';
  import { goto } from '$app/navigation';
  
  let stats = $state({
    totalUsers: 0,
    vipUsers: 0,
    unusedCards: 0,
    todayLogins: 0
  });
  
  let salesStats = $state({
    today: 0,
    month: 0,
    total: 0,
    usedCards: 0
  });
  
  let recentUsers = $state([]);
  let loading = $state(true);
  
  function getGroupType(group) {
    const types = {
      free: 'info',
      trial: 'warning',
      monthly: '',
      yearly: 'warning',
      permanent: 'success'
    };
    return types[group] || 'info';
  }
  
  function getGroupName(group) {
    const names = {
      free: '免费用户',
      trial: '试用会员',
      monthly: '月卡会员',
      yearly: '年卡会员',
      permanent: '永久会员'
    };
    return names[group] || group;
  }
  
  async function loadData() {
    try {
      const res = await getStats();
      if (res.data) {
        stats = {
          totalUsers: res.data.totalUsers || 0,
          vipUsers: res.data.vipUsers || 0,
          unusedCards: res.data.unusedCards || 0,
          todayLogins: res.data.todayLogins || 0
        };
        salesStats = {
          today: res.data.todaySales || 0,
          month: res.data.monthSales || 0,
          total: res.data.totalSales || 0,
          usedCards: res.data.monthlyUsedCards || 0
        };
      }
    } catch (e) {
      logger.error('加载统计数据失败', e);
    }
    
    try {
      const res = await getUsers({ page: 1, page_size: 5 });
      if (res.data && res.data.list) {
        recentUsers = res.data.list;
      }
    } catch (e) {
      logger.error('加载用户列表失败', e);
    } finally {
      loading = false;
    }
  }
  
  $effect(() => {
    // 监听产品切换
    $currentProduct;
    loadData();
  });
  
  onMount(() => {
    loadData();
    
    // 监听WebSocket事件，实现实时数据更新
    if (typeof window !== 'undefined') {
      const handleStatsUpdate = () => {
        logger.log('[Dashboard] 收到统计数据更新事件，刷新数据');
        loadData();
      };
      
      const handleUserChanged = () => {
        logger.log('[Dashboard] 收到用户变更事件，刷新最近用户列表');
        // 只刷新用户列表，不刷新统计数据
        getUsers({ page: 1, page_size: 5 }).then(res => {
          if (res.data && res.data.list) {
            recentUsers = res.data.list;
          }
        }).catch(e => {
          logger.error('刷新用户列表失败', e);
        });
      };
      
      window.addEventListener('websocket:stats_updated', handleStatsUpdate);
      window.addEventListener('websocket:user_changed', handleUserChanged);
      
      // 清理事件监听器
      return () => {
        window.removeEventListener('websocket:stats_updated', handleStatsUpdate);
        window.removeEventListener('websocket:user_changed', handleUserChanged);
      };
    }
  });
  
  const tableColumns = [
    { prop: 'id', label: 'ID', width: '60px' },
    { prop: 'email', label: '邮箱', width: '180px' },
    { prop: 'user_group', label: '用户组', width: '100px' },
    { prop: 'register_time', label: '注册时间', width: '165px' },
    { prop: 'status', label: '状态', width: '70px' }
  ];
</script>

<div>
  <!-- 统计卡片 -->
  <div class="stat-cards">
    <div class="stat-card">
      <div class="stat-icon primary">U</div>
      <div class="stat-info">
        <h3>{stats.totalUsers || 0}</h3>
        <p>总用户数</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon success">VIP</div>
      <div class="stat-info">
        <h3>{stats.vipUsers || 0}</h3>
        <p>会员用户</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon warning">C</div>
      <div class="stat-info">
        <h3>{stats.unusedCards || 0}</h3>
        <p>未使用卡密</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon danger">D</div>
      <div class="stat-info">
        <h3>{stats.todayLogins || 0}</h3>
        <p>今日登录</p>
      </div>
    </div>
  </div>
  
  <!-- 销售额统计 -->
  <div class="stat-cards" style="margin-top: 20px;">
    <div class="stat-card">
      <div class="stat-icon" style="background: #667eea;">¥</div>
      <div class="stat-info">
        <h3 style="color: #667eea;">¥{salesStats.today.toFixed(2)}</h3>
        <p>今日销售额</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background: #f5576c;">M</div>
      <div class="stat-info">
        <h3 style="color: #f5576c;">¥{salesStats.month.toFixed(2)}</h3>
        <p>本月销售额</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background: #4facfe;">T</div>
      <div class="stat-info">
        <h3 style="color: #4facfe;">¥{salesStats.total.toFixed(2)}</h3>
        <p>累计销售额</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background: #43e97b;">S</div>
      <div class="stat-info">
        <h3 style="color: #43e97b;">{salesStats.usedCards}</h3>
        <p>已售卡密</p>
      </div>
    </div>
  </div>
  
  <!-- 最近用户 -->
  <Card title="最近注册用户" style="margin-top: 20px;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <Button type="primary" size="small" onClick={() => goto('/users')}>查看全部</Button>
    </div>
    <Table
      data={recentUsers}
      columns={tableColumns.map(col => {
        if (col.prop === 'user_group') {
          return {
            ...col,
            render: ({ row }) => {
              return `<span class="tag tag-${getGroupType(row.user_group)}">${getGroupName(row.user_group)}</span>`;
            }
          };
        } else if (col.prop === 'status') {
          return {
            ...col,
            render: ({ row }) => {
              return `<span class="tag tag-${row.status === 'active' ? 'success' : 'danger'}">${row.status === 'active' ? '正常' : '封禁'}</span>`;
            }
          };
        }
        return col;
      })}
      loading={loading}
      stripe={true}
    />
  </Card>
</div>

<style>
  .tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
  }
  
  .tag-info {
    background: rgba(24, 144, 255, 0.1);
    border: 1px solid rgba(24, 144, 255, 0.3);
    color: #1890ff;
  }
  
  .tag-warning {
    background: rgba(250, 173, 20, 0.1);
    border: 1px solid rgba(250, 173, 20, 0.3);
    color: #d48806;
  }
  
  .tag-success {
    background: rgba(82, 196, 26, 0.1);
    border: 1px solid rgba(82, 196, 26, 0.3);
    color: #52c41a;
  }
  
  .tag-danger {
    background: rgba(255, 77, 79, 0.1);
    border: 1px solid rgba(255, 77, 79, 0.3);
    color: #ff4d4f;
  }
</style>
