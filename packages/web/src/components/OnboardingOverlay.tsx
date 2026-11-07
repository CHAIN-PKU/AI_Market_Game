import { formatCivName, agentSpecialty, topAgents } from '../lib/civDisplay';
import type { GameState } from '../types';

const AVATARS = ['🧑‍🎨', '🧑‍💻', '🧑‍🔬', '🧑‍🚀', '🦊', '🐻', '🦉', '🐯'];

function avatarFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) | 0;
  return AVATARS[Math.abs(h) % AVATARS.length]!;
}

const STEP_META = [
  { kicker: '欢迎来到市集', title: '你不是来写代码的' },
  { kicker: '两座文明', title: '两套制度，同台竞技' },
  { kicker: '16 位 AI 居民', title: '他们会抢单、赚钱、买技能' },
  { kicker: '按下时间键', title: '「开启第 1 天」之后会发生什么？' },
  { kicker: '准备好了吗', title: '先认认人，再开市集' },
] as const;

export function OnboardingOverlay({
  step,
  state,
  onNext,
  onBack,
  onSkip,
}: {
  step: number;
  state: GameState;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  const civA = state.civilizations[0];
  const civB = state.civilizations[1];
  const meta = STEP_META[step] ?? STEP_META[0];
  const total = STEP_META.length;
  const isLast = step === total - 1;

  return (
    <div className="onboard-root" role="dialog" aria-modal="true" aria-labelledby="onboard-title">
      <div className="onboard-card">
        <div className="onboard-progress">
          {STEP_META.map((_, i) => (
            <span key={i} className={`onboard-dot ${i <= step ? 'onboard-dot-on' : ''}`} />
          ))}
        </div>
        <p className="onboard-kicker">{meta.kicker}</p>
        <h2 id="onboard-title" className="onboard-title">
          {meta.title}
        </h2>

        {step === 0 && (
          <div className="onboard-body">
            <p>
              这里是 <strong>AI Civilization</strong>：两座虚拟文明共用一个任务市集。
              你扮演<strong>幕后制度设计师</strong>——改抽成、发悬赏，看 AI 居民怎么抢活、怎么发财。
            </p>
            <p className="onboard-quip">
              核心是看 <strong>AI 居民心路</strong>（需 Cursor Key）。没 Key 时先用练习模式认规则。
            </p>
          </div>
        )}

        {step === 1 && civA && civB && (
          <div className="onboard-body">
            <div className="onboard-civ-pair">
              <div className="onboard-civ onboard-civ-a">
                <span className="onboard-civ-name">{formatCivName(civA.displayName)}</span>
                <span className="onboard-civ-rule">{civA.rules.name}</span>
                <p className="onboard-civ-hint">偏自由市场，技能自己买自己用。</p>
              </div>
              <div className="onboard-civ onboard-civ-b">
                <span className="onboard-civ-name">{formatCivName(civB.displayName)}</span>
                <span className="onboard-civ-rule">{civB.rules.name}</span>
                <p className="onboard-civ-hint">偏公共研发，税里更多进共享池。</p>
              </div>
            </div>
            <p className="onboard-quip">同一批订单，不同规则 → 谁会赢？30 天内见分晓。</p>
          </div>
        )}

        {step === 2 && civA && civB && (
          <div className="onboard-body onboard-scroll">
            <p className="text-sm text-[var(--color-muted)] mb-2">
              每位居民有 <strong>编程 / 科研 / 设计</strong> 能力（Practice 模式下由模拟 AI
              替他们出价）。先认脸：
            </p>
            {[civA, civB].map((civ) => (
              <div key={civ.id} className="onboard-roster">
                <p className="onboard-roster-title">{formatCivName(civ.displayName)}</p>
                <ul className="onboard-roster-list">
                  {topAgents(civ, 8).map((a) => (
                    <li key={a.id} className="onboard-roster-item">
                      <span className="onboard-roster-av">{avatarFor(a.displayName)}</span>
                      <span className="onboard-roster-name">{a.displayName}</span>
                      <span className="onboard-roster-tag">{agentSpecialty(a)}</span>
                      <span className="onboard-roster-ability tabular-nums">
                        编{a.abilities.coding} 研{a.abilities.research} 设{a.abilities.design}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <p className="onboard-quip">点文明卡片可随时打开完整名单。</p>
          </div>
        )}

        {step === 3 && (
          <div className="onboard-body">
            <ol className="onboard-preview">
              <li>
                <strong>故事卡</strong> — 用一句话告诉你今天谁高光（点进去有摘要 + 展开细节）。
              </li>
              <li>
                <strong>PK 条</strong> — 这一回合两座文明谁产出更多（不是累计，是「今天」）。
              </li>
              <li>
                <strong>文明数字</strong> — 累计总产出 + 当前谁钱包最鼓。
              </li>
              <li>
                <strong>底部工具</strong> — 规则 / 发任务 / 剧场，需要时再开，不会一股脑堆在主屏。
              </li>
            </ol>
            <p className="onboard-quip">第一回合结束后，我会再带你逐块认一遍，不会突然吓你一跳。</p>
          </div>
        )}

        {step === 4 && (
          <div className="onboard-body">
            <p>
              现在主屏会很干净：只有两座文明、一个大按钮。
              点 <strong>「开启第 1 天」</strong>，市集才运转。
            </p>
            <p className="onboard-quip">深吸一口气——你的居民已经摩拳擦掌了。</p>
          </div>
        )}

        <div className="onboard-actions">
          {step > 0 ? (
            <button type="button" className="btn-secondary" onClick={onBack}>
              上一步
            </button>
          ) : (
            <button type="button" className="btn-ghost" onClick={onSkip}>
              跳过导览
            </button>
          )}
          <button type="button" className="btn-primary onboard-next" onClick={onNext}>
            {isLast ? '进入市集' : '下一步'}
          </button>
        </div>
      </div>
    </div>
  );
}
