// Mouse and keyboard input, translated into the game's 1280x800 logical coordinates no matter
// how large the window is. It reports three things to main.js: where the pointer hovers (a hand
// index or null), clicks (logical x/y plus what was hit), and named key actions.

import { END_TURN_RECT, VIEW, handCardRect } from './render.js';

export const ACTION = {
  CONFIRM: 'confirm',
  END_TURN: 'end-turn',
  RESTART: 'restart',
  MUTE: 'mute',
  CARD: 'card',
};

export function createInput(canvas, handlers) {
  let hover = null;

  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * VIEW.width,
      y: ((event.clientY - rect.top) / rect.height) * VIEW.height,
    };
  }

  function handIndexAt(state, x, y) {
    if (!state) return null;
    for (let i = state.hand.length - 1; i >= 0; i -= 1) {
      const r = handCardRect(state, i);
      if (x >= r.x && x <= r.x + r.w && y >= r.y - 18 && y <= r.y + r.h) return i;
    }
    return null;
  }

  function inRect(x, y, r) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  canvas.addEventListener('pointermove', (event) => {
    const { x, y } = toLogical(event);
    const next = handIndexAt(handlers.getState(), x, y);
    if (next !== hover) {
      hover = next;
      handlers.onHover(hover);
    }
    canvas.style.cursor = next !== null || inRect(x, y, END_TURN_RECT) ? 'pointer' : 'default';
  });

  canvas.addEventListener('pointerdown', (event) => {
    const { x, y } = toLogical(event);
    handlers.onPointerDown();
    const index = handIndexAt(handlers.getState(), x, y);
    if (index !== null) handlers.onAction(ACTION.CARD, index);
    else if (inRect(x, y, END_TURN_RECT)) handlers.onAction(ACTION.END_TURN);
    else handlers.onAction(ACTION.CONFIRM);
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key;
    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      handlers.onAction(ACTION.CONFIRM);
    } else if (key === 'r' || key === 'R') handlers.onAction(ACTION.RESTART);
    else if (key === 'm' || key === 'M') handlers.onAction(ACTION.MUTE);
    else if (key >= '1' && key <= '8') handlers.onAction(ACTION.CARD, Number(key) - 1);
  });

  return {
    get hover() { return hover; },
  };
}
