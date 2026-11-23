// The card pool of Emberfall. Every card is told apart by its sigil (a drawn shape), its colour
// and its big number, never by text alone. Kinds: strike (damage), guard (block), mend (heal),
// kindle (ember now), gambit (draw cards). The player's deck is 24 cards built from this pool;
// the Warden fights with the intent table in battle.js instead of a hand.

export const SIGIL = {
  FLAME: 'flame',
  FROST: 'frost',
  THORN: 'thorn',
  SHIELD: 'shield',
  HEART: 'heart',
  SPARK: 'spark',
  COIN: 'coin',
  CROWN: 'crown',
};

export const CARDS = {
  emberStrike: { id: 'emberStrike', name: 'Ember Strike', sigil: SIGIL.FLAME, cost: 1, value: 6, kind: 'strike', color: '#e8622c', text: 'Deal 6 damage.' },
  frostShard: { id: 'frostShard', name: 'Frost Shard', sigil: SIGIL.FROST, cost: 1, value: 5, kind: 'strike', color: '#57b7d6', text: 'Deal 5 damage.' },
  thornLash: { id: 'thornLash', name: 'Thorn Lash', sigil: SIGIL.THORN, cost: 2, value: 9, kind: 'strike', color: '#7fae4c', text: 'Deal 9 damage.' },
  guardStance: { id: 'guardStance', name: 'Guard Stance', sigil: SIGIL.SHIELD, cost: 1, value: 8, kind: 'guard', color: '#8d9bb5', text: 'Gain 8 Block.' },
  mendFlame: { id: 'mendFlame', name: 'Mend Flame', sigil: SIGIL.HEART, cost: 2, value: 7, kind: 'mend', color: '#d6577a', text: 'Heal 7 life.' },
  kindle: { id: 'kindle', name: 'Kindle', sigil: SIGIL.SPARK, cost: 0, value: 2, kind: 'kindle', color: '#e8b93b', text: 'Gain 2 ember now.' },
  goldenGambit: { id: 'goldenGambit', name: 'Golden Gambit', sigil: SIGIL.COIN, cost: 1, value: 2, kind: 'gambit', color: '#c9973f', text: 'Draw 2 cards.' },
  lastFlame: { id: 'lastFlame', name: 'Last Flame', sigil: SIGIL.CROWN, cost: 4, value: 16, kind: 'strike', color: '#f0f0f0', text: 'Deal 16 damage. The signature blow.' },
};

/** The 24-card player deck, as card ids in build order (shuffled by the battle). */
export const DECK_LIST = [
  'emberStrike', 'emberStrike', 'emberStrike', 'emberStrike', 'emberStrike',
  'frostShard', 'frostShard', 'frostShard',
  'thornLash', 'thornLash', 'thornLash',
  'guardStance', 'guardStance', 'guardStance', 'guardStance',
  'mendFlame', 'mendFlame', 'mendFlame',
  'kindle', 'kindle', 'kindle',
  'goldenGambit', 'goldenGambit',
  'lastFlame',
];

let nextInstance = 1;

/** A fresh, unique copy of a card definition for a hand or deck. */
export function makeCard(defId) {
  const def = CARDS[defId];
  nextInstance += 1;
  return { ...def, instance: nextInstance };
}

/** Reset the instance counter so a seeded duel deals identical hands every run. */
export function resetCardInstances() {
  nextInstance = 1;
}
