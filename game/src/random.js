// A small seeded random generator (mulberry32). One stream drives the deck shuffle, the
// Warden's choices and every staged screenshot, so a seed always replays the same duel.

export function createRandom(seed) {
  let state = (seed >>> 0) || 0x9e3779b9;
  function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  return {
    next,
    /** Integer in [0, bound). */
    int(bound) {
      return Math.floor(next() * bound);
    },
    /** Pick one element of a non-empty array. */
    pick(list) {
      return list[Math.floor(next() * list.length)];
    },
    /** In-place Fisher–Yates shuffle; returns the same array. */
    shuffle(list) {
      for (let i = list.length - 1; i > 0; i -= 1) {
        const j = Math.floor(next() * (i + 1));
        const tmp = list[i];
        list[i] = list[j];
        list[j] = tmp;
      }
      return list;
    },
  };
}
