import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';

function canvas(size = 256): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  return [c, c.getContext('2d')!];
}

function rng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function makeGrassTexture(): CanvasTexture {
  const [c, ctx] = canvas(512);
  const rand = rng(7);
  ctx.fillStyle = '#8fce86';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2400; i += 1) {
    const x = rand() * 512;
    const y = rand() * 512;
    const r = 1 + rand() * 3;
    ctx.fillStyle = rand() > 0.5 ? '#7cbd75' : '#a3dc95';
    ctx.globalAlpha = 0.25 + rand() * 0.35;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.6, r, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 90; i += 1) {
    ctx.strokeStyle = 'rgba(74, 126, 75, 0.28)';
    ctx.lineWidth = 1;
    const x = rand() * 512;
    const y = rand() * 512;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rand() - 0.5) * 4, y - 3 - rand() * 5);
    ctx.stroke();
  }
  const tex = new CanvasTexture(c);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.repeat.set(5, 5);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function makePlazaTexture(): CanvasTexture {
  const [c, ctx] = canvas(512);
  const rand = rng(19);
  ctx.fillStyle = '#e7d6b3';
  ctx.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 64) {
    for (let x = 0; x < 512; x += 64) {
      const offset = (Math.floor(y / 64) % 2) * 32;
      ctx.fillStyle = rand() > 0.5 ? '#e2cfa9' : '#ecdcbb';
      ctx.fillRect(x + offset, y, 62, 62);
      ctx.strokeStyle = 'rgba(126, 105, 72, 0.22)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + offset, y, 62, 62);
    }
  }
  for (let i = 0; i < 500; i += 1) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(126,105,72,0.12)' : 'rgba(255,255,255,0.18)';
    ctx.fillRect(rand() * 512, rand() * 512, 1 + rand() * 3, 1 + rand() * 3);
  }
  const tex = new CanvasTexture(c);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.repeat.set(5, 5);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}
