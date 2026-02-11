import { _ as attr_class, Z as ensure_array_like, a5 as attr_style, $ as stringify, a1 as attr } from "./index2.js";
import { e as escape_html } from "./context.js";
function html(value) {
  var html2 = String(value ?? "");
  var open = "<!---->";
  return open + html2 + "<!---->";
}
function Table($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      data = [],
      columns = [],
      loading = false,
      stripe = false,
      border = true
    } = $$props;
    $$renderer2.push(`<div class="table-wrapper svelte-1iq5b9c"><table${attr_class("table svelte-1iq5b9c", void 0, { "table-stripe": stripe, "table-border": border })}><thead><tr><!--[-->`);
    const each_array = ensure_array_like(columns);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let col = each_array[$$index];
      $$renderer2.push(`<th${attr_style(`width: ${stringify(col.width || "auto")}`)} class="svelte-1iq5b9c">${escape_html(col.label)}</th>`);
    }
    $$renderer2.push(`<!--]--></tr></thead><tbody class="svelte-1iq5b9c">`);
    if (loading) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<tr class="svelte-1iq5b9c"><td${attr("colspan", columns.length)} class="table-loading svelte-1iq5b9c"><div class="loading-spinner svelte-1iq5b9c">加载中...</div></td></tr>`);
    } else {
      $$renderer2.push("<!--[!-->");
      if (data.length === 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<tr class="svelte-1iq5b9c"><td${attr("colspan", columns.length)} class="table-empty svelte-1iq5b9c">暂无数据</td></tr>`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<!--[-->`);
        const each_array_1 = ensure_array_like(data);
        for (let index = 0, $$length = each_array_1.length; index < $$length; index++) {
          let row = each_array_1[index];
          $$renderer2.push(`<tr class="svelte-1iq5b9c"><!--[-->`);
          const each_array_2 = ensure_array_like(columns);
          for (let $$index_1 = 0, $$length2 = each_array_2.length; $$index_1 < $$length2; $$index_1++) {
            let col = each_array_2[$$index_1];
            $$renderer2.push(`<td class="svelte-1iq5b9c">`);
            if (col.render) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`${html(col.render({ row, index }))}`);
            } else {
              $$renderer2.push("<!--[!-->");
              $$renderer2.push(`${escape_html(row[col.prop] || "")}`);
            }
            $$renderer2.push(`<!--]--></td>`);
          }
          $$renderer2.push(`<!--]--></tr>`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></tbody></table></div>`);
  });
}
export {
  Table as T
};
