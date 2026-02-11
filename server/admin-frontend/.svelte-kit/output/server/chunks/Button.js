import { _ as attr_class, a1 as attr, a7 as clsx } from "./index2.js";
/* empty css                                     */
function Button($$renderer, $$props) {
  let {
    type = "default",
    size = "medium",
    loading = false,
    disabled = false,
    onClick = () => {
    },
    children
  } = $$props;
  let buttonClass = `btn btn-${type} btn-${size}${loading || disabled ? " btn-disabled" : ""}`;
  $$renderer.push(`<button${attr_class(clsx(buttonClass), "svelte-18sv61c")}${attr("disabled", disabled || loading, true)} type="button">`);
  if (loading) {
    $$renderer.push("<!--[-->");
    $$renderer.push(`<span class="btn-loading svelte-18sv61c">加载中...</span>`);
  } else {
    $$renderer.push("<!--[!-->");
    if (children) {
      $$renderer.push("<!--[-->");
      children($$renderer);
      $$renderer.push(`<!---->`);
    } else {
      $$renderer.push("<!--[!-->");
    }
    $$renderer.push(`<!--]-->`);
  }
  $$renderer.push(`<!--]--></button>`);
}
export {
  Button as B
};
