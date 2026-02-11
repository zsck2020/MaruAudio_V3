import { _ as attr_class, a6 as attributes, a0 as bind_props, $ as stringify } from "./index2.js";
import { e as escape_html } from "./context.js";
function Input($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      value = "",
      type = "text",
      id = void 0,
      name = void 0,
      placeholder = "",
      disabled = false,
      size = "medium",
      prefixIcon = null,
      showPassword = false,
      $$slots,
      $$events,
      ...rest
    } = $$props;
    let inputType = "text";
    $$renderer2.push(`<div${attr_class(`input-wrapper input-${stringify(size)}`, "svelte-8ff5h4")}>`);
    if (prefixIcon) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<span class="input-prefix-icon svelte-8ff5h4">${escape_html(prefixIcon)}</span>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <input${attributes(
      {
        ...rest,
        id,
        name,
        type: inputType,
        value,
        placeholder,
        disabled,
        class: "input"
      },
      "svelte-8ff5h4",
      void 0,
      void 0,
      4
    )}/> `);
    if (type === "password" && showPassword) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<button type="button" class="input-suffix-icon svelte-8ff5h4">${escape_html("显")}</button>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, { value });
  });
}
export {
  Input as I
};
