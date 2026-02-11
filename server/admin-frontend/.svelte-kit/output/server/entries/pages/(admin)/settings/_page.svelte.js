import { _ as attr_class, $ as stringify } from "../../../../chunks/index2.js";
import { u as updateSettings, t as testMail, c as updateAdminProfile } from "../../../../chunks/index3.js";
import { C as Card } from "../../../../chunks/Card.js";
import { B as Button } from "../../../../chunks/Button.js";
import { I as Input } from "../../../../chunks/Input.js";
import { M as Message } from "../../../../chunks/Message.js";
import { e as escape_html } from "../../../../chunks/context.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let domainForm = { api_domain: "", admin_domain: "" };
    let adminForm = {
      username: "",
      email: "",
      new_password: "",
      confirm_password: ""
    };
    let mailForm = {
      smtp_host: "",
      smtp_port: 465,
      smtp_user: "",
      smtp_pass: "",
      from_name: ""
    };
    async function saveDomainSettings() {
      try {
        await updateSettings({
          api_domain: domainForm.api_domain,
          admin_domain: domainForm.admin_domain
        });
        Message.success("域名配置已保存");
      } catch (e) {
      }
    }
    async function testDomain() {
      if (!domainForm.api_domain) {
        Message.error("请先配置API域名");
        return;
      }
      try {
        const response = await fetch(`https://${domainForm.api_domain}/api/health`);
        if (response.ok) {
          Message.success("域名连接测试成功");
        } else {
          Message.error("域名连接失败，请检查配置");
        }
      } catch (e) {
        Message.error("域名连接失败: " + e.message);
      }
    }
    async function saveAdminSettings() {
      if (adminForm.new_password && adminForm.new_password !== adminForm.confirm_password) {
        Message.error("两次输入的密码不一致");
        return;
      }
      try {
        await updateAdminProfile({
          email: adminForm.email,
          new_password: adminForm.new_password || void 0
        });
        Message.success("保存成功");
        adminForm.new_password = "";
        adminForm.confirm_password = "";
      } catch (e) {
      }
    }
    async function saveMailSettings() {
      try {
        await updateSettings({
          smtp_host: mailForm.smtp_host,
          smtp_port: String(mailForm.smtp_port),
          smtp_user: mailForm.smtp_user,
          smtp_pass: mailForm.smtp_pass,
          from_name: mailForm.from_name
        });
        Message.success("邮箱配置已保存");
      } catch (e) {
        Message.error("保存失败");
      }
    }
    async function testMail$1() {
      if (!mailForm.smtp_user) {
        Message.error("请先配置发件邮箱");
        return;
      }
      const testEmail = adminForm.email || mailForm.smtp_user;
      try {
        await testMail({ to: testEmail });
        Message.success(`测试邮件已发送到 ${testEmail}`);
      } catch (e) {
      }
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div>`);
      Card($$renderer3, {
        title: "域名绑定",
        children: ($$renderer4) => {
          $$renderer4.push(`<div style="background: #fff7e6; border: 1px solid #ffe58f; border-radius: 4px; padding: 12px; margin-bottom: 16px;"><div style="font-weight: 500; margin-bottom: 8px;">域名绑定说明</div> <ol style="margin: 8px 0 0 0; padding-left: 20px; line-height: 1.8;"><li>先在域名服务商处将域名解析到服务器 IP</li> <li>在宝塔面板添加站点并配置 SSL 证书</li> <li>配置 Nginx 反向代理指向对应目录</li> <li>最后在此处保存域名配置</li></ol></div> <div style="display: flex; flex-direction: column; gap: 16px;"><div><label for="settings-api-domain" style="display: block; margin-bottom: 8px; font-weight: 500;">API 域名</label> <div style="display: flex; align-items: center;"><span style="padding: 8px 12px; background: #f5f5f5; border: 1px solid #d9d9d9; border-right: none; border-radius: 4px 0 0 4px;">https://</span> `);
          Input($$renderer4, {
            id: "settings-api-domain",
            placeholder: "如: api.maruai.cn",
            style: "flex: 1; border-radius: 0 4px 4px 0;",
            get value() {
              return domainForm.api_domain;
            },
            set value($$value) {
              domainForm.api_domain = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(`<!----></div></div> <div><label for="settings-admin-domain" style="display: block; margin-bottom: 8px; font-weight: 500;">管理后台域名</label> <div style="display: flex; align-items: center;"><span style="padding: 8px 12px; background: #f5f5f5; border: 1px solid #d9d9d9; border-right: none; border-radius: 4px 0 0 4px;">https://</span> `);
          Input($$renderer4, {
            id: "settings-admin-domain",
            placeholder: "如: admin.maruai.cn",
            style: "flex: 1; border-radius: 0 4px 4px 0;",
            get value() {
              return domainForm.admin_domain;
            },
            set value($$value) {
              domainForm.admin_domain = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(`<!----></div></div> <div><div style="display: block; margin-bottom: 8px; font-weight: 500;">当前状态</div> <span${attr_class(`tag tag-${stringify(domainForm.api_domain ? "success" : "info")}`, "svelte-19my2un")}>${escape_html(domainForm.api_domain ? "已配置域名" : "使用IP访问")}</span></div> <div style="display: flex; gap: 10px;">`);
          Button($$renderer4, {
            type: "primary",
            onClick: saveDomainSettings,
            children: ($$renderer5) => {
              $$renderer5.push(`<!---->保存配置`);
            }
          });
          $$renderer4.push(`<!----> `);
          Button($$renderer4, {
            onClick: testDomain,
            disabled: !domainForm.api_domain,
            children: ($$renderer5) => {
              $$renderer5.push(`<!---->测试连接`);
            }
          });
          $$renderer4.push(`<!----></div></div>`);
        }
      });
      $$renderer3.push(`<!----> `);
      Card($$renderer3, {
        title: "发信邮箱配置",
        children: ($$renderer4) => {
          $$renderer4.push(`<div style="display: flex; flex-direction: column; gap: 16px;"><div><label for="settings-smtp-host" style="display: block; margin-bottom: 8px; font-weight: 500;">SMTP 服务器</label> `);
          Input($$renderer4, {
            id: "settings-smtp-host",
            placeholder: "如: smtp.qq.com",
            style: "width: 320px;",
            get value() {
              return mailForm.smtp_host;
            },
            set value($$value) {
              mailForm.smtp_host = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(`<!----></div> <div><label for="settings-smtp-port" style="display: block; margin-bottom: 8px; font-weight: 500;">SMTP 端口</label> `);
          Input($$renderer4, {
            id: "settings-smtp-port",
            type: "number",
            min: "1",
            max: "65535",
            style: "width: 180px;",
            get value() {
              return mailForm.smtp_port;
            },
            set value($$value) {
              mailForm.smtp_port = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(`<!----></div> <div><label for="settings-smtp-user" style="display: block; margin-bottom: 8px; font-weight: 500;">发件邮箱</label> `);
          Input($$renderer4, {
            id: "settings-smtp-user",
            placeholder: "如: noreply@example.com",
            style: "width: 320px;",
            get value() {
              return mailForm.smtp_user;
            },
            set value($$value) {
              mailForm.smtp_user = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(`<!----></div> <div><label for="settings-smtp-pass" style="display: block; margin-bottom: 8px; font-weight: 500;">邮箱密码/授权码</label> `);
          Input($$renderer4, {
            id: "settings-smtp-pass",
            type: "password",
            placeholder: "SMTP授权码",
            style: "width: 320px;",
            get value() {
              return mailForm.smtp_pass;
            },
            set value($$value) {
              mailForm.smtp_pass = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(`<!----></div> <div><label for="settings-mail-from-name" style="display: block; margin-bottom: 8px; font-weight: 500;">发件人名称</label> `);
          Input($$renderer4, {
            id: "settings-mail-from-name",
            placeholder: "如: 丸子配音",
            style: "width: 320px;",
            get value() {
              return mailForm.from_name;
            },
            set value($$value) {
              mailForm.from_name = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(`<!----></div> <div style="display: flex; gap: 10px;">`);
          Button($$renderer4, {
            type: "primary",
            onClick: saveMailSettings,
            children: ($$renderer5) => {
              $$renderer5.push(`<!---->保存配置`);
            }
          });
          $$renderer4.push(`<!----> `);
          Button($$renderer4, {
            onClick: testMail$1,
            children: ($$renderer5) => {
              $$renderer5.push(`<!---->测试发送`);
            }
          });
          $$renderer4.push(`<!----></div></div>`);
        }
      });
      $$renderer3.push(`<!----> `);
      Card($$renderer3, {
        title: "管理员设置",
        children: ($$renderer4) => {
          $$renderer4.push(`<div style="display: flex; flex-direction: column; gap: 16px;"><div><label for="settings-admin-username" style="display: block; margin-bottom: 8px; font-weight: 500;">用户名</label> `);
          Input($$renderer4, {
            id: "settings-admin-username",
            disabled: true,
            style: "width: 320px;",
            get value() {
              return adminForm.username;
            },
            set value($$value) {
              adminForm.username = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(`<!----></div> <div><label for="settings-admin-email" style="display: block; margin-bottom: 8px; font-weight: 500;">邮箱</label> `);
          Input($$renderer4, {
            id: "settings-admin-email",
            style: "width: 320px;",
            get value() {
              return adminForm.email;
            },
            set value($$value) {
              adminForm.email = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(`<!----></div> <div><label for="settings-admin-new-password" style="display: block; margin-bottom: 8px; font-weight: 500;">新密码</label> `);
          Input($$renderer4, {
            id: "settings-admin-new-password",
            type: "password",
            placeholder: "留空则不修改",
            style: "width: 320px;",
            get value() {
              return adminForm.new_password;
            },
            set value($$value) {
              adminForm.new_password = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(`<!----></div> <div><label for="settings-admin-confirm-password" style="display: block; margin-bottom: 8px; font-weight: 500;">确认密码</label> `);
          Input($$renderer4, {
            id: "settings-admin-confirm-password",
            type: "password",
            placeholder: "确认新密码",
            style: "width: 320px;",
            get value() {
              return adminForm.confirm_password;
            },
            set value($$value) {
              adminForm.confirm_password = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(`<!----></div> <div>`);
          Button($$renderer4, {
            type: "primary",
            onClick: saveAdminSettings,
            children: ($$renderer5) => {
              $$renderer5.push(`<!---->保存`);
            }
          });
          $$renderer4.push(`<!----></div></div>`);
        }
      });
      $$renderer3.push(`<!----></div>`);
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
