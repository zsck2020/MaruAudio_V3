import { a5 as attr_style, a0 as bind_props, $ as stringify } from "./index2.js";
import { e as escape_html } from "./context.js";
function Dialog($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      visible = false,
      title = "",
      width = "500px",
      showFooter = true,
      children,
      footer
    } = $$props;
    if (visible) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="dialog-mask svelte-jby388" role="button" tabindex="0" aria-label="关闭对话框"><div class="dialog-container svelte-jby388"${attr_style(`width: ${stringify(width)};`)}><div class="dialog-header svelte-jby388"><h3 class="dialog-title svelte-jby388">${escape_html(title)}</h3> <button class="dialog-close svelte-jby388" type="button">×</button></div> <div class="dialog-body svelte-jby388">`);
      if (children) {
        $$renderer2.push("<!--[-->");
        children($$renderer2);
        $$renderer2.push(`<!---->`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div> `);
      if (showFooter && footer) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="dialog-footer svelte-jby388">`);
        footer($$renderer2);
        $$renderer2.push(`<!----></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { visible });
  });
}
export {
  Dialog as D
};
