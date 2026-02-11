import "clsx";
import { g as goto } from "../../../chunks/client.js";
import { b as base } from "../../../chunks/server.js";
import "@sveltejs/kit/internal/server";
import { i as showError, j as adminLogin, k as showSuccess } from "../../../chunks/index3.js";
import { I as Input } from "../../../chunks/Input.js";
import { B as Button } from "../../../chunks/Button.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let username = "";
    let password = "";
    let loading = false;
    async function handleLogin() {
      if (!username || !password) {
        showError("请输入管理员账号和密码");
        return;
      }
      loading = true;
      try {
        const res = await adminLogin({ username, password });
        if (typeof window !== "undefined") {
          localStorage.setItem("admin_token", res.data.token);
          localStorage.setItem("admin_info", JSON.stringify(res.data));
        }
        showSuccess("登录成功");
        goto(`${base}/dashboard`);
      } catch (e) {
      } finally {
        loading = false;
      }
    }
    function handleKeyPress(event) {
      if (event.key === "Enter") {
        handleLogin();
      }
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="login-container svelte-1x05zx6"><div class="login-card svelte-1x05zx6"><div class="login-title svelte-1x05zx6"><div class="login-logo svelte-1x05zx6"><span class="logo-icon svelte-1x05zx6">MA</span> <h1 class="svelte-1x05zx6">丸子智能</h1></div> <p class="svelte-1x05zx6">多产品管理平台</p></div> <div class="login-form svelte-1x05zx6"><div class="form-item svelte-1x05zx6">`);
      Input($$renderer3, {
        placeholder: "管理员账号",
        size: "large",
        onkeypress: handleKeyPress,
        get value() {
          return username;
        },
        set value($$value) {
          username = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----></div> <div class="form-item svelte-1x05zx6">`);
      Input($$renderer3, {
        type: "password",
        placeholder: "密码",
        size: "large",
        showPassword: true,
        onkeypress: handleKeyPress,
        get value() {
          return password;
        },
        set value($$value) {
          password = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----></div> <div class="form-item svelte-1x05zx6">`);
      Button($$renderer3, {
        type: "primary",
        size: "large",
        loading,
        onClick: handleLogin,
        children: ($$renderer4) => {
          $$renderer4.push(`<!---->登录`);
        }
      });
      $$renderer3.push(`<!----></div></div></div></div>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
  });
}
export {
  _page as default
};
