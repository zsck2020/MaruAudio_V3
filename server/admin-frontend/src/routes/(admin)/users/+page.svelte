<script>
  import { onMount } from 'svelte';
  import { getUsers, updateUser, toggleUserStatus, getUserLogs, getUserInvites, getUserCommissions, exportUsers, resetUserPassword, getUserMachines, unbindUserMachine, bindUserMachine, verifyUserMachine } from '$lib/api';
  import logger from '$lib/utils/logger';
  import Card from '$lib/components/Card.svelte';
  import Button from '$lib/components/Button.svelte';
  import Input from '$lib/components/Input.svelte';
  import Select from '$lib/components/Select.svelte';
  import Table from '$lib/components/Table.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import Dialog from '$lib/components/Dialog.svelte';
  import Message from '$lib/components/Message';
  
  let loading = $state(false);
  let users = $state([]);
  let page = $state(1);
  let pageSize = $state(10);
  let total = $state(0);
  let searchType = $state('email');
  let searchKeyword = $state('');
  let isSearching = $state(false);
  let selectedUsers = $state([]);
  
  // 编辑对话框
  let editDialogVisible = $state(false);
  let editForm = $state({});
  let editTab = $state('basic');
  let durationMode = $state('set');
  let customDays = $state(30);
  let userMachines = $state([]);
  let newMachineCode = $state('');
  let verifyMachineCode = $state('');
  let verifyResult = $state(null);
  let newPassword = $state('');
  let confirmPassword = $state('');
  
  // 登录日志对话框
  let logsDialogVisible = $state(false);
  let loginLogs = $state([]);
  
  // 邀请记录和佣金记录
  let userInvites = $state([]);
  let invitesLoading = $state(false);
  let userCommissions = $state([]);
  let commissionsLoading = $state(false);
  let commissionStats = $state({ total: 0, available: 0 });
  
  const searchTypeOptions = [
    { label: '邮箱', value: 'email' },
    { label: '机器码', value: 'machine_code' },
    { label: '卡密', value: 'card_key' }
  ];
  
  const userGroupOptions = [
    { label: '免费用户', value: 'free' },
    { label: '试用会员', value: 'trial' },
    { label: '月度会员', value: 'monthly' },
    { label: '年度会员', value: 'yearly' },
    { label: '永久会员', value: 'permanent' }
  ];
  
  const statusOptions = [
    { label: '正常', value: 'active' },
    { label: '已封禁', value: 'banned' }
  ];
  
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
      monthly: '月度会员',
      yearly: '年度会员',
      permanent: '永久会员'
    };
    return names[group] || group;
  }
  
  function formatExpireTime(time) {
    if (!time) return '';
    if (time instanceof Date) {
      return time.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/\//g, '-');
    }
    return time;
  }
  
  function formatDateForSubmit(time) {
    if (!time) return null;
    if (time instanceof Date) {
      const year = time.getFullYear();
      const month = String(time.getMonth() + 1).padStart(2, '0');
      const day = String(time.getDate()).padStart(2, '0');
      const hours = String(time.getHours()).padStart(2, '0');
      const minutes = String(time.getMinutes()).padStart(2, '0');
      const seconds = String(time.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
    if (typeof time === 'string') {
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(time)) {
        return time;
      }
      if (time.includes('T')) {
        const d = new Date(time);
        return formatDateForSubmit(d);
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(time)) {
        return time + ' 00:00:00';
      }
    }
    return time;
  }
  
  async function loadUsers() {
    loading = true;
    try {
      const params = {
        page,
        page_size: pageSize
      };
      
      const keyword = searchKeyword.trim();
      if (keyword) {
        params.keyword = keyword;
        params.search_type = searchType;
      }
      
      logger.log('[Users] 加载用户列表, params:', params);
      
      const res = await getUsers(params);
      if (res.data) {
        users = res.data.list || [];
        total = res.data.total || 0;
        
        if (keyword && users.length === 0) {
          Message.info('未找到符合条件的用户');
        }
      }
    } catch (e) {
      logger.error('加载用户列表失败', e);
      users = [];
      total = 0;
    } finally {
      loading = false;
    }
  }
  
  function handleSearch() {
    const keyword = searchKeyword.trim();
    if (!keyword) {
      Message.warning('请输入搜索关键词');
      return;
    }
    isSearching = true;
    page = 1;
    loadUsers();
  }
  
  function handleClearSearch() {
    searchKeyword = '';
    isSearching = false;
    page = 1;
    loadUsers();
  }
  
  function handleSelectionChange(selection) {
    selectedUsers = selection;
  }
  
  function showEditDialog(row) {
    editForm = { ...row };
    editTab = 'basic';
    durationMode = 'set';
    newPassword = '';
    confirmPassword = '';
    newMachineCode = '';
    verifyMachineCode = '';
    verifyResult = null;
    userMachines = [];
    userInvites = [];
    userCommissions = [];
    commissionStats = { total: 0, available: 0 };
    
    loadUserMachines(row.id);
    loadUserInvites(row.id);
    loadUserCommissions(row.id);
    
    editDialogVisible = true;
  }
  
  async function loadUserMachines(userId) {
    try {
      const res = await getUserMachines(userId);
      userMachines = res.data?.list || [];
    } catch (e) {
      logger.error('加载用户机器码失败', e);
      userMachines = [];
    }
  }
  
  async function loadUserInvites(userId) {
    invitesLoading = true;
    try {
      const res = await getUserInvites(userId);
      userInvites = res.data?.list || [];
    } catch (e) {
      logger.error('加载用户邀请记录失败', e);
    } finally {
      invitesLoading = false;
    }
  }
  
  async function loadUserCommissions(userId) {
    commissionsLoading = true;
    try {
      const res = await getUserCommissions(userId);
      userCommissions = res.data?.list || [];
      commissionStats = {
        total: res.data?.total || 0,
        available: res.data?.available || 0
      };
    } catch (e) {
      logger.error('加载用户佣金记录失败', e);
    } finally {
      commissionsLoading = false;
    }
  }
  
  async function saveUser() {
    try {
      const submitData = {
        user_id: editForm.id,
        user_group: editForm.user_group,
        status: editForm.status
      };
      
      if (editForm.user_group !== 'free') {
        if (editForm.expire_time) {
          submitData.expire_time = formatDateForSubmit(editForm.expire_time);
        } else {
          submitData.expire_time = null;
        }
      }
      
      await updateUser(submitData);
      Message.success('保存成功');
      editDialogVisible = false;
      loadUsers();
    } catch (e) {
      // 错误已在拦截器处理
    }
  }
  
  async function toggleStatus(row) {
    const action = row.status === 'active' ? '封禁' : '解封';
    if (!confirm(`确定要${action}用户 ${row.email} 吗？`)) {
      return;
    }
    try {
      await toggleUserStatus(row.id);
      Message.success(`${action}成功`);
      loadUsers();
    } catch (e) {
      // 错误已在拦截器处理
    }
  }
  
  async function showLogsDialog(row) {
    try {
      const res = await getUserLogs(row.id);
      loginLogs = res.data || [];
      logsDialogVisible = true;
    } catch (e) {
      logger.error('加载用户登录日志失败', e);
    }
  }
  
  function handlePageChange(newPage) {
    page = newPage;
    loadUsers();
  }
  
  function handlePageSizeChange(newPageSize) {
    pageSize = newPageSize;
    page = 1;
    loadUsers();
  }
  
  const tableColumns = [
    {
      label: 'ID',
      prop: 'id',
      width: '60px'
    },
    {
      label: '邮箱',
      prop: 'email',
      width: '180px'
    },
    {
      label: '用户组',
      prop: 'user_group',
      width: '100px',
      render: ({ row }) => {
        const type = getGroupType(row.user_group);
        const name = getGroupName(row.user_group);
        return `<span class="tag tag-${type}">${name}</span>`;
      }
    },
    {
      label: '到期时间',
      prop: 'expire_time',
      width: '165px',
      render: ({ row }) => {
        if (row.user_group === 'permanent') {
          return '<span>永久有效</span>';
        }
        if (row.user_group === 'free') {
          return '<span>-</span>';
        }
        return `<span>${row.expire_time || '-'}</span>`;
      }
    },
    {
      label: '注册时间',
      prop: 'register_time',
      width: '165px'
    },
    {
      label: '机器码',
      prop: 'machine_code',
      width: '200px',
      render: ({ row }) => {
        if (row.machine_code) {
          return `<code style="background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 11px;">${row.machine_code}</code>`;
        }
        return '<span style="color: #999;">-</span>';
      }
    },
    {
      label: '状态',
      prop: 'status',
      width: '70px',
      render: ({ row }) => {
        const type = row.status === 'active' ? 'success' : 'danger';
        const text = row.status === 'active' ? '正常' : '已封禁';
        return `<span class="tag tag-${type}">${text}</span>`;
      }
    },
    {
      label: '操作',
      width: '150px',
      render: ({ row }) => {
        return `
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-link btn-primary btn-small" onclick="window.showEditDialog && window.showEditDialog(${row.id})">编辑</button>
            <button class="btn btn-link btn-primary btn-small" onclick="window.showLogsDialog && window.showLogsDialog(${row.id})">登录日志</button>
            <button class="btn btn-link btn-${row.status === 'active' ? 'danger' : 'success'} btn-small" onclick="window.toggleStatus && window.toggleStatus(${row.id})">
              ${row.status === 'active' ? '封禁' : '解封'}
            </button>
          </div>
        `;
      }
    }
  ];
  
  async function unbindMachine(machineCode) {
    if (!confirm(`确定要解绑机器码 ${machineCode} 吗？`)) {
      return;
    }
    try {
      await unbindUserMachine({
        user_id: editForm.id,
        machine_code: machineCode
      });
      Message.success('解绑成功');
      loadUserMachines(editForm.id);
    } catch (e) {
      // 错误已在拦截器处理
    }
  }
  
  // 暴露方法给全局，供 render 函数调用
  if (typeof window !== 'undefined') {
    window.showEditDialog = (userId) => {
      const user = users.find(u => u.id === userId);
      if (user) showEditDialog(user);
    };
    window.showLogsDialog = (userId) => {
      const user = users.find(u => u.id === userId);
      if (user) showLogsDialog(user);
    };
    window.toggleStatus = (userId) => {
      const user = users.find(u => u.id === userId);
      if (user) toggleStatus(user);
    };
    window.unbindMachine = (machineCode) => {
      unbindMachine(machineCode);
    };
  }
  
  onMount(() => {
    loadUsers();
  });
</script>

<div>
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
    <h3 style="margin: 0;">用户管理</h3>
    <div style="display: flex; gap: 10px; align-items: center;">
      <Select
        bind:value={searchType}
        options={searchTypeOptions}
        style="width: 100px;"
      />
      <Input
        bind:value={searchKeyword}
        placeholder={searchType === 'email' ? '请输入邮箱搜索' : searchType === 'machine_code' ? '请输入机器码搜索' : '请输入卡密搜索'}
        style="width: 180px;"
        on:keyup={(e) => e.key === 'Enter' && handleSearch()}
      />
      <Button type="primary" onClick={handleSearch}>搜索</Button>
      <Button onClick={handleClearSearch}>清除</Button>
      <Button onClick={async () => {
        try {
          const res = await exportUsers();
          if (res.data && res.data.csv) {
            const blob = new Blob(['\ufeff' + res.data.csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = res.data.filename || 'users.csv';
            link.click();
            Message.success('导出成功');
          }
        } catch (e) {
          Message.error('导出失败');
        }
      }}>导出数据</Button>
    </div>
  </div>
  
  {#if selectedUsers.length > 0}
    <div style="margin-bottom: 15px; padding: 10px; background: #f0f9ff; border-radius: 6px; display: flex; align-items: center; gap: 10px;">
      <span style="color: #1890ff;">已选择 {selectedUsers.length} 个用户</span>
      <Button size="small" onClick={async () => {
        const { value } = await new Promise((resolve) => {
          const group = prompt('批量设置用户组', 'monthly');
          resolve({ value: group });
        }).catch(() => ({ value: null }));
        if (!value) return;
        try {
          let successCount = 0;
          for (const user of selectedUsers) {
            try {
              await updateUser({ user_id: user.id, user_group: value });
              successCount++;
            } catch (e) {
              // 忽略单个失败
            }
          }
          Message.success(`成功更新 ${successCount} 个用户的用户组`);
          loadUsers();
        } finally {
          selectedUsers = [];
        }
      }}>批量设置用户组</Button>
      <Button size="small" type="danger" onClick={async () => {
        if (!confirm(`确定要封禁选中的 ${selectedUsers.length} 个用户吗？`)) return;
        try {
          let successCount = 0;
          for (const user of selectedUsers) {
            try {
              await updateUser({ user_id: user.id, status: 'banned' });
              successCount++;
            } catch (e) {
              // 忽略单个失败
            }
          }
          Message.success(`成功封禁 ${successCount} 个用户`);
          loadUsers();
        } finally {
          selectedUsers = [];
        }
      }}>批量封禁</Button>
      <Button size="small" type="success" onClick={async () => {
        if (!confirm(`确定要解封选中的 ${selectedUsers.length} 个用户吗？`)) return;
        try {
          let successCount = 0;
          for (const user of selectedUsers) {
            try {
              await updateUser({ user_id: user.id, status: 'active' });
              successCount++;
            } catch (e) {
              // 忽略单个失败
            }
          }
          Message.success(`成功解封 ${successCount} 个用户`);
          loadUsers();
        } finally {
          selectedUsers = [];
        }
      }}>批量解封</Button>
      <Button size="small" onClick={() => selectedUsers = []}>取消选择</Button>
    </div>
  {/if}
  
  <Card>
    <Table
      data={users}
      columns={tableColumns}
      loading={loading}
      stripe={true}
    />
    
    <Pagination
      currentPage={page}
      pageSize={pageSize}
      total={total}
      pageSizes={[10, 20, 50]}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
    />
  </Card>
  
  <!-- 编辑用户对话框 -->
  <Dialog
    visible={editDialogVisible}
    title="编辑用户"
    width="600px"
    onClose={() => editDialogVisible = false}
  >
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <!-- 标签页切换 -->
      <div style="display: flex; gap: 8px; border-bottom: 1px solid #e8e8e8; margin-bottom: 16px;">
        <button
          class="tab-button"
          class:tab-active={editTab === 'basic'}
          onClick={() => editTab = 'basic'}
        >
          基本信息
        </button>
        <button
          class="tab-button"
          class:tab-active={editTab === 'duration'}
          onClick={() => editTab = 'duration'}
        >
          时长管理
        </button>
        <button
          class="tab-button"
          class:tab-active={editTab === 'machine'}
          onClick={() => editTab = 'machine'}
        >
          机器码
        </button>
        <button
          class="tab-button"
          class:tab-active={editTab === 'password'}
          onClick={() => editTab = 'password'}
        >
          密码重置
        </button>
        <button
          class="tab-button"
          class:tab-active={editTab === 'invites'}
          onClick={() => editTab = 'invites'}
        >
          邀请记录
        </button>
        <button
          class="tab-button"
          class:tab-active={editTab === 'commissions'}
          onClick={() => editTab = 'commissions'}
        >
          佣金记录
        </button>
      </div>
      
      <!-- 基本信息标签页 -->
      {#if editTab === 'basic'}
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div>
            <label for="users-edit-id" style="display: block; margin-bottom: 8px; font-weight: 500;">用户ID</label>
            <Input id="users-edit-id" value={editForm.id || ''} disabled />
          </div>
          <div>
            <label for="users-edit-email" style="display: block; margin-bottom: 8px; font-weight: 500;">邮箱</label>
            <Input id="users-edit-email" value={editForm.email || ''} disabled />
          </div>
          <div>
            <label for="users-edit-avatar" style="display: block; margin-bottom: 8px; font-weight: 500;">头像URL</label>
            <Input
              id="users-edit-avatar"
              bind:value={editForm.avatar}
              placeholder="头像URL（可选，留空使用默认头像）"
            />
          </div>
          <div>
            <label for="users-edit-user-group" style="display: block; margin-bottom: 8px; font-weight: 500;">用户组</label>
            <Select
              id="users-edit-user-group"
              bind:value={editForm.user_group}
              options={userGroupOptions}
            />
          </div>
          <div>
            <label for="users-edit-status" style="display: block; margin-bottom: 8px; font-weight: 500;">状态</label>
            <Select
              id="users-edit-status"
              bind:value={editForm.status}
              options={statusOptions}
            />
          </div>
        </div>
      {/if}
      
      <!-- 时长管理标签页 -->
      {#if editTab === 'duration'}
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div>
            <div style="display: block; margin-bottom: 8px; font-weight: 500;">当前到期时间</div>
            {#if editForm.user_group === 'permanent'}
              <span class="tag tag-success">永久会员</span>
            {:else if editForm.user_group === 'free'}
              <span class="tag tag-info">免费用户</span>
            {:else if editForm.expire_time}
              <span>{formatExpireTime(editForm.expire_time)}</span>
            {:else}
              <span style="color: #999;">未设置到期时间</span>
            {/if}
          </div>
          
          {#if editForm.user_group !== 'free'}
            <div style="height: 1px; background: #e8e8e8; margin: 16px 0;"></div>
            
            <div>
              <div style="display: block; margin-bottom: 8px; font-weight: 500;">操作模式</div>
              <div style="display: flex; gap: 16px;">
                <label style="display: flex; align-items: center; gap: 8px;">
                  <input
                    type="radio"
                    value="set"
                    bind:group={durationMode}
                  />
                  <span>设置到期时间</span>
                </label>
                <label style="display: flex; align-items: center; gap: 8px;">
                  <input
                    type="radio"
                    value="add"
                    bind:group={durationMode}
                  />
                  <span>延长到期时间</span>
                </label>
              </div>
            </div>
            
            {#if durationMode === 'set'}
              <div>
                <label for="users-edit-expire-time" style="display: block; margin-bottom: 8px; font-weight: 500;">到期时间</label>
                <Input
                  id="users-edit-expire-time"
                  type="datetime-local"
                  value={editForm.expire_time ? new Date(editForm.expire_time).toISOString().slice(0, 16) : ''}
                  onInput={(e) => {
                    if (e.target.value) {
                      editForm.expire_time = new Date(e.target.value).toISOString().replace('T', ' ').slice(0, 19);
                    } else {
                      editForm.expire_time = null;
                    }
                  }}
                />
              </div>
            {:else}
              <div>
                <div style="display: block; margin-bottom: 8px; font-weight: 500;">延长天数</div>
                <div style="display: flex; gap: 8px; align-items: center;">
                  <Button onClick={() => {
                    const current = editForm.expire_time ? new Date(editForm.expire_time) : new Date();
                    if (current < new Date()) current.setTime(Date.now());
                    current.setDate(current.getDate() + 30);
                    editForm.expire_time = current.toISOString().replace('T', ' ').slice(0, 19);
                    Message.success('已延长30天');
                  }}>+30天</Button>
                  <Button onClick={() => {
                    const current = editForm.expire_time ? new Date(editForm.expire_time) : new Date();
                    if (current < new Date()) current.setTime(Date.now());
                    current.setDate(current.getDate() + 90);
                    editForm.expire_time = current.toISOString().replace('T', ' ').slice(0, 19);
                    Message.success('已延长90天');
                  }}>+90天</Button>
                  <Button onClick={() => {
                    const current = editForm.expire_time ? new Date(editForm.expire_time) : new Date();
                    if (current < new Date()) current.setTime(Date.now());
                    current.setDate(current.getDate() + 365);
                    editForm.expire_time = current.toISOString().replace('T', ' ').slice(0, 19);
                    Message.success('已延长1年');
                  }}>+1年</Button>
                  <Button type="success" onClick={() => {
                    editForm.user_group = 'permanent';
                    editForm.expire_time = null;
                    Message.success('已设置为永久会员');
                  }}>设为永久</Button>
                </div>
              </div>
              <div>
                <label for="users-edit-custom-days" style="display: block; margin-bottom: 8px; font-weight: 500;">自定义天数</label>
                <div style="display: flex; gap: 8px; align-items: center;">
                  <Input
                    id="users-edit-custom-days"
                    type="number"
                    bind:value={customDays}
                    min="1"
                    max="9999"
                  />
                  <Button onClick={() => {
                    const current = editForm.expire_time ? new Date(editForm.expire_time) : new Date();
                    if (current < new Date()) current.setTime(Date.now());
                    current.setDate(current.getDate() + customDays);
                    editForm.expire_time = current.toISOString().replace('T', ' ').slice(0, 19);
                    Message.success(`已延长${customDays}天`);
                  }}>应用</Button>
                </div>
              </div>
            {/if}
          {/if}
        </div>
      {/if}
      
      <!-- 机器码标签页 -->
      {#if editTab === 'machine'}
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div>
            <div style="display: block; margin-bottom: 8px; font-weight: 500;">已绑定机器码</div>
            {#if userMachines.length > 0}
              <Table
                data={userMachines}
                columns={[
                  { label: '机器码', prop: 'machine_code' },
                  { label: '绑定时间', prop: 'bind_time', width: '180px' },
                  {
                    label: '操作',
                    width: '80px',
                    render: ({ row }) => `<button class="btn btn-link btn-danger btn-small" onclick="window.unbindMachine && window.unbindMachine('${row.machine_code}')">解绑</button>`
                  }
                ]}
                stripe={true}
              />
            {:else}
              <div style="padding: 20px; text-align: center; color: #999;">暂无绑定的机器码</div>
            {/if}
          </div>
          
          <div style="height: 1px; background: #e8e8e8; margin: 16px 0;"></div>
          
          <div>
            <h5 style="margin: 0 0 12px 0;">验证机器码归属</h5>
            <div style="display: flex; gap: 10px; align-items: center;">
              <Input
                bind:value={verifyMachineCode}
                placeholder="请输入要验证的机器码"
                style="width: 350px;"
              />
              <Button type="primary" onClick={async () => {
                if (!verifyMachineCode.trim()) {
                  Message.error('请输入要验证的机器码');
                  return;
                }
                try {
                  const res = await verifyUserMachine({
                    user_id: editForm.id,
                    machine_code: verifyMachineCode.trim()
                  });
                  const status = res.data?.status;
                  if (status === 'self') {
                    verifyResult = true;
                    Message.success('验证成功：该机器码属于此用户，可以绑定');
                  } else if (status === 'other') {
                    verifyResult = 'other';
                    Message.warning('该机器码已被其他用户绑定');
                  } else {
                    verifyResult = false;
                    Message.error('该机器码未被任何用户绑定');
                  }
                } catch (e) {
                  verifyResult = false;
                }
              }}>验证</Button>
            </div>
            {#if verifyResult === true}
              <div style="margin-top: 12px; padding: 12px; background: #f6ffed; border: 1px solid #b7eb8f; border-radius: 4px; color: #52c41a;">
                验证成功：该机器码属于此用户，可以绑定
              </div>
            {:else if verifyResult === 'other'}
              <div style="margin-top: 12px; padding: 12px; background: #fffbe6; border: 1px solid #ffe58f; border-radius: 4px; color: #faad14;">
                该机器码已被其他用户绑定
              </div>
            {:else if verifyResult === false}
              <div style="margin-top: 12px; padding: 12px; background: #fff2f0; border: 1px solid #ffccc7; border-radius: 4px; color: #ff4d4f;">
                该机器码未被任何用户绑定
              </div>
            {/if}
          </div>
          
          <div style="height: 1px; background: #e8e8e8; margin: 16px 0;"></div>
          
          <div>
            <h5 style="margin: 0 0 12px 0;">绑定新机器码</h5>
            <div style="display: flex; gap: 10px; align-items: center;">
              <Input
                bind:value={newMachineCode}
                placeholder="请输入要绑定的机器码"
                style="width: 350px;"
              />
              <Button type="primary" onClick={async () => {
                if (!newMachineCode.trim()) {
                  Message.error('请输入要绑定的机器码');
                  return;
                }
                try {
                  await bindUserMachine({
                    user_id: editForm.id,
                    machine_code: newMachineCode.trim()
                  });
                  Message.success('绑定成功');
                  newMachineCode = '';
                  loadUserMachines(editForm.id);
                } catch (e) {
                  // 错误已在拦截器处理
                }
              }}>绑定</Button>
            </div>
          </div>
        </div>
      {/if}
      
      <!-- 密码重置标签页 -->
      {#if editTab === 'password'}
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div style="padding: 12px; background: #fffbe6; border: 1px solid #ffe58f; border-radius: 4px; color: #faad14;">
            重置密码后，用户将无法使用旧密码登录，请谨慎操作
          </div>
          <div>
            <label for="users-reset-password" style="display: block; margin-bottom: 8px; font-weight: 500;">新密码</label>
            <Input
              id="users-reset-password"
              type="password"
              bind:value={newPassword}
              placeholder="请输入新密码"
              showPassword
            />
          </div>
          <div>
            <label for="users-reset-confirm-password" style="display: block; margin-bottom: 8px; font-weight: 500;">确认密码</label>
            <Input
              id="users-reset-confirm-password"
              type="password"
              bind:value={confirmPassword}
              placeholder="请再次输入新密码"
              showPassword
            />
          </div>
          <div>
            <Button type="danger" onClick={async () => {
              if (!newPassword) {
                Message.error('请输入新密码');
                return;
              }
              if (newPassword !== confirmPassword) {
                Message.error('两次输入的密码不一致');
                return;
              }
              if (!confirm('确定要重置该用户的密码吗？重置后用户将无法使用旧密码登录。')) {
                return;
              }
              try {
                await resetUserPassword({
                  user_id: editForm.id,
                  new_password: newPassword
                });
                Message.success('密码重置成功');
                newPassword = '';
                confirmPassword = '';
              } catch (e) {
                // 错误已在拦截器处理
              }
            }}>重置密码</Button>
          </div>
        </div>
      {/if}
      
      <!-- 邀请记录标签页 -->
      {#if editTab === 'invites'}
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <div style="padding: 12px; border: 1px solid #e8e8e8; border-radius: 4px;">
              <div style="font-size: 12px; color: #999; margin-bottom: 4px;">邀请码</div>
              <div style="font-size: 16px; font-weight: 500;">{editForm.invite_code || '未设置'}</div>
            </div>
            <div style="padding: 12px; border: 1px solid #e8e8e8; border-radius: 4px;">
              <div style="font-size: 12px; color: #999; margin-bottom: 4px;">邀请人数</div>
              <div style="font-size: 16px; font-weight: 500;">{userInvites.length} 人</div>
            </div>
          </div>
          
          {#if invitesLoading}
            <div style="padding: 40px; text-align: center; color: #999;">加载中...</div>
          {:else if userInvites.length > 0}
            <Table
              data={userInvites}
              columns={[
                { label: '被邀请用户', prop: 'email' },
                { label: '用户组', prop: 'user_group', width: '100px', render: ({ row }) => `<span class="tag tag-${getGroupType(row.user_group)}">${getGroupName(row.user_group)}</span>` },
                { label: '注册时间', prop: 'register_time', width: '165px' }
              ]}
              stripe={true}
            />
          {:else}
            <div style="padding: 40px; text-align: center; color: #999;">暂无邀请记录</div>
          {/if}
        </div>
      {/if}
      
      <!-- 佣金记录标签页 -->
      {#if editTab === 'commissions'}
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <div style="padding: 12px; border: 1px solid #e8e8e8; border-radius: 4px;">
              <div style="font-size: 12px; color: #999; margin-bottom: 4px;">累计佣金</div>
              <div style="font-size: 16px; font-weight: 500; color: #f5222d;">¥{commissionStats.total.toFixed(2)}</div>
            </div>
            <div style="padding: 12px; border: 1px solid #e8e8e8; border-radius: 4px;">
              <div style="font-size: 12px; color: #999; margin-bottom: 4px;">可提现佣金</div>
              <div style="font-size: 16px; font-weight: 500; color: #52c41a;">¥{commissionStats.available.toFixed(2)}</div>
            </div>
          </div>
          
          {#if commissionsLoading}
            <div style="padding: 40px; text-align: center; color: #999;">加载中...</div>
          {:else if userCommissions.length > 0}
            <Table
              data={userCommissions}
              columns={[
                { label: '来源用户', prop: 'from_email' },
                { label: '佣金金额', prop: 'amount', width: '100px', render: ({ row }) => `<span style="color: #f5222d;">+¥${row.amount}</span>` },
                { label: '佣金比例', prop: 'rate', width: '80px', render: ({ row }) => `${row.rate}%` },
                { label: '状态', prop: 'status', width: '80px', render: ({ row }) => {
                  const type = row.status === 'available' ? 'success' : row.status === 'withdrawn' ? 'info' : 'warning';
                  const text = row.status === 'available' ? '可提现' : row.status === 'withdrawn' ? '已提现' : '处理中';
                  return `<span class="tag tag-${type}">${text}</span>`;
                }},
                { label: '时间', prop: 'created_at', width: '165px' }
              ]}
              stripe={true}
            />
          {:else}
            <div style="padding: 40px; text-align: center; color: #999;">暂无佣金记录</div>
          {/if}
        </div>
      {/if}
    </div>
    
    <div slot="footer" style="display: flex; justify-content: flex-end; gap: 10px;">
      <Button onClick={() => editDialogVisible = false}>取消</Button>
      <Button type="primary" onClick={saveUser}>保存修改</Button>
    </div>
  </Dialog>
  
  <!-- 登录日志对话框 -->
  <Dialog
    visible={logsDialogVisible}
    title="用户登录日志"
    width="800px"
    onClose={() => logsDialogVisible = false}
  >
    <Table
      data={loginLogs}
      columns={[
        { label: '登录时间', prop: 'login_time', width: '180px' },
        { label: '登录IP', prop: 'login_ip', width: '150px' },
        { label: '设备名称', prop: 'device_name' },
        { label: '系统版本', prop: 'os_version' },
        { label: '客户端版本', prop: 'client_version', width: '100px' },
        { label: '登录结果', prop: 'login_result', width: '100px', render: ({ row }) => {
          const type = row.login_result === 'success' ? 'success' : 'danger';
          const text = row.login_result === 'success' ? '成功' : '失败';
          return `<span class="tag tag-${type}">${text}</span>`;
        }}
      ]}
      stripe={true}
    />
  </Dialog>
</div>

<style>
  :global(.tag) {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
  }
  
  :global(.tag-success) {
    background: #f6ffed;
    color: #52c41a;
    border: 1px solid #b7eb8f;
  }
  
  :global(.tag-danger) {
    background: #fff2f0;
    color: #ff4d4f;
    border: 1px solid #ffccc7;
  }
  
  :global(.tag-info) {
    background: #e6f7ff;
    color: #1890ff;
    border: 1px solid #91d5ff;
  }
  
  :global(.tag-warning) {
    background: #fffbe6;
    color: #faad14;
    border: 1px solid #ffe58f;
  }
  
  .tab-button {
    padding: 8px 16px;
    border: none;
    background: transparent;
    cursor: pointer;
    color: rgba(0, 0, 0, 0.65);
    border-bottom: 2px solid transparent;
    transition: all 0.3s;
  }
  
  .tab-button:hover {
    color: #1890ff;
  }
  
  .tab-button.tab-active {
    color: #1890ff;
    border-bottom-color: #1890ff;
    font-weight: 500;
  }
</style>
