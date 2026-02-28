import { MIN_COUNT, STEPS } from "./config.js";
import { todayKey } from "./storage.js";

const clampNonNegative = (value) => Math.max(MIN_COUNT, Number(value) || 0);

const ensureToday = (state) => {
  const today = todayKey();
  if (!Object.hasOwn(state.dailyHistory, today)) {
    state.dailyHistory[today] = 0;
  }
  return today;
};

export const rolloverIfNeeded = (state) => {
  const today = todayKey();
  if (state.lastActiveDate === today) {
    ensureToday(state);
    return false;
  }

  state.lastActiveDate = today;
  state.currentCount = 0;
  ensureToday(state);
  return true;
};

export const createActions = (state) => ({
  increment() {
    const today = ensureToday(state);
    const step = STEPS.includes(state.step) ? state.step : 1;
    state.currentCount += step;
    state.dailyHistory[today] = clampNonNegative(state.dailyHistory[today] + step);
    state.lifetimeTotal = clampNonNegative(state.lifetimeTotal + step);
    return state.currentCount;
  },
  decrement() {
    const today = ensureToday(state);
    const step = STEPS.includes(state.step) ? state.step : 1;
    const delta = Math.min(step, state.currentCount);
    if (delta <= 0) {
      return state.currentCount;
    }

    state.currentCount -= delta;
    state.dailyHistory[today] = clampNonNegative((state.dailyHistory[today] || 0) - delta);
    state.lifetimeTotal = clampNonNegative(state.lifetimeTotal - delta);
    return state.currentCount;
  },
  setStep(step) {
    state.step = STEPS.includes(step) ? step : 1;
  },
  toggleSound() {
    state.soundEnabled = !state.soundEnabled;
  },
  resetToday() {
    const today = ensureToday(state);
    const removed = clampNonNegative(state.currentCount);
    state.currentCount = 0;
    state.dailyHistory[today] = 0;
    state.lifetimeTotal = clampNonNegative(state.lifetimeTotal - removed);
  },
  setCurrentCount(nextValue) {
    const today = ensureToday(state);
    const safeValue = clampNonNegative(nextValue);
    const delta = safeValue - state.currentCount;
    state.currentCount = safeValue;
    state.dailyHistory[today] = clampNonNegative((state.dailyHistory[today] || 0) + delta);
    state.lifetimeTotal = clampNonNegative(state.lifetimeTotal + delta);
  }
});
