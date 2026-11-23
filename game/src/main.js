// Boot and the one loop for Emberfall. Screens: title, the duel table, victory, defeat.
// Input arrives from input.js; battle.js holds the rules; render.js paints; sound.js pings.
//
// ?seed=N fixes the duel. ?shot=title|play|win|lose (with &seed=N) stages that scene from a
// real simulated duel instead of running the loop, paints it and sets window.__shotReady.

import { createRandom } from './random.js';
import { PHASE, createBattle } from './battle.js';
import { ACTION, createInput } from './input.js';
import { SCREEN, createRenderer } from './render.js';
import { createSound } from './sound.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const renderer = createRenderer(canvas);
const sound = createSound();

function freshSeed() {
  return Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);
}

let screen = SCREEN.TITLE;
let battle = createBattle(createRandom(freshSeed()));
let hover = null;
let floaters = [];
let playerCardAt = -10;
let lastPhase = battle.state.phase;

const fx = { floaters, playerCardAge: 99 };

function announce() {
  const s = battle.state;
  status.textContent = `Turn ${s.turn}. Your life ${s.player.life}, Warden life ${s.warden.life}, ember ${s.ember}. Warden intends ${s.intent ? `${s.intent.label} ${s.intent.value}` : 'nothing'}.`;
}

function spawnFloater(x, y, text, color) {
  floaters.push({ x, y, text, color, age: 0 });
}

function noteResult(before) {
  const s = battle.state;
  const wardenLost = before.wardenLife - s.warden.life;
  const playerLost = before.playerLife - s.player.life;
  if (wardenLost > 0) spawnFloater(776, 220, `-${wardenLost}`, '#ff9d5c');
  if (playerLost > 0) spawnFloater(180, 452, `-${playerLost}`, '#ff7a6b');
  if (s.player.block > before.playerBlock) spawnFloater(180, 452, `+${s.player.block - before.playerBlock} BLOCK`, '#aebfe0');
}

function snapshot() {
  const s = battle.state;
  return { wardenLife: s.warden.life, playerLife: s.player.life, playerBlock: s.player.block };
}

function doPlayCard(index) {
  if (screen !== SCREEN.PLAY) return;
  const before = snapshot();
  const card = battle.state.hand[index];
  if (!battle.playCard(index)) return;
  playerCardAt = performance.now() / 1000;
  if (card.kind === 'strike') sound.hit();
  else if (card.kind === 'mend') sound.heal();
  else if (card.kind === 'guard') sound.blocked();
  else sound.playCard();
  noteResult(before);
  afterAction();
}

function doEndTurn() {
  if (screen !== SCREEN.PLAY || battle.state.phase !== PHASE.PLAYER) return;
  const before = snapshot();
  sound.turn();
  battle.endTurn();
  noteResult(before);
  afterAction();
}

function afterAction() {
  announce();
  if (battle.state.phase === PHASE.WON && lastPhase !== PHASE.WON) {
    screen = SCREEN.WON;
    sound.win();
  } else if (battle.state.phase === PHASE.LOST && lastPhase !== PHASE.LOST) {
    screen = SCREEN.LOST;
    sound.lose();
  }
  lastPhase = battle.state.phase;
}

function startGame() {
  battle = createBattle(createRandom(freshSeed()));
  floaters = [];
  fx.floaters = floaters;
  screen = SCREEN.PLAY;
  lastPhase = battle.state.phase;
  announce();
}

function onAction(action, arg) {
  sound.unlock();
  if (action === ACTION.MUTE) {
    sound.toggleMute();
    return;
  }
  if (action === ACTION.RESTART) {
    if (screen === SCREEN.WON || screen === SCREEN.LOST || screen === SCREEN.PLAY) startGame();
    return;
  }
  if (screen === SCREEN.TITLE) {
    if (action === ACTION.CONFIRM) startGame();
    return;
  }
  if (screen === SCREEN.WON || screen === SCREEN.LOST) return;
  if (action === ACTION.CARD) doPlayCard(arg);
  else if (action === ACTION.END_TURN) doEndTurn();
  else if (action === ACTION.CONFIRM) doEndTurn();
}

if (shot) {
  const staged = stageShot(shot, createRandom(freshSeed()));
  battle = staged.battle;
  screen = staged.screen;
  const view = { screen, state: battle.state, hover: null, fx: { floaters: [], playerCardAge: 99 }, time: 1.2 };
  renderer.draw(view);
  renderer.draw(view);
  window.__shotReady = true;
} else {
  createInput(canvas, {
    getState: () => (screen === SCREEN.PLAY ? battle.state : null),
    onHover: (index) => { hover = index; },
    onPointerDown: () => sound.unlock(),
    onAction,
  });
  announce();
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    for (const floater of floaters) floater.age += dt;
    floaters = floaters.filter((floater) => floater.age < 1.1);
    fx.floaters = floaters;
    fx.playerCardAge = now / 1000 - playerCardAt;
    renderer.draw({ screen, state: battle.state, hover, fx, time: now / 1000 });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
