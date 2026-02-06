<script>
  import { onMount } from 'svelte';
  import { getAnnouncements, saveAnnouncement, deleteAnnouncement } from '$lib/api';
  import logger from '$lib/utils/logger';
  import Card from '$lib/components/Card.svelte';
  import Table from '$lib/components/Table.svelte';
  import Button from '$lib/components/Button.svelte';
  import Dialog from '$lib/components/Dialog.svelte';
  import Input from '$lib/components/Input.svelte';
  import Select from '$lib/components/Select.svelte';
  import Message from '$lib/components/Message';
  
  let loading = $state(false);
  let saving = $state(false);
  let announcements = $state([]);
  let editDialogVisible = $state(false);
  let editForm = $state({
    id: 0,
    title: '',
    content: '',
    type: 'info',
    priority: 0,
    is_active: true,
    start_time: '',
    end_time: ''
  });
  
  function getTypeColor(type) {
    const colors = { info: '', warning: 'warning', success: 'success', error: 'danger' };
    return colors[type] || '';
  }
  
  function getTypeName(type) {
    const names = { info: '信息', warning: '警告', success: '成功', error: '错误' };
    return names[type] || type;
  }
  
  async function loadAnnouncements() {
    loading = true;
    try {
      const res = await getAnnouncements();
      announcements = res.data?.list || [];
    } catch (e) {
      logger.error('加载公告失败', e);
    } finally {
      loading = false;
    }
  }
  
  function showEditDialog(row = null) {
    if (row) {
      editForm = {
        id: row.id || 0,
        title: row.title || '',
        content: row.content || '',
        type: row.type || 'info',
        priority: row.priority || 0,
        is_active: !!row.is_active,
        start_time: row.start_time ? formatDateTimeForInput(row.start_time) : '',
        end_time: row.end_time ? formatDateTimeForInput(row.end_time) : ''
      };
    } else {
      editForm = {
        id: 0,
        title: '',
        content: '',
        type: 'info',
        priority: 0,
        is_active: true,
        start_time: '',
        end_time: ''
      };
    }
    editDialogVisible = true;
  }
  
  function formatDateTimeForInput(datetime) {
    if (!datetime) return '';
    const d = new Date(datetime);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
  
  function formatDateTimeForAPI(datetime) {
    if (!datetime) return null;
    return new Date(datetime).toISOString().slice(0, 19).replace('T', ' ');
  }
  
  async function handleSave() {
    if (!editForm.title || !editForm.content) {
      Message.error('标题和内容不能为空');
      return;
    }
    
    saving = true;
    try {
      const data = {
        ...editForm,
        start_time: formatDateTimeForAPI(editForm.start_time),
        end_time: formatDateTimeForAPI(editForm.end_time)
      };
      await saveAnnouncement(data);
      Message.success(editForm.id ? '更新成功' : '发布成功');
      editDialogVisible = false;
      loadAnnouncements();
    } catch (e) {
      // 错误已在拦截器处理
    } finally {
      saving = false;
    }
  }
  
  async function handleDelete(row) {
    if (!confirm(`确定要删除公告"${row.title}"吗？`)) {
      return;
    }
    
    try {
      await deleteAnnouncement(row.id);
      Message.success('删除成功');
      loadAnnouncements();
    } catch (e) {
      // 错误已在拦截器处理
    }
  }
  
  onMount(() => {
    loadAnnouncements();
  });
  
  const tableColumns = [
    { prop: 'id', label: 'ID', width: '60px' },
    { prop: 'title', label: '标题', minWidth: '200px' },
    { 
      prop: 'type', 
      label: '类型', 
      width: '80px',
      render: ({ row }) => `<span class="tag tag-${getTypeColor(row.type)}">${getTypeName(row.type)}</span>`
    },
    { prop: 'priority', label: '优先级', width: '80px', align: 'center' },
    { 
      prop: 'is_active', 
      label: '状态', 
      width: '80px',
      align: 'center',
      render: ({ row }) => `<span class="tag tag-${row.is_active ? 'success' : 'info'}">${row.is_active ? '启用' : '禁用'}</span>`
    },
    { prop: 'created_at', label: '创建时间', width: '165px' },
    { 
      prop: 'actions', 
      label: '操作', 
      width: '150px',
      align: 'center',
      render: ({ row }) => `
        <button class="action-btn edit-btn" data-id="${row.id}" style="background: none; border: none; color: #1890ff; cursor: pointer; margin-right: 8px;">编辑</button>
        <button class="action-btn delete-btn" data-id="${row.id}" style="background: none; border: none; color: #f5222d; cursor: pointer;">删除</button>
      `
    }
  ];
  
  $effect(() => {
    // 处理操作按钮点击
    setTimeout(() => {
      document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.onclick = (e) => {
          const id = Number(e.target.getAttribute('data-id'));
          const announcement = announcements.find(a => a.id === id);
          if (announcement) showEditDialog(announcement);
        };
      });
      
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = (e) => {
          const id = Number(e.target.getAttribute('data-id'));
          const announcement = announcements.find(a => a.id === id);
          if (announcement) handleDelete(announcement);
        };
      });
    }, 0);
  });
</script>

<Card title="公告管理">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
    <Button type="primary" onClick={() => showEditDialog()}>发布公告</Button>
  </div>
  
  <Table
    data={announcements}
    columns={tableColumns}
    loading={loading}
    stripe={true}
  />
</Card>

<Dialog
  bind:visible={editDialogVisible}
  title={editForm.id ? '编辑公告' : '发布公告'}
  width="600px"
>
  <div style="padding: 20px;">
    <div style="margin-bottom: 16px;">
      <label for="announcement-title" style="display: block; margin-bottom: 8px; font-weight: 500;">标题 <span style="color: #f5222d;">*</span></label>
      <Input
        id="announcement-title"
        bind:value={editForm.title}
        placeholder="请输入公告标题"
        style="width: 100%;"
      />
    </div>
    
    <div style="margin-bottom: 16px;">
      <label for="announcement-content" style="display: block; margin-bottom: 8px; font-weight: 500;">内容 <span style="color: #f5222d;">*</span></label>
      <textarea
        id="announcement-content"
        bind:value={editForm.content}
        placeholder="请输入公告内容"
        rows="5"
        style="width: 100%; padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 14px; font-family: inherit; resize: vertical;"
      ></textarea>
    </div>
    
    <div style="margin-bottom: 16px;">
      <label for="announcement-type" style="display: block; margin-bottom: 8px; font-weight: 500;">类型</label>
      <Select
        id="announcement-type"
        bind:value={editForm.type}
        options={[
          { label: '信息', value: 'info' },
          { label: '警告', value: 'warning' },
          { label: '成功', value: 'success' },
          { label: '错误', value: 'error' }
        ]}
        style="width: 100%;"
      />
    </div>
    
    <div style="margin-bottom: 16px;">
      <label for="announcement-priority" style="display: block; margin-bottom: 8px; font-weight: 500;">优先级</label>
      <Input
        id="announcement-priority"
        type="number"
        bind:value={editForm.priority}
        min="0"
        max="100"
        style="width: 100%;"
      />
      <span style="margin-left: 10px; color: #999; font-size: 12px;">数值越大越靠前</span>
    </div>
    
    <div style="margin-bottom: 16px;">
      <div style="display: block; margin-bottom: 8px; font-weight: 500;">状态</div>
      <label style="display: flex; align-items: center; cursor: pointer;">
        <input
          type="checkbox"
          bind:checked={editForm.is_active}
          style="margin-right: 8px; width: 16px; height: 16px; cursor: pointer;"
        />
        <span>{editForm.is_active ? '启用' : '禁用'}</span>
      </label>
    </div>
    
    <div style="margin-bottom: 16px;">
      <label for="announcement-start-time" style="display: block; margin-bottom: 8px; font-weight: 500;">生效时间</label>
      <div style="display: flex; align-items: center; gap: 8px;">
        <input
          id="announcement-start-time"
          type="datetime-local"
          bind:value={editForm.start_time}
          style="flex: 1; padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 14px;"
        />
        <span>至</span>
        <input
          type="datetime-local"
          bind:value={editForm.end_time}
          aria-label="结束时间"
          style="flex: 1; padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 14px;"
        />
      </div>
    </div>
  </div>
  
  <div slot="footer" style="display: flex; justify-content: flex-end; gap: 8px; padding: 16px 20px; border-top: 1px solid #e8e8e8;">
    <Button onClick={() => editDialogVisible = false}>取消</Button>
    <Button type="primary" onClick={handleSave} loading={saving}>保存</Button>
  </div>
</Dialog>

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
