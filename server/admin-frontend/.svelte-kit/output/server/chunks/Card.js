import { _ as attr_class } from "./index2.js";
import { e as escape_html } from "./context.js";
function Card($$renderer, $$props) {
  let { title = "", shadow = true, children } = $$props;
  $$renderer.push(`<div${attr_class("card svelte-1udyrqm", void 0, { "card-shadow": shadow })}>`);
  if (title) {
    $$renderer.push("<!--[-->");
    $$renderer.push(`<div class="card-header svelte-1udyrqm"><h3 class="card-title svelte-1udyrqm">${escape_html(title)}</h3></div>`);
  } else {
    $$renderer.push("<!--[!-->");
  }
  $$renderer.push(`<!--]--> <div class="card-body svelte-1udyrqm">`);
  if (children) {
    $$renderer.push("<!--[-->");
    children($$renderer);
    $$renderer.push(`<!---->`);
  } else {
    $$renderer.push("<!--[!-->");
  }
  $$renderer.push(`<!--]--></div></div>`);
}
export {
  Card as C
};
