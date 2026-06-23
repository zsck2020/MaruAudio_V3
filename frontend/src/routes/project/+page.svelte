<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';
  import { rolesStore, type EmotionStrength } from '$lib/stores/roles.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import * as ttsApi from '$lib/api/tts';
  import { convertFileSrc } from '@tauri-apps/api/core';
  import type { EngineMode } from '$lib/types/dubbing';
  import Modal from '$lib/components/ui/Modal.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import Slider from '$lib/components/ui/Slider.svelte';
  import MiniPlayer from '$lib/components/ui/MiniPlayer.svelte';
  import TabParamControl from '$lib/components/dubbing/TabParamControl.svelte';
  import TabEmotionControl from '$lib/components/dubbing/TabEmotionControl.svelte';
  import { dubbing } from '$lib/stores/dubbing.svelte';
  import { appSettings } from '$lib/stores/settings.svelte';
  import { membership, type FeatureKey } from '$lib/stores/membership.svelte';
  import PermissionBadge from '$lib/components/membership/PermissionBadge.svelte';
  import { requireGeneratePermission } from '$lib/utils/entitlements';

  const engineLabels: Record<EngineMode, string> = { lightweight: '轻量', emotion: '情感', cloud: '云端' };
  const engineColors: Record<EngineMode, string> = { lightweight: 'var(--color-primary)', emotion: 'var(--color-accent)', cloud: 'var(--color-info)' };
  const emotions = ['平静', '开心', '悲伤', '愤怒', '紧张', '惊讶', '冷漠', '坚定', '害怕'];
  const strengths: EmotionStrength[] = ['微弱', '中等', '强烈'];
  const ROLE_TYPE_OPTIONS = [
    { value: '主角', label: '主角' },
    { value: '女主', label: '女主' },
    { value: '配角', label: '配角' },
    { value: '旁白', label: '旁白' },
  ];
  const ENGINE_OPTIONS = [
    { value: 'lightweight', label: '轻量' },
    { value: 'emotion', label: '情感' },
    { value: 'cloud', label: '云端' },
  ];
  const EMOTION_OPTIONS = emotions.map((e) => ({ value: e, label: e }));
  const STRENGTH_OPTIONS = strengths.map((s) => ({ value: s, label: s }));

  function roleOptionsFor(roleId: string) {
    const opts = rolesStore.roles.map((r) => ({ value: r.id, label: r.name }));
    if (!rolesStore.roles.find((r) => r.id === roleId)) {
      opts.push({ value: roleId, label: '未知' });
    }
    return opts;
  }

  let playingLineId = $state<string | null>(null);
  let playingLineSrc = $state('');
  let playingLineText = $state('');

  let showImportModal = $state(false);
  let importText = $state('');
  let isSplitting = $state(false);
  let showPromptEditor = $state(false);
  let customPrompt = $state('');

  let dragFromIdx = $state<number | null>(null);
  let dragOverIdx = $state<number | null>(null);

  function handleDragStart(e: DragEvent, idx: number) {
    if (!requireFeature('line_editing')) {
      e.preventDefault();
      return;
    }
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

  function requireFeature(feature: FeatureKey): boolean {
    if (membership.canUseFeature(feature)) return true;
    membership.requestUpgrade(feature);
    return false;
  }

  async function handleSplitLines() {
    if (!requireFeature('smart_split')) return;
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
        custom_prompt: customPrompt.trim() || undefined,
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

  function buildEmotionParams(role: import('$lib/stores/roles.svelte').RoleConfig, line: import('$lib/stores/roles.svelte').ScriptLine) {
    const useLineEmotion = role.engine !== 'lightweight' && line.emotion && line.emotion !== '平静';
    if (useLineEmotion) {
      const emotionDesc = `${line.emotion}，${line.strength}程度`;
      return {
        emotion_method: 'text' as const,
        emotion_vector: undefined,
        emotion_text: emotionDesc,
        emotion_audio_path: undefined,
        emo_alpha: role.emoAlpha,
      };
    }
    return {
      emotion_method: role.emotionMethod,
      emotion_vector: role.emotionMethod === 'slider' ? role.emotionVector : undefined,
      emotion_text: role.emotionMethod === 'text' ? role.emotionText || undefined : undefined,
      emotion_audio_path: role.emotionMethod === 'audio' ? role.emotionAudioPath || undefined : undefined,
      emo_alpha: role.emoAlpha,
    };
  }

  function buildSynthRequest(role: import('$lib/stores/roles.svelte').RoleConfig, line: import('$lib/stores/roles.svelte').ScriptLine): ttsApi.SynthesizeRequest {
    const emo = buildEmotionParams(role, line);
    return {
      engine: role.engine,
      text: line.text,
      speaker_audio_path: role.voiceAudioPath!,
      inference_mode: 'normal',
      interval_silence: role.intervalSilence,
      max_text_tokens_per_segment: role.maxTextTokens,
      bucket_max_size: 4,
      ...emo,
      temperature: role.temperature,
      top_p: role.topP,
      top_k: role.topK,
      num_beams: 3,
      repetition_penalty: 10.0,
      // 按角色绑定的引擎切换 mel token 上限（v1.5=600 / v2.0+=1500）
      max_mel_tokens: role.engine === 'lightweight' ? 600 : 1500,
    };
  }

  async function handleTryPlay(lineId: string) {
    const line = rolesStore.lines.find(l => l.id === lineId);
    if (!line) return;

    if (line.audioPath) {
      playingLineId = lineId;
      playingLineSrc = line.audioPath;
      playingLineText = line.text.slice(0, 20);
      return;
    }

    const role = rolesStore.roles.find(r => r.id === line.roleId);
    if (!role?.voiceAudioPath) {
      toast.warning(`角色「${role?.name ?? '未知'}」未绑定参考音频`);
      return;
    }
    if (role.engine === 'emotion' && !requireFeature('emotion_engine')) return;
    if (role.engine === 'cloud' && !requireFeature('cloud_engine')) return;
    if (!requireGeneratePermission(role.engine, line.text.replace(/\s/g, '').length)) return;

    rolesStore.updateLine(lineId, { status: '生成中' });

    try {
      const req = buildSynthRequest(role, line);

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
    playingLineSrc = '';
    playingLineText = '';
  }

  let showVoiceModal = $state(false);
  let showAddRoleModal = $state(false);
  let showPresetPicker = $state(false);
  let presetVoices = $state<ttsApi.PresetVoice[]>([]);
  let presetLoading = $state(false);

  async function handleOpenPresetPicker() {
    showPresetPicker = true;
    if (presetVoices.length > 0) return;
    presetLoading = true;
    try {
      const result = await ttsApi.listPresets();
      presetVoices = result.presets ?? [];
    } catch {
      toast.warning('加载预置音色库失败');
    } finally {
      presetLoading = false;
    }
  }

  function handleSelectPreset(preset: ttsApi.PresetVoice) {
    if (!rolesStore.activeRole) return;
    rolesStore.updateRole(rolesStore.activeRole.id, {
      voiceName: preset.name,
      voiceAudioPath: preset.file_path,
    });
    void rolesStore.saveToStore();
    showPresetPicker = false;
    toast.success(`已绑定音色：${preset.name}`);
  }
  let showParamModal = $state(false);
  let showEmotionModal = $state(false);

  function syncRoleToDubbing() {
    const role = rolesStore.activeRole;
    if (!role) return;
    dubbing.setEngine(role.engine);
    dubbing.temperature = role.temperature;
    dubbing.topP = role.topP;
    dubbing.topK = role.topK;
    dubbing.intervalSilence = role.intervalSilence;
    dubbing.maxTextTokens = role.maxTextTokens;
    dubbing.emoAlpha = role.emoAlpha;
    dubbing.emotionMethod = role.emotionMethod;
    if (role.emotionVector.length === 8) {
      dubbing.emotionSliders = {
        happy: role.emotionVector[0], angry: role.emotionVector[1],
        sad: role.emotionVector[2], afraid: role.emotionVector[3],
        disgusted: role.emotionVector[4], melancholic: role.emotionVector[5],
        surprised: role.emotionVector[6], calm: role.emotionVector[7],
      };
    }
    dubbing.emotionText = role.emotionText;
  }

  function syncDubbingToRole() {
    const role = rolesStore.activeRole;
    if (!role) return;
    rolesStore.updateRole(role.id, {
      temperature: dubbing.temperature,
      topP: dubbing.topP,
      topK: dubbing.topK,
      intervalSilence: dubbing.intervalSilence,
      maxTextTokens: dubbing.maxTextTokens,
      emoAlpha: dubbing.emoAlpha,
      emotionMethod: dubbing.emotionMethod,
      emotionVector: [
        dubbing.emotionSliders.happy, dubbing.emotionSliders.angry,
        dubbing.emotionSliders.sad, dubbing.emotionSliders.afraid,
        dubbing.emotionSliders.disgusted, dubbing.emotionSliders.melancholic,
        dubbing.emotionSliders.surprised, dubbing.emotionSliders.calm,
      ],
      emotionText: dubbing.emotionText,
    });
    void rolesStore.saveToStore();
  }

  function openParamModal() {
    if (!requireFeature('advanced_params')) return;
    syncRoleToDubbing();
    showParamModal = true;
  }

  function closeParamModal() {
    syncDubbingToRole();
    showParamModal = false;
  }

  function openEmotionModal() {
    if (!requireFeature('emotion_engine')) return;
    syncRoleToDubbing();
    showEmotionModal = true;
  }

  function closeEmotionModal() {
    syncDubbingToRole();
    showEmotionModal = false;
  }

  let newRoleName = $state('');
  let newRoleType = $state('配角');
  let newRoleEngine = $state<EngineMode>('emotion');

  function handleAddRole() {
    if (rolesStore.roles.length >= 1 && !requireFeature('multi_role')) return;
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
    if (!requireFeature('multi_role')) return;
    rolesStore.deleteRole(id);
    void rolesStore.saveToStore();
    toast.success('角色已删除');
  }

  function handleDeleteLine(id: string) {
    if (!requireFeature('line_editing')) return;
    rolesStore.deleteLine(id);
    void rolesStore.saveToStore();
  }

  function handleAddLine() {
    if (!requireFeature('line_editing')) return;
    const roleId = rolesStore.activeRoleId || rolesStore.roles[0]?.id;
    if (!roleId) { toast.warning('请先创建角色'); return; }
    rolesStore.addLine(roleId, '', '平静', '中等');
    const lastPage = Math.max(1, Math.ceil(rolesStore.lines.length / rolesStore.pageSize));
    rolesStore.setPage(lastPage);
    void rolesStore.saveToStore();
  }

  async function handleBatchGenerate() {
    if (!requireFeature('batch_generation')) return;
    const pending = rolesStore.lines.filter(l => l.status !== '已生成').length;
    if (pending === 0) { toast.info('所有台词已生成'); return; }

    const generated = await rolesStore.batchGenerate(async (line, role) => {
      if (!requireGeneratePermission(role.engine, line.text.replace(/\s/g, '').length)) return null;
      const req = buildSynthRequest(role, line);

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

  function handleRetryFailed() {
    for (const line of rolesStore.lines) {
      if (line.status === '失败') {
        rolesStore.updateLine(line.id, { status: '待生成', audioPath: null });
      }
    }
    void rolesStore.saveToStore();
    void handleBatchGenerate();
  }

  function handleEngineChange(eng: EngineMode) {
    if (eng === 'emotion' && !requireFeature('emotion_engine')) return;
    if (eng === 'cloud' && !requireFeature('cloud_engine')) return;
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
    if (!requireFeature('watermark_free')) return;
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

  <div class="card role-panel">
    <div class="card-head">
      <h2>角色管理 <PermissionBadge feature="multi_role" locked={!membership.canUseFeature('multi_role')} compact /></h2>
      <button class="add-role-btn" onclick={() => { if (requireFeature('multi_role')) showAddRoleModal = true; }}>+ 新增</button>
    </div>
    <div class="role-list">
      {#each rolesStore.roles as role (role.id)}
        {@const lineCount = rolesStore.roleLineStats(role.id).total}
        {@const doneCount = rolesStore.roleLineStats(role.id).done}
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
        <span class="head-sub">
          {rolesStore.roles.length} 角色 · {rolesStore.lines.length} 句
          {#if !membership.canUseFeature('line_editing')}
            · <PermissionBadge feature="line_editing" locked compact />
          {/if}
        </span>
      </div>
      <div class="head-actions">
        <button class="import-btn" onclick={() => { if (requireFeature('smart_split')) showImportModal = true; }}>
          <Icon name="import" size={12} color="currentColor" />
          导入文本
          <PermissionBadge feature="smart_split" locked={!membership.canUseFeature('smart_split')} compact />
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
          class:locked={!membership.canUseFeature('line_editing')}
          style="--lc:{rolesStore.getRoleColor(line.roleId)}"
          role="listitem"
          draggable={membership.canUseFeature('line_editing')}
          ondragstart={(e) => handleDragStart(e, idx)}
          ondragover={(e) => handleDragOver(e, idx)}
          ondrop={(e) => handleDrop(e, idx)}
          ondragend={handleDragEnd}
        >
          <span class="lc-avatar" style="background:{rolesStore.getRoleColor(line.roleId)}">{rolesStore.getRoleName(line.roleId).slice(0, 1)}</span>
          <div class="lc-content">
            <div class="lc-header">
              <Select class="lc-role-sel" hideArrow value={line.roleId} disabled={!membership.canUseFeature('line_editing')} options={roleOptionsFor(line.roleId)} onchange={(v) => { rolesStore.updateLine(line.id, { roleId: v }); void rolesStore.saveToStore(); }} />
              <Select class="lc-emo-sel" hideArrow value={line.emotion} disabled={!membership.canUseFeature('line_editing')} options={EMOTION_OPTIONS} onchange={(v) => { rolesStore.updateLine(line.id, { emotion: v, status: line.status === '已生成' ? '待生成' : line.status, audioPath: line.status === '已生成' ? null : line.audioPath }); void rolesStore.saveToStore(); }} />
              <Select class="lc-str-sel" hideArrow value={line.strength} disabled={!membership.canUseFeature('line_editing')} options={STRENGTH_OPTIONS} onchange={(v) => { rolesStore.updateLine(line.id, { strength: v as EmotionStrength, status: line.status === '已生成' ? '待生成' : line.status, audioPath: line.status === '已生成' ? null : line.audioPath }); void rolesStore.saveToStore(); }} />
              <span class="pill st {line.status}">{line.status}</span>
            </div>
            <div class="lc-text-row">
              <input class="lc-text" value={line.text} disabled={!membership.canUseFeature('line_editing')} onclick={() => !membership.canUseFeature('line_editing') && membership.requestUpgrade('line_editing')} onchange={(e) => { rolesStore.updateLine(line.id, { text: (e.target as HTMLInputElement).value }); void rolesStore.saveToStore(); }} />
              <button class="lc-play" onclick={() => handleTryPlay(line.id)} title="试听/生成">
                <Icon name={playingLineId === line.id ? 'pause-fill' : 'play-fill'} size={14} color="currentColor" />
              </button>
              <button class="ibtn del" onclick={() => { if (!membership.canUseFeature('line_editing')) { membership.requestUpgrade('line_editing'); return; } if (confirm('删除这句台词？')) handleDeleteLine(line.id); }} title="删除台词">
                <Icon name="close" size={10} color="currentColor" />
              </button>
            </div>
          </div>
        </div>
      {/each}
      {#if rolesStore.lines.length === 0}
        <div class="line-empty">
          <Icon name="file-text" size={28} color="var(--color-text-quaternary)" />
          <span>暂无台词，点击"导入文本"或"添加台词"开始</span>
          <button class="add-line-btn" onclick={handleAddLine}>+ 添加台词</button>
        </div>
      {/if}
      {#if rolesStore.lines.length > 0}
        <button class="add-line-inline" onclick={handleAddLine} title="添加台词">
          <Icon name="plus" size={11} color="currentColor" />
          <span>添加台词</span>
        </button>
      {/if}
    </div>
    {#if playingLineSrc}
      <div class="preview-player">
        <MiniPlayer src={playingLineSrc} label={playingLineText} onEnded={handleAudioEnded} height={28} />
      </div>
    {/if}
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
        {@const failedCount = rolesStore.failedCount}
        <button class="batch-btn" onclick={handleBatchGenerate} disabled={rolesStore.lines.length === 0}>
          <Icon name="play-fill" size={12} color="currentColor" />
          批量生成
          <PermissionBadge feature="batch_generation" locked={!membership.canUseFeature('batch_generation')} compact />
        </button>
        {#if failedCount > 0}
          <button class="retry-btn" onclick={handleRetryFailed} title="重试失败项">
            <Icon name="refresh" size={12} color="currentColor" />
            重试 {failedCount} 项
          </button>
        {/if}
        <button class="export-btn" onclick={handleExport} disabled={rolesStore.generatedCount === 0}>
          <Icon name="download" size={12} color="currentColor" />
          导出拼接
          <PermissionBadge feature="watermark_free" locked={!membership.canUseFeature('watermark_free')} compact />
        </button>
      {/if}
    </div>
    <div class="pager">
      <span class="pi">共 {rolesStore.lines.length} 句 · 第 {rolesStore.currentPage}/{rolesStore.totalPages} 页</span>
      <div class="pbs">
        <button class="pb" disabled={rolesStore.currentPage <= 1} onclick={() => rolesStore.setPage(rolesStore.currentPage - 1)}>‹</button>
        {#if rolesStore.totalPages <= 7}
          {#each Array.from({ length: rolesStore.totalPages }, (_, i) => i + 1) as p}
            <button class="pb" class:active={rolesStore.currentPage === p} onclick={() => rolesStore.setPage(p)}>{p}</button>
          {/each}
        {:else}
          <button class="pb" class:active={rolesStore.currentPage === 1} onclick={() => rolesStore.setPage(1)}>1</button>
          {#if rolesStore.currentPage > 3}<span class="pb-dots">…</span>{/if}
          {#each Array.from({ length: 3 }, (_, i) => rolesStore.currentPage - 1 + i).filter(p => p > 1 && p < rolesStore.totalPages) as p}
            <button class="pb" class:active={rolesStore.currentPage === p} onclick={() => rolesStore.setPage(p)}>{p}</button>
          {/each}
          {#if rolesStore.currentPage < rolesStore.totalPages - 2}<span class="pb-dots">…</span>{/if}
          <button class="pb" class:active={rolesStore.currentPage === rolesStore.totalPages} onclick={() => rolesStore.setPage(rolesStore.totalPages)}>{rolesStore.totalPages}</button>
        {/if}
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
            <span>{rolesStore.activeRole.voiceAudioPath ? rolesStore.activeRole.voiceName : '上传参考音频'}</span>
          </button>
          <button class="voice-card-btn" onclick={handleOpenPresetPicker}>
            <Icon name="library" size={16} color="var(--color-info)" />
            <span>从音库选择</span>
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
                {#if eng === 'emotion'}
                  <PermissionBadge feature="emotion_engine" locked={!membership.canUseFeature('emotion_engine')} compact />
                {:else if eng === 'cloud'}
                  <PermissionBadge feature="cloud_engine" locked={!membership.canUseFeature('cloud_engine')} compact />
                {/if}
              </button>
            {/each}
          </div>
        </div>

        <button type="button" class="psec-card psec-clickable" onclick={openParamModal}>
          <div class="psec-title"><Icon name="sliders" size={13} color="var(--color-primary)" /><span>参数设置</span><Icon name="ant-design:right-outlined" size={10} color="var(--color-text-tertiary)" /></div>
          <div class="psec-summary">温度 {rolesStore.activeRole.temperature.toFixed(1)} · Top-P {rolesStore.activeRole.topP.toFixed(1)} · Top-K {rolesStore.activeRole.topK} · 静音 {rolesStore.activeRole.intervalSilence}ms</div>
        </button>

        {#if rolesStore.activeRole.engine !== 'lightweight'}
          <button type="button" class="psec-card psec-clickable" onclick={openEmotionModal}>
            <div class="psec-title"><Icon name="heart" size={13} color="var(--color-accent)" /><span>情感控制</span><Icon name="ant-design:right-outlined" size={10} color="var(--color-text-tertiary)" /></div>
            <div class="psec-summary">{rolesStore.activeRole.emotionMethod === 'slider' ? '向量模式' : rolesStore.activeRole.emotionMethod === 'text' ? '文本模式' : '音频模式'} · 强度 {rolesStore.activeRole.emoAlpha.toFixed(1)}</div>
          </button>
        {/if}

        <div class="psec-stats">
          <div class="stat-item">
            <span class="stat-num">{rolesStore.activeRole ? rolesStore.roleLineStats(rolesStore.activeRole.id).total : 0}</span>
            <span class="stat-label">台词</span>
          </div>
          <div class="stat-item done">
            <span class="stat-num">{rolesStore.activeRole ? rolesStore.roleLineStats(rolesStore.activeRole.id).done : 0}</span>
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
        <Select block bind:value={newRoleType} ariaLabel="角色类型" options={ROLE_TYPE_OPTIONS} />
      </label>
      <label>
        <span>引擎</span>
        <Select block value={newRoleEngine} ariaLabel="角色引擎" options={ENGINE_OPTIONS} onchange={(v) => (newRoleEngine = v as EngineMode)} />
      </label>
    </div>
    {#snippet footer()}
      <Button variant="default" onclick={() => showAddRoleModal = false}>取消</Button>
      <Button variant="primary" onclick={handleAddRole}>创建</Button>
    {/snippet}
  </Modal>

  <Modal bind:open={showPresetPicker} title="选择预置音色" size="md">
    <div class="preset-grid">
      {#if presetLoading}
        <div class="line-empty"><span>加载中…</span></div>
      {:else if presetVoices.length === 0}
        <div class="line-empty"><span>暂无预置音色，请先在资源页导入</span></div>
      {:else}
        {#each presetVoices as preset (preset.name)}
          <button class="preset-item" onclick={() => handleSelectPreset(preset)}>
            <Icon name="sound-fill" size={14} color="var(--color-primary)" />
            <span class="preset-name">{preset.name}</span>
            {#if preset.description}<span class="preset-desc">{preset.description}</span>{/if}
          </button>
        {/each}
      {/if}
    </div>
  </Modal>

  <Modal open={showParamModal} title="参数设置{rolesStore.activeRole ? ` · ${rolesStore.activeRole.name}` : ''}" size="md" icon="sliders" onClose={closeParamModal}>
    <TabParamControl />
  </Modal>

  <Modal open={showEmotionModal} title="情感控制{rolesStore.activeRole ? ` · ${rolesStore.activeRole.name}` : ''}" size="md" icon="heart" onClose={closeEmotionModal}>
    <TabEmotionControl />
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
        <button class="prompt-toggle" onclick={() => showPromptEditor = !showPromptEditor}>
          {showPromptEditor ? '收起 Prompt' : '自定义 Prompt'}
        </button>
      </div>
      {#if showPromptEditor}
        <div class="import-row">
          <label for="custom-prompt">自定义拆分 Prompt（留空使用内置模板，可用变量：{'{roles}'} {'{emotions}'} {'{strengths}'} {'{text}'}）</label>
          <textarea id="custom-prompt" bind:value={customPrompt} placeholder="留空使用内置拆分 Prompt…" rows={6}></textarea>
        </div>
      {/if}
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
  .roles-page { flex:1; min-height:0; display:grid; grid-template-columns:clamp(180px, 20vw, 240px) minmax(0,1fr) clamp(220px, 24vw, 300px); gap:var(--spacing-sm); padding:15px; background:var(--color-bg-container); overflow:hidden; }
  @media (max-width: 900px) {
    .roles-page { grid-template-columns:1fr; grid-template-rows:auto 1fr auto; overflow:hidden; }
    .roles-page .role-panel { max-height:180px; }
    .roles-page .param-panel { max-height:260px; overflow:hidden; }
  }
  .card { background:var(--color-bg-elevated); border:1px solid var(--color-border-secondary); border-radius:var(--border-radius-lg); display:flex; flex-direction:column; overflow:hidden; }
  .card-head { height:44px; padding:0 var(--spacing-md); border-bottom:1px solid var(--color-border-secondary); display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }
  .card-head h2 { margin:0; font-size:var(--font-size); font-weight:600; color:var(--color-text); display:flex; align-items:center; gap:6px; }
  .head-left { display:flex; flex-direction:column; gap:2px; }
  .head-sub { font-size:var(--font-size-xs); color:var(--color-text-disabled); display:flex; align-items:center; gap:4px; }
  .count-badge { font-size:var(--font-size-xs); color:var(--color-text-disabled); background:var(--color-bg-base); padding:2px 8px; border-radius:var(--border-radius-pill); }
  .hidden { display:none; }
  button { cursor:pointer; font-family:inherit; }

  .role-list { flex:1; padding:var(--spacing-sm); display:flex; flex-direction:column; gap:6px; min-height:0; overflow:hidden; }
  .role-item { display:flex; align-items:center; gap:var(--spacing-sm); padding:var(--spacing-sm) var(--spacing-md); border:1px solid var(--color-border-secondary); border-radius:var(--border-radius); background:var(--color-bg-base); color:var(--color-text); text-align:left; transition:border-color .2s,background .2s,box-shadow .2s; min-height:56px; min-width:0; }
  @media (max-width: 900px) {
    .role-list { flex-direction:row; flex-wrap:wrap; overflow-x:auto; overflow-y:hidden; }
    .role-item { min-width:160px; flex:0 0 auto; }
  }
  .role-item:hover { border-color:color-mix(in srgb, var(--rc) 30%, var(--color-border)); }
  .role-item.active { border-color:var(--rc); background:color-mix(in srgb, var(--rc) 6%, var(--color-bg-base)); box-shadow:inset 3px 0 0 var(--rc); }
  .role-avatar { width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:var(--rc); color:#fff; font-weight:700; font-size:16px; flex-shrink:0; box-shadow:0 2px 8px color-mix(in srgb, var(--rc) 30%, transparent); }
  .role-meta { flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; }
  .role-top { display:flex; align-items:center; gap:4px; }
  .role-meta strong { font-size:var(--font-size-sm); font-weight:600; white-space:nowrap; }
  .role-voice { font-size:var(--font-size-xs); color:var(--color-text-tertiary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:100%; }
  .role-stats { display:flex; flex-direction:column; align-items:center; gap:1px; flex-shrink:0; }
  .role-count { font-size:var(--font-size); font-weight:600; color:var(--color-text-secondary); font-variant-numeric:tabular-nums; }
  .role-done { font-size:9px; color:var(--color-success); font-variant-numeric:tabular-nums; }
  .pill { padding:1px 7px; border-radius:var(--border-radius-pill); font-size:var(--font-size-2xs); font-weight:500; line-height:1.7; }
  .pill.type { color:var(--rc); background:color-mix(in srgb, var(--rc) 14%, transparent); }

  .script-panel { min-width:0; }

  .line-list { flex:1; display:flex; flex-direction:column; gap:6px; padding:var(--spacing-sm); min-height:0; overflow:hidden; }

  .line-card { display:flex; align-items:stretch; gap:var(--spacing-sm); padding:var(--spacing-sm) var(--spacing-md); border:1px solid var(--color-border-secondary); border-radius:var(--border-radius); background:var(--color-bg-base); border-left:4px solid var(--lc); transition:border-color .15s,background .15s,box-shadow .15s; }
  .line-card:hover { background:var(--color-bg-elevated); box-shadow:var(--shadow-1); }
  .line-card.playing { border-color:var(--color-primary); border-left-color:var(--color-primary); background:color-mix(in srgb, var(--color-primary) 6%, transparent); }
  .line-card.locked { background:linear-gradient(135deg, color-mix(in srgb, var(--color-warning) 5%, transparent), transparent 45%), var(--color-bg-base); }
  .line-card[draggable="true"] { cursor:grab; }
  .line-card[draggable="true"]:active { cursor:grabbing; opacity:.85; }
  .line-card.drag-over { border-top:2px solid var(--color-primary); margin-top:-2px; }

  .lc-avatar { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-size:13px; font-weight:600; flex-shrink:0; align-self:center; }

  .lc-content { flex:1; min-width:0; display:flex; flex-direction:column; gap:12px; }
  .lc-header { display:flex; align-items:center; gap:var(--spacing-xs); }
  .lc-role-name { font-size:var(--font-size-xs); font-weight:600; color:var(--lc); white-space:nowrap; }
  .lc-emotion { font-size:var(--font-size-xs); color:var(--color-text-disabled); white-space:nowrap; }
  :global(.ui-select.lc-role-sel), :global(.ui-select.lc-emo-sel), :global(.ui-select.lc-str-sel) { min-width:0; }
  :global(.ui-select.lc-role-sel select), :global(.ui-select.lc-emo-sel select), :global(.ui-select.lc-str-sel select) { height:22px; padding:0 4px; border:1px solid transparent; border-radius:var(--border-radius-sm); background:transparent; font-family:inherit; font-size:var(--font-size-xs); cursor:pointer; outline:none; transition:border-color .15s,background .15s; }
  :global(.ui-select.lc-role-sel) { max-width:80px; }
  :global(.ui-select.lc-emo-sel) { max-width:60px; }
  :global(.ui-select.lc-str-sel) { max-width:50px; }
  :global(.ui-select.lc-role-sel select) { font-weight:600; color:var(--lc); }
  :global(.ui-select.lc-emo-sel select) { color:var(--color-text-secondary); }
  :global(.ui-select.lc-str-sel select) { color:var(--color-text-disabled); }
  :global(.ui-select.lc-role-sel select:hover), :global(.ui-select.lc-emo-sel select:hover), :global(.ui-select.lc-str-sel select:hover) { border-color:var(--color-border-secondary); background:var(--color-bg-base); }
  :global(.ui-select.lc-role-sel select:focus), :global(.ui-select.lc-emo-sel select:focus), :global(.ui-select.lc-str-sel select:focus) { border-color:var(--color-primary); background:var(--color-bg-base); }

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
  .add-line-btn { height:30px; padding:0 16px; border:1px dashed var(--color-primary); border-radius:var(--border-radius-sm); background:transparent; color:var(--color-primary); font-size:var(--font-size-xs); cursor:pointer; transition:background .15s; }
  .add-line-btn:hover { background:var(--color-primary-bg); }
  .add-line-inline { display:flex; align-items:center; justify-content:center; gap:4px; height:28px; border:1px dashed var(--color-border-secondary); border-radius:var(--border-radius-sm); background:transparent; color:var(--color-text-disabled); font-size:var(--font-size-xs); cursor:pointer; transition:border-color .15s,color .15s; flex-shrink:0; }
  .add-line-inline:hover { border-color:var(--color-primary); color:var(--color-primary); }
  .lc-actions { display:flex; gap:4px; align-items:center; }
  .ibtn { width:26px; height:26px; display:flex; align-items:center; justify-content:center; border:1px solid var(--color-border-secondary); border-radius:var(--border-radius-sm); background:transparent; color:var(--color-text-tertiary); transition:border-color .15s,color .15s; }
  .ibtn:hover { border-color:var(--color-primary); color:var(--color-primary); }
  .ibtn.del:hover { border-color:var(--color-error); color:var(--color-error); }

  .pager { display:flex; align-items:center; justify-content:space-between; padding:var(--spacing-xs) var(--spacing-sm); border-top:1px solid var(--color-border-secondary); flex-shrink:0; }
  .pi { font-size:var(--font-size-2xs); color:var(--color-text-disabled); }
  .pbs { display:flex; gap:3px; }
  .pb { width:24px; height:24px; display:flex; align-items:center; justify-content:center; border:1px solid var(--color-border-secondary); border-radius:var(--border-radius-sm); background:transparent; color:var(--color-text-tertiary); font-size:var(--font-size-xs); transition:border-color .15s,color .15s,background .15s; }
  .pb:hover:not(:disabled) { border-color:var(--color-primary); color:var(--color-primary); }
  .pb.active { background:var(--color-primary); border-color:var(--color-primary); color:#fff; }
  .pb:disabled { opacity:.35; cursor:not-allowed; }
  .pb-dots { font-size:var(--font-size-xs); color:var(--color-text-disabled); padding:0 2px; }

  .param-panel { min-width:0; }

  .param-hero { display:flex; align-items:center; gap:var(--spacing-sm); padding:var(--spacing-md); border-bottom:1px solid var(--color-border-secondary); background:linear-gradient(135deg, color-mix(in srgb, var(--rc) 12%, transparent) 0%, transparent 60%); flex-shrink:0; }
  .param-avatar { width:40px; height:40px; border-radius:var(--border-radius); display:flex; align-items:center; justify-content:center; background:var(--rc); color:#fff; font-weight:700; font-size:17px; flex-shrink:0; }
  .param-hero-meta { flex:1; min-width:0; display:flex; align-items:center; gap:var(--spacing-xs); }
  .param-hero-meta strong { font-size:var(--font-size); color:var(--color-text); }

  .pbody { flex:1; padding:var(--spacing-sm); display:flex; flex-direction:column; gap:var(--spacing-sm); min-height:0; overflow:hidden; }

  .psec-card { padding:var(--spacing-sm); background:var(--color-bg-base); border:1px solid var(--color-border-secondary); border-radius:var(--border-radius); display:flex; flex-direction:column; gap:var(--spacing-sm); }
  .psec-title { display:flex; align-items:center; gap:var(--spacing-xs); font-size:var(--font-size-xs); color:var(--color-text-secondary); font-weight:500; }

  .voice-card-btn { display:flex; align-items:center; gap:var(--spacing-sm); height:36px; padding:0 var(--spacing-sm); border:1px dashed var(--color-border); border-radius:var(--border-radius-sm); background:transparent; color:var(--color-text-secondary); font-size:var(--font-size-xs); transition:border-color .15s,color .15s; width:100%; }
  .voice-card-btn:hover { border-color:var(--color-primary); color:var(--color-primary); }

  .echips { display:flex; gap:4px; }
  .echip-btn { flex:1; min-height:30px; display:flex; align-items:center; justify-content:center; gap:4px; padding:0 4px; border:1px solid var(--color-border-secondary); border-radius:var(--border-radius-sm); background:transparent; color:var(--color-text-tertiary); font-size:var(--font-size-xs); transition:border-color .15s,color .15s,background .15s; }
  .echip-btn.active { color:var(--ec); border-color:var(--ec); background:color-mix(in srgb, var(--ec) 14%, transparent); }
  .echip-btn:hover:not(.active) { border-color:var(--ec); color:var(--ec); }

  .psec-clickable { cursor:pointer; text-align:left; transition:border-color .15s,background .15s; width:100%; }
  .psec-clickable:hover { border-color:var(--color-primary); background:color-mix(in srgb, var(--color-primary) 5%, var(--color-bg-base)); }
  .psec-summary { font-size:var(--font-size-xs); color:var(--color-text-disabled); }
  .psec-title :global(svg:last-child) { margin-left:auto; }

  .echips.compact { display:flex; gap:2px; }
  .echip-sm { height:22px; padding:0 8px; border:1px solid var(--color-border-secondary); border-radius:var(--border-radius-sm); background:transparent; color:var(--color-text-tertiary); font-size:var(--font-size-xs); transition:border-color .15s,background .15s,color .15s; }
  .echip-sm.active { border-color:var(--color-accent); background:color-mix(in srgb, var(--color-accent) 12%, transparent); color:var(--color-accent); }
  .echip-sm:hover:not(.active) { border-color:var(--color-accent); color:var(--color-accent); }
  .random-emo { margin-left:auto; display:flex; align-items:center; gap:2px; }

  .psec-stats { display:grid; grid-template-columns:1fr 1fr; gap:var(--spacing-xs); margin-top:auto; padding-top:var(--spacing-xs); }
  .stat-item { display:flex; flex-direction:column; align-items:center; gap:2px; padding:var(--spacing-sm); background:var(--color-bg-base); border:1px solid var(--color-border-secondary); border-radius:var(--border-radius); }
  .stat-num { font-size:var(--font-size-xl); font-weight:600; color:var(--color-text); font-variant-numeric:tabular-nums; }
  .stat-item.done .stat-num { color:var(--color-success); }
  .stat-label { font-size:var(--font-size-2xs); color:var(--color-text-disabled); }

  .empty-param { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:var(--spacing-sm); color:var(--color-text-disabled); font-size:var(--font-size-sm); }

  .preview-player { padding:var(--spacing-xs) var(--spacing-sm); border-top:1px solid var(--color-border-secondary); flex-shrink:0; }
  .batch-bar { display:flex; align-items:center; gap:var(--spacing-sm); padding:var(--spacing-xs) var(--spacing-sm); border-top:1px solid var(--color-border-secondary); flex-shrink:0; }
  .batch-btn { display:flex; align-items:center; gap:4px; height:28px; padding:0 var(--spacing-md); border:none; border-radius:var(--border-radius-sm); background:var(--color-primary); color:#fff; font-size:var(--font-size-xs); font-weight:500; transition:background .15s; }
  .batch-btn:hover:not(:disabled) { background:var(--color-primary-hover); }
  .batch-btn:disabled { opacity:.4; cursor:not-allowed; }
  .retry-btn { display:flex; align-items:center; gap:4px; height:28px; padding:0 var(--spacing-md); border:1px solid var(--color-warning); border-radius:var(--border-radius-sm); background:transparent; color:var(--color-warning); font-size:var(--font-size-xs); transition:border-color .15s,background .15s; }
  .retry-btn:hover { background:color-mix(in srgb, var(--color-warning) 12%, transparent); }
  .export-btn { display:flex; align-items:center; gap:4px; height:28px; padding:0 var(--spacing-md); border:1px solid var(--color-border-secondary); border-radius:var(--border-radius-sm); background:transparent; color:var(--color-text-secondary); font-size:var(--font-size-xs); transition:border-color .15s,color .15s; }
  .export-btn:hover:not(:disabled) { border-color:var(--color-primary); color:var(--color-primary); }
  .export-btn:disabled { opacity:.4; cursor:not-allowed; }
  .batch-progress { flex:1; height:4px; background:var(--color-border); border-radius:2px; overflow:hidden; }
  .batch-fill { height:100%; background:linear-gradient(90deg,var(--color-primary),var(--color-primary-hover)); border-radius:2px; transition:width .3s; }
  .batch-info { font-size:var(--font-size-xs); color:var(--color-text-tertiary); font-variant-numeric:tabular-nums; }

  .import-btn { display:flex; align-items:center; gap:4px; height:28px; padding:0 var(--spacing-sm); border:1px solid var(--color-border-secondary); border-radius:var(--border-radius-sm); background:transparent; color:var(--color-primary); font-size:var(--font-size-xs); transition:border-color .15s,background .15s; }
  .import-btn:hover { border-color:var(--color-primary); background:var(--color-primary-bg); }
  .head-actions { display:flex; gap:3px; }

  .import-form { display:flex; flex-direction:column; gap:var(--spacing-md); }
  .import-row { display:flex; flex-direction:column; gap:4px; }
  .import-row label { font-size:var(--font-size-sm); color:var(--color-text-secondary); }
  .import-row textarea { width:100%; padding:var(--spacing-sm); border:1px solid var(--color-border-secondary); border-radius:var(--border-radius-sm); background:var(--color-bg-base); color:var(--color-text); font-family:inherit; font-size:var(--font-size-sm); resize:vertical; }
  .import-row textarea:focus { border-color:var(--color-primary); outline:none; }
  .llm-tip { display:flex; align-items:center; gap:var(--spacing-xs); padding:var(--spacing-sm); background:var(--color-warning-bg); border-radius:var(--border-radius-sm); font-size:var(--font-size-sm); color:var(--color-warning); }
  .llm-tip strong { color:var(--color-text); }
  .import-info { display:flex; align-items:center; gap:var(--spacing-xs); font-size:var(--font-size-xs); color:var(--color-text-disabled); flex-wrap:wrap; }
  .prompt-toggle { margin-left:auto; border:1px solid var(--color-border-secondary); border-radius:var(--border-radius-sm); background:transparent; color:var(--color-text-tertiary); font-size:var(--font-size-xs); padding:1px 8px; cursor:pointer; transition:border-color .15s,color .15s; }
  .prompt-toggle:hover { border-color:var(--color-primary); color:var(--color-primary); }

  .voice-btn { border:1px solid var(--color-border-secondary); border-radius:var(--border-radius-sm); background:var(--color-bg-base); color:var(--color-primary); font-size:var(--font-size-xs); padding:2px 8px; height:24px; transition:border-color .15s; }
  .voice-btn:hover { border-color:var(--color-primary); }

  .add-role-btn { height:24px; padding:0 8px; border:1px solid var(--color-border-secondary); border-radius:var(--border-radius-sm); background:transparent; color:var(--color-primary); font-size:var(--font-size-xs); transition:border-color .15s,background .15s; }
  .add-role-btn:hover { border-color:var(--color-primary); background:var(--color-primary-bg); }

  .add-role-form { display:flex; flex-direction:column; gap:var(--spacing-md); }
  .add-role-form label { display:flex; flex-direction:column; gap:4px; font-size:var(--font-size-sm); color:var(--color-text-secondary); }
  .add-role-form input { height:36px; border:1px solid var(--color-border-secondary); border-radius:var(--border-radius-sm); background:var(--color-bg-base); color:var(--color-text); padding:0 var(--spacing-sm); font-family:inherit; font-size:var(--font-size-sm); }
  .add-role-form input:focus { border-color:var(--color-primary); outline:none; }

  .preset-grid { display:flex; flex-direction:column; gap:4px; max-height:360px; overflow:hidden; }
  .preset-item { display:flex; align-items:center; gap:var(--spacing-sm); padding:var(--spacing-sm) var(--spacing-md); border:1px solid var(--color-border-secondary); border-radius:var(--border-radius-sm); background:var(--color-bg-base); cursor:pointer; transition:border-color .15s,background .15s; text-align:left; }
  .preset-item:hover { border-color:var(--color-primary); background:var(--color-primary-bg); }
  .preset-name { font-size:var(--font-size-sm); font-weight:500; color:var(--color-text); flex:1; }
  .preset-desc { font-size:var(--font-size-xs); color:var(--color-text-disabled); max-width:120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
</style>
