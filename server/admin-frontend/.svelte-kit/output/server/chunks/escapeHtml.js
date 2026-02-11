import { Z as ensure_array_like, _ as attr_class, a1 as attr, a0 as bind_props } from "./index2.js";
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
    function getVisiblePages() {
      const pages = [];
      const maxVisible = 5;
      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, start + maxVisible - 1);
        if (end - start < maxVisible - 1) {
          start = Math.max(1, end - maxVisible + 1);
        }
        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
      }
      return pages;
    }
    let visiblePages = getVisiblePages();
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
          onchange: (e) => {
            const target = e.target;
            if (target) {
              handleSizeChange(Number(target.value));
            }
          }
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
    const each_array_1 = ensure_array_like(visiblePages);
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let page = each_array_1[$$index_1];
      $$renderer2.push(`<button${attr_class("pagination-btn svelte-14nrfpk", void 0, { "active": currentPage === page })}>${escape_html(page)}</button>`);
    }
    $$renderer2.push(`<!--]--> <button${attr_class("pagination-btn svelte-14nrfpk", void 0, { "disabled": currentPage === totalPages })}${attr("disabled", currentPage === totalPages, true)}>下一页</button></div></div>`);
    bind_props($$props, { currentPage, pageSize });
  });
}
function escapeHtml(str) {
  if (str === null || str === void 0) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
export {
  Pagination as P,
  escapeHtml as e
};
