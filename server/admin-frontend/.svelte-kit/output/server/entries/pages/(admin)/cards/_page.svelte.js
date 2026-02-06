import { $ as stringify } from "../../../../chunks/index.js";
import { C as Card } from "../../../../chunks/Card.js";
import { T as Table } from "../../../../chunks/Table.js";
import { D as Dialog } from "../../../../chunks/Dialog.js";
import { B as Button } from "../../../../chunks/Button.js";
import { I as Input } from "../../../../chunks/Input.js";
import { S as Select } from "../../../../chunks/Select.js";
import { P as Pagination } from "../../../../chunks/Pagination.js";
import { s as showMessage } from "../../../../chunks/Message.js";
import { a as generateCards, u as updateSettings, b as getCards } from "../../../../chunks/index2.js";
import { e as escape_html } from "../../../../chunks/context.js";
import "clsx";
import { l as logger } from "../../../../chunks/logger.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let loading = false;
    let cards = [];
    let page = 1;
    let pageSize = 10;
    let total = 0;
    let filterStatus = "";
    let filterType = "";
    let generateDialogVisible = false;
    let generating = false;
    let generateForm = {
      card_type: "monthly",
      duration_days: 30,
      count: 10,
      remark: ""
    };
    let resultDialogVisible = false;
    let generatedCards = [];
    let priceDialogVisible = false;
    let savingPrice = false;
    let priceForm = {
      dubbing: { monthly: 29.9, yearly: 199, permanent: 399 }
    };
    let currentProductValue = "dubbing";
    let currentProductName = "丸子配音";
    let currentPriceForm = priceForm.dubbing;
    function getTypeColor(type) {
      const colors = {
        monthly: "",
        yearly: "warning",
        permanent: "success",
        custom: "info"
      };
      return colors[type] || "";
    }
    function getTypeName(type) {
      const names = { monthly: "月卡", yearly: "年卡", permanent: "永久", custom: "自定义" };
      return names[type] || type;
    }
    function getStatusColor(status) {
      const colors = { unused: "success", used: "info", disabled: "danger" };
      return colors[status] || "";
    }
    function getStatusName(status) {
      const names = { unused: "未使用", used: "已使用", disabled: "已禁用" };
      return names[status] || status;
    }
    async function loadCards() {
      loading = true;
      try {
        const res = await getCards({
          page,
          page_size: pageSize,
          status: filterStatus || void 0,
          card_type: filterType || void 0,
          product_code: currentProductValue
        });
        if (res.data) {
          cards = res.data.list || [];
          total = res.data.total || 0;
        }
      } catch (e) {
        logger.error("加载卡密列表失败", e);
        cards = [];
        total = 0;
      } finally {
        loading = false;
      }
    }
    function showGenerateDialog() {
      generateForm = {
        card_type: "monthly",
        duration_days: 30,
        count: 10,
        remark: ""
      };
      generateDialogVisible = true;
    }
    async function handleGenerate() {
      generating = true;
      try {
        const res = await generateCards({
          card_type: generateForm.card_type,
          count: generateForm.count,
          duration_days: generateForm.card_type === "custom" ? generateForm.duration_days : void 0,
          remark: generateForm.remark,
          product_code: currentProductValue
        });
        generatedCards = res.data.cards;
        generateDialogVisible = false;
        resultDialogVisible = true;
        loadCards();
      } catch (e) {
      } finally {
        generating = false;
      }
    }
    function copyAllCards() {
      navigator.clipboard.writeText(generatedCards.join("\n"));
      showMessage("已复制全部卡密", "success");
    }
    function showPriceDialog() {
      priceDialogVisible = true;
    }
    async function savePriceSettings() {
      savingPrice = true;
      try {
        const prefix = currentProductValue === "comic" ? "comic_" : "";
        await updateSettings({
          [`${prefix}card_price_monthly`]: String(currentPriceForm.monthly),
          [`${prefix}card_price_yearly`]: String(currentPriceForm.yearly),
          [`${prefix}card_price_permanent`]: String(currentPriceForm.permanent)
        });
        showMessage("价格设置已保存", "success");
        priceDialogVisible = false;
      } catch (e) {
      } finally {
        savingPrice = false;
      }
    }
    function exportCards() {
      const unusedCards = cards.filter((c) => c.status === "unused");
      if (unusedCards.length === 0) {
        showMessage("没有可导出的未使用卡密", "warning");
        return;
      }
      const content = unusedCards.map((c) => `${c.card_key}	${getTypeName(c.card_type)}	${c.duration_days || "永久"}天`).join("\n");
      const header = "卡密	类型	时长\n";
      const blob = new Blob([header + content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `卡密导出_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      showMessage(`已导出 ${unusedCards.length} 张未使用卡密`, "success");
    }
    function getTableColumns() {
      return [
        { prop: "id", label: "ID", width: "60px" },
        {
          prop: "card_key",
          label: "卡密",
          width: "200px",
          render: ({ row }) => {
            const cardKey = row.card_key || "";
            return `
            <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 12px;">${cardKey}</code>
            <button class="copy-btn" data-card="${cardKey}" style="margin-left: 8px; background: none; border: none; color: #1890ff; cursor: pointer;">复制</button>
          `;
          }
        },
        {
          prop: "card_type",
          label: "类型",
          width: "80px",
          render: ({ row }) => `<span class="tag tag-${getTypeColor(row.card_type)}">${getTypeName(row.card_type)}</span>`
        },
        {
          prop: "duration_days",
          label: "时长",
          width: "70px",
          render: ({ row }) => row.duration_days || "永久"
        },
        {
          prop: "status",
          label: "状态",
          width: "80px",
          render: ({ row }) => `<span class="tag tag-${getStatusColor(row.status)}">${getStatusName(row.status)}</span>`
        },
        {
          prop: "used_by_email",
          label: "激活用户",
          render: ({ row }) => row.status === "used" && row.used_by_email ? row.used_by_email : '<span style="color: #999;">-</span>'
        },
        {
          prop: "machine_code",
          label: "绑定机器码",
          render: ({ row }) => row.status === "used" && row.machine_code ? `<code style="background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 11px;">${row.machine_code}</code>` : '<span style="color: #999;">-</span>'
        },
        { prop: "created_at", label: "创建时间", width: "165px" },
        {
          prop: "used_at",
          label: "使用时间",
          width: "165px",
          render: ({ row }) => row.used_at || "-"
        },
        {
          prop: "actions",
          label: "操作",
          width: "100px",
          render: ({ row }) => {
            const actions = [];
            if (row.status === "unused") {
              actions.push(`<button class="action-btn disable-btn" data-id="${row.id}" style="background: none; border: none; color: #faad14; cursor: pointer; margin-right: 8px;">禁用</button>`);
            }
            actions.push(`<button class="action-btn delete-btn" data-id="${row.id}" style="background: none; border: none; color: #f5222d; cursor: pointer;">删除</button>`);
            return actions.join("");
          }
        }
      ];
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Card($$renderer3, {
        title: "卡密管理",
        children: ($$renderer4) => {
          $$renderer4.push(`<div class="page-header svelte-13vvtm9"><div class="action-buttons svelte-13vvtm9" style="display: flex; gap: 10px; margin-bottom: 16px;">`);
          Button($$renderer4, {
            onclick: showPriceDialog,
            children: ($$renderer5) => {
              $$renderer5.push(`<!---->价格设置`);
            },
            $$slots: { default: true }
          });
          $$renderer4.push(`<!----> `);
          Button($$renderer4, {
            onclick: exportCards,
            children: ($$renderer5) => {
              $$renderer5.push(`<!---->导出`);
            },
            $$slots: { default: true }
          });
          $$renderer4.push(`<!----> `);
          Button($$renderer4, {
            type: "primary",
            onclick: showGenerateDialog,
            children: ($$renderer5) => {
              $$renderer5.push(`<!---->生成卡密`);
            },
            $$slots: { default: true }
          });
          $$renderer4.push(`<!----></div> <div style="margin-bottom: 16px; display: flex; gap: 10px;">`);
          Select($$renderer4, {
            options: [
              { value: "", label: "全部状态" },
              { value: "unused", label: "未使用" },
              { value: "used", label: "已使用" },
              { value: "disabled", label: "已禁用" }
            ],
            placeholder: "状态",
            onchange: () => {
              page = 1;
              loadCards();
            },
            get value() {
              return filterStatus;
            },
            set value($$value) {
              filterStatus = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(`<!----> `);
          Select($$renderer4, {
            options: [
              { value: "", label: "全部类型" },
              { value: "monthly", label: "月卡" },
              { value: "yearly", label: "年卡" },
              { value: "permanent", label: "永久" }
            ],
            placeholder: "类型",
            onchange: () => {
              page = 1;
              loadCards();
            },
            get value() {
              return filterType;
            },
            set value($$value) {
              filterType = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(`<!----></div> `);
          Table($$renderer4, {
            data: cards,
            columns: getTableColumns(),
            loading,
            stripe: true
          });
          $$renderer4.push(`<!----> `);
          Pagination($$renderer4, {
            total,
            pageSizes: [10, 20, 50, 100],
            onPageChange: loadCards,
            onSizeChange: loadCards,
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
          $$renderer4.push(`<!----></div>`);
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----> `);
      Dialog($$renderer3, {
        title: `${stringify(currentProductName)} - 生成卡密`,
        width: "500px",
        get visible() {
          return generateDialogVisible;
        },
        set visible($$value) {
          generateDialogVisible = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          $$renderer4.push(`<div style="display: flex; flex-direction: column; gap: 16px;"><div><label for="cards-generate-card-type" style="display: block; margin-bottom: 8px;">卡密类型</label> `);
          Select($$renderer4, {
            id: "cards-generate-card-type",
            options: [
              { value: "monthly", label: "月卡 (30天)" },
              { value: "yearly", label: "年卡 (365天)" },
              { value: "permanent", label: "永久" },
              { value: "custom", label: "自定义天数" }
            ],
            get value() {
              return generateForm.card_type;
            },
            set value($$value) {
              generateForm.card_type = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(`<!----></div> `);
          if (generateForm.card_type === "custom") {
            $$renderer4.push("<!--[-->");
            $$renderer4.push(`<div><label for="cards-generate-duration-days" style="display: block; margin-bottom: 8px;">自定义天数</label> `);
            Input($$renderer4, {
              id: "cards-generate-duration-days",
              type: "number",
              min: "1",
              max: "9999",
              get value() {
                return generateForm.duration_days;
              },
              set value($$value) {
                generateForm.duration_days = $$value;
                $$settled = false;
              }
            });
            $$renderer4.push(`<!----></div>`);
          } else {
            $$renderer4.push("<!--[!-->");
          }
          $$renderer4.push(`<!--]--> <div><label for="cards-generate-count" style="display: block; margin-bottom: 8px;">生成数量</label> `);
          Input($$renderer4, {
            id: "cards-generate-count",
            type: "number",
            min: "1",
            max: "100",
            get value() {
              return generateForm.count;
            },
            set value($$value) {
              generateForm.count = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(`<!----></div> <div><label for="cards-generate-remark" style="display: block; margin-bottom: 8px;">备注</label> `);
          Input($$renderer4, {
            id: "cards-generate-remark",
            placeholder: "可选，用于标记卡密用途",
            get value() {
              return generateForm.remark;
            },
            set value($$value) {
              generateForm.remark = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(`<!----></div></div>`);
        },
        $$slots: {
          default: true,
          footer: ($$renderer4) => {
            $$renderer4.push(`<div slot="footer" style="display: flex; gap: 10px; justify-content: flex-end;">`);
            Button($$renderer4, {
              onclick: () => generateDialogVisible = false,
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->取消`);
              },
              $$slots: { default: true }
            });
            $$renderer4.push(`<!----> `);
            Button($$renderer4, {
              type: "primary",
              onclick: handleGenerate,
              loading: generating,
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->生成卡密`);
              },
              $$slots: { default: true }
            });
            $$renderer4.push(`<!----></div>`);
          }
        }
      });
      $$renderer3.push(`<!----> `);
      Dialog($$renderer3, {
        title: "生成成功",
        width: "600px",
        get visible() {
          return resultDialogVisible;
        },
        set visible($$value) {
          resultDialogVisible = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          $$renderer4.push(`<p>成功生成 ${escape_html(generatedCards.length)} 张卡密：</p> <textarea readonly style="width: 100%; height: 200px; padding: 8px; border: 1px solid #d9d9d9; border-radius: 4px;">`);
          const $$body = escape_html(`    ${stringify(generatedCards.join("\n"))}
  `);
          if ($$body) {
            $$renderer4.push(`${$$body}`);
          }
          $$renderer4.push(`</textarea>`);
        },
        $$slots: {
          default: true,
          footer: ($$renderer4) => {
            $$renderer4.push(`<div slot="footer" style="display: flex; gap: 10px; justify-content: flex-end;">`);
            Button($$renderer4, {
              onclick: copyAllCards,
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->复制全部`);
              },
              $$slots: { default: true }
            });
            $$renderer4.push(`<!----> `);
            Button($$renderer4, {
              type: "primary",
              onclick: () => resultDialogVisible = false,
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->关闭`);
              },
              $$slots: { default: true }
            });
            $$renderer4.push(`<!----></div>`);
          }
        }
      });
      $$renderer3.push(`<!----> `);
      Dialog($$renderer3, {
        title: `${stringify(currentProductName)} - 卡密价格设置`,
        width: "500px",
        get visible() {
          return priceDialogVisible;
        },
        set visible($$value) {
          priceDialogVisible = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          $$renderer4.push(`<div style="display: flex; flex-direction: column; gap: 16px;"><div><label for="cards-price-monthly" style="display: block; margin-bottom: 8px;">月卡价格</label> `);
          Input($$renderer4, {
            id: "cards-price-monthly",
            type: "number",
            min: "0",
            step: "0.01",
            get value() {
              return currentPriceForm.monthly;
            },
            set value($$value) {
              currentPriceForm.monthly = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(`<!----></div> <div><label for="cards-price-yearly" style="display: block; margin-bottom: 8px;">年卡价格</label> `);
          Input($$renderer4, {
            id: "cards-price-yearly",
            type: "number",
            min: "0",
            step: "0.01",
            get value() {
              return currentPriceForm.yearly;
            },
            set value($$value) {
              currentPriceForm.yearly = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(`<!----></div> <div><label for="cards-price-permanent" style="display: block; margin-bottom: 8px;">永久价格</label> `);
          Input($$renderer4, {
            id: "cards-price-permanent",
            type: "number",
            min: "0",
            step: "0.01",
            get value() {
              return currentPriceForm.permanent;
            },
            set value($$value) {
              currentPriceForm.permanent = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(`<!----></div></div>`);
        },
        $$slots: {
          default: true,
          footer: ($$renderer4) => {
            $$renderer4.push(`<div slot="footer" style="display: flex; gap: 10px; justify-content: flex-end;">`);
            Button($$renderer4, {
              onclick: () => priceDialogVisible = false,
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->取消`);
              },
              $$slots: { default: true }
            });
            $$renderer4.push(`<!----> `);
            Button($$renderer4, {
              type: "primary",
              onclick: savePriceSettings,
              loading: savingPrice,
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->保存设置`);
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
