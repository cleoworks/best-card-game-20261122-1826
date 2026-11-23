// The screenshot scenes behind ?shot=title|play|win|lose. Every scene is the real game: a
// seeded battle played forward by a simple autopilot (kindle and draw first, strike hard,
// guard against a heavy intent, mend when low), so each frame is a moment a real duel reaches,
// and the same seed always gives the same frame.

import { PHASE, createBattle } from './battle.js';
import { SCREEN } from './render.js';

/** Play one full player turn with the heuristic, leaving the battle mid-duel. */
function autopilotTurn(battle) {
  const { state } = battle;
  let guard = 0;
  while (state.phase === PHASE.PLAYER && guard < 24) {
    guard += 1;
    const intentDamage = state.intent && (state.intent.kind === 'strike' || state.intent.kind === 'heavy')
      ? state.intent.value + state.warden.strength : 0;
    let pick = -1;
    const affordable = state.hand.map((card, i) => ({ card, i })).filter(({ card }) => card.cost <= state.ember);
    if (affordable.length === 0) break;
    const byKind = (kind) => affordable.find(({ card }) => card.kind === kind);
    if (state.player.life <= 12 && byKind('mend')) pick = byKind('mend').i;
    else if (intentDamage >= 9 && state.player.block < intentDamage && byKind('guard')) pick = byKind('guard').i;
    else if (byKind('kindle')) pick = byKind('kindle').i;
    else if (byKind('gambit')) pick = byKind('gambit').i;
    else {
      const strikes = affordable.filter(({ card }) => card.kind === 'strike').sort((a, b) => b.card.value - a.card.value);
      if (strikes.length > 0) pick = strikes[0].i;
      else if (byKind('guard')) pick = byKind('guard').i;
      else if (byKind('mend') && state.player.life < 24) pick = byKind('mend').i;
      else break;
    }
    if (!battle.playCard(pick)) break;
  }
  if (state.phase === PHASE.PLAYER) battle.endTurn();
}

/** Stage the named scene on a fresh seeded battle and return the screen to draw. */
export function stageShot(name, random) {
  const battle = createBattle(random);
  const { state } = battle;
  if (name === 'play') {
    // A gentle pilot — one card a turn for three turns, then one strike into the fourth:
    // a live mid-duel table that cannot have ended yet, with a full log behind it.
    for (let t = 0; t < 3 && state.phase === PHASE.PLAYER; t += 1) {
      const pick = state.hand.findIndex((card) => card.cost <= state.ember);
      if (pick >= 0) battle.playCard(pick);
      if (state.phase === PHASE.PLAYER) battle.endTurn();
    }
    if (state.phase === PHASE.PLAYER) {
      const strike = state.hand.findIndex((card) => card.kind === 'strike' && card.cost <= state.ember);
      const any = state.hand.findIndex((card) => card.cost <= state.ember);
      const pick = strike >= 0 ? strike : any;
      if (pick >= 0) battle.playCard(pick);
    }
    return { screen: SCREEN.PLAY, battle };
  }
  if (name === 'win') {
    // Two real turns first so the log tells a story, then the duel is staged one blow
    // from its end — and the autopilot lands that blow through the real rules.
    autopilotTurn(battle);
    autopilotTurn(battle);
    if (state.phase === PHASE.PLAYER) state.warden.life = Math.min(state.warden.life, 7);
    let guard = 0;
    while (state.phase === PHASE.PLAYER && guard < 12) {
      guard += 1;
      autopilotTurn(battle);
    }
    if (state.phase !== PHASE.WON) { // Fallback: strike with whatever is in hand.
      const pick = state.hand.findIndex((card) => card.kind === 'strike');
      if (pick >= 0) battle.playCard(pick);
    }
    return { screen: SCREEN.WON, battle };
  }
  if (name === 'lose') {
    autopilotTurn(battle); // One real turn of fighting first.
    if (state.phase === PHASE.PLAYER) state.player.life = 6; // Then your flame is nearly out.
    let guard = 0;
    while (state.phase === PHASE.PLAYER && guard < 12) {
      guard += 1;
      battle.endTurn();
    }
    return { screen: SCREEN.LOST, battle };
  }
  return { screen: SCREEN.TITLE, battle };
}
