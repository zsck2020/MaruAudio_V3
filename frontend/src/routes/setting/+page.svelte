<script lang="ts">
  import { untrack } from 'svelte';
  import Icon from '$lib/icons/Icon.svelte';
  import Switch from '$lib/components/ui/Switch.svelte';
  import Slider from '$lib/components/ui/Slider.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import * as ttsApi from '$lib/api/tts';
  import { dubbing, type EngineMode } from '$lib/stores/dubbing.svelte';
  import { appSettings } from '$lib/stores/settings.svelte';
  import { listLlmModels } from '$lib/api/tts';
  import Modal from '$lib/components/ui/Modal.svelte';
  import { membership } from '$lib/stores/membership.svelte';
  import PermissionBadge from '$lib/components/membership/PermissionBadge.svelte';
  import { requestEngineChange } from '$lib/utils/entitlements';

  type SectionKey =
    | 'general'
    | 'engine'
    | 'cloud'
    | 'audio'
    | 'subtitle'
    | 'security'
    | 'shortcut'
    | 'storage'
    | 'advanced';

  interface SectionItem {
    key: SectionKey;
    icon: string;
    label: string;
  }

  const sections: SectionItem[] = [
    { key: 'general', icon: 'setting', label: '基础设置' },
    { key: 'engine', icon: 'thunderbolt', label: '引擎设置' },
    { key: 'cloud', icon: 'cloud', label: '云端账号' },
    { key: 'audio', icon: 'sound', label: '音频设置' },
    { key: 'subtitle', icon: 'file-text', label: '字幕设置' },
    { key: 'security', icon: 'safety', label: '安全设置' },
    { key: 'shortcut', icon: 'control', label: '快捷键' },
    { key: 'storage', icon: 'hdd', label: '存储与缓存' },
    { key: 'advanced', icon: 'experiment', label: '高级设置' },
  ];

  let active = $state<SectionKey>('general');
  let search = $state('');

  let activeLabel = $derived(sections.find((s) => s.key === active)?.label ?? '');

  function openSection(key: SectionKey) {
    active = key;
  }

  // ---- 基础设置 ----
  let launchAtStartup = $state(false);
  let minimizeToTray = $state(true);
  let closeToTray = $state(true);
  let language = $state('zh-CN');
  let theme = $state<'dark' | 'light' | 'auto'>('dark');
  let autoCheckUpdate = $state(true);

  // ---- 引擎设置（直接集成，无外部壳层路径） ----
  let lightweightStatus = $state<{ available: boolean; message: string; device?: string }>({
    available: false,
    message: '未检测',
    device: undefined,
  });
  let emotionStatus = $state<{ available: boolean; message: string; device?: string }>({
    available: false,
    message: '未检测',
    device: undefined,
  });
  let cloudLoggedIn = $derived(membership.isPaid);
  let llmModels = $state<string[]>([]);
  let llmDetecting = $state(false);

  async function handleDetectModels() {
    const { apiBaseUrl, apiKey } = appSettings.settings.llm;
    if (!apiKey) { toast.warning('请先输入 API Key'); return; }
    llmDetecting = true;
    try {
      const result = await listLlmModels(apiBaseUrl, apiKey);
      llmModels = result.models;
      if (result.count > 0) {
        toast.success(`检测到 ${result.count} 个模型`);
        if (!appSettings.settings.llm.model || !result.models.includes(appSettings.settings.llm.model)) {
          void appSettings.saveLlm({ model: result.models[0] });
        }
      } else {
        toast.info('未检测到可用模型');
      }
    } catch (err) {
      toast.warning(`检测失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      llmDetecting = false;
    }
  }
  let device = $state<'auto' | 'gpu' | 'cpu'>(appSettings.settings.dubbing.device);
  let vramLimit = $state(appSettings.settings.dubbing.vramLimit);
  let parallelTasks = $state(appSettings.settings.dubbing.parallelTasks);
  let halfPrecision = $state(appSettings.settings.dubbing.halfPrecision);
  let preferEngine = $state<EngineMode>(appSettings.settings.dubbing.engineMode);

  let detecting = $state(false);

  $effect(() => {
    if (active === 'engine' && !detecting && lightweightStatus.message === '未检测') {
      void detectEngines();
    }
  });

  function selectPreferEngine(mode: EngineMode) {
    if (!requestEngineChange(mode)) return;
    preferEngine = mode;
    toast.success(`已切换默认推理引擎：${mode === 'lightweight' ? '轻量' : mode === 'emotion' ? '情感' : '云端'}`);
  }

  function syncCloudAvailability(available: boolean, message: string) {
    const currentCloud = untrack(() => dubbing.engineAvailable.cloud);
    if (currentCloud.available === available && currentCloud.message === message) return;

    const currentAvailability = untrack(() => dubbing.engineAvailable);
    dubbing.engineAvailable = {
      ...currentAvailability,
      cloud: { available, message },
    };
  }

  $effect(() => {
    syncCloudAvailability(membership.isPaid, membership.isPaid ? '云端权益已解锁' : '云端引擎未解锁');
  });

  // ---- 音频 ----
  let outputFormat = $state<'wav' | 'mp3' | 'flac'>('wav');
  let outputSampleRate = $state(24000);
  let normalizeLoudness = $state(true);
  let trimSilence = $state(false);
  let defaultIntervalSilence = $state(appSettings.settings.dubbing.intervalSilence);

  // ---- 字幕 ----
  let subtitleFormat = $state<'srt' | 'vtt' | 'ass'>('srt');
  let subtitleEncoding = $state<'utf-8' | 'utf-8-bom' | 'gbk'>('utf-8');
  let subtitleEol = $state<'lf' | 'crlf'>('crlf');
  let speakerInSubtitle = $state(false);

  // ---- 安全 ----
  let requirePassword = $state(false);
  let lockOnIdle = $state(false);
  let idleMinutes = $state(15);
  let allowTelemetry = $state(true);

  // ---- 存储 ----
  let cacheSizeGB = $state(12.4);
  let modelCacheGB = $state(8.6);
  let outputSizeGB = $state(45.2);
  let cacheLifecycle = $state<'7' | '30' | '90' | 'forever'>('30');

  // ---- 高级 ----
  let devLog = $state(false);
  let experimentalFeatures = $state(false);

  async function detectEngines() {
    detecting = true;
    try {
      const health = await ttsApi.checkHealth();
      for (const eng of health.engines) {
        if (eng.engine === 'lightweight') {
          lightweightStatus = {
            available: eng.available,
            message: eng.message,
            device: eng.device ?? undefined,
          };
        } else if (eng.engine === 'emotion') {
          emotionStatus = {
            available: eng.available,
            message: eng.message,
            device: eng.device ?? undefined,
          };
        }
      }
      dubbing.engineAvailable = {
        ...dubbing.engineAvailable,
        lightweight: { available: lightweightStatus.available, message: lightweightStatus.available ? '轻量引擎可用' : lightweightStatus.message },
        emotion: { available: emotionStatus.available, message: emotionStatus.available ? '情感引擎可用' : emotionStatus.message },
      };
      toast.success('引擎状态已刷新');
    } catch {
      lightweightStatus = { available: false, message: '本地推理服务未启动' };
      emotionStatus = { available: false, message: '本地推理服务未启动' };
      dubbing.engineAvailable = {
        ...dubbing.engineAvailable,
        lightweight: { available: false, message: 'TTS 服务未启动' },
        emotion: { available: false, message: 'TTS 服务未启动' },
      };
      toast.warning('未检测到本地推理服务');
    } finally {
      detecting = false;
    }
  }

  async function handleSave() {
    try {
      await appSettings.saveDubbing({
        engineMode: preferEngine,
        device,
        vramLimit,
        parallelTasks,
        halfPrecision,
        intervalSilence: defaultIntervalSilence,
      });
      dubbing.intervalSilence = defaultIntervalSilence;
      toast.success('设置已保存');
    } catch (err) {
      toast.warning(`保存失败：${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function handleReset() {
    try {
      await appSettings.reset();
      const d = appSettings.settings.dubbing;
      preferEngine = d.engineMode;
      device = d.device;
      vramLimit = d.vramLimit;
      parallelTasks = d.parallelTasks;
      halfPrecision = d.halfPrecision;
      dubbing.setEngine(d.engineMode);
      toast.info('已恢复为推荐默认值');
    } catch (err) {
      toast.warning(`恢复失败：${err instanceof Error ? err.message : String(err)}`);
    }
  }

  function handleClearCache() {
    cacheSizeGB = 0;
    toast.success('缓存已清空');
  }
</script>

<div class="settings-page">
  <div class="settings-body">
    <aside class="settings-rail">
      <div class="rail-head">
        <Icon name="setting" size={16} color="var(--color-primary)" />
        <span>设置</span>
      </div>
      {#each sections as section (section.key)}
        <button
          type="button"
          class="rail-item"
          class:active={active === section.key}
          onclick={() => openSection(section.key)}
        >
          <Icon
            name={section.icon}
            size={16}
            color={active === section.key ? 'var(--color-primary)' : 'var(--color-text-tertiary)'}
          />
          <span>{section.label}</span>
        </button>
      {/each}
      <div class="rail-foot">
        <button type="button" class="rail-action" onclick={handleReset}>
          <Icon name="refresh" size={12} color="currentColor" />
          <span>恢复默认值</span>
        </button>
      </div>
    </aside>

    <section class="settings-content">
      <header class="content-head">
        <h2>{activeLabel}</h2>
        <div class="head-actions">
          <button type="button" class="btn-save" onclick={handleSave}>
            <Icon name="save" size={14} color="currentColor" />
            <span>保存设置</span>
          </button>
        </div>
      </header>

      <div class="content-body">
        {#if active === 'general'}
          <div class="section-body">
            <div class="row">
              <div class="row-label">界面语言</div>
              <Select
                bind:value={language}
                ariaLabel="界面语言"
                options={[
                  { value: 'zh-CN', label: '简体中文' },
                  { value: 'zh-TW', label: '繁體中文' },
                  { value: 'en-US', label: 'English' },
                ]}
              />
            </div>
            <div class="row">
              <div class="row-label">外观主题</div>
              <div class="seg">
                <button class:active={theme === 'dark'} onclick={() => (theme = 'dark')}>暗色</button>
                <button class:active={theme === 'light'} onclick={() => (theme = 'light')}>浅色</button>
                <button class:active={theme === 'auto'} onclick={() => (theme = 'auto')}>跟随系统</button>
              </div>
            </div>
            <div class="row">
              <div class="row-label">开机自启动</div>
              <Switch bind:checked={launchAtStartup} size="sm" />
            </div>
            <div class="row">
              <div class="row-label">最小化到托盘</div>
              <Switch bind:checked={minimizeToTray} size="sm" />
            </div>
            <div class="row">
              <div class="row-label">关闭主窗口时收起到托盘</div>
              <Switch bind:checked={closeToTray} size="sm" />
            </div>
            <div class="row">
              <div class="row-label">启动时检查更新</div>
              <Switch bind:checked={autoCheckUpdate} size="sm" />
            </div>
          </div>
        {/if}

        {#if active === 'engine'}
          <div class="section-body">
            <div class="inline-head">
              <span>本地推理引擎</span>
              <button type="button" class="link" onclick={detectEngines} disabled={detecting}>
                <Icon name="sync" size={12} color="var(--color-primary)" />
                <span>{detecting ? '检测中…' : '检测可用性'}</span>
              </button>
            </div>
            <p class="card-hint">轻量引擎与情感引擎已内置于客户端，无需手动配置模型路径。首次使用情感引擎可能需要下载附加权重，下载完成后会自动加载。</p>

            <div class="engine-row">
              <div class="engine-meta">
                <div class="engine-name">
                  <Icon name="thunderbolt" size={14} color="var(--color-primary)" />
                  <span>轻量引擎</span>
                </div>
                <div class="engine-sub">本地推理 · 速度优先 · 适合短文本与批量生成</div>
              </div>
              <div class="engine-status">
                <span class="dot" class:on={lightweightStatus.available}></span>
                <span>{lightweightStatus.available ? '可用' : lightweightStatus.message}</span>
                {#if lightweightStatus.device}<span class="device-tag">{lightweightStatus.device}</span>{/if}
              </div>
            </div>

            <div class="engine-row">
              <div class="engine-meta">
                <div class="engine-name">
                  <Icon name="experiment" size={14} color="var(--color-primary)" />
                  <span>情感引擎</span>
                </div>
                <div class="engine-sub">本地推理 · 情感表达丰富 · 支持向量/文本/音频三种情感控制</div>
              </div>
              <div class="engine-status">
                <span class="dot" class:on={emotionStatus.available}></span>
                <span>{emotionStatus.available ? '可用' : emotionStatus.message}</span>
                {#if emotionStatus.device}<span class="device-tag">{emotionStatus.device}</span>{/if}
              </div>
            </div>

            <div class="grid-2">
              <div class="row">
                <div class="row-label">计算设备</div>
                <div class="seg">
                  <button class:active={device === 'auto'} onclick={() => (device = 'auto')}>自动</button>
                  <button class:active={device === 'gpu'} onclick={() => (device = 'gpu')}>GPU</button>
                  <button class:active={device === 'cpu'} onclick={() => (device = 'cpu')}>CPU</button>
                </div>
              </div>
              <div class="row">
                <div class="row-label">推理优先引擎</div>
                <div class="seg">
                  <button class:active={preferEngine === 'lightweight'} onclick={() => selectPreferEngine('lightweight')}>轻量</button>
                  <button class:active={preferEngine === 'emotion'} onclick={() => selectPreferEngine('emotion')}>
                    情感
                    <PermissionBadge feature="emotion_engine" locked={!membership.canUseFeature('emotion_engine')} compact />
                  </button>
                  <button class:active={preferEngine === 'cloud'} onclick={() => selectPreferEngine('cloud')}>
                    云端
                    <PermissionBadge feature="cloud_engine" locked={!membership.canUseFeature('cloud_engine')} compact />
                  </button>
                </div>
              </div>
              <div class="row">
                <div class="row-label">显存使用上限</div>
                <div class="slider-row">
                  <Slider min={50} max={95} step={5} value={vramLimit} onchange={(v) => vramLimit = v} />
                  <span class="slider-value">{vramLimit}%</span>
                </div>
              </div>
              <div class="row">
                <div class="row-label">并行推理任务数</div>
                <div class="slider-row">
                  <Slider min={1} max={8} step={1} value={parallelTasks} onchange={(v) => parallelTasks = v} />
                  <span class="slider-value">{parallelTasks}</span>
                </div>
              </div>
              <div class="row">
                <div class="row-label">半精度推理（FP16）</div>
                <Switch bind:checked={halfPrecision} size="sm" />
              </div>
            </div>
          </div>
        {/if}

        {#if active === 'cloud'}
          <div class="section-body">
            <div class="inline-head">
              <span>云端引擎状态</span>
              <div class="head-meta">
                <span class="dot" class:on={cloudLoggedIn} title={cloudLoggedIn ? '云端引擎可用' : '云端引擎未就绪'}></span>
                <PermissionBadge feature="cloud_chars" locked={!membership.canUseFeature('cloud_engine')} compact />
              </div>
            </div>
            <div class="cloud-status-row">
              <div class="cloud-status-info">
                <span class="cloud-status-label">{cloudLoggedIn ? '已解锁' : '未解锁'}</span>
                <span class="cloud-status-sub">
                  {#if cloudLoggedIn}
                    {membership.plan.name} · 余额 {membership.account.cloudBalance.toLocaleString('zh-CN')} 字
                  {:else}
                    升级旗舰版后可使用云端引擎
                  {/if}
                </span>
              </div>
              <button type="button" class="btn-link" onclick={() => import('$app/navigation').then(m => m.goto('/profile'))}>
                <span>{cloudLoggedIn ? '账号管理' : '前往升级'}</span>
                <Icon name="ant-design:right-outlined" size={10} color="currentColor" />
              </button>
            </div>
            <p class="card-hint">云端引擎按字符计费，不占用本地显存。余额充值与套餐管理请前往个人中心。</p>

            <div class="divider-line"></div>

            <div class="inline-head">
              <span>LLM 智能拆分配置</span>
            </div>
            <div class="row">
              <div class="row-label">API 地址</div>
              <input
                type="text"
                class="row-input"
                value={appSettings.settings.llm.apiBaseUrl}
                onchange={(e) => void appSettings.saveLlm({ apiBaseUrl: (e.target as HTMLInputElement).value })}
                placeholder="https://api.deepseek.com/v1"
              />
            </div>
            <div class="row">
              <div class="row-label">API Key</div>
              <input
                type="password"
                class="row-input"
                value={appSettings.settings.llm.apiKey}
                onchange={(e) => void appSettings.saveLlm({ apiKey: (e.target as HTMLInputElement).value })}
                placeholder="sk-..."
              />
            </div>
            <div class="row">
              <div class="row-label">模型</div>
              <div class="model-row">
                {#if llmModels.length > 0}
                  <Select
                    block
                    value={appSettings.settings.llm.model}
                    ariaLabel="LLM 模型"
                    options={llmModels.map((m) => ({ value: m, label: m }))}
                    onchange={(v) => void appSettings.saveLlm({ model: v })}
                  />
                {:else}
                  <input
                    type="text"
                    class="row-input"
                    value={appSettings.settings.llm.model}
                    onchange={(e) => void appSettings.saveLlm({ model: (e.target as HTMLInputElement).value })}
                    placeholder="deepseek-chat"
                  />
                {/if}
                <button type="button" class="detect-btn" disabled={llmDetecting || !appSettings.settings.llm.apiKey} onclick={handleDetectModels}>
                  {llmDetecting ? '检测中…' : '检测模型'}
                </button>
              </div>
            </div>
            <p class="help-text">用于多角色配音页的台词智能拆分功能。支持 OpenAI 兼容接口（DeepSeek / Gemini / 通义等）。{llmModels.length > 0 ? ` 已检测到 ${llmModels.length} 个模型。` : ''}</p>
          </div>
        {/if}

        {#if active === 'audio'}
          <div class="section-body">
            <div class="grid-2">
              <div class="row">
                <div class="row-label">默认导出格式</div>
                <div class="seg">
                  <button class:active={outputFormat === 'wav'} onclick={() => (outputFormat = 'wav')}>WAV</button>
                  <button class:active={outputFormat === 'mp3'} onclick={() => (outputFormat = 'mp3')}>MP3</button>
                  <button class:active={outputFormat === 'flac'} onclick={() => (outputFormat = 'flac')}>FLAC</button>
                </div>
              </div>
              <div class="row">
                <div class="row-label">采样率</div>
                <Select
                  value={String(outputSampleRate)}
                  ariaLabel="采样率"
                  options={[
                    { value: '16000', label: '16000 Hz' },
                    { value: '22050', label: '22050 Hz' },
                    { value: '24000', label: '24000 Hz' },
                    { value: '44100', label: '44100 Hz' },
                    { value: '48000', label: '48000 Hz' },
                  ]}
                  onchange={(v) => (outputSampleRate = Number(v))}
                />
              </div>
              <div class="row">
                <div class="row-label">默认段间静音</div>
                <div class="slider-row">
                  <Slider min={0} max={1000} step={50} value={defaultIntervalSilence} onchange={(v) => defaultIntervalSilence = v} />
                  <span class="slider-value">{defaultIntervalSilence} ms</span>
                </div>
              </div>
              <div class="row">
                <div class="row-label">响度归一化（−16 LUFS）</div>
                <Switch bind:checked={normalizeLoudness} size="sm" />
              </div>
              <div class="row">
                <div class="row-label">自动裁剪首尾静音</div>
                <Switch bind:checked={trimSilence} size="sm" />
              </div>
            </div>
          </div>
        {/if}

        {#if active === 'subtitle'}
          <div class="section-body">
            <div class="grid-2">
              <div class="row">
                <div class="row-label">默认导出格式</div>
                <div class="seg">
                  <button class:active={subtitleFormat === 'srt'} onclick={() => (subtitleFormat = 'srt')}>SRT</button>
                  <button class:active={subtitleFormat === 'vtt'} onclick={() => (subtitleFormat = 'vtt')}>VTT</button>
                  <button class:active={subtitleFormat === 'ass'} onclick={() => (subtitleFormat = 'ass')}>ASS</button>
                </div>
              </div>
              <div class="row">
                <div class="row-label">字符编码</div>
                <Select
                  bind:value={subtitleEncoding}
                  ariaLabel="字符编码"
                  options={[
                    { value: 'utf-8', label: 'UTF-8' },
                    { value: 'utf-8-bom', label: 'UTF-8 with BOM' },
                    { value: 'gbk', label: 'GBK' },
                  ]}
                />
              </div>
              <div class="row">
                <div class="row-label">换行</div>
                <div class="seg">
                  <button class:active={subtitleEol === 'lf'} onclick={() => (subtitleEol = 'lf')}>LF</button>
                  <button class:active={subtitleEol === 'crlf'} onclick={() => (subtitleEol = 'crlf')}>CRLF</button>
                </div>
              </div>
              <div class="row">
                <div class="row-label">嵌入说话人姓名</div>
                <Switch bind:checked={speakerInSubtitle} size="sm" />
              </div>
            </div>
          </div>
        {/if}

        {#if active === 'security'}
          <div class="section-body">
            <div class="grid-2">
              <div class="row">
                <div class="row-label">启动应用时需密码</div>
                <Switch bind:checked={requirePassword} size="sm" />
              </div>
              <div class="row">
                <div class="row-label">空闲自动锁定</div>
                <Switch bind:checked={lockOnIdle} size="sm" />
              </div>
              {#if lockOnIdle}
                <div class="row">
                  <div class="row-label">锁定空闲分钟数</div>
                  <div class="slider-row">
                    <Slider min={5} max={120} step={5} value={idleMinutes} onchange={(v) => idleMinutes = v} />
                    <span class="slider-value">{idleMinutes} 分钟</span>
                  </div>
                </div>
              {/if}
              <div class="row">
                <div class="row-label">允许匿名诊断数据</div>
                <Switch bind:checked={allowTelemetry} size="sm" />
              </div>
            </div>
            <p class="card-hint">诊断数据仅用于改善产品稳定性，不包含您的文本内容、参考音频或生成结果。</p>
          </div>
        {/if}

        {#if active === 'shortcut'}
          <div class="section-body">
            <table class="shortcut-table">
              <thead>
                <tr><th>操作</th><th>快捷键</th></tr>
              </thead>
              <tbody>
                {#each [
                  ['生成配音', 'Ctrl + Enter'],
                  ['取消生成', 'Esc'],
                  ['播放 / 暂停', '空格'],
                  ['插入停顿标记', 'Ctrl + ;'],
                  ['文义分段', 'Ctrl + Shift + S'],
                  ['切换引擎', 'Ctrl + Shift + E'],
                  ['打开设置', 'Ctrl + ,'],
                  ['打开音库', 'Ctrl + L'],
                ] as [action, key] (action)}
                  <tr>
                    <td>{action}</td>
                    <td><kbd>{key}</kbd></td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}

        {#if active === 'storage'}
          <div class="section-body">
            <div class="storage-grid">
              <div class="storage-cell">
                <div class="cell-title">推理缓存</div>
                <div class="cell-value">{cacheSizeGB.toFixed(1)} GB</div>
                <button type="button" class="btn-secondary tiny" onclick={handleClearCache}>清空缓存</button>
              </div>
              <div class="storage-cell">
                <div class="cell-title">模型缓存</div>
                <div class="cell-value">{modelCacheGB.toFixed(1)} GB</div>
                <button type="button" class="btn-secondary tiny" onclick={() => toast.info('模型缓存清理需重启应用')}>清理</button>
              </div>
              <div class="storage-cell">
                <div class="cell-title">生成输出</div>
                <div class="cell-value">{outputSizeGB.toFixed(1)} GB</div>
                <button type="button" class="btn-secondary tiny" onclick={() => toast.info('请在「文件」页管理输出')}>管理</button>
              </div>
            </div>
            <div class="row">
              <div class="row-label">缓存生命周期</div>
              <div class="seg">
                {#each [
                  ['7', '7 天'],
                  ['30', '30 天'],
                  ['90', '90 天'],
                  ['forever', '永久'],
                ] as [val, label] (val)}
                  <button class:active={cacheLifecycle === val} onclick={() => (cacheLifecycle = val as typeof cacheLifecycle)}>{label}</button>
                {/each}
              </div>
            </div>
          </div>
        {/if}

        {#if active === 'advanced'}
          <div class="section-body">
            <div class="row">
              <div class="row-label">开启开发者日志</div>
              <Switch bind:checked={devLog} size="sm" />
            </div>
            <div class="row">
              <div class="row-label">实验性功能</div>
              <Switch bind:checked={experimentalFeatures} size="sm" />
            </div>
            <div class="row">
              <div class="row-label">重置全部偏好</div>
              <button type="button" class="btn-danger tiny" onclick={() => toast.warning('该操作会清空所有自定义偏好')}>
                <Icon name="warning" size={12} color="#fff" />
                <span>恢复初始状态</span>
              </button>
            </div>
          </div>
        {/if}
      </div>
    </section>
  </div>
</div>

<style>
  .settings-page {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    padding: 15px;
    gap: var(--spacing-sm);
    background-color: var(--color-bg-container);
  }

  .settings-body {
    flex: 1;
    display: flex;
    gap: var(--spacing-sm);
    min-height: 0;
    overflow: hidden;
  }

  .settings-rail {
    width: clamp(150px, 18vw, 210px);
    flex-shrink: 0;
    padding: var(--spacing-sm);
    display: flex;
    flex-direction: column;
    gap: 2px;
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-lg);
    overflow: hidden;
  }

  .rail-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    height: 38px;
    padding: 0 var(--spacing-md);
    background: transparent;
    border: none;
    border-radius: var(--border-radius);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    cursor: pointer;
    transition: background-color var(--motion-duration-mid) var(--motion-ease-base), color var(--motion-duration-mid) var(--motion-ease-base);
  }
  .rail-item:hover { background-color: color-mix(in srgb, var(--color-bg-spotlight) 40%, transparent); color: var(--color-text); }
  .rail-item.active {
    background: transparent;
    color: var(--color-primary);
    font-weight: 500;
  }
  .rail-item.active::before {
    content: '';
    width: 3px;
    height: 16px;
    margin-left: -12px;
    margin-right: 4px;
    background: var(--color-primary);
    border-radius: 2px;
    flex-shrink: 0;
  }

  .rail-head {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-md) var(--spacing-md) var(--spacing-md);
    font-size: var(--font-size);
    font-weight: 600;
    color: var(--color-text);
    letter-spacing: 0.3px;
  }

  .rail-foot {
    margin-top: auto;
    padding-top: var(--spacing-sm);
    border-top: 1px solid var(--color-border-secondary);
  }

  .rail-action {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    height: 34px;
    padding: 0 var(--spacing-md);
    background: transparent;
    border: none;
    border-radius: var(--border-radius);
    color: var(--color-text-tertiary);
    font-size: var(--font-size-sm);
    cursor: pointer;
    transition: color var(--motion-duration-mid) var(--motion-ease-base), background-color var(--motion-duration-mid) var(--motion-ease-base);
  }
  .rail-action:hover { color: var(--color-primary); background-color: var(--color-bg-spotlight); }

  .settings-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    overflow: hidden;
  }

  .content-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    padding: var(--spacing-xs) 0;
  }
  .content-head h2 {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--color-text);
  }
  .head-actions { display: flex; gap: var(--spacing-sm); }

  .btn-save {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 30px;
    padding: 0 var(--spacing-md);
    background: transparent;
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    cursor: pointer;
    transition: border-color var(--motion-duration-mid) var(--motion-ease-base), color var(--motion-duration-mid) var(--motion-ease-base);
  }
  .btn-save:hover { border-color: var(--color-primary); color: var(--color-primary); }

  .content-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: color-mix(in srgb, var(--color-border-secondary) 60%, transparent) transparent;
  }

  .section-body {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-lg);
  }

  .inline-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: var(--spacing-sm);
    margin-bottom: var(--spacing-xs);
    font-size: var(--font-size);
    font-weight: 500;
    color: var(--color-text);
  }

  .divider-line {
    height: 1px;
    background: linear-gradient(90deg, var(--color-border-secondary), transparent);
    margin: var(--spacing-lg) 0;
  }

  .card-hint {
    margin: 0;
    color: var(--color-text-tertiary);
    font-size: var(--font-size-sm);
    line-height: 1.5;
  }

  .link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: transparent;
    border: none;
    color: var(--color-primary);
    font-size: var(--font-size-sm);
    cursor: pointer;
    padding: 4px 6px;
    border-radius: var(--border-radius-sm);
  }
  .link:hover { background-color: var(--color-bg-spotlight); }
  .link:disabled { opacity: 0.5; cursor: not-allowed; }

  .head-meta {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-md);
    padding: var(--spacing-sm) 0;
  }
  .row-label {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .grid-2 {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--spacing-md) var(--spacing-xl);
  }

  .seg {
    display: flex;
    gap: 2px;
    background-color: var(--color-bg-base);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-sm);
    padding: 2px;
  }
  .seg button {
    height: 24px;
    padding: 0 var(--spacing-sm);
    background: transparent;
    border: none;
    border-radius: var(--border-radius-sm);
    color: var(--color-text-tertiary);
    font-size: var(--font-size-sm);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: background-color var(--transition-duration) var(--transition-timing), color var(--transition-duration) var(--transition-timing);
  }
  .seg button.active { background-color: var(--color-primary); color: #fff; }


  .engine-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md);
    background-color: var(--color-bg-container);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
  }
  .engine-meta { display: flex; flex-direction: column; gap: 4px; }
  .engine-name { display: flex; align-items: center; gap: 8px; color: var(--color-text); font-weight: 500; font-size: var(--font-size); }
  .engine-sub { color: var(--color-text-tertiary); font-size: 11px; line-height: 1.5; }

  .engine-status { display: flex; align-items: center; gap: var(--spacing-sm); color: var(--color-text-secondary); font-size: var(--font-size-sm); }
  .dot { width: 8px; height: 8px; border-radius: 50%; background-color: var(--color-error); display: inline-block; transition: background-color var(--motion-duration-mid); }
  .dot.on { background-color: var(--color-success); box-shadow: 0 0 8px color-mix(in srgb, var(--color-success) 50%, transparent); }
  .device-tag {
    font-size: 11px;
    color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 14%, transparent);
    padding: 2px 8px;
    border-radius: var(--border-radius-pill);
    font-weight: 500;
  }

  .slider-row { display: flex; align-items: center; gap: var(--spacing-sm); min-width: 0; }
  .slider-value { min-width: 60px; text-align: right; color: var(--color-text-tertiary); font-size: var(--font-size-sm); }

  .cloud-status-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-md) var(--spacing-lg);
    background-color: var(--color-bg-container);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
    transition: border-color var(--motion-duration-mid) var(--motion-ease-base);
  }
  .cloud-status-row:hover { border-color: color-mix(in srgb, var(--color-primary) 30%, var(--color-border-secondary)); }
  .cloud-status-info { display: flex; flex-direction: column; gap: 4px; }
  .cloud-status-label { color: var(--color-text); font-weight: 500; font-size: var(--font-size); }
  .cloud-status-sub { color: var(--color-text-tertiary); font-size: 11px; }
  .btn-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: transparent;
    border: none;
    color: var(--color-primary);
    font-size: var(--font-size-sm);
    cursor: pointer;
    padding: 4px 8px;
    border-radius: var(--border-radius-sm);
    transition: background-color var(--transition-duration) var(--transition-timing);
  }
  .btn-link:hover { background-color: var(--color-bg-spotlight); }

  .storage-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-sm);
  }
  .storage-cell {
    padding: var(--spacing-md);
    background-color: var(--color-bg-container);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
    display: flex; flex-direction: column; gap: 6px; align-items: flex-start;
  }
  .cell-title { color: var(--color-text-tertiary); font-size: var(--font-size-sm); }
  .cell-value { color: var(--color-text); font-size: var(--font-size-xl); font-weight: 600; }

  .shortcut-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: var(--font-size-sm); }
  .shortcut-table th { color: var(--color-text-tertiary); text-align: left; padding: var(--spacing-sm) var(--spacing-md); font-weight: 500; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
  .shortcut-table td { padding: var(--spacing-sm) var(--spacing-md); color: var(--color-text-secondary); border-top: 1px solid color-mix(in srgb, var(--color-border-secondary) 60%, transparent); }
  .shortcut-table tr:hover td { background: color-mix(in srgb, var(--color-bg-spotlight) 50%, transparent); }
  kbd {
    font-family: ui-monospace, Menlo, Consolas, monospace;
    background: var(--color-bg-base);
    border: 1px solid var(--color-border-secondary);
    color: var(--color-text);
    padding: 3px 8px;
    border-radius: var(--border-radius-sm);
    font-size: 11px;
    box-shadow: 0 1px 0 var(--color-border-secondary);
  }

  .btn-secondary, .btn-danger {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 0 var(--spacing-md);
    font-size: var(--font-size-sm);
    border-radius: var(--border-radius);
    cursor: pointer;
    border: none;
    transition: background-color var(--transition-duration) var(--transition-timing), border-color var(--transition-duration) var(--transition-timing), color var(--transition-duration) var(--transition-timing);
  }
  .btn-secondary { background-color: transparent; color: var(--color-text-secondary); border: 1px solid var(--color-border-secondary); }
  .btn-secondary:hover { border-color: var(--color-primary); color: var(--color-text); }
  .btn-danger { background-color: var(--color-error); color: #fff; }

  .tiny { height: 26px; padding: 0 var(--spacing-sm); font-size: 11px; }

  .row-input {
    width: 100%;
    height: 32px;
    padding: 0 var(--spacing-sm);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-sm);
    background: var(--color-bg-base);
    color: var(--color-text);
    font-family: inherit;
    font-size: var(--font-size-sm);
  }
  .row-input:focus { border-color: var(--color-primary); outline: none; }

  .help-text {
    margin: var(--spacing-xs) 0 0;
    font-size: 11px;
    color: var(--color-text-disabled);
    line-height: 1.5;
  }

  .model-row {
    display: flex;
    gap: var(--spacing-xs);
  }

  .model-row .row-input { flex: 1; }

  .detect-btn {
    height: 32px;
    padding: 0 var(--spacing-md);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-sm);
    background: transparent;
    color: var(--color-primary);
    font-size: 12px;
    font-family: inherit;
    cursor: pointer;
    white-space: nowrap;
    transition: border-color var(--motion-duration-mid) var(--motion-ease-base);
  }

  .detect-btn:hover:not(:disabled) { border-color: var(--color-primary); }
  .detect-btn:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
