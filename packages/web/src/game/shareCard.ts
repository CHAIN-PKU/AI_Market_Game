import type { RuleCompare } from './types';

const W = 1200;
const H = 1200;

function money(n: number | null): string {
  return n === null ? '没赚到' : `${Math.round(n).toLocaleString('en-US')} 金`;
}

function ability(n: number | null): string {
  return n === null ? '—' : String(n);
}

export function drawCompareCard(compare: RuleCompare, civilization: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = '#f6f0e2';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#e8f1ea';
  ctx.fillRect(0, 0, W, 210);

  ctx.fillStyle = '#2f4f45';
  ctx.font = '700 22px "PingFang SC", "Hiragino Sans GB", sans-serif';
  ctx.fillText(`${civilization} · 对比卡`, 72, 72);

  ctx.fillStyle = '#22322b';
  ctx.font = '800 48px "PingFang SC", "Hiragino Sans GB", sans-serif';
  ctx.fillText('同一批居民，两套规则', 72, 140);

  ctx.fillStyle = '#587064';
  ctx.font = '400 22px "PingFang SC", "Hiragino Sans GB", sans-serif';
  ctx.fillText('玩家改规则，AI 自己给出不同结果', 72, 180);

  const rows: [string, string, string, boolean][] = [
    ['税', `${Math.round(compare.beforeTax * 100)}%`, `${Math.round(compare.afterTax * 100)}%`, compare.beforeTax !== compare.afterTax],
    ['中标', compare.beforeWinner, compare.afterWinner, compare.beforeWinner !== compare.afterWinner],
    ['到手', money(compare.beforeNet), money(compare.afterNet), compare.beforeNet !== compare.afterNet],
    ['技能', compare.beforeSkill ? '买了' : '没买', compare.afterSkill ? '买了' : '没买', compare.beforeSkill !== compare.afterSkill],
    ['本事', ability(compare.beforeAbility), ability(compare.afterAbility), compare.beforeAbility !== compare.afterAbility],
  ];

  let y = 280;
  for (const [label, before, after, changed] of rows) {
    ctx.fillStyle = '#fffdf7';
    ctx.fillRect(72, y - 44, W - 144, 82);
    ctx.strokeStyle = '#e4d9c4';
    ctx.lineWidth = 2;
    ctx.strokeRect(72, y - 44, W - 144, 82);

    ctx.fillStyle = '#7b6e5b';
    ctx.font = '700 20px "PingFang SC", "Hiragino Sans GB", sans-serif';
    ctx.fillText(label, 104, y + 8);

    ctx.fillStyle = '#26332c';
    ctx.font = '700 26px "PingFang SC", "Hiragino Sans GB", sans-serif';
    ctx.fillText(before, 260, y + 8);

    ctx.fillStyle = changed ? '#c86d3c' : '#9a8f7c';
    ctx.font = '800 30px "PingFang SC", "Hiragino Sans GB", sans-serif';
    ctx.fillText('→', 560, y + 8);

    ctx.fillStyle = changed ? '#1f6b62' : '#26332c';
    ctx.font = '800 30px "PingFang SC", "Hiragino Sans GB", sans-serif';
    ctx.fillText(after, 650, y + 8);

    if (changed) {
      ctx.fillStyle = '#f3e3cd';
      ctx.fillRect(W - 190, y - 20, 92, 32);
      ctx.fillStyle = '#9a5b2f';
      ctx.font = '700 16px "PingFang SC", "Hiragino Sans GB", sans-serif';
      ctx.fillText('变了', W - 168, y + 3);
    }
    y += 100;
  }

  ctx.fillStyle = '#587064';
  ctx.font = '400 20px "PingFang SC", "Hiragino Sans GB", sans-serif';
  ctx.fillText('数字由模拟引擎计算；动画只负责播放，不改结果。', 72, H - 128);
  ctx.fillStyle = '#1f6b62';
  ctx.font = '800 22px "PingFang SC", "Hiragino Sans GB", sans-serif';
  ctx.fillText('AI Civilization · 玩家设计规则，AI 自己创造历史', 72, H - 72);

  return canvas;
}

export function downloadCompareCard(compare: RuleCompare, civilization: string): void {
  const canvas = drawCompareCard(compare, civilization);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-civ-compare-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}
