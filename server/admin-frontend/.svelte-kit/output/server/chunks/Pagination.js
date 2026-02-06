import { Z as ensure_array_like, _ as attr_class, a2 as attr, a0 as bind_props } from "./index.js";
import { e as escape_html } from "./context.js";
function Pagination($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      currentPage = 1,
      pageSize = 10,
      total = 0,
      pageSizes = [10, 20, 50],
      showTotal = true,
      showSizes = true,
      onPageChange = () => {
      },
      onSizeChange = () => {
      }
    } = $$props;
    let totalPages = Math.ceil(total / pageSize);
    function handleSizeChange(size) {
      pageSize = size;
      currentPage = 1;
      onSizeChange(size);
    }
    $$renderer2.push(`<div class="pagination svelte-14nrfpk">`);
    if (showTotal) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<span class="pagination-total svelte-14nrfpk">共 ${escape_html(total)} 条</span>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (showSizes) {
      $$renderer2.push("<!--[-->");
      $$renderer2.select(
        {
          class: "pagination-sizes",
          value: pageSize,
          onchange: (e) => handleSizeChange(Number(e.target.value))
        },
        ($$renderer3) => {
          $$renderer3.push(`<!--[-->`);
          const each_array = ensure_array_like(pageSizes);
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            let size = each_array[$$index];
            $$renderer3.option({ value: size }, ($$renderer4) => {
              $$renderer4.push(`${escape_html(size)} 条/页`);
            });
          }
          $$renderer3.push(`<!--]-->`);
        },
        "svelte-14nrfpk"
      );
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="pagination-pages svelte-14nrfpk"><button${attr_class("pagination-btn svelte-14nrfpk", void 0, { "disabled": currentPage === 1 })}${attr("disabled", currentPage === 1, true)}>上一页</button> <!--[-->`);
    const each_array_1 = ensure_array_like(Array(Math.min(5, totalPages)));
    for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
      each_array_1[i];
      const page = i + 1;
      if (totalPages <= 5 || currentPage <= 3 && page <= 5 || currentPage >= totalPages - 2 && page >= totalPages - 4 || page >= currentPage - 1 && page <= currentPage + 1) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<button${attr_class("pagination-btn svelte-14nrfpk", void 0, { "active": currentPage === page })}>${escape_html(page)}</button>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--> <button${attr_class("pagination-btn svelte-14nrfpk", void 0, { "disabled": currentPage === totalPages })}${attr("disabled", currentPage === totalPages, true)}>下一页</button></div></div>`);
    bind_props($$props, { currentPage, pageSize });
  });
}
export {
  Pagination as P
};
