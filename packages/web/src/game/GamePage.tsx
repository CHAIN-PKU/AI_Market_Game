import { Canvas } from '@react-three/fiber';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import fixtureJson from '../demo/bid-demo.fixture.json';
import { GameScene } from './GameScene';
import {
  AgentPanel,
  BidBoard2D,
  DebugPanel,
  Dock,
  EventDrawer,
  TaskPanel,
  TopBar,
  type Derived,
  type ViewMode,
} from './GameHud';
import { STEP_INDEX, TIMELINE, atLeast, nextStep, prevStep, type StepId } from './playback';
import type { BidDemoFixture } from './types';
import './game.css';

const fixture = fixtureJson as BidDemoFixture;

function clamp01(n: number) {
  return Math.max(0.03, Math.min(0.97, n));
}

const STATUS_LABEL: Record<StepId, string> = {
  idle: '待发布',
  posted: '订单已公示',
  bidding: 'AI 居民正在竞标',
  assigned: '已选出中标者',
  working: '任务执行中',
  settled: '任务已结算',
  skill: '自主投资能力',
  next: '本轮结束',
};

const STEP_HINT: Record<StepId, string> = {
  idle: '发布订单，看看谁会来竞标',
  posted: '市集把订单挂了出来，居民开始评估',
  bidding: '有人报价，有人放弃：他们各自算过收益与风险',
  assigned: '系统按「质量预测 × 报价」选出中标者',
  working: '中标者走向程序坊，开始干活',
  settled: '奖励入账，税金进入国库',
  skill: '赚到钱后，它决定把钱花在能力上',
  next: '能力变化会带进下一轮竞争',
};

export function GamePage() {
  const [step, setStep] = useState<StepId>('idle');
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [view, setView] = useState<ViewMode>('2.5d');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showEvents, setShowEvents] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const winnerId = fixture.winner?.agentId ?? null;
  const winnerAgent = useMemo(() => fixture.agents.find((a) => a.id === winnerId) ?? null, [winnerId]);
  const skill = fixture.skillPurchase[0];

  useEffect(() => {
    if (step === 'assigned' && winnerId) setSelectedId(winnerId);
  }, [step, winnerId]);

  useEffect(() => {
    if (!playing) return;
    const i = STEP_INDEX[step];
    if (i >= TIMELINE.length - 1) {
      setPlaying(false);
      return;
    }
    const duration = TIMELINE[i]!.duration / speed;
    const timer = setTimeout(() => {
      const next = TIMELINE[i + 1]!.id;
      setStep(next);
    }, duration);
    return () => clearTimeout(timer);
  }, [playing, step, speed]);

  const startDemo = useCallback(() => {
    if (step !== 'idle') return;
    setStep('posted');
    setPlaying(true);
  }, [step]);

  const restartDemo = useCallback(() => {
    setSelectedId(null);
    setStep('posted');
    setPlaying(true);
  }, []);

  const resetAll = useCallback(() => {
    setPlaying(false);
    setStep('idle');
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
    const next = nextStep(step);
    if (next) setStep(next);
  }, [step]);

  const stepBack = useCallback(() => {
    setPlaying(false);
    const prev = prevStep(step);
    if (prev) setStep(prev);
  }, [step]);

  const derived: Derived = useMemo(() => {
    const settled = atLeast(step, 'settled');
    const skillDone = atLeast(step, 'skill');
    const bidding = step === 'bidding';
    const assigned = atLeast(step, 'assigned');
    const successBefore = clamp01(0.35 + ((winnerAgent?.abilities.coding ?? 40) - fixture.scenario.difficulty) * 0.025);
    const successAfter = clamp01(
      0.35 + ((skill?.abilityAfter ?? winnerAgent?.abilities.coding ?? 40) - fixture.scenario.difficulty) * 0.025
    );
    const tax = fixture.settlement?.tax ?? 0;
    const publicShare = Math.round(tax * fixture.civilization.rules.publicResearchShare);
    const treasury = settled ? fixture.civilization.treasuryStart + tax - publicShare : fixture.civilization.treasuryStart;
    const walletBefore = fixture.settlement?.walletBefore ?? 0;
    const net = fixture.settlement?.net ?? 0;
    const winnerWallet = settled ? walletBefore + net - (skillDone ? skill?.price ?? 0 : 0) : walletBefore;
    return {
      step,
      bidding,
      assigned,
      settled,
      skillDone,
      winnerId,
      winnerWallet,
      treasury,
      focusAbility: winnerAgent?.abilities.coding ?? 40,
      focusAbilityAfter: skill?.abilityAfter ?? winnerAgent?.abilities.coding ?? 40,
      successBefore,
      successAfter,
      statusLabel: STATUS_LABEL[step],
      hint: STEP_HINT[step],
    };
  }, [step, winnerId, winnerAgent, skill]);

  const stageStep = TIMELINE[STEP_INDEX[step]]!;

  return (
    <div className="g-shell">
      <TopBar
        fixture={fixture}
        derived={derived}
        view={view}
        onViewChange={setView}
        onToggleDebug={() => setShowDebug((v) => !v)}
      />

      <TaskPanel
        fixture={fixture}
        derived={derived}
        onPublish={startDemo}
        onOpenEvents={() => setShowEvents(true)}
      />

      <main className={`g-stage ${view === '2d' ? 'g-stage--2d' : ''}`}>
        {view === '2.5d' ? (
          <Canvas
            shadows
            dpr={[1, 1.6]}
            camera={{ position: [0, 19, 25], fov: 45, near: 0.1, far: 140 }}
            onPointerMissed={() => setSelectedId(null)}
          >
            <Suspense fallback={null}>
              <GameScene fixture={fixture} step={step} selectedId={selectedId} onSelect={setSelectedId} />
            </Suspense>
          </Canvas>
        ) : (
          <BidBoard2D fixture={fixture} derived={derived} onSelect={setSelectedId} />
        )}

        {step === 'idle' && (
          <div className="g-onboarding">
            <span className="g-onboarding-step">新玩家第一步</span>
            <strong>发布第一笔订单</strong>
            <p>让 8 位 AI 居民自己判断：谁接单、报多少价、为什么放弃。</p>
            <button type="button" className="g-btn g-btn--primary" onClick={startDemo}>
              发布订单演示
            </button>
          </div>
        )}

        {step !== 'idle' && (
          <div className="g-step-ribbon">
            <span className="g-step-label">
              {stageStep.label}
              <em>{stageStep.hint}</em>
            </span>
            <span className="g-step-progress">
              {STEP_INDEX[step] + 1}/{TIMELINE.length}
            </span>
          </div>
        )}

        <Link to="/" className="g-home-link">
          回到入口
        </Link>
      </main>

      <AgentPanel
        fixture={fixture}
        derived={derived}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onClose={() => setSelectedId(null)}
      />

      <Dock
        step={step}
        playing={playing}
        speed={speed}
        onTogglePlay={togglePlay}
        onNext={stepOnce}
        onPrev={stepBack}
        onReset={resetAll}
        onSpeed={() => setSpeed((s) => (s === 1 ? 2 : 1))}
        onOpenEvents={() => setShowEvents(true)}
        onRestart={restartDemo}
      />

      {showEvents && <EventDrawer fixture={fixture} step={step} onClose={() => setShowEvents(false)} />}
      {showDebug && <DebugPanel fixture={fixture} view={view} onClose={() => setShowDebug(false)} />}
    </div>
  );
}
