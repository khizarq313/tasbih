import { STEPS } from "./config.js";

const formatStep = (step) => `+${step}`;

export const createUI = () => {
  const els = {
    stepWrap: document.getElementById("stepSelectWrap"),
    stepToggle: document.getElementById("stepToggle"),
    stepMenu: document.getElementById("stepMenu"),
    selectedStepLabel: document.getElementById("selectedStepLabel"),
    editBtn: document.getElementById("editBtn"),
    resetBtn: document.getElementById("resetBtn"),
    tapZone: document.getElementById("tapZone"),
    countDisplayBtn: document.getElementById("countDisplayBtn"),
    countDisplay: document.getElementById("countDisplay"),
    mainIncrementBtn: document.getElementById("mainIncrementBtn"),
    decrementBtn: document.getElementById("decrementBtn"),
    soundToggle: document.getElementById("soundToggle"),
    editDialog: document.getElementById("editDialog"),
    editForm: document.getElementById("editForm"),
    editConfirmBtn: document.getElementById("editConfirmBtn"),
    editInputWrap: document.getElementById("editInputWrap"),
    editCountInput: document.getElementById("editCountInput"),
    resetDialog: document.getElementById("resetDialog"),
    resetForm: document.getElementById("resetForm"),
    resetConfirmBtn: document.getElementById("resetConfirmBtn")
  };

  let displayedValue = Number(els.countDisplay.textContent || 0);
  let animationTimer = 0;

  const renderStepMenu = (selectedStep) => {
    els.stepMenu.innerHTML = "";

    [...STEPS]
      .sort((a, b) => a - b)
      .forEach((step) => {
        const li = document.createElement("li");
        li.className = "step-option";
        li.dataset.step = String(step);
        li.setAttribute("role", "option");
        li.setAttribute("aria-selected", String(step === selectedStep));
        li.textContent = formatStep(step);
        els.stepMenu.appendChild(li);
      });

    els.selectedStepLabel.textContent = formatStep(selectedStep);
  };

  const setMenuOpen = (open) => {
    els.stepToggle.setAttribute("aria-expanded", String(open));
    els.stepMenu.classList.toggle("open", open);
  };

  const setCount = (value) => {
    window.clearTimeout(animationTimer);
    displayedValue = Number(value);
    els.countDisplay.textContent = String(value);
  };

  const animateCount = (value, direction) => {
    const nextValue = Number(value);
    if (!Number.isFinite(nextValue)) {
      return;
    }

    if (nextValue === displayedValue) {
      setCount(nextValue);
      return;
    }

    window.clearTimeout(animationTimer);

    const currentLayer = document.createElement("span");
    currentLayer.className = "count-number";
    currentLayer.textContent = String(displayedValue);
    currentLayer.style.transform = "translateY(0)";
    currentLayer.style.opacity = "1";

    const nextLayer = document.createElement("span");
    nextLayer.className = "count-number";
    nextLayer.textContent = String(nextValue);

    const startOffset = direction === "down" ? "-100%" : "100%";
    const endOffset = direction === "down" ? "100%" : "-100%";
    nextLayer.style.transform = `translateY(${startOffset})`;
    nextLayer.style.opacity = "1";

    els.countDisplay.textContent = "";
    els.countDisplay.append(currentLayer, nextLayer);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        currentLayer.style.transform = `translateY(${endOffset})`;
        currentLayer.style.opacity = "0";
        nextLayer.style.transform = "translateY(0)";
      });
    });

    displayedValue = nextValue;
    animationTimer = window.setTimeout(() => {
      els.countDisplay.textContent = String(nextValue);
    }, 230);
  };

  const flashMainPress = () => {
    els.mainIncrementBtn.classList.add("bg-press");
    window.setTimeout(() => els.mainIncrementBtn.classList.remove("bg-press"), 160);
  };

  return {
    els,
    renderStepMenu,
    setMenuOpen,
    setCount,
    animateCount,
    flashMainPress
  };
};
