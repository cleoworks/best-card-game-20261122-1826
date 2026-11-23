// The duel itself: pure turn logic with no DOM in it, so it can be driven by the renderer, by
// the keyboard/mouse input, by the screenshot stager and by a headless test alike.
//
// Rules: you and the Ashen Warden start at 30 life. Each of your turns your ember (mana) cap
// grows by 1 (to 10) and refills, and you draw a card. Play cards for their ember cost: strikes
// burn the Warden, Guard gives Block that soaks the Warden's blow, Mend heals, Kindle feeds
// ember back, Golden Gambit draws. When you end your turn the Warden carries out the intent it
// showed you all turn — strike, heavy strike, ward (block) or stoke (heal and grow stronger) —
// then shows its next intent. First side to 0 life loses. The deck recycles its discard pile.

import { DECK_LIST, makeCard, resetCardInstances } from './cards.js';

export const MAX_LIFE = 30;
export const WARDEN_LIFE = 34; // The Warden starts tougher than you: Burn must be earned, not free.
export const START_HAND = 5;
export const MAX_HAND = 8;
export const MAX_EMBER_CAP = 10;

export const PHASE = { PLAYER: 'player', WARDEN: 'warden', WON: 'won', LOST: 'lost' };

/** The Warden's possible intents; `weight` steers how often each comes up. */
const INTENTS = [
  { kind: 'strike', label: 'Strike', min: 7, max: 10, weight: 5 },
  { kind: 'heavy', label: 'Heavy Strike', min: 12, max: 16, weight: 2 },
  { kind: 'ward', label: 'Ward', min: 7, max: 10, weight: 2 },
  { kind: 'stoke', label: 'Stoke', min: 4, max: 6, weight: 1 },
];

export function createBattle(random) {
  resetCardInstances();
  const deck = random.shuffle(DECK_LIST.map((id) => makeCard(id)));
  const state = {
    turn: 0,
    phase: PHASE.PLAYER,
    player: { life: MAX_LIFE, maxLife: MAX_LIFE, block: 0 },
    warden: { life: WARDEN_LIFE, maxLife: WARDEN_LIFE, block: 0, strength: 0, handCount: 5, burnTurns: 0 },
    emberCap: 0,
    ember: 0,
    deck,
    hand: [],
    discard: [],
    intent: null,
    lastPlayerCard: null,
    lastWardenCard: null,
    log: [],
  };

  function logLine(text) {
    state.log.push(text);
    if (state.log.length > 40) state.log.shift();
  }

  function drawCards(count) {
    for (let i = 0; i < count; i += 1) {
      if (state.hand.length >= MAX_HAND) return;
      if (state.deck.length === 0) {
        if (state.discard.length === 0) return;
        state.deck = random.shuffle(state.discard);
        state.discard = [];
        logLine('The discard pile is shuffled back into the deck.');
      }
      state.hand.push(state.deck.pop());
    }
  }

  function rollIntent() {
    const total = INTENTS.reduce((sum, intent) => sum + intent.weight, 0);
    let roll = random.next() * total;
    let picked = INTENTS[0];
    for (const intent of INTENTS) {
      roll -= intent.weight;
      if (roll <= 0) { picked = intent; break; }
    }
    const value = picked.min + random.int(picked.max - picked.min + 1);
    state.intent = { kind: picked.kind, label: picked.label, value };
  }

  /** Damage into a side, soaked by its Block first. Returns the life actually lost. */
  function dealDamage(side, amount) {
    const target = state[side];
    const soaked = Math.min(target.block, amount);
    target.block -= soaked;
    const lost = amount - soaked;
    target.life = Math.max(0, target.life - lost);
    return lost;
  }

  function checkEnd() {
    if (state.warden.life <= 0) {
      state.phase = PHASE.WON;
      logLine('The Warden falls. The last flame endures.');
    } else if (state.player.life <= 0) {
      state.phase = PHASE.LOST;
      logLine('Your flame gutters out. The ash claims you.');
    }
  }

  /** Begin a player turn: grow and refill ember, clear your old Block, draw, show intent. */
  function startTurn() {
    state.turn += 1;
    state.phase = PHASE.PLAYER;
    state.emberCap = Math.min(MAX_EMBER_CAP, state.emberCap + 1);
    if (state.turn === 1) state.emberCap = 3;
    state.ember = state.emberCap;
    state.player.block = 0;
    drawCards(state.turn === 1 ? START_HAND : 1);
    if (!state.intent) rollIntent();
    logLine(`— Turn ${state.turn}: ember ${state.ember}, Warden intends ${state.intent.label} ${state.intent.value}.`);
  }

  /** Play hand[index] if it is your turn and you can pay. Returns true when the card was played. */
  function playCard(index) {
    if (state.phase !== PHASE.PLAYER) return false;
    const card = state.hand[index];
    if (!card || card.cost > state.ember) return false;
    state.hand.splice(index, 1);
    state.ember -= card.cost;
    state.lastPlayerCard = card;
    if (card.kind === 'strike') {
      const lost = dealDamage('warden', card.value);
      logLine(`You play ${card.name}: ${lost} damage to the Warden.`);
      if (card.id === 'emberStrike' && state.warden.life > 0) {
        state.warden.burnTurns = 2;
        logLine('The Warden catches fire: Burn 2 at its next 2 actions.');
      }
    } else if (card.kind === 'guard') {
      state.player.block += card.value;
      logLine(`You play ${card.name}: +${card.value} Block.`);
    } else if (card.kind === 'mend') {
      const healed = Math.min(state.player.maxLife - state.player.life, card.value);
      state.player.life += healed;
      logLine(`You play ${card.name}: heal ${healed} life.`);
    } else if (card.kind === 'kindle') {
      state.ember += card.value;
      logLine(`You play ${card.name}: +${card.value} ember.`);
    } else if (card.kind === 'gambit') {
      drawCards(card.value);
      logLine(`You play ${card.name}: draw ${card.value} cards.`);
    }
    state.discard.push(card);
    checkEnd();
    return true;
  }

  /** End your turn: the Warden acts out its intent, then a new turn begins. */
  function endTurn() {
    if (state.phase !== PHASE.PLAYER) return;
    state.phase = PHASE.WARDEN;
    state.warden.block = 0; // Block from its last Ward guarded your whole turn; now it lapses.
    if (state.warden.burnTurns > 0) {
      state.warden.burnTurns -= 1;
      state.warden.life = Math.max(0, state.warden.life - 2); // Burn ignores Block.
      logLine('Burn sears the Warden for 2.');
      checkEnd();
      if (state.phase !== PHASE.WARDEN) return;
    }
    const intent = state.intent;
    state.lastWardenCard = { name: intent.label, kind: intent.kind, value: intent.value };
    if (intent.kind === 'strike' || intent.kind === 'heavy') {
      const lost = dealDamage('player', intent.value + state.warden.strength);
      logLine(`Warden ${intent.label}: ${lost} damage to you${state.player.block > 0 ? ' (blocked the rest)' : ''}.`);
    } else if (intent.kind === 'ward') {
      state.warden.block += intent.value;
      logLine(`Warden Ward: +${intent.value} Block.`);
    } else if (intent.kind === 'stoke') {
      const healed = Math.min(state.warden.maxLife - state.warden.life, intent.value);
      state.warden.life += healed;
      state.warden.strength += 1;
      logLine(`Warden Stoke: heals ${healed}, grows stronger (+1 damage).`);
    }
    state.intent = null;
    checkEnd();
    if (state.phase === PHASE.WARDEN) {
      rollIntent();
      startTurn();
    }
  }

  startTurn();
  return { state, playCard, endTurn, drawCards };
}
