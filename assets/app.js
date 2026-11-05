(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- Resume modal ---------- */
  const modal = document.getElementById("resume-modal");
  const form = document.getElementById("resume-form");
  const status = document.getElementById("resume-status");
  const submit = document.getElementById("resume-submit");

  const openModal = () => {
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => form.querySelector('input[name="email"]')?.focus());
  };
  const closeModal = () => {
    modal.hidden = true;
    document.body.style.overflow = "";
    status.textContent = "";
    status.className = "form-status";
  };

  document.querySelectorAll("[data-open-resume]").forEach((el) => el.addEventListener("click", openModal));
  document.querySelectorAll("[data-close-resume]").forEach((el) => el.addEventListener("click", closeModal));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "";
    status.className = "form-status";
    const data = new FormData(form);
    const email = String(data.get("email") || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      status.textContent = "Please enter a valid work email.";
      status.classList.add("error");
      return;
    }
    submit.disabled = true;
    submit.textContent = "Preparing…";
    try {
      const res = await fetch("/api/request-resume.php", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data,
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload.ok || !payload.downloadUrl) {
        throw new Error(payload.error || "Could not prepare the download.");
      }
      status.textContent = "Download starting…";
      status.classList.add("ok");
      const link = document.createElement("a");
      link.href = payload.downloadUrl;
      link.download = payload.filename || "Tufail_Ahmed_Sheikh_Resume.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(closeModal, 900);
      form.reset();
    } catch (err) {
      status.textContent = err.message || "Something went wrong. Try again.";
      status.classList.add("error");
    } finally {
      submit.disabled = false;
      submit.textContent = "Download PDF";
    }
  });

  /* ---------- Scroll reveal ---------- */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  /* ---------- Count-up stats ---------- */
  const counters = document.querySelectorAll("[data-count]");
  const countIo = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = Number(el.getAttribute("data-count") || 0);
        if (reduceMotion) {
          el.textContent = String(target);
          countIo.unobserve(el);
          return;
        }
        const start = performance.now();
        const dur = 1100;
        const tick = (now) => {
          const t = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = String(Math.round(target * eased));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        countIo.unobserve(el);
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach((el) => countIo.observe(el));

  /* ---------- Soft tilt ---------- */
  if (!reduceMotion) {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-2px)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  }

  /* ---------- Network motion graphic ---------- */
  const canvas = document.getElementById("net-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: true });
  let width = 0;
  let height = 0;
  let nodes = [];
  let packets = [];
  let raf = 0;
  let mouse = { x: -9999, y: -9999 };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  };

  const seed = () => {
    const count = Math.floor(Math.min(70, Math.max(34, (width * height) / 28000)));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: 1.2 + Math.random() * 1.8,
      pulse: Math.random() * Math.PI * 2,
    }));
    packets = [];
  };

  const spawnPacket = (a, b) => {
    packets.push({
      a,
      b,
      t: 0,
      speed: 0.004 + Math.random() * 0.008,
      hue: Math.random() > 0.7 ? "coral" : "blue",
    });
  };

  const step = () => {
    ctx.clearRect(0, 0, width, height);

    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      n.pulse += 0.02;
      if (n.x < -20) n.x = width + 20;
      if (n.x > width + 20) n.x = -20;
      if (n.y < -20) n.y = height + 20;
      if (n.y > height + 20) n.y = -20;

      const dx = n.x - mouse.x;
      const dy = n.y - mouse.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 140) {
        n.vx += (dx / dist) * 0.02;
        n.vy += (dy / dist) * 0.02;
      }
      n.vx *= 0.995;
      n.vy *= 0.995;
    }

    const linkDist = Math.min(180, width * 0.14);
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d < linkDist) {
          const alpha = (1 - d / linkDist) * 0.28;
          ctx.strokeStyle = `rgba(160, 190, 255, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          if (!reduceMotion && Math.random() < 0.0015 && packets.length < 18) {
            spawnPacket(a, b);
          }
        }
      }
    }

    for (const n of nodes) {
      const glow = 0.45 + Math.sin(n.pulse) * 0.25;
      ctx.beginPath();
      ctx.fillStyle = `rgba(190, 210, 255, ${0.35 + glow * 0.35})`;
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }

    packets = packets.filter((p) => p.t < 1);
    for (const p of packets) {
      p.t += p.speed;
      const x = p.a.x + (p.b.x - p.a.x) * p.t;
      const y = p.a.y + (p.b.y - p.a.y) * p.t;
      ctx.beginPath();
      ctx.fillStyle = p.hue === "coral" ? "rgba(255,140,100,0.95)" : "rgba(150,190,255,0.95)";
      ctx.shadowColor = p.hue === "coral" ? "rgba(255,120,80,0.8)" : "rgba(120,170,255,0.8)";
      ctx.shadowBlur = 12;
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    raf = requestAnimationFrame(step);
  };

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener(
    "pointermove",
    (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    },
    { passive: true }
  );

  resize();
  if (reduceMotion) {
    // Draw a single static frame
    step();
    cancelAnimationFrame(raf);
  } else {
    raf = requestAnimationFrame(step);
  }
})();
