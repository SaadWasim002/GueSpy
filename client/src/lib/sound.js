/**
 * Tiny synthesised sound cues.
 *
 * Generated with the Web Audio API rather than shipped as audio files: the
 * whole set is a few dozen lines and adds nothing to the bundle, where even
 * short clips would be tens of kilobytes and another asset pipeline.
 *
 * Nothing here throws. Audio is a garnish — a browser that blocks it, or an
 * older one without an AudioContext, must not take a screen down with it.
 */

let context = null;
let muted = false;

/**
 * The AudioContext is created lazily on the first cue.
 *
 * Browsers refuse to start one outside a user gesture, and every cue in this
 * app follows a tap, so building it on demand is both allowed and avoids
 * holding an audio device open for players who never make a sound.
 */
function getContext() {
  if (typeof window === "undefined") return null;

  try {
    const Ctor = window.AudioContext ?? window.webkitAudioContext;
    if (!Ctor) return null;
    if (!context) context = new Ctor();
    // A context created before the first gesture starts suspended.
    if (context.state === "suspended") context.resume?.();
    return context;
  } catch {
    return null;
  }
}

export function setMuted(next) {
  muted = next;
}

export function isMuted() {
  return muted;
}

/**
 * One shaped tone.
 *
 * The gain envelope matters more than it looks: ramping in and out avoids the
 * click a raw start/stop produces, which is what makes simple beeps sound
 * cheap.
 */
function tone({ freq, start = 0, duration = 0.12, type = "sine", gain = 0.06, slideTo }) {
  const ctx = getContext();
  if (!ctx) return;

  try {
    const at = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, at + duration);

    amp.gain.setValueAtTime(0.0001, at);
    amp.gain.exponentialRampToValueAtTime(gain, at + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, at + duration);

    osc.connect(amp).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + duration + 0.02);
  } catch {
    // A cue that cannot play is not worth reporting.
  }
}

const chord = (freqs, options = {}) =>
  freqs.forEach((freq, i) => tone({ freq, start: i * 0.075, ...options }));

/**
 * The cue vocabulary. Each is named for what happened, not what it sounds
 * like, so a screen asks for `cue.spy()` rather than picking a frequency.
 */
export const CUES = {
  /** Generic confirm — advancing a screen. */
  tap: () => tone({ freq: 520, duration: 0.07, gain: 0.04 }),
  /** A player takes the device. */
  handoff: () => tone({ freq: 320, slideTo: 480, duration: 0.16, type: "triangle" }),
  /**
   * A role card is opened.
   *
   * There is deliberately no separate cue for a spy. The reveal screen exists
   * to keep a role private, and a distinct sound would broadcast it to the
   * whole room the moment the card opens.
   */
  flip: () => tone({ freq: 300, slideTo: 420, duration: 0.13, type: "triangle", gain: 0.05 }),
  /** A vote is recorded. */
  vote: () => tone({ freq: 660, duration: 0.09, type: "triangle" }),
  /** Somebody is eliminated. */
  eliminated: () => tone({ freq: 300, slideTo: 150, duration: 0.4, type: "sawtooth", gain: 0.05 }),
  /** The innocents take it. */
  win: () => chord([523.25, 659.25, 783.99, 1046.5], { duration: 0.3 }),
  /** The spies take it. */
  spyWin: () => chord([440, 415.3, 392, 349.23], { duration: 0.3, type: "sawtooth", gain: 0.05 }),
};

/** Play a named cue, unless muted. */
export function play(name) {
  if (muted) return;
  CUES[name]?.();
}
