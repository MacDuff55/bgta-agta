import { codeOf } from './dates.js';

const SIZE = 1080;
const SKEW = -0.18; // Anton has no italic; skew it by hand so canvas matches the page

async function fontsReady(){
  try {
    await Promise.all([
      document.fonts.load('400 300px Anton'),
      document.fonts.load('600 40px "Space Grotesk"')
    ]);
  } catch (e) {}
}

function skewedText(ctx, text, x, y){
  ctx.save();
  ctx.translate(x, y);
  ctx.transform(1, 0, SKEW, 1, 0, 0);
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function fitFont(ctx, text, family, max, maxWidth){
  let size = max;
  do {
    ctx.font = `400 ${size}px ${family}`;
    size -= 8;
  } while (ctx.measureText(text).width > maxWidth && size > 40);
}

export async function drawCard(canvas, { date, t, url }){
  await fontsReady();
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  const c = codeOf(date);
  const cx = SIZE / 2;

  const bg = ctx.createLinearGradient(0, 0, 0, SIZE);
  bg.addColorStop(0, '#2a0f45');
  bg.addColorStop(.6, '#170f28');
  bg.addColorStop(1, '#0a0714');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SIZE, SIZE);

  const r = 300, sy = 330;
  const sun = ctx.createLinearGradient(0, sy - r, 0, sy + r);
  sun.addColorStop(0, '#ffd23d');
  sun.addColorStop(.58, '#ff3d9a');
  sun.addColorStop(1, '#8a2bff');
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, sy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.globalAlpha = .5;
  ctx.fillStyle = sun;
  ctx.fillRect(cx - r, sy - r, r * 2, r);
  for (let y = sy, band = 0; y < sy + r; band++){
    const h = Math.max(6, 26 - band * 2.2);
    ctx.fillRect(cx - r, y, r * 2, h);
    y += h + 10 + band * 1.5;
  }
  ctx.restore();

  const horizon = 760;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, horizon, SIZE, SIZE - horizon);
  ctx.clip();
  ctx.strokeStyle = 'rgba(33,230,255,.45)';
  ctx.lineWidth = 2;
  for (let i = -14; i <= 14; i++){
    ctx.beginPath();
    ctx.moveTo(cx + i * 30, horizon);
    ctx.lineTo(cx + i * 190, SIZE);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,61,154,.38)';
  for (let k = 0; k < 9; k++){
    const y = horizon + Math.pow(k / 8, 2) * (SIZE - horizon);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(SIZE, y);
    ctx.stroke();
  }
  const fade = ctx.createLinearGradient(0, horizon, 0, horizon + 120);
  fade.addColorStop(0, '#0a0714');
  fade.addColorStop(1, 'rgba(10,7,20,0)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, horizon, SIZE, 120);
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  const word = c.kind === 'release' ? t.gtaDayWordmark : (c.kind === 'before' ? 'B.GTA' : 'A.GTA');
  ctx.font = '400 64px Anton';
  ctx.fillStyle = '#21e6ff';
  ctx.shadowColor = 'rgba(33,230,255,.6)';
  ctx.shadowBlur = 24;
  skewedText(ctx, word.split('').join(' '), cx, 270);

  const big = c.kind === 'release' ? 'GTA' : String(c.n);
  fitFont(ctx, big, 'Anton', 380, 900);
  const numGrad = ctx.createLinearGradient(0, 300, 0, 620);
  numGrad.addColorStop(0, '#ffffff');
  numGrad.addColorStop(1, '#ff3d9a');
  ctx.fillStyle = numGrad;
  ctx.shadowColor = 'rgba(255,61,154,.45)';
  ctx.shadowBlur = 50;
  skewedText(ctx, big, cx, 620);
  ctx.shadowBlur = 0;

  const sub = c.kind === 'release' ? t.gtaDaySub : (c.kind === 'before' ? t.beforeSub(c.n) : t.afterSub(c.n));
  ctx.font = '700 48px "Space Grotesk"';
  ctx.fillStyle = '#f3ecff';
  ctx.fillText(sub, cx, 715);

  const dateLabel = date.toLocaleDateString(t.locale, { day:'numeric', month:'long', year:'numeric' });
  ctx.font = '600 34px "Space Grotesk"';
  ctx.fillStyle = 'rgba(243,236,255,.82)';
  ctx.fillText(dateLabel, cx, 990);
  ctx.font = '500 26px "Space Grotesk"';
  ctx.fillStyle = 'rgba(168,156,206,.95)';
  ctx.fillText(url.replace(/^https?:\/\//, '').replace(/\/$/, ''), cx, 1036);
}

export function canvasBlob(canvas){
  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}
