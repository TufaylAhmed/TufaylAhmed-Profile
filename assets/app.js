(() => {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  const modal = document.getElementById("resume-modal");
  const form = document.getElementById("resume-form");
  const status = document.getElementById("resume-status");
  const submit = document.getElementById("resume-submit");
  const openers = document.querySelectorAll("[data-open-resume]");
  const closers = document.querySelectorAll("[data-close-resume]");

  function openModal() {
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    const email = form.querySelector('input[name="email"]');
    requestAnimationFrame(() => email?.focus());
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    status.textContent = "";
    status.className = "form-status";
  }

  openers.forEach((el) => el.addEventListener("click", openModal));
  closers.forEach((el) => el.addEventListener("click", closeModal));
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

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );

  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
})();
