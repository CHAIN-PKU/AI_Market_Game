import { makeResidentPortrait } from './characterArt';
import { loreFor } from './agentLore';
import { ROLE_KEY, ROLE_LABEL, type BidDemoFixture } from './types';

const W = 2400;
const H = 1500;

function load(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function downloadCastPoster(fixture: BidDemoFixture): Promise<void> {
  const portraits = await Promise.all(
    fixture.agents.map((agent, i) => load(makeResidentPortrait(i, ROLE_KEY[agent.role]))),
  );

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f6f0e2';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#e4f0e4';
  ctx.fillRect(0, 0, W, 246);
  ctx.fillStyle = '#d5e9d4';
  ctx.beginPath();
  ctx.arc(W - 180, 20, 300, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2f4f45';
  ctx.font = '700 28px "PingFang SC", "Hiragino Sans GB", sans-serif';
  ctx.fillText('晨曦文明 · 居民档案', 100, 80);

  ctx.fillStyle = '#22322b';
  ctx.font = '800 72px "PingFang SC", "Hiragino Sans GB", sans-serif';
  ctx.fillText('这 8 个人，自己决定接不接', 100, 168);

  ctx.fillStyle = '#587064';
  ctx.font = '400 28px "PingFang SC", "Hiragino Sans GB", sans-serif';
  ctx.fillText('同一个制度下，不同性格、不同本事、不同钱包。玩家定规则，AI 自己走。', 100, 218);

  const cols = 4;
  const cardW = 520;
  const cardH = 500;
  const gapX = 40;
  const startX = 90;
  const startY = 300;

  fixture.agents.forEach((agent, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (cardW + gapX);
    const y = startY + row * (cardH + 28);
    const role = ROLE_KEY[agent.role];
    const accent = role === 'coding' ? '#3f8f96' : role === 'research' ? '#8f7cc9' : '#d97a52';

    ctx.fillStyle = '#fffdf7';
    roundRect(ctx, x, y, cardW, cardH, 28);
    ctx.fill();
    ctx.strokeStyle = '#e4d9c4';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.arc(x + 150, y + 140, 118, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#eef6ea';
    ctx.fillRect(x + 20, y + 20, 260, 260);
    const img = portraits[i];
    const ratio = Math.min(220 / img.width, 280 / img.height);
    const dw = img.width * ratio;
    const dh = img.height * ratio;
    ctx.drawImage(img, x + 150 - dw / 2, y + 262 - dh, dw, dh);
    ctx.restore();

    ctx.fillStyle = '#26332c';
    ctx.font = '800 44px "PingFang SC", "Hiragino Sans GB", sans-serif';
    ctx.fillText(agent.displayName, x + 300, y + 120);

    ctx.fillStyle = accent;
    ctx.font = '700 24px "PingFang SC", "Hiragino Sans GB", sans-serif';
    ctx.fillText(`${ROLE_LABEL[agent.role]} · ${agent.personalityLabel}`, x + 300, y + 164);

    ctx.fillStyle = '#8a7e6c';
    ctx.font = '400 21px "PingFang SC", "Hiragino Sans GB", sans-serif';
    ctx.fillText(`${Math.round(agent.walletBefore)} 金 · 技能 ${agent.skillsAfter.length}`, x + 300, y + 268);

    ctx.fillStyle = '#6d6254';
    ctx.font = '400 22px "PingFang SC", "Hiragino Sans GB", sans-serif';
    const motto = `「${loreFor(agent.displayName).motto}」`;
    const maxW = cardW - 88;
    let line = '';
    const lines: string[] = [];
    for (const ch of motto) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line);
        line = ch;
      } else {
        line = test;
      }
      if (lines.length === 2) break;
    }
    if (line && lines.length < 2) lines.push(line);
    lines.slice(0, 2).forEach((text, idx) => ctx.fillText(text, x + 44, y + 325 + idx * 30));

    ctx.fillStyle = '#efe5d2';
    roundRect(ctx, x + 44, y + 388, cardW - 88, 10, 5);
    ctx.fill();
    ctx.fillStyle = accent;
    const ability = Math.max(agent.abilities.coding, agent.abilities.research, agent.abilities.design);
    roundRect(ctx, x + 44, y + 388, (cardW - 88) * Math.min(1, ability / 60), 10, 5);
    ctx.fill();

    ctx.fillStyle = '#8a7e6c';
    ctx.font = '400 20px "PingFang SC", "Hiragino Sans GB", sans-serif';
    ctx.fillText(`写程序 ${agent.abilities.coding} · 做研究 ${agent.abilities.research} · 做设计 ${agent.abilities.design}`, x + 44, y + 435);
  });

  ctx.fillStyle = '#1f6b62';
  ctx.font = '800 26px "PingFang SC", "Hiragino Sans GB", sans-serif';
  ctx.fillText('AI Civilization · 玩家设计规则，AI 自己创造历史', 100, H - 60);
  ctx.fillStyle = '#8a7e6c';
  ctx.font = '400 22px "PingFang SC", "Hiragino Sans GB", sans-serif';
  ctx.fillText('数字由模拟引擎计算；动画只负责播放，不改结果。', 1500, H - 60);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-civ-cast-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}
