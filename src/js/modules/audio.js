export const createSoundEngine = () => {
  const AudioContextRef = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextRef) {
    return { playIncrement: () => {} };
  }

  const ctx = new AudioContextRef();
  let activeOscillator = null;
  let lastTick = 0;

  const playIncrement = async () => {
    const now = performance.now();
    if (now - lastTick < 45) {
      return;
    }
    lastTick = now;

    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        return;
      }
    }

    if (activeOscillator) {
      try {
        activeOscillator.stop();
      } catch {
        // no-op
      }
      activeOscillator = null;
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = 880;

    const start = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.045, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.085);

    osc.connect(gain);
    gain.connect(ctx.destination);

    activeOscillator = osc;
    osc.start(start);
    osc.stop(start + 0.09);
    osc.onended = () => {
      if (activeOscillator === osc) {
        activeOscillator = null;
      }
      osc.disconnect();
      gain.disconnect();
    };
  };

  return { playIncrement };
};

const hasVibrationSupport = () => {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return false;
  }

  try {
    navigator.vibrate(0);
    return true;
  } catch {
    return false;
  }
};

const PREMIUM_PULSE = [22];
let lastVibrationAt = 0;

export const isVibrationSupported = () => hasVibrationSupport();

export const stopVibration = () => {
  if (!hasVibrationSupport()) {
    return;
  }
  navigator.vibrate(0);
};

export const triggerVibration = () => {
  if (!hasVibrationSupport()) {
    return false;
  }

  const now = performance.now();
  if (now - lastVibrationAt < 70) {
    return false;
  }
  lastVibrationAt = now;

  try {
    return navigator.vibrate(PREMIUM_PULSE);
  } catch {
    return false;
  }
};
