import { Canvas } from '@react-three/fiber';
import { NeutralToneMapping } from 'three';
import { Html } from '@react-three/drei';
import { Component, Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import fixtureJson from '../demo/bid-demo.fixture.json';
import { GameScene } from './GameScene';
import { CampaignHistory } from './CampaignHistory';
import { Guide } from './Guide';
import { CastPanel } from './CastPanel';
import { InstitutionPanel, summarizeRun } from './InstitutionPanel';
import { QUALITY, readQuality, writeQuality, type Quality } from './quality';
import {
  AgentPanel,
  BidBoard2D,
  DebugPanel,
  Dock,
  EventDrawer,
  LeftPanel,
  TopBar,
  type Derived,
  type ViewMode,
} from './GameHud';
import {
  atLeast,
  flattenPlaybackCues,
  focusAgentIndexForStep,
  focusNumberForStep,
  type StepId,
} from './playback';
import type { BidDemoFixture, RoundHistory, RuleCompare } from './types';
import { marketStats } from './presentation';
import { CloseIcon } from './icons';
import './game.css';

const bundledFixture = fixtureJson as BidDemoFixture;

const STATUS_LABEL: Record<StepId, string> = {
  idle: '等你发任务',
  posted: '任务挂出来了',
  focus_astra: 'Astra 在盘算',
  focus_delta: 'Delta 在盘算',
  focus_grove: 'Grove 在盘算',
  bids: '大家报价',
  assigned: '有人接了',
  working: '正在干活',
  settled: '钱到账了',
  skill: '它想买技能',
  next: '这轮结束',
};

const STEP_HINT: Record<StepId, string> = {
  idle: '点市集公告板上的「发布任务」',
  posted: '8 个居民开始盘算',
  focus_astra: 'Astra 先算风险：这单值不值得接',
  focus_delta: 'Delta 想买技能，愿意低价抢',
  focus_grove: 'Grove 看长期，不抢最低价',
  bids: '想接的人报价，不想接的人说理由',
  assigned: '按「靠不靠谱 × 报价」选出一个人',
  working: '中标的人去干活',
  settled: '钱到账，税进国库',
  skill: '赚到钱后，它自己决定买不买技能',
  next: '能力变了，下一轮竞争会不一样',
};

class SceneBoundary extends Component<{ children: ReactNode; onRetry: () => void }, { error: string | null }> {
  state: { error: string | null } = { error: null };

  static getDerivedStateFromError(error: unknown) {
    return { error: error instanceof Error ? error.message : String(error) };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="g-scene-error" role="alert">
          <strong>3D 场景加载失败</strong>
          <p>{this.state.error}</p>
          <button
            type="button"
            className="g-btn g-btn--ghost"
            onClick={() => {
              this.setState({ error: null });
              this.props.onRetry();
            }}
          >
            重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function SceneLoading() {
  return (
    <Html center position={[0, 1.8, 0]} zIndexRange={[30, 0]} style={{ pointerEvents: 'none' }}>
      <div className="g-scene-loading">正在点亮晨曦文明…</div>
    </Html>
  );
}

export function GamePage() {
  const [fixture, setFixture] = useState<BidDemoFixture>(bundledFixture);
  const points = useMemo(() => flattenPlaybackCues(fixture), [fixture]);
  const [cueIndex, setCueIndex] = useState(0);
  const safeCueIndex = Math.min(cueIndex, Math.max(0, points.length - 1));
  const step: StepId = points[safeCueIndex]?.step ?? 'idle';
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [view, setView] = useState<ViewMode>('2.5d');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showEvents, setShowEvents] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showInstitutions, setShowInstitutions] = useState(false);
  const [labelsHidden, setLabelsHidden] = useState(false);
  const [campaign, setCampaign] = useState<{
    id: string;
    round: number;
    maxRounds: number;
    done: boolean;
    history: RoundHistory[];
  } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showCast, setShowCast] = useState(false);
  const [campaignBusy, setCampaignBusy] = useState(false);
  const [compare, setCompare] = useState<RuleCompare | null>(null);
  const [quality, setQuality] = useState<Quality>(() => readQuality());
  const [notice, setNotice] = useState<string | null>(null);
  const [autoStart, setAutoStart] = useState(false);
  const [sceneKey, setSceneKey] = useState(0);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 9000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    writeQuality(quality);
  }, [quality]);

  useEffect(() => {
    if (!autoStart) return;
    const posted = points.findIndex((p) => p.step === 'posted');
    if (posted < 0) return;
    setCueIndex(posted);
    setPlaying(true);
    setAutoStart(false);
  }, [autoStart, points]);

  const winnerId = fixture.winner?.agentId ?? null;
  const winnerAgent = useMemo(() => fixture.agents.find((a) => a.id === winnerId) ?? null, [winnerId]);
  const skill = fixture.skillPurchase[0];

  const focusIndex = focusAgentIndexForStep(step);
  const focusAgent = focusIndex === null ? null : fixture.agents[focusIndex] ?? null;
  const focusNumber = focusNumberForStep(step);

  useEffect(() => {
    if (focusAgent) {
      setSelectedId(focusAgent.id);
      return;
    }
    if (step === 'assigned' && winnerId) setSelectedId(winnerId);
  }, [step, focusAgent, winnerId]);

  useEffect(() => {
    if (!playing) return;
    if (safeCueIndex >= points.length - 1) {
      setPlaying(false);
      return;
    }
    const duration = Math.max(120, points[safeCueIndex]!.duration / speed);
    const timer = setTimeout(() => {
      setCueIndex(Math.min(safeCueIndex + 1, points.length - 1));
    }, duration);
    return () => clearTimeout(timer);
  }, [playing, safeCueIndex, speed, points]);

  const startDemo = useCallback(() => {
    if (step !== 'idle') return;
    const posted = points.findIndex((p) => p.step === 'posted');
    if (posted < 0) return;
    setCueIndex(posted);
    setPlaying(true);
  }, [step, points]);

  const restartDemo = useCallback(() => {
    const posted = points.findIndex((p) => p.step === 'posted');
    if (posted < 0) return;
    setSelectedId(null);
    setCueIndex(posted);
    setPlaying(true);
  }, [points]);

  const resetAll = useCallback(() => {
    setPlaying(false);
    setCueIndex(0);
    setSelectedId(null);
  }, []);

  const togglePlay = useCallback(() => {
    if (step === 'idle') {
      startDemo();
      return;
    }
    if (step === 'next') {
      restartDemo();
      return;
    }
    setPlaying((p) => !p);
  }, [restartDemo, startDemo, step]);

  const stepOnce = useCallback(() => {
    setPlaying(false);
    setCueIndex(Math.min(safeCueIndex + 1, points.length - 1));
  }, [safeCueIndex, points.length]);

  const stepBack = useCallback(() => {
    setPlaying(false);
    setCueIndex(Math.max(0, safeCueIndex - 1));
  }, [safeCueIndex]);

  const skipToEnd = useCallback(() => {
    setPlaying(false);
    setCueIndex(points.length - 1);
    if (winnerId) setSelectedId(winnerId);
  }, [points.length, winnerId]);

  const derived: Derived = useMemo(() => {
    const posted = step !== 'idle';
    const bidsOpen = atLeast(step, 'bids');
    const assigned = atLeast(step, 'assigned');
    const working = atLeast(step, 'working');
    const settled = atLeast(step, 'settled');
    const skillDone = atLeast(step, 'skill');
    const tax = fixture.settlement?.tax ?? 0;
    const publicShare = Math.round(tax * fixture.civilization.rules.publicResearchShare);
    void publicShare;
    // Treasury comes from the engine fixture (round truth), not a recomputed player-task slice.
    const treasury = settled ? fixture.civilization.treasuryAfter : fixture.civilization.treasuryStart;
    const walletBefore = fixture.settlement?.walletBefore ?? 0;
    const net = fixture.settlement?.net ?? 0;
    const winnerWallet = settled ? walletBefore + net - (skillDone ? skill?.price ?? 0 : 0) : walletBefore;
    const successBefore = fixture.nextRound.successBefore ?? 0.35;
    const successAfter = fixture.nextRound.successAfter ?? 0.55;
    const focusAbilityAfter = fixture.nextRound.abilityAfter ?? winnerAgent?.abilities.coding ?? 40;
    return {
      step,
      posted,
      bidsOpen,
      assigned,
      working,
      settled,
      skillDone,
      winnerId,
      winnerWallet,
      treasury,
      focusAbilityAfter,
      successBefore,
      successAfter,
      statusLabel: STATUS_LABEL[step],
      hint: STEP_HINT[step],
    };
  }, [step, winnerId, winnerAgent, skill, fixture]);

  const applyRound = useCallback(
    (next: BidDemoFixture, summary: string) => {
      const beforeWinner = fixture.winner?.displayName ?? '没人';
      const beforeNet = fixture.settlement?.net;
      const beforeSkill = fixture.skillPurchase[0]?.name;
      const afterWinner = next.winner?.displayName ?? '没人';
      const afterNet = next.settlement?.net;
      const afterSkill = next.skillPurchase[0]?.name;
      const beforeAbility = fixture.nextRound.abilityAfter;
      const afterAbility = next.nextRound.abilityAfter;
      const compareText =
        beforeNet !== undefined && afterNet !== undefined
          ? `改规则后：${beforeWinner} → ${afterWinner} · 到手 ${beforeNet} → ${afterNet} · 技能 ${beforeSkill ? '买了' : '没买'} → ${afterSkill ? '买了' : '没买'}`
          : summary;
      if (beforeNet !== undefined && afterNet !== undefined) {
        const bm = marketStats(fixture);
        const am = marketStats(next);
        setCompare({
          beforeWinner,
          afterWinner,
          beforeNet,
          afterNet,
          beforeSkill: beforeSkill ?? null,
          afterSkill: afterSkill ?? null,
          beforeTax: fixture.civilization.rules.taxRate,
          afterTax: next.civilization.rules.taxRate,
          beforeAbility,
          afterAbility,
          beforeTeams: bm.teams,
          afterTeams: am.teams,
          beforeRings: bm.rings,
          afterRings: am.rings,
          beforeReports: bm.reports,
          afterReports: am.reports,
          beforeBids: bm.bids,
          afterBids: am.bids,
          beforeSpread: bm.spread,
          afterSpread: am.spread,
        });
      }

      setPlaying(false);
      setCueIndex(0);
      setSelectedId(null);
      setFixture(next);
      setShowInstitutions(false);
      setCampaign(null);
      localStorage.removeItem('dsh-campaign-id');
      setNotice(compareText);
    },
    [fixture],
  );

  const applyCampaign = useCallback(
    (
      id: string,
      next: BidDemoFixture,
      meta: { round: number; maxRounds: number; done: boolean; history: RoundHistory[] },
      autoplay = true,
    ) => {
      setSelectedId(null);
      setFixture(next);
      setShowInstitutions(false);
      setCampaign({ id, ...meta });
      setCompare(null);
      if (meta.done) setShowHistory(true);
      setNotice(`文明 ${meta.round}/${meta.maxRounds} · ${summarizeRun(next)}`);
      setPlaying(false);
      if (autoplay) {
        setAutoStart(true);
      } else {
        setCueIndex(0);
        setAutoStart(false);
      }
    },
    [],
  );

  useEffect(() => {
    const id = localStorage.getItem('dsh-campaign-id');
    if (!id) return;
    let cancelled = false;
    fetch(`/api/games/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 404) localStorage.removeItem('dsh-campaign-id');
          return null;
        }
        return (await res.json()) as {
          id: string;
          fixture: BidDemoFixture;
          campaign: { round: number; maxRounds: number; done: boolean; history: RoundHistory[] };
        };
      })
      .then((data) => {
        if (!cancelled && data?.fixture) {
          applyCampaign(id, data.fixture, data.campaign, false);
          setNotice(`已恢复文明 ${data.campaign.round}/${data.campaign.maxRounds} · 可继续下一轮或重看本轮`);
        }
      })
      .catch(() => {
        // API temporarily unavailable: keep the id for the next load.
      });
    return () => {
      cancelled = true;
    };
  }, [applyCampaign]);

  const startCampaign = useCallback(async () => {
    setCampaignBusy(true);
    try {
      const r = fixture.civilization.rules;
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          demo: true,
          seed: fixture.seed,
          tasksPerRound: fixture.tasksPerRound,
          initialAbility: fixture.initialAbility,
          maxRounds: 5,
          rules: {
            name: r.name,
            taxRate: r.taxRate,
            publicResearchShare: r.publicResearchShare,
            skillOwnership: r.skillOwnership,
          },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        id: string;
        fixture: BidDemoFixture;
        campaign: { round: number; maxRounds: number; done: boolean; history: RoundHistory[] };
      };
      localStorage.setItem('dsh-campaign-id', data.id);
      applyCampaign(data.id, data.fixture, data.campaign);
    } catch (err) {
      setNotice(`无法开始 5 轮文明：${err instanceof Error ? err.message : '引擎不可用'}（需要 API 3001）`);
    } finally {
      setCampaignBusy(false);
    }
  }, [applyCampaign, fixture]);

  const nextCampaign = useCallback(async () => {
    if (!campaign || campaign.done) return;
    setCampaignBusy(true);
    try {
      const res = await fetch(`/api/games/${campaign.id}/advance`, { method: 'POST' });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}${text ? `：${text.slice(0, 100)}` : ''}`);
      }
      const data = (await res.json()) as {
        id: string;
        fixture: BidDemoFixture;
        campaign: { round: number; maxRounds: number; done: boolean; history: RoundHistory[] };
      };
      localStorage.setItem('dsh-campaign-id', data.id);
      applyCampaign(data.id, data.fixture, data.campaign);
    } catch (err) {
      setNotice(`推进下一轮失败：${err instanceof Error ? err.message : '引擎不可用'}`);
    } finally {
      setCampaignBusy(false);
    }
  }, [applyCampaign, campaign]);

  return (
    <div className={[view === '2d' ? 'g-shell is-2d' : 'g-shell', labelsHidden ? 'hide-labels' : ''].join(' ')}>
      <TopBar
        fixture={fixture}
        derived={derived}
        onToggleDebug={() => setShowDebug((v) => !v)}
        onOpenInstitutions={() => setShowInstitutions(true)}
        campaign={campaign}
        campaignBusy={campaignBusy}
        onStartCampaign={startCampaign}
        onNextCampaign={nextCampaign}
        onOpenHistory={() => setShowHistory(true)}
        onOpenGuide={() => setShowGuide(true)}
        onOpenCast={() => setShowCast(true)}
      />

      <main className={`g-stage ${view === '2d' ? 'g-stage--2d' : ''}`}>
        <div className="g-canvas-wrap">
          <SceneBoundary
            onRetry={() => {
              setSceneKey((k) => k + 1);
            }}
          >
            <Canvas
              key={sceneKey}
              shadows
              dpr={QUALITY[quality].dpr}
              gl={{
                antialias: true,
                powerPreference: 'high-performance',
                toneMapping: NeutralToneMapping,
                toneMappingExposure: 1.0,
              }}
              camera={{ position: [0, 15.4, 20.8], fov: 40, near: 0.1, far: 140 }}
              onPointerMissed={() => setSelectedId(null)}
            >
              <Suspense fallback={<SceneLoading />}>
                <GameScene
                  fixture={fixture}
                  step={step}
                  selectedId={selectedId}
                  focusAgentId={focusAgent?.id ?? null}
                  onSelect={setSelectedId}
                  onPublish={startDemo}
                  quality={QUALITY[quality]}
                />
              </Suspense>
            </Canvas>
          </SceneBoundary>
        </div>
        {view === '2d' && <BidBoard2D fixture={fixture} derived={derived} onSelect={setSelectedId} />}
      </main>

      <LeftPanel
        fixture={fixture}
        derived={derived}
        focusAgent={focusAgent}
        focusNumber={focusNumber}
        compare={compare}
        onStart={startDemo}
        onOpenRules={() => setShowInstitutions(true)}
      />

      <AgentPanel fixture={fixture} derived={derived} selectedId={selectedId} onClose={() => setSelectedId(null)} />

      <Dock
        step={step}
        playing={playing}
        speed={speed}
        onTogglePlay={togglePlay}
        onNext={stepOnce}
        onPrev={stepBack}
        onReset={resetAll}
        onSkip={skipToEnd}
        cuePosition={safeCueIndex + 1}
        cueCount={points.length}
        onSpeed={() => setSpeed((s) => (s === 1 ? 2 : 1))}
        onOpenEvents={() => setShowEvents(true)}
        onRestart={restartDemo}
      />

      {notice && (
        <div className="g-toast" role="status">
          <span>{notice}</span>
          <button type="button" className="g-icon-btn" onClick={() => setNotice(null)} aria-label="关闭提示">
            <CloseIcon size={14} />
          </button>
        </div>
      )}

      {showInstitutions && (
        <InstitutionPanel fixture={fixture} onClose={() => setShowInstitutions(false)} onApplied={applyRound} />
      )}

      {showCast && (
        <CastPanel fixture={fixture} onClose={() => setShowCast(false)} onSelect={setSelectedId} />
      )}

      {showGuide && (
        <Guide onClose={() => setShowGuide(false)} onStart={campaign ? undefined : startDemo} />
      )}

      {showHistory && campaign && (
        <CampaignHistory
          civilization={fixture.civilization.name}
          round={campaign.round}
          maxRounds={campaign.maxRounds}
          rules={fixture.civilization.rules}
          history={campaign.history}
          done={campaign.done}
          onRestart={startCampaign}
          onClose={() => setShowHistory(false)}
        />
      )}

      {showEvents && <EventDrawer fixture={fixture} step={step} onClose={() => setShowEvents(false)} />}
      {showDebug && (
        <DebugPanel
          fixture={fixture}
          view={view}
          onViewChange={setView}
          labelsHidden={labelsHidden}
          onToggleLabels={() => setLabelsHidden((v) => !v)}
          quality={quality}
          onQualityChange={setQuality}
          onClose={() => setShowDebug(false)}
        />
      )}
    </div>
  );
}
