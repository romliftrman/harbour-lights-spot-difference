// Keyboard and pointer input. One-shot presses (confirm, pause, hint, mute)
// are queued as bit flags and taken once by the loop, so a press between two
// frames is never lost and never counted twice. Pointer positions are kept in
// field coordinates; the caller maps them to a picture or a button.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_HINT = 4;
export const ACTION_MUTE = 8;

const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const HINT = new Set(['KeyH']);
const MUTE = new Set(['KeyM']);

export function createInput(target, toField) {
  let actions = 0;
  let pointer = null;

  window.addEventListener('keydown', (event) => {
    if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (HINT.has(event.code)) {
      if (!event.repeat) actions |= ACTION_HINT;
    } else if (MUTE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_MUTE;
    } else return;
    event.preventDefault();
  });

  target.addEventListener('pointerdown', (event) => {
    const rect = target.getBoundingClientRect();
    pointer = toField(event.clientX - rect.left, event.clientY - rect.top);
    actions |= ACTION_CONFIRM;
  });

  return {
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** The last pointer-down in field coordinates, or null; consumed on read. */
    takePointer() {
      const taken = pointer;
      pointer = null;
      return taken;
    },
  };
}
