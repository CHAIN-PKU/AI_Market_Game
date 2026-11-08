import type { ExperimentReport, RuleCompare } from './types';

const W = 1200;
const H = 1400;

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
  if (compare.beforeBids !== undefined) {
    rows.push(['报价', `${compare.beforeBids} / 差 ${compare.beforeSpread}`, `${compare.afterBids} / 差 ${compare.afterSpread}`, compare.beforeBids !== compare.afterBids || compare.beforeSpread !== compare.afterSpread]);
  }
  if (compare.beforeTeams !== undefined) {
    rows.push(['组队', String(compare.beforeTeams), String(compare.afterTeams), compare.beforeTeams !== compare.afterTeams]);
  }
  if (compare.beforeRings !== undefined) {
    rows.push(['串标/举报', `${compare.beforeRings}/${compare.beforeReports}`, `${compare.afterRings}/${compare.afterReports}`, compare.beforeRings !== compare.afterRings || compare.beforeReports !== compare.afterReports]);
  }

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
    y += 92;
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

export function drawExperimentCard(report: ExperimentReport): HTMLCanvasElement {
  const W = 1600;
  const H = 1140;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = '#f6f0e2';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#e4f0e4';
  ctx.fillRect(0, 0, W, 210);
  ctx.fillStyle = '#d5e9d4';
  ctx.beginPath();
  ctx.arc(W - 140, 20, 260, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2f4f45';
  ctx.font = '700 24px "PingFang SC", "Hiragino Sans GB", sans-serif';
  ctx.fillText('晨曦文明 · 制度实验', 80, 64);
  ctx.fillStyle = '#22322b';
  ctx.font = '800 56px "PingFang SC", "Hiragino Sans GB", sans-serif';
  ctx.fillText('同一批居民，两套制度', 80, 140);
  ctx.fillStyle = '#587064';
  ctx.font = '400 24px "PingFang SC", "Hiragino Sans GB", sans-serif';
  ctx.fillText(`种子 ${report.seed} · ${report.maxRounds} 轮 · 数字由模拟引擎计算`, 80, 184);

  const panelW = 680;
  const gap = 40;
  const x0 = 80;
  const cards = [
    { x: x0, title: report.a.rules.name, tax: report.a.rules.taxRate, s: report.a.stats },
    { x: x0 + panelW + gap, title: report.b.rules.name, tax: report.b.rules.taxRate, s: report.b.stats },
  ];
  for (const card of cards) {
    ctx.fillStyle = '#fffdf7';
    ctx.fillRect(card.x, 260, panelW, 120);
    ctx.strokeStyle = '#e4d9c4';
    ctx.lineWidth = 2;
    ctx.strokeRect(card.x, 260, panelW, 120);
    ctx.fillStyle = '#26332c';
    ctx.font = '800 32px "PingFang SC", "Hiragino Sans GB", sans-serif';
    ctx.fillText(card.title, card.x + 28, 310);
    ctx.fillStyle = '#8a7e6c';
    ctx.font = '400 21px "PingFang SC", "Hiragino Sans GB", sans-serif';
    ctx.fillText(`税率 ${Math.round(card.tax * 100)}%`, card.x + 30, 348);
  }

  const rows: [string, string, string, boolean][] = [
    ['总到手', `${report.a.stats.totalNet} 金`, `${report.b.stats.totalNet} 金`, report.a.stats.totalNet !== report.b.stats.totalNet],
    ['总税', `${report.a.stats.totalTax} 金`, `${report.b.stats.totalTax} 金`, report.a.stats.totalTax !== report.b.stats.totalTax],
    ['平均中标价', `${report.a.stats.avgWinningBid} 金`, `${report.b.stats.avgWinningBid} 金`, report.a.stats.avgWinningBid !== report.b.stats.avgWinningBid],
    ['组队', String(report.a.stats.teamBids), String(report.b.stats.teamBids), report.a.stats.teamBids !== report.b.stats.teamBids],
    ['串标', String(report.a.stats.ringBids), String(report.b.stats.ringBids), report.a.stats.ringBids !== report.b.stats.ringBids],
    ['举报', String(report.a.stats.reports), String(report.b.stats.reports), report.a.stats.reports !== report.b.stats.reports],
    ['买技能', String(report.a.stats.skills), String(report.b.stats.skills), report.a.stats.skills !== report.b.stats.skills],
    ['唯一赢家', String(report.a.stats.uniqueWinners), String(report.b.stats.uniqueWinners), report.a.stats.uniqueWinners !== report.b.stats.uniqueWinners],
    ['基尼', String(report.a.stats.gini), String(report.b.stats.gini), report.a.stats.gini !== report.b.stats.gini],
  ];
  let y = 450;
  for (const [label, a, b, changed] of rows) {
    ctx.fillStyle = '#fffdf7';
    ctx.fillRect(80, y - 34, 1440, 62);
    ctx.strokeStyle = '#eadfcb';
    ctx.lineWidth = 1;
    ctx.strokeRect(80, y - 34, 1440, 62);
    ctx.fillStyle = '#7b6e5b';
    ctx.font = '700 20px "PingFang SC", "Hiragino Sans GB", sans-serif';
    ctx.fillText(label, 110, y + 5);
    ctx.fillStyle = changed ? '#c86d3c' : '#26332c';
    ctx.font = '800 26px "PingFang SC", "Hiragino Sans GB", sans-serif';
    ctx.fillText(a, 540, y + 5);
    ctx.fillStyle = changed ? '#1f6b62' : '#26332c';
    ctx.fillText(b, 1050, y + 5);
    if (changed) {
      ctx.fillStyle = '#f3e3cd';
      ctx.fillRect(1420, y - 18, 72, 30);
      ctx.fillStyle = '#9a5b2f';
      ctx.font = '700 16px "PingFang SC", "Hiragino Sans GB", sans-serif';
      ctx.fillText('变了', 1435, y + 4);
    }
    y += 68;
  }

  ctx.fillStyle = '#1f6b62';
  ctx.font = '800 22px "PingFang SC", "Hiragino Sans GB", sans-serif';
  ctx.fillText('AI Civilization · 玩家设计规则，AI 自己创造历史', 80, H - 52);
  return canvas;
}

export function downloadExperimentCard(report: ExperimentReport): void {
  const canvas = drawExperimentCard(report);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-civ-experiment-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}
