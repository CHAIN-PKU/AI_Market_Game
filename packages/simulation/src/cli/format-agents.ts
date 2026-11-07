import { effectiveAbility } from '../core/skills.js';
import type { GameState } from '../core/types.js';

export function printAgentRoundDigest(state: GameState, roundEventsFilter: number): void {
  const kinds = new Set([
    'task_assigned',
    'task_completed',
    'task_failed',
    'skill_purchased',
    'skill_shared',
  ]);
  const roundEvents = state.events.filter(
    (e) => e.round === roundEventsFilter && kinds.has(e.kind),
  );

  console.log(`\n════ Round ${roundEventsFilter} — 居民在干什么 ════`);
  if (roundEvents.length === 0) {
    console.log('  （本轮暂无任务/消费事件）');
  } else {
    for (const e of roundEvents) {
      console.log(`  · ${e.message}`);
    }
  }

  for (const civ of state.civilizations) {
    console.log(`\n  [${civ.displayName} | ${civ.rules.name}]`);
    for (const agent of civ.agents) {
      const owned = agent.skills.map((s) => s.skillId);
      const eff = effectiveAbility(agent.abilities, owned, civ.sharedSkillIds);
      const skillCount =
        civ.rules.skillOwnership === 'shared'
          ? civ.sharedSkillIds.length
          : agent.skills.length;
      console.log(
        `    ${agent.displayName.padEnd(6)} 钱包=${String(agent.wallet).padStart(4)}  ` +
          `能力 C/R/D=${eff.coding}/${eff.research}/${eff.design}  ` +
          `Skill=${skillCount}  完成/失败=${agent.stats.tasksCompleted}/${agent.stats.tasksFailed}`,
      );
    }
  }
}

export function printPlainLanguageIntro(): void {
  console.log(`
【这不是 Cursor 里的大模型在替你写代码】
  游戏里的「AI 居民」= 模拟器里的自动角色（Mock 规则 + 随机数）。
  以后会可选接入真实 LLM，但 MVP 默认不花 API 钱、且同 seed 可复现。

【这一版在干什么】
  两个文明、各 8 名居民，抢同一个任务市场的订单 → 干活赚钱 → 交税 → 买 Skill 变强。
  文明 A：低税、Skill 私有；文明 B：高税、Skill 买完后全员共享。
`);
}
