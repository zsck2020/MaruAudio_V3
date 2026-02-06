import { _ as attr_class, a2 as attr, a0 as bind_props, $ as stringify } from "./index.js";
import { e as escape_html } from "./context.js";
function Select($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      value = "",
      id = void 0,
      options = [],
      placeholder = "请选择",
      disabled = false,
      size = "medium",
      onChange = () => {
      }
    } = $$props;
    let open = false;
    let selectedLabel = options.find((opt) => opt.value === value)?.label || placeholder;
    $$renderer2.push(`<div${attr_class(`select-wrapper select-${stringify(size)}`, "svelte-t5ihcw")}><button type="button"${attr("id", id)}${attr_class("select-input svelte-t5ihcw", void 0, { "select-disabled": disabled, "select-open": open })}${attr("disabled", disabled, true)} aria-haspopup="listbox"${attr("aria-expanded", open)}><span${attr_class("select-value svelte-t5ihcw", void 0, { "select-placeholder": !value })}>${escape_html(selectedLabel)}</span> <span class="select-arrow svelte-t5ihcw">▼</span></button> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, { value });
  });
}
export {
  Select as S
};
