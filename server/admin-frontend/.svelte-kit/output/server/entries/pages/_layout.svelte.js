import "clsx";
import { Z as ensure_array_like, _ as attr_class, $ as stringify, a0 as bind_props } from "../../chunks/index2.js";
import { f as fallback } from "../../chunks/utils2.js";
import { e as escape_html } from "../../chunks/context.js";
function Message($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let messages = fallback($$props["messages"], () => [], true);
    $$renderer2.push(`<div class="message-container svelte-1uqoiy7"><!--[-->`);
    const each_array = ensure_array_like(messages);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let msg = each_array[$$index];
      $$renderer2.push(`<div${attr_class(`message message-${stringify(msg.type)}`, "svelte-1uqoiy7")}><span class="message-content svelte-1uqoiy7">${escape_html(msg.message)}</span> <button class="message-close svelte-1uqoiy7">×</button></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, { messages });
  });
}
function _layout($$renderer, $$props) {
  let messages = [];
  let { children } = $$props;
  Message($$renderer, { messages });
  $$renderer.push(`<!----> `);
  if (children) {
    $$renderer.push("<!--[-->");
    children($$renderer);
    $$renderer.push(`<!---->`);
  } else {
    $$renderer.push("<!--[!-->");
  }
  $$renderer.push(`<!--]-->`);
}
export {
  _layout as default
};
