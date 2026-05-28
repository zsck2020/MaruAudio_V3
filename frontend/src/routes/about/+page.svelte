<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';
  import Logo from '$lib/icons/Logo.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { invoke } from '@tauri-apps/api/core';
  import { onMount } from 'svelte';

  let version = $state('3.0.0');
  let build = $state('20260513');
  let installPath = $state('—');
  let dataDir = $state('—');

  let license = {
    type: '旗舰版',
    account: 'user***@example.com',
    key: 'MARU-****-****-Q8K3',
    state: '已激活',
    expire: '2026-12-31',
    days: 218,
    devices: '1 / 2',
  };

  onMount(async () => {
    try {
      const v = await invoke<string>('get_app_version');
      if (v) version = v;
    } catch {}
  });

  function handleCheckUpdate() {
    toast.info('已是最新版本（v' + version + '）');
  }

  let legalModal = $state<'agreement' | 'privacy' | 'terms' | null>(null);
  let legalOpen = $state(false);

  function openLegal(type: 'agreement' | 'privacy' | 'terms') {
    legalModal = type;
    legalOpen = true;
  }

  function closeLegal() {
    legalOpen = false;
    legalModal = null;
  }

  const LEGAL_TITLES: Record<string, string> = {
    agreement: '用户协议',
    privacy: '隐私政策',
    terms: '服务条款',
  };

  const LEGAL_CONTENT: Record<string, string> = {
    agreement: `丸子配音用户协议

生效日期：2024 年 1 月 1 日　　最近更新：2026 年 5 月 1 日

重要提示：本协议是您（以下简称"用户"）与丸子科技（以下简称"我们"）之间关于下载、安装、注册、登录、购买和使用丸子配音软件及相关服务（以下简称"本软件"或"本服务"）的协议。请您在使用前仔细阅读全部内容，特别是与深度合成、声音授权、付费规则、免责限制、违约责任和争议解决有关的条款。如您不同意本协议任何内容，请停止使用本服务。

本协议文本为产品内置规则说明，不构成法律意见。我们会根据法律法规、监管要求和产品形态变化适时更新。

第一条 服务说明
1.1 本软件是一款基于深度合成技术的专业 AI 配音与音频创作工具，提供语音合成、情感控制、字幕生成、音频编辑等功能。
1.2 本软件属于《互联网信息服务深度合成管理规定》所称的深度合成服务，涉及语音生成、仿声等深度合成技术。
1.3 本软件提供本地推理（数据不离开用户设备）和云端引擎（用户主动选择后按字符使用）两种模式。
1.4 本软件仅面向合法、正当、必要的内容创作场景，不应用于身份冒充、诈骗、虚假宣传、违法广告、恶意剪辑或其他侵害他人权益的用途。

第二条 用户注册与身份认证
2.1 用户在使用本软件部分功能前，应当按照真实身份信息认证的要求完成账号注册。
2.2 用户应保证注册信息的真实性、准确性和完整性，如信息发生变更应及时更新。
2.3 用户应妥善保管账号、密码、激活码、设备授权和 API Key。因用户主动泄露、出借、转让或保管不善造成的损失，由用户自行承担；但因我们系统安全缺陷造成的损失，按法律规定承担责任。
2.4 未满 18 周岁的未成年人应在监护人的同意和指导下使用本软件；未满 14 周岁的儿童原则上不得自行注册或购买付费服务。

第三条 声音授权、深度合成与用户责任

重要声明：声音可能受人格权益、著作权、邻接权、表演者权、商业形象权益、反不正当竞争、个人信息和生物识别信息等多重规则保护。用户在上传、克隆、合成、传播或商用任何声音前，应确保拥有合法、充分、可证明的授权或其他合法依据。

3.1 授权要求
  （一）用户不得上传、克隆或使用未获授权的自然人声音、表演录音、影视/游戏/广播剧角色声音、主播/演员/公众人物声音或其他第三方享有权利的声音。
  （二）如用户代表企业、团队或客户使用本服务，应确保已取得必要的内部授权、客户授权和素材授权。
  （三）用户应自行保存授权证明、委托文件、版权许可、录音来源凭证等资料，以便发生争议时举证。

3.2 用户责任
  （一）因用户上传素材、输入文本、生成内容、发布内容或商业使用行为侵犯第三方权益、违反法律法规或监管要求的，由用户依法承担相应责任。
  （二）如第三方向我们投诉、索赔、举报或提起诉讼，且相关争议系用户违法违规或违约行为导致，用户应配合处理并赔偿因此给我们造成的合理损失，包括赔偿款、行政罚款、律师费、取证费、公证费、差旅费等。
  （三）本条不排除或限制我们依法应承担的产品安全、个人信息保护、消费者权益保护等法定责任。

3.3 风险提示（仅为善意提醒，不构成法律建议）
  （一）使用他人声音进行克隆前，建议获得声音权利人的明确同意；
  （二）使用克隆声音冒充他人身份可能构成诈骗等违法犯罪行为，违反《中华人民共和国反电信网络诈骗法》等法律法规；
  （三）制作传播虚假音视频可能违反《互联网信息服务深度合成管理规定》及《互联网信息服务算法推荐管理规定》；
  （四）未经授权将他人声音用于商业用途可能构成民事侵权；
  （五）将 AI 生成的语音用于金融、医疗、新闻、司法、教育、政务等对真实性有特殊要求的场景，可能涉及更高合规风险。

3.4 合成内容标识
  （一）用户对外发布、传播、商用本软件生成的语音内容时，应依法显著标识或说明其为 AI 生成/合成内容。
  （二）用户不得删除、篡改、规避、伪造本软件依法添加的显式或隐式合成标识。
  （三）用户不得将生成内容用于误导他人相信其为真实自然人原声、真实新闻事实或真实官方通知。

第四条 其他用户行为规范
4.1 用户不得利用本软件从事以下行为：
  （一）生成、传播危害国家安全、损害国家荣誉和利益的内容；
  （二）生成、传播煽动颠覆国家政权、推翻社会主义制度的内容；
  （三）生成、传播编造虚假信息、散布谣言、扰乱社会秩序的内容；
  （四）生成、传播淫秽色情、暴力恐怖、赌博等违法违规内容；
  （五）冒充他人身份、伪造亲友/客服/公检法/金融机构声音实施诈骗或骚扰；
  （六）绕过会员限制、破解授权、攻击接口、批量注册、恶意占用服务资源；
  （七）法律法规、部门规章及本协议禁止的其他行为。
4.2 用户应确保输入文本、参考音频、上传图片、字幕、项目文件和导出内容不含违法违规内容，不侵犯第三方合法权益。

第五条 深度合成内容标识
5.1 本软件生成的语音内容属于深度合成内容，用户在传播使用时应主动声明其为 AI 生成内容。
5.2 在法律法规、技术条件和产品形态允许的范围内，本软件可能在生成文件、元数据、文件名、项目记录或水印中加入合成标识、任务编号或版本信息。
5.3 用户不得恶意删除、篡改、伪造或隐匿本软件添加的生成合成内容标识。因用户删除或规避标识造成的后果由用户自行承担。

第六条 知识产权
6.1 本软件的代码、UI 设计、模型权重、文档等知识产权归丸子科技所有。
6.2 用户使用本软件生成的音频内容，在不侵犯第三方权利的前提下，其知识产权归用户所有。
6.3 软件内置的预置样音、封面、模板、示例文本和演示素材仅供产品体验、功能评估和合法授权范围内使用；如页面另有授权说明，从其说明。
6.4 未经我们书面许可，用户不得反向工程、反编译、拆解、出租、转售、转授权、复制或改编本软件及其组成部分。

第七条 数据安全与个人信息保护
7.1 本软件的数据处理活动遵循《中华人民共和国数据安全法》和《中华人民共和国个人信息保护法》的相关规定。
7.2 涉及用户声音等敏感个人信息或生物识别信息的处理，本软件将依法获取用户的单独同意，并提供撤回同意、删除本地素材等控制方式。
7.3 具体数据处理规则详见《丸子配音隐私政策》。

第八条 免责声明
8.1 AI 生成的语音可能与真实人声存在差异，本软件不对生成质量做绝对保证。
8.2 本软件不保证生成内容适合任何特定商业目的、行业审查或平台审核规则，用户应自行进行人工审核和必要修改。
8.3 因不可抗力（包括但不限于自然灾害、政府行为、网络攻击、电力中断、重大公共事件等）导致的服务中断，我们将在合理范围内尽快恢复，但不承担超出法律规定的赔偿责任。
8.4 用户使用第三方 LLM API 进行台词拆分、字幕翻译等辅助功能时，相关数据由第三方服务商处理，丸子科技不对第三方服务的可用性、安全性及数据处理行为承担责任。
8.5 用户选择云端引擎时，应理解对应文本与必要音频素材会用于完成本次生成任务；如用户不希望上传素材，可仅使用本地引擎。
8.6 本协议中的免责和责任限制不适用于因我们故意或重大过失造成的人身损害、财产损失，亦不排除法律规定不得排除或限制的责任。

第九条 违规处理
9.1 丸子科技有权对违反本协议的用户采取警示、限制功能、暂停服务、关闭账号等处置措施。
9.2 对涉及侵权投诉、违法违规线索、深度合成滥用、未成年人权益保护等事项，我们有权依法采取下架、删除、限制导出、冻结账号、保存证据、向有关部门报告等措施。
9.3 因用户违法违规行为受到行政处罚或司法追究的，丸子科技有权依法配合相关部门提供必要信息。

第十条 投诉与申诉
10.1 用户对本软件的服务有异议的，可通过 support@wzagent.cn 进行投诉。
10.2 丸子科技将在收到投诉后 15 个工作日内予以回复。
10.3 如您发现他人未经授权使用您的声音进行克隆，可通过上述渠道举报，我们将在核实后采取处置措施。

第十一条 协议变更与终止
11.1 丸子科技有权根据法律法规变化或业务需要修改本协议，修改后将在软件内以弹窗方式通知用户。
11.2 用户继续使用本软件即视为接受修改后的协议。
11.3 用户可随时停止使用本服务并删除本地数据；涉及已购买会员、字符包或团队授权的，按照购买页面、服务条款及双方合同约定处理。

第十二条 法律适用与争议解决
12.1 本协议的订立、履行、解释及争议解决均适用中华人民共和国法律（不包括港澳台地区法律）。
12.2 因本协议引发的争议，双方应友好协商解决；协商不成的，任一方可向丸子科技住所地有管辖权的人民法院提起诉讼。`,

    privacy: `丸子配音隐私政策

生效日期：2024 年 1 月 1 日　　最近更新：2026 年 5 月 1 日

丸子科技深知个人信息对您的重要性，并将尽力保护您的个人信息安全。本隐私政策旨在向您说明我们如何收集、使用、存储、共享、转让、公开披露和保护您的个人信息，以及您享有的查阅、复制、更正、删除、撤回同意、注销账号等权利。

请您在使用本软件前仔细阅读并充分理解本隐私政策。

第一条 处理原则与适用范围

1.1 我们遵循合法、正当、必要、诚信、最小够用、公开透明和安全保障原则处理个人信息。
1.2 本政策适用于丸子配音桌面客户端、账号服务、付费服务、云端引擎、字幕与文本辅助功能、客服与安全保障场景。
1.3 对于用户自行配置并调用的第三方服务（例如第三方 LLM API、支付平台、客服工具等），第三方将依据其隐私政策处理相关数据，请您自行审慎阅读并决定是否使用。

第二条 信息收集范围

2.1 账号注册信息
  · 手机号码（用于身份验证与账号找回）
  · 邮箱地址（可选，用于通知推送）
  · 用户昵称和头像（用户自主设置）

2.2 声音数据（敏感个人信息/可能构成生物识别信息）
  · 参考音频：用户上传的用于语音克隆的声音样本
  · 情感参考音频：用户上传的用于情感迁移的声音样本
  · 声纹、音色特征、声音嵌入向量等可能用于识别自然人身份的信息
  · 重要提示：我们将在获取您的单独同意后处理上述敏感个人信息；如您不同意，可不上传参考音频或仅使用不涉及个人声音的预置能力

2.3 生成内容数据
  · 输入文本、生成的音频文件、字幕文件
  · 推理参数配置（引擎选择、采样参数等）
  · 项目名称、角色名称、台词行、时间轴、导出记录和失败日志

2.4 设备与运行信息
  · 操作系统版本、GPU 型号（用于引擎兼容性检测）
  · 应用版本号、设备标识、授权设备数量、崩溃日志（在用户同意或安全保障所必需范围内收集）
  · 网络状态、接口错误码、任务耗时等用于服务稳定性与风控的必要信息

2.5 交易与客服信息
  · 订单号、购买版本、字符包余额、发票信息、退款/补偿记录
  · 客服沟通记录、投诉材料、授权证明和问题排查所需附件

2.6 我们不会主动收集的信息
  · 本软件不内嵌任何第三方数据分析 SDK、广告追踪工具或用户行为分析组件
  · 不收集通讯录、短信、通话记录、位置信息等与功能无关的信息

第三条 信息处理方式

3.1 本地模式（默认）
  · 所有语音合成推理在用户本地设备完成
  · 参考音频、生成音频仅存储在用户设备本地磁盘
  · 不向任何远程服务器传输音频数据

3.2 云端引擎（用户主动选择）
  · 仅在用户主动选择云端引擎并确认生成时启用
  · 为完成本次生成，必要文本与参考音频会通过 HTTPS 加密传输
  · 云端任务按字符计费，生成失败、取消或超时未产出会返还字符
  · 云端临时任务素材仅用于完成本次生成、故障排查和安全审计，不用于训练公共模型，除非另行取得您的明确同意
  · 如您不希望上传素材，可仅使用本地引擎

3.3 LLM 辅助功能（台词拆分、字幕翻译等）
  · 调用用户自行配置的第三方 LLM API（如 DeepSeek 等）
  · 仅传输文本内容，不传输音频数据
  · API 密钥使用 AES-256-GCM 加密存储在本地安全存储中
  · 第三方 API 的内容保存、训练使用、跨境传输和安全责任由对应服务商依据其规则承担

第四条 使用目的与法律依据

4.1 提供核心功能：完成账号登录、授权验证、语音合成、字幕处理、导出文件和项目管理。
4.2 履行合同与计费：处理会员权益、字符扣减、设备授权、订单、发票和售后。
4.3 安全保障：识别异常请求、破解授权、接口滥用、违法违规内容线索和安全事件。
4.4 客服与纠纷处理：定位问题、处理投诉、核验授权和保存必要证据。
4.5 法律法规要求：履行深度合成、生成内容标识、实名、未成年人保护、个人信息保护等合规义务。

第五条 信息存储

5.1 存储位置
  · 所有用户数据存储在用户本地设备上
  · 应用配置文件位于操作系统标准应用数据目录
  · 用户可在"设置 → 存储与缓存"中查看和管理存储
  · 云端引擎临时任务数据存储在中国境内服务器，原则上不进行跨境传输；如后续发生跨境传输，我们将依法履行告知、单独同意、评估或备案等义务

5.2 存储安全
  · 敏感配置（API 密钥等）使用 AES-256-GCM 加密，密钥存储在系统密钥链中
  · 普通配置以 JSON 格式明文存储（不含敏感信息）
  · 传输过程使用 HTTPS/TLS 等加密通道
  · 通过访问控制、最小权限、日志审计和异常监测减少未授权访问风险

5.3 数据保留
  · 用户卸载本软件后，本地数据将随之删除
  · 用户可随时在设置中手动清除缓存和生成数据
  · 账号、订单、发票、风控、投诉和日志类信息按照实现目的所必需的最短期限保存；法律法规另有规定的从其规定
  · 超出保存期限后，我们将删除或匿名化处理相关个人信息

第六条 信息共享、委托处理、转让与公开披露

6.1 我们不会出售您的个人信息。
6.2 为实现支付、发票、短信/邮件通知、云端推理、客服工单、崩溃诊断等功能，可能需要向合作方共享或委托处理必要信息。我们会要求合作方按照本政策、合同约定和法律法规保护数据安全。
6.3 未经您的单独同意，我们不会公开披露您的个人信息；但法律法规、司法机关、行政机关依法要求披露的除外。
6.4 如发生合并、分立、收购、资产转让等情形导致个人信息转移，我们将要求新的持有方继续受本政策约束，并依法告知您。

第七条 信息安全措施
7.1 采用行业标准的加密算法保护数据传输和存储安全
7.2 实施文件系统访问白名单机制，限制软件只能访问必要目录
7.3 对字幕文件读取实施路径白名单校验，防止路径穿越攻击
7.4 定期进行安全审查和漏洞修复
7.5 本软件默认不上传本地素材；使用云端引擎时，以用户主动选择为前提，并在产品界面明确提示
7.6 如发生个人信息安全事件，我们将按照法律法规要求及时通知受影响用户，并采取合理措施降低损害

第八条 用户权利
8.1 知情权：您有权了解本软件如何处理您的个人信息（即本隐私政策）
8.2 决定权：您有权决定是否使用云端引擎、是否上传参考音频
8.3 查阅权：您可随时在应用中查看已存储的个人数据
8.4 复制权：您可导出生成的音频和字幕文件
8.5 更正权：您可修改账号资料、项目资料和配置
8.6 删除权：您可随时删除本地存储的项目、缓存、参考音频和生成文件
8.7 撤回同意权：您可随时切回本地引擎、清除参考音频或关闭非必要功能
8.8 注销权：您可通过客服渠道申请注销账号；注销后我们将停止提供账号服务，并依法删除或匿名化相关个人信息
8.9 如您行使上述权利遇到困难，可通过本政策列明的联系方式联系我们

第九条 未成年人保护
9.1 本软件主要面向成年人和专业内容创作者，不主动向 14 周岁以下的儿童提供服务
9.2 未成年人使用本软件应取得监护人同意并在监护人指导下使用
9.3 如监护人发现未成年人未经同意使用本软件、上传声音或购买付费服务，可联系我们删除相关信息或处理订单问题

第十条 隐私政策更新
10.1 如本隐私政策发生重大变更，我们将在软件内以弹窗、站内通知或其他显著方式通知您
10.2 重大变更包括处理目的变化、处理敏感个人信息范围扩大、共享对象变化、用户权利行使方式重大变化等
10.3 变更后的隐私政策将在通知之日起 7 日后生效；法律法规另有要求的从其要求

第十一条 联系我们
如您对本隐私政策有任何疑问，请通过以下方式联系：
  · 邮箱：support@wzagent.cn
  · 响应时限：15 个工作日`,

    terms: `丸子配音服务条款

生效日期：2024 年 1 月 1 日　　最近更新：2026 年 5 月 1 日

第一条 服务层级

1.1 免费版
  · 提供轻量引擎本地推理
  · 每日免费生成额度：3,000 字符
  · 支持基础字幕识别与 SRT 导出
  · 支持基础语速与拼音标注
  · 导出音频含免费版语音水印

1.2 旗舰版
  · 包含免费版全部功能
  · 一次购买，永久使用
  · 解锁本地情感引擎，本地生成不限字符
  · 解锁多角色配音、批量生成、台词行级编辑
  · 8 维情感向量控制 + 文本情感 + 音频情感三种模式
  · 无水印导出，支持个人商用
  · 可按需购买云端字符包

1.3 创作者年卡
  · 包含旗舰版全部权益
  · 每月赠送云端字符额度
  · 字符包享折扣
  · 优先体验新功能

1.4 团队版
  · 包含旗舰版全部权益
  · 支持 3 台设备起的团队授权
  · 团队商用凭证、发票与优先支持
  · 大额云端字符包阶梯折扣

1.5 版本与权益调整
  · 我们可能基于法律法规、成本、技术能力和产品规划调整功能名称、权益边界、价格或活动规则
  · 对已购买且仍在有效期内的核心权益，我们将尽量保持不低于购买时页面展示的权益；确需调整的，将提前以显著方式通知并提供合理替代方案

第二条 计费规则

2.1 字符计量方式
  · 免费版每日额度按实际输入文本字符数计算
  · 云端引擎按实际输入文本字符数扣减云端字符
  · 中文汉字、英文字母、数字、标点符号各计 1 个字符
  · 空格和换行符不计入字符数
  · 本地轻量引擎和情感引擎在旗舰版内不扣云端字符
  · 生成失败、取消或超时未产出的云端任务自动返还字符

2.2 额度重置
  · 免费版每日额度在次日 00:00（北京时间）重置
  · 创作者年卡赠送的月度云端额度按月重置
  · 单独购买的云端字符包永不过期，可叠加购买

2.3 超额处理
  · 免费版每日额度耗尽后，可次日继续使用或升级旗舰版
  · 云端字符不足时，可购买字符包后继续使用云端引擎
  · 因用户网络中断、关闭软件、删除文件或提供非法/不合规素材导致的生成失败，不当然视为服务故障

第三条 退款政策
3.1 本软件提供的会员权益、字符额度、授权码等属于数字内容或在线服务权益。经用户确认购买并即时交付、激活或开始使用后，原则上不适用七日无理由退货。
3.2 用户在购买前应充分了解功能差异、硬件要求、系统要求、云端计费规则和授权设备限制；购买即视为已知悉并同意购买页面展示的规则。
3.3 以下情形可联系客服申请核查并按实际情况处理：重复扣款、未到账、无法激活且经排查确属我们原因、购买页面权益描述与实际交付严重不一致、法律法规要求退款的其他情形。
3.4 因我们原因导致付费云端服务连续不可用超过 72 小时的，将以等值字符额度、延期、补偿券或法律允许的其他方式处理。
3.5 团队版、定制服务、线下合同订单以双方签署的商务合同约定为准。

第四条 服务可用性

4.1 本地引擎
  · 可用性取决于用户硬件配置（GPU 显存、磁盘空间等）
  · 丸子科技提供引擎兼容性检测，但不对硬件兼容性做绝对保证

4.2 云端引擎
  · 可用性取决于网络环境、账号状态和云端服务负载
  · 丸子科技提供连接检测、余额提示和失败返还机制
  · 云端引擎仅在用户主动选择时使用

4.3 版本更新
  · 丸子科技将持续改进和更新本软件
  · 重大版本更新前将提前通知用户
  · 用户可自主选择是否更新

4.4 服务维护
  · 我们可能因版本升级、安全修复、容量扩容或故障处理进行短时维护
  · 紧急维护可能无法提前通知，但我们会尽量降低影响

第五条 账号、授权与设备限制

5.1 用户不得出租、出借、转售、共享、破解、绕过或转让账号、激活码、设备授权和付费权益。
5.2 同一账号可绑定设备数量以购买页面或团队合同约定为准。异常频繁换绑、批量登录、自动化滥用可能触发风控。
5.3 因用户主动共享账号、泄露激活码或安装破解补丁导致的损失，由用户自行承担。

第六条 违规处理

6.1 违规行为的认定
  · 违反用户协议第三条的任何行为
  · 利用本软件实施电信网络诈骗
  · 未经授权克隆、使用或商用他人声音
  · 删除或规避合成内容标识
  · 恶意攻击或干扰本软件正常运行
  · 破解授权、绕过付费限制、批量薅取免费额度

6.2 处理措施
  · 轻微违规：警示通知、限制部分功能
  · 一般违规：暂停服务 7-30 天
  · 严重违规：永久封禁账号
  · 涉嫌违法犯罪的，将向有关部门报告并配合调查

6.3 已充值费用处理
  · 因违规被暂停服务的，暂停期间额度冻结，解封后恢复
  · 因严重违规被永久封禁的，剩余额度不予退还
  · 法律法规另有规定或监管机关另有要求的，从其规定

第七条 责任限制
7.1 用户应自行对生成内容进行人工审核，并对发布、传播、商用行为承担责任。
7.2 对因不可抗力、第三方服务故障、用户硬件/网络环境、用户配置错误、用户违法违规使用导致的损失，我们在法律允许范围内不承担超出已收取服务费用的责任。
7.3 本条不排除或限制法律规定不得排除或限制的责任。

第八条 争议解决
8.1 本服务条款适用中华人民共和国法律（不包括港澳台地区法律）
8.2 如有争议，双方应优先协商解决
8.3 协商不成的，任一方可向丸子科技住所地有管辖权的人民法院提起诉讼`,
  };
</script>

<div class="about-page">
  <div class="brand-wrap">
    <div class="brand-logo">
      <Logo size={88} color="var(--color-primary)" />
    </div>
    <h1 class="brand-title">丸子配音 V3</h1>
    <p class="brand-sub">专业 AI 配音与音频创作平台</p>
    <div class="brand-meta">
      <span class="meta-version">版本 {version}（Build {build}）</span>
      <span class="dot-sep">·</span>
      <button class="meta-link" onclick={handleCheckUpdate}>检查更新</button>
      <span class="dot-sep">·</span>
      <button class="meta-link" onclick={() => toast.info('更新日志开发中')}>更新日志</button>
    </div>
  </div>

  <div class="info-grid">
    <article class="card">
      <header class="card-head">
        <h2 class="card-title">授权信息</h2>
        <button class="card-extra" onclick={() => toast.info('授权管理开发中')}>
          管理授权 <Icon name="right" size={10} color="currentColor" />
        </button>
      </header>
      <div class="card-body">
        <dl class="kv">
          <div class="kv-row"><dt>授权类型</dt><dd><span class="badge-pro">{license.type}</span></dd></div>
          <div class="kv-row"><dt>授权账号</dt><dd>{license.account}</dd></div>
          <div class="kv-row"><dt>激活码</dt><dd class="mono">{license.key} <button class="icon-btn" onclick={() => toast.success('已复制激活码')}><Icon name="copy" size={12} color="var(--color-text-tertiary)" /></button></dd></div>
          <div class="kv-row"><dt>授权状态</dt><dd><span class="badge-active">{license.state}</span></dd></div>
          <div class="kv-row"><dt>到期时间</dt><dd>{license.expire}<span class="kv-extra">还剩 {license.days} 天</span></dd></div>
          <div class="kv-row"><dt>已激活设备</dt><dd>{license.devices}</dd></div>
        </dl>
        <div class="card-actions">
          <button class="btn-secondary" onclick={() => toast.info('授权管理开发中')}>管理授权</button>
          <button class="btn-primary" onclick={() => toast.info('团队版咨询请联系客服')}>
            <Icon name="crown" size={14} color="#fff" />
            <span>升级至团队版</span>
          </button>
        </div>
      </div>
    </article>

    <article class="card">
      <header class="card-head">
        <h2 class="card-title">软件信息</h2>
      </header>
      <div class="card-body">
        <dl class="kv">
          <div class="kv-row"><dt>核心引擎</dt><dd>轻量引擎 · 情感引擎 · 云端引擎</dd></div>
          <div class="kv-row"><dt>构建时间</dt><dd>{build.slice(0,4)}-{build.slice(4,6)}-{build.slice(6,8)} 14:30</dd></div>
          <div class="kv-row"><dt>应用大小</dt><dd>284 MB</dd></div>
          <div class="kv-row"><dt>安装路径</dt><dd class="mono ellipsis">{installPath}</dd></div>
          <div class="kv-row"><dt>数据目录</dt><dd class="mono ellipsis">{dataDir}</dd></div>
        </dl>
        <div class="card-actions">
          <button class="btn-secondary" onclick={() => toast.info('打开数据目录开发中')}>
            <Icon name="folder-open" size={14} color="currentColor" />
            <span>打开数据目录</span>
          </button>
          <button class="btn-secondary" onclick={() => toast.info('诊断日志导出开发中')}>
            <Icon name="export" size={14} color="currentColor" />
            <span>导出诊断日志</span>
          </button>
        </div>
      </div>
    </article>
  </div>

  <footer class="about-foot">
    <span>© 2024 - 2026 MaruVoice. All rights reserved.</span>
    <div class="foot-links">
      <button class="foot-link" onclick={() => openLegal('agreement')}>用户协议</button>
      <button class="foot-link" onclick={() => openLegal('privacy')}>隐私政策</button>
      <button class="foot-link" onclick={() => openLegal('terms')}>服务条款</button>
    </div>
  </footer>
</div>

<Modal open={legalOpen} title={legalModal ? LEGAL_TITLES[legalModal] : ''} size="lg" onClose={closeLegal}>
  {#if legalModal}
    <div class="legal-scroll" aria-label={`${LEGAL_TITLES[legalModal]}正文`}>
      <pre class="legal-text">{LEGAL_CONTENT[legalModal]}</pre>
    </div>
  {/if}
  {#snippet footer()}
    <Button variant="primary" onclick={closeLegal}>我已知晓</Button>
  {/snippet}
</Modal>

<style>
  .about-page {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
    background-color: var(--color-bg-container);
  }

  .brand-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-xl) 0;
  }
  .brand-logo {
    width: 96px; height: 96px;
    border-radius: 24px;
    background-color: color-mix(in srgb, var(--color-primary) 14%, transparent);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 32px color-mix(in srgb, var(--color-primary) 22%, transparent);
  }
  .brand-title {
    margin: var(--spacing-sm) 0 0;
    font-size: 36px;
    font-weight: 700;
    color: var(--color-text);
    letter-spacing: 0.4px;
  }
  .brand-sub {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size);
  }
  .brand-meta {
    display: flex; align-items: center; gap: 6px;
    color: var(--color-text-tertiary);
    font-size: var(--font-size-sm);
    margin-top: var(--spacing-xs);
  }
  .meta-version { color: var(--color-text-tertiary); }
  .meta-link {
    background: transparent; border: none; cursor: pointer;
    color: var(--color-primary); font-size: var(--font-size-sm); padding: 2px 4px;
  }
  .meta-link:hover { text-decoration: underline; }
  .dot-sep { color: var(--color-text-quaternary); }

  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-lg);
    max-width: 960px;
    width: 100%;
    align-self: center;
  }

  .card {
    background-color: var(--color-bg-elevated);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-lg);
    overflow: hidden;
  }
  .card-head {
    height: 44px;
    padding: 0 var(--spacing-lg);
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--color-border-secondary);
  }
  .card-title { margin: 0; color: var(--color-text); font-size: var(--font-size); font-weight: 500; }
  .card-extra {
    background: transparent; border: none; cursor: pointer;
    color: var(--color-primary); font-size: var(--font-size-sm);
    display: inline-flex; align-items: center; gap: 4px; padding: 4px 6px;
    border-radius: var(--border-radius-sm);
  }
  .card-extra:hover { background-color: var(--color-bg-spotlight); }
  .card-body { padding: var(--spacing-lg); }

  .kv { margin: 0; display: flex; flex-direction: column; gap: 12px; }
  .kv-row {
    display: grid;
    grid-template-columns: 96px 1fr;
    gap: var(--spacing-md);
    font-size: var(--font-size-sm);
  }
  .kv-row dt { color: var(--color-text-tertiary); margin: 0; }
  .kv-row dd { margin: 0; color: var(--color-text); display: flex; align-items: center; gap: 8px; min-width: 0; }
  .mono { font-family: ui-monospace, Menlo, Consolas, monospace; }
  .ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .kv-extra { color: var(--color-primary); font-size: 11px; margin-left: 4px; }

  .badge-pro {
    background: linear-gradient(135deg, #d4a44a, #b8862c);
    color: #1a1a1a;
    padding: 2px 8px;
    border-radius: var(--border-radius-sm);
    font-size: 11px;
    font-weight: 600;
  }
  .badge-active {
    background: color-mix(in srgb, var(--color-success) 18%, transparent);
    color: var(--color-success);
    padding: 2px 8px;
    border-radius: var(--border-radius-sm);
    font-size: 11px;
  }

  .icon-btn {
    background: transparent; border: none; cursor: pointer; padding: 2px 4px;
    border-radius: var(--border-radius-sm);
  }
  .icon-btn:hover { background-color: var(--color-bg-spotlight); }

  .card-actions {
    display: flex; gap: var(--spacing-sm);
    margin-top: var(--spacing-md);
    justify-content: flex-end;
  }
  .btn-primary, .btn-secondary {
    display: inline-flex; align-items: center; gap: 6px;
    height: 32px; padding: 0 var(--spacing-md);
    font-size: var(--font-size-sm);
    border-radius: var(--border-radius);
    cursor: pointer; border: none;
    transition: background-color var(--transition-duration) var(--transition-timing), border-color var(--transition-duration) var(--transition-timing), color var(--transition-duration) var(--transition-timing);
  }
  .btn-primary { background-color: var(--color-primary); color: #fff; }
  .btn-primary:hover { background-color: var(--color-primary-hover); }
  .btn-secondary { background-color: transparent; color: var(--color-text-secondary); border: 1px solid var(--color-border-secondary); }
  .btn-secondary:hover { border-color: var(--color-primary); color: var(--color-text); }

  .about-foot {
    max-width: 960px;
    width: 100%;
    align-self: center;
    margin-top: var(--spacing-md);
    padding-top: var(--spacing-md);
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--color-text-tertiary);
    font-size: 11px;
  }
  .foot-links { display: flex; gap: var(--spacing-md); }
  .foot-link {
    background: transparent;
    border: none;
    color: var(--color-text-tertiary);
    font-size: 11px;
    cursor: pointer;
    padding: 2px 4px;
  }
  .foot-link:hover {
    color: var(--color-primary);
    text-decoration: underline;
  }

  .legal-scroll {
    max-height: min(62vh, 560px);
    overflow-y: auto;
    padding: var(--spacing-md);
    background: var(--color-bg-base);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
    scrollbar-width: thin;
    scrollbar-color: var(--color-border) transparent;
  }

  .legal-scroll:focus-visible {
    outline: 1px solid var(--color-primary);
    outline-offset: 2px;
  }

  .legal-scroll::-webkit-scrollbar {
    width: 8px;
  }

  .legal-scroll::-webkit-scrollbar-track {
    background: transparent;
  }

  .legal-scroll::-webkit-scrollbar-thumb {
    background-color: var(--color-border);
    border-radius: var(--border-radius-pill);
  }

  .legal-text {
    margin: 0;
    font-size: var(--font-size-sm);
    line-height: 1.8;
    color: var(--color-text-secondary);
    white-space: pre-wrap;
    word-break: break-word;
    overflow-wrap: anywhere;
    font-family: inherit;
  }
</style>
