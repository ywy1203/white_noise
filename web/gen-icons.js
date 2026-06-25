const { createCanvas } = require('canvas');
const fs = require('fs');

function makeIcon(size) {
  const c = createCanvas(size, size);
  const ctx = c.getContext('2d');
  // dark bg
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.2);
  ctx.fill();
  // center dot/clock
  const cx = size / 2, cy = size / 2, r = size * 0.3;
  ctx.strokeStyle = 'rgba(255,255,255,.15)';
  ctx.lineWidth = size * 0.02;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  // hands
  ctx.strokeStyle = 'rgba(255,255,255,.5)';
  ctx.lineWidth = size * 0.015;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - r * 0.65); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + r * 0.5, cy); ctx.stroke();
  // center dot
  ctx.fillStyle = 'rgba(74,222,128,.7)';
  ctx.beginPath(); ctx.arc(cx, cy, size * 0.04, 0, Math.PI * 2); ctx.fill();

  fs.writeFileSync(`icon-${size}.png`, c.toBuffer('image/png'));
}

makeIcon(192);
makeIcon(512);
console.log('icons done');
