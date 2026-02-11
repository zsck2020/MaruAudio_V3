import { e as escape_html } from "../../../../chunks/context.js";
import "clsx";
import "../../../../chunks/index3.js";
import { C as Card } from "../../../../chunks/Card.js";
import { T as Table } from "../../../../chunks/Table.js";
import { B as Button } from "../../../../chunks/Button.js";
import { g as goto } from "../../../../chunks/client.js";
import "@sveltejs/kit/internal/server";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let salesStats = { today: 0, month: 0, total: 0, usedCards: 0 };
    let recentUsers = [];
    let loading = true;
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
        monthly: "月卡会员",
        yearly: "年卡会员",
        permanent: "永久会员"
      };
      return names[group] || group;
    }
    const tableColumns = [
      { prop: "id", label: "ID", width: "60px" },
      { prop: "email", label: "邮箱", width: "180px" },
      { prop: "user_group", label: "用户组", width: "100px" },
      { prop: "register_time", label: "注册时间", width: "165px" },
      { prop: "status", label: "状态", width: "70px" }
    ];
    $$renderer2.push(`<div><div class="stat-cards"><div class="stat-card"><div class="stat-icon primary">U</div> <div class="stat-info"><h3>${escape_html(0)}</h3> <p>总用户数</p></div></div> <div class="stat-card"><div class="stat-icon success">VIP</div> <div class="stat-info"><h3>${escape_html(0)}</h3> <p>会员用户</p></div></div> <div class="stat-card"><div class="stat-icon warning">C</div> <div class="stat-info"><h3>${escape_html(0)}</h3> <p>未使用卡密</p></div></div> <div class="stat-card"><div class="stat-icon danger">D</div> <div class="stat-info"><h3>${escape_html(0)}</h3> <p>今日登录</p></div></div></div> <div class="stat-cards" style="margin-top: 20px;"><div class="stat-card"><div class="stat-icon" style="background: #667eea;">¥</div> <div class="stat-info"><h3 style="color: #667eea;">¥${escape_html(salesStats.today.toFixed(2))}</h3> <p>今日销售额</p></div></div> <div class="stat-card"><div class="stat-icon" style="background: #f5576c;">M</div> <div class="stat-info"><h3 style="color: #f5576c;">¥${escape_html(salesStats.month.toFixed(2))}</h3> <p>本月销售额</p></div></div> <div class="stat-card"><div class="stat-icon" style="background: #4facfe;">T</div> <div class="stat-info"><h3 style="color: #4facfe;">¥${escape_html(salesStats.total.toFixed(2))}</h3> <p>累计销售额</p></div></div> <div class="stat-card"><div class="stat-icon" style="background: #43e97b;">S</div> <div class="stat-info"><h3 style="color: #43e97b;">${escape_html(salesStats.usedCards)}</h3> <p>已售卡密</p></div></div></div> `);
    Card($$renderer2, {
      title: "最近注册用户",
      children: ($$renderer3) => {
        $$renderer3.push(`<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">`);
        Button($$renderer3, {
          type: "primary",
          size: "small",
          onClick: () => goto(),
          children: ($$renderer4) => {
            $$renderer4.push(`<!---->查看全部`);
          }
        });
        $$renderer3.push(`<!----></div> `);
        Table($$renderer3, {
          data: recentUsers,
          columns: tableColumns.map((col) => {
            if (col.prop === "user_group") {
              return {
                ...col,
                render: ({ row }) => {
                  return `<span class="tag tag-${getGroupType(row.user_group)}">${getGroupName(row.user_group)}</span>`;
                }
              };
            } else if (col.prop === "status") {
              return {
                ...col,
                render: ({ row }) => {
                  return `<span class="tag tag-${row.status === "active" ? "success" : "danger"}">${row.status === "active" ? "正常" : "封禁"}</span>`;
                }
              };
            }
            return col;
          }),
          loading,
          stripe: true
        });
        $$renderer3.push(`<!---->`);
      }
    });
    $$renderer2.push(`<!----></div>`);
  });
}
export {
  _page as default
};
