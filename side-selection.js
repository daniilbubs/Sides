(() => {
  "use strict";

  const panel = document.getElementById("sideSelection");
  if (!panel) return;
  const canvas = panel.querySelector(".side-selection-effects");
  const ctx = canvas && canvas.getContext("2d");
  if (!ctx) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const coarsePointer = window.matchMedia("(pointer: coarse)");
  const atlas = document.createElement("canvas");
  const atlasCtx = atlas.getContext("2d", { willReadFrequently: true });
  const glowAtlas = document.createElement("canvas");
  const glowCtx = glowAtlas.getContext("2d");
  const memoryWord = document.createElement("canvas");
  const memoryCtx = memoryWord.getContext("2d");
  const cellSize = 112;
  const atlasColumns = 8;
  const columns = Array.from(panel.querySelectorAll(".side-selection-button"), (button, index) => ({
    button,
    word: button.querySelector(".side-selection-word"),
    kind: index + 1,
    strength: 0,
    target: 0,
    rect: null,
    letters: Array.from(button.querySelectorAll(".side-selection-letter"), (element, letterIndex) => ({
      element,
      text: element.textContent,
      seed: (index + 1) * 13.71 + letterIndex * 7.39,
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
      atlasX: 0,
      atlasY: 0,
      points: []
    }))
  }));
  const letters = columns.flatMap((column) => column.letters);
  const fragments = Array.from({ length: 32 }, () => ({ active: false }));
  const memories = [
    { offsetX: -0.82, offsetY: 0.07, flipX: 1, flipY: 1, opacity: 0.16, delay: 0, recovery: 1.9 },
    { offsetX: 0.53, offsetY: -0.13, flipX: -1, flipY: 1, opacity: 0.11, delay: 0.65, recovery: 1.3 },
    { offsetX: 1.12, offsetY: 0.14, flipX: 1, flipY: -1, opacity: 0.18, delay: 1.4, recovery: 1.6 }
  ].map((memory) => ({ ...memory, active: false, influence: 0, nextAt: Infinity }));
  let frameId = 0;
  let lastFrame = 0;
  let pixelRatio = 1;
  let visible = false;
  let layoutDirty = true;
  let pointerActive = false;
  let pointerX = 0;
  let pointerY = 0;
  let focusedColumn = -1;
  let nextFragment = 0;
  let memoryPreviewActive = false;
  let memoryCenterX = 0;
  let memoryCenterY = 0;
  let memorySpread = 0;
  let memorySpan = 0;
  let memoryMargin = 0;

  function isVisible() {
    return !panel.hidden && panel.classList.contains("is-visible") && !document.hidden;
  }

  function measure() {
    const bounds = panel.getBoundingClientRect();
    pixelRatio = Math.min(window.devicePixelRatio || 1, coarsePointer.matches ? 1 : 1.5);
    canvas.width = Math.max(1, Math.round(bounds.width * pixelRatio));
    canvas.height = Math.max(1, Math.round(bounds.height * pixelRatio));
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    atlas.width = glowAtlas.width = atlasColumns * cellSize;
    atlas.height = glowAtlas.height = Math.ceil(letters.length / atlasColumns) * cellSize;
    const font = window.getComputedStyle(letters[0].element);
    atlasCtx.font = glowCtx.font = "300 " + font.fontSize + " " + font.fontFamily;
    atlasCtx.textAlign = glowCtx.textAlign = "center";
    atlasCtx.textBaseline = glowCtx.textBaseline = "middle";
    atlasCtx.fillStyle = "#bdbdbd";
    glowCtx.fillStyle = "#dedede";
    glowCtx.shadowColor = "#c8c8c8";
    glowCtx.shadowBlur = 19;
    glowCtx.shadowOffsetX = 10000;

    columns.forEach((column) => {
      column.rect = column.word.getBoundingClientRect();
    });
    letters.forEach((letter, index) => {
      const rect = letter.element.getBoundingClientRect();
      letter.x = rect.left + rect.width / 2 - bounds.left - letter.dx;
      letter.y = rect.top + rect.height / 2 - bounds.top - letter.dy;
      letter.atlasX = (index % atlasColumns) * cellSize;
      letter.atlasY = Math.floor(index / atlasColumns) * cellSize;
      const x = letter.atlasX + cellSize / 2;
      const y = letter.atlasY + cellSize / 2;
      atlasCtx.fillText(letter.text, x, y);
      glowCtx.fillText(letter.text, x - 10000, y);
    });

    // Cache the complete vertical word; each reflection needs just one draw.
    const wordLetters = columns[3].letters;
    const firstLetter = wordLetters[0];
    const lastLetter = wordLetters[wordLetters.length - 1];
    memoryCenterX = firstLetter.x;
    memoryCenterY = (firstLetter.y + lastLetter.y) / 2;
    memorySpan = lastLetter.y - firstLetter.y;
    memorySpread = Math.min(92, (columns[3].rect.left - columns[2].rect.left) * 0.48);
    memoryMargin = parseFloat(font.fontSize) * 0.65 + 8;
    memoryWord.width = Math.ceil(cellSize * pixelRatio);
    memoryWord.height = Math.ceil((memorySpan + cellSize) * pixelRatio);
    memoryCtx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    wordLetters.forEach((letter) => {
      memoryCtx.drawImage(atlas, letter.atlasX, letter.atlasY, cellSize, cellSize, 0, letter.y - firstLetter.y, cellSize, cellSize);
    });

    // Read glyph coverage only when the menu layout changes, never while animating.
    const pixels = atlasCtx.getImageData(0, 0, atlas.width, atlas.height).data;
    letters.forEach((letter) => {
      letter.points.length = 0;
      for (let y = 32; y < 80; y += 2) {
        for (let x = 32; x < 80; x += 2) {
          if (pixels[((letter.atlasY + y) * atlas.width + letter.atlasX + x) * 4 + 3] > 120) {
            letter.points.push({ x, y });
          }
        }
      }
    });
    layoutDirty = false;
    updateTargets();
  }

  function updateTargets() {
    let nearest = -1;
    let intensity = 0;
    if (pointerActive && visible) {
      const reach = Math.min(100, Math.max(45, panel.clientWidth / 9));
      columns.forEach((column, index) => {
        const rect = column.rect;
        if (!rect) return;
        const dx = Math.max(rect.left - pointerX, 0, pointerX - rect.right);
        const dy = Math.max(rect.top - pointerY, 0, pointerY - rect.bottom);
        const distance = Math.hypot(dx, dy);
        const amount = 1 - smoothstep(0, reach, distance);
        if (amount > intensity) {
          intensity = amount;
          nearest = index;
        }
      });
    }
    columns.forEach((column, index) => {
      column.target = index === nearest ? intensity : index === focusedColumn ? 0.85 : 0;
    });
    wake();
  }

  function wake() {
    if (!frameId && visible) {
      lastFrame = 0;
      frameId = window.requestAnimationFrame(draw);
    }
  }

  function draw(now) {
    frameId = 0;
    if (!isVisible()) return;
    if (layoutDirty) measure();
    const dt = lastFrame ? Math.min(0.05, (now - lastFrame) / 1000) : 1 / 60;
    lastFrame = now;
    const time = now / 1000;
    ctx.clearRect(0, 0, canvas.width / pixelRatio, canvas.height / pixelRatio);
    let moving = false;

    columns.forEach((column) => {
      const response = column.target > column.strength ? 8 : column.kind === 4 ? 2.8 : 4.2;
      column.strength += (column.target - column.strength) * (1 - Math.exp(-dt * response));
      if (column.target === 0 && column.strength < 0.002) column.strength = 0;
      const strength = column.strength;
      column.button.style.setProperty("--preview", strength.toFixed(4));
      if (column.kind === 2) column.button.classList.toggle("is-dissolving", strength > 0);
      if (strength > 0 || column.target > 0) moving = true;
      column.letters.forEach((letter) => {
        const phase = letter.seed;
        letter.dx = letter.dy = 0;
        if (!reducedMotion.matches && column.kind === 1) {
          letter.dx = strength * (Math.sin(time * 19.3 + phase) + Math.sin(time * 31.7 + phase * 3) * 0.55) * 1.25;
          letter.dy = strength * Math.sin(time * 16.1 + phase * 2.1) * 1.1;
          drawFracture(letter, strength, time);
        }
        letter.element.style.transform = "translate(" + letter.dx.toFixed(2) + "px," + letter.dy.toFixed(2) + "px)";
        if (column.kind === 2) {
          const erosion = strength * (0.48 + 0.26 * Math.sin(time * 0.8 + phase));
          letter.element.style.setProperty("--erosion", (1 - erosion).toFixed(4));
          letter.element.style.opacity = (1 - strength * 0.13).toFixed(4);
        } else if (column.kind === 3 && strength > 0) {
          drawRadiance(letter, strength, reducedMotion.matches ? 0 : time);
        }
      });
    });

    if (!reducedMotion.matches) {
      if (columns[1].target > 0.1 && now > nextFragment) {
        spawnFragment(time);
        nextFragment = now + 110 + Math.random() * 160;
      }
      moving = drawFragments(time) || moving;
      moving = drawMemories(time, dt) || moving;
    }
    ctx.globalAlpha = 1;
    if (!frameId && moving && (!reducedMotion.matches || columns.some((column) => Math.abs(column.target - column.strength) > 0.002))) {
      frameId = window.requestAnimationFrame(draw);
    }
  }

  function drawFracture(letter, strength, time) {
    const flicker = Math.pow(Math.max(0, Math.sin(time * 1.7 + letter.seed)), 18) * strength;
    if (flicker < 0.015) return;
    ctx.globalAlpha = flicker * 0.32;
    const sliceY = 48 + Math.floor((Math.sin(letter.seed) + 1) * 8);
    ctx.drawImage(atlas, letter.atlasX + 36, letter.atlasY + sliceY, 40, 3, letter.x - 20 + letter.dx + 3, letter.y - cellSize / 2 + sliceY + letter.dy, 40, 3);
    ctx.strokeStyle = "#999";
    ctx.lineWidth = 0.55;
    const side = Math.sin(letter.seed) > 0 ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(letter.x + side * 11, letter.y - 9);
    ctx.lineTo(letter.x + side * 17, letter.y - 4);
    ctx.lineTo(letter.x + side * 14, letter.y);
    ctx.stroke();
  }

  function drawRadiance(letter, strength, time) {
    const breath = 0.5 + 0.5 * Math.sin(time * 0.9 + letter.seed);
    const scale = 1.16 + breath * 0.28;
    const size = cellSize * scale;
    ctx.globalAlpha = strength * (0.2 + breath * 0.08);
    ctx.drawImage(glowAtlas, letter.atlasX, letter.atlasY, cellSize, cellSize, letter.x - size / 2, letter.y - size / 2, size, size);
    ctx.globalAlpha = strength * 0.022 * (1 - breath);
    const echoSize = cellSize * (1.05 + breath * 0.55);
    ctx.drawImage(atlas, letter.atlasX, letter.atlasY, cellSize, cellSize, letter.x - echoSize / 2, letter.y - echoSize / 2, echoSize, echoSize);
  }

  function spawnFragment(time) {
    const fragment = fragments.find((item) => !item.active);
    if (!fragment) return;
    const source = columns[1].letters;
    const letter = source[Math.floor(Math.random() * source.length)];
    if (!letter.points.length) return;
    const point = letter.points[Math.floor(Math.random() * letter.points.length)];
    fragment.active = true;
    fragment.born = time;
    fragment.life = 1.8 + Math.random() * 1.8;
    fragment.letter = letter;
    fragment.sx = point.x;
    fragment.sy = point.y;
    fragment.x = letter.x + point.x - cellSize / 2;
    fragment.y = letter.y + point.y - cellSize / 2;
    fragment.vx = (Math.random() < 0.5 ? -1 : 1) * (3 + Math.random() * 7);
    fragment.vy = -2 - Math.random() * 5;
    fragment.size = 1 + Math.random() * 1.7;
  }

  function drawFragments(time) {
    let active = false;
    fragments.forEach((fragment) => {
      if (!fragment.active) return;
      const age = (time - fragment.born) / fragment.life;
      if (age >= 1 || columns[1].strength === 0) {
        fragment.active = false;
        return;
      }
      active = true;
      const elapsed = time - fragment.born;
      ctx.globalAlpha = Math.sin(age * Math.PI) * columns[1].strength * 0.5;
      ctx.drawImage(atlas, fragment.letter.atlasX + fragment.sx, fragment.letter.atlasY + fragment.sy, fragment.size, fragment.size, fragment.x + fragment.vx * elapsed, fragment.y + fragment.vy * elapsed, fragment.size, fragment.size);
    });
    return active;
  }

  function spawnMemory(memory, time) {
    memory.active = true;
    memory.born = time;
    memory.life = 7 + Math.random() * 6;
    memory.x = memory.offsetX + (Math.random() - 0.5) * 0.18;
    memory.y = memory.offsetY + (Math.random() - 0.5) * 0.05;
    memory.phase = Math.random() * Math.PI * 2;
    memory.speed = 0.27 + Math.random() * 0.18;
    memory.alpha = memory.opacity * (0.8 + Math.random() * 0.2);
  }

  function drawMemories(time, dt) {
    const hovering = columns[3].target > 0;
    if (hovering && !memoryPreviewActive) {
      memories.forEach((memory) => {
        if (!memory.active) memory.nextAt = time + memory.delay;
      });
    }
    memoryPreviewActive = hovering;
    let active = false;
    memories.forEach((memory) => {
      const target = hovering ? columns[3].strength : 0;
      const response = hovering ? 2.2 : memory.recovery;
      memory.influence += (target - memory.influence) * (1 - Math.exp(-dt * response));
      if (!memory.active && hovering && time >= memory.nextAt) spawnMemory(memory, time);
      if (!memory.active) return;
      const age = time - memory.born;
      if (age >= memory.life || (!hovering && memory.influence < 0.002)) {
        memory.active = false;
        memory.influence = 0;
        memory.nextAt = time + 0.35 + Math.random() * 1.4;
        return;
      }
      active = true;
      const lifeFade = smoothstep(0, 1.6, age) * (1 - smoothstep(memory.life - 2.4, memory.life, age));
      const clarity = 0.12 + 0.88 * Math.pow(0.5 + 0.5 * Math.sin(age * memory.speed + memory.phase), 1.4);
      const driftX = Math.sin(age * 0.24 + memory.phase) * 3.5;
      const driftY = Math.cos(age * 0.19 + memory.phase * 1.7) * 4;
      const x = Math.max(memoryMargin, Math.min(canvas.width / pixelRatio - memoryMargin, memoryCenterX + memory.x * memorySpread + driftX));
      const y = memoryCenterY + memory.y * memorySpan + driftY;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(memory.flipX, memory.flipY);
      ctx.globalAlpha = memory.alpha * memory.influence * lifeFade * clarity;
      ctx.drawImage(memoryWord, -memoryWord.width / pixelRatio / 2, -memoryWord.height / pixelRatio / 2, memoryWord.width / pixelRatio, memoryWord.height / pixelRatio);
      ctx.restore();
    });
    return active;
  }

  function reset() {
    columns.forEach((column) => {
      column.strength = column.target = 0;
      column.button.style.removeProperty("--preview");
      column.button.classList.remove("is-dissolving");
      column.letters.forEach((letter) => {
        letter.dx = letter.dy = 0;
        letter.element.style.removeProperty("transform");
        letter.element.style.removeProperty("opacity");
        letter.element.style.removeProperty("--erosion");
      });
    });
    fragments.forEach((fragment) => { fragment.active = false; });
    memories.forEach((memory) => {
      memory.active = false;
      memory.influence = 0;
      memory.nextAt = Infinity;
    });
    memoryPreviewActive = false;
    pointerActive = false;
    focusedColumn = -1;
    canvas.width = canvas.height = 1;
    atlas.width = atlas.height = glowAtlas.width = glowAtlas.height = 1;
    memoryWord.width = memoryWord.height = 1;
    layoutDirty = true;
  }

  function syncVisibility() {
    const nextVisible = isVisible();
    if (visible === nextVisible) {
      if (panel.hidden) reset();
      return;
    }
    visible = nextVisible;
    if (visible) {
      measure();
    } else {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
      if (panel.hidden || document.hidden) reset();
    }
  }

  function trackPointer(event) {
    if (!visible) return;
    pointerActive = true;
    pointerX = event.clientX;
    pointerY = event.clientY;
    focusedColumn = -1;
    if (layoutDirty) measure();
    updateTargets();
    event.stopPropagation();
  }

  function releasePointer(event) {
    if (event.type === "pointerup" && event.pointerType !== "touch") return;
    pointerActive = false;
    updateTargets();
  }

  function smoothstep(low, high, value) {
    const t = Math.max(0, Math.min(1, (value - low) / (high - low)));
    return t * t * (3 - 2 * t);
  }

  panel.addEventListener("pointermove", trackPointer, { passive: true });
  panel.addEventListener("pointerdown", trackPointer, { passive: true });
  panel.addEventListener("pointerleave", releasePointer, { passive: true });
  panel.addEventListener("pointerup", releasePointer, { passive: true });
  panel.addEventListener("pointercancel", releasePointer, { passive: true });
  columns.forEach((column, index) => {
    column.button.addEventListener("focus", () => {
      if (!column.button.matches(":focus-visible")) return;
      focusedColumn = index;
      pointerActive = false;
      updateTargets();
    });
    column.button.addEventListener("blur", () => {
      focusedColumn = -1;
      updateTargets();
    });
  });
  window.addEventListener("resize", () => {
    layoutDirty = true;
    if (visible) measure();
  }, { passive: true });
  document.addEventListener("visibilitychange", syncVisibility);
  reducedMotion.addEventListener("change", () => {
    fragments.forEach((fragment) => { fragment.active = false; });
    memories.forEach((memory) => {
      memory.active = false;
      memory.influence = 0;
      memory.nextAt = Infinity;
    });
    memoryPreviewActive = false;
    wake();
  });
  new MutationObserver(syncVisibility).observe(panel, { attributes: true, attributeFilter: ["hidden", "class"] });
  reset();
  syncVisibility();
})();
