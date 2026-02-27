import { STORAGE_KEY, STEPS } from "./config.js";

const nowDate = () => new Date().toISOString().slice(0, 10);

const createDefaults = () => ({
  currentCount: 0,
  step: 1,
  soundEnabled: true,
  vibrationEnabled: true,
  dailyHistory: { [nowDate()]: 0 },
  lifetimeTotal: 0,
  lastActiveDate: nowDate()
});

const normalizeRecord = (value) => {
  const defaults = createDefaults();
  if (!value || typeof value !== "object") {
    return defaults;
  }

  const safeStep = STEPS.includes(Number(value.step)) ? Number(value.step) : defaults.step;
  const safeCurrent = Number.isFinite(Number(value.currentCount)) ? Math.max(0, Number(value.currentCount)) : defaults.currentCount;
  const safeLifetime = Number.isFinite(Number(value.lifetimeTotal)) ? Math.max(0, Number(value.lifetimeTotal)) : defaults.lifetimeTotal;

  const safeHistory = {};
  if (value.dailyHistory && typeof value.dailyHistory === "object") {
    for (const [date, count] of Object.entries(value.dailyHistory)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Number(count))) {
        safeHistory[date] = Math.max(0, Number(count));
      }
    }
  }

  if (Object.keys(safeHistory).length === 0) {
    safeHistory[nowDate()] = 0;
  }

  return {
    currentCount: safeCurrent,
    step: safeStep,
    soundEnabled: Boolean(value.soundEnabled ?? defaults.soundEnabled),
    vibrationEnabled: Boolean(value.vibrationEnabled ?? defaults.vibrationEnabled),
    dailyHistory: safeHistory,
    lifetimeTotal: safeLifetime,
    lastActiveDate: /^\d{4}-\d{2}-\d{2}$/.test(value.lastActiveDate) ? value.lastActiveDate : defaults.lastActiveDate
  };
};

export const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaults();
    }
    return normalizeRecord(JSON.parse(raw));
  } catch {
    return createDefaults();
  }
};

export const persistState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore write failures in restricted environments.
  }
};

export const todayKey = nowDate;
