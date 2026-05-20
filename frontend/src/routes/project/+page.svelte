<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';
  import { rolesStore, type EmotionStrength } from '$lib/stores/roles.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import * as ttsApi from '$lib/api/tts';
  import { convertFileSrc } from '@tauri-apps/api/core';
  import type { EngineMode } from '$lib/types/dubbing';
  import Modal from '$lib/components/ui/Modal.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Slider from '$lib/components/ui/Slider.svelte';
  import { appSettings } from '$lib/stores/settings.svelte';

  const engineLabels: Record<EngineMode, string> = { lightweight: '轻量', emotion: '情感', cloud: '云端' };
  const engineColors: Record<EngineMode, string> = { lightweight: 'var(--color-primary)', emotion: 'var(--color-accent)', cloud: 'var(--color-info)' };
  const emotions = ['平静', '开心', '悲伤', '愤怒', '紧张', '惊讶', '冷漠', '坚定', '害怕'];
  const strengths: EmotionStrength[] = ['微弱', '中等', '强烈'];

  let playingLineId = $state<string | null>(null);
  let audioEl: HTMLAudioElement | undefined = $state();

  let showImportModal = $state(false);
  let importText = $state('');
  let isSplitting = $state(false);

  let dragFromIdx = $state<number | null>(null);
  let dragOverIdx = $state<number | null>(null);

  function handleDragStart(e: DragEvent, idx: number) {
    dragFromIdx = idx;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(idx));
    }
  }

  function handleDragOver(e: DragEvent, idx: number) {
    e.preventDefault();
    dragOverIdx = idx;
  }

  function handleDrop(e: DragEvent, idx: number) {
    e.preventDefault();
    if (dragFromIdx !== null && dragFromIdx !== idx) {
      const pageOffset = (rolesStore.currentPage - 1) * rolesStore.pageSize;
      rolesStore.reorderLines(pageOffset + dragFromIdx, pageOffset + idx);
      void rolesStore.saveToStore();
    }
    dragFromIdx = null;
    dragOverIdx = null;
  }

  function handleDragEnd() {
    dragFromIdx = null;
    dragOverIdx = null;
  }

  let llmConfigured = $derived(!!appSettings.settings.llm.apiKey);

  async function handleSplitLines() {
    if (!importText.trim()) { toast.warning('请输入文本'); return; }
    const { apiBaseUrl, apiKey, model } = appSettings.settings.llm;
    if (!apiKey) { toast.warning('请先在设置页配置 LLM API Key'); return; }

    isSplitting = true;
    try {
      const existingRoles = rolesStore.roles.map(r => r.name);
      const result = await ttsApi.splitLines({
        text: importText,
        api_base_url: apiBaseUrl,
        api_key: apiKey,
        model: model,
        roles: existingRoles,
      });

      rolesStore.clearLines();
      rolesStore.importLines(result.lines);
      void rolesStore.saveToStore();
      toast.success(`拆分完成：${result.count} 句台词`);
      showImportModal = false;
      importText = '';
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.warning(`拆分失败: ${msg}`);
    } finally {
      isSplitting = false;
    }
  }

  $effect(() => {
    void (async () => {
      const loaded = await rolesStore.loadFromStore();
      if (!loaded && rolesStore.roles.length === 0) {
        const r1 = rolesStore.createRole('林澈', '主角');
        rolesStore.updateRole(r1.id, { engine: 'emotion', voiceName: '磁性男声' });
        const r2 = rolesStore.createRole('苏晚', '女主');
        rolesStore.updateRole(r2.id, { engine: 'emotion', voiceName: '温暖女声' });
        const r3 = rolesStore.createRole('旁白', '旁白');
        rolesStore.updateRole(r3.id, { engine: 'lightweight', voiceName: '沉稳男声' });

        rolesStore.addLine(r1.id, '如果这扇门真的通往过去，那我们必须在天亮前做出选择。', '紧张', '强烈');
        rolesStore.addLine(r2.id, '我不怕改变历史，我只怕你再也回不来了。', '悲伤', '中等');
        rolesStore.addLine(r3.id, '走廊尽头的钟声敲响，所有人的呼吸都停在了同一秒。', '平静', '中等');
        rolesStore.addLine(r1.id, '我会回来，这是我给你的承诺。', '坚定', '中等');
        rolesStore.addLine(r2.id, '那就带我一起走吧。', '坚定', '强烈');
        rolesStore.addLine(r3.id, '门缓缓打开，光芒倾泻而出。', '平静', '中等');
      }
    })();
  });

  async function handleTryPlay(lineId: string) {
    const line = rolesStore.lines.find(l => l.id === lineId);
    if (!line) return;

    if (line.audioPath) {
      playingLineId = lineId;
      const src = line.audioPath.startsWith('http') || line.audioPath.startsWith('blob:')
        ? line.audioPath : convertFileSrc(line.audioPath);
      if (audioEl) {
        audioEl.src = src;
        void audioEl.play();
      }
      return;
    }

    const role = rolesStore.roles.find(r => r.id === line.roleId);
    if (!role?.voiceAudioPath) {
      toast.warning(`角色「${role?.name ?? '未知'}」未绑定参考音频`);
      return;
    }

    rolesStore.updateLine(lineId, { status: '生成中' });

    try {
      const req: ttsApi.SynthesizeRequest = {
        engine: role.engine,
        text: line.text,
        speaker_audio_path: role.voiceAudioPath,
        inference_mode: 'normal',
        interval_silence: role.intervalSilence,
        max_text_tokens_per_segment: role.maxTextTokens,
        bucket_max_size: 4,
        emotion_method: role.emotionMethod,
        emotion_vector: role.emotionMethod === 'slider' ? role.emotionVector : undefined,
        emotion_text: role.emotionMethod === 'text' ? role.emotionText || undefined : undefined,
        emotion_audio_path: role.emotionMethod === 'audio' ? role.emotionAudioPath || undefined : undefined,
        emo_alpha: role.emoAlpha,
        temperature: role.temperature,
        top_p: role.topP,
        top_k: role.topK,
        num_beams: 3,
        repetition_penalty: 10.0,
        max_mel_tokens: 600,
      };

      const { promise } = ttsApi.synthesizeStream(req, {
        onComplete: (evt) => {
          rolesStore.updateLine(lineId, { status: '已生成', audioPath: evt.outputPath });
          toast.success(`「${line.text.slice(0, 10)}…」生成完成`);
        },
        onError: (evt) => {
          rolesStore.updateLine(lineId, { status: '失败' });
          toast.warning(`生成失败: ${evt.message}`);
        },
      });

      await promise;
    } catch (err) {
      rolesStore.updateLine(lineId, { status: '失败' });
      const msg = err instanceof Error ? err.message : String(err);
      toast.warning(`生成失败: ${msg}`);
    }
  }

  function handleAudioEnded() {
    playingLineId = null;
  }

  let showVoiceModal = $state(false);
  let showAddRoleModal = $state(false);
  let newRoleName = $state('');
  let newRoleType = $state('配角');
  let newRoleEngine = $state<EngineMode>('emotion');

  function handleAddRole() {
    if (!newRoleName.trim()) { toast.warning('请输入角色名'); return; }
    const role = rolesStore.createRole(newRoleName.trim(), newRoleType);
    rolesStore.updateRole(role.id, { engine: newRoleEngine });
    void rolesStore.saveToStore();
    toast.success(`角色「${role.name}」已创建`);
    showAddRoleModal = false;
    newRoleName = '';
    newRoleType = '配角';
    newRoleEngine = 'emotion';
    rolesStore.selectRole(role.id);
  }

  async function handleUploadVoice() {
    if (!rolesStore.activeRole) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.wav,.mp3,.flac';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !rolesStore.activeRole) return;

      try {
        const { writeFile, mkdir, exists } = await import('@tauri-apps/plugin-fs');
        const { join } = await import('@tauri-apps/api/path');
        const { getOutputDir } = await import('$lib/api/tts');

        const ext = file.name.split('.').pop() || 'wav';
        const uniqueName = `role-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const buf = new Uint8Array(await file.arrayBuffer());

        let filePath: string;
        try {
          const outputDir = await getOutputDir();
          const refDir = outputDir.ref_audio;
          if (!await exists(refDir)) await mkdir(refDir, { recursive: true });
          filePath = await join(refDir, uniqueName);
        } catch {
          const { appDataDir } = await import('@tauri-apps/api/path');
          const dataDir = await appDataDir();
          const refDir = await join(dataDir, 'ref_audio');
          if (!await exists(refDir)) await mkdir(refDir, { recursive: true });
          filePath = await join(refDir, uniqueName);
        }

        await writeFile(filePath, buf);
        rolesStore.updateRole(rolesStore.activeRole.id, {
          voiceName: file.name,
          voiceAudioPath: filePath,
        });
        void rolesStore.saveToStore();
        toast.success(`已绑定音色：${file.name}`);
        showVoiceModal = false;
      } catch (err) {
        toast.warning(`上传失败: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    input.click();
  }

  function handleDeleteRole(id: string) {
    rolesStore.deleteRole(id);
    toast.success('角色已删除');
  }

  function handleDeleteLine(id: string) {
    rolesStore.deleteLine(id);
  }

  async function handleBatchGenerate() {
    const pending = rolesStore.lines.filter(l => l.status !== '已生成').length;
    if (pending === 0) { toast.info('所有台词已生成'); return; }

    const generated = await rolesStore.batchGenerate(async (line, role) => {
      const req: ttsApi.SynthesizeRequest = {
        engine: role.engine,
        text: line.text,
        speaker_audio_path: role.voiceAudioPath!,
        inference_mode: 'normal',
        interval_silence: role.intervalSilence,
        max_text_tokens_per_segment: role.maxTextTokens,
        bucket_max_size: 4,
        emotion_method: role.emotionMethod,
        emotion_vector: role.emotionMethod === 'slider' ? role.emotionVector : undefined,
        emotion_text: role.emotionMethod === 'text' ? role.emotionText || undefined : undefined,
        emotion_audio_path: role.emotionMethod === 'audio' ? role.emotionAudioPath || undefined : undefined,
        emo_alpha: role.emoAlpha,
        temperature: role.temperature,
        top_p: role.topP,
        top_k: role.topK,
        num_beams: 3,
        repetition_penalty: 10.0,
        max_mel_tokens: 600,
      };

      return new Promise<string | null>((resolve) => {
        const { promise } = ttsApi.synthesizeStream(req, {
          onComplete: (evt) => resolve(evt.outputPath),
          onError: () => resolve(null),
        });
        promise.catch(() => resolve(null));
      });
    });

    void rolesStore.saveToStore();
    toast.success(`批量生成完成：${generated} 句`);
  }

  function handleEngineChange(eng: EngineMode) {
    if (rolesStore.activeRole) {
      rolesStore.updateRole(rolesStore.activeRole.id, { engine: eng });
      void rolesStore.saveToStore();
    }
  }

  async function handleExportProject() {
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const savePath = await save({
        defaultPath: `${rolesStore.currentProjectName || '丸子配音工程'}.json`,
        filters: [{ name: '丸子工程文件', extensions: ['json'] }],
      });
      if (!savePath) return;
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');
      const json = rolesStore.exportProject();
      await writeTextFile(savePath, json);
      toast.success('工程导出成功');
    } catch (err) {
      toast.warning(`导出失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function handleImportProject() {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const filePath = await open({
        filters: [{ name: '丸子工程文件', extensions: ['json'] }],
        multiple: false,
      });
      if (!filePath) return;
      const { readTextFile } = await import('@tauri-apps/plugin-fs');
      const json = await readTextFile(filePath as string);
      const result = rolesStore.importProject(json);
      void rolesStore.saveToStore();
      toast.success(`导入成功：${result.roles} 角色 · ${result.lines} 句台词`);
    } catch (err) {
      toast.warning(`导入失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function handleExport() {
    const generated = rolesStore.lines.filter(l => l.status === '已生成' && l.audioPath);
    if (generated.length === 0) {
      toast.warning('没有已生成的音频可导出');
      return;
    }

    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const savePath = await save({
        defaultPath: `${rolesStore.currentProjectName || '多角色配音'}.wav`,
        filters: [{ name: 'WAV 音频', extensions: ['wav'] }],
      });
      if (!savePath) return;

      const { invoke } = await import('@tauri-apps/api/core');
      const segments = generated.map(l => ({
        audio_path: l.audioPath!,
        text: l.text,
        role_name: rolesStore.getRoleName(l.roleId),
      }));

      const result = await invoke<{ audio_path: string; srt_path: string | null; segment_count: number; total_duration_ms: number }>(
        'export_concat_audio',
        { segments, outputPath: savePath, gapMs: 300, generateSrt: true },
      );

      const srtMsg = result.srt_path ? ` + SRT 字幕` : '';
      toast.success(`导出完成：${result.segment_count} 段${srtMsg}，总时长 ${Math.round(result.total_duration_ms / 1000)}s`);
    } catch (err) {
      toast.warning(`导出失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
</script>

<div class="roles-page">
  <audio bind:this={audioEl} onended={handleAudioEnded} class="hidden"></audio>

  <div class="card role-panel">
    <div class="card-head">
      <h2>角色管理</h2>
      <button class="add-role-btn" onclick={() => showAddRoleModal = true}>+ 新增</button>
    </div>
    <div class="role-list">
      {#each rolesStore.roles as role (role.id)}
        {@const lineCount = rolesStore.lines.filter(l => l.roleId === role.id).length}
        {@const doneCount = rolesStore.lines.filter(l => l.roleId === role.id && l.status === '已生成').length}
        <button
          type="button"
          class="role-item"
          class:active={rolesStore.activeRoleId === role.id}
          style="--rc:{role.color}"
          onclick={() => rolesStore.selectRole(role.id)}
        >
          <span class="role-avatar">{role.name.slice(0, 1)}</span>
          <div class="role-meta">
            <div class="role-top">
              <strong>{role.name}</strong>
              <span class="pill type">{role.type}</span>
              <span class="pill eng" style="color:{engineColors[role.engine]}; background:color-mix(in srgb, {engineColors[role.engine]} 14%, transparent)">{engineLabels[role.engine]}</span>
            </div>
            <span class="role-voice">{role.voiceName}</span>
          </div>
          <div class="role-stats">
            <span class="role-count">{lineCount}</span>
            {#if doneCount > 0}<span class="role-done">{doneCount}/{lineCount}</span>{/if}
          </div>
        </button>
      {/each}
    </div>
  </div>

  <div class="card script-panel">
    <div class="card-head">
      <div class="head-left">
        <h2>{rolesStore.currentProjectName}</h2>
        <span class="head-sub">{rolesStore.roles.length} 角色 · {rolesStore.lines.length} 句</span>
      </div>
      <div class="head-actions">
        <button class="import-btn" onclick={() => showImportModal = true}>
          <Icon name="import" size={12} color="currentColor" />
          导入文本
        </button>
        <button class="import-btn" onclick={handleImportProject} title="导入工程">
          <Icon name="folder-open" size={12} color="currentColor" />
        </button>
        <button class="import-btn" onclick={handleExportProject} title="导出工程">
          <Icon name="download" size={12} color="currentColor" />
        </button>
      </div>
    </div>
    <div class="line-list">
      {#each rolesStore.pagedLines as line, idx (line.id)}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="line-card"
          class:playing={playingLineId === line.id}
          class:drag-over={dragOverIdx === idx && dragFromIdx !== idx}
          style="--lc:{rolesStore.getRoleColor(line.roleId)}"
          role="listitem"
          draggable="true"
          ondragstart={(e) => handleDragStart(e, idx)}
          ondragover={(e) => handleDragOver(e, idx)}
          ondrop={(e) => handleDrop(e, idx)}
          ondragend={handleDragEnd}
        >
          <span class="lc-avatar" style="background:{rolesStore.getRoleColor(line.roleId)}">{rolesStore.getRoleName(line.roleId).slice(0, 1)}</span>
          <div class="lc-content">
            <div class="lc-header">
              <span class="lc-role-name">{rolesStore.getRoleName(line.roleId)}</span>
              <span class="lc-emotion">{line.emotion} · {line.strength}</span>
            </div>
            <input class="lc-text" value={line.text} onchange={(e) => rolesStore.updateLine(line.id, { text: (e.target as HTMLInputElement).value })} />
          </div>
          <div class="lc-right">
            <span class="pill st {line.status}">{line.status}</span>
            <button class="lc-play" onclick={() => handleTryPlay(line.id)} title="试听/生成">
              <Icon name={playingLineId === line.id ? 'pause-fill' : 'play-fill'} size={14} color="currentColor" />
            </button>
          </div>
        </div>
      {/each}
      {#if rolesStore.lines.length === 0}
        <div class="line-empty">
          <Icon name="file-text" size={28} color="var(--color-text-quaternary)" />
          <span>暂无台词，点击"导入文本"开始</span>
        </div>
      {/if}
    </div>
    <div class="batch-bar">
      {#if rolesStore.batchGenerating}
        <div class="batch-progress">
          <div class="batch-fill" style="width:{rolesStore.batchProgress}%"></div>
        </div>
        <span class="batch-info">{rolesStore.batchCurrent}/{rolesStore.batchTotal}</span>
        <button class="ibtn del" onclick={() => rolesStore.cancelBatch()} title="取消">
          <Icon name="close" size={11} color="currentColor" />
        </button>
      {:else}
        <button class="batch-btn" onclick={handleBatchGenerate} disabled={rolesStore.lines.length === 0}>
          <Icon name="play-fill" size={12} color="currentColor" />
          批量生成
        </button>
        <button class="export-btn" onclick={handleExport} disabled={rolesStore.lines.filter(l => l.status === '已生成').length === 0}>
          <Icon name="download" size={12} color="currentColor" />
          导出拼接
        </button>
      {/if}
    </div>
    <div class="pager">
      <span class="pi">共 {rolesStore.lines.length} 句</span>
      <div class="pbs">
        <button class="pb" disabled={rolesStore.currentPage <= 1} onclick={() => rolesStore.setPage(rolesStore.currentPage - 1)}>‹</button>
        {#each Array.from({ length: rolesStore.totalPages }, (_, i) => i + 1) as p}
          <button class="pb" class:active={rolesStore.currentPage === p} onclick={() => rolesStore.setPage(p)}>{p}</button>
        {/each}
        <button class="pb" disabled={rolesStore.currentPage >= rolesStore.totalPages} onclick={() => rolesStore.setPage(rolesStore.currentPage + 1)}>›</button>
      </div>
    </div>
  </div>

  <div class="card param-panel">
    {#if rolesStore.activeRole}
      <div class="param-hero" style="--rc:{rolesStore.activeRole.color}">
        <span class="param-avatar">{rolesStore.activeRole.name.slice(0, 1)}</span>
        <div class="param-hero-meta">
          <strong>{rolesStore.activeRole.name}</strong>
          <span class="pill type" style="--rc:{rolesStore.activeRole.color}">{rolesStore.activeRole.type}</span>
        </div>
        <button class="ibtn del" title="删除角色" onclick={() => { if (confirm(`确定删除角色「${rolesStore.activeRole?.name}」？`)) handleDeleteRole(rolesStore.activeRole!.id); }}>
          <Icon name="delete" size={12} color="currentColor" />
        </button>
      </div>
      <div class="pbody">
        <div class="psec-card">
          <div class="psec-title"><Icon name="mic" size={13} color="var(--color-primary)" /><span>音色</span></div>
          <button class="voice-card-btn" onclick={handleUploadVoice}>
            <Icon name={rolesStore.activeRole.voiceAudioPath ? 'sound-fill' : 'upload'} size={16} color={rolesStore.activeRole.voiceAudioPath ? 'var(--color-primary)' : 'var(--color-text-tertiary)'} />
            <span>{rolesStore.activeRole.voiceAudioPath ? rolesStore.activeRole.voiceName : '点击上传参考音频'}</span>
          </button>
        </div>

        <div class="psec-card">
          <div class="psec-title"><Icon name="zap" size={13} color="var(--color-primary)" /><span>引擎</span></div>
          <div class="echips">
            {#each (['lightweight', 'emotion', 'cloud'] as const) as eng}
              <button
                class="echip-btn"
                class:active={rolesStore.activeRole?.engine === eng}
                style="--ec:{engineColors[eng]}"
                onclick={() => handleEngineChange(eng)}
              >
                <Icon name={eng === 'lightweight' ? 'zap' : eng === 'emotion' ? 'heart' : 'cloud'} size={12} color="currentColor" />
                {engineLabels[eng]}
              </button>
            {/each}
          </div>
        </div>

        <div class="psec-card">
          <div class="psec-title"><Icon name="sliders" size={13} color="var(--color-primary)" /><span>采样参数</span></div>
          <div class="param-sliders">
            <div class="ps-row">
              <span class="ps-label">温度</span>
              <span class="ps-value">{rolesStore.activeRole.temperature.toFixed(1)}</span>
            </div>
            <Slider min={0} max={2} step={0.1} value={rolesStore.activeRole.temperature} onchange={(v) => { rolesStore.updateRole(rolesStore.activeRole!.id, { temperature: v }); void rolesStore.saveToStore(); }} />
            <div class="ps-row">
              <span class="ps-label">Top-P</span>
              <span class="ps-value">{rolesStore.activeRole.topP.toFixed(2)}</span>
            </div>
            <Slider min={0} max={1} step={0.05} value={rolesStore.activeRole.topP} onchange={(v) => { rolesStore.updateRole(rolesStore.activeRole!.id, { topP: v }); void rolesStore.saveToStore(); }} />
            <div class="ps-row">
              <span class="ps-label">Top-K</span>
              <span class="ps-value">{rolesStore.activeRole.topK}</span>
            </div>
            <Slider min={0} max={100} step={1} value={rolesStore.activeRole.topK} onchange={(v) => { rolesStore.updateRole(rolesStore.activeRole!.id, { topK: v }); void rolesStore.saveToStore(); }} />
            <div class="ps-row">
              <span class="ps-label">静音</span>
              <span class="ps-value">{rolesStore.activeRole.intervalSilence}ms</span>
            </div>
            <Slider min={0} max={1000} step={50} value={rolesStore.activeRole.intervalSilence} onchange={(v) => { rolesStore.updateRole(rolesStore.activeRole!.id, { intervalSilence: v }); void rolesStore.saveToStore(); }} />
          </div>
        </div>

        {#if rolesStore.activeRole.engine !== 'lightweight'}
          <div class="psec-card">
            <div class="psec-title"><Icon name="heart" size={13} color="var(--color-accent)" /><span>情感</span></div>
            <div class="param-sliders">
              <div class="ps-row">
                <span class="ps-label">方式</span>
                <div class="echips compact">
                  {#each (['slider', 'text', 'audio'] as const) as m}
                    <button class="echip-sm" class:active={rolesStore.activeRole?.emotionMethod === m} onclick={() => { rolesStore.updateRole(rolesStore.activeRole!.id, { emotionMethod: m }); void rolesStore.saveToStore(); }}>
                      {m === 'slider' ? '向量' : m === 'text' ? '文本' : '音频'}
                    </button>
                  {/each}
                </div>
              </div>
              <div class="ps-row">
                <span class="ps-label">强度</span>
                <span class="ps-value">{rolesStore.activeRole.emoAlpha.toFixed(2)}</span>
              </div>
              <Slider min={0} max={1} step={0.05} value={rolesStore.activeRole.emoAlpha} onchange={(v) => { rolesStore.updateRole(rolesStore.activeRole!.id, { emoAlpha: v }); void rolesStore.saveToStore(); }} />
            </div>
          </div>
        {/if}

        <div class="psec-stats">
          <div class="stat-item">
            <span class="stat-num">{rolesStore.lines.filter(l => l.roleId === rolesStore.activeRole?.id).length}</span>
            <span class="stat-label">台词</span>
          </div>
          <div class="stat-item done">
            <span class="stat-num">{rolesStore.lines.filter(l => l.roleId === rolesStore.activeRole?.id && l.status === '已生成').length}</span>
            <span class="stat-label">已生成</span>
          </div>
        </div>
      </div>
    {:else}
      <div class="empty-param">
        <Icon name="avatar" size={32} color="var(--color-text-quaternary)" />
        <span>选择左侧角色查看属性</span>
      </div>
    {/if}
  </div>
  <Modal bind:open={showAddRoleModal} title="新建角色" size="sm">
    <div class="add-role-form">
      <label>
        <span>角色名</span>
        <input type="text" bind:value={newRoleName} placeholder="如：林澈" />
      </label>
      <label>
        <span>类型</span>
        <select bind:value={newRoleType}>
          <option value="主角">主角</option>
          <option value="女主">女主</option>
          <option value="配角">配角</option>
          <option value="旁白">旁白</option>
        </select>
      </label>
      <label>
        <span>引擎</span>
        <select bind:value={newRoleEngine}>
          <option value="lightweight">轻量</option>
          <option value="emotion">情感</option>
          <option value="cloud">云端</option>
        </select>
      </label>
    </div>
    {#snippet footer()}
      <Button variant="default" onclick={() => showAddRoleModal = false}>取消</Button>
      <Button variant="primary" onclick={handleAddRole}>创建</Button>
    {/snippet}
  </Modal>

  <Modal bind:open={showImportModal} title="导入文本 · LLM 智能拆分" size="lg">
    <div class="import-form">
      {#if !llmConfigured}
        <div class="llm-tip">
          <Icon name="info-circle" size={14} color="var(--color-warning)" />
          <span>请先在<strong>设置 → 云端账号</strong>中配置 LLM API Key</span>
        </div>
      {/if}
      <div class="import-row">
        <label for="import-text">粘贴小说/剧本文本</label>
        <textarea id="import-text" bind:value={importText} placeholder="将文本粘贴到这里，LLM 会自动识别角色、台词、情绪…" rows={12}></textarea>
      </div>
      <div class="import-info">
        <span>当前 LLM：{appSettings.settings.llm.model}</span>
        <span>·</span>
        <span>已有 {rolesStore.roles.length} 个角色会被保留</span>
      </div>
    </div>
    {#snippet footer()}
      <Button variant="default" onclick={() => showImportModal = false}>取消</Button>
      <Button variant="primary" loading={isSplitting} disabled={!llmConfigured} onclick={handleSplitLines}>
        {isSplitting ? '拆分中…' : '智能拆分'}
      </Button>
    {/snippet}
  </Modal>
</div>

<style>
  .roles-page { flex:1; min-height:0; display:grid; grid-template-columns:240px minmax(0,1fr) 260px; gap:var(--spacing-sm); padding:15px; background:var(--color-bg-container); overflow:hidden; }
  .card { background:var(--color-bg-elevated); border:1px solid var(--color-border-secondary); border-radius:var(--border-radius-lg); display:flex; flex-direction:column; overflow:hidden; }
  .card-head { height:44px; padding:0 var(--spacing-md); border-bottom:1px solid var(--color-border-secondary); display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }
  .card-head h2 { margin:0; font-size:var(--font-size); font-weight:600; color:var(--color-text); }
  .head-left { display:flex; flex-direction:column; gap:2px; }
  .head-sub { font-size:11px; color:var(--color-text-disabled); }
  .count-badge { font-size:11px; color:var(--color-text-disabled); background:var(--color-bg-base); padding:2px 8px; border-radius:var(--border-radius-pill); }
  .hidden { display:none; }
  button { cursor:pointer; font-family:inherit; }

  .role-list { flex:1; padding:var(--spacing-sm); display:flex; flex-direction:column; gap:6px; min-height:0; overflow-y:auto; }
  .role-item { display:flex; align-items:center; gap:var(--spacing-sm); padding:var(--spacing-sm) var(--spacing-md); border:1px solid var(--color-border-secondary); border-radius:var(--border-radius); background:var(--color-bg-base); color:var(--color-text); text-align:left; transition:border-color .2s,background .2s,box-shadow .2s; min-height:56px; }
  .role-item:hover { border-color:color-mix(in srgb, var(--rc) 30%, var(--color-border)); }
  .role-item.active { border-color:var(--rc); background:color-mix(in srgb, var(--rc) 6%, var(--color-bg-base)); box-shadow:inset 3px 0 0 var(--rc); }
  .role-avatar { width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:var(--rc); color:#fff; font-weight:700; font-size:16px; flex-shrink:0; box-shadow:0 2px 8px color-mix(in srgb, var(--rc) 30%, transparent); }
  .role-meta { flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; }
  .role-top { display:flex; align-items:center; gap:4px; }
  .role-meta strong { font-size:var(--font-size-sm); font-weight:600; white-space:nowrap; }
  .role-voice { font-size:11px; color:var(--color-text-tertiary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:100%; }
  .role-stats { display:flex; flex-direction:column; align-items:center; gap:1px; flex-shrink:0; }
  .role-count { font-size:var(--font-size); font-weight:600; color:var(--color-text-secondary); font-variant-numeric:tabular-nums; }
  .role-done { font-size:9px; color:var(--color-success); font-variant-numeric:tabular-nums; }
  .pill { padding:1px 7px; border-radius:var(--border-radius-pill); font-size:10px; font-weight:500; line-height:1.7; }
  .pill.type { color:var(--rc); background:color-mix(in srgb, var(--rc) 14%, transparent); }

  .script-panel { min-width:0; }

  .line-list { flex:1; display:flex; flex-direction:column; gap:6px; padding:var(--spacing-sm); min-height:0; overflow-y:auto; }

  .line-card { display:flex; align-items:stretch; gap:var(--spacing-sm); padding:var(--spacing-sm) var(--spacing-md); border:1px solid var(--color-border-secondary); border-radius:var(--border-radius); background:var(--color-bg-base); border-left:4px solid var(--lc); transition:border-color .15s,background .15s,box-shadow .15s; }
  .line-card:hover { background:var(--color-bg-elevated); box-shadow:0 2px 8px rgba(0,0,0,.15); }
  .line-card.playing { border-color:var(--color-primary); border-left-color:var(--color-primary); background:color-mix(in srgb, var(--color-primary) 6%, transparent); }
  .line-card[draggable="true"] { cursor:grab; }
  .line-card[draggable="true"]:active { cursor:grabbing; opacity:.85; }
  .line-card.drag-over { border-top:2px solid var(--color-primary); margin-top:-2px; }

  .lc-avatar { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-size:13px; font-weight:600; flex-shrink:0; align-self:center; }

  .lc-content { flex:1; min-width:0; display:flex; flex-direction:column; gap:12px; }
  .lc-header { display:flex; align-items:center; gap:var(--spacing-xs); }
  .lc-role-name { font-size:12px; font-weight:600; color:var(--lc); white-space:nowrap; }
  .lc-emotion { font-size:11px; color:var(--color-text-disabled); white-space:nowrap; }

  .lc-text {
    width:100%;
    border: 1px solid var(--color-border-secondary);
    background: var(--color-bg-base);
    color:var(--color-text);
    font-size:var(--font-size-sm);
    font-family:inherit;
    outline:none;
    line-height:1.5;
    padding: 6px 10px;
    border-radius: var(--border-radius);
    transition: border-color var(--motion-duration-mid) var(--motion-ease-base), box-shadow var(--motion-duration-mid) var(--motion-ease-base);
  }
  .lc-text:hover { border-color: color-mix(in srgb, var(--lc) 40%, var(--color-border-secondary)); }
  .lc-text:focus { border-color: var(--lc); box-shadow: 0 0 0 2px color-mix(in srgb, var(--lc) 15%, transparent); }

  .lc-right { display:flex; flex-direction:column; align-items:center; gap:6px; flex-shrink:0; align-self:center; }
  .lc-play { width:34px; height:34px; display:flex; align-items:center; justify-content:center; border:1px solid var(--color-border-secondary); border-radius:50%; background:transparent; color:var(--color-primary); flex-shrink:0; transition:border-color .15s,background .15s,transform .1s; }
  .lc-play:hover { border-color:var(--color-primary); background:color-mix(in srgb, var(--color-primary) 10%, transparent); transform:scale(1.05); }

  .pill.st { color:var(--color-primary); background:color-mix(in srgb, var(--color-primary) 14%, transparent); flex-shrink:0; }
  .pill.st.\5DF2\751F\6210 { color:var(--color-success); background:color-mix(in srgb, var(--color-success) 14%, transparent); }
  .pill.st.\8349\7A3F { color:var(--color-warning); background:color-mix(in srgb, var(--color-warning) 14%, transparent); }
  .pill.st.\5931\8D25 { color:var(--color-error); background:color-mix(in srgb, var(--color-error) 14%, transparent); }
  .pill.st.\751F\6210\4E2D { color:var(--color-info); background:color-mix(in srgb, var(--color-info) 14%, transparent); }

  .line-empty { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:var(--spacing-sm); color:var(--color-text-disabled); font-size:var(--font-size-sm); }
  .ibtn { width:26px; height:26px; display:flex; align-items:center; justify-content:center; border:1px solid var(--color-border-secondary); border-radius:var(--border-radius-sm); background:transparent; color:var(--color-text-tertiary); transition:border-color .15s,color .15s; }
  .ibtn:hover { border-color:var(--color-primary); color:var(--color-primary); }
  .ibtn.del:hover { border-color:var(--color-error); color:var(--color-error); }

  .pager { display:flex; align-items:center; justify-content:space-between; padding:var(--spacing-xs) var(--spacing-sm); border-top:1px solid var(--color-border-secondary); flex-shrink:0; }
  .pi { font-size:10px; color:var(--color-text-disabled); }
  .pbs { display:flex; gap:3px; }
  .pb { width:24px; height:24px; display:flex; align-items:center; justify-content:center; border:1px solid var(--color-border-secondary); border-radius:var(--border-radius-sm); background:transparent; color:var(--color-text-tertiary); font-size:11px; transition:border-color .15s,color .15s,background .15s; }
  .pb:hover:not(:disabled) { border-color:var(--color-primary); color:var(--color-primary); }
  .pb.active { background:var(--color-primary); border-color:var(--color-primary); color:#fff; }
  .pb:disabled { opacity:.35; cursor:not-allowed; }

  .param-panel { min-width:0; }

  .param-hero { display:flex; align-items:center; gap:var(--spacing-sm); padding:var(--spacing-md); border-bottom:1px solid var(--color-border-secondary); background:linear-gradient(135deg, color-mix(in srgb, var(--rc) 12%, transparent) 0%, transparent 60%); flex-shrink:0; }
  .param-avatar { width:40px; height:40px; border-radius:var(--border-radius); display:flex; align-items:center; justify-content:center; background:var(--rc); color:#fff; font-weight:700; font-size:17px; flex-shrink:0; }
  .param-hero-meta { flex:1; min-width:0; display:flex; align-items:center; gap:var(--spacing-xs); }
  .param-hero-meta strong { font-size:var(--font-size); color:var(--color-text); }

  .pbody { flex:1; padding:var(--spacing-sm); display:flex; flex-direction:column; gap:var(--spacing-sm); min-height:0; overflow-y:auto; }

  .psec-card { padding:var(--spacing-sm); background:var(--color-bg-base); border:1px solid var(--color-border-secondary); border-radius:var(--border-radius); display:flex; flex-direction:column; gap:var(--spacing-sm); }
  .psec-title { display:flex; align-items:center; gap:var(--spacing-xs); font-size:12px; color:var(--color-text-secondary); font-weight:500; }

  .voice-card-btn { display:flex; align-items:center; gap:var(--spacing-sm); height:36px; padding:0 var(--spacing-sm); border:1px dashed var(--color-border); border-radius:var(--border-radius-sm); background:transparent; color:var(--color-text-secondary); font-size:12px; transition:border-color .15s,color .15s; width:100%; }
  .voice-card-btn:hover { border-color:var(--color-primary); color:var(--color-primary); }

  .echips { display:flex; gap:4px; }
  .echip-btn { flex:1; height:30px; display:flex; align-items:center; justify-content:center; gap:4px; padding:0; border:1px solid var(--color-border-secondary); border-radius:var(--border-radius-sm); background:transparent; color:var(--color-text-tertiary); font-size:11px; transition:border-color .15s,color .15s,background .15s; }
  .echip-btn.active { color:var(--ec); border-color:var(--ec); background:color-mix(in srgb, var(--ec) 14%, transparent); }
  .echip-btn:hover:not(.active) { border-color:var(--ec); color:var(--ec); }

  .param-sliders { display:flex; flex-direction:column; gap:2px; }
  .ps-row { display:flex; justify-content:space-between; align-items:center; font-size:12px; color:var(--color-text-tertiary); padding:2px 0; }
  .ps-label { color:var(--color-text-secondary); }
  .ps-value { color:var(--color-primary); font-variant-numeric:tabular-nums; font-weight:500; }
  .echips.compact { display:flex; gap:2px; }
  .echip-sm { height:22px; padding:0 8px; border:1px solid var(--color-border-secondary); border-radius:var(--border-radius-sm); background:transparent; color:var(--color-text-tertiary); font-size:11px; transition:border-color .15s,background .15s,color .15s; }
  .echip-sm.active { border-color:var(--color-accent); background:color-mix(in srgb, var(--color-accent) 12%, transparent); color:var(--color-accent); }
  .echip-sm:hover:not(.active) { border-color:var(--color-accent); color:var(--color-accent); }

  .psec-stats { display:grid; grid-template-columns:1fr 1fr; gap:var(--spacing-xs); margin-top:auto; padding-top:var(--spacing-xs); }
  .stat-item { display:flex; flex-direction:column; align-items:center; gap:2px; padding:var(--spacing-sm); background:var(--color-bg-base); border:1px solid var(--color-border-secondary); border-radius:var(--border-radius); }
  .stat-num { font-size:var(--font-size-xl); font-weight:600; color:var(--color-text); font-variant-numeric:tabular-nums; }
  .stat-item.done .stat-num { color:var(--color-success); }
  .stat-label { font-size:10px; color:var(--color-text-disabled); }

  .empty-param { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:var(--spacing-sm); color:var(--color-text-disabled); font-size:var(--font-size-sm); }

  .batch-bar { display:flex; align-items:center; gap:var(--spacing-sm); padding:var(--spacing-xs) var(--spacing-sm); border-top:1px solid var(--color-border-secondary); flex-shrink:0; }
  .batch-btn { display:flex; align-items:center; gap:4px; height:28px; padding:0 var(--spacing-md); border:none; border-radius:var(--border-radius-sm); background:var(--color-primary); color:#fff; font-size:12px; font-weight:500; transition:background .15s; }
  .batch-btn:hover:not(:disabled) { background:var(--color-primary-hover); }
  .batch-btn:disabled { opacity:.4; cursor:not-allowed; }
  .export-btn { display:flex; align-items:center; gap:4px; height:28px; padding:0 var(--spacing-md); border:1px solid var(--color-border-secondary); border-radius:var(--border-radius-sm); background:transparent; color:var(--color-text-secondary); font-size:12px; transition:border-color .15s,color .15s; }
  .export-btn:hover:not(:disabled) { border-color:var(--color-primary); color:var(--color-primary); }
  .export-btn:disabled { opacity:.4; cursor:not-allowed; }
  .batch-progress { flex:1; height:4px; background:var(--color-border); border-radius:2px; overflow:hidden; }
  .batch-fill { height:100%; background:linear-gradient(90deg,var(--color-primary),var(--color-primary-hover)); border-radius:2px; transition:width .3s; }
  .batch-info { font-size:11px; color:var(--color-text-tertiary); font-variant-numeric:tabular-nums; }

  .import-btn { display:flex; align-items:center; gap:4px; height:28px; padding:0 var(--spacing-sm); border:1px solid var(--color-border-secondary); border-radius:var(--border-radius-sm); background:transparent; color:var(--color-primary); font-size:12px; transition:border-color .15s,background .15s; }
  .import-btn:hover { border-color:var(--color-primary); background:var(--color-primary-bg); }
  .head-actions { display:flex; gap:3px; }

  .import-form { display:flex; flex-direction:column; gap:var(--spacing-md); }
  .import-row { display:flex; flex-direction:column; gap:4px; }
  .import-row label { font-size:var(--font-size-sm); color:var(--color-text-secondary); }
  .import-row textarea { width:100%; padding:var(--spacing-sm); border:1px solid var(--color-border-secondary); border-radius:var(--border-radius-sm); background:var(--color-bg-base); color:var(--color-text); font-family:inherit; font-size:var(--font-size-sm); resize:vertical; }
  .import-row textarea:focus { border-color:var(--color-primary); outline:none; }
  .llm-tip { display:flex; align-items:center; gap:var(--spacing-xs); padding:var(--spacing-sm); background:var(--color-warning-bg); border-radius:var(--border-radius-sm); font-size:var(--font-size-sm); color:var(--color-warning); }
  .llm-tip strong { color:var(--color-text); }
  .import-info { display:flex; align-items:center; gap:var(--spacing-xs); font-size:11px; color:var(--color-text-disabled); }

  .voice-btn { border:1px solid var(--color-border-secondary); border-radius:var(--border-radius-sm); background:var(--color-bg-base); color:var(--color-primary); font-size:11px; padding:2px 8px; height:24px; transition:border-color .15s; }
  .voice-btn:hover { border-color:var(--color-primary); }

  .add-role-btn { height:24px; padding:0 8px; border:1px solid var(--color-border-secondary); border-radius:var(--border-radius-sm); background:transparent; color:var(--color-primary); font-size:11px; transition:border-color .15s,background .15s; }
  .add-role-btn:hover { border-color:var(--color-primary); background:var(--color-primary-bg); }

  .add-role-form { display:flex; flex-direction:column; gap:var(--spacing-md); }
  .add-role-form label { display:flex; flex-direction:column; gap:4px; font-size:var(--font-size-sm); color:var(--color-text-secondary); }
  .add-role-form input, .add-role-form select { height:36px; border:1px solid var(--color-border-secondary); border-radius:var(--border-radius-sm); background:var(--color-bg-base); color:var(--color-text); padding:0 var(--spacing-sm); font-family:inherit; font-size:var(--font-size-sm); }
  .add-role-form input:focus, .add-role-form select:focus { border-color:var(--color-primary); outline:none; }
</style>
