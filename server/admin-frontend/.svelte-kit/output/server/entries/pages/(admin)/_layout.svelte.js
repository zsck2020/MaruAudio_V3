import { _ as attr_class, Z as ensure_array_like, a2 as attr, a3 as store_set, a4 as store_get, a1 as slot, a5 as unsubscribe_stores } from "../../../chunks/index.js";
import "@sveltejs/kit/internal";
import { w as writable } from "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../chunks/state.svelte.js";
import { S as Select } from "../../../chunks/Select.js";
/* empty css                                                   */
import { e as escape_html } from "../../../chunks/context.js";
const currentProduct = writable("dubbing");
function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let mobileMenuOpen = false;
    let adminInfo = {};
    let dropdownOpen = false;
    let currentPath = "";
    let currentTitle = "管理后台";
    const menuItems = [
      { path: "/dashboard", icon: "DB", label: "控制台" },
      { path: "/users", icon: "U", label: "用户管理" },
      { path: "/cards", icon: "C", label: "卡密管理" },
      { path: "/character-packs", icon: "CP", label: "字符包管理" },
      { path: "/marketing", icon: "MK", label: "营销活动" },
      { path: "/commission", icon: "CM", label: "分佣提现" },
      { path: "/software", icon: "SW", label: "软件管理" },
      { path: "/announcements", icon: "AN", label: "公告管理" },
      { path: "/logs", icon: "LG", label: "操作日志" },
      { path: "/settings", icon: "ST", label: "系统设置" }
    ];
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div${attr_class("layout-container svelte-we7dkw", void 0, { "mobile-menu-open": mobileMenuOpen })}>`);
      {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> <aside${attr_class("layout-aside svelte-we7dkw", void 0, { "mobile-visible": mobileMenuOpen })}><div class="sidebar-logo svelte-we7dkw"><span class="logo-icon svelte-we7dkw">MA</span> <h2 class="svelte-we7dkw">丸子智能</h2></div> <nav class="sidebar-menu svelte-we7dkw"><!--[-->`);
      const each_array = ensure_array_like(menuItems);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let item = each_array[$$index];
        $$renderer3.push(`<a${attr("href", item.path)}${attr_class("menu-item svelte-we7dkw", void 0, { "active": currentPath === item.path })}><span class="menu-icon svelte-we7dkw">${escape_html(item.icon)}</span> <span class="menu-label svelte-we7dkw">${escape_html(item.label)}</span></a>`);
      }
      $$renderer3.push(`<!--]--></nav></aside> <div class="layout-main svelte-we7dkw"><header class="layout-header svelte-we7dkw"><div class="header-left svelte-we7dkw"><button class="mobile-menu-btn svelte-we7dkw" type="button"><span>☰</span></button> <span class="page-title-text svelte-we7dkw">${escape_html(currentTitle)}</span></div> <div class="header-right svelte-we7dkw"><div class="product-selector-wrapper svelte-we7dkw">`);
      Select($$renderer3, {
        options: [
          { value: "dubbing", label: "丸子配音" },
          { value: "comic", label: "丸子漫剧" }
        ],
        get value() {
          return store_get($$store_subs ??= {}, "$currentProduct", currentProduct);
        },
        set value($$value) {
          store_set(currentProduct, $$value);
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----></div> <div class="user-dropdown-wrapper svelte-we7dkw"><button type="button" class="user-dropdown svelte-we7dkw" aria-haspopup="menu"${attr("aria-expanded", dropdownOpen)}><div class="user-avatar svelte-we7dkw">${escape_html(adminInfo?.username?.charAt(0)?.toUpperCase() || "A")}</div> <span class="username svelte-we7dkw">${escape_html(adminInfo?.username || "管理员")}</span> <span class="dropdown-arrow svelte-we7dkw">▼</span></button> `);
      {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--></div></div></header> <main class="layout-content svelte-we7dkw"><!--[-->`);
      slot($$renderer3, $$props, "default", {});
      $$renderer3.push(`<!--]--></main></div></div>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _layout as default
};
