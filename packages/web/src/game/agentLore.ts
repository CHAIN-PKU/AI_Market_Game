export type AgentLore = { motto: string; bio: string };

export const AGENT_LORE: Record<string, AgentLore> = {
  Astra: { motto: '先算最坏，再报最好的价。', bio: '谨慎型写程序。先看风险安全线，再决定接不接。' },
  Boreal: { motto: '不抢最低价，抢能做完的。', bio: '稳健型研究。宁愿少赚，也要把长期能力练稳。' },
  Cinder: { motto: '新工具先试，亏了再学。', bio: '好奇型设计。愿意为没见过的东西冒一点险。' },
  Delta: { motto: '差 80 金？那就先接单。', bio: '积极型写程序。为了买技能，敢报低价抢单。' },
  Echo: { motto: '数据够，才开口。', bio: '务实型研究。报价之前，先算清楚成功率。' },
  Flux: { motto: '好看和好用，都要。', bio: '平衡型设计。不极端，但在意作品完成度。' },
  Grove: { motto: '长期能力比一单重要。', bio: '稳健型写程序。不跟最低价，跟能积累的技能。' },
  Helix: { motto: '先看别人怎么输。', bio: '观察型研究。习惯先看同行，再决定自己动不动。' },
};

export function loreFor(name: string): AgentLore {
  return AGENT_LORE[name] ?? { motto: '先看看这单值不值得。', bio: '这个居民还在形成自己的做事方式。' };
}
