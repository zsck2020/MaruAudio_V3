import { _ as attr_class } from "../../../../chunks/index2.js";
import { e as exportUsers, f as updateUser, h as getUsers } from "../../../../chunks/index3.js";
import { P as Pagination, e as escapeHtml } from "../../../../chunks/escapeHtml.js";
import { l as logger } from "../../../../chunks/logger.js";
import { C as Card } from "../../../../chunks/Card.js";
import { B as Button } from "../../../../chunks/Button.js";
import { I as Input } from "../../../../chunks/Input.js";
import { S as Select } from "../../../../chunks/Select.js";
import { T as Table } from "../../../../chunks/Table.js";
import { D as Dialog } from "../../../../chunks/Dialog.js";
import { M as Message } from "../../../../chunks/Message.js";
import { e as escape_html } from "../../../../chunks/context.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let loading = false;
    let users = [];
    let page = 1;
    let pageSize = 10;
    let total = 0;
    let searchType = "email";
    let searchKeyword = "";
    let selectedUsers = [];
    let editDialogVisible = false;
    let editForm = {};
    let editTab = "basic";
    let logsDialogVisible = false;
    let loginLogs = [];
    const searchTypeOptions = [
      { label: "邮箱", value: "email" },
      { label: "机器码", value: "machine_code" },
      { label: "卡密", value: "card_key" }
    ];
    const userGroupOptions = [
      { label: "免费用户", value: "free" },
      { label: "试用会员", value: "trial" },
      { label: "月度会员", value: "monthly" },
      { label: "年度会员", value: "yearly" },
      { label: "永久会员", value: "permanent" }
    ];
    const statusOptions = [
      { label: "正常", value: "active" },
      { label: "已封禁", value: "banned" }
    ];
    function getGroupType(group) {
      const types = {
        free: "info",
        trial: "warning",
        monthly: "",
        yearly: "warning",
        permanent: "success"
      };
      return types[group] || "info";
    }
    function getGroupName(group) {
      const names = {
        free: "免费用户",
        trial: "试用会员",
        monthly: "月度会员",
        yearly: "年度会员",
        permanent: "永久会员"
      };
      return names[group] || group;
    }
    function formatDateForSubmit(time) {
      if (!time) return null;
      if (time instanceof Date) {
        const year = time.getFullYear();
        const month = String(time.getMonth() + 1).padStart(2, "0");
        const day = String(time.getDate()).padStart(2, "0");
        const hours = String(time.getHours()).padStart(2, "0");
        const minutes = String(time.getMinutes()).padStart(2, "0");
        const seconds = String(time.getSeconds()).padStart(2, "0");
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }
      if (typeof time === "string") {
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(time)) {
          return time;
        }
        if (time.includes("T")) {
          const d = new Date(time);
          return formatDateForSubmit(d);
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(time)) {
          return time + " 00:00:00";
        }
      }
      return time;
    }
    async function loadUsers() {
      loading = true;
      try {
        const params = { page, page_size: pageSize };
        const keyword = searchKeyword.trim();
        if (keyword) {
          params.keyword = keyword;
          params.search_type = searchType;
        }
        logger.log("[Users] 加载用户列表, params:", params);
        const res = await getUsers(params);
        if (res.data) {
          users = res.data.list || [];
          total = res.data.total || 0;
          if (keyword && users.length === 0) {
            Message.info("未找到符合条件的用户");
          }
        }
      } catch (e) {
        logger.error("加载用户列表失败", e);
        users = [];
        total = 0;
      } finally {
        loading = false;
      }
    }
    function handleSearch() {
      const keyword = searchKeyword.trim();
      if (!keyword) {
        Message.warning("请输入搜索关键词");
        return;
      }
      page = 1;
      loadUsers();
    }
    function handleClearSearch() {
      searchKeyword = "";
      page = 1;
      loadUsers();
    }
    async function saveUser() {
      try {
        const submitData = {
          user_id: editForm.id,
          user_group: editForm.user_group,
          status: editForm.status
        };
        if (editForm.user_group !== "free") {
          if (editForm.expire_time) {
            submitData.expire_time = formatDateForSubmit(editForm.expire_time);
          } else {
            submitData.expire_time = null;
          }
        }
        await updateUser(submitData);
        Message.success("保存成功");
        editDialogVisible = false;
        loadUsers();
      } catch (e) {
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
      { label: "ID", prop: "id", width: "60px" },
      { label: "邮箱", prop: "email", width: "180px" },
      {
        label: "用户组",
        prop: "user_group",
        width: "100px",
        render: ({ row }) => {
          const type = getGroupType(row.user_group);
          const name = getGroupName(row.user_group);
          return `<span class="tag tag-${type}">${name}</span>`;
        }
      },
      {
        label: "到期时间",
        prop: "expire_time",
        width: "165px",
        render: ({ row }) => {
          if (row.user_group === "permanent") {
            return "<span>永久有效</span>";
          }
          if (row.user_group === "free") {
            return "<span>-</span>";
          }
          return `<span>${row.expire_time || "-"}</span>`;
        }
      },
      { label: "注册时间", prop: "register_time", width: "165px" },
      {
        label: "机器码",
        prop: "machine_code",
        width: "200px",
        render: ({ row }) => {
          if (row.machine_code) {
            return `<code style="background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 11px;">${escapeHtml(row.machine_code)}</code>`;
          }
          return '<span style="color: #999;">-</span>';
        }
      },
      {
        label: "状态",
        prop: "status",
        width: "70px",
        render: ({ row }) => {
          const type = row.status === "active" ? "success" : "danger";
          const text = row.status === "active" ? "正常" : "已封禁";
          return `<span class="tag tag-${type}">${text}</span>`;
        }
      },
      {
        label: "操作",
        width: "150px",
        render: ({ row }) => {
          return `
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-link btn-primary btn-small" data-action="edit" data-id="${row.id}">编辑</button>
            <button class="btn btn-link btn-primary btn-small" data-action="logs" data-id="${row.id}">登录日志</button>
            <button class="btn btn-link btn-${row.status === "active" ? "danger" : "success"} btn-small" data-action="toggle" data-id="${row.id}">
              ${row.status === "active" ? "封禁" : "解封"}
            </button>
          </div>
        `;
        }
      }
    ];
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div><div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;"><h3 style="margin: 0;">用户管理</h3> <div style="display: flex; gap: 10px; align-items: center;">`);
      Select($$renderer3, {
        options: searchTypeOptions,
        style: "width: 100px;",
        get value() {
          return searchType;
        },
        set value($$value) {
          searchType = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> `);
      Input($$renderer3, {
        placeholder: searchType === "email" ? "请输入邮箱搜索" : searchType === "machine_code" ? "请输入机器码搜索" : "请输入卡密搜索",
        style: "width: 180px;",
        get value() {
          return searchKeyword;
        },
        set value($$value) {
          searchKeyword = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> `);
      Button($$renderer3, {
        type: "primary",
        onClick: handleSearch,
        children: ($$renderer4) => {
          $$renderer4.push(`<!---->搜索`);
        }
      });
      $$renderer3.push(`<!----> `);
      Button($$renderer3, {
        onClick: handleClearSearch,
        children: ($$renderer4) => {
          $$renderer4.push(`<!---->清除`);
        }
      });
      $$renderer3.push(`<!----> `);
      Button($$renderer3, {
        onClick: async () => {
          try {
            const res = await exportUsers();
            if (res.data && res.data.csv) {
              const blob = new Blob(["\uFEFF" + res.data.csv], { type: "text/csv;charset=utf-8;" });
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.download = res.data.filename || "users.csv";
              link.click();
              Message.success("导出成功");
            }
          } catch (e) {
            Message.error("导出失败");
          }
        },
        children: ($$renderer4) => {
          $$renderer4.push(`<!---->导出数据`);
        }
      });
      $$renderer3.push(`<!----></div></div> `);
      if (selectedUsers.length > 0) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<div style="margin-bottom: 15px; padding: 10px; background: #f0f9ff; border-radius: 6px; display: flex; align-items: center; gap: 10px;"><span style="color: #1890ff;">已选择 ${escape_html(selectedUsers.length)} 个用户</span> `);
        Button($$renderer3, {
          size: "small",
          onClick: async () => {
            const { value } = await new Promise((resolve) => {
              const group = prompt("批量设置用户组", "monthly");
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
                }
              }
              Message.success(`成功更新 ${successCount} 个用户的用户组`);
              loadUsers();
            } finally {
              selectedUsers = [];
            }
          },
          children: ($$renderer4) => {
            $$renderer4.push(`<!---->批量设置用户组`);
          }
        });
        $$renderer3.push(`<!----> `);
        Button($$renderer3, {
          size: "small",
          type: "danger",
          onClick: async () => {
            if (!confirm(`确定要封禁选中的 ${selectedUsers.length} 个用户吗？`)) return;
            try {
              let successCount = 0;
              for (const user of selectedUsers) {
                try {
                  await updateUser({ user_id: user.id, status: "banned" });
                  successCount++;
                } catch (e) {
                }
              }
              Message.success(`成功封禁 ${successCount} 个用户`);
              loadUsers();
            } finally {
              selectedUsers = [];
            }
          },
          children: ($$renderer4) => {
            $$renderer4.push(`<!---->批量封禁`);
          }
        });
        $$renderer3.push(`<!----> `);
        Button($$renderer3, {
          size: "small",
          type: "success",
          onClick: async () => {
            if (!confirm(`确定要解封选中的 ${selectedUsers.length} 个用户吗？`)) return;
            try {
              let successCount = 0;
              for (const user of selectedUsers) {
                try {
                  await updateUser({ user_id: user.id, status: "active" });
                  successCount++;
                } catch (e) {
                }
              }
              Message.success(`成功解封 ${successCount} 个用户`);
              loadUsers();
            } finally {
              selectedUsers = [];
            }
          },
          children: ($$renderer4) => {
            $$renderer4.push(`<!---->批量解封`);
          }
        });
        $$renderer3.push(`<!----> `);
        Button($$renderer3, {
          size: "small",
          onClick: () => selectedUsers = [],
          children: ($$renderer4) => {
            $$renderer4.push(`<!---->取消选择`);
          }
        });
        $$renderer3.push(`<!----></div>`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> `);
      Card($$renderer3, {
        children: ($$renderer4) => {
          Table($$renderer4, { data: users, columns: tableColumns, loading, stripe: true });
          $$renderer4.push(`<!----> `);
          Pagination($$renderer4, {
            currentPage: page,
            pageSize,
            total,
            pageSizes: [10, 20, 50],
            onPageChange: handlePageChange,
            onPageSizeChange: handlePageSizeChange
          });
          $$renderer4.push(`<!---->`);
        }
      });
      $$renderer3.push(`<!----> `);
      Dialog($$renderer3, {
        visible: editDialogVisible,
        title: "编辑用户",
        width: "600px",
        onClose: () => editDialogVisible = false,
        children: ($$renderer4) => {
          $$renderer4.push(`<div style="display: flex; flex-direction: column; gap: 16px;"><div style="display: flex; gap: 8px; border-bottom: 1px solid #e8e8e8; margin-bottom: 16px;"><button${attr_class("tab-button svelte-iqty8q", void 0, { "tab-active": editTab === "basic" })}>基本信息</button> <button${attr_class("tab-button svelte-iqty8q", void 0, { "tab-active": editTab === "duration" })}>时长管理</button> <button${attr_class("tab-button svelte-iqty8q", void 0, { "tab-active": editTab === "machine" })}>机器码</button> <button${attr_class("tab-button svelte-iqty8q", void 0, { "tab-active": editTab === "password" })}>密码重置</button> <button${attr_class("tab-button svelte-iqty8q", void 0, { "tab-active": editTab === "invites" })}>邀请记录</button> <button${attr_class("tab-button svelte-iqty8q", void 0, { "tab-active": editTab === "commissions" })}>佣金记录</button></div> `);
          {
            $$renderer4.push("<!--[-->");
            $$renderer4.push(`<div style="display: flex; flex-direction: column; gap: 16px;"><div><label for="users-edit-id" style="display: block; margin-bottom: 8px; font-weight: 500;">用户ID</label> `);
            Input($$renderer4, {
              id: "users-edit-id",
              value: editForm.id || "",
              disabled: true
            });
            $$renderer4.push(`<!----></div> <div><label for="users-edit-email" style="display: block; margin-bottom: 8px; font-weight: 500;">邮箱</label> `);
            Input($$renderer4, {
              id: "users-edit-email",
              value: editForm.email || "",
              disabled: true
            });
            $$renderer4.push(`<!----></div> <div><label for="users-edit-avatar" style="display: block; margin-bottom: 8px; font-weight: 500;">头像URL</label> `);
            Input($$renderer4, {
              id: "users-edit-avatar",
              placeholder: "头像URL（可选，留空使用默认头像）",
              get value() {
                return editForm.avatar;
              },
              set value($$value) {
                editForm.avatar = $$value;
                $$settled = false;
              }
            });
            $$renderer4.push(`<!----></div> <div><label for="users-edit-user-group" style="display: block; margin-bottom: 8px; font-weight: 500;">用户组</label> `);
            Select($$renderer4, {
              id: "users-edit-user-group",
              options: userGroupOptions,
              get value() {
                return editForm.user_group;
              },
              set value($$value) {
                editForm.user_group = $$value;
                $$settled = false;
              }
            });
            $$renderer4.push(`<!----></div> <div><label for="users-edit-status" style="display: block; margin-bottom: 8px; font-weight: 500;">状态</label> `);
            Select($$renderer4, {
              id: "users-edit-status",
              options: statusOptions,
              get value() {
                return editForm.status;
              },
              set value($$value) {
                editForm.status = $$value;
                $$settled = false;
              }
            });
            $$renderer4.push(`<!----></div></div>`);
          }
          $$renderer4.push(`<!--]--> `);
          {
            $$renderer4.push("<!--[!-->");
          }
          $$renderer4.push(`<!--]--> `);
          {
            $$renderer4.push("<!--[!-->");
          }
          $$renderer4.push(`<!--]--> `);
          {
            $$renderer4.push("<!--[!-->");
          }
          $$renderer4.push(`<!--]--> `);
          {
            $$renderer4.push("<!--[!-->");
          }
          $$renderer4.push(`<!--]--> `);
          {
            $$renderer4.push("<!--[!-->");
          }
          $$renderer4.push(`<!--]--></div>`);
        },
        $$slots: {
          default: true,
          footer: ($$renderer4) => {
            $$renderer4.push(`<div slot="footer" style="display: flex; justify-content: flex-end; gap: 10px;">`);
            Button($$renderer4, {
              onClick: () => editDialogVisible = false,
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->取消`);
              }
            });
            $$renderer4.push(`<!----> `);
            Button($$renderer4, {
              type: "primary",
              onClick: saveUser,
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->保存修改`);
              }
            });
            $$renderer4.push(`<!----></div>`);
          }
        }
      });
      $$renderer3.push(`<!----> `);
      Dialog($$renderer3, {
        visible: logsDialogVisible,
        title: "用户登录日志",
        width: "800px",
        onClose: () => logsDialogVisible = false,
        children: ($$renderer4) => {
          Table($$renderer4, {
            data: loginLogs,
            columns: [
              { label: "登录时间", prop: "login_time", width: "180px" },
              { label: "登录IP", prop: "login_ip", width: "150px" },
              { label: "设备名称", prop: "device_name" },
              { label: "系统版本", prop: "os_version" },
              { label: "客户端版本", prop: "client_version", width: "100px" },
              {
                label: "登录结果",
                prop: "login_result",
                width: "100px",
                render: ({ row }) => {
                  const type = row.login_result === "success" ? "success" : "danger";
                  const text = row.login_result === "success" ? "成功" : "失败";
                  return `<span class="tag tag-${type}">${text}</span>`;
                }
              }
            ],
            stripe: true
          });
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----></div>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
  });
}
export {
  _page as default
};
