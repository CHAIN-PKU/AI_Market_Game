import { DOMAIN_LABEL, type RoundHistory } from './types';

export type ChronicleMeta = {
  civilization: string;
  round: number;
  maxRounds: number;
  rules: { name: string; taxRate: number };
  history: RoundHistory[];
};

function gold(n: number | null): string {
  return n === null ? '—' : Math.round(n).toLocaleString('en-US');
}

function dateStamp(now: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())} ${p(now.getHours())}:${p(now.getMinutes())}`;
}

export function chronicleMarkdown(meta: ChronicleMeta, now = new Date()): string {
  const lines: string[] = [];
  lines.push(`# ${meta.civilization} · 文明编年史`);
  lines.push('');
  lines.push(`> 第 ${meta.round}/${meta.maxRounds} 轮 · ${meta.rules.name}（税率 ${Math.round(meta.rules.taxRate * 100)}%） · 导出于 ${dateStamp(now)}`);
  lines.push('');
  lines.push('| 轮 | 任务 | 中标 | 报价 | 税 / 到手 | 技能 | 国库 |');
  lines.push('|---|---|---|---|---|---|---|');
  for (const r of meta.history) {
    const domain = DOMAIN_LABEL[r.domain as keyof typeof DOMAIN_LABEL] ?? r.domain;
    lines.push(
      `| ${r.round} | ${domain} · ${r.title.replace(/\|/g, '\\|')} | ${r.winner ?? '流标'} | ${gold(r.bid)} | ${gold(r.tax)} / ${gold(r.net)} | ${r.skill ?? '—'} | ${gold(r.treasuryAfter)} |`,
    );
  }
  lines.push('');
  const totalTax = meta.history.reduce((sum, r) => sum + (r.tax ?? 0), 0);
  lines.push(`累计税：${gold(totalTax)} · 记录轮数：${meta.history.length}`);
  lines.push('');
  lines.push('> 由 AI Civilization 引擎生成；动画与文案不参与结算。');
  return lines.join('\n');
}

export function chronicleJson(meta: ChronicleMeta, now = new Date()): string {
  return JSON.stringify({ ...meta, exportedAt: now.toISOString() }, null, 2);
}

export function chronicleShareText(meta: ChronicleMeta): string {
  const latest = meta.history[meta.history.length - 1];
  const totalTax = meta.history.reduce((sum, r) => sum + (r.tax ?? 0), 0);
  const latestLine = latest
    ? `最近：第 ${latest.round} 轮 ${latest.winner ?? '流标'}${latest.bid === null ? '' : ` · ${latest.bid} 金`}`
    : '还没有记录';
  return `《${meta.civilization}》第 ${meta.round}/${meta.maxRounds} 轮 · ${meta.rules.name}\n已记录 ${meta.history.length} 轮 · 累计税 ${totalTax} 金\n${latestLine}\n—— AI Civilization / DSH`;
}
