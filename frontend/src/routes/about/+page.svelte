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
    type: '专业版',
    account: 'user***@example.com',
    key: 'MARU-****-****-Q8K3',
    state: '已激活',
    expire: '2026-12-31',
    days: 218,
    devices: '2 / 5',
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

重要提示：本协议是您（以下简称"用户"）与丸子科技之间关于使用丸子配音软件（以下简称"本软件"）的法律协议。请您在使用本软件前仔细阅读本协议全部内容，尤其是加粗或下划线标注的条款。如您不同意本协议任何内容，请立即停止使用本软件。

第一条 服务说明
1.1 本软件是一款基于深度合成技术的专业 AI 配音与音频创作工具，提供语音合成、情感控制、字幕生成、音频编辑等功能。
1.2 本软件属于《互联网信息服务深度合成管理规定》所称的深度合成服务，涉及语音生成、仿声等深度合成技术。
1.3 本软件提供本地推理（数据不离开用户设备）和云端推理（数据传输到用户自有远程实例）两种模式。

第二条 用户注册与身份认证
2.1 用户在使用本软件部分功能前，应当按照真实身份信息认证的要求完成账号注册。
2.2 用户应保证注册信息的真实性、准确性和完整性，如信息发生变更应及时更新。
2.3 未满 18 周岁的未成年人应在监护人的同意和指导下使用本软件。

第三条 语音克隆免责与用户责任

重要声明：本软件仅为用户提供语音合成技术工具，不对用户使用本工具产生的任何后果承担责任。软件不涉及要求用户提供授权，软件只是提供服务的工具，语音克隆造成的侵权行为应该用户自行承担。

3.1 工具属性声明
  （一）本软件是一款中立的技术工具，不主动收集、存储或验证用户上传的参考音频的来源和授权情况。
  （二）本软件不对用户上传的声音样本是否取得合法授权进行审核，相关法律责任由用户自行承担。
  （三）丸子科技不参与、不知情用户使用本软件生成内容的具体用途。

3.2 用户自行承担的责任
  （一）用户使用本软件克隆他人声音所产生的一切法律后果（包括但不限于民事侵权、行政处罚、刑事责任），均由用户自行承担，与丸子科技无关。
  （二）根据《中华人民共和国民法典》第一千零二十三条，声音的保护参照肖像权的有关规定。用户应自行了解并遵守相关法律法规。
  （三）因用户使用本软件生成的内容引发的任何第三方索赔、诉讼或监管处罚，用户应独立应对并承担全部费用，如因此给丸子科技造成损失的，用户应予以赔偿。

3.3 风险提示（仅为善意提醒，不构成法律建议）
  （一）使用他人声音进行克隆前，建议获得声音权利人的明确同意；
  （二）使用克隆声音冒充他人身份可能构成诈骗等违法犯罪行为，违反《中华人民共和国反电信网络诈骗法》等法律法规；
  （三）制作传播虚假音视频可能违反《互联网信息服务深度合成管理规定》及《互联网信息服务算法推荐管理规定》；
  （四）未经授权将他人声音用于商业用途可能构成民事侵权；
  （五）将 AI 生成的语音用于金融、医疗、新闻等对真实性有特殊要求的场景，可能涉及行业监管风险。

第四条 其他用户行为规范
4.1 用户不得利用本软件从事以下行为：
  （一）生成、传播危害国家安全、损害国家荣誉和利益的内容；
  （二）生成、传播煽动颠覆国家政权、推翻社会主义制度的内容；
  （三）生成、传播编造虚假信息、散布谣言、扰乱社会秩序的内容；
  （四）生成、传播淫秽色情、暴力恐怖、赌博等违法违规内容；
  （五）法律法规、部门规章及本协议禁止的其他行为。
4.2 用户使用本软件生成的合成内容在对外传播时，应当按照《人工智能生成合成内容标识办法》的要求进行标识。

第五条 深度合成内容标识
5.1 本软件生成的语音内容属于深度合成内容，用户在传播使用时应主动声明其为 AI 生成内容。
5.2 本软件将在生成的音频文件元数据中嵌入隐式标识，包含生成合成属性信息和内容编号。
5.3 用户不得恶意删除、篡改、伪造或隐匿本软件添加的生成合成内容标识。

第六条 知识产权
6.1 本软件的代码、UI 设计、模型权重、文档等知识产权归丸子科技所有。
6.2 用户使用本软件生成的音频内容，在不侵犯第三方权利的前提下，其知识产权归用户所有。
6.3 软件内置的预置样音仅供个人学习和功能评估使用，商业用途需获得单独授权。

第七条 数据安全与个人信息保护
7.1 本软件的数据处理活动遵循《中华人民共和国数据安全法》和《中华人民共和国个人信息保护法》的相关规定。
7.2 涉及用户声音等生物识别信息的处理，本软件将依法获取用户的单独同意。
7.3 具体数据处理规则详见《丸子配音隐私政策》。

第八条 免责声明
8.1 AI 生成的语音可能与真实人声存在差异，本软件不对生成质量做绝对保证。
8.2 因不可抗力（包括但不限于自然灾害、政府行为、网络攻击、电力中断等）导致的服务中断，丸子科技不承担赔偿责任。
8.3 因用户违反本协议使用本软件造成的任何损失（包括但不限于因语音克隆侵权导致的赔偿），由用户自行承担。
8.4 用户使用第三方 LLM API 进行台词拆分、字幕翻译等辅助功能时，相关数据由第三方服务商处理，丸子科技不对第三方服务的可用性、安全性及数据处理行为承担责任。
8.5 用户配置的云端推理实例由用户自行运维，丸子科技不对远程实例的安全性、稳定性及数据处理行为承担任何责任。

第九条 违规处理
9.1 丸子科技有权对违反本协议的用户采取警示、限制功能、暂停服务、关闭账号等处置措施。
9.2 因用户违法违规行为受到行政处罚或司法追究的，丸子科技有权配合相关部门提供必要信息。

第十条 投诉与申诉
10.1 用户对本软件的服务有异议的，可通过 support@maruvoice.com 进行投诉。
10.2 丸子科技将在收到投诉后 15 个工作日内予以回复。
10.3 如您发现他人未经授权使用您的声音进行克隆，可通过上述渠道举报，我们将在核实后采取处置措施。

第十一条 协议变更与终止
11.1 丸子科技有权根据法律法规变化或业务需要修改本协议，修改后将在软件内以弹窗方式通知用户。
11.2 用户继续使用本软件即视为接受修改后的协议。

第十二条 法律适用与争议解决
12.1 本协议的订立、履行、解释及争议解决均适用中华人民共和国法律（不包括港澳台地区法律）。
12.2 因本协议引发的争议，双方应友好协商解决；协商不成的，任一方可向丸子科技住所地有管辖权的人民法院提起诉讼。`,

    privacy: `丸子配音隐私政策

生效日期：2024 年 1 月 1 日　　最近更新：2026 年 5 月 1 日

丸子科技深知个人信息对您的重要性，并将竭力保护您的个人信息安全。本隐私政策旨在向您说明我们如何收集、使用、存储和保护您的个人信息，以及您享有的相关权利。

请您在使用本软件前仔细阅读并充分理解本隐私政策。

第一条 信息收集范围

1.1 账号注册信息
  · 手机号码（用于身份验证与账号找回）
  · 邮箱地址（可选，用于通知推送）
  · 用户昵称和头像（用户自主设置）

1.2 声音数据（生物识别信息 — 敏感个人信息）
  · 参考音频：用户上传的用于语音克隆的声音样本
  · 情感参考音频：用户上传的用于情感迁移的声音样本
  · 重要提示：声音属于生物识别信息，我们将在获取您的单独同意后进行处理

1.3 生成内容数据
  · 输入文本、生成的音频文件、字幕文件
  · 推理参数配置（引擎选择、采样参数等）

1.4 设备与运行信息
  · 操作系统版本、GPU 型号（用于引擎兼容性检测）
  · 应用版本号和崩溃日志（在用户同意的前提下收集）

1.5 我们不会收集的信息
  · 本软件不内嵌任何第三方数据分析 SDK、广告追踪工具或用户行为分析组件
  · 不收集通讯录、短信、通话记录、位置信息等与功能无关的信息

第二条 信息处理方式

2.1 本地模式（默认）
  · 所有语音合成推理在用户本地设备完成
  · 参考音频、生成音频仅存储在用户设备本地磁盘
  · 不向任何远程服务器传输音频数据

2.2 云端模式（用户主动配置）
  · 仅在用户配置了远程推理实例后启用
  · 参考音频通过 Base64 编码传输到用户自有的远程实例
  · 传输使用 HTTPS 加密，数据在推理完成后不在远程端持久存储
  · 远程实例由用户自行管理，丸子科技不接触用户的云端数据

2.3 LLM 辅助功能（台词拆分、字幕翻译等）
  · 调用用户自行配置的第三方 LLM API（如 DeepSeek 等）
  · 仅传输文本内容，不传输音频数据
  · API 密钥使用 AES-256-GCM 加密存储在本地安全存储中

第三条 信息存储

3.1 存储位置
  · 所有用户数据存储在用户本地设备上
  · 应用配置文件位于操作系统标准应用数据目录
  · 用户可在"设置 → 存储与缓存"中查看和管理存储

3.2 存储安全
  · 敏感配置（API 密钥等）使用 AES-256-GCM 加密，密钥存储在系统密钥链中
  · 普通配置以 JSON 格式明文存储（不含敏感信息）

3.3 数据保留
  · 用户卸载本软件后，本地数据将随之删除
  · 用户可随时在设置中手动清除缓存和生成数据

第四条 信息安全措施
4.1 采用行业标准的加密算法保护数据传输和存储安全
4.2 实施文件系统访问白名单机制（fs:scope），限制软件只能访问必要的目录
4.3 对字幕文件读取实施路径白名单校验，防止路径穿越攻击
4.4 定期进行安全审查和漏洞修复
4.5 本软件不进行跨境数据传输。用户自行配置的云端推理实例如部署在境外，产生的跨境数据流动由用户自行承担合规责任
4.6 如发生个人信息安全事件，我们将按照法律法规要求及时通知受影响用户，并采取合理措施降低损害

第五条 用户权利
5.1 知情权：您有权了解本软件如何处理您的个人信息（即本隐私政策）
5.2 决定权：您有权决定是否使用云端模式、是否上传参考音频
5.3 查阅权：您可随时在应用中查看已存储的个人数据
5.4 复制权：您可导出生成的音频和字幕文件
5.5 删除权：您可随时删除本地存储的所有数据
5.6 撤回同意权：您可随时关闭云端模式或清除参考音频

第六条 未成年人保护
6.1 本软件不主动向 14 周岁以下的未成年人提供服务
6.2 如监护人发现未成年人未经同意使用本软件，可联系我们删除相关信息

第七条 隐私政策更新
7.1 如本隐私政策发生重大变更，我们将在软件内以弹窗形式通知您
7.2 变更后的隐私政策将在通知之日起 7 日后生效

第八条 联系我们
如您对本隐私政策有任何疑问，请通过以下方式联系：
  · 邮箱：support@maruvoice.com
  · 响应时限：15 个工作日`,

    terms: `丸子配音服务条款

生效日期：2024 年 1 月 1 日　　最近更新：2026 年 5 月 1 日

第一条 服务层级

1.1 免费版
  · 提供轻量引擎本地推理
  · 月度字符额度：50 万字符
  · 支持字幕生成
  · 基础采样参数调节

1.2 PRO 专业版
  · 包含免费版全部功能
  · 解锁情感引擎本地推理 + 云端引擎
  · 月度字符额度：200 万字符
  · 8 维情感向量控制 + 文本情感 + 音频情感三种模式
  · 高速生成队列
  · 专属客服通道

1.3 企业版
  · 包含 PRO 版全部功能
  · 不限字符额度
  · 支持私有化部署和 API 接口
  · 自定义模型微调（需额外协议）
  · 专属技术支持和 SLA 保障

第二条 计费规则

2.1 字符计量方式
  · 按实际合成的文本字符数计算
  · 中文汉字、英文字母、数字、标点符号各计 1 个字符
  · 空格和换行符不计入字符数
  · 合成失败的请求不计入使用量

2.2 额度重置
  · 月度额度在每自然月 1 日 00:00（北京时间）自动重置
  · 当月未使用额度不累积到下月
  · 额度用尽后本月不可继续合成，下月自动恢复

2.3 超额处理
  · 免费版额度耗尽后将暂停合成功能
  · PRO 版可购买额外字符包

第三条 退款政策
3.1 本软件提供的字符额度、会员权益等属于在线交付的虚拟商品/数字内容，根据《中华人民共和国消费者权益保护法》第二十五条，经用户确认购买且即时交付后，不适用七日无理由退货，不支持退款。
3.2 用户在购买前应充分了解各版本功能差异，确认后再行购买。购买即视为已知悉并同意本条款。
3.3 因丸子科技原因导致服务无法使用超过连续 72 小时的，将以等值字符额度补偿方式处理。
3.4 企业版以双方签署的商务合同约定为准。

第四条 服务可用性

4.1 本地引擎
  · 可用性取决于用户硬件配置（GPU 显存、磁盘空间等）
  · 丸子科技提供引擎兼容性检测，但不对硬件兼容性做绝对保证

4.2 云端引擎
  · 可用性取决于用户配置的远程实例运行状态
  · 丸子科技提供连接检测和健康检查功能
  · 远程实例的运维由用户自行负责

4.3 版本更新
  · 丸子科技将持续改进和更新本软件
  · 重大版本更新前将提前通知用户
  · 用户可自主选择是否更新

第五条 违规处理

5.1 违规行为的认定
  · 违反用户协议第三条的任何行为
  · 利用本软件实施电信网络诈骗
  · 恶意攻击或干扰本软件正常运行

5.2 处理措施
  · 轻微违规：警示通知、限制部分功能
  · 一般违规：暂停服务 7-30 天
  · 严重违规：永久封禁账号
  · 涉嫌违法犯罪的，将向有关部门报告并配合调查

5.3 已充值费用处理
  · 因违规被暂停服务的，暂停期间额度冻结，解封后恢复
  · 因严重违规被永久封禁的，剩余额度不予退还

第六条 争议解决
6.1 本服务条款适用中华人民共和国法律
6.2 如有争议，双方应优先协商解决
6.3 协商不成的，任一方可向丸子科技住所地有管辖权的人民法院提起诉讼`,
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
          <button class="btn-primary" onclick={() => toast.info('企业版咨询请联系客服')}>
            <Icon name="crown" size={14} color="#fff" />
            <span>升级至企业版</span>
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
    <pre class="legal-text">{LEGAL_CONTENT[legalModal]}</pre>
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
    padding: var(--spacing-xl) var(--spacing-xl) var(--spacing-lg);
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

  .legal-text {
    margin: 0;
    padding: var(--spacing-md);
    font-size: var(--font-size-sm);
    line-height: 1.8;
    color: var(--color-text-secondary);
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 420px;
    overflow-y: auto;
    background: var(--color-bg-base);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
  }
</style>
