<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import * as ttsApi from '$lib/api/tts';
  import { dubbing, type EngineMode } from '$lib/stores/dubbing.svelte';
  import { appSettings } from '$lib/stores/settings.svelte';
  import { listLlmModels } from '$lib/api/tts';
  import Modal from '$lib/components/ui/Modal.svelte';

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

  let active = $state<SectionKey | null>(null);
  let search = $state('');

  let modalOpen = $derived(active !== null);
  let modalTitle = $derived(
    active ? (sections.find((s) => s.key === active)?.label ?? '') : ''
  );

  function openSection(key: SectionKey) {
    active = key;
  }

  function closeSection() {
    active = null;
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
  let cloudLoggedIn = $state(false);
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
  let cloudAccount = $state('');
  let cloudBalance = $state(0);
  let cloudQuota = $state(100000);

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
    preferEngine = mode;
    dubbing.setEngine(mode);
    toast.success(`已切换默认推理引擎：${mode === 'lightweight' ? '轻量' : mode === 'emotion' ? '情感' : '云端'}`);
  }

  function syncCloudAvailability(available: boolean, message: string) {
    dubbing.engineAvailable = {
      ...dubbing.engineAvailable,
      cloud: { available, message },
    };
  }

  // ---- 音频 ----
  let outputFormat = $state<'wav' | 'mp3' | 'flac'>('wav');
  let outputSampleRate = $state(24000);
  let normalizeLoudness = $state(true);
  let trimSilence = $state(false);
  let defaultIntervalSilence = $state(200);

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
      });
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

  async function handleCloudLogin() {
    const { goto } = await import('$app/navigation');
    await goto('/profile');
  }

  function handleRecharge() {
    toast.info('充值中心开发中');
  }

  function handleClearCache() {
    cacheSizeGB = 0;
    toast.success('缓存已清空');
  }
</script>

<div class="settings-page">
  <header class="settings-toolbar">
    <h1 class="page-title">设置</h1>
    <div class="toolbar-actions">
      <div class="search-input">
        <Icon name="search" size={14} color="var(--color-text-tertiary)" />
        <input type="text" placeholder="搜索设置项…" bind:value={search} />
      </div>
      <button type="button" class="btn-secondary" onclick={() => toast.info('导入配置开发中')}>
        <Icon name="import" size={14} color="currentColor" />
        <span>导入</span>
      </button>
      <button type="button" class="btn-secondary" onclick={() => toast.info('导出配置开发中')}>
        <Icon name="export" size={14} color="currentColor" />
        <span>导出</span>
      </button>
    </div>
  </header>

  <div class="settings-body">
    <aside class="settings-rail">
      {#each sections as section (section.key)}
        <button
          type="button"
          class="rail-item"
          class:active={active === section.key}
          onclick={() => openSection(section.key)}
        >
          <Icon
            name={section.icon}
            size={18}
            color={active === section.key ? 'var(--color-primary)' : 'var(--color-text-tertiary)'}
          />
          <span>{section.label}</span>
        </button>
      {/each}
    </aside>

    <section class="settings-overview">
      <div class="overview-card">
        <Icon name="setting" size={36} color="var(--color-primary)" />
        <h2>选择左侧章节进行配置</h2>
        <p>所有设置项以弹窗形式打开，避免长滚动页面。修改完保存即生效。</p>
        <div class="overview-stats">
          <div class="stat">
            <span class="stat-num">{sections.length}</span>
            <span class="stat-label">配置章节</span>
          </div>
          <div class="stat">
            <span class="stat-num">{appSettings.settings.dubbing.engineMode === 'lightweight' ? '轻量' : appSettings.settings.dubbing.engineMode === 'emotion' ? '情感' : '云端'}</span>
            <span class="stat-label">当前引擎</span>
          </div>
          <div class="stat">
            <span class="stat-num">{appSettings.settings.dubbing.device.toUpperCase()}</span>
            <span class="stat-label">计算设备</span>
          </div>
        </div>
        <div class="overview-quick">
          <button type="button" class="quick-btn" onclick={() => openSection('engine')}>
            <Icon name="thunderbolt" size={14} color="currentColor" />
            <span>引擎设置</span>
          </button>
          <button type="button" class="quick-btn" onclick={() => openSection('cloud')}>
            <Icon name="cloud" size={14} color="currentColor" />
            <span>云端账号</span>
          </button>
          <button type="button" class="quick-btn" onclick={() => openSection('audio')}>
            <Icon name="sound" size={14} color="currentColor" />
            <span>音频默认</span>
          </button>
        </div>
      </div>
    </section>
  </div>

  <footer class="settings-foot">
    <button type="button" class="link" onclick={handleReset}>
      <Icon name="refresh" size={12} color="currentColor" />
      <span>恢复默认值</span>
    </button>
    <div class="foot-right">
      <button type="button" class="btn-secondary" onclick={() => toast.info('设置未保存的修改已撤销')}>取消</button>
      <button type="button" class="btn-primary" onclick={handleSave}>
        <Icon name="save" size={14} color="#fff" />
        <span>保存设置</span>
      </button>
    </div>
  </footer>
</div>

<Modal
  open={modalOpen}
  title={modalTitle}
  size="lg"
  onClose={closeSection}
>
  <div class="modal-section-body">
      {#if active === 'general'}
        <article class="card">
          <header class="card-head">
            <h2 class="card-title">通用</h2>
          </header>
          <div class="card-body">
            <div class="row">
              <div class="row-label">界面语言</div>
              <select bind:value={language} class="select">
                <option value="zh-CN">简体中文</option>
                <option value="zh-TW">繁體中文</option>
                <option value="en-US">English</option>
              </select>
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
              <label class="switch">
                <input type="checkbox" bind:checked={launchAtStartup} />
                <span class="track"><span class="thumb"></span></span>
              </label>
            </div>
            <div class="row">
              <div class="row-label">最小化到托盘</div>
              <label class="switch">
                <input type="checkbox" bind:checked={minimizeToTray} />
                <span class="track"><span class="thumb"></span></span>
              </label>
            </div>
            <div class="row">
              <div class="row-label">关闭主窗口时收起到托盘</div>
              <label class="switch">
                <input type="checkbox" bind:checked={closeToTray} />
                <span class="track"><span class="thumb"></span></span>
              </label>
            </div>
            <div class="row">
              <div class="row-label">启动时检查更新</div>
              <label class="switch">
                <input type="checkbox" bind:checked={autoCheckUpdate} />
                <span class="track"><span class="thumb"></span></span>
              </label>
            </div>
          </div>
        </article>
      {/if}

      {#if active === 'engine'}
        <article class="card">
          <header class="card-head">
            <h2 class="card-title">本地推理引擎</h2>
            <button type="button" class="link" onclick={detectEngines} disabled={detecting}>
              <Icon name="sync" size={12} color="var(--color-primary)" />
              <span>{detecting ? '检测中…' : '检测可用性'}</span>
            </button>
          </header>
          <div class="card-body">
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
                  <button class:active={preferEngine === 'emotion'} onclick={() => selectPreferEngine('emotion')}>情感</button>
                  <button class:active={preferEngine === 'cloud'} onclick={() => selectPreferEngine('cloud')}>云端</button>
                </div>
              </div>
              <div class="row">
                <div class="row-label">显存使用上限</div>
                <div class="slider-row">
                  <input type="range" min="50" max="95" step="5" bind:value={vramLimit} />
                  <span class="slider-value">{vramLimit}%</span>
                </div>
              </div>
              <div class="row">
                <div class="row-label">并行推理任务数</div>
                <div class="slider-row">
                  <input type="range" min="1" max="8" step="1" bind:value={parallelTasks} />
                  <span class="slider-value">{parallelTasks}</span>
                </div>
              </div>
              <div class="row">
                <div class="row-label">半精度推理（FP16）</div>
                <label class="switch">
                  <input type="checkbox" bind:checked={halfPrecision} />
                  <span class="track"><span class="thumb"></span></span>
                </label>
              </div>
            </div>
          </div>
        </article>
      {/if}

      {#if active === 'cloud'}
        <article class="card">
          <header class="card-head">
            <h2 class="card-title">云端引擎</h2>
            <div class="head-meta">
              <span class="dot" class:on={cloudLoggedIn} title={cloudLoggedIn ? '云端引擎可用' : '云端引擎未就绪'}></span>
              <span class="badge-info">云端 = 情感引擎远程推理</span>
            </div>
          </header>
          <div class="card-body">
            <p class="card-hint">云端引擎由情感引擎在云端 GPU 上提供推理能力，按字符计费，不占用本地显存。登录账号后即可使用。</p>

            {#if cloudLoggedIn}
              <div class="cloud-card">
                <div class="cloud-account">
                  <div class="avatar-circle"><Icon name="avatar" size={20} color="var(--color-primary)" /></div>
                  <div>
                    <div class="account-name">{cloudAccount || '清风明月'}</div>
                    <div class="account-sub">已登录 · 专业版</div>
                  </div>
                </div>
                <div class="cloud-balance">
                  <div class="balance-num">{cloudBalance.toLocaleString()} / {cloudQuota.toLocaleString()}</div>
                  <div class="balance-bar"><span style="width: {Math.min(100, (cloudBalance / cloudQuota) * 100)}%"></span></div>
                  <div class="balance-sub">本月剩余字符额度</div>
                </div>
                <div class="cloud-actions">
                  <button type="button" class="btn-primary" onclick={handleRecharge}>
                    <Icon name="thunder-fill" size={14} color="#fff" />
                    <span>充值中心</span>
                  </button>
                  <button type="button" class="btn-secondary" onclick={() => { cloudLoggedIn = false; syncCloudAvailability(false, '云端账号已退出'); toast.info('已退出云端账号'); }}>
                    <Icon name="logout" size={14} color="currentColor" />
                    <span>退出</span>
                  </button>
                </div>
              </div>
            {:else}
              <div class="cloud-empty">
                <Icon name="cloud-server" size={40} color="var(--color-text-tertiary)" />
                <div class="empty-title">未登录云端账号</div>
                <div class="empty-sub">登录后可使用云端高质量推理，不消耗本地显存</div>
                <button type="button" class="btn-primary" onclick={handleCloudLogin}>
                  <Icon name="cloud" size={14} color="#fff" />
                  <span>登录云端账号</span>
                </button>
              </div>
            {/if}
          </div>
        </article>

        <article class="card" style="margin-top: var(--spacing-md)">
          <header class="card-head"><h2 class="card-title">LLM 智能拆分配置</h2></header>
          <div class="card-body">
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
                  <select
                    class="row-input"
                    value={appSettings.settings.llm.model}
                    onchange={(e) => void appSettings.saveLlm({ model: (e.target as HTMLSelectElement).value })}
                  >
                    {#each llmModels as m}<option value={m}>{m}</option>{/each}
                  </select>
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
        </article>
      {/if}

      {#if active === 'audio'}
        <article class="card">
          <header class="card-head"><h2 class="card-title">音频默认值</h2></header>
          <div class="card-body">
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
                <select class="select" bind:value={outputSampleRate}>
                  <option value={16000}>16000 Hz</option>
                  <option value={22050}>22050 Hz</option>
                  <option value={24000}>24000 Hz</option>
                  <option value={44100}>44100 Hz</option>
                  <option value={48000}>48000 Hz</option>
                </select>
              </div>
              <div class="row">
                <div class="row-label">默认段间静音</div>
                <div class="slider-row">
                  <input type="range" min="0" max="1000" step="50" bind:value={defaultIntervalSilence} />
                  <span class="slider-value">{defaultIntervalSilence} ms</span>
                </div>
              </div>
              <div class="row">
                <div class="row-label">响度归一化（−16 LUFS）</div>
                <label class="switch">
                  <input type="checkbox" bind:checked={normalizeLoudness} />
                  <span class="track"><span class="thumb"></span></span>
                </label>
              </div>
              <div class="row">
                <div class="row-label">自动裁剪首尾静音</div>
                <label class="switch">
                  <input type="checkbox" bind:checked={trimSilence} />
                  <span class="track"><span class="thumb"></span></span>
                </label>
              </div>
            </div>
          </div>
        </article>
      {/if}

      {#if active === 'subtitle'}
        <article class="card">
          <header class="card-head"><h2 class="card-title">字幕默认值</h2></header>
          <div class="card-body">
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
                <select class="select" bind:value={subtitleEncoding}>
                  <option value="utf-8">UTF-8</option>
                  <option value="utf-8-bom">UTF-8 with BOM</option>
                  <option value="gbk">GBK</option>
                </select>
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
                <label class="switch">
                  <input type="checkbox" bind:checked={speakerInSubtitle} />
                  <span class="track"><span class="thumb"></span></span>
                </label>
              </div>
            </div>
          </div>
        </article>
      {/if}

      {#if active === 'security'}
        <article class="card">
          <header class="card-head"><h2 class="card-title">安全与隐私</h2></header>
          <div class="card-body">
            <div class="grid-2">
              <div class="row">
                <div class="row-label">启动应用时需密码</div>
                <label class="switch">
                  <input type="checkbox" bind:checked={requirePassword} />
                  <span class="track"><span class="thumb"></span></span>
                </label>
              </div>
              <div class="row">
                <div class="row-label">空闲自动锁定</div>
                <label class="switch">
                  <input type="checkbox" bind:checked={lockOnIdle} />
                  <span class="track"><span class="thumb"></span></span>
                </label>
              </div>
              {#if lockOnIdle}
                <div class="row">
                  <div class="row-label">锁定空闲分钟数</div>
                  <div class="slider-row">
                    <input type="range" min="5" max="120" step="5" bind:value={idleMinutes} />
                    <span class="slider-value">{idleMinutes} 分钟</span>
                  </div>
                </div>
              {/if}
              <div class="row">
                <div class="row-label">允许匿名诊断数据</div>
                <label class="switch">
                  <input type="checkbox" bind:checked={allowTelemetry} />
                  <span class="track"><span class="thumb"></span></span>
                </label>
              </div>
            </div>
            <p class="card-hint">诊断数据仅用于改善产品稳定性，不包含您的文本内容、参考音频或生成结果。</p>
          </div>
        </article>
      {/if}

      {#if active === 'shortcut'}
        <article class="card">
          <header class="card-head">
            <h2 class="card-title">键盘快捷键</h2>
            <button type="button" class="link" onclick={() => toast.info('快捷键编辑开发中')}>
              <Icon name="edit" size={12} color="var(--color-primary)" />
              <span>自定义</span>
            </button>
          </header>
          <div class="card-body">
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
        </article>
      {/if}

      {#if active === 'storage'}
        <article class="card">
          <header class="card-head">
            <h2 class="card-title">存储与缓存</h2>
            <button type="button" class="link" onclick={() => toast.info('打开数据目录功能开发中')}>
              <Icon name="folder-open" size={12} color="var(--color-primary)" />
              <span>打开数据目录</span>
            </button>
          </header>
          <div class="card-body">
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
        </article>
      {/if}

      {#if active === 'advanced'}
        <article class="card">
          <header class="card-head"><h2 class="card-title">高级</h2></header>
          <div class="card-body">
            <div class="row">
              <div class="row-label">开启开发者日志</div>
              <label class="switch">
                <input type="checkbox" />
                <span class="track"><span class="thumb"></span></span>
              </label>
            </div>
            <div class="row">
              <div class="row-label">实验性功能</div>
              <label class="switch">
                <input type="checkbox" />
                <span class="track"><span class="thumb"></span></span>
              </label>
            </div>
            <div class="row">
              <div class="row-label">重置全部偏好</div>
              <button type="button" class="btn-danger tiny" onclick={() => toast.warning('该操作会清空所有自定义偏好')}>
                <Icon name="warning" size={12} color="#fff" />
                <span>恢复初始状态</span>
              </button>
            </div>
          </div>
        </article>
      {/if}
  </div>
</Modal>

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

  .settings-toolbar {
    height: 56px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--spacing-lg);
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .page-title {
    margin: 0;
    font-size: var(--font-size-xl);
    font-weight: 600;
    color: var(--color-text);
    letter-spacing: 0.3px;
  }

  .toolbar-actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .search-input {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    height: 32px;
    padding: 0 var(--spacing-sm);
    width: 240px;
    background-color: var(--color-bg-base);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
    transition: border-color var(--transition-duration) var(--transition-timing);
  }
  .search-input:focus-within { border-color: var(--color-primary); }
  .search-input input {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--color-text);
    font-size: var(--font-size-sm);
    outline: none;
  }

  .settings-body {
    flex: 1;
    display: flex;
    gap: var(--spacing-sm);
    min-height: 0;
    overflow: hidden;
  }

  .settings-rail {
    width: 200px;
    flex-shrink: 0;
    padding: var(--spacing-md);
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
    height: 36px;
    padding: 0 var(--spacing-sm);
    background: transparent;
    border: none;
    border-radius: var(--border-radius);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    cursor: pointer;
    transition: background-color var(--transition-duration) var(--transition-timing), color var(--transition-duration) var(--transition-timing);
  }
  .rail-item:hover { background-color: var(--color-bg-spotlight); color: var(--color-text); }
  .rail-item.active { background-color: var(--color-bg-elevated); color: var(--color-primary); }
  .rail-item.active::before {
    content: '';
    width: 3px; height: 14px;
    margin-left: -8px;
    margin-right: 4px;
    background-color: var(--color-primary);
    border-radius: 2px;
  }

  .settings-overview {
    flex: 1;
    padding: var(--spacing-xl);
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
  }

  .overview-card {
    width: 100%;
    max-width: 560px;
    padding: var(--spacing-xl);
    background-color: var(--color-bg-elevated);
    border-radius: var(--border-radius-lg);
    box-shadow: var(--shadow-2);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: var(--spacing-md);
  }

  .overview-card h2 {
    margin: var(--spacing-sm) 0 0;
    font-size: var(--font-size-xl);
    color: var(--color-text);
  }

  .overview-card p {
    margin: 0;
    color: var(--color-text-tertiary);
    font-size: var(--font-size-sm);
    line-height: 1.6;
  }

  .overview-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-md);
    width: 100%;
    margin-top: var(--spacing-sm);
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;
    padding: var(--spacing-md);
    background-color: var(--color-bg-spotlight);
    border-radius: var(--border-radius);
  }

  .stat-num {
    font-size: var(--font-size-xl);
    color: var(--color-primary);
    font-weight: 600;
  }

  .stat-label {
    font-size: 11px;
    color: var(--color-text-tertiary);
  }

  .overview-quick {
    display: flex;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
    justify-content: center;
    margin-top: var(--spacing-sm);
  }

  .quick-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: var(--control-height-sm);
    padding: 0 var(--spacing-md);
    background-color: var(--color-bg-spotlight);
    color: var(--color-text-secondary);
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    font-size: var(--font-size-sm);
    transition: background-color var(--transition-duration) var(--transition-timing), color var(--transition-duration) var(--transition-timing);
  }

  .quick-btn:hover {
    background-color: color-mix(in srgb, var(--color-primary) 14%, var(--color-bg-spotlight));
    color: var(--color-primary);
  }

  .modal-section-body {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .card {
    background-color: var(--color-bg-elevated);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-lg);
    overflow: hidden;
  }
  .card-head {
    height: 48px;
    padding: 0 var(--spacing-lg);
    border-bottom: 1px solid var(--color-border-secondary);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .card-title {
    margin: 0;
    font-size: var(--font-size-lg);
    color: var(--color-text);
    font-weight: 500;
  }
  .card-body {
    padding: var(--spacing-lg);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
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

  .badge-info {
    font-size: 11px;
    color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 16%, transparent);
    padding: 2px 8px;
    border-radius: var(--border-radius-sm);
  }

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
    padding: 6px 0;
  }
  .row-label {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-md) var(--spacing-xl);
  }

  .select {
    height: 28px;
    padding: 0 var(--spacing-sm);
    background-color: var(--color-bg-base);
    border: 1px solid var(--color-border-secondary);
    color: var(--color-text);
    border-radius: var(--border-radius-sm);
    font-size: var(--font-size-sm);
    outline: none;
    min-width: 160px;
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
    transition: background-color var(--transition-duration) var(--transition-timing), color var(--transition-duration) var(--transition-timing);
  }
  .seg button.active { background-color: var(--color-primary); color: #fff; }

  .switch {
    position: relative;
    display: inline-flex;
    width: 36px;
    height: 20px;
    cursor: pointer;
  }
  .switch input {
    position: absolute; opacity: 0; pointer-events: none;
  }
  .track {
    flex: 1;
    background-color: var(--color-bg-base);
    border: 1px solid var(--color-border);
    border-radius: 999px;
    transition: background-color var(--transition-duration) var(--transition-timing), border-color var(--transition-duration) var(--transition-timing);
  }
  .thumb {
    position: absolute;
    top: 2px; left: 2px;
    width: 14px; height: 14px;
    border-radius: 50%;
    background-color: var(--color-text-secondary);
    transition: transform var(--transition-duration) var(--transition-timing), background-color var(--transition-duration) var(--transition-timing);
  }
  .switch input:checked + .track { background-color: var(--color-primary); border-color: var(--color-primary); }
  .switch input:checked + .track .thumb { transform: translateX(16px); background-color: #fff; }

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
  .engine-name { display: flex; align-items: center; gap: 6px; color: var(--color-text); font-weight: 500; font-size: var(--font-size); }
  .engine-sub { color: var(--color-text-tertiary); font-size: 11px; }

  .engine-status { display: flex; align-items: center; gap: var(--spacing-sm); color: var(--color-text-secondary); font-size: var(--font-size-sm); }
  .dot { width: 8px; height: 8px; border-radius: 50%; background-color: var(--color-error); display: inline-block; }
  .dot.on { background-color: var(--color-success); box-shadow: 0 0 6px color-mix(in srgb, var(--color-success) 45%, transparent); }
  .device-tag {
    font-size: 11px;
    color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 16%, transparent);
    padding: 1px 6px;
    border-radius: var(--border-radius-sm);
  }

  .slider-row { display: flex; align-items: center; gap: var(--spacing-sm); min-width: 220px; }
  .slider-row input[type="range"] {
    flex: 1;
    -webkit-appearance: none;
    appearance: none;
    height: 4px;
    background: var(--color-border);
    border-radius: 2px;
    outline: none;
  }
  .slider-row input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px; height: 12px;
    border-radius: 50%;
    background: var(--color-bg-elevated);
    box-shadow: 0 1px 4px rgba(0,0,0,0.4);
    cursor: pointer;
  }
  .slider-value { min-width: 60px; text-align: right; color: var(--color-text-tertiary); font-size: var(--font-size-sm); }

  .cloud-card {
    display: grid;
    grid-template-columns: 1fr 1fr 200px;
    gap: var(--spacing-lg);
    align-items: center;
    padding: var(--spacing-lg);
    background-color: var(--color-bg-container);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
  }
  .cloud-account { display: flex; align-items: center; gap: var(--spacing-md); }
  .avatar-circle {
    width: 40px; height: 40px;
    border-radius: 50%;
    background-color: color-mix(in srgb, var(--color-primary) 22%, transparent);
    display: flex; align-items: center; justify-content: center;
  }
  .account-name { color: var(--color-text); font-weight: 500; font-size: var(--font-size); }
  .account-sub { color: var(--color-text-tertiary); font-size: 11px; }

  .cloud-balance { display: flex; flex-direction: column; gap: 4px; }
  .balance-num { font-size: var(--font-size-lg); color: var(--color-primary); font-weight: 600; }
  .balance-bar { height: 4px; background-color: var(--color-bg-base); border-radius: 2px; overflow: hidden; }
  .balance-bar span { display: block; height: 100%; background-color: var(--color-primary); }
  .balance-sub { color: var(--color-text-tertiary); font-size: 11px; }

  .cloud-actions { display: flex; flex-direction: column; gap: var(--spacing-sm); }

  .cloud-empty {
    display: flex; flex-direction: column;
    align-items: center; gap: var(--spacing-sm);
    padding: var(--spacing-xl);
    background-color: var(--color-bg-container);
    border: 1px dashed var(--color-border);
    border-radius: var(--border-radius);
  }
  .empty-title { color: var(--color-text); font-weight: 500; font-size: var(--font-size); }
  .empty-sub { color: var(--color-text-tertiary); font-size: var(--font-size-sm); margin-bottom: var(--spacing-sm); }

  .storage-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-md);
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
  .shortcut-table th { color: var(--color-text-tertiary); text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--color-border-secondary); font-weight: 500; }
  .shortcut-table td { padding: 8px 12px; color: var(--color-text-secondary); border-bottom: 1px solid var(--color-border-secondary); }
  kbd {
    font-family: ui-monospace, Menlo, Consolas, monospace;
    background: var(--color-bg-base);
    border: 1px solid var(--color-border-secondary);
    color: var(--color-text);
    padding: 2px 6px;
    border-radius: var(--border-radius-sm);
    font-size: 11px;
  }

  .btn-primary, .btn-secondary, .btn-danger {
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
  .btn-primary { background-color: var(--color-primary); color: #fff; }
  .btn-primary:hover { background-color: var(--color-primary-hover); }
  .btn-secondary { background-color: transparent; color: var(--color-text-secondary); border: 1px solid var(--color-border-secondary); }
  .btn-secondary:hover { border-color: var(--color-primary); color: var(--color-text); }
  .btn-danger { background-color: var(--color-error); color: #fff; }

  .tiny { height: 26px; padding: 0 var(--spacing-sm); font-size: 11px; }

  .settings-foot {
    flex-shrink: 0;
    height: 56px;
    padding: 0 var(--spacing-lg);
    border-top: 1px solid var(--color-border-secondary);
    background-color: var(--color-bg-container);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .foot-right { display: flex; gap: var(--spacing-sm); }

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
