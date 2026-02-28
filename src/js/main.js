import { createSoundEngine } from "./modules/audio.js";
import { STEPS } from "./modules/config.js";
import { loadState, persistState } from "./modules/storage.js";
import { createActions, rolloverIfNeeded } from "./modules/state.js";
import { createUI } from "./modules/ui.js";

const state = loadState();
const actions = createActions(state);
const ui = createUI();
const sound = createSoundEngine();

const save = () => persistState(state);

const render = ({ animate = false, direction = "up", previousValue = state.currentCount } = {}) => {
  if (animate) {
    ui.setCount(previousValue);
    ui.animateCount(state.currentCount, direction);
  } else {
    ui.setCount(state.currentCount);
  }

  ui.els.soundToggle.setAttribute("aria-pressed", String(state.soundEnabled));
  ui.els.soundToggle.textContent = `Sound: ${state.soundEnabled ? "ON" : "OFF"}`;
  ui.els.resetBtn.disabled = state.currentCount === 0;
  ui.els.selectedStepLabel.textContent = `+${state.step}`;

  for (const option of ui.els.stepMenu.querySelectorAll(".step-option")) {
    option.setAttribute("aria-selected", String(Number(option.dataset.step) === state.step));
  }
};

const applyDayRollover = () => {
  const rolled = rolloverIfNeeded(state);
  if (rolled) {
    save();
    render();
  }
};

const increment = ({ animate = true, fromBackground = false } = {}) => {
  applyDayRollover();
  const previousValue = state.currentCount;
  actions.increment();

  if (state.soundEnabled) {
    sound.playIncrement();
  }

  if (fromBackground) {
    ui.flashMainPress();
  }

  save();
  render({ animate, direction: "up", previousValue });
};

const decrement = ({ animate = true } = {}) => {
  applyDayRollover();
  const previousValue = state.currentCount;
  actions.decrement();
  if (state.currentCount === previousValue) {
    return;
  }

  save();
  render({ animate, direction: "down", previousValue });
};

const openEditDialog = () => {
  applyDayRollover();
  ui.els.editCountInput.value = String(state.currentCount);
  if (typeof ui.els.editDialog.showModal === "function") {
    ui.els.editDialog.showModal();
    ui.els.editCountInput.focus();
    ui.els.editCountInput.select();
  }
};

const openResetDialog = () => {
  if (typeof ui.els.resetDialog.showModal === "function") {
    ui.els.resetDialog.showModal();
  }
};

const setStep = (step) => {
  actions.setStep(step);
  save();
  render();
};

const closeStepMenu = () => ui.setMenuOpen(false);
const openStepMenu = () => ui.setMenuOpen(true);

const setupStepMenu = () => {
  ui.renderStepMenu(state.step);

  ui.els.stepToggle.addEventListener("click", () => {
    const isOpen = ui.els.stepToggle.getAttribute("aria-expanded") === "true";
    if (isOpen) {
      closeStepMenu();
      return;
    }
    openStepMenu();
  });

  ui.els.stepMenu.addEventListener("click", (event) => {
    const option = event.target.closest(".step-option");
    if (!option) {
      return;
    }

    const step = Number(option.dataset.step);
    if (!STEPS.includes(step)) {
      return;
    }

    setStep(step);
    closeStepMenu();
  });

  document.addEventListener("pointerdown", (event) => {
    if (!ui.els.stepWrap.contains(event.target)) {
      closeStepMenu();
    }
  });
};

const setupCounterControls = () => {
  ui.els.mainIncrementBtn.addEventListener("pointerdown", () => {
    ui.els.mainIncrementBtn.classList.add("pressed");
  });

  ui.els.mainIncrementBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    increment({ animate: true });
  });

  const releaseMainPress = () => ui.els.mainIncrementBtn.classList.remove("pressed");
  ui.els.mainIncrementBtn.addEventListener("pointerup", releaseMainPress);
  ui.els.mainIncrementBtn.addEventListener("pointerleave", releaseMainPress);
  ui.els.mainIncrementBtn.addEventListener("pointercancel", releaseMainPress);

  ui.els.decrementBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    decrement({ animate: true });
  });

  ui.els.countDisplayBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    openEditDialog();
  });

  ui.els.tapZone.addEventListener("click", (event) => {
    const target = event.target;
    const inMainButton = target.closest("#mainIncrementBtn");
    const inDecrementButton = target.closest("#decrementBtn");
    const inCountDisplay = target.closest("#countDisplayBtn");

    if (inMainButton || inDecrementButton || inCountDisplay) {
      return;
    }

    increment({ animate: true, fromBackground: true });
  });
};

const setupKeyboard = () => {
  window.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
        return;
      }

      event.preventDefault();

      if (ui.els.editDialog.open || ui.els.resetDialog.open) {
        return;
      }

      if (event.key === "ArrowUp") {
        increment({ animate: true });
      } else {
        decrement({ animate: true });
      }
    },
    { passive: false }
  );
};

const setupButtons = () => {
  ui.els.soundToggle.addEventListener("click", () => {
    actions.toggleSound();
    save();
    render();
  });

  ui.els.resetBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    if (state.currentCount === 0) {
      return;
    }
    openResetDialog();
  });

  ui.els.editBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    openEditDialog();
  });
};

const setupEditDialog = () => {
  ui.els.editInputWrap.addEventListener("click", () => {
    ui.els.editCountInput.focus();
  });

  ui.els.editInputWrap.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      ui.els.editCountInput.focus();
    }
  });

  ui.els.editCountInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    ui.els.editForm.requestSubmit(ui.els.editConfirmBtn);
  });

  ui.els.editForm.addEventListener("submit", (event) => {
    const submitterValue = event.submitter?.value;
    if (submitterValue !== "confirm") {
      return;
    }

    const previousValue = state.currentCount;
    const parsed = Number(ui.els.editCountInput.value);
    const safe = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : state.currentCount;
    const direction = safe >= previousValue ? "up" : "down";

    applyDayRollover();
    actions.setCurrentCount(safe);
    save();
    render({ animate: true, direction, previousValue });
  });

  ui.els.resetForm.addEventListener("submit", (event) => {
    const submitterValue = event.submitter?.value;
    if (submitterValue !== "confirm") {
      return;
    }

    applyDayRollover();
    const previousValue = state.currentCount;
    actions.resetToday();
    save();
    render({ animate: true, direction: "down", previousValue });
  });

  ui.els.resetDialog.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    ui.els.resetForm.requestSubmit(ui.els.resetConfirmBtn);
  });
};

const setupLifecycle = () => {
  window.setInterval(applyDayRollover, 30_000);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      applyDayRollover();
      render();
    }
  });
};

const registerServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  try {
    await navigator.serviceWorker.register("./service-worker.js", { scope: "./" });
  } catch {
    // Ignore registration errors to avoid runtime noise.
  }
};

const init = () => {
  applyDayRollover();
  setupStepMenu();
  setupCounterControls();
  setupKeyboard();
  setupButtons();
  setupEditDialog();
  setupLifecycle();
  render();
  registerServiceWorker();
};

init();
