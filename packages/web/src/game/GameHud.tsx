import type { BidDemoFixture, DemoAgent } from './types';
import { ROLE_KEY, ROLE_LABEL } from './types';
import { STEP_INDEX, TIMELINE, buildPlaybackCues, type StepId } from './playback';
import {
  cooperationLabel,
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
}: {
  fixture: BidDemoFixture;
  derived: Derived;
  onToggleDebug: () => void;
  onOpenInstitutions: () => void;
  campaign: { round: number; maxRounds: number; done: boolean } | null;
  campaignBusy: boolean;
  onStartCampaign: () => void;
  onNextCampaign: () => void;
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
          <span className="g-rules">{fixture.civilization.rules.name}</span>
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
            步骤 <b>{STEP_INDEX[derived.step] + 1}</b> / {TIMELINE.length}
          </span>
        )}
        {campaign ? (
          <>
            <span className="g-campaign-chip">
              文明 {campaign.round}/{campaign.maxRounds}
            </span>
            <button
              type="button"
              className="g-btn g-btn--primary g-campaign-btn"
              onClick={onNextCampaign}
              disabled={campaignBusy || campaign.done}
            >
              {campaign.done ? '本轮完成' : campaignBusy ? '推进中…' : '下一轮'}
            </button>
          </>
        ) : (
          <button type="button" className="g-btn g-btn--ghost g-campaign-btn" onClick={onStartCampaign} disabled={campaignBusy}>
            {campaignBusy ? '创建中…' : '开 5 轮文明'}
          </button>
        )}
        <button type="button" className="g-btn g-btn--ghost g-rules-btn" onClick={onOpenInstitutions}>
          制度实验
        </button>
        <button type="button" className="g-icon-btn" title="帮助与开发者信息" onClick={onToggleDebug}>
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
        <span className="g-focus-step">居民 {focusNumber}/3</span>
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
        <span className="g-muted">{agent.decision.action === 'bid' ? '愿意承担风险' : '放弃这一单'}</span>
      </div>
      {step === 'focus_astra' && <p className="g-focus-note">下一位：Delta · 积极型</p>}
      {step === 'focus_delta' && <p className="g-focus-note">下一位：Grove · 稳健型</p>}
      {step === 'focus_grove' && <p className="g-focus-note">三位重点居民已表态，其余 5 人收在竞标名单里。</p>}
    </div>
  );
}

export function LeftPanel({
  fixture,
  derived,
  focusAgent,
  focusNumber,
}: {
  fixture: BidDemoFixture;
  derived: Derived;
  focusAgent: DemoAgent | null;
  focusNumber: number | null;
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
      <section className="g-card g-task">
        <div className="g-card-head">
          <h2>主任务</h2>
          <span className={`g-chip is-${derived.step}`}>{STEP_SHORT[derived.step]}</span>
        </div>

        <div className="g-task-ticket">
          <div className="g-task-meta">
            <span className="g-domain g-domain--coding">
              <RoleIcon role="coding" size={13} /> 写程序
            </span>
            <span className="g-difficulty">难度 {fixture.scenario.difficulty}</span>
          </div>
          <h3>{fixture.scenario.title}</h3>
          <p className="g-task-desc">客户网站的登录入口一直报错，需要在今天内修好。</p>
          <div className="g-reward">
            <CoinIcon size={18} />
            <strong>{fixture.scenario.reward}</strong>
            <span>金币</span>
          </div>
        </div>

        {!posted ? (
          <p className="g-board-hint">
            市集还空着。点击场景里<b>市集公告板</b>上的「发布第一笔任务」，让居民自己来竞标。
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
                  写程序 {fixture.skillPurchase[0].abilityBefore} → {fixture.skillPurchase[0].abilityAfter}。
                </span>
              ) : (
                <span className="g-task-status-note is-warn">
                  {winner.displayName} 税后剩 {gold(fixture.settlement?.net ?? 0)}
                  {winner.goal.price ? `，买不起 ${gold(winner.goal.price)} 的「${winner.goal.skillName ?? winner.goal.label}」` : ''}
                  ；能力停在 {winner.abilities.coding}。
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
              <span>竞标名单</span>
              <em>
                {fixture.bids.length} 人参与 · {passers.length} 人观望
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
                  </span>
                  {isWinner && <span className="g-win-tag">中标</span>}
                </div>
              );
            })}
            <div className="g-passers">
              <span className="g-passers-label">观望：</span>
              {passers.slice(0, 5).map((a) => (
                <span key={a.id} className="g-passer" title={a.decision.reasonCode}>
                  {a.displayName}
                </span>
              ))}
              {passers.length > 5 && <span className="g-passer">+{passers.length - 5}</span>}
            </div>
            <p className="g-why">放弃的人不是没能力，而是自估成功率低于自己的风险安全线。</p>
          </div>
        )}

        {derived.assigned && winner && focusWinnerReaction && (
          <div className="g-reaction">
            <div className="g-reaction-head">
              <CheckIcon size={15} /> {winner.displayName} 中标，价格 {gold(fixture.winner?.bidAmount ?? 0)}
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
              <span>任务奖励</span>
              <b>+{gold(fixture.settlement.gross)}</b>
            </div>
            <div className="g-settle-row">
              <span>税金（{Math.round(fixture.civilization.rules.taxRate * 100)}%）</span>
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
                  <span>本任务税</span>
                  <b>+{gold(fixture.treasuryBreakdown.mainTaskTax)}</b>
                </div>
                {fixture.treasuryBreakdown.otherTaskTax > 0 && (
                  <div className="g-treasury-row">
                    <span>其他任务税</span>
                    <b>+{gold(fixture.treasuryBreakdown.otherTaskTax)}</b>
                  </div>
                )}
                <div className="g-treasury-row">
                  <span>划入公共研发</span>
                  <b>−{gold(fixture.treasuryBreakdown.publicResearch)}</b>
                </div>
                <div className="g-treasury-row is-total">
                  <span>实际入国库</span>
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
                ：这轮买不起技能，写程序能力停在 {winner.abilities.coding}。
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
                {fixture.skillPurchase[0].abilityBefore} → {fixture.skillPurchase[0].abilityAfter} 写程序能力 ·
                下轮同难度成功率 {pct(derived.successBefore)} → {pct(derived.successAfter)}
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
                ；写程序能力停在 {winner.abilities.coding}，下一轮成功率不变。
              </span>
            </div>
          </div>
        )}
      </section>
    </aside>
  );
}

function abilityRows(agent: DemoAgent, codingOverride?: number) {
  return [
    { key: 'coding', label: '写程序', value: codingOverride ?? agent.abilities.coding },
    { key: 'research', label: '做研究', value: agent.abilities.research },
    { key: 'design', label: '做设计', value: agent.abilities.design },
  ];
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
          <span className={`g-avatar g-avatar--lg g-avatar--${ROLE_KEY[agent.role]}`}>{roleIcon(agent)}</span>
          <div>
            <h2>{agent.displayName}</h2>
            <span className="g-agent-role">
              {ROLE_LABEL[agent.role]} · {status}
            </span>
            <span className={personalityTone(agent)}>{agent.personalityLabel}</span>
          </div>
        </div>

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
            <h3>公开决策记录</h3>
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
              ? '待决标'
              : agent.decision.action === 'bid'
                ? isWinner
                  ? `中标（${gold(agent.decision.bidAmount ?? 0)}）`
                  : '落标'
                : '未参与'}
            {derived.assigned && isWinner && ' · 系统按质量 × 报价选出'}
          </p>
          <p className="g-public-observed">
            可观察信息：更强同行 {agent.decision.observedCompetitors.strongerSpecialists} 人
            {agent.decision.observedCompetitors.topEarnerName
              ? ` · 累计收入最高 ${agent.decision.observedCompetitors.topEarnerName}`
              : ''}
          </p>
        </div>

        <div className="g-traits">
          <h3>性格参数（影响决策）</h3>
          <div className="g-trait">
            <span>风险偏好</span>
            <div className="g-bar">
              <i className="g-bar-fill g-bar-fill--risk" style={{ width: `${agent.traits.riskTolerance * 100}%` }} />
            </div>
            <b>{riskLabel(agent.traits.riskTolerance)}</b>
          </div>
          <div className="g-trait">
            <span>投资倾向</span>
            <div className="g-bar">
              <i className="g-bar-fill g-bar-fill--invest" style={{ width: `${agent.traits.investAggression * 100}%` }} />
            </div>
            <b>{investLabel(agent.traits.investAggression)}</b>
          </div>
          <div className="g-trait g-trait--future" title="下一阶段多人机制才会使用">
            <span>合作偏好</span>
            <div className="g-bar">
              <i className="g-bar-fill g-bar-fill--coop" style={{ width: `${agent.traits.cooperationPreference * 100}%` }} />
            </div>
            <b>{cooperationLabel(agent.traits.cooperationPreference)}</b>
          </div>
        </div>

        <div className="g-goal">
          <span className="g-goal-label">当前目标</span>
          <strong>{agent.goal.label}</strong>
          {gap !== null && <em>{gap === 0 ? '已经买得起' : `还差 ${gold(gap)}`}</em>}
        </div>

        <div className="g-abilities">
          <h3>能力</h3>
          {abilityRows(agent, isWinner && derived.skillDone ? derived.focusAbilityAfter : undefined).map((row) => (
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
                · 写程序 {fixture.skillPurchase[0].abilityBefore} → {fixture.skillPurchase[0].abilityAfter}
              </em>
            </span>
          </div>
        )}

        <div className="g-record">
          <h3>公开履历</h3>
          <div className="g-record-grid">
            <span>
              完成 <b>{agent.publicRecord.tasksCompleted}</b> 单
            </span>
            <span>
              累计收入 <b>{gold(agent.publicRecord.grossEarnings)}</b>
            </span>
            <span>
              失败 <b>{agent.publicRecord.tasksFailed}</b> 单
            </span>
            <span>
              已缴税 <b>{gold(agent.publicRecord.taxPaid)}</b>
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

export function EventDrawer({ fixture, step, onClose }: { fixture: BidDemoFixture; step: StepId; onClose: () => void }) {
  const focusKinds = new Set([
    'task_posted',
    'bid_placed',
    'bid_declined',
    'task_assigned',
    'task_completed',
    'task_failed',
    'tax_collected',
    'skill_purchased',
  ]);
  const cue = buildPlaybackCues(fixture).find((c) => c.step === step);
  return (
    <div className="g-drawer">
      <div className="g-drawer-head">
        <h2>本轮事件记录</h2>
        <span className="g-muted">来自模拟引擎 · 第 {fixture.demoRound} 轮 · 当前队列 {cue?.events.length ?? 0} 条 · 共 {fixture.rawEvents.length} 条</span>
        <button type="button" className="g-close g-close--static" onClick={onClose} aria-label="关闭">
          <CloseIcon size={15} />
        </button>
      </div>
      <ol className="g-events">
        {fixture.rawEvents.map((e) => (
          <li key={e.id} className={focusKinds.has(e.kind) ? 'g-event is-focus' : 'g-event'}>
            <span className={`g-event-kind g-event-kind--${e.kind}`}>{e.kind}</span>
            <span className="g-event-msg">{e.message}</span>
            {typeof e.payload?.reasonCode === 'string' && <em className="g-event-tag">{e.payload.reasonCode}</em>}
          </li>
        ))}
      </ol>
      <p className="g-drawer-note">
        当前步骤：{step} · 事件来自 <code>packages/web/src/demo/bid-demo.fixture.json</code>
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
  onClose,
}: {
  fixture: BidDemoFixture;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  labelsHidden: boolean;
  onToggleLabels: () => void;
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
        <span className="g-domain g-domain--coding">
          <RoleIcon role="coding" size={13} /> 写程序 · 难度 {fixture.scenario.difficulty}
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
                <SkillIcon size={14} /> 买「{fixture.skillPurchase[0].name}」：写程序{' '}
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
