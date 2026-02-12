import{_ as G,i as Q,o as b,c as h,a as o,b as l,w as t,r,f as V,k as A,A as E,e as m,t as O,B as R,E as u,g as J}from"./index-BmC06Owv.js";import{l as $,p as k}from"./index-BeQ7cyNh.js";const L={class:"table-card"},W={style:{"margin-top":"0"}},H={class:"table-card"},X={style:{"margin-top":"0"}},Y={style:{"margin-left":"12px",color:"#666"}},Z={class:"table-card"},ee={style:{"margin-top":"0"}},le={style:{width:"600px"}},te={style:{"margin-top":"8px",display:"flex",gap:"8px"}},oe={key:0,class:"qrcode-preview"},ae=["src"],ne={class:"qrcode-overlay"},ie={key:1,class:"qrcode-placeholder"},se={__name:"Software",setup(re){const i=V({registration_enabled:!0,machine_code_limit:1,machine_change_cooldown:30,login_fail_limit:5,login_lock_duration:30}),n=V({disclaimer:"",support_qrcode_url:"",group_join_url:"",tutorial_url:"",donate_url:""}),c=V({dashscope_api_key:""}),y=J(!1),I=async()=>{try{const a=await $();a.data&&(i.registration_enabled=a.data.registration_enabled==="1"||a.data.registration_enabled===!0,i.machine_code_limit=parseInt(a.data.machine_code_limit)||1,i.machine_change_cooldown=parseInt(a.data.machine_change_cooldown)||30,i.login_fail_limit=parseInt(a.data.login_fail_limit)||5,i.login_lock_duration=parseInt(a.data.login_lock_duration)||30,n.disclaimer=a.data.disclaimer||"",n.support_qrcode_url=a.data.support_qrcode_url||"",n.group_join_url=a.data.group_join_url||"",n.tutorial_url=a.data.tutorial_url||"",n.donate_url=a.data.donate_url||"",c.dashscope_api_key=a.data.dashscope_api_key||"")}catch(a){console.error("加载设置失败",a)}},q=async()=>{try{await k({registration_enabled:i.registration_enabled?"1":"0",machine_code_limit:String(i.machine_code_limit),machine_change_cooldown:String(i.machine_change_cooldown),login_fail_limit:String(i.login_fail_limit),login_lock_duration:String(i.login_lock_duration)}),u.success("保存成功")}catch{}},v=async()=>{try{await k({disclaimer:n.disclaimer,support_qrcode_url:n.support_qrcode_url,group_join_url:n.group_join_url,tutorial_url:n.tutorial_url,donate_url:n.donate_url}),u.success("保存成功")}catch{}},U=()=>{n.disclaimer=`《丸子配音》免责条款申明

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

© 2025 丸子配音 . All Rights Reserved.`,u.success("已加载客户端默认免责条款")},C=async()=>{try{await k({dashscope_api_key:c.dashscope_api_key}),u.success("云端 API 配置已保存")}catch{u.error("保存失败")}},P=async()=>{if(!c.dashscope_api_key){u.error("请先配置 API Key");return}y.value=!0;try{const e=await(await fetch("/api/admin/test-dashscope",{method:"POST",headers:{Authorization:`Bearer ${localStorage.getItem("admin_token")}`,"Content-Type":"application/json"},body:JSON.stringify({api_key:c.dashscope_api_key})})).json();e.code===0?u.success("API Key 验证成功"):u.error(e.message||"API Key 验证失败")}catch(a){u.error("API 连接失败: "+a.message)}finally{y.value=!1}},j=a=>{const e=a.type.startsWith("image/"),p=a.size/1024/1024<2;return e?p?!0:(u.error("图片大小不能超过 2MB"),!1):(u.error("只能上传图片文件"),!1)},z=async({file:a})=>{var e;try{const p=new FormData;p.append("file",a),p.append("type","qrcode");const _=await(await fetch("https://175.178.131.67/api/admin/upload",{method:"POST",headers:{Authorization:`Bearer ${localStorage.getItem("admin_token")}`},body:p})).json();_.code===0&&((e=_.data)!=null&&e.url)?(n.support_qrcode_url=_.data.url,await v(),u.success("上传成功")):u.error(_.message||"上传失败")}catch(p){u.error("上传失败: "+p.message)}};return Q(()=>{I()}),(a,e)=>{const p=r("el-icon"),S=r("el-alert"),_=r("el-input"),d=r("el-form-item"),g=r("el-button"),x=r("el-form"),w=r("el-col"),B=r("Setting"),D=r("el-switch"),f=r("el-input-number"),T=r("Document"),K=r("el-divider"),M=r("Upload"),N=r("el-upload"),F=r("el-row");return b(),h("div",null,[e[31]||(e[31]=o("div",{class:"page-header"},[o("h3",{class:"page-title"},"软件管理")],-1)),l(F,{gutter:20},{default:t(()=>[l(w,{span:24,style:{"margin-bottom":"20px"}},{default:t(()=>[o("div",L,[o("h4",W,[l(p,null,{default:t(()=>[l(A(E))]),_:1}),e[10]||(e[10]=m(" 云端 API 配置 ",-1))]),l(S,{type:"info",closable:!1,style:{"margin-bottom":"15px"}},{title:t(()=>[...e[11]||(e[11]=[m("阿里云百炼 DashScope API",-1)])]),default:t(()=>[e[12]||(e[12]=o("p",{style:{margin:"8px 0 0 0","line-height":"1.8"}},[m(" 用于云端 TTS 语音合成，获取 API Key： "),o("a",{href:"https://help.aliyun.com/zh/model-studio/get-api-key",target:"_blank",style:{color:"#1890ff"}},"阿里云百炼控制台")],-1))]),_:1}),l(x,{model:c,"label-width":"130px"},{default:t(()=>[l(d,{label:"DashScope API Key"},{default:t(()=>[l(_,{modelValue:c.dashscope_api_key,"onUpdate:modelValue":e[0]||(e[0]=s=>c.dashscope_api_key=s),type:"password","show-password":"",placeholder:"sk-xxxxxxxxxxxxxxxx",style:{width:"400px"}},null,8,["modelValue"])]),_:1}),l(d,null,{default:t(()=>[l(g,{type:"primary",onClick:C},{default:t(()=>[...e[13]||(e[13]=[m("保存配置",-1)])]),_:1}),l(g,{onClick:P,loading:y.value},{default:t(()=>[...e[14]||(e[14]=[m("测试连接",-1)])]),_:1},8,["loading"])]),_:1})]),_:1},8,["model"])])]),_:1}),l(w,{span:24,style:{"margin-bottom":"20px"}},{default:t(()=>[o("div",H,[o("h4",X,[l(p,null,{default:t(()=>[l(B)]),_:1}),e[15]||(e[15]=m(" 注册控制 ",-1))]),l(x,{model:i,"label-width":"130px"},{default:t(()=>[l(d,{label:"开启注册"},{default:t(()=>[l(D,{modelValue:i.registration_enabled,"onUpdate:modelValue":e[1]||(e[1]=s=>i.registration_enabled=s)},null,8,["modelValue"]),o("span",Y,O(i.registration_enabled?"允许新用户注册":"禁止新用户注册"),1)]),_:1}),l(d,{label:"机器码注册限制"},{default:t(()=>[l(f,{modelValue:i.machine_code_limit,"onUpdate:modelValue":e[2]||(e[2]=s=>i.machine_code_limit=s),min:1,max:10,style:{width:"180px"}},null,8,["modelValue"]),e[16]||(e[16]=o("span",{style:{"margin-left":"12px",color:"#666"}},"个账号/机器码",-1))]),_:1}),l(d,{label:"机器码更换冷却"},{default:t(()=>[l(f,{modelValue:i.machine_change_cooldown,"onUpdate:modelValue":e[3]||(e[3]=s=>i.machine_change_cooldown=s),min:1,max:365,style:{width:"180px"}},null,8,["modelValue"]),e[17]||(e[17]=o("span",{style:{"margin-left":"12px",color:"#666"}},"天",-1))]),_:1}),l(d,{label:"登录失败锁定"},{default:t(()=>[l(f,{modelValue:i.login_fail_limit,"onUpdate:modelValue":e[4]||(e[4]=s=>i.login_fail_limit=s),min:3,max:20,style:{width:"180px"}},null,8,["modelValue"]),e[18]||(e[18]=o("span",{style:{"margin-left":"12px",color:"#666"}},"次后锁定",-1))]),_:1}),l(d,{label:"登录锁定时长"},{default:t(()=>[l(f,{modelValue:i.login_lock_duration,"onUpdate:modelValue":e[5]||(e[5]=s=>i.login_lock_duration=s),min:5,max:1440,style:{width:"180px"}},null,8,["modelValue"]),e[19]||(e[19]=o("span",{style:{"margin-left":"12px",color:"#666"}},"分钟",-1))]),_:1}),l(d,null,{default:t(()=>[l(g,{type:"primary",onClick:q},{default:t(()=>[...e[20]||(e[20]=[m("保存配置",-1)])]),_:1})]),_:1})]),_:1},8,["model"])])]),_:1}),l(w,{span:24,style:{"margin-bottom":"20px"}},{default:t(()=>[o("div",Z,[o("h4",ee,[l(p,null,{default:t(()=>[l(T)]),_:1}),e[21]||(e[21]=m(" 免责条款申明与客服 ",-1))]),l(x,{model:n,"label-width":"130px"},{default:t(()=>[l(d,{label:"免责条款申明"},{default:t(()=>[o("div",le,[l(_,{modelValue:n.disclaimer,"onUpdate:modelValue":e[6]||(e[6]=s=>n.disclaimer=s),type:"textarea",rows:12,placeholder:"请输入免责条款内容",style:{width:"100%"}},null,8,["modelValue"]),o("div",te,[l(g,{size:"small",onClick:U},{default:t(()=>[...e[22]||(e[22]=[m("加载客户端默认免责条款",-1)])]),_:1}),e[23]||(e[23]=o("span",{style:{color:"#999","font-size":"12px","line-height":"24px"}},"修改后客户端将同步显示此内容",-1))])])]),_:1}),l(K),l(d,{label:"客服二维码"},{default:t(()=>[o("div",null,[l(N,{class:"qrcode-uploader","show-file-list":!1,"before-upload":j,"http-request":z,accept:"image/*"},{default:t(()=>[n.support_qrcode_url?(b(),h("div",oe,[o("img",{src:n.support_qrcode_url,style:{width:"100%",height:"100%","object-fit":"contain"}},null,8,ae),o("div",ne,[l(p,null,{default:t(()=>[l(M)]),_:1}),e[24]||(e[24]=o("span",null,"更换",-1))])])):(b(),h("div",ie,[l(p,null,{default:t(()=>[l(A(R))]),_:1}),e[25]||(e[25]=o("span",null,"上传二维码",-1))]))]),_:1}),e[26]||(e[26]=o("div",{style:{color:"#999","font-size":"12px","margin-top":"8px"}},"点击上传客服微信二维码，支持 JPG、PNG 格式，大小不超过 2MB",-1))])]),_:1}),l(d,{label:"售后群链接"},{default:t(()=>[o("div",null,[l(_,{modelValue:n.group_join_url,"onUpdate:modelValue":e[7]||(e[7]=s=>n.group_join_url=s),placeholder:"QQ群或微信群链接",style:{width:"400px"}},null,8,["modelValue"]),e[27]||(e[27]=o("div",{style:{color:"#999","font-size":"12px","margin-top":"4px"}},'对应客户端左侧"售后群"菜单',-1))])]),_:1}),l(d,{label:"使用教程链接"},{default:t(()=>[o("div",null,[l(_,{modelValue:n.tutorial_url,"onUpdate:modelValue":e[8]||(e[8]=s=>n.tutorial_url=s),placeholder:"使用教程链接",style:{width:"400px"}},null,8,["modelValue"]),e[28]||(e[28]=o("div",{style:{color:"#999","font-size":"12px","margin-top":"4px"}},'对应客户端左侧"使用教程"菜单',-1))])]),_:1}),l(d,{label:"推广赚钱链接"},{default:t(()=>[o("div",null,[l(_,{modelValue:n.donate_url,"onUpdate:modelValue":e[9]||(e[9]=s=>n.donate_url=s),placeholder:"推广赚钱页面链接",style:{width:"400px"}},null,8,["modelValue"]),e[29]||(e[29]=o("div",{style:{color:"#999","font-size":"12px","margin-top":"4px"}},'对应客户端左侧"推广赚钱"菜单',-1))])]),_:1}),l(d,null,{default:t(()=>[l(g,{type:"primary",onClick:v},{default:t(()=>[...e[30]||(e[30]=[m("保存设置",-1)])]),_:1})]),_:1})]),_:1},8,["model"])])]),_:1})]),_:1})])}}},pe=G(se,[["__scopeId","data-v-a7f52479"]]);export{pe as default};
