import { a2 as attr } from "../../../../chunks/index.js";
import { e as escape_html } from "../../../../chunks/context.js";
import { u as updateSettings } from "../../../../chunks/index2.js";
import { C as Card } from "../../../../chunks/Card.js";
import { B as Button } from "../../../../chunks/Button.js";
import { I as Input } from "../../../../chunks/Input.js";
import { M as Message } from "../../../../chunks/Message.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let registerForm = {
      registration_enabled: true,
      machine_code_limit: 1,
      machine_change_cooldown: 30,
      login_fail_limit: 5,
      login_lock_duration: 30
    };
    let contentForm = {
      disclaimer: "",
      support_qrcode_url: "",
      group_join_url: "",
      tutorial_url: "",
      donate_url: ""
    };
    let cloudApiForm = { dashscope_api_key: "" };
    let testingCloudApi = false;
    async function saveRegisterSettings() {
      try {
        await updateSettings({
          registration_enabled: registerForm.registration_enabled ? "1" : "0",
          machine_code_limit: String(registerForm.machine_code_limit),
          machine_change_cooldown: String(registerForm.machine_change_cooldown),
          login_fail_limit: String(registerForm.login_fail_limit),
          login_lock_duration: String(registerForm.login_lock_duration)
        });
        Message.success("保存成功");
      } catch (e) {
      }
    }
    async function saveContentSettings() {
      try {
        await updateSettings({
          disclaimer: contentForm.disclaimer,
          support_qrcode_url: contentForm.support_qrcode_url,
          group_join_url: contentForm.group_join_url,
          tutorial_url: contentForm.tutorial_url,
          donate_url: contentForm.donate_url
        });
        Message.success("保存成功");
      } catch (e) {
        Message.error("保存失败");
      }
    }
    function loadDefaultDisclaimer() {
      contentForm.disclaimer = `《丸子配音》免责条款申明

生效日期：2025年1月26日 | 版本：2.0

重要提示：在使用《丸子配音》软件及相关服务前，请您务必审慎阅读、充分理解以下免责条款。点击"同意"或继续使用本软件即表示您已阅读、理解并同意接受以下全部条款的约束。如您不同意任何条款，请立即停止使用本软件。

一、服务性质声明

1.1 本软件是一款基于人工智能技术的配音辅助工具，提供文本转语音、语音克隆等AIGC功能。本软件仅提供技术服务，不对用户使用本软件生成的任何内容承担责任。

1.2 本软件生成的所有音频内容均由人工智能模型自动合成，仅用于体验与展示模型效果，其内容不代表开发者/运营方的任何立场、观点或建议。

二、用户行为规范与责任

2.1 用户承诺在使用本软件时遵守中华人民共和国相关法律法规，包括但不限于《中华人民共和国著作权法》《中华人民共和国民法典》《互联网信息服务深度合成管理规定》等。

2.2 用户严禁利用本软件从事以下行为：
• 制作、复制、传播违反宪法和法律的内容；
• 制作、传播虚假信息、诽谤他人、侵犯他人名誉权；
• 未经授权使用他人声音进行克隆、模仿或深度伪造；
• 侵犯他人著作权、商标权、专利权、肖像权、姓名权等合法权益；
• 制作用于欺诈、诈骗或其他违法犯罪活动的内容；
• 其他违反法律法规或公序良俗的行为。

2.3 用户因违反上述规定而产生的一切法律责任，由用户自行承担，与本软件开发者/运营方无关。

三、知识产权与版权声明

3.1 用户输入素材的版权责任：用户保证其上传、输入的所有文本、音频等素材均为用户合法拥有或已获得合法授权。因用户输入侵权素材而导致的任何法律纠纷，由用户自行承担全部责任。

3.2 生成内容的版权风险：
• 本软件生成的音频内容可能与既有作品存在相似性，本软件不对生成内容的原创性、独创性作任何保证；
• 用户在将生成内容用于商业用途前，应自行进行版权核查，确保不侵犯任何第三方权益；
• 因用户使用生成内容而引发的任何知识产权纠纷、侵权索赔或法律诉讼，均由用户自行承担全部法律责任和经济赔偿，开发者/运营方不承担任何连带责任。

3.3 样音库版权声明：本软件提供的演示样音仅供功能展示和技术演示使用，不构成任何商业授权。用户在使用任何样音进行商业用途前，必须自行确认版权归属并获得相应授权，因使用样音导致的任何侵权责任由用户自行承担。

四、语音克隆特别条款

4.1 授权要求：用户使用语音克隆功能时，必须事先获得原声权利人的明确书面授权。用户应保留相关授权证明，以备核查。

4.2 禁止行为：严禁使用本软件克隆公众人物、名人、政治人物或任何未经授权的第三方声音。

4.3 责任承担：因未经授权使用他人声音进行克隆、传播或商业使用而导致的任何法律责任、侵权纠纷、行政处罚或刑事责任，均由用户自行承担，与本软件开发者/运营方无关。

4.4 深度合成标识：根据《互联网信息服务深度合成管理规定》，用户在公开传播使用本软件生成的内容时，应当以显著方式标识该内容为人工智能生成，不得误导公众。

五、技术局限性声明

5.1 本软件基于人工智能技术，无法保证生成内容的准确性、完整性、真实性或适用性。

5.2 生成内容可能存在发音错误、语调不自然、内容偏差等技术局限，用户应自行判断和核实。

5.3 用户不应将本软件生成的内容视为专业建议（如医疗、法律、金融建议）。

六、责任限制

6.1 在适用法律允许的最大范围内，开发者/运营方不对因使用或无法使用本软件造成的任何直接、间接、附带、特殊或后果性损失承担责任，包括但不限于利润损失、数据丢失、商誉损失等。

6.2 对于因自然灾害、战争、政府行为、黑客攻击、网络故障、软件BUG、电信故障等不可抗力或第三方原因导致的服务中断或数据丢失，开发者/运营方不承担责任。

6.3 本软件按"现状"提供，不作任何明示或暗示的保证，包括但不限于适销性、特定用途适用性、不侵权等保证。

七、隐私保护

7.1 我们收集的信息包括：邮箱地址、密码（加密存储）、机器码（用于设备绑定）、使用数据（用于改进服务）。

7.2 我们采用行业标准的加密技术保护您的数据，不会出售您的个人信息给第三方。

7.3 我们不会上传、存储或使用您通过本软件生成的任何音频内容，所有生成内容仅在您的本地设备处理。

八、条款变更

8.1 开发者/运营方保留随时修改本免责条款的权利，修改后的条款将在本软件内公布。

8.2 如您在条款修改后继续使用本软件，即视为您已接受修改后的条款。

九、法律适用与争议解决

9.1 本免责条款的订立、执行和解释及争议的解决均应适用中华人民共和国法律。

9.2 因本免责条款或使用本软件产生的任何争议，双方应友好协商解决；协商不成的，任何一方均可向开发者/运营方所在地有管辖权的人民法院提起诉讼。

十、其他

10.1 本免责条款构成用户与开发者/运营方之间关于使用本软件的完整协议。

10.2 本免责条款的任何条款被认定为无效或不可执行，不影响其他条款的效力。

10.3 开发者/运营方未行使或延迟行使本免责条款项下的任何权利，不构成对该权利的放弃。

用户确认：点击"同意"或继续使用本软件，即表示用户已完整阅读并理解本免责条款的全部内容，同意受其约束，并承诺遵守相关法律法规。

© 2025 丸子配音 . All Rights Reserved.`;
      Message.success("已加载客户端默认免责条款");
    }
    async function saveCloudApiSettings() {
      try {
        await updateSettings({ dashscope_api_key: cloudApiForm.dashscope_api_key });
        Message.success("云端 API 配置已保存");
      } catch (e) {
        Message.error("保存失败");
      }
    }
    async function testCloudApi() {
      if (!cloudApiForm.dashscope_api_key) {
        Message.error("请先配置 API Key");
        return;
      }
      testingCloudApi = true;
      try {
        const response = await fetch("/api/admin/test-dashscope", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${typeof window !== "undefined" ? localStorage.getItem("admin_token") : ""}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ api_key: cloudApiForm.dashscope_api_key })
        });
        const result = await response.json();
        if (result.code === 0) {
          Message.success("API Key 验证成功");
        } else {
          Message.error(result.message || "API Key 验证失败");
        }
      } catch (e) {
        Message.error("API 连接失败: " + e.message);
      } finally {
        testingCloudApi = false;
      }
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div>`);
      Card($$renderer3, {
        title: "云端 API 配置",
        style: "margin-bottom: 20px;",
        children: ($$renderer4) => {
          $$renderer4.push(`<div style="background: #e6f7ff; border: 1px solid #91d5ff; border-radius: 4px; padding: 12px; margin-bottom: 16px;"><div style="font-weight: 500; margin-bottom: 8px;">阿里云百炼 DashScope API</div> <p style="margin: 8px 0 0 0; line-height: 1.8;">用于云端 TTS 语音合成，获取 API Key： <a href="https://help.aliyun.com/zh/model-studio/get-api-key" target="_blank" style="color: #1890ff;">阿里云百炼控制台</a></p></div> <div style="display: flex; flex-direction: column; gap: 16px;"><div><label for="software-dashscope-api-key" style="display: block; margin-bottom: 8px; font-weight: 500;">DashScope API Key</label> `);
          Input($$renderer4, {
            id: "software-dashscope-api-key",
            type: "password",
            placeholder: "sk-xxxxxxxxxxxxxxxx",
            style: "width: 400px;",
            get value() {
              return cloudApiForm.dashscope_api_key;
            },
            set value($$value) {
              cloudApiForm.dashscope_api_key = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(`<!----></div> <div style="display: flex; gap: 10px;">`);
          Button($$renderer4, {
            type: "primary",
            onClick: saveCloudApiSettings,
            children: ($$renderer5) => {
              $$renderer5.push(`<!---->保存配置`);
            },
            $$slots: { default: true }
          });
          $$renderer4.push(`<!----> `);
          Button($$renderer4, {
            onClick: testCloudApi,
            loading: testingCloudApi,
            children: ($$renderer5) => {
              $$renderer5.push(`<!---->测试连接`);
            },
            $$slots: { default: true }
          });
          $$renderer4.push(`<!----></div></div>`);
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----> `);
      Card($$renderer3, {
        title: "注册控制",
        style: "margin-bottom: 20px;",
        children: ($$renderer4) => {
          $$renderer4.push(`<div style="display: flex; flex-direction: column; gap: 16px;"><div><label style="display: flex; align-items: center; gap: 8px;"><input type="checkbox"${attr("checked", registerForm.registration_enabled, true)} style="width: 16px; height: 16px; cursor: pointer;"/> <span style="font-weight: 500;">开启注册</span></label> <span style="margin-left: 24px; color: #666; font-size: 14px;">${escape_html("允许新用户注册")}</span></div> <div><label for="software-machine-code-limit" style="display: block; margin-bottom: 8px; font-weight: 500;">机器码注册限制</label> `);
          Input($$renderer4, {
            id: "software-machine-code-limit",
            type: "number",
            min: "1",
            max: "10",
            style: "width: 180px;",
            get value() {
              return registerForm.machine_code_limit;
            },
            set value($$value) {
              registerForm.machine_code_limit = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(`<!----> <span style="margin-left: 12px; color: #666;">个账号/机器码</span></div> <div><label for="software-machine-change-cooldown" style="display: block; margin-bottom: 8px; font-weight: 500;">机器码更换冷却</label> `);
          Input($$renderer4, {
            id: "software-machine-change-cooldown",
            type: "number",
            min: "1",
            max: "365",
            style: "width: 180px;",
            get value() {
              return registerForm.machine_change_cooldown;
            },
            set value($$value) {
              registerForm.machine_change_cooldown = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(`<!----> <span style="margin-left: 12px; color: #666;">天</span></div> <div><label for="software-login-fail-limit" style="display: block; margin-bottom: 8px; font-weight: 500;">登录失败锁定</label> `);
          Input($$renderer4, {
            id: "software-login-fail-limit",
            type: "number",
            min: "3",
            max: "20",
            style: "width: 180px;",
            get value() {
              return registerForm.login_fail_limit;
            },
            set value($$value) {
              registerForm.login_fail_limit = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(`<!----> <span style="margin-left: 12px; color: #666;">次后锁定</span></div> <div><label for="software-login-lock-duration" style="display: block; margin-bottom: 8px; font-weight: 500;">登录锁定时长</label> `);
          Input($$renderer4, {
            id: "software-login-lock-duration",
            type: "number",
            min: "5",
            max: "1440",
            style: "width: 180px;",
            get value() {
              return registerForm.login_lock_duration;
            },
            set value($$value) {
              registerForm.login_lock_duration = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(`<!----> <span style="margin-left: 12px; color: #666;">分钟</span></div> <div>`);
          Button($$renderer4, {
            type: "primary",
            onClick: saveRegisterSettings,
            children: ($$renderer5) => {
              $$renderer5.push(`<!---->保存配置`);
            },
            $$slots: { default: true }
          });
          $$renderer4.push(`<!----></div></div>`);
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----> `);
      Card($$renderer3, {
        title: "免责条款申明与客服",
        children: ($$renderer4) => {
          $$renderer4.push(`<div style="display: flex; flex-direction: column; gap: 16px;"><div><label for="software-disclaimer" style="display: block; margin-bottom: 8px; font-weight: 500;">免责条款申明</label> <div style="width: 600px;"><textarea id="software-disclaimer" placeholder="请输入免责条款内容" rows="12" style="width: 100%; padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 14px; font-family: inherit; resize: vertical;">`);
          const $$body = escape_html(contentForm.disclaimer);
          if ($$body) {
            $$renderer4.push(`${$$body}`);
          }
          $$renderer4.push(`</textarea> <div style="margin-top: 8px; display: flex; gap: 8px; align-items: center;">`);
          Button($$renderer4, {
            size: "small",
            onClick: loadDefaultDisclaimer,
            children: ($$renderer5) => {
              $$renderer5.push(`<!---->加载客户端默认免责条款`);
            },
            $$slots: { default: true }
          });
          $$renderer4.push(`<!----> <span style="color: #999; font-size: 12px;">修改后客户端将同步显示此内容</span></div></div></div> <div style="height: 1px; background: #e8e8e8; margin: 16px 0;"></div> <div><div style="display: block; margin-bottom: 8px; font-weight: 500;">客服二维码</div> <div><div class="qrcode-uploader svelte-jhniiz">`);
          {
            $$renderer4.push("<!--[!-->");
            $$renderer4.push(`<label class="qrcode-placeholder svelte-jhniiz"><span style="font-size: 28px; margin-bottom: 8px;" class="svelte-jhniiz">+</span> <span class="svelte-jhniiz">上传二维码</span> <input type="file" accept="image/*" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;"/></label>`);
          }
          $$renderer4.push(`<!--]--></div> <div style="color: #999; font-size: 12px; margin-top: 8px;">点击上传客服微信二维码，支持 JPG、PNG 格式，大小不超过 2MB</div></div></div> <div><label for="software-group-join-url" style="display: block; margin-bottom: 8px; font-weight: 500;">售后群链接</label> `);
          Input($$renderer4, {
            id: "software-group-join-url",
            placeholder: "QQ群或微信群链接",
            style: "width: 400px;",
            get value() {
              return contentForm.group_join_url;
            },
            set value($$value) {
              contentForm.group_join_url = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(`<!----> <div style="color: #999; font-size: 12px; margin-top: 4px;">对应客户端左侧"售后群"菜单</div></div> <div><label for="software-tutorial-url" style="display: block; margin-bottom: 8px; font-weight: 500;">使用教程链接</label> `);
          Input($$renderer4, {
            id: "software-tutorial-url",
            placeholder: "使用教程链接",
            style: "width: 400px;",
            get value() {
              return contentForm.tutorial_url;
            },
            set value($$value) {
              contentForm.tutorial_url = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(`<!----> <div style="color: #999; font-size: 12px; margin-top: 4px;">对应客户端左侧"使用教程"菜单</div></div> <div><label for="software-donate-url" style="display: block; margin-bottom: 8px; font-weight: 500;">推广赚钱链接</label> `);
          Input($$renderer4, {
            id: "software-donate-url",
            placeholder: "推广赚钱页面链接",
            style: "width: 400px;",
            get value() {
              return contentForm.donate_url;
            },
            set value($$value) {
              contentForm.donate_url = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(`<!----> <div style="color: #999; font-size: 12px; margin-top: 4px;">对应客户端左侧"推广赚钱"菜单</div></div> <div>`);
          Button($$renderer4, {
            type: "primary",
            onClick: saveContentSettings,
            children: ($$renderer5) => {
              $$renderer5.push(`<!---->保存设置`);
            },
            $$slots: { default: true }
          });
          $$renderer4.push(`<!----></div></div>`);
        },
        $$slots: { default: true }
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
