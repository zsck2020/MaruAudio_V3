import"../chunks/Bzak7iHL.js";import{o as re}from"../chunks/q4OCzlSm.js";import{p as le,$ as K,a as se,a5 as t,a0 as ne,a2 as a,a7 as W,a4 as i,a3 as p,f as de,_ as pe,a6 as ce,a1 as E}from"../chunks/5yUWFagQ.js";import{d as _e,f as I,a as u,t as S,s as ue}from"../chunks/DHRCVGej.js";import{i as ve}from"../chunks/ZIXrXB8P.js";import{r as me,k as ge,c as fe,u as Q,l as he,m as ye}from"../chunks/D88LYrld.js";import{I as w,a as xe,b as be}from"../chunks/B7cjcF9J.js";import{l as we}from"../chunks/B9IddcEG.js";import{C as R}from"../chunks/D31GqF-Q.js";import{B as q}from"../chunks/CyW0HbvM.js";import{M as v}from"../chunks/DxyAqpLI.js";var ke=I('<div style="background: #e6f7ff; border: 1px solid #91d5ff; border-radius: 4px; padding: 12px; margin-bottom: 16px;"><div style="font-weight: 500; margin-bottom: 8px;">阿里云百炼 DashScope API</div> <p style="margin: 8px 0 0 0; line-height: 1.8;">用于云端 TTS 语音合成，获取 API Key： <a href="https://help.aliyun.com/zh/model-studio/get-api-key" target="_blank" style="color: #1890ff;">阿里云百炼控制台</a></p></div> <div style="display: flex; flex-direction: column; gap: 16px;"><div><label for="software-dashscope-api-key" style="display: block; margin-bottom: 8px; font-weight: 500;">DashScope API Key</label> <!></div> <div style="display: flex; gap: 10px;"><!> <!></div></div>',1),$e=I('<div style="display: flex; flex-direction: column; gap: 16px;"><div><label style="display: flex; align-items: center; gap: 8px;"><input type="checkbox" style="width: 16px; height: 16px; cursor: pointer;"/> <span style="font-weight: 500;">开启注册</span></label> <span style="margin-left: 24px; color: #666; font-size: 14px;"> </span></div> <div><label for="software-machine-code-limit" style="display: block; margin-bottom: 8px; font-weight: 500;">机器码注册限制</label> <!> <span style="margin-left: 12px; color: #666;">个账号/机器码</span></div> <div><label for="software-machine-change-cooldown" style="display: block; margin-bottom: 8px; font-weight: 500;">机器码更换冷却</label> <!> <span style="margin-left: 12px; color: #666;">天</span></div> <div><label for="software-login-fail-limit" style="display: block; margin-bottom: 8px; font-weight: 500;">登录失败锁定</label> <!> <span style="margin-left: 12px; color: #666;">次后锁定</span></div> <div><label for="software-login-lock-duration" style="display: block; margin-bottom: 8px; font-weight: 500;">登录锁定时长</label> <!> <span style="margin-left: 12px; color: #666;">分钟</span></div> <div><!></div></div>'),ze=I('<div class="qrcode-preview svelte-jhniiz"><img alt="客服二维码" style="width: 100%; height: 100%; object-fit: contain;"/> <div class="qrcode-overlay svelte-jhniiz"><span class="svelte-jhniiz">更换</span></div> <input type="file" accept="image/*" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;"/></div>'),je=I('<label class="qrcode-placeholder svelte-jhniiz"><span style="font-size: 28px; margin-bottom: 8px;" class="svelte-jhniiz">+</span> <span class="svelte-jhniiz">上传二维码</span> <input type="file" accept="image/*" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;"/></label>'),Pe=I('<div style="display: flex; flex-direction: column; gap: 16px;"><div><label for="software-disclaimer" style="display: block; margin-bottom: 8px; font-weight: 500;">免责条款申明</label> <div style="width: 600px;"><textarea id="software-disclaimer" placeholder="请输入免责条款内容" rows="12" style="width: 100%; padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 14px; font-family: inherit; resize: vertical;"></textarea> <div style="margin-top: 8px; display: flex; gap: 8px; align-items: center;"><!> <span style="color: #999; font-size: 12px;">修改后客户端将同步显示此内容</span></div></div></div> <div style="height: 1px; background: #e8e8e8; margin: 16px 0;"></div> <div><div style="display: block; margin-bottom: 8px; font-weight: 500;">客服二维码</div> <div><div class="qrcode-uploader svelte-jhniiz"><!></div> <div style="color: #999; font-size: 12px; margin-top: 8px;">点击上传客服微信二维码，支持 JPG、PNG 格式，大小不超过 2MB</div></div></div> <div><label for="software-group-join-url" style="display: block; margin-bottom: 8px; font-weight: 500;">售后群链接</label> <!> <div style="color: #999; font-size: 12px; margin-top: 4px;">对应客户端左侧"售后群"菜单</div></div> <div><label for="software-tutorial-url" style="display: block; margin-bottom: 8px; font-weight: 500;">使用教程链接</label> <!> <div style="color: #999; font-size: 12px; margin-top: 4px;">对应客户端左侧"使用教程"菜单</div></div> <div><label for="software-donate-url" style="display: block; margin-bottom: 8px; font-weight: 500;">推广赚钱链接</label> <!> <div style="color: #999; font-size: 12px; margin-top: 4px;">对应客户端左侧"推广赚钱"菜单</div></div> <div><!></div></div>'),Ie=I("<div><!> <!> <!></div>");function Re(H,O){le(O,!0);let r=K({registration_enabled:!0,machine_code_limit:1,machine_change_cooldown:30,login_fail_limit:5,login_lock_duration:30}),o=K({disclaimer:"",support_qrcode_url:"",group_join_url:"",tutorial_url:"",donate_url:""}),z=K({dashscope_api_key:""}),D=pe(!1);async function V(){try{const e=await fe();e.data&&(r.registration_enabled=e.data.registration_enabled==="1"||e.data.registration_enabled===!0,r.machine_code_limit=parseInt(e.data.machine_code_limit)||1,r.machine_change_cooldown=parseInt(e.data.machine_change_cooldown)||30,r.login_fail_limit=parseInt(e.data.login_fail_limit)||5,r.login_lock_duration=parseInt(e.data.login_lock_duration)||30,o.disclaimer=e.data.disclaimer||"",o.support_qrcode_url=e.data.support_qrcode_url||"",o.group_join_url=e.data.group_join_url||"",o.tutorial_url=e.data.tutorial_url||"",o.donate_url=e.data.donate_url||"",z.dashscope_api_key=e.data.dashscope_api_key||"")}catch(e){we.error("加载设置失败",e)}}async function X(){try{await Q({registration_enabled:r.registration_enabled?"1":"0",machine_code_limit:String(r.machine_code_limit),machine_change_cooldown:String(r.machine_change_cooldown),login_fail_limit:String(r.login_fail_limit),login_lock_duration:String(r.login_lock_duration)}),v.success("保存成功")}catch{}}async function T(){try{await Q({disclaimer:o.disclaimer,support_qrcode_url:o.support_qrcode_url,group_join_url:o.group_join_url,tutorial_url:o.tutorial_url,donate_url:o.donate_url}),v.success("保存成功")}catch{v.error("保存失败")}}function Y(){o.disclaimer=`《丸子配音》免责条款申明

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

© 2025 丸子配音 . All Rights Reserved.`,v.success("已加载客户端默认免责条款")}async function Z(){try{await Q({dashscope_api_key:z.dashscope_api_key}),v.success("云端 API 配置已保存")}catch{v.error("保存失败")}}async function ee(){if(!z.dashscope_api_key){v.error("请先配置 API Key");return}E(D,!0);try{await he({api_key:z.dashscope_api_key}),v.success("API Key 验证成功")}catch{}finally{E(D,!1)}}function te(e){const h=e.type.startsWith("image/"),s=e.size/1024/1024<2;return h?s?!0:(v.error("图片大小不能超过 2MB"),!1):(v.error("只能上传图片文件"),!1)}async function U(e){var s,c;const h=(s=e.target.files)==null?void 0:s[0];if(h&&te(h)){try{const n=new FormData;n.append("file",h),n.append("type","qrcode");const _=await ye(n);(c=_.data)!=null&&c.url&&(o.support_qrcode_url=_.data.url,await T(),v.success("上传成功"))}catch{}e.target.value=""}}re(()=>{V()});var M=Ie(),J=a(M);R(J,{title:"云端 API 配置",style:"margin-bottom: 20px;",children:(e,h)=>{var s=ke(),c=t(ne(s),2),n=a(c),_=t(a(n),2);w(_,{id:"software-dashscope-api-key",type:"password",placeholder:"sk-xxxxxxxxxxxxxxxx",style:"width: 400px;",get value(){return z.dashscope_api_key},set value(m){z.dashscope_api_key=m}}),i(n);var y=t(n,2),j=a(y);q(j,{type:"primary",onClick:Z,children:(m,x)=>{p();var k=S("保存配置");u(m,k)},$$slots:{default:!0}});var g=t(j,2);q(g,{onClick:ee,get loading(){return de(D)},children:(m,x)=>{p();var k=S("测试连接");u(m,k)},$$slots:{default:!0}}),i(y),i(c),u(e,s)},$$slots:{default:!0}});var L=t(J,2);R(L,{title:"注册控制",style:"margin-bottom: 20px;",children:(e,h)=>{var s=$e(),c=a(s),n=a(c),_=a(n);me(_),p(2),i(n);var y=t(n,2),j=a(y,!0);i(y),i(c);var g=t(c,2),m=t(a(g),2);w(m,{id:"software-machine-code-limit",type:"number",min:"1",max:"10",style:"width: 180px;",get value(){return r.machine_code_limit},set value(d){r.machine_code_limit=d}}),p(2),i(g);var x=t(g,2),k=t(a(x),2);w(k,{id:"software-machine-change-cooldown",type:"number",min:"1",max:"365",style:"width: 180px;",get value(){return r.machine_change_cooldown},set value(d){r.machine_change_cooldown=d}}),p(2),i(x);var A=t(x,2),B=t(a(A),2);w(B,{id:"software-login-fail-limit",type:"number",min:"3",max:"20",style:"width: 180px;",get value(){return r.login_fail_limit},set value(d){r.login_fail_limit=d}}),p(2),i(A);var $=t(A,2),F=t(a($),2);w(F,{id:"software-login-lock-duration",type:"number",min:"5",max:"1440",style:"width: 180px;",get value(){return r.login_lock_duration},set value(d){r.login_lock_duration=d}}),p(2),i($);var P=t($,2),G=a(P);q(G,{type:"primary",onClick:X,children:(d,N)=>{p();var C=S("保存配置");u(d,C)},$$slots:{default:!0}}),i(P),i(s),W(()=>ue(j,r.registration_enabled?"允许新用户注册":"禁止新用户注册")),xe(_,()=>r.registration_enabled,d=>r.registration_enabled=d),u(e,s)},$$slots:{default:!0}});var ae=t(L,2);R(ae,{title:"免责条款申明与客服",children:(e,h)=>{var s=Pe(),c=a(s),n=t(a(c),2),_=a(n);ce(_);var y=t(_,2),j=a(y);q(j,{size:"small",onClick:Y,children:(l,f)=>{p();var b=S("加载客户端默认免责条款");u(l,b)},$$slots:{default:!0}}),p(2),i(y),i(n),i(c);var g=t(c,4),m=t(a(g),2),x=a(m),k=a(x);{var A=l=>{var f=ze(),b=a(f),oe=t(b,4);oe.__change=U,i(f),W(()=>ge(b,"src",o.support_qrcode_url)),u(l,f)},B=l=>{var f=je(),b=t(a(f),4);b.__change=U,i(f),u(l,f)};ve(k,l=>{o.support_qrcode_url?l(A):l(B,!1)})}i(x),p(2),i(m),i(g);var $=t(g,2),F=t(a($),2);w(F,{id:"software-group-join-url",placeholder:"QQ群或微信群链接",style:"width: 400px;",get value(){return o.group_join_url},set value(l){o.group_join_url=l}}),p(2),i($);var P=t($,2),G=t(a(P),2);w(G,{id:"software-tutorial-url",placeholder:"使用教程链接",style:"width: 400px;",get value(){return o.tutorial_url},set value(l){o.tutorial_url=l}}),p(2),i(P);var d=t(P,2),N=t(a(d),2);w(N,{id:"software-donate-url",placeholder:"推广赚钱页面链接",style:"width: 400px;",get value(){return o.donate_url},set value(l){o.donate_url=l}}),p(2),i(d);var C=t(d,2),ie=a(C);q(ie,{type:"primary",onClick:T,children:(l,f)=>{p();var b=S("保存设置");u(l,b)},$$slots:{default:!0}}),i(C),i(s),be(_,()=>o.disclaimer,l=>o.disclaimer=l),u(e,s)},$$slots:{default:!0}}),i(M),u(H,M),se()}_e(["change"]);export{Re as component};
