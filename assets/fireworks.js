(() => {
  const canvas = document.getElementById("fireworksCanvas");
  if (!canvas) return;

  const prefersReducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  const state = {
    dpr: 1,
    width: 0,
    height: 0,
    lastTime: 0,
    running: true,
    shells: [],
    particles: [],
    nextAutoAt: 0,
  };

  const palette = ["#ff004c", "#00a2ff", "#7cfc00", "#ffd400", "#a56eff", "#ff8f00"];

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function pick(arr) {
    return arr[(Math.random() * arr.length) | 0];
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function resize() {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    state.dpr = dpr;
    state.width = Math.max(1, window.innerWidth || 1);
    state.height = Math.max(1, window.innerHeight || 1);
    canvas.width = Math.floor(state.width * dpr);
    canvas.height = Math.floor(state.height * dpr);
    canvas.style.width = `${state.width}px`;
    canvas.style.height = `${state.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, state.width, state.height);
  }

  function addShell({ x, y, vx, vy, color }) {
    state.shells.push({
      x,
      y,
      vx,
      vy,
      color,
      trail: [],
      exploded: false,
    });
  }

  function addParticle({ x, y, vx, vy, color, life, size, flicker }) {
    state.particles.push({
      x,
      y,
      vx,
      vy,
      color,
      life,
      maxLife: life,
      size,
      flicker,
    });
  }

  function explode(shell) {
    const count = Math.floor(rand(36, 64));
    const baseSpeed = rand(2.2, 4.4);
    const gravity = 0.035;

    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + rand(-0.05, 0.05);
      const speed = baseSpeed * rand(0.7, 1.15);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const life = Math.floor(rand(800, 1300));
      const size = rand(1.2, 2.4);
      const flicker = Math.random() < 0.25;

      addParticle({
        x: shell.x,
        y: shell.y,
        vx,
        vy,
        color: shell.color,
        life,
        size,
        flicker,
      });
    }

    // Add a few "sparkle" particles in a second color
    const sparkleColor = pick(palette.filter((c) => c !== shell.color));
    for (let i = 0; i < 14; i += 1) {
      addParticle({
        x: shell.x,
        y: shell.y,
        vx: rand(-1.6, 1.6),
        vy: rand(-1.6, 1.6),
        color: sparkleColor,
        life: Math.floor(rand(450, 700)),
        size: rand(0.9, 1.6),
        flicker: true,
      });
    }

    shell.exploded = true;
    shell._gravity = gravity;
  }

  function launchAt(x, y) {
    const startX = clamp(x, 40, state.width - 40);
    const startY = state.height + 6;
    const targetY = clamp(y, state.height * 0.18, state.height * 0.55);

    const t = clamp((startY - targetY) / 520, 0.55, 1.4);
    const vy = -rand(6.2, 8.6) * t;
    const vx = rand(-1.2, 1.2);

    addShell({ x: startX, y: startY, vx, vy, color: pick(palette) });
  }

  function autoLaunch(now) {
    if (now < state.nextAutoAt) return;

    const density = state.width < 520 ? 1 : 2;
    const launches = Math.random() < 0.2 ? density + 1 : density;
    for (let i = 0; i < launches; i += 1) {
      launchAt(rand(80, state.width - 80), rand(state.height * 0.2, state.height * 0.55));
    }

    const nextIn = rand(900, 1600) + (state.width < 520 ? 600 : 0);
    state.nextAutoAt = now + nextIn;
  }

  function stepShell(shell, dt) {
    const gravity = 0.06;
    shell.vy += gravity * dt;
    shell.x += shell.vx * dt;
    shell.y += shell.vy * dt;

    shell.trail.push({ x: shell.x, y: shell.y });
    if (shell.trail.length > 12) shell.trail.shift();

    if (!shell.exploded && shell.vy >= -0.6) explode(shell);
  }

  function stepParticle(p, dt) {
    const gravity = 0.06;
    const drag = 0.985;

    p.vx *= Math.pow(drag, dt);
    p.vy *= Math.pow(drag, dt);
    p.vy += gravity * dt;

    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= 16.67 * dt;
  }

  function draw(now) {
    if (!state.running) return;

    const dtMs = state.lastTime ? now - state.lastTime : 16.67;
    state.lastTime = now;
    const dt = clamp(dtMs / 16.67, 0.5, 2.0);

    autoLaunch(now);

    // Fade the previous frame for trails, without tinting the page background
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
    ctx.fillRect(0, 0, state.width, state.height);

    // Shells
    for (let i = state.shells.length - 1; i >= 0; i -= 1) {
      const s = state.shells[i];
      stepShell(s, dt);

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let t = 0; t < s.trail.length; t += 1) {
        const pt = s.trail[t];
        if (t === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();

      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(s.x, s.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (s.exploded || s.y > state.height + 60) state.shells.splice(i, 1);
    }

    // Particles
    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const p = state.particles[i];
      stepParticle(p, dt);

      const lifeRatio = p.life / p.maxLife;
      const alpha = clamp(lifeRatio, 0, 1);
      const size = p.size * (0.8 + 0.6 * alpha);

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = alpha * (p.flicker ? rand(0.65, 1) : 1);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (p.life <= 0 || p.y > state.height + 80) state.particles.splice(i, 1);
    }

    // Keep memory bounded
    if (state.particles.length > 1400) state.particles.length = 1400;

    requestAnimationFrame(draw);
  }

  function onVisibilityChange() {
    const hidden = document.hidden;
    state.running = !hidden;
    canvas.classList.toggle("is-paused", hidden);
    if (!hidden) {
      state.lastTime = performance.now();
      requestAnimationFrame(draw);
    }
  }

  function onPointerDown(e) {
    const target = e.target;
    if (target && typeof target.closest === "function") {
      if (target.closest(".window")) return;
    }

    const x = typeof e.clientX === "number" ? e.clientX : state.width / 2;
    const y = typeof e.clientY === "number" ? e.clientY : state.height / 2;
    launchAt(x, y);
  }

  resize();
  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", onVisibilityChange);
  document.addEventListener("pointerdown", onPointerDown, { passive: true });

  // Start with a couple of quick bursts
  state.lastTime = performance.now();
  state.nextAutoAt = state.lastTime + 400;
  requestAnimationFrame(draw);
})();
