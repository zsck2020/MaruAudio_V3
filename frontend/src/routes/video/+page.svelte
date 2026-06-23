<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Switch from '$lib/components/ui/Switch.svelte';
  import Slider from '$lib/components/ui/Slider.svelte';
  import { toast } from '$lib/stores/toast.svelte';

  const tracks = [
    { name: '视频', icon: 'video-camera', clips: [{ x: 2, w: 96, label: 'EP12_master.mp4', color: 'blue' }] },
    { name: '角色甲', icon: 'sound', clips: [{ x: 5, w: 18, label: '甲_001.wav', color: 'green' }, { x: 31, w: 22, label: '甲_002.wav', color: 'green' }, { x: 64, w: 19, label: '甲_003.wav', color: 'green' }] },
    { name: '角色乙', icon: 'sound', clips: [{ x: 24, w: 20, label: '乙_001.wav', color: 'purple' }, { x: 55, w: 17, label: '乙_002.wav', color: 'purple' }] },
    { name: '旁白', icon: 'audio-mute', clips: [{ x: 10, w: 13, label: '旁白_001.wav', color: 'orange' }, { x: 76, w: 16, label: '旁白_002.wav', color: 'orange' }] },
    { name: '字幕', icon: 'subtitle', clips: [{ x: 4, w: 14, label: '字幕 001', color: 'cyan' }, { x: 22, w: 16, label: '字幕 002', color: 'cyan' }, { x: 43, w: 18, label: '字幕 003', color: 'cyan' }, { x: 67, w: 15, label: '字幕 004', color: 'cyan' }] },
    { name: 'BGM', icon: 'volume-up', clips: [{ x: 0, w: 98, label: 'ambient_theme.wav', color: 'red' }] },
  ];

  const markers = [
    { x: 12, label: '开门' },
    { x: 38, label: '转场' },
    { x: 62, label: '高潮' },
    { x: 84, label: '结尾' },
  ];
</script>

<div class="align-page">
  <main class="align-main">
    <section class="preview-area">
      <div class="preview-screen">
        <Icon name="video-camera" size={44} color="var(--color-primary)" />
        <p>视频预览</p>
        <strong>我不怕改变历史，我只怕你再也回不来了。</strong>
      </div>
      <aside class="meters">
        <h3>响度表</h3>
        {#each ['L', 'R'] as ch, i (ch)}
          <div class="meter"><span>{ch}</span><i style="height:{72 - i * 10}%"></i></div>
        {/each}
      </aside>
    </section>

    <section class="timeline-toolbar">
      <div class="play-controls">
        <Button variant="default" size="sm" prefixIcon="fast-backward" iconOnly ariaLabel="快退" />
        <Button variant="default" size="sm" prefixIcon="step-backward" iconOnly ariaLabel="上一帧" />
        <button type="button" class="play"><Icon name="play-fill" size={18} color="#fff" /></button>
        <Button variant="default" size="sm" prefixIcon="step-forward" iconOnly ariaLabel="下一帧" />
        <Button variant="default" size="sm" prefixIcon="fast-forward" iconOnly ariaLabel="快进" />
        <time>00:01:23.480</time>
      </div>
      <div class="tool-controls">
        <Button variant="primary" size="sm" prefixIcon="aim">吸附</Button>
        <Button variant="default" size="sm" prefixIcon="split-cells">切分</Button>
        <Button variant="default" size="sm" prefixIcon="merge-cells">合并</Button>
        <Button variant="default" size="sm" prefixIcon="zoom-out" iconOnly ariaLabel="缩小" />
        <div class="zoom-slider"><Slider min={0} max={100} value={58} /></div>
        <Button variant="default" size="sm" prefixIcon="zoom-in" iconOnly ariaLabel="放大" />
      </div>
    </section>

    <section class="timeline">
      <div class="ruler">
        {#each Array(11) as _, i (i)}
          <span style="left:{i * 10}%">{String(Math.floor(i * 2.4)).padStart(2, '0')}:00</span>
        {/each}
        {#each markers as marker (marker.label)}
          <em style="left:{marker.x}%">{marker.label}</em>
        {/each}
        <i class="playhead" style="left:42%"></i>
      </div>
      {#each tracks as track (track.name)}
        <div class="track-row">
          <div class="track-label"><Icon name={track.icon} size={14} color="currentColor" /><span>{track.name}</span></div>
          <div class="track-lane">
            {#each track.clips as clip (clip.label)}
              <button type="button" class="clip {clip.color}" style="left:{clip.x}%; width:{clip.w}%;" onclick={() => toast.info(`已选中 ${clip.label}`)}>
                <span>{clip.label}</span>
                <i></i>
              </button>
            {/each}
          </div>
        </div>
      {/each}
    </section>
  </main>

  <aside class="property-panel">
    <header>
      <h2>片段属性</h2>
      <Button variant="primary" size="sm" onclick={() => toast.success('已保存片段属性')}>保存</Button>
    </header>

    <section class="clip-card">
      <div class="clip-icon"><Icon name="sound-fill" size={28} color="#fff" /></div>
      <div>
        <strong>甲_002.wav</strong>
        <span>角色甲 · 轻量引擎生成</span>
      </div>
    </section>

    <section class="prop-group">
      <h3>时间信息</h3>
      <label>开始时间<input value="00:00:31.240" /></label>
      <label>结束时间<input value="00:00:37.820" /></label>
      <label>片段时长<input value="00:00:06.580" /></label>
      <label>偏移量<input value="+00:00:00.120" /></label>
    </section>

    <section class="prop-group">
      <h3>音频处理</h3>
      <label>音量 <span>-1.5 dB</span><input type="range" value="64" /></label>
      <label>淡入 <span>120 ms</span><input type="range" value="18" /></label>
      <label>淡出 <span>160 ms</span><input type="range" value="22" /></label>
      <label class="switch-label">响度归一化 <Switch checked={true} /></label>
      <label class="switch-label">自动降噪 <Switch checked={false} /></label>
    </section>

    <section class="prop-group">
      <h3>对齐辅助</h3>
      <Button variant="default" size="sm" block>吸附到字幕入点</Button>
      <Button variant="default" size="sm" block>匹配原声波峰</Button>
      <Button variant="default" size="sm" block>自动填补静音</Button>
    </section>

    <section class="analysis-card">
      <h3>同步分析</h3>
      <div><span>字幕误差</span><strong class="ok">+120ms</strong></div>
      <div><span>响度差异</span><strong>-1.5dB</strong></div>
      <div><span>重叠片段</span><strong class="warn">2 处</strong></div>
      <Button variant="primary" size="sm" block disabled>一键修正（即将推出）</Button>
    </section>
  </aside>
</div>

<style>
  .align-page {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) clamp(220px, 24vw, 300px);
    gap: var(--spacing-sm);
    padding: 15px;
    background: var(--color-bg-container);
    overflow: hidden;
  }

  @media (max-width: 800px) {
    .align-page {
      grid-template-columns: 1fr;
      overflow: hidden;
    }
  }

  button {
    cursor: pointer;
    font-family: inherit;
  }

  .align-main {
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-lg);
  }

  .preview-area {
    height: clamp(160px, 26vw, 260px);
    display: grid;
    grid-template-columns: 1fr 88px;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
    flex-shrink: 0;
  }

  .preview-screen {
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-lg);
    background: radial-gradient(circle at 50% 26%, color-mix(in srgb, var(--color-primary) 18%, transparent), transparent 36%), var(--color-bg-base);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--color-text-tertiary);
    position: relative;
  }

  .preview-screen strong {
    position: absolute;
    left: 50%;
    bottom: 24px;
    transform: translateX(-50%);
    white-space: nowrap;
    color: #fff;
    background: rgba(0,0,0,0.55);
    border-radius: var(--border-radius-sm);
    padding: 6px 18px;
    text-shadow: 0 0 4px #000;
  }

  .meters {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-lg);
    background: var(--color-bg-elevated);
    padding: var(--spacing-sm);
  }

  .meters h3 {
    margin: 0;
    color: var(--color-text);
    font-size: var(--font-size-sm);
    text-align: center;
  }

  .meter {
    flex: 1;
    position: relative;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    background: var(--color-bg-base);
    border-radius: var(--border-radius-sm);
    overflow: hidden;
  }

  .meter i {
    width: 70%;
    background: linear-gradient(to top, var(--color-success), var(--color-warning), var(--color-error));
    border-radius: var(--border-radius-sm) var(--border-radius-sm) 0 0;
  }

  .meter span {
    position: absolute;
    top: 4px;
    color: var(--color-text-tertiary);
    font-size: var(--font-size-2xs);
  }

  .timeline-toolbar {
    height: 54px;
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 var(--spacing-md);
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .play-controls,
  .tool-controls {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .play-controls .play {
    width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 50%;
    background: var(--color-primary);
    cursor: pointer;
  }

  .zoom-slider {
    width: 100px;
  }

  .play-controls time {
    margin-left: var(--spacing-sm);
    color: var(--color-primary);
    font-variant-numeric: tabular-nums;
  }

  .timeline {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: var(--spacing-md);
  }

  .ruler {
    position: relative;
    height: 42px;
    margin-left: 112px;
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .ruler span {
    position: absolute;
    bottom: 6px;
    transform: translateX(-50%);
    color: var(--color-text-tertiary);
    font-size: var(--font-size-2xs);
  }

  .ruler em {
    position: absolute;
    top: 4px;
    transform: translateX(-50%);
    font-style: normal;
    color: var(--color-warning);
    font-size: var(--font-size-2xs);
  }

  .playhead {
    position: absolute;
    top: 0;
    bottom: -420px;
    width: 2px;
    background: var(--color-error);
    z-index: 5;
  }

  .track-row {
    display: grid;
    grid-template-columns: 112px minmax(760px, 1fr);
    min-height: 58px;
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .track-label {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: 0 var(--spacing-sm);
    color: var(--color-text-secondary);
  }

  .track-lane {
    position: relative;
    background-image: linear-gradient(to right, var(--color-border-secondary) 1px, transparent 1px);
    background-size: 10% 100%;
  }

  .clip {
    position: absolute;
    top: 10px;
    height: 38px;
    min-width: 48px;
    border: none;
    border-radius: var(--border-radius-sm);
    color: #fff;
    overflow: hidden;
    padding: 0 8px;
    text-align: left;
  }

  .clip span {
    position: relative;
    z-index: 1;
    font-size: var(--font-size-xs);
  }

  .clip i {
    position: absolute;
    inset: 0;
    opacity: 0.35;
    background-image: repeating-linear-gradient(90deg, rgba(255,255,255,0.55) 0 2px, transparent 2px 7px);
  }

  .clip.blue { background: #1f6feb; }
  .clip.green { background: #2f9e44; }
  .clip.purple { background: #7950f2; }
  .clip.orange { background: #f08c00; }
  .clip.cyan { background: #0c8599; }
  .clip.red { background: #c92a2a; }

  .property-panel {
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-lg);
    padding: var(--spacing-md);
    min-height: 0;
    overflow: hidden;
    overflow-x: hidden;
  }

  .property-panel header {
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .property-panel h2,
  .prop-group h3,
  .analysis-card h3 {
    margin: 0;
    color: var(--color-text);
    font-size: var(--font-size);
  }

  .switch-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-sm);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .clip-card,
  .prop-group,
  .analysis-card {
    margin-top: var(--spacing-md);
    padding: var(--spacing-md);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-lg);
    background: var(--color-bg-elevated);
  }

  .clip-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .clip-icon {
    width: 54px;
    height: 54px;
    border-radius: var(--border-radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-primary);
  }

  .clip-card div:last-child {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .clip-card strong {
    color: var(--color-text);
  }

  .clip-card span {
    color: var(--color-text-tertiary);
    font-size: var(--font-size-sm);
  }

  .prop-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .prop-group label {
    display: grid;
    grid-template-columns: 82px minmax(0, 1fr);
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .prop-group label span {
    justify-self: end;
    color: var(--color-primary);
  }

  .prop-group input {
    height: 30px;
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-sm);
    background: var(--color-bg-base);
    color: var(--color-text);
    padding: 0 8px;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
  }

  .prop-group input[type='range'] {
    grid-column: 1 / -1;
    padding: 0;
  }

  .analysis-card {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .analysis-card div {
    display: flex;
    justify-content: space-between;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .analysis-card strong {
    color: var(--color-text);
    font-weight: 400;
  }

  .analysis-card .ok {
    color: var(--color-success);
  }

  .analysis-card .warn {
    color: var(--color-warning);
  }
</style>
