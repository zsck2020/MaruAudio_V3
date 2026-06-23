import { toast } from '$lib/stores/toast.svelte';
import { Store } from '@tauri-apps/plugin-store';

export type PlanId = 'free' | 'flagship' | 'creator_year' | 'team';

export type FeatureKey =
  | 'emotion_engine'
  | 'cloud_engine'
  | 'batch_generation'
  | 'multi_role'
  | 'line_editing'
  | 'smart_split'
  | 'advanced_params'
  | 'watermark_free'
  | 'wav_export'
  | 'subtitle_pro'
  | 'glossary'
  | 'acceleration'
  | 'team_license'
  | 'cloud_chars';

export interface PlanInfo {
  id: PlanId;
  name: string;
  shortName: string;
  price: string;
  badge: string;
  description: string;
}

export interface FeatureInfo {
  key: FeatureKey;
  title: string;
  badge: '旗舰' | '云端字符' | '团队';
  icon: string;
  description: string;
  bullets: string[];
  requiredPlan?: PlanId;
}

export interface UsageRecord {
  id: string;
  date: string;
  type: 'local' | 'cloud';
  engine: string;
  chars: number;
  lines: number;
  label: string;
}

interface MembershipAccount {
  plan: PlanId;
  dailyCharsUsed: number;
  dailyQuota: number;
  dailyResetDate: string;
  cloudBalance: number;
  devicesUsed: number;
  devicesLimit: number;
  totalCloudUsed: number;
  totalLocalUsed: number;
  usageHistory: UsageRecord[];
}

export const PLAN_INFO: Record<PlanId, PlanInfo> = {
  free: {
    id: 'free',
    name: '免费版',
    shortName: '免费',
    price: '¥0',
    badge: '免费',
    description: '每天 3,000 字符，体验轻量引擎与基础工作流',
  },
  flagship: {
    id: 'flagship',
    name: '旗舰版',
    shortName: '旗舰',
    price: '¥198 永久',
    badge: '旗舰',
    description: '本地双引擎无限生成，多角色、批量、无水印完整开放',
  },
  creator_year: {
    id: 'creator_year',
    name: '创作者年卡',
    shortName: '年卡',
    price: '¥199/年',
    badge: '年卡',
    description: '旗舰权益 + 每月云端赠额，适合稳定使用云端的创作者',
  },
  team: {
    id: 'team',
    name: '团队版',
    shortName: '团队',
    price: '¥999/年起',
    badge: '团队',
    description: '多设备授权、商用凭证、团队字符折扣与优先支持',
  },
};

export const FEATURE_INFO: Record<FeatureKey, FeatureInfo> = {
  emotion_engine: {
    key: 'emotion_engine',
    title: '情感引擎',
    badge: '旗舰',
    icon: 'heart',
    description: '解锁更自然的情绪表达，适合短剧、有声书和剧情类口播。',
    bullets: ['本地情感引擎无限生成', '8 维情绪精调', '无水印商用导出'],
    requiredPlan: 'flagship',
  },
  cloud_engine: {
    key: 'cloud_engine',
    title: '云端引擎',
    badge: '云端字符',
    icon: 'cloud',
    description: '电脑跑不动或需要赶稿时，用云端引擎快速完成高质量生成。',
    bullets: ['不占本地显存', '按字符使用', '本地引擎永不扣字符'],
    requiredPlan: 'flagship',
  },
  batch_generation: {
    key: 'batch_generation',
    title: '批量生成',
    badge: '旗舰',
    icon: 'rocket',
    description: '长文本一键生成，失败项可重试，适合连续交付。',
    bullets: ['全文批量生成', '失败自动重试', '段级进度反馈'],
    requiredPlan: 'flagship',
  },
  multi_role: {
    key: 'multi_role',
    title: '多角色配音',
    badge: '旗舰',
    icon: 'team',
    description: '为短剧、广播剧和有声书创建多角色台词工程。',
    bullets: ['无限角色', '台词级角色绑定', '角色独立音色与情绪'],
    requiredPlan: 'flagship',
  },
  line_editing: {
    key: 'line_editing',
    title: '台词行级编辑',
    badge: '旗舰',
    icon: 'edit',
    description: '逐句控制角色、情绪和强度，精修每一句台词。',
    bullets: ['逐行角色切换', '逐行情绪强度', '单句重生成'],
    requiredPlan: 'flagship',
  },
  smart_split: {
    key: 'smart_split',
    title: 'LLM 智能拆分',
    badge: '旗舰',
    icon: 'snippets',
    description: '自动识别角色、台词和情绪，长文本导入更省心。',
    bullets: ['角色识别', '情绪推断', '自定义 Prompt 模板'],
    requiredPlan: 'flagship',
  },
  advanced_params: {
    key: 'advanced_params',
    title: '高级参数',
    badge: '旗舰',
    icon: 'sliders',
    description: '开放采样、长音频和推理参数，便于精细打磨声音。',
    bullets: ['Top-P / Top-K / 温度', '长音频参数', '更细的停顿控制'],
    requiredPlan: 'flagship',
  },
  watermark_free: {
    key: 'watermark_free',
    title: '无水印导出',
    badge: '旗舰',
    icon: 'unlock',
    description: '导出干净音频，适合商业发布与客户交付。',
    bullets: ['去除尾部语音水印', '个人商用授权', '干净交付素材'],
    requiredPlan: 'flagship',
  },
  wav_export: {
    key: 'wav_export',
    title: 'WAV 无损导出',
    badge: '旗舰',
    icon: 'download',
    description: '导出更高品质的无损音频，适合剪辑和后期制作。',
    bullets: ['WAV 无损', 'MP3 多码率', '后期友好'],
    requiredPlan: 'flagship',
  },
  subtitle_pro: {
    key: 'subtitle_pro',
    title: '字幕增强',
    badge: '旗舰',
    icon: 'subtitle',
    description: '字幕翻译和时间轴优化适合视频发布工作流。',
    bullets: ['字幕翻译', '时间轴优化', 'SRT / VTT / ASS'],
    requiredPlan: 'flagship',
  },
  glossary: {
    key: 'glossary',
    title: '术语词汇表',
    badge: '旗舰',
    icon: 'tags',
    description: '统一人名、地名、生僻字和品牌词读法。',
    bullets: ['专有名词读法', '生僻字纠正', '项目级复用'],
    requiredPlan: 'flagship',
  },
  acceleration: {
    key: 'acceleration',
    title: '加速推理',
    badge: '旗舰',
    icon: 'thunder-fill',
    description: '开放高级加速开关，给独显用户更多性能空间。',
    bullets: ['半精度推理', '并行任务', '显存上限控制'],
    requiredPlan: 'flagship',
  },
  team_license: {
    key: 'team_license',
    title: '团队授权',
    badge: '团队',
    icon: 'usergroup',
    description: '面向工作室和代运营团队的多设备商用授权。',
    bullets: ['3 台设备起', '团队商用凭证', '大额字符折扣'],
    requiredPlan: 'team',
  },
  cloud_chars: {
    key: 'cloud_chars',
    title: '云端字符包',
    badge: '云端字符',
    icon: 'wallet',
    description: '云端引擎按字符扣减，单独购买的字符永不过期。',
    bullets: ['1 万字 ¥9.9 起', '失败自动返还', '本地生成不扣字符'],
    requiredPlan: 'flagship',
  },
};

// 会员态仅为「客户端缓存」，权威校验必须在服务端完成（见 redeemCardKey / syncFromServer 注释）。
// 仅当显式设置 VITE_DEV_PLAN（如 .env.local）时才覆盖默认套餐，避免任何 build 模式（含误打的 dev 包）自动解锁付费。
const _FORCE_PLAN = import.meta.env.VITE_DEV_PLAN as PlanId | undefined;
const _DEV_DEFAULT_PLAN: PlanId =
  _FORCE_PLAN === 'flagship' || _FORCE_PLAN === 'creator_year' || _FORCE_PLAN === 'team'
    ? _FORCE_PLAN
    : 'free';

let account = $state<MembershipAccount>({
  plan: _DEV_DEFAULT_PLAN,
  dailyCharsUsed: 0,
  dailyQuota: _DEV_DEFAULT_PLAN === 'free' ? 3000 : Number.POSITIVE_INFINITY,
  dailyResetDate: todayKey(),
  cloudBalance: _DEV_DEFAULT_PLAN === 'free' ? 0 : 100000,
  devicesUsed: 1,
  devicesLimit: _DEV_DEFAULT_PLAN === 'free' ? 1 : 2,
  totalCloudUsed: 0,
  totalLocalUsed: 0,
  usageHistory: [],
});

let upgradeFeatureKey = $state<FeatureKey | null>(null);
let initPromise: Promise<void> | null = null;
let store: Store | null = null;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

async function getStore(): Promise<Store> {
  if (!store) {
    store = await Store.load('membership.json');
  }
  return store;
}

function normalizeAccount(saved: Partial<MembershipAccount> | null | undefined): MembershipAccount {
  const base: MembershipAccount = {
    plan: 'free',
    dailyCharsUsed: 0,
    dailyQuota: 3000,
    dailyResetDate: todayKey(),
    cloudBalance: 0,
    devicesUsed: 1,
    devicesLimit: 1,
    totalCloudUsed: 0,
    totalLocalUsed: 0,
    usageHistory: [],
  };
  const next = { ...base, ...saved };
  if (next.dailyResetDate !== todayKey()) {
    next.dailyResetDate = todayKey();
    next.dailyCharsUsed = 0;
  }
  next.dailyQuota = next.plan === 'free' ? 3000 : Number.POSITIVE_INFINITY;
  next.devicesLimit = next.plan === 'team' ? 3 : next.plan === 'free' ? 1 : 2;
  if (!Array.isArray(next.usageHistory)) next.usageHistory = [];
  return next;
}

async function saveAccount(): Promise<void> {
  try {
    const s = await getStore();
    await s.set('account', account);
    await s.save();
  } catch {
    // 浏览器预览或 store 不可用时仅保留内存态
  }
}

async function init(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        const s = await getStore();
        const saved = await s.get<MembershipAccount>('account');
        account = normalizeAccount(saved);
        // 仅当显式配置 VITE_DEV_PLAN 时套用强制套餐（开发自测用），默认不解锁任何付费能力
        if (_DEV_DEFAULT_PLAN !== 'free' && account.plan === 'free') {
          account.plan = _DEV_DEFAULT_PLAN;
          account.dailyQuota = Number.POSITIVE_INFINITY;
          account.cloudBalance = Math.max(account.cloudBalance, 100000);
          account.devicesLimit = _DEV_DEFAULT_PLAN === 'team' ? 3 : 2;
        }
        await saveAccount();
      } catch {
        account = normalizeAccount(account);
      }
    })();
  }
  return initPromise;
}

function ensureDailyReset(): void {
  if (account.dailyResetDate === todayKey()) return;
  account.dailyResetDate = todayKey();
  account.dailyCharsUsed = 0;
  void saveAccount();
}

function isPaidPlan(plan: PlanId = account.plan): boolean {
  return plan !== 'free';
}

function isTeamPlan(plan: PlanId = account.plan): boolean {
  return plan === 'team';
}

function canUseFeature(feature: FeatureKey): boolean {
  ensureDailyReset();
  if (feature === 'team_license') return isTeamPlan();
  if (feature === 'cloud_chars') return isPaidPlan();
  return isPaidPlan();
}

function requestUpgrade(feature: FeatureKey): void {
  upgradeFeatureKey = feature;
}

function closeUpgrade(): void {
  upgradeFeatureKey = null;
}

function setPlan(plan: PlanId): void {
  account.plan = plan;
  account.dailyQuota = plan === 'free' ? 3000 : Number.POSITIVE_INFINITY;
  account.devicesLimit = plan === 'team' ? 3 : plan === 'free' ? 1 : 2;
  if (plan === 'creator_year' && account.cloudBalance < 30000) account.cloudBalance = 30000;
  void saveAccount();
  toast.success(`已切换为${PLAN_INFO[plan].name}演示状态`);
}

function estimateCloudChars(text: string): number {
  return text.replace(/\s/g, '').length;
}

function trackDailyChars(chars: number): void {
  ensureDailyReset();
  if (account.plan === 'free') {
    account.dailyCharsUsed += Math.max(0, chars);
    void saveAccount();
  }
}

function addCloudChars(chars: number): void {
  account.cloudBalance += Math.max(0, chars);
  void saveAccount();
}

function deductCloudChars(chars: number): boolean {
  const amount = Math.max(0, chars);
  if (account.cloudBalance < amount) return false;
  account.cloudBalance -= amount;
  account.totalCloudUsed += amount;
  void saveAccount();
  return true;
}

function recordUsage(entry: Omit<UsageRecord, 'id' | 'date'>): void {
  const record: UsageRecord = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    date: new Date().toISOString(),
  };
  account.usageHistory = [record, ...account.usageHistory].slice(0, 200);
  if (entry.type === 'local') {
    account.totalLocalUsed += entry.chars;
  }
  void saveAccount();
}

function canGenerateLocal(chars: number): boolean {
  ensureDailyReset();
  return account.plan !== 'free' || chars <= Math.max(0, account.dailyQuota - account.dailyCharsUsed);
}

function canGenerateCloud(chars: number): boolean {
  return isPaidPlan() && account.cloudBalance >= chars;
}

async function logout(): Promise<void> {
  account = normalizeAccount({ plan: 'free', cloudBalance: 0, dailyCharsUsed: 0 });
  void saveAccount();
}

async function redeemCardKey(key: string): Promise<{ ok: boolean; message: string }> {
  // 演示性本地兑换：正式版必须改为「服务端核销卡密 → 返回带签名的授权令牌 → 前端缓存」，
  // 前端不得自行判定升级结果（当前实现仅用于无服务端时的本地演示）。
  const trimmed = key.trim().toUpperCase();
  if (!trimmed || trimmed.length < 8) {
    return { ok: false, message: '请输入有效的卡密' };
  }
  await new Promise(r => setTimeout(r, 800));
  if (trimmed.startsWith('MARU-VIP')) {
    setPlan('flagship');
    return { ok: true, message: '兑换成功！已升级为旗舰版' };
  }
  if (trimmed.startsWith('MARU-CLOUD')) {
    addCloudChars(50000);
    return { ok: true, message: '兑换成功！已充值 50,000 云端字符' };
  }
  return { ok: false, message: '卡密无效或已被使用' };
}

export const membership = {
  get account() { return account; },
  get plan() { return PLAN_INFO[account.plan]; },
  get isPaid() { return isPaidPlan(); },
  get isTeam() { return isTeamPlan(); },
  get dailyRemaining() {
    ensureDailyReset();
    if (account.plan !== 'free') return Number.POSITIVE_INFINITY;
    return Math.max(0, account.dailyQuota - account.dailyCharsUsed);
  },
  get dailyPercent() {
    ensureDailyReset();
    if (account.plan !== 'free') return 0;
    return Math.min(100, Math.round((account.dailyCharsUsed / account.dailyQuota) * 100));
  },
  get upgradeFeatureKey() { return upgradeFeatureKey; },
  get upgradeFeature() { return upgradeFeatureKey ? FEATURE_INFO[upgradeFeatureKey] : null; },
  get upgradeOpen() { return upgradeFeatureKey !== null; },
  get totalLocalUsed() { return account.totalLocalUsed; },
  get totalCloudUsed() { return account.totalCloudUsed; },
  get usageHistory() { return account.usageHistory; },
  init,
  canUseFeature,
  requestUpgrade,
  closeUpgrade,
  setPlan,
  estimateCloudChars,
  trackDailyChars,
  addCloudChars,
  deductCloudChars,
  recordUsage,
  canGenerateLocal,
  canGenerateCloud,
  logout,
  redeemCardKey,
};
