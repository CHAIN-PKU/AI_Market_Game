import { useMemo } from 'react';
import type { BidDemoFixture, DemoAgent } from './types';
import { DOMAIN_LABEL, ROLE_KEY, ROLE_LABEL, type RuleCompare } from './types';
import { QUALITY, type Quality } from './quality';
import { STEP_INDEX, TIMELINE, buildPlaybackCues, type StepId } from './playback';
import { eventText } from './eventText';
import { downloadCompareCard } from './shareCard';
import { MIXAMO_AVATARS } from './avatarAssets';
import { loreFor } from './agentLore';
import {
  decisionBadge,
  decisionHeadline,
  factorChips,
  goalGap,
  gold,
  investLabel,
  pct,
  publicLine,
  reactionLine,
  riskLabel,
} from './presentation';
import {
  CheckIcon,
  CloseIcon,
  CoinIcon,
  GearIcon,
  HistoryIcon,
  PauseIcon,
  PeopleIcon,
  PlayIcon,
  ResetIcon,
  RoleIcon,
  RoundIcon,
  SkillIcon,
  SpeedIcon,
  StepIcon,
} from './icons';

export type ViewMode = '2.5d' | '2d';

export type Derived = {
  step: StepId;
  posted: boolean;
  bidsOpen: boolean;
  assigned: boolean;
  working: boolean;
  settled: boolean;
  skillDone: boolean;
  winnerId: string | null;
  winnerWallet: number;
  treasury: number;
  focusAbilityAfter: number;
  successBefore: number;
  successAfter: number;
  statusLabel: string;
  hint: string;
};

const STEP_SHORT: Record<StepId, string> = {
  idle: '待发布',
  posted: '已公告',
  focus_astra: '评估中',
  focus_delta: '评估中',
  focus_grove: '评估中',
  bids: '竞标中',
  assigned: '已中标',
  working: '执行中',
  settled: '已结算',
  skill: '已投资',
  next: '下一轮',
};

function roleIcon(agent: DemoAgent) {
  return <RoleIcon role={ROLE_KEY[agent.role]} size={13} />;
}

function personalityTone(agent: DemoAgent): string {
  return `g-persona g-persona--${agent.personality}`;
}

function agentStatus(agent: DemoAgent, derived: Derived): string {
  const isWinner = agent.id === derived.winnerId;
  if (derived.step === 'idle') return '待机';
  if (derived.step === 'posted') return '关注市集';
  if (derived.step.startsWith('focus_')) return '正在盘算';
  if (derived.step === 'bids') return agent.decision.action === 'bid' ? '竞标中' : '观望';
  if (derived.step === 'assigned') return isWinner ? '已中标' : '待机';
  if (derived.step === 'working') return isWinner ? '执行中' : '待机';
  if (derived.step === 'settled') return isWinner ? '交差完成' : '待机';
  if (derived.step === 'skill') return isWinner ? '去技能铺' : '待机';
  return isWinner ? '能力提升' : '待机';
}

/* ---------------- top bar ---------------- */

export function TopBar({
  fixture,
  derived,
  onToggleDebug,
  onOpenInstitutions,
  campaign,
  campaignBusy,
  onStartCampaign,
  onNextCampaign,
  onOpenHistory,
  onOpenGuide,
  onOpenCast,
}: {
  fixture: BidDemoFixture;
  derived: Derived;
  onToggleDebug: () => void;
  onOpenInstitutions: () => void;
  campaign: { round: number; maxRounds: number; done: boolean } | null;
  campaignBusy: boolean;
  onStartCampaign: () => void;
  onNextCampaign: () => void;
  onOpenHistory: () => void;
  onOpenGuide: () => void;
  onOpenCast: () => void;
}) {
  return (
    <header className="g-top">
      <div className="g-brand">
        <div className="g-emblem" aria-hidden>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 3.2 19 6v5.2c0 4.4-2.9 7.4-7 9.6-4.1-2.2-7-5.2-7-9.6V6l7-2.8Z" />
            <path d="M12 8.2v6.2M9.4 11.4h5.2" />
          </svg>
        </div>
        <div className="g-brand-text">
          <strong>{fixture.civilization.name}</strong>
          <span className="g-rules">{fixture.civilization.rules.name} · 你定规则</span>
        </div>
      </div>

      <div className="g-resources">
        <span className="g-res">
          <RoundIcon size={15} />
          <em>第 {fixture.demoRound} 轮</em>
        </span>
        <span className="g-res">
          <CoinIcon size={15} />
          <span className="g-res-key">国库</span>
          <em>{gold(derived.treasury)}</em>
        </span>
        <span className="g-res">
          <PeopleIcon size={15} />
          <em>居民 {fixture.agents.length}</em>
        </span>
        <span className="g-res">
          <span className="g-res-key">税率</span>
          <em>{Math.round(fixture.civilization.rules.taxRate * 100)}%</em>
        </span>
      </div>

      <div className="g-top-actions">
        {derived.posted && (
          <span className="g-turn-label">
            第 <b>{STEP_INDEX[derived.step] + 1}</b>/{TIMELINE.length} 步
          </span>
        )}
        {campaign ? (
          <>
            <button type="button" className="g-campaign-chip" onClick={onOpenHistory} title="看这 5 轮">
              文明 {campaign.round}/{campaign.maxRounds}
            </button>
            <button
              type="button"
              className="g-btn g-btn--primary g-campaign-btn"
              onClick={campaign.done ? onStartCampaign : onNextCampaign}
              disabled={campaignBusy}
            >
              {campaign.done ? '再跑 5 轮' : campaignBusy ? '跑着呢…' : '再来一轮'}
            </button>
          </>
        ) : (
          <button type="button" className="g-btn g-btn--ghost g-campaign-btn" onClick={onStartCampaign} disabled={campaignBusy}>
            {campaignBusy ? '准备中…' : '看 5 轮'}
          </button>
        )}
        <button type="button" className="g-btn g-btn--ghost g-rules-btn" onClick={onOpenInstitutions}>
          改规则
        </button>
        <button type="button" className="g-icon-btn" onClick={onOpenCast} aria-label="居民图鉴" title="居民图鉴">
          <PeopleIcon size={16} />
        </button>
        <button type="button" className="g-icon-btn g-guide-open" onClick={onOpenGuide} aria-label="怎么玩" title="怎么玩">
          ?
        </button>
        <button type="button" className="g-icon-btn" title="帮助与开发者信息" aria-label="开发者信息" onClick={onToggleDebug}>
          <GearIcon size={16} />
        </button>
      </div>
    </header>
  );
}

/* ---------------- left panel ---------------- */

function FocusCard({
  agent,
  focusNumber,
  step,
}: {
  agent: DemoAgent;
  focusNumber: number;
  step: StepId;
}) {
  const badge = decisionBadge(agent);
  return (
    <div className={`g-focus ${agent.decision.action === 'bid' ? 'is-bid' : 'is-pass'}`}>
      <div className="g-focus-head">
        <span className="g-focus-step">第 {focusNumber} 位</span>
        <span className={personalityTone(agent)}>{agent.personalityLabel}</span>
        <span className={badge.tone === 'bid' ? 'g-focus-decision is-bid' : 'g-focus-decision is-pass'}>{badge.label}</span>
      </div>
      <div className="g-focus-agent">
        <span className={`g-avatar g-avatar--${ROLE_KEY[agent.role]}`}>{roleIcon(agent)}</span>
        <div>
          <strong>{agent.displayName}</strong>
          <em>
            {ROLE_LABEL[agent.role]} · {agent.personalityBlurb}
          </em>
        </div>
      </div>
      <blockquote className="g-focus-quote">「{publicLine(agent)}」</blockquote>
      <div className="g-focus-facts">
        {factorChips(agent).map((chip) => (
          <span key={chip.label} className={chip.emphasis ? 'g-fact is-emphasis' : 'g-fact'}>
            <em>{chip.label}</em>
            <b>{chip.value}</b>
          </span>
        ))}
      </div>
      <div className="g-focus-foot">
        <span className={agent.decision.action === 'bid' ? 'g-focus-out is-bid' : 'g-focus-out is-pass'}>
          决策：{decisionHeadline(agent)}
        </span>
        <span className="g-muted">{agent.decision.action === 'bid' ? '愿意接' : agent.decision.reasonCode === 'risk_above_comfort' ? '风险太高' : '觉得不划算'}</span>
      </div>
      {step === 'focus_astra' && <p className="g-focus-note">下一位：Delta · 积极型</p>}
      {step === 'focus_delta' && <p className="g-focus-note">下一位：Grove · 稳健型</p>}
      {step === 'focus_grove' && <p className="g-focus-note">三位重点居民已表态，其余 5 人收在「谁想接」里。</p>}
    </div>
  );
}

export function LeftPanel({
  fixture,
  derived,
  focusAgent,
  focusNumber,
  compare,
  onStart,
  onOpenRules,
}: {
  fixture: BidDemoFixture;
  derived: Derived;
  focusAgent: DemoAgent | null;
  focusNumber: number | null;
  compare: RuleCompare | null;
  onStart: () => void;
  onOpenRules: () => void;
}) {
  const posted = derived.posted;
  const showBids = derived.bidsOpen;
  const winner = fixture.agents.find((a) => a.id === derived.winnerId) ?? null;
  const losers = fixture.agents.filter(
    (a) => a.isFocus && a.id !== derived.winnerId && a.decision.action === 'bid'
  );
  const passers = fixture.agents.filter((a) => a.decision.action === 'pass');
  const focusWinnerReaction = winner && (derived.assigned || derived.working) ? reactionLine(winner, fixture) : null;

  return (
    <aside className="g-left">
      {!derived.posted && (
        <div className="g-mission">
          <strong>你是制度设计师</strong>
          <p>改规则，看 8 个 AI 自己接单、赚钱、买技能、变强。</p>
          <ol className="g-mission-steps">
            <li>发任务</li>
            <li>看 AI 抢单</li>
            <li>改规则</li>
          </ol>
          <button type="button" className="g-btn g-btn--primary g-mission-btn" onClick={onStart}>
            先看一轮
          </button>
        </div>
      )}
      <section className="g-card g-task">
        <div className="g-card-head">
          <h2>今天这单</h2>
          <span className={`g-chip is-${derived.step}`}>{STEP_SHORT[derived.step]}</span>
        </div>

        <div className="g-task-ticket">
          <div className="g-task-meta">
            <span className={`g-domain g-domain--${fixture.scenario.domain}`}>
              <RoleIcon role={fixture.scenario.domain} size={13} /> {DOMAIN_LABEL[fixture.scenario.domain]}
            </span>
            <span className="g-difficulty">难度 {fixture.scenario.difficulty}</span>
          </div>
          <h3>{fixture.scenario.title}</h3>
          <p className="g-task-desc">{fixture.scenario.description}</p>
          <div className="g-reward">
            <CoinIcon size={18} />
            <strong>{fixture.scenario.reward}</strong>
            <span>金币</span>
          </div>
        </div>

        {!posted && compare && (
          <div className="g-compare">
            <div className="g-compare-head">
              <span>上次改规则 · 同一批人，结果变了</span>
              <span className="g-compare-actions">
                <button
                  type="button"
                  className="g-compare-retry"
                  onClick={() => downloadCompareCard(compare, fixture.civilization.name)}
                >
                  存成图片
                </button>
                <button type="button" className="g-compare-retry" onClick={onOpenRules}>
                  再改一次
                </button>
              </span>
            </div>
            <div className="g-compare-row">
              <span>中标</span>
              <b>{compare.beforeWinner} → {compare.afterWinner}</b>
            </div>
            <div className="g-compare-row">
              <span>到手</span>
              <b>{gold(compare.beforeNet ?? 0)} → {gold(compare.afterNet ?? 0)}</b>
            </div>
            <div className="g-compare-row">
              <span>技能</span>
              <b>{compare.beforeSkill ? '买了' : '没买'} → {compare.afterSkill ? '买了' : '没买'}</b>
            </div>
          </div>
        )}
        {!posted ? (
          <p className="g-board-hint">
            市集还空着。点公告板上的「发布任务」，让居民自己来抢。
          </p>
        ) : (
          <div className="g-task-status">
            <span className="g-task-status-label">{derived.statusLabel}</span>
            {derived.step === 'settled' && fixture.treasuryBreakdown ? (
              <span className="g-task-status-note">
                国库 {gold(fixture.treasuryBreakdown.start)} → {gold(fixture.treasuryBreakdown.end)}：
                本任务税 +{gold(fixture.treasuryBreakdown.mainTaskTax)}
                {fixture.treasuryBreakdown.otherTaskTax > 0
                  ? `，其他任务 +${gold(fixture.treasuryBreakdown.otherTaskTax)}`
                  : ''}
                {fixture.treasuryBreakdown.publicResearch > 0
                  ? `，公共研发 −${gold(fixture.treasuryBreakdown.publicResearch)}`
                  : ''}
              </span>
            ) : derived.step === 'skill' && derived.skillDone && winner ? (
              fixture.skillPurchase[0] ? (
                <span className="g-task-status-note is-good">
                  {winner.displayName} 花 {gold(fixture.skillPurchase[0].price)} 买「{fixture.skillPurchase[0].name}」，
                  {DOMAIN_LABEL[fixture.scenario.domain]} {fixture.skillPurchase[0].abilityBefore} → {fixture.skillPurchase[0].abilityAfter}。
                </span>
              ) : (
                <span className="g-task-status-note is-warn">
                  {winner.displayName} 税后剩 {gold(fixture.settlement?.net ?? 0)}
                  {winner.goal.price ? `，买不起 ${gold(winner.goal.price)} 的「${winner.goal.skillName ?? winner.goal.label}」` : ''}
                  ；{DOMAIN_LABEL[fixture.scenario.domain]}能力停在 {winner.abilities[fixture.scenario.domain]}。
                </span>
              )
            ) : (
              <span className="g-muted">{derived.hint}</span>
            )}
          </div>
        )}

        {focusAgent && focusNumber !== null && (
          <FocusCard agent={focusAgent} focusNumber={focusNumber} step={derived.step} />
        )}

        {showBids && (
          <div className="g-bidbox">
            <div className="g-bidbox-head">
              <span>谁想接</span>
              <em>
                {fixture.bids.length} 人报价 · {passers.length} 人不接
              </em>
            </div>
            {fixture.bids.map((bid) => {
              const agent = fixture.agents.find((a) => a.id === bid.agentId)!;
              const isWinner = derived.assigned && bid.agentId === derived.winnerId;
              return (
                <div key={bid.agentId} className={isWinner ? 'g-bid is-winner' : 'g-bid'}>
                  <span className={`g-avatar g-avatar--${ROLE_KEY[agent.role]}`}>{roleIcon(agent)}</span>
                  <span className="g-bid-name">
                    {bid.displayName}
                    <em className={personalityTone(agent)}>{agent.personalityLabel}</em>
                  </span>
                  <span className="g-bid-amount">{gold(bid.bidAmount)}</span>
                  <span className="g-bid-bars">
                    <span>
                      成功率 <b>{pct(bid.successProbability)}</b>
                    </span>
                    <span>
                      质量 <b>{pct(bid.expectedQuality)}</b>
                    </span>
                    {bid.expectedProfit !== undefined && (
                      <span>
                        利润 <b>{bid.expectedProfit} 金</b>
                      </span>
                    )}
                    {bid.reputation !== undefined && (
                      <span>
                        声誉 <b>{Math.round(bid.reputation * 100)}%</b>
                      </span>
                    )}
                    {bid.competitors !== undefined && (
                      <span>
                        对手 <b>{bid.competitors} 人</b>
                      </span>
                    )}
                    {bid.teamAgentIds && bid.teamAgentIds.length > 1 && (
                      <span className="g-team-tag">
                        组队 <b>{bid.teamAgentIds.slice(1).map((id) => fixture.agents.find((a) => a.id === id)?.displayName ?? id).join(' + ')}</b>
                      </span>
                    )}
                  </span>
                  {isWinner && <span className="g-win-tag">中标</span>}
                </div>
              );
            })}
            <div className="g-passers">
              <span className="g-passers-label">不接：</span>
              {passers.slice(0, 5).map((a) => (
                <span key={a.id} className="g-passer" title={a.decision.reasonCode}>
                  {a.displayName}
                </span>
              ))}
              {passers.length > 5 && <span className="g-passer">+{passers.length - 5}</span>}
            </div>
            <p className="g-why">不接，是因为它觉得这单风险太高。</p>
          </div>
        )}

        {derived.assigned && winner && focusWinnerReaction && (
          <div className="g-reaction">
            <div className="g-reaction-head">
              <CheckIcon size={15} /> {fixture.winner?.teamAgentIds && fixture.winner.teamAgentIds.length > 1
                ? fixture.winner.teamAgentIds.map((id) => fixture.agents.find((a) => a.id === id)?.displayName ?? id).join(' + ')
                : winner.displayName}{' '}
              中标，价格 {gold(fixture.winner?.bidAmount ?? 0)}
            </div>
            <p>「{focusWinnerReaction}」</p>
            {losers.map((a) => (
              <p key={a.id} className="g-reaction-lost">
                {a.displayName}：「{reactionLine(a, fixture)}」
              </p>
            ))}
            {focusAgent?.decision.action === 'pass' && focusAgent.id !== winner.id && (
              <p className="g-reaction-lost">
                {focusAgent.displayName}：「{reactionLine(focusAgent, fixture)}」
              </p>
            )}
          </div>
        )}

        {derived.settled && fixture.settlement && (
          <div className="g-settle">
            <div className="g-settle-row">
              <span>这单收入</span>
              <b>+{gold(fixture.settlement.gross)}</b>
            </div>
            <div className="g-settle-row">
              <span>税（{Math.round(fixture.civilization.rules.taxRate * 100)}%）</span>
              <b className="is-tax">−{gold(fixture.settlement.tax)}</b>
            </div>
            <div className="g-settle-row is-total">
              <span>{winner?.displayName} 到手</span>
              <b>+{gold(fixture.settlement.net)}</b>
            </div>
            {fixture.treasuryBreakdown && (
              <div className="g-treasury">
                <div className="g-treasury-head">
                  <span>国库</span>
                  <b>
                    {gold(fixture.treasuryBreakdown.start)} → {gold(fixture.treasuryBreakdown.end)}
                  </b>
                </div>
                <div className="g-treasury-row">
                  <span>这单交税</span>
                  <b>+{gold(fixture.treasuryBreakdown.mainTaskTax)}</b>
                </div>
                {fixture.treasuryBreakdown.otherTaskTax > 0 && (
                  <div className="g-treasury-row">
                    <span>别的单交税</span>
                    <b>+{gold(fixture.treasuryBreakdown.otherTaskTax)}</b>
                  </div>
                )}
                <div className="g-treasury-row">
                  <span>拿去做公共研发</span>
                  <b>−{gold(fixture.treasuryBreakdown.publicResearch)}</b>
                </div>
                <div className="g-treasury-row is-total">
                  <span>国库实际多了</span>
                  <b>+{gold(fixture.treasuryBreakdown.toTreasury)}</b>
                </div>
                {!fixture.treasuryBreakdown.consistent && (
                  <p className="g-treasury-warn">
                    账不平：按事件应为 +{gold(fixture.treasuryBreakdown.toTreasury)}，引擎实际
                    +{gold(fixture.treasuryBreakdown.delta)}
                  </p>
                )}
              </div>
            )}
            {derived.skillDone && !fixture.skillPurchase[0] && winner && (
              <p className="g-settle-miss">
                税后 {gold(fixture.settlement.net)} 金
                {winner.goal.price ? ` < 目标「${winner.goal.skillName ?? winner.goal.label}」${gold(winner.goal.price)} 金` : ''}
                ：这轮买不起技能，{DOMAIN_LABEL[fixture.scenario.domain]}能力停在{' '}
                {winner.abilities[fixture.scenario.domain]}。
              </p>
            )}
          </div>
        )}

        {derived.skillDone && fixture.skillPurchase[0] && (
          <div className="g-skill-note">
            <SkillIcon size={16} />
            <div>
              <strong>
                {winner?.displayName} 买了「{fixture.skillPurchase[0].name}」
              </strong>
              <span>
                {fixture.skillPurchase[0].abilityBefore} → {fixture.skillPurchase[0].abilityAfter}{' '}
                {DOMAIN_LABEL[fixture.scenario.domain]}能力 · 下轮同难度成功率 {pct(derived.successBefore)} →{' '}
                {pct(derived.successAfter)}
              </span>
            </div>
          </div>
        )}

        {derived.skillDone && !fixture.skillPurchase[0] && winner && (
          <div className="g-skill-note is-muted">
            <SkillIcon size={16} />
            <div>
              <strong>{winner.displayName} 这轮没有买技能</strong>
              <span>
                税后到手 {gold(fixture.settlement?.net ?? 0)}
                {winner.goal.price && (fixture.settlement?.net ?? 0) < winner.goal.price
                  ? `，不够买「${winner.goal.skillName ?? winner.goal.label}」（${gold(winner.goal.price)} 金）`
                  : ''}
                ；{DOMAIN_LABEL[fixture.scenario.domain]}能力停在 {winner.abilities[fixture.scenario.domain]}，下一轮成功率不变。
              </span>
            </div>
          </div>
        )}
      </section>
    </aside>
  );
}

function abilityRows(
  agent: DemoAgent,
  domain: 'coding' | 'research' | 'design',
  domainOverride?: number,
) {
  return [
    { key: 'coding', label: '写程序', value: agent.abilities.coding },
    { key: 'research', label: '做研究', value: agent.abilities.research },
    { key: 'design', label: '做设计', value: agent.abilities.design },
  ].map((row) => (row.key === domain && domainOverride !== undefined ? { ...row, value: domainOverride } : row));
}

export function AgentPanel({
  fixture,
  derived,
  selectedId,
  onClose,
}: {
  fixture: BidDemoFixture;
  derived: Derived;
  selectedId: string | null;
  onClose: () => void;
}) {
  const agent = fixture.agents.find((a) => a.id === selectedId) ?? null;
  const agentIndex = agent ? fixture.agents.findIndex((a) => a.id === agent.id) : -1;
  const portrait = useMemo(
    () => (agent && agentIndex >= 0 ? MIXAMO_AVATARS[agentIndex % MIXAMO_AVATARS.length]!.thumb : ''),
    [agent, agentIndex],
  );

  if (!agent) return null;

  const isWinner = agent.id === derived.winnerId;
  const status = agentStatus(agent, derived);
  const wallet = isWinner && derived.settled ? derived.winnerWallet : agent.walletBefore;
  const skills = derived.skillDone && isWinner ? agent.skillsAfter : [];
  const gap = goalGap(agent);
  const badge = decisionBadge(agent);

  return (
    <aside className="g-right">
      <section className="g-card g-agent-card">
        <button type="button" className="g-close" onClick={onClose} aria-label="收起详情">
          <CloseIcon size={15} />
        </button>
        <div className="g-agent-head">
          <img key={agent.id} className="g-agent-portrait" src={portrait} alt={`${agent.displayName} 立绘`} />
          <div>
            <h2>{agent.displayName}</h2>
            <span className="g-agent-role">
              {ROLE_LABEL[agent.role]} · {status}
            </span>
            <span className={personalityTone(agent)}>{agent.personalityLabel}</span>
          </div>
        </div>

        <p className="g-agent-bio">{loreFor(agent.displayName).bio}</p>
        <blockquote className="g-mood">「{publicLine(agent)}」</blockquote>

        <div className="g-agent-stats">
          <div className="g-agent-stat">
            <CoinIcon size={15} />
            <span>钱包</span>
            <b>{gold(wallet)}</b>
          </div>
          <div className="g-agent-stat">
            <SkillIcon size={15} />
            <span>技能</span>
            <b>{skills.length} 项</b>
          </div>
        </div>

        <div className="g-public">
          <div className="g-public-head">
            <h3>它怎么想的</h3>
            <span className={badge.tone === 'bid' ? 'g-focus-decision is-bid' : 'g-focus-decision is-pass'}>
              {badge.label}
            </span>
          </div>
          <div className="g-fact-grid">
            {factorChips(agent).map((chip) => (
              <span key={chip.label} className={chip.emphasis ? 'g-fact is-emphasis' : 'g-fact'}>
                <em>{chip.label}</em>
                <b>{chip.value}</b>
              </span>
            ))}
          </div>
          <p className="g-public-result">
            结果：
            {!derived.assigned
              ? '还没定'
              : agent.decision.action === 'bid'
                ? isWinner
                  ? `接了（${gold(agent.decision.bidAmount ?? 0)}）`
                  : '没抢到'
                : '没接'}
            {derived.assigned && isWinner && ' · 按「靠不靠谱 × 报价」选的'}
          </p>
          <p className="g-public-observed">
            它看到的：比它强的人 {agent.decision.observedCompetitors.strongerSpecialists} 人
            {agent.decision.observedCompetitors.topEarnerName
              ? ` · 累计收入最高 ${agent.decision.observedCompetitors.topEarnerName}`
              : ''}
          </p>
        </div>

        <div className="g-traits">
          <h3>它的性格</h3>
          <div className="g-trait">
            <span>敢冒险吗</span>
            <div className="g-bar">
              <i className="g-bar-fill g-bar-fill--risk" style={{ width: `${agent.traits.riskTolerance * 100}%` }} />
            </div>
            <b>{riskLabel(agent.traits.riskTolerance)}</b>
          </div>
          <div className="g-trait">
            <span>爱花钱吗</span>
            <div className="g-bar">
              <i className="g-bar-fill g-bar-fill--invest" style={{ width: `${agent.traits.investAggression * 100}%` }} />
            </div>
            <b>{investLabel(agent.traits.investAggression)}</b>
          </div>

        </div>

        <div className="g-goal">
          <span className="g-goal-label">现在想要</span>
          <strong>{agent.goal.label}</strong>
          {gap !== null && <em>{gap === 0 ? '已经买得起' : `还差 ${gold(gap)}`}</em>}
        </div>

        <div className="g-abilities">
          <h3>本事</h3>
          {abilityRows(agent, fixture.scenario.domain, isWinner && derived.skillDone ? derived.focusAbilityAfter : undefined).map((row) => (
            <div key={row.key} className="g-ability">
              <span>{row.label}</span>
              <div className="g-bar">
                <i
                  className={`g-bar-fill g-bar-fill--${row.key}`}
                  style={{ width: `${Math.min(100, row.value * 1.5)}%` }}
                />
              </div>
              <b>{row.value}</b>
            </div>
          ))}
        </div>

        {isWinner && derived.skillDone && fixture.skillPurchase[0] && (
          <div className="g-agent-skill">
            <SkillIcon size={14} />
            <span>
              新 Skill：{fixture.skillPurchase[0].name}
              <em>
                {' '}
                · {DOMAIN_LABEL[fixture.scenario.domain]} {fixture.skillPurchase[0].abilityBefore} →{' '}
                {fixture.skillPurchase[0].abilityAfter}
              </em>
            </span>
          </div>
        )}

        <div className="g-record">
          <h3>过往成绩</h3>
          <div className="g-record-grid">
            <span>
              接过 <b>{agent.publicRecord.tasksCompleted}</b> 单
            </span>
            <span>
              累计收入 <b>{gold(agent.publicRecord.grossEarnings)}</b>
            </span>
            <span>
              搞砸 <b>{agent.publicRecord.tasksFailed}</b> 单
            </span>
            <span>
              交过税 <b>{gold(agent.publicRecord.taxPaid)}</b>
            </span>
          </div>
        </div>
      </section>
    </aside>
  );
}

/* ---------------- dock ---------------- */

export function Dock({
  step,
  playing,
  speed,
  onTogglePlay,
  onNext,
  onPrev,
  onReset,
  onSkip,
  cuePosition,
  cueCount,
  onSpeed,
  onOpenEvents,
  onRestart,
}: {
  step: StepId;
  playing: boolean;
  speed: number;
  cuePosition: number;
  cueCount: number;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onReset: () => void;
  onSkip: () => void;
  onSpeed: () => void;
  onOpenEvents: () => void;
  onRestart: () => void;
}) {
  const idx = STEP_INDEX[step];
  const active = TIMELINE[idx]!;
  return (
    <footer className="g-dock">
      <div className="g-dock-step">
        <span className="g-dock-step-label">{active.label}</span>
        <span className="g-dock-step-hint">{active.hint}</span>
        <span className="g-dock-step-count">
          步骤 {idx + 1} / {TIMELINE.length}
        </span>
        <span className="g-dock-cue">事件 {cuePosition} / {cueCount}</span>
      </div>

      <div className="g-playback">
        <button type="button" className="g-icon-btn" onClick={onReset} title="重置">
          <ResetIcon size={16} />
        </button>
        <button type="button" className="g-icon-btn" onClick={onPrev} title="上一步" disabled={idx <= 0}>
          <StepIcon size={16} style={{ transform: 'scaleX(-1)' }} />
        </button>
        <button
          type="button"
          className={playing ? 'g-btn g-playbtn is-playing' : 'g-btn g-playbtn'}
          onClick={onTogglePlay}
        >
          {playing ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
          {playing ? '暂停' : '播放'}
        </button>
        <button type="button" className="g-icon-btn" onClick={onNext} title="单步" disabled={idx >= TIMELINE.length - 1}>
          <StepIcon size={16} />
        </button>
        <button type="button" className="g-icon-btn" onClick={onSkip} title="跳过动画" disabled={idx >= TIMELINE.length - 1}>
          <span className="g-skip-glyph">⏭</span>
        </button>
        <button type="button" className="g-speed" onClick={onSpeed} title="播放速度">
          <SpeedIcon size={15} /> {speed}x
        </button>
      </div>

      <div className="g-dock-right">
        <button type="button" className="g-btn g-btn--ghost" onClick={onOpenEvents}>
          <HistoryIcon size={15} /> 事件历史
        </button>
        <button type="button" className="g-btn g-btn--ghost" onClick={onRestart}>
          <ResetIcon size={15} /> 重播
        </button>
      </div>
    </footer>
  );
}

/* ---------------- overlays ---------------- */

const EVENT_LABEL: Record<string, string> = {
  round_started: '开一轮',
  task_posted: '发任务',
  bid_placed: '报价',
  bid_declined: '不接',
  task_assigned: '选人',
  team_formed: '组队',
  team_settled: '分账',
  task_completed: '做完了',
  task_failed: '搞砸了',
  tax_collected: '交税',
  skill_purchased: '买技能',
  skill_shared: '共享技能',
  competition_checkpoint: '对比',
  rules_updated: '改规则',
  story: '旁白',
  simulation_finished: '结束',
};

export function EventDrawer({ fixture, step, onClose }: { fixture: BidDemoFixture; step: StepId; onClose: () => void }) {
  const focusKinds = new Set([
    'task_posted',
    'bid_placed',
    'bid_declined',
    'task_assigned',
    'team_formed',
    'team_settled',
    'task_completed',
    'task_failed',
    'tax_collected',
    'skill_purchased',
  ]);
  const cue = buildPlaybackCues(fixture).find((c) => c.step === step);
  return (
    <div className="g-drawer">
      <div className="g-drawer-head">
        <h2>这一轮发生了什么</h2>
        <span className="g-muted">第 {fixture.demoRound} 轮 · 现在看到 {cue?.events.length ?? 0} 条 · 共 {fixture.rawEvents.length} 条</span>
        <button type="button" className="g-close g-close--static" onClick={onClose} aria-label="关闭">
          <CloseIcon size={15} />
        </button>
      </div>
      <ol className="g-events">
        {fixture.rawEvents.map((e) => (
          <li key={e.id} className={focusKinds.has(e.kind) ? 'g-event is-focus' : 'g-event'}>
            <span className={`g-event-kind g-event-kind--${e.kind}`}>{EVENT_LABEL[e.kind] ?? e.kind}</span>{' '}
            <span className="g-event-msg">{eventText(e, fixture)}</span>
          </li>
        ))}
      </ol>
      <p className="g-drawer-note">
        当前步骤：{step} · 数字来自引擎，动画只负责播
      </p>
    </div>
  );
}

export function DebugPanel({
  fixture,
  view,
  onViewChange,
  labelsHidden,
  onToggleLabels,
  quality,
  onQualityChange,
  onClose,
}: {
  fixture: BidDemoFixture;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  labelsHidden: boolean;
  onToggleLabels: () => void;
  quality: Quality;
  onQualityChange: (q: Quality) => void;
  onClose: () => void;
}) {
  const focusEvents = fixture.rawEvents.filter(
    (e) => e.kind !== 'story' && (!e.payload?.taskId || e.payload.taskId === fixture.scenario.taskId)
  );
  return (
    <div className="g-debug">
      <div className="g-drawer-head">
        <h2>开发者信息</h2>
        <span className="g-muted">Debug Panel · 玩家默认不可见</span>
        <button type="button" className="g-close g-close--static" onClick={onClose} aria-label="关闭">
          <CloseIcon size={15} />
        </button>
      </div>
      <dl className="g-debug-grid">
        <div>
          <dt>fixture</dt>
          <dd>bid-demo.fixture.json (v{fixture.version})</dd>
        </div>
        <div>
          <dt>seed / round</dt>
          <dd>
            {fixture.seed} / {fixture.demoRound}
          </dd>
        </div>
        <div>
          <dt>任务生成</dt>
          <dd>
            tasksPerRound {fixture.tasksPerRound} · ability {fixture.initialAbility}
          </dd>
        </div>
        <div>
          <dt>性格 → 决策</dt>
          <dd>riskTolerance 决定安全线与报价，非文案</dd>
        </div>
        <div>
          <dt>经济结算</dt>
          <dd>仅由 simulation 引擎决定</dd>
        </div>
        <div>
          <dt>画质（性能）</dt>
          <dd className="g-debug-view">
            {(Object.keys(QUALITY) as Quality[]).map((q) => (
              <button
                key={q}
                type="button"
                className={quality === q ? 'g-debug-chip is-on' : 'g-debug-chip'}
                onClick={() => onQualityChange(q)}
              >
                {QUALITY[q].label}
              </button>
            ))}
          </dd>
        </div>
        <div>
          <dt>建筑标签（剪影验收）</dt>
          <dd className="g-debug-view">
            <button type="button" className="g-debug-chip" onClick={onToggleLabels}>
              {labelsHidden ? '显示标签' : '隐藏标签'}
            </button>
          </dd>
        </div>
        <div>
          <dt>视图（开发对照）</dt>
          <dd className="g-debug-view">
            <button type="button" className={view === '2.5d' ? 'g-debug-chip is-on' : 'g-debug-chip'} onClick={() => onViewChange('2.5d')}>
              2.5D
            </button>
            <button type="button" className={view === '2d' ? 'g-debug-chip is-on' : 'g-debug-chip'} onClick={() => onViewChange('2d')}>
              2D
            </button>
          </dd>
        </div>
        <div>
          <dt>播放队列（事件 → 步骤）</dt>
          <dd>
            {buildPlaybackCues(fixture)
              .filter((c) => c.events.length > 0)
              .map((c) => `${c.step}:${c.events.length}`)
              .join(' · ')}
          </dd>
        </div>
      </dl>
      <h3>事件 JSON（重点任务）</h3>
      <pre className="g-debug-pre">{JSON.stringify(focusEvents, null, 2)}</pre>
    </div>
  );
}

/* ---------------- 2D comparison board ---------------- */

export function BidBoard2D({
  fixture,
  derived,
  onSelect,
}: {
  fixture: BidDemoFixture;
  derived: Derived;
  onSelect: (id: string) => void;
}) {
  const focusAgents = fixture.agents.filter((a) => a.isFocus);
  const passers = fixture.agents.filter((a) => a.decision.action === 'pass');
  return (
    <div className="g-board2d">
      <div className="g-board2d-head">
        <span className={`g-domain g-domain--${fixture.scenario.domain}`}>
          <RoleIcon role={fixture.scenario.domain} size={13} /> {DOMAIN_LABEL[fixture.scenario.domain]} · 难度{' '}
          {fixture.scenario.difficulty}
        </span>
        <h2>{fixture.scenario.title}</h2>
        <span className="g-board2d-reward">
          <CoinIcon size={18} /> {fixture.scenario.reward} 金
        </span>
      </div>

      <div className="g-board2d-focus">
        {focusAgents.map((a) => (
          <button
            key={a.id}
            type="button"
            className={a.decision.action === 'bid' ? 'g-board2d-persona is-bid' : 'g-board2d-persona is-pass'}
            onClick={() => onSelect(a.id)}
          >
            <span className={`g-avatar g-avatar--${ROLE_KEY[a.role]}`}>{roleIcon(a)}</span>
            <span className="g-board2d-persona-name">
              {a.displayName}
              <em className={personalityTone(a)}>{a.personalityLabel}</em>
            </span>
            <span className={a.decision.action === 'bid' ? 'g-focus-decision is-bid' : 'g-focus-decision is-pass'}>
              {decisionHeadline(a)}
            </span>
            <p>「{publicLine(a)}」</p>
          </button>
        ))}
      </div>

      <div className="g-board2d-flow">
        <div className="g-board2d-col">
          <h3>投标席</h3>
          {fixture.bids.map((bid) => {
            const agent = fixture.agents.find((a) => a.id === bid.agentId)!;
            const isWinner = derived.assigned && bid.agentId === derived.winnerId;
            return (
              <button
                key={bid.agentId}
                type="button"
                className={isWinner ? 'g-board2d-bidder is-winner' : 'g-board2d-bidder'}
                onClick={() => onSelect(agent.id)}
              >
                <span className={`g-avatar g-avatar--${ROLE_KEY[agent.role]}`}>{roleIcon(agent)}</span>
                <span className="g-board2d-bidder-name">{agent.displayName}</span>
                <span className="g-board2d-amount">{gold(bid.bidAmount)}</span>
                <span className="g-board2d-bars">
                  成功率 {pct(bid.successProbability)} · 质量 {pct(bid.expectedQuality)}
                </span>
                {isWinner && <span className="g-win-tag">中标</span>}
              </button>
            );
          })}
        </div>
        <div className="g-board2d-col">
          <h3>观望席</h3>
          {passers.map((a) => (
            <button key={a.id} type="button" className="g-board2d-passer" onClick={() => onSelect(a.id)}>
              <span className={`g-avatar g-avatar--${ROLE_KEY[a.role]}`}>{roleIcon(a)}</span>
              <span className="g-board2d-passer-name">
                {a.displayName} <em className={personalityTone(a)}>{a.personalityLabel}</em>
              </span>
              <span className="g-board2d-reason">{publicLine(a)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="g-board2d-result">
        {derived.settled && fixture.settlement ? (
          <>
            <span className="g-board2d-result-tag">结算</span>
            <b>{gold(fixture.settlement.gross)}</b>
            <span>
              − 税 {gold(fixture.settlement.tax)} → 到手 {gold(fixture.settlement.net)}
            </span>
            {derived.skillDone && fixture.skillPurchase[0] && (
              <span className="g-board2d-skill">
                <SkillIcon size={14} /> 买「{fixture.skillPurchase[0].name}」：{DOMAIN_LABEL[fixture.scenario.domain]}{' '}
                {fixture.skillPurchase[0].abilityBefore} → {fixture.skillPurchase[0].abilityAfter}
              </span>
            )}
          </>
        ) : (
          <span className="g-muted">点击播放，观看三种性格在同一任务上的不同决策。</span>
        )}
      </div>
    </div>
  );
}
