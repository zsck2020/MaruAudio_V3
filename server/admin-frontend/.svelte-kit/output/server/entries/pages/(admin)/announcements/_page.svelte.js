import { a2 as attr } from "../../../../chunks/index.js";
import { e as escape_html } from "../../../../chunks/context.js";
import { s as saveAnnouncement, g as getAnnouncements } from "../../../../chunks/index2.js";
import { l as logger } from "../../../../chunks/logger.js";
import { C as Card } from "../../../../chunks/Card.js";
import { T as Table } from "../../../../chunks/Table.js";
import { B as Button } from "../../../../chunks/Button.js";
import { D as Dialog } from "../../../../chunks/Dialog.js";
import { I as Input } from "../../../../chunks/Input.js";
import { S as Select } from "../../../../chunks/Select.js";
import { M as Message } from "../../../../chunks/Message.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let loading = false;
    let saving = false;
    let announcements = [];
    let editDialogVisible = false;
    let editForm = {
      id: 0,
      title: "",
      content: "",
      type: "info",
      priority: 0,
      is_active: true,
      start_time: "",
      end_time: ""
    };
    function getTypeColor(type) {
      const colors = {
        info: "",
        warning: "warning",
        success: "success",
        error: "danger"
      };
      return colors[type] || "";
    }
    function getTypeName(type) {
      const names = { info: "信息", warning: "警告", success: "成功", error: "错误" };
      return names[type] || type;
    }
    async function loadAnnouncements() {
      loading = true;
      try {
        const res = await getAnnouncements();
        announcements = res.data?.list || [];
      } catch (e) {
        logger.error("加载公告失败", e);
      } finally {
        loading = false;
      }
    }
    function showEditDialog(row = null) {
      if (row) {
        editForm = {
          id: row.id || 0,
          title: row.title || "",
          content: row.content || "",
          type: row.type || "info",
          priority: row.priority || 0,
          is_active: !!row.is_active,
          start_time: row.start_time ? formatDateTimeForInput(row.start_time) : "",
          end_time: row.end_time ? formatDateTimeForInput(row.end_time) : ""
        };
      } else {
        editForm = {
          id: 0,
          title: "",
          content: "",
          type: "info",
          priority: 0,
          is_active: true,
          start_time: "",
          end_time: ""
        };
      }
      editDialogVisible = true;
    }
    function formatDateTimeForInput(datetime) {
      if (!datetime) return "";
      const d = new Date(datetime);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    function formatDateTimeForAPI(datetime) {
      if (!datetime) return null;
      return new Date(datetime).toISOString().slice(0, 19).replace("T", " ");
    }
    async function handleSave() {
      if (!editForm.title || !editForm.content) {
        Message.error("标题和内容不能为空");
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
        Message.success(editForm.id ? "更新成功" : "发布成功");
        editDialogVisible = false;
        loadAnnouncements();
      } catch (e) {
      } finally {
        saving = false;
      }
    }
    const tableColumns = [
      { prop: "id", label: "ID", width: "60px" },
      { prop: "title", label: "标题", minWidth: "200px" },
      {
        prop: "type",
        label: "类型",
        width: "80px",
        render: ({ row }) => `<span class="tag tag-${getTypeColor(row.type)}">${getTypeName(row.type)}</span>`
      },
      {
        prop: "priority",
        label: "优先级",
        width: "80px",
        align: "center"
      },
      {
        prop: "is_active",
        label: "状态",
        width: "80px",
        align: "center",
        render: ({ row }) => `<span class="tag tag-${row.is_active ? "success" : "info"}">${row.is_active ? "启用" : "禁用"}</span>`
      },
      { prop: "created_at", label: "创建时间", width: "165px" },
      {
        prop: "actions",
        label: "操作",
        width: "150px",
        align: "center",
        render: ({ row }) => `
        <button class="action-btn edit-btn" data-id="${row.id}" style="background: none; border: none; color: #1890ff; cursor: pointer; margin-right: 8px;">编辑</button>
        <button class="action-btn delete-btn" data-id="${row.id}" style="background: none; border: none; color: #f5222d; cursor: pointer;">删除</button>
      `
      }
    ];
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Card($$renderer3, {
        title: "公告管理",
        children: ($$renderer4) => {
          $$renderer4.push(`<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">`);
          Button($$renderer4, {
            type: "primary",
            onClick: () => showEditDialog(),
            children: ($$renderer5) => {
              $$renderer5.push(`<!---->发布公告`);
            },
            $$slots: { default: true }
          });
          $$renderer4.push(`<!----></div> `);
          Table($$renderer4, {
            data: announcements,
            columns: tableColumns,
            loading,
            stripe: true
          });
          $$renderer4.push(`<!---->`);
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----> `);
      Dialog($$renderer3, {
        title: editForm.id ? "编辑公告" : "发布公告",
        width: "600px",
        get visible() {
          return editDialogVisible;
        },
        set visible($$value) {
          editDialogVisible = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          $$renderer4.push(`<div style="padding: 20px;"><div style="margin-bottom: 16px;"><label for="announcement-title" style="display: block; margin-bottom: 8px; font-weight: 500;">标题 <span style="color: #f5222d;">*</span></label> `);
          Input($$renderer4, {
            id: "announcement-title",
            placeholder: "请输入公告标题",
            style: "width: 100%;",
            get value() {
              return editForm.title;
            },
            set value($$value) {
              editForm.title = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(`<!----></div> <div style="margin-bottom: 16px;"><label for="announcement-content" style="display: block; margin-bottom: 8px; font-weight: 500;">内容 <span style="color: #f5222d;">*</span></label> <textarea id="announcement-content" placeholder="请输入公告内容" rows="5" style="width: 100%; padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 14px; font-family: inherit; resize: vertical;">`);
          const $$body = escape_html(editForm.content);
          if ($$body) {
            $$renderer4.push(`${$$body}`);
          }
          $$renderer4.push(`</textarea></div> <div style="margin-bottom: 16px;"><label for="announcement-type" style="display: block; margin-bottom: 8px; font-weight: 500;">类型</label> `);
          Select($$renderer4, {
            id: "announcement-type",
            options: [
              { label: "信息", value: "info" },
              { label: "警告", value: "warning" },
              { label: "成功", value: "success" },
              { label: "错误", value: "error" }
            ],
            style: "width: 100%;",
            get value() {
              return editForm.type;
            },
            set value($$value) {
              editForm.type = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(`<!----></div> <div style="margin-bottom: 16px;"><label for="announcement-priority" style="display: block; margin-bottom: 8px; font-weight: 500;">优先级</label> `);
          Input($$renderer4, {
            id: "announcement-priority",
            type: "number",
            min: "0",
            max: "100",
            style: "width: 100%;",
            get value() {
              return editForm.priority;
            },
            set value($$value) {
              editForm.priority = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(`<!----> <span style="margin-left: 10px; color: #999; font-size: 12px;">数值越大越靠前</span></div> <div style="margin-bottom: 16px;"><label style="display: block; margin-bottom: 8px; font-weight: 500;">状态</label> <label style="display: flex; align-items: center; cursor: pointer;"><input type="checkbox"${attr("checked", editForm.is_active, true)} style="margin-right: 8px; width: 16px; height: 16px; cursor: pointer;"/> <span>${escape_html(editForm.is_active ? "启用" : "禁用")}</span></label></div> <div style="margin-bottom: 16px;"><label for="announcement-start-time" style="display: block; margin-bottom: 8px; font-weight: 500;">生效时间</label> <div style="display: flex; align-items: center; gap: 8px;"><input id="announcement-start-time" type="datetime-local"${attr("value", editForm.start_time)} style="flex: 1; padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 14px;"/> <span>至</span> <input type="datetime-local"${attr("value", editForm.end_time)} aria-label="结束时间" style="flex: 1; padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 14px;"/></div></div></div>`);
        },
        $$slots: {
          default: true,
          footer: ($$renderer4) => {
            $$renderer4.push(`<div slot="footer" style="display: flex; justify-content: flex-end; gap: 8px; padding: 16px 20px; border-top: 1px solid #e8e8e8;">`);
            Button($$renderer4, {
              onClick: () => editDialogVisible = false,
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->取消`);
              },
              $$slots: { default: true }
            });
            $$renderer4.push(`<!----> `);
            Button($$renderer4, {
              type: "primary",
              onClick: handleSave,
              loading: saving,
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->保存`);
              },
              $$slots: { default: true }
            });
            $$renderer4.push(`<!----></div>`);
          }
        }
      });
      $$renderer3.push(`<!---->`);
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
