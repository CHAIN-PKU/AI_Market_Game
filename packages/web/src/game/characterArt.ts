import { CanvasTexture, ClampToEdgeWrapping, LinearFilter, LinearMipmapLinearFilter, SRGBColorSpace } from 'three';
type RoleKey = 'coding' | 'research' | 'design';

type Look = {
  skin: string;
  skinShade: string;
  hair: string;
  hairDark: string;
  shirt: string;
  shirtDark: string;
  pants: string;
  shoes: string;
  accent: string;
  style: number;
  face: number;
  build: number;
  expression: number;
};

const LOOKS: Look[] = [
  { skin: '#f4c9a4', skinShade: '#dfa982', hair: '#2f211b', hairDark: '#1c130f', shirt: '#3f8f96', shirtDark: '#2f6f75', pants: '#3d4657', shoes: '#4a3428', accent: '#e0a94f', style: 1 , face: 1 , build: 1, expression: 0 },
  { skin: '#e7b48a', skinShade: '#cf956b', hair: '#5a3a25', hairDark: '#3d2517', shirt: '#8f7cc9', shirtDark: '#6d5aa6', pants: '#4f596b', shoes: '#54443a', accent: '#f0d38a', style: 3 , face: 2 , build: 0, expression: 1 },
  { skin: '#c98d63', skinShade: '#ad724c', hair: '#1f2933', hairDark: '#10161d', shirt: '#d97a52', shirtDark: '#b85a3a', pants: '#5b4a44', shoes: '#3b2b22', accent: '#9fd8d2', style: 0 , face: 0 , build: 2, expression: 2 },
  { skin: '#9c6644', skinShade: '#7e4e32', hair: '#1f2933', hairDark: '#0e1318', shirt: '#5fb3c3', shirtDark: '#3f8f96', pants: '#334b52', shoes: '#2d3b36', accent: '#f3a6b8', style: 2 , face: 1 , build: 1, expression: 0 },
  { skin: '#f7d6b8', skinShade: '#dfb894', hair: '#c08a3e', hairDark: '#94672a', shirt: '#7cbf7a', shirtDark: '#4f8b52', pants: '#46513f', shoes: '#4a3428', accent: '#e8d8b8', style: 4 , face: 0 , build: 0, expression: 1 },
  { skin: '#d9a078', skinShade: '#bd8560', hair: '#d9c8a0', hairDark: '#b3a37c', shirt: '#b8842f', shirtDark: '#8a5a2f', pants: '#5a4b63', shoes: '#4a3428', accent: '#f6d36b', style: 5 , face: 2 , build: 2, expression: 2 },
  { skin: '#b97c55', skinShade: '#9b6242', hair: '#3b2a24', hairDark: '#211611', shirt: '#e0a94f', shirtDark: '#b8842f', pants: '#3f4a3d', shoes: '#3b2b22', accent: '#8f7cc9', style: 1 , face: 1 , build: 1, expression: 0 },
  { skin: '#efc39b', skinShade: '#d5a57d', hair: '#6b3f2a', hairDark: '#47271a', shirt: '#c96f58', shirtDark: '#a04f3c', pants: '#4d4f5e', shoes: '#3b2b22', accent: '#7cbf7a', style: 3 , face: 0 , build: 0, expression: 1 },
];

const ROLE_SHIRT: Record<RoleKey, string> = {
  coding: '#3f8f96',
  research: '#8f7cc9',
  design: '#d97a52',
};
const ROLE_SHIRT_DARK: Record<RoleKey, string> = {
  coding: '#2f6f75',
  research: '#6d5aa6',
  design: '#b85a3a',
};

const OUTLINE = '#33231c';
const S = 768 / 683;

function path(ctx: CanvasRenderingContext2D, draw: () => void, fill: string, outline = true) {
  ctx.beginPath();
  draw();
  ctx.fillStyle = fill;
  ctx.fill();
  if (outline) {
    ctx.lineWidth = 7;
    ctx.strokeStyle = OUTLINE;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
}

function ellipsePath(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rot = 0) {
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
}

function limb(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, width: number, fill: string) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineCap = 'round';
  ctx.lineWidth = width + 14;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.lineWidth = width;
  ctx.strokeStyle = fill;
  ctx.stroke();
  ctx.lineCap = 'butt';
}

function drawLegs(ctx: CanvasRenderingContext2D, l: Look, pose = 0) {
  const stride = pose ? 14 : 0;
  for (const [x, tilt] of [[-52 - stride, 0.05 + (pose ? 0.05 : 0)], [52 + stride, -0.05 - (pose ? 0.05 : 0)]] as const) {
    ctx.save();
    ctx.translate(341 + x, 690 + (pose && x < 0 ? -5 : 0));
    ctx.rotate(tilt);
    path(ctx, () => {
      ctx.moveTo(-34, 0);
      ctx.quadraticCurveTo(-38, 120, -31, 208);
      ctx.lineTo(31, 208);
      ctx.quadraticCurveTo(38, 120, 34, 0);
      ctx.closePath();
    }, l.pants);
    // oversized cartoon shoe
    path(ctx, () => {
      ctx.moveTo(-36, 190);
      ctx.quadraticCurveTo(-52, 218, -44, 244);
      ctx.quadraticCurveTo(0, 266, 44, 244);
      ctx.quadraticCurveTo(52, 218, 36, 190);
      ctx.closePath();
    }, l.shoes);
    path(ctx, () => {
      ctx.ellipse(0, 244, 34, 13, 0, 0, Math.PI * 2);
    }, '#2b1f19', false);
    path(ctx, () => {
      ctx.ellipse(0, 236, 29, 8, 0, 0, Math.PI * 2);
    }, '#e8d8c4', false);
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(-14, 222, 13, Math.PI * 1.1, Math.PI * 1.7);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
    // laces
    ctx.strokeStyle = '#f7ead2';
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-12, 204 + i * 7);
      ctx.quadraticCurveTo(0, 199 + i * 7, 12, 204 + i * 7);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawBody(ctx: CanvasRenderingContext2D, l: Look, role: RoleKey) {
  // torso
  path(ctx, () => {
    ctx.moveTo(268, 448);
    ctx.quadraticCurveTo(238, 500, 244, 640);
    ctx.quadraticCurveTo(300, 680, 341, 680);
    ctx.quadraticCurveTo(382, 680, 438, 640);
    ctx.quadraticCurveTo(444, 500, 414, 448);
    ctx.quadraticCurveTo(341, 420, 268, 448);
    ctx.closePath();
  }, l.shirt);
  // shade panel
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.beginPath();
  ctx.moveTo(395, 452);
  ctx.quadraticCurveTo(430, 510, 424, 640);
  ctx.quadraticCurveTo(400, 665, 380, 675);
  ctx.lineTo(380, 455);
  ctx.closePath();
  ctx.fillStyle = l.shirtDark;
  ctx.fill();
  ctx.restore();
  // apron / vest
  if (role === 'design') {
    path(ctx, () => {
      ctx.moveTo(292, 490);
      ctx.lineTo(390, 490);
      ctx.quadraticCurveTo(405, 600, 388, 660);
      ctx.quadraticCurveTo(341, 678, 294, 660);
      ctx.quadraticCurveTo(276, 600, 292, 490);
      ctx.closePath();
    }, '#f6e8d8', true);
  } else if (role === 'coding') {
    path(ctx, () => {
      ctx.moveTo(282, 470);
      ctx.lineTo(310, 470);
      ctx.quadraticCurveTo(300, 560, 306, 650);
      ctx.lineTo(280, 642);
      ctx.quadraticCurveTo(266, 550, 282, 470);
      ctx.closePath();
    }, l.shirtDark);
  }
  if (role === 'research') {
    path(ctx, () => {
      ctx.moveTo(276, 462);
      ctx.quadraticCurveTo(258, 560, 266, 658);
      ctx.quadraticCurveTo(300, 672, 315, 664);
      ctx.lineTo(320, 470);
      ctx.closePath();
    }, '#f7f0df');
    path(ctx, () => {
      ctx.moveTo(406, 462);
      ctx.quadraticCurveTo(424, 560, 416, 658);
      ctx.quadraticCurveTo(382, 672, 367, 664);
      ctx.lineTo(362, 470);
      ctx.closePath();
    }, '#f7f0df');
    path(ctx, () => { ctx.rect(300, 560, 34, 42); }, '#e8dcc8');
  }
  // collar
  path(ctx, () => {
    ctx.moveTo(300, 448);
    ctx.quadraticCurveTo(341, 478, 382, 448);
    ctx.quadraticCurveTo(341, 500, 300, 448);
    ctx.closePath();
  }, '#f7efe0');
  // belt
  path(ctx, () => {
    ctx.moveTo(250, 626);
    ctx.quadraticCurveTo(341, 654, 432, 626);
    ctx.lineTo(430, 658);
    ctx.quadraticCurveTo(341, 684, 252, 658);
    ctx.closePath();
  }, '#6b4a2f');
  path(ctx, () => {
    ctx.rect(322, 632, 38, 30);
  }, l.accent);
  // role pin
  path(ctx, () => {
    ctx.ellipse(341, 520, 17, 17, 0, 0, Math.PI * 2);
  }, l.accent);
  ctx.fillStyle = '#fff8e9';
  ctx.font = '700 18px "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(role === 'coding' ? '</>' : role === 'research' ? 'R' : 'D', 341, 527);
}

function drawArms(ctx: CanvasRenderingContext2D, l: Look, pose = 0) {
  if (pose) {
    const swing = 13;
    // walking: upper arm and forearm swing in opposite directions
    for (const [side, sx] of [[-1, 278], [1, 404]] as const) {
      const shoulderX = sx;
      const elbowX = sx + side * 32 - side * swing * 0.45;
      const elbowY = 576;
      const handX = sx + side * 20 + side * swing;
      const handY = 646 - side * swing;
      limb(ctx, shoulderX, 500, elbowX, elbowY, 44, l.shirt);
      limb(ctx, elbowX, elbowY, handX, handY, 34, l.shirt);
      path(ctx, () => { ctx.ellipse(handX, handY + 10, 22, 12, 0, 0, Math.PI * 2); }, l.accent);
      path(ctx, () => { ctx.ellipse(handX, handY + 26, 25, 31, 0.08 * side, 0, Math.PI * 2); }, l.skin);
      path(ctx, () => { ctx.ellipse(handX + 16 * side, handY + 18, 8, 15, 0.45 * side, 0, Math.PI * 2); }, l.skin);
    }
    return;
  }

  // idle: hands on hips, elbows out
  for (const [side, sx] of [[-1, 278], [1, 404]] as const) {
    const elbowX = sx + side * 58;
    const elbowY = 574;
    const handX = 341 + side * 78;
    const handY = 612;
    limb(ctx, sx, 500, elbowX, elbowY, 46, l.shirt);
    limb(ctx, elbowX, elbowY, handX, handY, 36, l.shirt);
    path(ctx, () => { ctx.ellipse(handX, handY - 4, 25, 12, 0.2 * side, 0, Math.PI * 2); }, l.accent);
    path(ctx, () => { ctx.ellipse(handX, handY + 12, 27, 30, 0.15 * side, 0, Math.PI * 2); }, l.skin);
    path(ctx, () => { ctx.ellipse(handX - 18 * side, handY + 4, 8, 16, 0.5 * side, 0, Math.PI * 2); }, l.skin);
  }
}

function drawHairBack(ctx: CanvasRenderingContext2D, l: Look) {
  const style = l.style;
  if (style === 0) {
    path(ctx, () => { ellipsePath(ctx, 341, 300, 166, 170); }, l.hairDark);
  } else if (style === 1) {
    path(ctx, () => {
      ctx.moveTo(190, 300);
      ctx.quadraticCurveTo(178, 430, 214, 520);
      ctx.quadraticCurveTo(250, 540, 270, 500);
      ctx.lineTo(270, 300);
      ctx.closePath();
    }, l.hairDark);
    path(ctx, () => {
      ctx.moveTo(492, 300);
      ctx.quadraticCurveTo(504, 430, 468, 520);
      ctx.quadraticCurveTo(432, 540, 412, 500);
      ctx.lineTo(412, 300);
      ctx.closePath();
    }, l.hairDark);
    path(ctx, () => { ellipsePath(ctx, 341, 296, 162, 166); }, l.hairDark);
  } else if (style === 2) {
    path(ctx, () => { ctx.ellipse(341, 250, 112, 92, 0, 0, Math.PI * 2); }, l.hairDark);
    path(ctx, () => { ellipsePath(ctx, 341, 310, 162, 170); }, l.hairDark);
  } else if (style === 3 || style === 5) {
    path(ctx, () => {
      ctx.moveTo(188, 300);
      ctx.quadraticCurveTo(168, 500, 200, 690);
      ctx.quadraticCurveTo(270, 720, 300, 650);
      ctx.lineTo(300, 300);
      ctx.closePath();
    }, l.hairDark);
    path(ctx, () => {
      ctx.moveTo(494, 300);
      ctx.quadraticCurveTo(514, 500, 482, 690);
      ctx.quadraticCurveTo(412, 720, 382, 650);
      ctx.lineTo(382, 300);
      ctx.closePath();
    }, l.hairDark);
    path(ctx, () => { ellipsePath(ctx, 341, 300, 165, 172); }, l.hairDark);
  } else {
    // side ponytail
    path(ctx, () => {
      ctx.moveTo(470, 280);
      ctx.quadraticCurveTo(570, 330, 548, 500);
      ctx.quadraticCurveTo(520, 560, 490, 510);
      ctx.quadraticCurveTo(512, 390, 450, 330);
      ctx.closePath();
    }, l.hairDark);
    path(ctx, () => { ellipsePath(ctx, 341, 300, 162, 168); }, l.hairDark);
  }
}

function drawHairFront(ctx: CanvasRenderingContext2D, l: Look) {
  const style = l.style;
  // cap
  path(ctx, () => {
    ctx.moveTo(188, 300);
    ctx.quadraticCurveTo(180, 150, 341, 128);
    ctx.quadraticCurveTo(502, 150, 494, 300);
    ctx.quadraticCurveTo(470, 220, 420, 208);
    ctx.quadraticCurveTo(380, 250, 341, 220);
    ctx.quadraticCurveTo(300, 250, 262, 208);
    ctx.quadraticCurveTo(212, 222, 188, 300);
    ctx.closePath();
  }, l.hair);
  // bangs
  if (style === 0) {
    path(ctx, () => {
      ctx.moveTo(220, 250);
      ctx.quadraticCurveTo(280, 190, 341, 205);
      ctx.quadraticCurveTo(400, 190, 462, 250);
      ctx.quadraticCurveTo(400, 228, 341, 250);
      ctx.quadraticCurveTo(280, 228, 220, 250);
      ctx.closePath();
    }, l.hair);
  } else if (style === 1 || style === 2) {
    for (const [x, w, h] of [[245, 70, 120], [341, 88, 135], [437, 70, 120]] as const) {
      path(ctx, () => {
        ctx.moveTo(x - w / 2, 220);
        ctx.quadraticCurveTo(x - w / 3, 220 + h, x + w / 2, 238);
        ctx.quadraticCurveTo(x + w / 3, 200, x - w / 2, 220);
        ctx.closePath();
      }, l.hair);
    }
  } else {
    path(ctx, () => {
      ctx.moveTo(210, 236);
      ctx.quadraticCurveTo(300, 180, 341, 225);
      ctx.quadraticCurveTo(390, 178, 472, 236);
      ctx.quadraticCurveTo(400, 215, 341, 258);
      ctx.quadraticCurveTo(282, 215, 210, 236);
      ctx.closePath();
    }, l.hair);
  }
  // highlight
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.strokeStyle = l.hairDark;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(330, 190, 92, Math.PI * 1.15, Math.PI * 1.65);
  ctx.stroke();
  ctx.restore();
}

function drawFace(ctx: CanvasRenderingContext2D, l: Look, role: RoleKey) {
  // ears
  path(ctx, () => { ctx.ellipse(196, 336, 24, 39, -0.1, 0, Math.PI * 2); }, l.skin);
  path(ctx, () => { ctx.ellipse(486, 336, 24, 39, 0.1, 0, Math.PI * 2); }, l.skin);
  // face
  path(ctx, () => {
    ctx.moveTo(206, 286);
    ctx.quadraticCurveTo(206, 160, 341, 158);
    ctx.quadraticCurveTo(476, 160, 476, 286);
    ctx.quadraticCurveTo(476, 430, 341, 472);
    ctx.quadraticCurveTo(206, 430, 206, 286);
    ctx.closePath();
  }, l.skin);
  // jaw shade
  ctx.save();
  ctx.globalAlpha = 0.14;
  path(ctx, () => {
    ctx.moveTo(226, 360);
    ctx.quadraticCurveTo(250, 440, 341, 468);
    ctx.quadraticCurveTo(432, 440, 456, 360);
    ctx.quadraticCurveTo(400, 430, 341, 438);
    ctx.quadraticCurveTo(282, 430, 226, 360);
    ctx.closePath();
  }, l.skinShade, false);
  ctx.restore();
  // eyes
  for (const [x, flip] of [[294, 1], [388, -1]] as const) {
    const eyeY = 318;
    path(ctx, () => { ellipsePath(ctx, x, eyeY, 31, 38); }, '#fffaf2');
    // iris
    ctx.beginPath();
    ctx.ellipse(x + 2, eyeY + 3, 21, 27, 0, 0, Math.PI * 2);
    const grad = ctx.createLinearGradient(x - 20, eyeY - 24, x + 22, eyeY + 30);
    grad.addColorStop(0, role === 'research' ? '#a89ad8' : role === 'design' ? '#d9a078' : '#82b7a8');
    grad.addColorStop(1, role === 'research' ? '#5b4a86' : role === 'design' ? '#8f5a3a' : '#2f5a55');
    ctx.fillStyle = grad;
    ctx.fill();
    // pupil
    ctx.beginPath();
    ctx.ellipse(x + 2, eyeY + 6, 9, 14, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#241a17';
    ctx.fill();
    // highlights
    ctx.beginPath();
    ctx.ellipse(x - 5, eyeY - 9, 7, 9, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 9, eyeY + 13, 3.5, 4.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();
    // upper lash
    ctx.beginPath();
    ctx.arc(x, eyeY - 2, 32, Math.PI * 1.12, Math.PI * 1.88);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.stroke();
    // outer lash
    ctx.beginPath();
    ctx.moveTo(x + flip * 28, eyeY - 18);
    ctx.quadraticCurveTo(x + flip * 42, eyeY - 26, x + flip * 48, eyeY - 36);
    ctx.lineWidth = 5;
    ctx.stroke();
    // eyelid crease
    ctx.beginPath();
    ctx.arc(x, eyeY - 2, 38, Math.PI * 1.08, Math.PI * 1.55);
    ctx.strokeStyle = 'rgba(90, 55, 40, 0.38)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // lower lash
    ctx.beginPath();
    ctx.arc(x, eyeY + 4, 34, Math.PI * 0.12, Math.PI * 0.42);
    ctx.strokeStyle = 'rgba(60, 38, 30, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // brow
    ctx.beginPath();
    const browLift = l.expression === 1 ? (flip > 0 ? 8 : 0) : 0;
    ctx.moveTo(x - 27 * flip, eyeY - 48 - browLift);
    ctx.quadraticCurveTo(x, eyeY - 58 - browLift, x + 27 * flip, eyeY - 48);
    ctx.strokeStyle = l.hairDark;
    ctx.lineWidth = 6;
    ctx.stroke();
  }
  // nose
  ctx.beginPath();
  ctx.moveTo(338, 354);
  ctx.quadraticCurveTo(332, 368, 342, 370);
  ctx.strokeStyle = 'rgba(120,70,50,0.55)';
  ctx.lineWidth = 4;
  ctx.stroke();
  // mouth
  if (l.expression === 2) {
    path(ctx, () => {
      ctx.moveTo(318, 394);
      ctx.quadraticCurveTo(341, 426, 364, 394);
      ctx.quadraticCurveTo(341, 408, 318, 394);
      ctx.closePath();
    }, '#8f4038');
    ctx.fillStyle = '#fff8ee';
    ctx.fillRect(332, 396, 18, 6);
  } else if (l.expression === 1) {
    ctx.beginPath();
    ctx.moveTo(320, 402);
    ctx.quadraticCurveTo(342, 410, 364, 394);
    ctx.strokeStyle = '#a34e43';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(318, 398);
    ctx.quadraticCurveTo(341, 416, 364, 398);
    ctx.strokeStyle = '#a34e43';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  // blush
  for (const x of [248, 434]) {
    ctx.beginPath();
    ctx.ellipse(x, 370, 27, 15, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(240,150,145,0.32)';
    ctx.fill();
  }
}

function drawAccessory(ctx: CanvasRenderingContext2D, l: Look, role: RoleKey) {
  if (role === 'coding') {
    ctx.beginPath();
    ctx.arc(341, 300, 172, Math.PI * 1.05, Math.PI * 1.95);
    ctx.strokeStyle = '#2f6f75';
    ctx.lineWidth = 13;
    ctx.stroke();
    for (const x of [170, 512]) {
      path(ctx, () => { ctx.ellipse(x, 330, 22, 30, 0, 0, Math.PI * 2); }, '#2f6f75');
    }
  } else if (role === 'research') {
    for (const x of [294, 388]) {
      ctx.beginPath();
      ctx.ellipse(x, 318, 37, 44, 0, 0, Math.PI * 2);
      ctx.strokeStyle = '#6b4a2f';
      ctx.lineWidth = 5;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(331, 318);
    ctx.lineTo(351, 318);
    ctx.strokeStyle = '#6b4a2f';
    ctx.lineWidth = 5;
    ctx.stroke();
  } else if (role === 'design') {
    ctx.save();
    ctx.translate(330, 152);
    ctx.rotate(-0.12);
    path(ctx, () => { ctx.ellipse(0, 0, 96, 34, 0, 0, Math.PI * 2); }, l.accent);
    path(ctx, () => { ctx.ellipse(28, -26, 40, 24, 0.2, 0, Math.PI * 2); }, l.accent);
    ctx.restore();
  }
}

function getLook(index: number, role: RoleKey): Look {
  const base = LOOKS[index % LOOKS.length]!;
  return { ...base, shirt: ROLE_SHIRT[role], shirtDark: ROLE_SHIRT_DARK[role] };
}

function drawResident(ctx: CanvasRenderingContext2D, look: Look, role: RoleKey, pose: number) {
  drawHairBack(ctx, look);
  const buildW = look.build === 1 ? 1.05 : look.build === 2 ? 0.95 : 1;
  ctx.save();
  ctx.translate(341, 0);
  ctx.scale(buildW, 1);
  ctx.translate(-341, 0);
  drawLegs(ctx, look, pose);
  drawBody(ctx, look, role);
  drawArms(ctx, look, pose);
  ctx.restore();
  const faceScale = look.face === 1 ? 1.05 : look.face === 2 ? 0.95 : 1;
  ctx.save();
  ctx.translate(341, 0);
  ctx.scale(faceScale, 1);
  ctx.translate(-341, 0);
  drawFace(ctx, look, role);
  drawHairFront(ctx, look);
  drawAccessory(ctx, look, role);
  ctx.restore();
}

/** Two-frame atlas: left = idle, right = walk. */
export function makeResidentAtlas(index: number, role: RoleKey): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1536;
  canvas.height = 1536;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const look = getLook(index, role);

  for (let frame = 0; frame < 2; frame += 1) {
    ctx.save();
    ctx.translate(frame * 768, 0);
    ctx.scale(S, S);
    drawResident(ctx, look, role, frame);
    ctx.restore();
  }

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.magFilter = LinearFilter;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.anisotropy = 8;
  tex.wrapS = tex.wrapT = ClampToEdgeWrapping;
  tex.repeat.set(0.5, 1);
  tex.offset.set(0, 0);
  return tex;
}


/** Transparent portrait for the right-hand dossier (idle frame). */
export function makeResidentPortrait(index: number, role: RoleKey): string {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 576;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.scale(384 / 683, 384 / 683);
  drawResident(ctx, getLook(index, role), role, 0);
  return canvas.toDataURL('image/png');
}
