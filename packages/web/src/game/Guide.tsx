import { CloseIcon } from './icons';

export function Guide({ onClose, onStart }: { onClose: () => void; onStart?: () => void }) {
  return (
    <div className="g-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="g-guide" role="dialog" aria-modal="true" aria-labelledby="g-guide-title">
        <header className="g-guide-head">
          <div>
            <span className="g-guide-kicker">30 秒看懂</span>
            <h2 id="g-guide-title">你是制度设计师</h2>
            <p>不是每个 AI 的老板。你定规则，它们自己决定接不接、报多少、买不买技能。</p>
          </div>
          <button type="button" className="g-icon-btn" onClick={onClose} aria-label="关闭怎么玩">
            <CloseIcon size={16} />
          </button>
        </header>

        <ol className="g-guide-steps">
          <li>
            <b>1</b>
            <div>
              <strong>发任务</strong>
              <span>看谁想接、谁不接，报价多少。</span>
            </div>
          </li>
          <li>
            <b>2</b>
            <div>
              <strong>看理由</strong>
              <span>点居民，看它怎么想、怕什么、想买什么。</span>
            </div>
          </li>
          <li>
            <b>3</b>
            <div>
              <strong>改规则</strong>
              <span>调税、公共研发、技能归谁，再跑一轮看变化。</span>
            </div>
          </li>
        </ol>

        <footer className="g-guide-foot">
          <span className="g-muted">不用记数字，先看一轮就懂了。</span>
          <div className="g-guide-actions">
            <button type="button" className="g-btn g-btn--ghost" onClick={onClose}>
              自己逛逛
            </button>
            {onStart && (
              <button
                type="button"
                className="g-btn g-btn--primary"
                onClick={() => {
                  onStart();
                  onClose();
                }}
              >
                先看一轮
              </button>
            )}
          </div>
        </footer>
      </section>
    </div>
  );
}
