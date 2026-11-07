import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-3xl font-bold tracking-tight">AI Market Game</h1>
      <p className="text-[var(--color-muted)] max-w-md">
        Build a civilization. Let AI evolve.
        <br />
        制定制度，让 AI 自己打工、攒钱、进化。
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link to="/visual-lab" className="btn-primary px-8 py-3">
          Visual Lab（GLB 双风格对比）
        </Link>
        <Link to="/play-3d" className="btn-secondary px-8 py-3">
          3D 沙盘（程序化参考）
        </Link>
        <Link to="/classic" className="btn-secondary px-8 py-3">
          Classic 2D UI
        </Link>
      </div>
    </div>
  );
}
