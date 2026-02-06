import { _ as attr_class, a2 as attr, a8 as clsx, a1 as slot } from "./index.js";
/* empty css                                     */
function Button($$renderer, $$props) {
  let {
    type = "default",
    size = "medium",
    loading = false,
    disabled = false,
    onClick = () => {
    }
  } = $$props;
  let buttonClass = `btn btn-${type} btn-${size}${loading || disabled ? " btn-disabled" : ""}`;
  $$renderer.push(`<button${attr_class(clsx(buttonClass), "svelte-18sv61c")}${attr("disabled", disabled || loading, true)} type="button">`);
  if (loading) {
    $$renderer.push("<!--[-->");
    $$renderer.push(`<span class="btn-loading svelte-18sv61c">加载中...</span>`);
  } else {
    $$renderer.push("<!--[!-->");
    $$renderer.push(`<!--[-->`);
    slot($$renderer, $$props, "default", {});
    $$renderer.push(`<!--]-->`);
  }
  $$renderer.push(`<!--]--></button>`);
}
export {
  Button as B
};
