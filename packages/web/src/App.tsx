import { useCallback, useEffect, useRef, useState } from 'react';
import {
  advanceGame,
  ApiError,
  createGame,
  fetchMeta,
  publishRules,
  resetGame,
  submitPlayerTask,
} from './api';
import { AgentDetail, AgentsDrawer } from './components/AgentsDrawer';
import { CivSummaryCard } from './components/CivSummaryCard';
import { CodexPanel, rulesFromCiv, type RulesDraft } from './components/CodexPanel';
import { Drawer } from './components/Drawer';
import { FirstRoundRecap } from './components/FirstRoundRecap';
import { OnboardingOverlay } from './components/OnboardingOverlay';
import { PlayerTaskPanel } from './components/PlayerTaskPanel';
import { PreRoundPanel } from './components/PreRoundPanel';
import { AgentMindStream } from './components/AgentMindStream';
import { AdvanceWaitOverlay } from './components/AdvanceWaitOverlay';
import { BrainModeBanner } from './components/BrainModeBanner';
import { CivPkStrip } from './components/CivPkStrip';
import { OligarchyBanner } from './components/OligarchyBanner';
import { StorySnippet } from './components/StorySnippet';
import { StoryTheaterFull } from './components/StoryTheater';
import { isTourDone, markTourDone, resetTourForDev } from './lib/onboardingStorage';
import { parseRoundStory } from './lib/roundStory';

import type { AgentTrace, GameMeta, GameState } from './types';

type DrawerKind = 'rules' | 'task' | 'story' | 'mind' | 'civ-a' | 'civ-b' | 'help' | null;

const ONBOARD_STEPS = 5;
const RECAP_STEPS = 4;

export default function App() {
  const [meta, setMeta] = useState<GameMeta | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [traces, setTraces] = useState<AgentTrace[]>([]);
  const [auto, setAuto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handoffHint, setHandoffHint] = useState<string | null>(null);
  const [draftA, setDraftA] = useState<RulesDraft | null>(null);
  const [draftB, setDraftB] = useState<RulesDraft | null>(null);
  const [drawer, setDrawer] = useState<DrawerKind>(null);
  const [pickedAgent, setPickedAgent] = useState<{ civ: 'a' | 'b'; id: string } | null>(null);
  const [roundPk, setRoundPk] = useState({ a: 0, b: 0 });
  const [tourStep, setTourStep] = useState<number | null>(() => (isTourDone() ? null : 0));
  const [recapStep, setRecapStep] = useState<number | null>(null);
  const [mindUnread, setMindUnread] = useState(false);
  const timer = useRef<number | null>(null);
  const advanceAbort = useRef<AbortController | null>(null);
  const prevRound = useRef<number>(0);

  const metricsDelta = useCallback((before: GameState, after: GameState) => {
    const aId = after.civilizations[0]?.id;
    const bId = after.civilizations[1]?.id;
    if (!aId || !bId) return { a: 0, b: 0 };
    return {
      a:
        (after.metricsByCiv[aId]?.totalGrossOutput ?? 0) -
        (before.metricsByCiv[aId]?.totalGrossOutput ?? 0),
      b:
        (after.metricsByCiv[bId]?.totalGrossOutput ?? 0) -
        (before.metricsByCiv[bId]?.totalGrossOutput ?? 0),
    };
  }, []);

  const syncDrafts = useCallback((s: GameState) => {
    const a = s.civilizations[0];
    const b = s.civilizations[1];
    if (a) setDraftA(rulesFromCiv(a));
    if (b) setDraftB(rulesFromCiv(b));
  }, []);

  const attachGame = useCallback(
    (g: { id: string; state: GameState }) => {
      setGameId(g.id);
      setState(g.state);
      syncDrafts(g.state);
      setTraces([]);
      setHandoffHint(null);
      setRoundPk({ a: 0, b: 0 });
      setRecapStep(null);
      prevRound.current = g.state.round;
    },
    [syncDrafts],
  );

  const recoverLostGame = useCallback(async () => {
    const g = await createGame();
    attachGame(g);
    return g;
  }, [attachGame]);

  const boot = useCallback(async () => {
    setError(null);
    const m = await fetchMeta();
    setMeta(m);
    const g = await createGame();
    attachGame(g);
    if (!isTourDone()) setTourStep(0);
  }, [attachGame]);

  useEffect(() => {
    boot().catch(() => setError('请先运行 npm run dev'));
  }, [boot]);

  const finishTour = useCallback(() => {
    markTourDone();
    setTourStep(null);
  }, []);

  const doAdvance = useCallback(async () => {
    if (!gameId || busy) return;
    if (state && state.round >= state.config.totalRounds) return;
    if (tourStep !== null) return;
    setBusy(true);
    setError(null);
    const beforeRound = state?.round ?? 0;
    const busyStarted = Date.now();
    advanceAbort.current?.abort();
    advanceAbort.current = new AbortController();
    try {
      const r = await advanceGame(gameId, {
        signal: advanceAbort.current.signal,
        timeoutMs: meta?.advancePostTimeoutMs,
      });
      if (state) setRoundPk(metricsDelta(state, r.state));
      setState(r.state);
      if (beforeRound === 0 && r.state.round === 1) {
        setRecapStep(0);
      }
      prevRound.current = r.state.round;
      if (r.kind === 'awaiting_cursor') {
        setHandoffHint(r.instruction ?? '需要 Cursor，见帮助');
        setAuto(false);
        return;
      }
      setHandoffHint(null);
      setTraces(r.lastTraces);
      if (r.lastTraces.some((t) => t.reasoning?.trim())) {
        setMindUnread(true);
        if (beforeRound > 0) setDrawer('mind');
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        await recoverLostGame();
        setError('后端刚重启过，旧对局已失效。已自动新建，请再点一次「开启第 1 天」。');
        setAuto(false);
      } else if (e instanceof ApiError && e.status >= 500) {
        setError(`Cursor/服务器错误：${e.message}`);
      } else {
        const msg = e instanceof Error ? e.message : '';
        if (msg.includes('abort') || msg.includes('Abort')) {
          setError('已取消等待。若后端仍在跑 Cursor，请等 1 分钟后点「新局」或重启 npm run dev');
        } else if (msg.includes('timeout') || msg.includes('Timed out')) {
          setError('等待超时（Cursor 较慢）。请看终端报错；或暂时 AI_CIV_AGENT_MODE=practice 试玩');
        } else {
          setError('本回合失败：请看运行 npm run dev 的终端红字（常见：Key 无效 / Cursor 超时）');
        }
      }
    } finally {
      const wait = Math.max(0, 600 - (Date.now() - busyStarted));
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      setBusy(false);
      advanceAbort.current = null;
    }
  }, [gameId, busy, state, metricsDelta, tourStep, recoverLostGame, meta?.advancePostTimeoutMs]);

  useEffect(() => {
    if (!auto) {
      if (timer.current) window.clearInterval(timer.current);
      return;
    }
    timer.current = window.setInterval(() => void doAdvance(), 2000);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [auto, doAdvance]);

  const onReset = async () => {
    advanceAbort.current?.abort();
    setBusy(true);
    setError(null);
    try {
      if (gameId) {
        try {
          const r = await resetGame(gameId);
          attachGame(r);
        } catch (e) {
          if (e instanceof ApiError && e.status === 404) {
            await recoverLostGame();
          } else {
            throw e;
          }
        }
      } else {
        await recoverLostGame();
      }
      setAuto(false);
      setDrawer(null);
      prevRound.current = 0;
    } catch {
      setError('新局失败，请 Ctrl+F5 刷新页面');
    } finally {
      setBusy(false);
    }
  };

  const civA = state?.civilizations[0];
  const civB = state?.civilizations[1];
  const done = state ? state.round >= state.config.totalRounds : false;
  const isPractice = meta?.agentMode === 'practice';
  const oligarchyRaw =
    state && state.round > 0 ? parseRoundStory(state.events, state.round).oligarchy : [];
  const showOligarchy = (state?.round ?? 0) >= 2 && recapStep === null;
  const oligarchy = showOligarchy ? oligarchyRaw : [];
  const inPreRound = state?.round === 0 && tourStep === null;
  const showRoundUi = (state?.round ?? 0) > 0 && tourStep === null;
  const showPulseUi = showRoundUi && ((state?.round ?? 0) > 1 || recapStep === null);
  const uiMuted = tourStep !== null || recapStep !== null;

  return (
    <div className={`app-shell ${uiMuted ? 'app-shell-muted' : ''}`}>
      <header className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold tracking-tight">AI Civilization</h1>
          {state && (
            <p className="text-sm text-[var(--color-muted)] tabular-nums">
              {state.round === 0 ? '市集筹备中' : `第 ${state.round}/${state.config.totalRounds} 回合`}
            </p>
          )}
        </div>
        <button type="button" className="btn-ghost" onClick={() => setDrawer('help')}>
          帮助
        </button>
      </header>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {meta && <BrainModeBanner meta={meta} />}

      {handoffHint && !isPractice && (
        <p className="text-sm text-amber-800 bg-amber-50 rounded-lg px-3 py-2">{handoffHint}</p>
      )}

      {inPreRound && civA && civB && state && (
        <PreRoundPanel civA={civA} civB={civB} totalRounds={state.config.totalRounds} />
      )}

      {showPulseUi && state && (
        <StorySnippet
          events={state.events}
          round={state.round}
          onOpenFull={() => setDrawer('story')}
        />
      )}

      {showPulseUi &&
        oligarchy.map((alert) => (
          <OligarchyBanner
            key={alert.civilizationId}
            alert={alert}
            onPostTask={() => setDrawer('task')}
            onOpenRules={() => setDrawer('rules')}
          />
        ))}

      {showPulseUi && civA && civB && state && (
        <CivPkStrip civA={civA} civB={civB} roundOutA={roundPk.a} roundOutB={roundPk.b} />
      )}

      <div className="grid grid-cols-2 gap-3">
        {civA && (
          <CivSummaryCard
            civ={civA}
            side="a"
            metrics={state?.metricsByCiv[civA.id]}
            onOpen={() => setDrawer('civ-a')}
          />
        )}
        {civB && (
          <CivSummaryCard
            civ={civB}
            side="b"
            metrics={state?.metricsByCiv[civB.id]}
            onOpen={() => setDrawer('civ-b')}
          />
        )}
      </div>

      <div className="main-actions py-2">
        <button
          type="button"
          className="btn-primary"
          disabled={busy || done || tourStep !== null}
          onClick={() => void doAdvance()}
        >
          {busy ? '…' : state?.round === 0 ? '开启第 1 天' : '下一回合'}
        </button>
        {state && state.round > 0 && (
          <button
            type="button"
            className="btn-secondary"
            disabled={busy || done || tourStep !== null}
            onClick={() => setAuto((a) => !a)}
          >
            {auto ? '停' : '自动'}
          </button>
        )}
        <button type="button" className="btn-secondary" onClick={() => void onReset()}>
          新局
        </button>
      </div>

      {inPreRound && (
        <p className="text-center text-xs text-[var(--color-muted)]">
          认完导览后再开市集 · 文明卡片可先点进去看居民
        </p>
      )}

      <nav className="toolbar" aria-label="功能">
        <button type="button" className="toolbar-btn" onClick={() => setDrawer('rules')}>
          规则
        </button>
        <button type="button" className="toolbar-btn" onClick={() => setDrawer('task')}>
          发任务
        </button>
        <button type="button" className="toolbar-btn" onClick={() => setDrawer('story')} disabled={!showPulseUi}>
          剧场
        </button>
        <button
          type="button"
          className={`toolbar-btn ${mindUnread ? 'toolbar-btn-alert' : ''}`}
          onClick={() => {
            setDrawer('mind');
            setMindUnread(false);
          }}
          disabled={(state?.round ?? 0) < 1}
        >
          心路
        </button>
      </nav>

      {state && tourStep !== null && (
        <OnboardingOverlay
          step={tourStep}
          state={state}
          onBack={() => setTourStep((s) => Math.max(0, (s ?? 0) - 1))}
          onSkip={finishTour}
          onNext={() => {
            if (tourStep >= ONBOARD_STEPS - 1) finishTour();
            else setTourStep(tourStep + 1);
          }}
        />
      )}

      {busy && meta && (
        <AdvanceWaitOverlay liveBrain={meta.liveAgentBrain} gameId={gameId} />
      )}

      {recapStep !== null && (
        <FirstRoundRecap
          step={recapStep}
          onNext={() => setRecapStep((s) => Math.min(RECAP_STEPS - 1, (s ?? 0) + 1))}
          onFinish={() => setRecapStep(null)}
        />
      )}

      <Drawer open={drawer === 'help'} title="怎么玩" onClose={() => setDrawer(null)}>
        <p className="text-sm text-[var(--color-muted)] mb-3">
          第一次来？建议走一遍<strong>前行导览</strong>（5 步，认文明、认居民、知道按钮会干嘛）。
        </p>
        <button
          type="button"
          className="btn-secondary w-full mb-4"
          onClick={() => {
            resetTourForDev();
            setTourStep(0);
            setRecapStep(null);
            setDrawer(null);
          }}
        >
          重新播放前行导览
        </button>
        <ol className="text-sm space-y-2 text-[var(--color-muted)] list-decimal pl-4">
          <li>筹备：认居民 →「开启第 1 天」</li>
          <li>每回合：故事卡 → 需要时再开剧场</li>
          <li>想插手：规则 / 发任务</li>
        </ol>
        {meta && <p className="text-xs mt-4 text-[var(--color-muted)]">{meta.playerBrainLabel}</p>}
      </Drawer>

      <Drawer
        open={drawer === 'mind'}
        title={`第 ${state?.round ?? 0} 回合 · 居民心路`}
        onClose={() => {
          setDrawer(null);
          setMindUnread(false);
        }}
        wide
      >
        {state && (
          <AgentMindStream state={state} traces={traces} round={state.round} />
        )}
      </Drawer>

      <Drawer open={drawer === 'story'} title={`第 ${state?.round ?? 0} 回合 · 剧场`} onClose={() => setDrawer(null)} wide>
        {state && <StoryTheaterFull events={state.events} round={state.round} state={state} />}
      </Drawer>

      <Drawer open={drawer === 'task'} title="发布任务" onClose={() => setDrawer(null)}>
        <PlayerTaskPanel
          busy={busy}
          onSubmit={async (t) => {
            if (!gameId) return;
            setBusy(true);
            try {
              setState(await submitPlayerTask(gameId, t));
              setDrawer(null);
            } finally {
              setBusy(false);
            }
          }}
        />
      </Drawer>

      <Drawer open={drawer === 'rules'} title="经营规则" onClose={() => setDrawer(null)} wide>
        {civA && civB && draftA && draftB && (
          <CodexPanel
            draftA={draftA}
            draftB={draftB}
            setDraftA={setDraftA}
            setDraftB={setDraftB}
            busy={busy}
            onPublish={async () => {
              if (!gameId || !state) return;
              setBusy(true);
              try {
                const next = await publishRules(gameId, {
                  [civA.id]: draftA,
                  [civB.id]: draftB,
                });
                setState(next);
                setDrawer(null);
              } finally {
                setBusy(false);
              }
            }}
          />
        )}
      </Drawer>

      <Drawer
        open={drawer === 'civ-a' && !!civA}
        title="文明 A · 居民"
        onClose={() => {
          setDrawer(null);
          setPickedAgent(null);
        }}
      >
        {civA && !pickedAgent && (
          <AgentsDrawer civ={civA} traces={traces} onPickAgent={(id) => setPickedAgent({ civ: 'a', id })} />
        )}
        {civA && pickedAgent?.civ === 'a' && (
          <>
            <button type="button" className="btn-ghost mb-2" onClick={() => setPickedAgent(null)}>
              ← 列表
            </button>
            <AgentDetail civ={civA} agentId={pickedAgent.id} traces={traces} />
          </>
        )}
      </Drawer>

      <Drawer
        open={drawer === 'civ-b' && !!civB}
        title="文明 B · 居民"
        onClose={() => {
          setDrawer(null);
          setPickedAgent(null);
        }}
      >
        {civB && !pickedAgent && (
          <AgentsDrawer civ={civB} traces={traces} onPickAgent={(id) => setPickedAgent({ civ: 'b', id })} />
        )}
        {civB && pickedAgent?.civ === 'b' && (
          <>
            <button type="button" className="btn-ghost mb-2" onClick={() => setPickedAgent(null)}>
              ← 列表
            </button>
            <AgentDetail civ={civB} agentId={pickedAgent.id} traces={traces} />
          </>
        )}
      </Drawer>
    </div>
  );
}
