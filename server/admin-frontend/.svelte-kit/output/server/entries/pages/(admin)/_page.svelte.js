import { a0 as bind_props } from "../../../chunks/index.js";
import { redirect } from "@sveltejs/kit";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    function load() {
      throw redirect(302, "/dashboard");
    }
    bind_props($$props, { load });
  });
}
export {
  _page as default
};
