import type { BidDemoFixture, DemoAgent } from './types';
import { ROLE_KEY, ROLE_LABEL } from './types';
import { STEP_INDEX, TIMELINE, type StepId } from './playback';
import {
  CheckIcon,
  ChevronRightIcon,
  CloseIcon,
  CoinIcon,
  CubeIcon,
  GearIcon,
  GridIcon,
  HistoryIcon,
  InfoIcon,
  MarketIcon,
  PauseIcon,
  PeopleIcon,
  PlayIcon,
  ResetIcon,
  RoleIcon,
  RoundIcon,
  SkillIcon,
  SpeedIcon,
  StepIcon,
  TaskIcon,
} from './icons';

export type ViewMode = '2.5d' | '2d';

export type Derived = {
  step: StepId;
  bidding: boolean;
  assigned: boolean;
  settled: boolean;
  skillDone: boolean;
  winnerId: string | null;
  winnerWallet: number;
  treasury: number;
  focusAbility: number;
  focusAbilityAfter: number;
  successBefore: number;
  successAfter: number;
  statusLabel: string;
  hint: string;
};

const STEP_SHORT: Record<StepId, string> = {
  idle: '待发布',
  posted: '已公告',
  bidding: '竞标中',
  assigned: '已中标',
  working: '执行中',
  settled: '已结算',
  skill: '已投资',
  next: '下一轮',
};

function roleIcon(agent: DemoAgent) {
  return <RoleIcon role={ROLE_KEY[agent.role]} size={13} />;
}

function formatGold(n: number) {
  return n.toLocaleString('zh-CN');
}

export function TopBar({
  fixture,
  derived,
  view,
  onViewChange,
  onToggleDebug,
}: {
  fixture: BidDemoFixture;
  derived: Derived;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  onToggleDebug: () => void;
}) {
  return (
    <header className="g-top">
      <div className="g-brand">
        <div className="g-emblem" aria-hidden>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 3.2 19 6v5.2c0 4.4-2.9 7.4-7 9.6-4.1-2.2-7-5.2-7-9.6V6l7-2.8Z" />
            <path d="M12 8.2v6.2M9.4 11.4h5.2" />
          </svg>
        </div>
        <div className="g-brand-text">
          <strong>{fixture.civilization.name}</strong>
          <span className="g-rules">
            {fixture.civilization.rules.name} · 税率 {Math.round(fixture.civilization.rules.taxRate * 100)}%
          </span>
        </div>
      </div>

      <div className="g-resources">
        <span className="g-res">
          <RoundIcon size={16} />
          <em>第 {fixture.demoRound} 轮</em>
        </span>
        <span className="g-res">
          <CoinIcon size={16} />
          <em>国库 {formatGold(derived.treasury)}</em>
        </span>
        <span className="g-res">
          <PeopleIcon size={16} />
          <em>居民 {fixture.agents.length}</em>
        </span>
        <span className="g-res">
          <TaskIcon size={16} />
          <em>订单 1</em>
        </span>
      </div>

      <div className="g-top-actions">
        <div className="g-seg" role="group" aria-label="视图切换">
          <button
            type="button"
            className={view === '2.5d' ? 'g-seg-btn is-on' : 'g-seg-btn'}
            onClick={() => onViewChange('2.5d')}
          >
            <CubeIcon size={14} /> 2.5D
          </button>
          <button
            type="button"
            className={view === '2d' ? 'g-seg-btn is-on' : 'g-seg-btn'}
            onClick={() => onViewChange('2d')}
          >
            <GridIcon size={14} /> 2D
          </button>
        </div>
        <button type="button" className="g-icon-btn" title="开发者信息" onClick={onToggleDebug}>
          <GearIcon size={17} />
        </button>
      </div>
    </header>
  );
}

export function TaskPanel({
  fixture,
  derived,
  onPublish,
  onOpenEvents,
}: {
  fixture: BidDemoFixture;
  derived: Derived;
  onPublish: () => void;
  onOpenEvents: () => void;
}) {
  const posted = derived.step !== 'idle';
  const bids = fixture.bids;
  const passers = fixture.agents.filter((a) => a.passed);
  const winner = fixture.agents.find((a) => a.id === derived.winnerId);

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
          <button type="button" className="g-btn g-btn--primary g-btn--wide" onClick={onPublish}>
            发布订单，让 AI 竞标
            <ChevronRightIcon size={16} />
          </button>
        ) : (
          <div className="g-task-status">
            <span className="g-task-status-label">{derived.statusLabel}</span>
            <span className="g-muted">{derived.hint}</span>
          </div>
        )}

        {(derived.bidding || derived.step === 'assigned') && (
          <div className="g-bidbox">
            <div className="g-bidbox-head">
              <span>竞标席</span>
              <em>{bids.length} 人参与 · {passers.length} 人观望</em>
            </div>
            {bids.map((bid) => {
              const agent = fixture.agents.find((a) => a.id === bid.agentId);
              const isWinner = bid.agentId === derived.winnerId;
              return (
                <div key={bid.agentId} className={isWinner ? 'g-bid is-winner' : 'g-bid'}>
                  <span className={`g-avatar g-avatar--${agent ? ROLE_KEY[agent.role] : 'coding'}`}>
                    {agent ? roleIcon(agent) : null}
                  </span>
                  <span className="g-bid-name">{bid.displayName}</span>
                  <span className="g-bid-amount">{bid.bidAmount} 金</span>
                  <span className="g-bid-bars">
                    <span title={`预计质量 ${Math.round(bid.expectedQuality * 100)}%`}>
                      质量 <b>{Math.round(bid.expectedQuality * 100)}%</b>
                    </span>
                    <span title={`成功率 ${Math.round(bid.successProbability * 100)}%`}>
                      成功率 <b>{Math.round(bid.successProbability * 100)}%</b>
                    </span>
                  </span>
                  {isWinner && <span className="g-win-tag">中标</span>}
                </div>
              );
            })}
            {passers.length > 0 && (
              <div className="g-passers">
                <span className="g-passers-label">选择观望：</span>
                {passers.slice(0, 4).map((a) => (
                  <span key={a.id} className="g-passer" title={a.passReason ?? ''}>
                    {a.displayName}
                  </span>
                ))}
                {passers.length > 4 && <span className="g-passer">+{passers.length - 4}</span>}
              </div>
            )}
          </div>
        )}

        {derived.bidding && (
          <p className="g-why">
            为什么有人放弃？他们的估分低于接单门槛（25 分），接单会亏。
          </p>
        )}

        {winner && derived.assigned && (
          <div className="g-toast g-toast--win">
            <CheckIcon size={15} /> {winner.displayName} 中标，价格 {fixture.winner?.bidAmount} 金
          </div>
        )}

        {derived.settled && fixture.settlement && (
          <div className="g-settle">
            <div className="g-settle-row">
              <span>任务奖励</span>
              <b>+{fixture.settlement.gross} 金</b>
            </div>
            <div className="g-settle-row">
              <span>税金（{Math.round(fixture.civilization.rules.taxRate * 100)}%）</span>
              <b className="is-tax">−{fixture.settlement.tax} 金</b>
            </div>
            <div className="g-settle-row is-total">
              <span>{winner?.displayName} 到手</span>
              <b>+{fixture.settlement.net} 金</b>
            </div>
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
                下次成功率 {Math.round(derived.successBefore * 100)}% → {Math.round(derived.successAfter * 100)}%
              </span>
            </div>
          </div>
        )}

        <button type="button" className="g-linkbtn" onClick={onOpenEvents}>
          <HistoryIcon size={14} /> 查看本轮事件记录
        </button>
      </section>
    </aside>
  );
}

function agentStatus(agent: DemoAgent, derived: Derived): string {
  const isWinner = agent.id === derived.winnerId;
  if (derived.step === 'idle') return '待机';
  if (derived.step === 'posted') return '关注市集';
  if (derived.step === 'bidding') return agent.bid ? '竞标中' : '观望';
  if (derived.step === 'assigned') return isWinner ? '已中标' : '待机';
  if (derived.step === 'working') return isWinner ? '执行中' : '待机';
  if (derived.step === 'settled') return isWinner ? '交差完成' : '待机';
  if (derived.step === 'skill') return isWinner ? '去技能铺' : '待机';
  return isWinner ? '能力提升' : '待机';
}

function abilityRows(agent: DemoAgent, codingOverride?: number) {
  const rows = [
    { key: 'coding', label: '写程序', value: codingOverride ?? agent.abilities.coding },
    { key: 'research', label: '做研究', value: agent.abilities.research },
    { key: 'design', label: '做设计', value: agent.abilities.design },
  ];
  return rows;
}

export function AgentPanel({
  fixture,
  derived,
  selectedId,
  onSelect,
  onClose,
}: {
  fixture: BidDemoFixture;
  derived: Derived;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const agent = fixture.agents.find((a) => a.id === selectedId) ?? null;

  if (!agent) {
    return (
      <aside className="g-right">
        <section className="g-card g-roster">
          <div className="g-card-head">
            <h2>居民名册</h2>
            <span className="g-chip">{fixture.agents.length} 位</span>
          </div>
          <p className="g-muted g-roster-hint">点击场景中的居民，查看它为什么这样出价。</p>
          <div className="g-roster-grid">
            {fixture.agents.map((a) => (
              <button key={a.id} type="button" className={`g-roster-item g-roster-item--${ROLE_KEY[a.role]}`} onClick={() => onSelect(a.id)}>
                <span className="g-roster-avatar">{roleIcon(a)}</span>
                <span>
                  <strong>{a.displayName}</strong>
                  <em>{ROLE_LABEL[a.role]}</em>
                </span>
              </button>
            ))}
          </div>
        </section>
      </aside>
    );
  }

  const status = agentStatus(agent, derived);
  const isWinner = agent.id === derived.winnerId;
  const wallet = isWinner && derived.settled ? derived.winnerWallet : agent.walletBefore;
  const skills = derived.skillDone && isWinner ? agent.skillsAfter : [];
  const skillName = fixture.skillPurchase[0]?.name;
  const mood =
    isWinner && derived.skillDone
      ? '能力练上去了，下一单我更有把握。'
      : isWinner && derived.step === 'assigned'
        ? '我中标了，这就去干！'
        : isWinner && derived.settled
          ? '钱到账了，我想把写程序再练一练。'
          : agent.bid
            ? `这单我能接，报价 ${agent.bid.bidAmount} 金。`
            : agent.passReason ?? '先看看行情。';

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
          </div>
        </div>

        <blockquote className="g-mood">「{mood}」</blockquote>

        <div className="g-agent-stats">
          <div className="g-agent-stat">
            <CoinIcon size={15} />
            <span>钱包</span>
            <b>{formatGold(wallet)} 金</b>
          </div>
          <div className="g-agent-stat">
            <SkillIcon size={15} />
            <span>技能</span>
            <b>{skills.length} 项</b>
          </div>
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

        {isWinner && derived.skillDone && skillName && (
          <div className="g-agent-skill">
            <SkillIcon size={14} />
            <span>
              新 Skill：{skillName}
              {fixture.skillPurchase[0] && (
                <em>
                  {' '}
                  · 写程序 {fixture.skillPurchase[0].abilityBefore} → {fixture.skillPurchase[0].abilityAfter}
                </em>
              )}
            </span>
          </div>
        )}

        <div className="g-public">
          <h3>公开决策</h3>
          {agent.bid ? (
            <>
              <p>
                报价 <b>{agent.bid.bidAmount} 金</b> · 预计质量 <b>{Math.round(agent.bid.expectedQuality * 100)}%</b> ·
                成功率 <b>{Math.round(agent.bid.successProbability * 100)}%</b>
              </p>
              <p className="g-muted">判断依据：写程序能力 {agent.bid.ability}，任务难度 {fixture.scenario.difficulty}。</p>
            </>
          ) : (
            <p>{agent.passReason}</p>
          )}
          {isWinner && derived.assigned && <p className="g-muted">系统选择：报价更低且质量预测相同 → 中标。</p>}
        </div>
      </section>
    </aside>
  );
}

export function Dock({
  step,
  playing,
  speed,
  onTogglePlay,
  onNext,
  onPrev,
  onReset,
  onSpeed,
  onOpenEvents,
  onRestart,
}: {
  step: StepId;
  playing: boolean;
  speed: number;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onReset: () => void;
  onSpeed: () => void;
  onOpenEvents: () => void;
  onRestart: () => void;
}) {
  const idx = STEP_INDEX[step];
  return (
    <footer className="g-dock">
      <div className="g-dock-tabs">
        <button type="button" className="g-tab is-on">
          <MarketIcon size={16} /> 任务市场
        </button>
        <button type="button" className="g-tab" disabled title="下一阶段开放">
          <SkillIcon size={16} /> 技能铺
        </button>
        <button type="button" className="g-tab" disabled title="下一阶段开放">
          <InfoIcon size={16} /> 制度
        </button>
        <button type="button" className="g-tab" onClick={onOpenEvents}>
          <HistoryIcon size={16} /> 事件历史
        </button>
      </div>

      <div className="g-playback">
        <button type="button" className="g-icon-btn" onClick={onReset} title="重置">
          <ResetIcon size={16} />
        </button>
        <button type="button" className="g-icon-btn" onClick={onPrev} title="上一步" disabled={idx <= 0}>
          <StepIcon size={16} style={{ transform: 'scaleX(-1)' }} />
        </button>
        <button type="button" className={playing ? 'g-btn g-btn--primary g-playbtn is-playing' : 'g-btn g-btn--primary g-playbtn'} onClick={onTogglePlay}>
          {playing ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
          {playing ? '暂停' : '播放'}
        </button>
        <button type="button" className="g-icon-btn" onClick={onNext} title="单步" disabled={idx >= TIMELINE.length - 1}>
          <StepIcon size={16} />
        </button>
        <button type="button" className="g-speed" onClick={onSpeed} title="播放速度">
          <SpeedIcon size={15} /> {speed}x
        </button>
        <div className="g-timeline" aria-hidden>
          {TIMELINE.map((s, i) => (
            <span key={s.id} className={i <= idx ? 'g-tick is-on' : 'g-tick'} title={s.label} />
          ))}
        </div>
      </div>

      <div className="g-dock-right">
        <button type="button" className="g-btn g-btn--ghost" onClick={onRestart}>
          <ResetIcon size={15} /> 重播演示
        </button>
        <button type="button" className="g-btn g-btn--next" disabled title="Vertical Slice 下一阶段：真实下一轮">
          进入下一轮 <ChevronRightIcon size={15} />
        </button>
      </div>
    </footer>
  );
}

export function EventDrawer({ fixture, step, onClose }: { fixture: BidDemoFixture; step: StepId; onClose: () => void }) {
  const focusIds = new Set(
    fixture.rawEvents
      .filter((e) =>
        ['task_posted', 'bid_placed', 'task_assigned', 'task_completed', 'task_failed', 'tax_collected', 'skill_purchased'].includes(e.kind)
      )
      .filter((e) => (e.payload?.taskId ? e.payload.taskId === fixture.scenario.taskId : true))
      .map((e) => e.id)
  );
  return (
    <div className="g-drawer">
      <div className="g-drawer-head">
        <h2>本轮事件记录</h2>
        <span className="g-muted">来自模拟引擎 · 第 {fixture.demoRound} 轮</span>
        <button type="button" className="g-close g-close--static" onClick={onClose} aria-label="关闭">
          <CloseIcon size={15} />
        </button>
      </div>
      <ol className="g-events">
        {fixture.rawEvents.map((e) => (
          <li key={e.id} className={focusIds.has(e.id) ? 'g-event is-focus' : 'g-event'}>
            <span className={`g-event-kind g-event-kind--${e.kind}`}>{e.kind}</span>
            <span className="g-event-msg">{e.message}</span>
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
  onClose,
}: {
  fixture: BidDemoFixture;
  view: ViewMode;
  onClose: () => void;
}) {
  const focusEvents = fixture.rawEvents.filter(
    (e) =>
      e.kind !== 'story' &&
      (!e.payload?.taskId || e.payload.taskId === fixture.scenario.taskId)
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
          <dd>bid-demo.fixture.json</dd>
        </div>
        <div>
          <dt>seed</dt>
          <dd>{fixture.seed}</dd>
        </div>
        <div>
          <dt>任务生成</dt>
          <dd>tasksPerRound {fixture.tasksPerRound} · ability {fixture.initialAbility}</dd>
        </div>
        <div>
          <dt>视图</dt>
          <dd>{view}</dd>
        </div>
        <div>
          <dt>经济结算</dt>
          <dd>仅由 simulation 引擎决定</dd>
        </div>
      </dl>
      <h3>事件 JSON（重点任务）</h3>
      <pre className="g-debug-pre">{JSON.stringify(focusEvents, null, 2)}</pre>
    </div>
  );
}

/** 2D interaction comparison board — same fixture, no 3D scene. */
export function BidBoard2D({ fixture, derived, onSelect }: { fixture: BidDemoFixture; derived: Derived; onSelect: (id: string) => void }) {
  const passers = fixture.agents.filter((a) => a.passed);
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
      <div className="g-board2d-flow">
        <div className="g-board2d-col">
          <h3>投标席</h3>
          {fixture.bids.map((bid) => {
            const agent = fixture.agents.find((a) => a.id === bid.agentId)!;
            const isWinner = bid.agentId === derived.winnerId;
            return (
              <button key={bid.agentId} type="button" className={isWinner ? 'g-board2d-bidder is-winner' : 'g-board2d-bidder'} onClick={() => onSelect(agent.id)}>
                <span className={`g-avatar g-avatar--${ROLE_KEY[agent.role]}`}>{roleIcon(agent)}</span>
                <span className="g-board2d-bidder-name">{agent.displayName}</span>
                <span className="g-board2d-amount">{bid.bidAmount} 金</span>
                <span className="g-board2d-bars">
                  质量 {Math.round(bid.expectedQuality * 100)}% · 成功率 {Math.round(bid.successProbability * 100)}%
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
              <span className="g-board2d-passer-name">{a.displayName}</span>
              <span className="g-board2d-reason">{a.passReason}</span>
            </button>
          ))}
          <p className="g-board2d-tip">估分低于 25 分的居民不会接单——接单会亏本。</p>
        </div>
      </div>
      <div className="g-board2d-result">
        {derived.settled && fixture.settlement ? (
          <>
            <span className="g-board2d-result-tag">结算</span>
            <b>{fixture.settlement.gross} 金</b>
            <span>− 税 {fixture.settlement.tax} 金 → 到手 {fixture.settlement.net} 金</span>
            {derived.skillDone && fixture.skillPurchase[0] && (
              <span className="g-board2d-skill">
                <SkillIcon size={14} /> 买「{fixture.skillPurchase[0].name}」：写程序 {fixture.skillPurchase[0].abilityBefore} →{' '}
                {fixture.skillPurchase[0].abilityAfter}
              </span>
            )}
          </>
        ) : (
          <span className="g-muted">点击播放，观看这段竞标 → 中标 → 结算的流程。</span>
        )}
      </div>
    </div>
  );
}
