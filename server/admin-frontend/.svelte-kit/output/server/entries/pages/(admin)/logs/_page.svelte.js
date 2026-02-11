import "clsx";
import { b as getOperationLogs } from "../../../../chunks/index3.js";
import { P as Pagination, e as escapeHtml } from "../../../../chunks/escapeHtml.js";
import { l as logger } from "../../../../chunks/logger.js";
import { C as Card } from "../../../../chunks/Card.js";
import { T as Table } from "../../../../chunks/Table.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let loading = false;
    let logs = [];
    let page = 1;
    let pageSize = 20;
    let total = 0;
    function getTargetTypeName(type) {
      const names = {
        user: "用户",
        card: "卡密",
        announcement: "公告",
        setting: "设置",
        withdrawal: "提现"
      };
      return names[type] || type || "-";
    }
    function formatDetails(details) {
      if (!details) return "-";
      try {
        const obj = typeof details === "string" ? JSON.parse(details) : details;
        const keyNames = {
          count: "数量",
          card_type: "卡密类型",
          product_code: "产品",
          batch_id: "批次号",
          title: "标题",
          keys: "设置项",
          action: "操作",
          amount: "金额",
          reason: "原因",
          user_group: "用户组",
          expire_time: "到期时间",
          status: "状态",
          email: "邮箱"
        };
        const typeNames = {
          monthly: "月卡",
          yearly: "年卡",
          permanent: "永久",
          dubbing: "丸子配音",
          comic: "丸子漫剧",
          approve: "通过",
          reject: "拒绝"
        };
        return Object.entries(obj).map(([k, v]) => {
          const keyName = keyNames[k] || k;
          const valueName = typeNames[v] || v;
          return `${escapeHtml(keyName)}: ${escapeHtml(valueName)}`;
        }).join(" | ");
      } catch {
        return escapeHtml(details);
      }
    }
    async function loadLogs() {
      loading = true;
      try {
        const res = await getOperationLogs({ page, page_size: pageSize });
        logs = res.data?.list || [];
        total = res.data?.total || 0;
      } catch (e) {
        logger.error("加载日志失败", e);
      } finally {
        loading = false;
      }
    }
    const tableColumns = [
      { prop: "id", label: "ID", width: "60px" },
      { prop: "admin_username", label: "操作人", width: "100px" },
      { prop: "action", label: "操作", width: "120px" },
      {
        prop: "target_type",
        label: "目标类型",
        width: "100px",
        render: ({ row }) => getTargetTypeName(row.target_type)
      },
      {
        prop: "target_id",
        label: "目标ID",
        width: "80px",
        render: ({ row }) => row.target_id || "-"
      },
      {
        prop: "details",
        label: "详情",
        minWidth: "300px",
        render: ({ row }) => `<div class="details-content">${formatDetails(row.details)}</div>`
      },
      { prop: "ip", label: "IP地址", width: "130px" },
      { prop: "created_at", label: "时间", width: "165px" }
    ];
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Card($$renderer3, {
        title: "操作日志",
        children: ($$renderer4) => {
          Table($$renderer4, { data: logs, columns: tableColumns, loading, stripe: true });
          $$renderer4.push(`<!----> `);
          Pagination($$renderer4, {
            total,
            pageSizes: [20, 50, 100],
            onPageChange: loadLogs,
            onSizeChange: loadLogs,
            get currentPage() {
              return page;
            },
            set currentPage($$value) {
              page = $$value;
              $$settled = false;
            },
            get pageSize() {
              return pageSize;
            },
            set pageSize($$value) {
              pageSize = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(`<!---->`);
        }
      });
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
