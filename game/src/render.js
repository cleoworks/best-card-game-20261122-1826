// The canvas painter for Emberfall. Everything is drawn from code — felt table, gold trim,
// parchment cards with procedural sigils — so the game needs no image files. Cards are told
// apart by sigil shape, colour and a big value number, readable even shrunk to a thumbnail.

import { MAX_EMBER_CAP, MAX_LIFE, PHASE } from './battle.js';
import { SIGIL } from './cards.js';

export const VIEW = { width: 1280, height: 800 };
export const SCREEN = { TITLE: 'title', PLAY: 'play', WON: 'won', LOST: 'lost' };

export const CARD_W = 140;
export const CARD_H = 200;
const HAND_Y = 578;

const GOLD = '#d9a441';
const GOLD_BRIGHT = '#f4cd6d';
const PARCHMENT = '#f3e6c8';
const INK = '#2a2118';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (ctx.measureText(trial).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = trial;
  }
  if (line) lines.push(line);
  return lines;
}

/** A teardrop flame centred at (cx, cy), `size` tall. */
function drawFlame(ctx, cx, cy, size, color, inner = '#ffd23e') {
  const s = size / 100;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -52 * s);
  ctx.bezierCurveTo(30 * s, -18 * s, 40 * s, 6 * s, 40 * s, 24 * s);
  ctx.bezierCurveTo(40 * s, 46 * s, 22 * s, 56 * s, 0, 56 * s);
  ctx.bezierCurveTo(-22 * s, 56 * s, -40 * s, 46 * s, -40 * s, 24 * s);
  ctx.bezierCurveTo(-40 * s, 4 * s, -26 * s, -14 * s, -12 * s, -28 * s);
  ctx.bezierCurveTo(-6 * s, -34 * s, -2 * s, -42 * s, 0, -52 * s);
  ctx.fill();
  ctx.fillStyle = inner;
  ctx.beginPath();
  ctx.moveTo(0, -8 * s);
  ctx.bezierCurveTo(14 * s, 6 * s, 18 * s, 16 * s, 18 * s, 26 * s);
  ctx.bezierCurveTo(18 * s, 42 * s, 10 * s, 48 * s, 0, 48 * s);
  ctx.bezierCurveTo(-10 * s, 48 * s, -18 * s, 42 * s, -18 * s, 26 * s);
  ctx.bezierCurveTo(-18 * s, 14 * s, -8 * s, 4 * s, 0, -8 * s);
  ctx.fill();
  ctx.restore();
}

/** One card sigil, drawn by shape so suits read without words. */
export function drawSigil(ctx, sigil, cx, cy, size, color) {
  const s = size / 100;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 7 * s;
  ctx.lineCap = 'round';
  if (sigil === SIGIL.FLAME) {
    drawFlame(ctx, 0, 0, size, color, '#fff3c4');
  } else if (sigil === SIGIL.FROST) {
    for (let i = 0; i < 6; i += 1) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 3);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -44 * s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -30 * s); ctx.lineTo(-11 * s, -41 * s); ctx.moveTo(0, -30 * s); ctx.lineTo(11 * s, -41 * s); ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath(); ctx.arc(0, 0, 9 * s, 0, Math.PI * 2); ctx.fill();
  } else if (sigil === SIGIL.THORN) {
    ctx.beginPath();
    ctx.moveTo(-38 * s, 42 * s);
    ctx.quadraticCurveTo(0, -30 * s, 38 * s, -42 * s);
    ctx.stroke();
    for (const t of [-0.55, 0, 0.55]) {
      const px = 38 * s * t;
      const py = (10 - 44 * Math.abs(t)) * s;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - 16 * s, py + 4 * s);
      ctx.lineTo(px + 2 * s, py + 18 * s);
      ctx.closePath(); ctx.fill();
    }
  } else if (sigil === SIGIL.SHIELD) {
    ctx.beginPath();
    ctx.moveTo(0, -46 * s);
    ctx.lineTo(36 * s, -32 * s);
    ctx.lineTo(36 * s, 8 * s);
    ctx.quadraticCurveTo(36 * s, 36 * s, 0, 50 * s);
    ctx.quadraticCurveTo(-36 * s, 36 * s, -36 * s, 8 * s);
    ctx.lineTo(-36 * s, -32 * s);
    ctx.closePath();
    ctx.globalAlpha = 0.28; ctx.fill(); ctx.globalAlpha = 1; ctx.stroke();
  } else if (sigil === SIGIL.HEART) {
    ctx.beginPath();
    ctx.moveTo(0, 42 * s);
    ctx.bezierCurveTo(-52 * s, 8 * s, -40 * s, -34 * s, -14 * s, -34 * s);
    ctx.bezierCurveTo(-4 * s, -34 * s, 0, -26 * s, 0, -18 * s);
    ctx.bezierCurveTo(0, -26 * s, 4 * s, -34 * s, 14 * s, -34 * s);
    ctx.bezierCurveTo(40 * s, -34 * s, 52 * s, 8 * s, 0, 42 * s);
    ctx.fill();
  } else if (sigil === SIGIL.SPARK) {
    ctx.beginPath();
    ctx.moveTo(10 * s, -50 * s);
    ctx.lineTo(-22 * s, 8 * s);
    ctx.lineTo(-2 * s, 8 * s);
    ctx.lineTo(-12 * s, 50 * s);
    ctx.lineTo(24 * s, -10 * s);
    ctx.lineTo(3 * s, -10 * s);
    ctx.closePath(); ctx.fill();
  } else if (sigil === SIGIL.COIN) {
    ctx.beginPath(); ctx.arc(0, 0, 42 * s, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 29 * s, 0, Math.PI * 2); ctx.globalAlpha = 0.3; ctx.fill(); ctx.globalAlpha = 1; ctx.stroke();
    ctx.font = `bold ${44 * s}px Georgia, serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('E', 0, 2 * s);
  } else if (sigil === SIGIL.CROWN) {
    ctx.beginPath();
    ctx.moveTo(-42 * s, 30 * s);
    ctx.lineTo(-46 * s, -26 * s);
    ctx.lineTo(-18 * s, 2 * s);
    ctx.lineTo(0, -34 * s);
    ctx.lineTo(18 * s, 2 * s);
    ctx.lineTo(46 * s, -26 * s);
    ctx.lineTo(42 * s, 30 * s);
    ctx.closePath(); ctx.fill();
    ctx.fillRect(-42 * s, 36 * s, 84 * s, 8 * s);
  }
  ctx.restore();
}

/** A face-up card at (x, y). `opts.dim` greys it (unaffordable), `opts.lift` raises its shadow. */
export function drawCard(ctx, card, x, y, w = CARD_W, h = CARD_H, opts = {}) {
  const scale = w / CARD_W;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = opts.lift ? 26 : 14;
  ctx.shadowOffsetY = opts.lift ? 10 : 5;
  const body = ctx.createLinearGradient(0, 0, 0, CARD_H);
  body.addColorStop(0, '#f8eed3');
  body.addColorStop(1, '#e7d3a4');
  roundRect(ctx, 0, 0, CARD_W, CARD_H, 12);
  ctx.fillStyle = opts.dim ? '#cfc4a8' : body;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 3;
  ctx.strokeStyle = opts.affordable === false ? '#8a7c5c' : GOLD;
  ctx.stroke();
  // Colour band with the sigil.
  roundRect(ctx, 8, 8, CARD_W - 16, 74, 8);
  ctx.fillStyle = card.color;
  ctx.globalAlpha = opts.dim ? 0.45 : 0.92;
  ctx.fill();
  ctx.globalAlpha = 1;
  drawSigil(ctx, card.sigil, CARD_W / 2, 45, 62, '#ffffff');
  // Cost gem.
  ctx.beginPath();
  ctx.arc(24, 24, 17, 0, Math.PI * 2);
  ctx.fillStyle = '#274b73';
  ctx.fill();
  ctx.lineWidth = 2.5; ctx.strokeStyle = GOLD_BRIGHT; ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px Verdana, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(String(card.cost), 24, 25);
  // Name.
  ctx.fillStyle = INK;
  ctx.font = 'bold 15.5px Georgia, serif';
  ctx.fillText(card.name, CARD_W / 2, 100);
  // Big value with its unit word.
  const unit = { strike: 'DAMAGE', guard: 'BLOCK', mend: 'HEAL', kindle: 'EMBER', gambit: 'DRAW' }[card.kind] ?? '';
  ctx.font = 'bold 52px Georgia, serif';
  ctx.fillStyle = card.color === '#f0f0f0' ? '#8a6d1f' : card.color;
  ctx.fillText(String(card.value), CARD_W / 2, 134);
  ctx.font = 'bold 11px Verdana, sans-serif';
  ctx.fillStyle = '#6b5a38';
  ctx.fillText(unit, CARD_W / 2, 162);
  // Rules line.
  ctx.font = '11.5px Verdana, sans-serif';
  ctx.fillStyle = '#4c3f28';
  const lines = wrapText(ctx, card.text, CARD_W - 20);
  lines.slice(0, 2).forEach((line, i) => ctx.fillText(line, CARD_W / 2, 180 + i * 13));
  ctx.restore();
}

/** A face-down card (the Warden's hand): deep red back, gold flame seal. */
export function drawCardBack(ctx, x, y, w = 92, h = 132) {
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
  const body = ctx.createLinearGradient(0, 0, 0, h);
  body.addColorStop(0, '#6e2430');
  body.addColorStop(1, '#451520');
  roundRect(ctx, 0, 0, w, h, 9);
  ctx.fillStyle = body; ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 2.5; ctx.strokeStyle = GOLD; ctx.stroke();
  roundRect(ctx, 6, 6, w - 12, h - 12, 6);
  ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(217,164,65,0.55)'; ctx.stroke();
  drawFlame(ctx, w / 2, h / 2, h * 0.52, GOLD, '#ffdf7e');
  ctx.restore();
}

function drawLifeBar(ctx, x, y, w, life, color) {
  ctx.save();
  roundRect(ctx, x, y, w, 20, 10);
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fill();
  if (life > 0) {
    roundRect(ctx, x + 2, y + 2, Math.max(14, (w - 4) * (life / MAX_LIFE)), 16, 8);
    ctx.fillStyle = color; ctx.fill();
  }
  roundRect(ctx, x, y, w, 20, 10);
  ctx.lineWidth = 1.5; ctx.strokeStyle = GOLD; ctx.stroke();
  ctx.restore();
}

function drawTable(ctx) {
  const g = ctx.createRadialGradient(640, 380, 120, 640, 400, 780);
  g.addColorStop(0, '#1d4a33');
  g.addColorStop(0.6, '#143626');
  g.addColorStop(1, '#0a1f14');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  // Felt speckle.
  ctx.fillStyle = 'rgba(255,255,255,0.025)';
  for (let i = 0; i < 260; i += 1) {
    const x = (i * 613) % VIEW.width;
    const y = (i * 389) % VIEW.height;
    ctx.fillRect(x, y, 2, 2);
  }
  // Gold double trim.
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.strokeRect(10, 10, VIEW.width - 20, VIEW.height - 20);
  ctx.strokeStyle = 'rgba(217,164,65,0.4)';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(20, 20, VIEW.width - 40, VIEW.height - 40);
}

/** Where each hand card sits; shared with input so clicks land on the drawn cards. */
export function handCardRect(state, index) {
  const count = state.hand.length;
  const spacing = Math.min(152, (VIEW.width - 360) / Math.max(1, count));
  const total = spacing * (count - 1) + CARD_W;
  const startX = (VIEW.width - total) / 2 + 30;
  return { x: startX + index * spacing, y: HAND_Y, w: CARD_W, h: CARD_H };
}

export const END_TURN_RECT = { x: 1052, y: 648, w: 188, h: 74 };

function drawWardenZone(ctx, state) {
  // Name plate + life.
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  roundRect(ctx, 36, 34, 356, 96, 12); ctx.fill();
  ctx.lineWidth = 1.5; ctx.strokeStyle = GOLD; ctx.stroke();
  drawFlame(ctx, 74, 82, 62, '#9aa3ad', '#e8eef2');
  ctx.fillStyle = '#e8e2d2';
  ctx.font = 'bold 19px Georgia, serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('THE ASHEN WARDEN', 116, 60);
  drawLifeBar(ctx, 116, 78, 190, state.warden.life, '#b0483e');
  ctx.font = 'bold 25px Georgia, serif';
  ctx.fillStyle = '#ffb3a3';
  ctx.fillText(`${state.warden.life}`, 316, 88);
  ctx.font = '12px Verdana, sans-serif';
  ctx.fillStyle = '#cbbfa4';
  ctx.fillText(`/ ${MAX_LIFE} LIFE`, 348, 90);
  if (state.warden.block > 0) {
    ctx.font = 'bold 14px Verdana, sans-serif';
    ctx.fillStyle = '#aebfe0';
    ctx.fillText(`⛨ BLOCK ${state.warden.block}`, 116, 118);
  }
  if (state.warden.strength > 0) {
    ctx.font = 'bold 13px Verdana, sans-serif';
    ctx.fillStyle = '#f0a35e';
    ctx.fillText(`STRENGTH +${state.warden.strength}`, 226, 118);
  }
  ctx.restore();
  // The Warden's hand: face-down cards fanned across the top.
  for (let i = 0; i < state.warden.handCount; i += 1) {
    drawCardBack(ctx, 486 + i * 62, 30 + Math.abs(i - 2) * 5, 92, 132);
  }
  // Intent plaque — the Warden's next move, readable all turn.
  if (state.intent) {
    ctx.save();
    ctx.fillStyle = 'rgba(30,8,8,0.78)';
    roundRect(ctx, 872, 40, 372, 84, 12); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#b0483e'; ctx.stroke();
    ctx.fillStyle = '#f0a35e';
    ctx.font = 'bold 13px Verdana, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('WARDEN INTENT', 892, 62);
    ctx.fillStyle = '#ffe9d6';
    ctx.font = 'bold 27px Georgia, serif';
    const extra = state.intent.kind === 'strike' || state.intent.kind === 'heavy' ? state.warden.strength : 0;
    ctx.fillText(`${state.intent.label.toUpperCase()} ${state.intent.value + extra}`, 892, 96);
    ctx.restore();
  }
}

function drawCentre(ctx, state, fx) {
  // Played cards in the middle of the table.
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  roundRect(ctx, 356, 208, 568, 252, 16); ctx.fill();
  ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(217,164,65,0.35)'; ctx.stroke();
  ctx.restore();
  if (state.lastPlayerCard) {
    const pop = fx && fx.playerCardAge < 0.35 ? 1 + (0.35 - fx.playerCardAge) * 0.25 : 1;
    drawCard(ctx, state.lastPlayerCard, 420, 238, CARD_W * pop, CARD_H * pop, { lift: true });
  }
  if (state.lastWardenCard) {
    const asCard = {
      name: state.lastWardenCard.name,
      sigil: state.lastWardenCard.kind === 'ward' ? SIGIL.SHIELD : state.lastWardenCard.kind === 'stoke' ? SIGIL.HEART : SIGIL.THORN,
      cost: 0,
      value: state.lastWardenCard.value,
      kind: state.lastWardenCard.kind === 'ward' ? 'guard' : state.lastWardenCard.kind === 'stoke' ? 'mend' : 'strike',
      color: '#6e2430',
      text: state.lastWardenCard.kind === 'ward' ? 'The Warden wards itself.' : state.lastWardenCard.kind === 'stoke' ? 'The Warden stokes its ash.' : 'The Warden strikes.',
    };
    drawCard(ctx, asCard, 706, 238, CARD_W, CARD_H, { lift: true });
  }
  if (!state.lastPlayerCard && !state.lastWardenCard) {
    ctx.save();
    ctx.fillStyle = 'rgba(243,230,200,0.5)';
    ctx.font = 'italic 19px Georgia, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('The table awaits the first card.', 640, 334);
    ctx.restore();
  } else {
    drawFlame(ctx, 640, 330, 54, GOLD, '#ffdf7e');
  }
  // Floating combat text.
  if (fx) {
    for (const item of fx.floaters) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - item.age / 1.1);
      ctx.font = 'bold 30px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = item.color;
      ctx.strokeStyle = 'rgba(0,0,0,0.7)';
      ctx.lineWidth = 4;
      const y = item.y - item.age * 44;
      ctx.strokeText(item.text, item.x, y);
      ctx.fillText(item.text, item.x, y);
      ctx.restore();
    }
  }
}

function drawLog(ctx, state) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  roundRect(ctx, 952, 208, 292, 252, 12); ctx.fill();
  ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(217,164,65,0.5)'; ctx.stroke();
  ctx.fillStyle = GOLD_BRIGHT;
  ctx.font = 'bold 13px Verdana, sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText('DUEL LOG', 970, 232);
  ctx.font = '12px Verdana, sans-serif';
  ctx.fillStyle = '#ddd2b8';
  const lines = [];
  for (const entry of state.log.slice(-9)) {
    for (const line of wrapText(ctx, entry, 258)) lines.push(line);
  }
  lines.slice(-11).forEach((line, i) => ctx.fillText(line, 970, 256 + i * 18));
  ctx.restore();
}

function drawPlayerZone(ctx, state, view) {
  // Name plate + life + block.
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  roundRect(ctx, 36, 470, 300, 88, 12); ctx.fill();
  ctx.lineWidth = 1.5; ctx.strokeStyle = GOLD; ctx.stroke();
  drawFlame(ctx, 70, 514, 56, '#e8622c');
  ctx.fillStyle = '#f6ecd4';
  ctx.font = 'bold 16px Georgia, serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('YOU — FLAME KEEPER', 104, 492);
  drawLifeBar(ctx, 104, 506, 150, state.player.life, '#d98a2b');
  ctx.font = 'bold 24px Georgia, serif';
  ctx.fillStyle = '#ffd9a0';
  ctx.fillText(`${state.player.life}`, 262, 516);
  ctx.font = '11px Verdana, sans-serif';
  ctx.fillStyle = '#cbbfa4';
  ctx.fillText(`/ ${MAX_LIFE}`, 292, 518);
  if (state.player.block > 0) {
    ctx.font = 'bold 14px Verdana, sans-serif';
    ctx.fillStyle = '#aebfe0';
    ctx.fillText(`⛨ BLOCK ${state.player.block}`, 104, 544);
  }
  ctx.restore();
  // Ember pips.
  ctx.save();
  ctx.font = 'bold 12px Verdana, sans-serif';
  ctx.fillStyle = GOLD_BRIGHT;
  ctx.textAlign = 'left';
  ctx.fillText('EMBER', 40, 592);
  for (let i = 0; i < MAX_EMBER_CAP; i += 1) {
    const x = 46 + i * 27;
    const y = 614;
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    if (i < state.ember) {
      ctx.fillStyle = '#f59b23';
      ctx.fill();
      drawFlame(ctx, x, y, 15, '#ffd23e', '#fff3c4');
    } else if (i < state.emberCap) {
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }
  ctx.font = '12px Verdana, sans-serif';
  ctx.fillStyle = '#cbbfa4';
  ctx.fillText(`Deck ${state.deck.length} · Discard ${state.discard.length}`, 40, 656);
  ctx.fillText(`Turn ${state.turn}`, 40, 676);
  ctx.restore();
  // Hand.
  state.hand.forEach((card, index) => {
    const rect = handCardRect(state, index);
    const hovered = view.hover === index;
    const affordable = card.cost <= state.ember && state.phase === PHASE.PLAYER;
    drawCard(ctx, card, rect.x, rect.y - (hovered ? 16 : 0), CARD_W, CARD_H, { dim: !affordable, affordable, lift: hovered });
    if (hovered) {
      ctx.save();
      ctx.font = 'bold 13px Verdana, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = GOLD_BRIGHT;
      ctx.fillText(`${index + 1}`, rect.x + CARD_W / 2, rect.y - 24);
      ctx.restore();
    }
  });
  // End Turn button.
  ctx.save();
  const active = state.phase === PHASE.PLAYER;
  const r = END_TURN_RECT;
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 12; ctx.shadowOffsetY = 4;
  const grad = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
  grad.addColorStop(0, active ? '#e9bc55' : '#8a7c5c');
  grad.addColorStop(1, active ? '#b98427' : '#6e6248');
  roundRect(ctx, r.x, r.y, r.w, r.h, 12);
  ctx.fillStyle = grad; ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 2; ctx.strokeStyle = '#7c5a16'; ctx.stroke();
  ctx.fillStyle = '#2a1d05';
  ctx.font = 'bold 21px Georgia, serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('END TURN', r.x + r.w / 2, r.y + r.h / 2 - 8);
  ctx.font = '11px Verdana, sans-serif';
  ctx.fillText('Enter / Space', r.x + r.w / 2, r.y + r.h / 2 + 16);
  ctx.restore();
}

function drawTitle(ctx, view) {
  drawTable(ctx);
  ctx.save();
  ctx.fillStyle = 'rgba(4,10,6,0.45)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  const flicker = 1 + Math.sin(view.time * 3.1) * 0.03;
  drawFlame(ctx, 640, 218, 190 * flicker, '#e8622c');
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = 'bold 96px Georgia, serif';
  ctx.fillStyle = GOLD_BRIGHT;
  ctx.shadowColor = 'rgba(232,98,44,0.65)';
  ctx.shadowBlur = 34;
  ctx.fillText('EMBERFALL', 640, 388);
  ctx.shadowBlur = 0;
  ctx.font = 'bold 25px Georgia, serif';
  ctx.fillStyle = '#f3e6c8';
  ctx.fillText('— DUEL OF THE LAST FLAME —', 640, 452);
  ctx.font = '17px Verdana, sans-serif';
  ctx.fillStyle = '#d8cbab';
  ctx.fillText('A turn-based card duel. Burn the Ashen Warden to ash —', 640, 512);
  ctx.fillText('or watch your own flame die. Read its intent. Spend your ember well.', 640, 538);
  ctx.font = 'bold 19px Verdana, sans-serif';
  ctx.fillStyle = '#ffd9a0';
  const pulse = 0.75 + Math.sin(view.time * 2.4) * 0.25;
  ctx.globalAlpha = pulse;
  ctx.fillText('CLICK OR PRESS ENTER TO PLAY', 640, 606);
  ctx.globalAlpha = 1;
  ctx.font = '13.5px Verdana, sans-serif';
  ctx.fillStyle = '#a99a76';
  ctx.fillText('Mouse: click a card to play it · Keys 1–8 choose a card · Enter ends the turn · R restarts · M mutes', 640, 664);
  ctx.fillText('Life 30 vs 30 · Ember grows each turn · First flame out loses', 640, 690);
  ctx.restore();
}

function drawEndOverlay(ctx, state, won) {
  ctx.save();
  ctx.fillStyle = won ? 'rgba(24,16,2,0.72)' : 'rgba(10,4,4,0.78)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  drawFlame(ctx, 640, 236, won ? 170 : 120, won ? '#e8622c' : '#5a6068', won ? '#ffd23e' : '#9aa3ad');
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = 'bold 92px Georgia, serif';
  ctx.fillStyle = won ? GOLD_BRIGHT : '#c8ccd2';
  ctx.shadowColor = won ? 'rgba(232,98,44,0.7)' : 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 30;
  ctx.fillText(won ? 'VICTORY' : 'DEFEAT', 640, 396);
  ctx.shadowBlur = 0;
  ctx.font = 'italic 24px Georgia, serif';
  ctx.fillStyle = '#f3e6c8';
  ctx.fillText(won ? 'The flame endures — the Warden is ash.' : 'The ash claims you. Your flame is out.', 640, 462);
  ctx.font = '17px Verdana, sans-serif';
  ctx.fillStyle = '#d8cbab';
  ctx.fillText(won ? `Won on turn ${state.turn} with ${state.player.life} life to spare.` : `You fell on turn ${state.turn}. The Warden kept ${state.warden.life} life.`, 640, 512);
  ctx.font = 'bold 18px Verdana, sans-serif';
  ctx.fillStyle = '#ffd9a0';
  ctx.fillText('PRESS R TO PLAY AGAIN', 640, 576);
  ctx.restore();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = VIEW.width;
  canvas.height = VIEW.height;

  /** view: { screen, state, hover, fx: { floaters, playerCardAge }, time } */
  function draw(view) {
    const { state } = view;
    if (view.screen === SCREEN.TITLE) {
      drawTitle(ctx, view);
      return;
    }
    drawTable(ctx);
    drawWardenZone(ctx, state);
    drawCentre(ctx, state, view.fx);
    drawLog(ctx, state);
    drawPlayerZone(ctx, state, view);
    if (view.screen === SCREEN.WON) drawEndOverlay(ctx, state, true);
    if (view.screen === SCREEN.LOST) drawEndOverlay(ctx, state, false);
  }

  return { draw };
}
