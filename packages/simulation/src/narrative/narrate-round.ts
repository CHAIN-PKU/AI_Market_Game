import { pushEvent } from '../core/events.js';
import { getSkillById } from '../core/skills.js';
import type { GameState, MarketTask } from '../core/types.js';

const DOMAIN_ZH: Record<string, string> = {
  coding: '编程',
  research: '科研',
  design: '设计',
};

const TASK_TITLE_ZH: Record<string, string> = {
  'Build landing page': '官网落地页',
  'Fix API module': '接口模块修复',
  'Automate data pipeline': '数据流水线自动化',
  'Survey energy tech': '新能源调研',
  'Analyze market trend': '市场趋势分析',
  'Prototype material': '材料原型试做',
  'Brand identity kit': '品牌视觉套件',
  'Mobile UI flow': '手机界面流程',
  'Icon set refresh': '图标套装焕新',
};

const PLAYFUL_BID_LINES = [
  (name: string, task: string) => `${name}：「${task}」这活香，我先报个价碰碰运气～`,
  (name: string, task: string) => `${name}：盯上「${task}」了，手速准备起飞！`,
  (name: string, task: string) => `${name}：别抢别抢…好吧其实「${task}」我想接！`,
  (name: string, task: string) => `${name}：今天运势不错，「${task}」冲一波！`,
  (name: string, task: string) => `${name}：老板看看我，「${task}」我能行！`,
];

function skillLabel(skillId: string): string {
  const s = getSkillById(skillId);
  if (!s) return '新技能';
  const zh: Record<string, string> = {
    skill_coding_basic: '编程基本功',
    skill_coding_advanced: '系统架构',
    skill_research_basic: '科研方法论',
    skill_research_advanced: '实验室流程',
    skill_design_basic: '视觉构图',
    skill_design_advanced: '产品体验',
  };
  return zh[s.id] ?? s.name;
}

export function taskLabel(task: MarketTask | undefined): string {
  if (!task) return '未知订单';
  if (task.source === 'player' && task.playerTitle) return task.playerTitle;
  const base = task.title.replace(/\s*\([^)]+\)\s*$/, '').trim();
  if (TASK_TITLE_ZH[base]) return TASK_TITLE_ZH[base];
  const domain = DOMAIN_ZH[task.requirements.domain] ?? task.requirements.domain;
  return base || `${domain}订单`;
}

function findAgent(state: GameState, agentId: string | undefined) {
  if (!agentId) return undefined;
  for (const civ of state.civilizations) {
    const a = civ.agents.find((x) => x.id === agentId);
    if (a) return { agent: a, civ };
  }
  return undefined;
}

function pushStory(state: GameState, text: string, payload?: Record<string, unknown>): void {
  pushEvent(state, 'story', text, { playerLine: text, ...payload });
}

function wealthConcentration(state: GameState, civId: string): number {
  const civ = state.civilizations.find((c) => c.id === civId);
  if (!civ) return 0;
  const wallets = civ.agents.map((a) => a.wallet);
  const sum = wallets.reduce((a, b) => a + b, 0);
  if (sum <= 0) return 0;
  return Math.max(...wallets) / sum;
}

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function playfulBid(agentName: string, taskName: string, reasoning?: string): string {
  if (reasoning && reasoning.length < 80 && !reasoning.includes('Mobile UI')) {
    return `${agentName}：${reasoning}`;
  }
  const fn = PLAYFUL_BID_LINES[hashSeed(agentName + taskName) % PLAYFUL_BID_LINES.length]!;
  return fn(agentName, taskName);
}

/** 把本回合引擎日志转成玩家看得懂的故事（摘要 + 可展开细节）。 */
export function narrateRound(state: GameState, round: number): void {
  const roundEvents = state.events.filter((e) => e.round === round && e.kind !== 'story');
  const headlines: string[] = [];

  if (roundEvents.some((e) => e.kind === 'round_started')) {
    pushStory(state, `第 ${round} 天，市集开门。`, {
      storyRole: 'section',
      section: 'open',
      summary: `第 ${round} 天，市集开门。`,
      details: [] as string[],
    });
  }

  const posted = roundEvents.filter((e) => e.kind === 'task_posted');
  const playerPosts = posted.filter((e) => {
    const task = state.marketTasks.find((t) => t.id === e.payload?.taskId);
    return task?.source === 'player';
  });
  if (playerPosts.length > 0) {
    const details = playerPosts.map((e) => {
      const task = state.marketTasks.find((t) => t.id === e.payload?.taskId);
      return `你贴了悬赏「${taskLabel(task)}」，赏金 ${task?.reward ?? '?'} 金。`;
    });
    pushStory(state, details[0] ?? '你向市集投放了悬赏。', {
      storyRole: 'section',
      section: 'market',
      summary:
        playerPosts.length === 1
          ? `你投放 1 则悬赏，市集热闹起来了。`
          : `你投放 ${playerPosts.length} 则悬赏，市集热闹起来了。`,
      details,
    });
  } else if (posted.length > 0) {
    pushStory(state, `新到 ${posted.length} 单系统订单。`, {
      storyRole: 'section',
      section: 'market',
      summary: `今天新到 ${posted.length} 单活，居民开始挑单。`,
      details: [] as string[],
    });
  }

  const bids = roundEvents.filter((x) => x.kind === 'bid_placed');
  const bidsByTask = new Map<string, typeof bids>();
  for (const e of bids) {
    const taskId = e.payload?.taskId as string | undefined;
    if (!taskId) continue;
    const list = bidsByTask.get(taskId) ?? [];
    list.push(e);
    bidsByTask.set(taskId, list);
  }

  let hottestTaskId: string | undefined;
  let hottestCount = 0;
  for (const [taskId, list] of bidsByTask) {
    if (list.length > hottestCount) {
      hottestCount = list.length;
      hottestTaskId = taskId;
    }
  }

  if (hottestTaskId && hottestCount > 0) {
    const task = state.marketTasks.find((t) => t.id === hottestTaskId);
    const label = taskLabel(task);
    const seenAgents = new Set<string>();
    const detailLines: string[] = [];
    const bidders: { name: string; civId: string }[] = [];

    for (const e of bidsByTask.get(hottestTaskId) ?? []) {
      const agentId = e.payload?.agentId as string | undefined;
      if (!agentId || seenAgents.has(agentId)) continue;
      seenAgents.add(agentId);
      const found = findAgent(state, agentId);
      if (!found) continue;
      bidders.push({ name: found.agent.displayName, civId: found.civ.id });
      if (detailLines.length < 3) {
        detailLines.push(
          playfulBid(
            found.agent.displayName,
            label,
            e.payload?.llmReasoning as string | undefined,
          ),
        );
      }
    }
    const rest = seenAgents.size - detailLines.length;
    if (rest > 0) {
      detailLines.push(`还有 ${rest} 人也报价了，场面一度很卷。`);
    }

    const assigned = roundEvents.filter((x) => x.kind === 'task_assigned' && x.payload?.taskId === hottestTaskId);
    const winnerNames = assigned
      .map((e) => findAgent(state, e.payload?.agentId as string)?.agent.displayName)
      .filter(Boolean) as string[];

    pushStory(state, `「${label}」成了香饽饽，${seenAgents.size} 人报价。`, {
      storyRole: 'section',
      section: 'bids',
      summary: `抢单大战：「${label}」${seenAgents.size} 人报价${winnerNames.length ? `，${winnerNames.join('、')} 抢到手` : ''}。`,
      details: detailLines,
      contest: {
        taskLabel: label,
        bidderCount: seenAgents.size,
        bidders,
        winnerNames,
      },
    });
  }

  const otherAssignments = roundEvents.filter(
    (x) => x.kind === 'task_assigned' && x.payload?.taskId !== hottestTaskId,
  );
  if (otherAssignments.length > 0) {
    const details = otherAssignments.map((e) => {
      const task = state.marketTasks.find((t) => t.id === e.payload?.taskId);
      const found = findAgent(state, e.payload?.agentId as string);
      return found
        ? `${found.agent.displayName} 拿下「${taskLabel(task)}」（${task?.reward ?? '?'} 金）`
        : '';
    }).filter(Boolean);
    pushStory(state, `另有 ${otherAssignments.length} 单被抢下。`, {
      storyRole: 'section',
      section: 'assign',
      summary: `还有 ${otherAssignments.length} 单找到打工人。`,
      details,
    });
  }

  const completed = roundEvents.filter((x) => x.kind === 'task_completed');
  const failed = roundEvents.filter((x) => x.kind === 'task_failed');
  if (completed.length > 0 || failed.length > 0) {
    const details: string[] = [];
    for (const e of completed) {
      const name = e.message.split(' ')[0] ?? '某居民';
      const task = state.marketTasks.find((t) => t.id === e.payload?.taskId);
      details.push(`✓ ${name} 搞定「${taskLabel(task)}」，金币到账～`);
    }
    for (const e of failed) {
      const name = e.message.split(' ')[0] ?? '某居民';
      const task = state.marketTasks.find((t) => t.id === e.payload?.taskId);
      details.push(`✗ ${name} 「${taskLabel(task)}」翻车了，下次再来。`);
    }
    const summary =
      completed.length && failed.length
        ? `交差 ${completed.length} 单，失手 ${failed.length} 单。`
        : completed.length
          ? `顺利交差 ${completed.length} 单！`
          : `失手 ${failed.length} 单，明天再战。`;
    pushStory(state, summary, {
      storyRole: 'section',
      section: 'work',
      summary,
      details,
    });
    if (completed.length > 0) {
      const top = completed[0];
      const name = top.message.split(' ')[0] ?? '有人';
      headlines.push(`${name} 交差成功`);
    }
  }

  const shops = roundEvents.filter((x) => x.kind === 'skill_purchased');
  if (shops.length > 0) {
    const details = shops.map((e) => {
      const name = e.message.split(' ')[0] ?? '某居民';
      const skillId = e.payload?.skillId as string | undefined;
      return `${name} 买了「${skillLabel(skillId ?? '')}」，准备接更狠的活。`;
    });
    pushStory(state, `${shops.length} 人投资了新技能。`, {
      storyRole: 'section',
      section: 'shop',
      summary: `${shops.length} 位居民去「技能铺」逛了一圈。`,
      details,
    });
  }

  for (const e of roundEvents.filter((x) => x.kind === 'skill_shared')) {
    pushStory(state, '文明共享了新技能。', {
      storyRole: 'section',
      section: 'policy',
      summary: e.message.replace(/^Civilization [AB]/, '文明'),
      details: [] as string[],
    });
  }

  for (const e of roundEvents.filter((x) => x.kind === 'rules_updated')) {
    pushStory(state, '规则已更新。', {
      storyRole: 'section',
      section: 'policy',
      summary: `${e.message}（下回合生效）`,
      details: [] as string[],
    });
  }

  for (const civ of state.civilizations) {
    const share = wealthConcentration(state, civ.id);
    const walletsWithGold = civ.agents.filter((a) => a.wallet > 0).length;
    if (share >= 0.42 && round >= 2 && walletsWithGold >= 2) {
      const richest = [...civ.agents].sort((a, b) => b.wallet - a.wallet)[0];
      pushStory(state, `${civ.displayName}：财富过于集中。`, {
        storyRole: 'oligarchy',
        section: 'oligarchy',
        summary: `${richest?.displayName ?? '某人'} 占了 ${Math.round(share * 100)}% 钱包`,
        oligarchy: true,
        civilizationId: civ.id,
        civilizationName: civ.displayName,
        richestName: richest?.displayName,
        wealthShare: share,
        details: [] as string[],
      });
      headlines.push(`${civ.displayName} 出现寡头苗头`);
    }
  }

  const outA = state.metricsByCiv[state.civilizations[0]?.id ?? '']?.totalGrossOutput ?? 0;
  const outB = state.metricsByCiv[state.civilizations[1]?.id ?? '']?.totalGrossOutput ?? 0;
  let headline =
    headlines[0] ??
    (completed.length > 0 ? '本回合有人满载而归' : `第 ${round} 天市集运转中`);
  if (state.civilizations.length >= 2) {
    const lead =
      outA === outB ? '两文明产出持平' : outA > outB ? '文明 A 总产出领先' : '文明 B 总产出领先';
    headline = `${headline} · ${lead}`;
  }

  pushStory(state, headline, {
    storyRole: 'headline',
    section: 'headline',
    round,
  });
}
