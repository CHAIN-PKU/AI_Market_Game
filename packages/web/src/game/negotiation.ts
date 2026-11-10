import type { BidDemoFixture, DemoAgent } from './types';

export type NegotiationKind = 'public' | 'private' | 'promise' | 'betrayal' | 'report' | 'thought';
export type NegotiationLine = {
  id: string;
  agentId: string;
  speaker: string;
  role: string;
  kind: NegotiationKind;
  text: string;
  trust: number;
  terms?: string;
};

const clamp = (v: number) => Math.max(0.08, Math.min(0.96, v));

function trustOf(agent: DemoAgent): number {
  const r = agent.publicRecord;
  return clamp(
    0.28 +
      agent.traits.cooperationPreference * 0.5 +
      (r.tasksCompleted - r.tasksFailed) * 0.018 -
      (r.ringDefections ?? 0) * 0.28,
  );
}

function roleOf(agent: DemoAgent): string {
  return agent.role === 'Coding' ? '写程序' : agent.role === 'Research' ? '做研究' : '做设计';
}

export function buildNegotiation(fixture: BidDemoFixture): NegotiationLine[] {
  const byId = new Map(fixture.agents.map((a) => [a.id, a]));
  const teamBid = fixture.bids.find((b) => (b.teamAgentIds?.length ?? 0) > 1);
  const ringBid = fixture.bids.find((b) => (b.ringAgentIds?.length ?? 0) > 1);
  const defectorId = fixture.bids.find((b) => b.ringDefected)?.agentId;
  const winner = fixture.winner ? byId.get(fixture.winner.agentId) : undefined;
  const out: NegotiationLine[] = [];
  let n = 0;

  const push = (
    agent: DemoAgent | undefined,
    kind: NegotiationKind,
    text: string,
    terms?: string,
    trust?: number,
  ) => {
    if (!agent) return;
    out.push({
      id: `nego-${++n}`,
      agentId: agent.id,
      speaker: agent.displayName,
      role: roleOf(agent),
      kind,
      text,
      trust: trust ?? trustOf(agent),
      terms,
    });
  };

  const teamLeader = teamBid?.teamAgentIds ? byId.get(teamBid.teamAgentIds[0]!) : undefined;
  const teamPartner = teamBid?.teamAgentIds ? byId.get(teamBid.teamAgentIds[1]!) : undefined;
  const teamAmount = teamBid?.bidAmount;
  const reward = fixture.scenario.reward;

  if (teamLeader && teamPartner) {
    push(
      teamLeader,
      'public',
      `这单 ${reward}，我一个人只有 ${Math.round((teamLeader.decision.successProbability ?? 0.6) * 100)}% 的把握。${teamLeader.role === teamPartner.role ? `你和我一起扛 ${roleOf(teamPartner)}，分担工期` : `你补 ${roleOf(teamPartner)} 的短板`}，我们一起报 ${teamAmount ?? Math.round(reward * 0.72)}，中标后 70/30。`,
      '70/30 · 团队投标',
    );
    const distrust = (teamPartner.publicRecord.ringDefections ?? 0) > 0 || trustOf(teamPartner) < 0.45;
    push(
      teamPartner,
      'public',
      distrust
        ? `70/30 可以，但先给我 15 定金。上次有人中标后独吞，我不想再只拿一句承诺。`
        : `70/30 行。上次合作没出问题，按老规矩：你主攻，我补位，税后按比例分。`,
      distrust ? '先付 15 定金 · 违约记声誉' : '老搭档 · 税后分成',
    );
    push(
      teamLeader,
      'promise',
      distrust
        ? `成交。先付 15 定金，剩下的税后 70/30；我要是违约，你直接举报，声誉扣我的。`
        : `成交。税后 70/30，不拖款。`,
      distrust ? '定金 + 声誉抵押' : '税后 70/30',
    );
    push(
      teamLeader,
      'private',
      `我其实更想 80/20，但他现在只信写到合同里的东西。先答应，交付后再谈下一单。`,
      '内心：先锁定合作',
    );
  } else if (winner) {
    push(
      winner,
      'public',
      `这单我报 ${fixture.winner?.bidAmount ?? 0}，质量做满。谁愿意补 ${roleOf(winner)} 的短板，我们可以谈分成。`,
      '单干 · 开放合作',
    );
  }

  if (ringBid?.ringAgentIds && ringBid.ringAgentIds.length > 1) {
    const ringLeader = byId.get(ringBid.ringAgentIds[0]!);
    const ringPartner = byId.get(ringBid.ringAgentIds[1]!);
    push(
      ringLeader,
      'public',
      `别互相压价。我们统一报 ${ringBid.bidAmount}，把多出来的利润按 60/40 分；谁先拆台，谁以后别进这个圈子。`,
      '价格联盟 · 60/40',
    );
    push(
      ringPartner,
      'public',
      defectorId === ringPartner?.id
        ? `放心，我不拆台。就按 ${ringBid.bidAmount} 报。`
        : `可以，但我只跟这一轮。下一轮要重新谈分成。`,
      '口头承诺',
    );
    if (defectorId && byId.get(defectorId)) {
      push(
        byId.get(defectorId),
        'betrayal',
        `先答应他。等中标，我单独报低 3 块，自己拿。`,
        '内心：准备背叛',
        clamp(trustOf(byId.get(defectorId)!) - 0.25),
      );
      push(
        ringLeader,
        'report',
        `他违背了价格联盟，我记一笔。后面再合作，先押定金，分成也要重新谈。`,
        '举报 · 声誉下降',
      );
    }
  }

  if (defectorId) {
    const defector = byId.get(defectorId);
    const counterpart =
      (ringBid?.ringAgentIds ? byId.get(ringBid.ringAgentIds.find((id) => id !== defectorId) ?? '') : undefined) ??
      fixture.agents.find((a) => a.id !== defectorId && a.decision.action === 'bid');
    if (defector) {
      push(
        defector,
        'public',
        `这单我先答应一起守价，大家别拆台。`,
        '口头承诺 · 暂不拆台',
      );
      push(
        defector,
        'private',
        `等他们先报，我再低 3 块单独拿。承诺是承诺，钱是钱。`,
        '内心：准备背叛',
        clamp(trustOf(defector) - 0.22),
      );
      push(
        defector,
        'betrayal',
        `抱歉，这单我自己吃。下次再合作。`,
        '背叛 · 独吞',
        clamp(trustOf(defector) - 0.35),
      );
      push(
        counterpart,
        'report',
        `他违背了承诺。记一笔：后面再合作，先押定金，分成重新谈；没有强承诺，不跟他组队。`,
        '举报 · 声誉下降',
        clamp(trustOf(counterpart ?? defector) - 0.15),
      );
      push(
        counterpart,
        'promise',
        `再合作可以，但条件变了：先押 20 定金，税后 60/40；这轮交付干净，才考虑下一轮恢复 70/30。再拆台就永久拉黑。`,
        '信任恢复条款 · 1 轮观察期',
        clamp(trustOf(counterpart ?? defector) - 0.05),
      );
      push(
        defector,
        'promise',
        `接受。先押 20，这轮交付后你再决定下一轮给不给我 70/30。`,
        '接受观察期',
        clamp(trustOf(defector) + 0.06),
      );
    }
  }

  for (const agent of fixture.agents) {
    if (out.some((l) => l.agentId === agent.id && l.kind !== 'thought')) continue;
    const profit = agent.decision.expectedProfit ?? Math.round(agent.decision.expectedValue * 0.4);
    const probability = Math.round((agent.decision.successProbability ?? 0) * 100);
    if (agent.decision.action === 'pass') {
      push(
        agent,
        'thought',
        `我算过：利润 ${profit}，成功率 ${probability}%，对手又强。这轮不跟；等他们抱团出错，我再进。`,
      );
    } else {
      push(
        agent,
        'thought',
        `我的底线是 ${Math.round(agent.decision.riskComfortFloor * 100)}% 成功率；这单 ${probability}%，报价 ${agent.decision.bidAmount ?? 0}。先抢，再看他们跟不跟。`,
      );
    }
  }

  return out;
}
