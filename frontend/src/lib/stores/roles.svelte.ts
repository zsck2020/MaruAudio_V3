import type { EngineMode } from '$lib/types/dubbing';

export type EmotionStrength = '微弱' | '中等' | '强烈';
export type LineStatus = '待生成' | '生成中' | '已生成' | '草稿' | '失败';

export interface RoleConfig {
  id: string;
  name: string;
  type: string;
  color: string;
  voiceName: string;
  voiceAudioPath: string | null;
  engine: EngineMode;
  temperature: number;
  topP: number;
  topK: number;
  intervalSilence: number;
  maxTextTokens: number;
  emoAlpha: number;
  emotionMethod: 'slider' | 'text' | 'audio';
  emotionVector: number[];
  emotionText: string;
  emotionAudioPath: string | null;
}

export interface ScriptLine {
  id: string;
  roleId: string;
  text: string;
  emotion: string;
  strength: EmotionStrength;
  status: LineStatus;
  audioPath: string | null;
  order: number;
}

export interface ProjectConfig {
  id: string;
  name: string;
  description: string;
  roleIds: string[];
  createdAt: number;
  updatedAt: number;
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const defaultRole: Omit<RoleConfig, 'id' | 'name' | 'color'> = {
  type: '配角',
  voiceName: '未选择',
  voiceAudioPath: null,
  engine: 'lightweight',
  temperature: 1.0,
  topP: 0.8,
  topK: 30,
  intervalSilence: 200,
  maxTextTokens: 120,
  emoAlpha: 0.6,
  emotionMethod: 'slider',
  emotionVector: [0, 0, 0, 0, 0, 0, 0, 0.5],
  emotionText: '',
  emotionAudioPath: null,
};

const roleColors = ['#3b6eaf', '#8B5CF6', '#e0924a', '#36a890', '#c05770', '#4a8c5c', '#7c6ec4', '#2d8e9e'];

let roles = $state<RoleConfig[]>([]);
let lines = $state<ScriptLine[]>([]);
let activeRoleId = $state<string | null>(null);
let currentProjectId = $state<string | null>(null);
let currentProjectName = $state('新项目');

let activeRole = $derived(roles.find(r => r.id === activeRoleId) ?? null);
let currentPage = $state(1);
const pageSize = 15;
let totalPages = $derived(Math.max(1, Math.ceil(lines.length / pageSize)));
let pagedLines = $derived(lines.slice((currentPage - 1) * pageSize, currentPage * pageSize));

// 派生统计索引：避免模板内对全量 lines 反复 filter（台词量大时显著降开销）
let lineStatsByRole = $derived.by(() => {
  const m = new Map<string, { total: number; done: number; failed: number }>();
  for (const l of lines) {
    const s = m.get(l.roleId) ?? { total: 0, done: 0, failed: 0 };
    s.total++;
    if (l.status === '已生成') s.done++;
    else if (l.status === '失败') s.failed++;
    m.set(l.roleId, s);
  }
  return m;
});
let generatedCount = $derived(lines.filter(l => l.status === '已生成').length);
let failedCount = $derived(lines.filter(l => l.status === '失败').length);
let pendingCount = $derived(lines.filter(l => l.status !== '已生成').length);

function createRole(name: string, type = '配角'): RoleConfig {
  const color = roleColors[roles.length % roleColors.length];
  const role: RoleConfig = { ...defaultRole, id: generateId(), name, color, type };
  roles = [...roles, role];
  if (!activeRoleId) activeRoleId = role.id;
  return role;
}

function updateRole(id: string, updates: Partial<RoleConfig>): void {
  roles = roles.map(r => r.id === id ? { ...r, ...updates } : r);
}

function deleteRole(id: string): void {
  roles = roles.filter(r => r.id !== id);
  lines = lines.map(l => l.roleId === id ? { ...l, roleId: '' } : l);
  if (activeRoleId === id) activeRoleId = roles[0]?.id ?? null;
}

function addLine(roleId: string, text: string, emotion = '平静', strength: EmotionStrength = '中等'): ScriptLine {
  const line: ScriptLine = {
    id: generateId(),
    roleId,
    text,
    emotion,
    strength,
    status: '待生成',
    audioPath: null,
    order: lines.length + 1,
  };
  lines = [...lines, line];
  return line;
}

function updateLine(id: string, updates: Partial<ScriptLine>): void {
  lines = lines.map(l => l.id === id ? { ...l, ...updates } : l);
}

function deleteLine(id: string): void {
  lines = lines.filter(l => l.id !== id);
  lines = lines.map((l, i) => ({ ...l, order: i + 1 }));
}

function reorderLines(fromIndex: number, toIndex: number): void {
  if (fromIndex === toIndex) return;
  const arr = [...lines];
  const [moved] = arr.splice(fromIndex, 1);
  arr.splice(toIndex, 0, moved);
  lines = arr.map((l, i) => ({ ...l, order: i + 1 }));
}

function clearLines(): void {
  lines = [];
}

function importLines(data: Array<{ role_name: string; text_content: string; emotion_name: string; strength_name: string }>): void {
  for (const item of data) {
    let role = roles.find(r => r.name === item.role_name);
    if (!role) {
      const type = item.role_name === '旁白' ? '旁白' : '配角';
      role = createRole(item.role_name, type);
    }
    const strength = (['微弱', '中等', '强烈'].includes(item.strength_name) ? item.strength_name : '中等') as EmotionStrength;
    addLine(role.id, item.text_content, item.emotion_name, strength);
  }
}

function getRoleName(roleId: string): string {
  return roles.find(r => r.id === roleId)?.name ?? '未知';
}

function getRoleColor(roleId: string): string {
  return roles.find(r => r.id === roleId)?.color ?? 'var(--color-text-tertiary)';
}

function getRoleEngine(roleId: string): EngineMode {
  return roles.find(r => r.id === roleId)?.engine ?? 'lightweight';
}

function selectRole(id: string): void {
  activeRoleId = id;
}

function setPage(page: number): void {
  currentPage = Math.max(1, Math.min(page, totalPages));
}

function setProjectName(name: string): void {
  currentProjectName = name;
}

let batchGenerating = $state(false);
let batchProgress = $state(0);
let batchTotal = $state(0);
let batchCurrent = $state(0);
let batchCancelRequested = $state(false);

async function batchGenerate(
  synthesizeFn: (line: ScriptLine, role: RoleConfig) => Promise<string | null>,
  onProgress?: (current: number, total: number) => void,
): Promise<number> {
  const pendingLines = lines.filter(l => l.status !== '已生成');
  if (pendingLines.length === 0) return 0;

  batchGenerating = true;
  batchTotal = pendingLines.length;
  batchCurrent = 0;
  batchCancelRequested = false;
  let generated = 0;

  for (const line of pendingLines) {
    if (batchCancelRequested) break;

    const role = roles.find(r => r.id === line.roleId);
    if (!role?.voiceAudioPath) {
      updateLine(line.id, { status: '失败' });
      batchCurrent++;
      continue;
    }

    updateLine(line.id, { status: '生成中' });

    try {
      const audioPath = await synthesizeFn(line, role);
      if (audioPath) {
        updateLine(line.id, { status: '已生成', audioPath });
        generated++;
      } else {
        updateLine(line.id, { status: '失败' });
      }
    } catch {
      updateLine(line.id, { status: '失败' });
    }

    batchCurrent++;
    batchProgress = Math.round((batchCurrent / batchTotal) * 100);
    onProgress?.(batchCurrent, batchTotal);
  }

  batchGenerating = false;
  return generated;
}

function cancelBatch(): void {
  batchCancelRequested = true;
}

async function saveToStore(): Promise<void> {
  try {
    const { Store } = await import('@tauri-apps/plugin-store');
    const store = await Store.load('roles.json');
    await store.set('roles', roles);
    await store.set('lines', lines);
    await store.set('projectName', currentProjectName);
    await store.save();
  } catch {
    // 非 Tauri 环境或保存失败静默处理
  }
}

function exportProject(): string {
  return JSON.stringify({
    version: 1,
    projectName: currentProjectName,
    roles,
    lines,
    exportedAt: Date.now(),
  }, null, 2);
}

function importProject(json: string): { roles: number; lines: number } {
  const data = JSON.parse(json);
  if (!data.roles || !Array.isArray(data.roles)) throw new Error('无效的工程文件');
  roles = data.roles;
  lines = data.lines ?? [];
  currentProjectName = data.projectName ?? '导入的工程';
  activeRoleId = roles[0]?.id ?? null;
  currentPage = 1;
  return { roles: roles.length, lines: lines.length };
}

async function loadFromStore(): Promise<boolean> {
  try {
    const { Store } = await import('@tauri-apps/plugin-store');
    const store = await Store.load('roles.json');
    const savedRoles = await store.get<RoleConfig[]>('roles');
    const savedLines = await store.get<ScriptLine[]>('lines');
    const savedName = await store.get<string>('projectName');
    if (savedRoles && savedRoles.length > 0) {
      roles = savedRoles;
      activeRoleId = roles[0]?.id ?? null;
    }
    if (savedLines) lines = savedLines;
    if (savedName) currentProjectName = savedName;
    return (savedRoles?.length ?? 0) > 0;
  } catch {
    return false;
  }
}

export const rolesStore = {
  get roles() { return roles; },
  get lines() { return lines; },
  get pagedLines() { return pagedLines; },
  get generatedCount() { return generatedCount; },
  get failedCount() { return failedCount; },
  get pendingCount() { return pendingCount; },
  roleLineStats(roleId: string) { return lineStatsByRole.get(roleId) ?? { total: 0, done: 0, failed: 0 }; },
  get activeRoleId() { return activeRoleId; },
  get activeRole() { return activeRole; },
  get currentPage() { return currentPage; },
  get totalPages() { return totalPages; },
  get pageSize() { return pageSize; },
  get currentProjectName() { return currentProjectName; },

  createRole,
  updateRole,
  deleteRole,
  addLine,
  updateLine,
  deleteLine,
  clearLines,
  reorderLines,
  importLines,
  getRoleName,
  getRoleColor,
  getRoleEngine,
  selectRole,
  setPage,
  setProjectName,
  get batchGenerating() { return batchGenerating; },
  get batchProgress() { return batchProgress; },
  get batchTotal() { return batchTotal; },
  get batchCurrent() { return batchCurrent; },
  batchGenerate,
  cancelBatch,
  exportProject,
  importProject,
  saveToStore,
  loadFromStore,
};
