import { describe, expect, it } from 'vitest';
import { chronicleJson, chronicleMarkdown, chronicleShareText, type ChronicleMeta } from './campaignExport';
import type { RoundHistory } from './types';

const history: RoundHistory[] = [
  { round: 1, domain: 'coding', title: '修复网站登录问题', winner: 'Delta', bid: 71, tax: 8, net: 92, skill: 'Clean Code Patterns', treasuryAfter: 1032 },
  { round: 2, domain: 'research', title: '整理竞品研究报告', winner: 'Echo', bid: 82, tax: 9, net: 101, skill: null, treasuryAfter: 1050 },
];

const meta: ChronicleMeta = {
  civilization: '晨曦文明',
  round: 2,
  maxRounds: 5,
  rules: { name: '自由市场', taxRate: 0.08 },
  history,
};

describe('chronicle export', () => {
  it('renders a markdown table with domain labels and totals', () => {
    const md = chronicleMarkdown(meta, new Date('2026-11-08T02:00:00+08:00'));
    expect(md).toContain('# 晨曦文明 · 文明编年史');
    expect(md).toContain('| 1 | 写程序 · 修复网站登录问题 | Delta | 71 | 8 / 92 |');
    expect(md).toContain('| 2 | 做研究 · 整理竞品研究报告 | Echo | 82 | 9 / 101 |');
    expect(md).toContain('累计税：17');
    expect(md).toContain('导出于 2026-11-08');
  });

  it('renders valid JSON with history and exportedAt', () => {
    const parsed = JSON.parse(chronicleJson(meta, new Date('2026-11-08T02:00:00Z'))) as ChronicleMeta & { exportedAt: string };
    expect(parsed.history).toHaveLength(2);
    expect(parsed.exportedAt).toBe('2026-11-08T02:00:00.000Z');
    expect(parsed.civilization).toBe('晨曦文明');
  });

  it('builds a short share snippet', () => {
    const text = chronicleShareText(meta);
    expect(text).toContain('第 2/5 轮');
    expect(text).toContain('累计税 17 金');
    expect(text).toContain('Echo · 82 金');
  });
});
