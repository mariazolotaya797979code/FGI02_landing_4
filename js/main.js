(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = document.getElementById("header");
  const burger = document.querySelector(".burger");
  const nav = document.getElementById("nav");
  const sticky = document.querySelector(".sticky-cta");
  const sceneImg = document.querySelector(".scene img");

  function onScroll() {
    const y = window.scrollY;
    if (header) header.classList.toggle("is-stuck", y > 100);
    if (sticky) sticky.classList.toggle("is-shown", y > window.innerHeight);
    if (sceneImg && !reduced) {
      const shift = Math.min(y * 0.12, 90);
      sceneImg.style.transform = "scale(1.08) translate3d(0," + shift + "px,0)";
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (burger && nav) {
    burger.addEventListener("click", function () {
      const open = nav.classList.toggle("is-open");
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });
  }

  function closeNav() {
    if (!nav || !burger) return;
    nav.classList.remove("is-open");
    burger.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    if (!document.querySelector(".modal.is-open")) document.body.style.overflow = "";
  }

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function smoothTo(el) {
    const headerH = header ? header.offsetHeight : 0;
    const target = el.getBoundingClientRect().top + window.scrollY - headerH + 1;
    if (reduced) {
      window.scrollTo(0, target);
      return;
    }
    const start = window.scrollY;
    const dist = target - start;
    const duration = 800;
    const t0 = performance.now();
    function frame(now) {
      const p = Math.min(1, (now - t0) / duration);
      window.scrollTo(0, start + dist * easeInOut(p));
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  document.addEventListener("click", function (event) {
    const link = event.target.closest('a[href^="#"]');
    if (!link || link.hasAttribute("data-open-form")) return;
    const id = link.getAttribute("href");
    if (!id || id === "#") return;
    const el = document.querySelector(id);
    if (!el) return;
    event.preventDefault();
    closeNav();
    smoothTo(el);
  });

  const reveals = document.querySelectorAll(".reveal");
  if (reduced || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.2 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  document.querySelectorAll(".faq__item").forEach(function (item) {
    const trigger = item.querySelector(".faq__trigger");
    const panel = item.querySelector(".faq__panel");
    if (!trigger || !panel) return;
    trigger.addEventListener("click", function () {
      const open = item.classList.toggle("is-open");
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
      panel.setAttribute("aria-hidden", open ? "false" : "true");
    });
  });

  const viewport = document.querySelector(".slider__viewport");
  const track = document.querySelector(".slider__track");
  const cards = track ? Array.prototype.slice.call(track.children) : [];
  const dotsWrap = document.querySelector(".dots");
  let index = 0;
  let timer = 0;

  function perView() {
    if (window.innerWidth >= 1024) return 3;
    if (window.innerWidth >= 768) return 2;
    return 1;
  }

  function maxIndex() {
    return Math.max(0, cards.length - perView());
  }

  function renderDots() {
    if (!dotsWrap) return;
    const pages = maxIndex() + 1;
    dotsWrap.innerHTML = "";
    for (let i = 0; i < pages; i += 1) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "dot" + (i === index ? " is-active" : "");
      dot.setAttribute("aria-label", "Отзывы, группа " + (i + 1));
      if (i === index) dot.setAttribute("aria-current", "true");
      dot.addEventListener("click", function () {
        go(i);
        restart();
      });
      dotsWrap.appendChild(dot);
    }
  }

  function layout(animate) {
    if (!viewport || !track || !cards.length) return;
    const n = perView();
    const gap = 16;
    const width = (viewport.clientWidth - gap * (n - 1)) / n;
    if (index > maxIndex()) index = 0;
    cards.forEach(function (card) {
      card.style.flex = "0 0 " + width + "px";
    });
    track.style.gap = gap + "px";
    track.style.transition = animate === false || reduced ? "none" : "transform 0.5s ease-in-out";
    track.style.transform = "translateX(-" + index * (width + gap) + "px)";
    renderDots();
  }

  function go(next) {
    const max = maxIndex();
    index = next > max ? 0 : next < 0 ? max : next;
    layout(true);
  }

  function restart() {
    window.clearInterval(timer);
    if (reduced || document.hidden) return;
    timer = window.setInterval(function () { go(index + 1); }, 5000);
  }

  document.querySelectorAll("[data-slider-prev]").forEach(function (btn) {
    btn.addEventListener("click", function () { go(index - 1); restart(); });
  });
  document.querySelectorAll("[data-slider-next]").forEach(function (btn) {
    btn.addEventListener("click", function () { go(index + 1); restart(); });
  });

  if (viewport) {
    viewport.addEventListener("mouseenter", function () { window.clearInterval(timer); });
    viewport.addEventListener("mouseleave", restart);
    viewport.addEventListener("focusin", function () { window.clearInterval(timer); });
    viewport.addEventListener("focusout", restart);
    window.addEventListener("resize", function () { layout(false); });
    document.addEventListener("visibilitychange", restart);
    layout(false);
    restart();
  }

  const modals = Array.prototype.slice.call(document.querySelectorAll(".modal"));
  let lastFocus = null;

  function focusable(root) {
    return Array.prototype.slice.call(root.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(function (el) {
      return !el.closest(".hp") && (el.offsetParent !== null || el === document.activeElement);
    });
  }

  function openModal(modal) {
    if (!modal) return;
    lastFocus = document.activeElement;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    const nodes = focusable(modal);
    if (nodes[0]) nodes[0].focus();
  }

  function closeModal(modal) {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  document.querySelectorAll("[data-open-form]").forEach(function (btn) {
    btn.addEventListener("click", function (event) {
      event.preventDefault();
      closeNav();
      const select = document.getElementById("service");
      const service = btn.getAttribute("data-service");
      if (select && service) select.value = service;
      openModal(document.getElementById("booking-modal"));
    });
  });

  document.querySelectorAll("[data-open-reviews]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      openModal(document.getElementById("reviews-modal"));
    });
  });

  modals.forEach(function (modal) {
    modal.addEventListener("click", function (event) {
      if (event.target === modal || event.target.closest("[data-close]")) closeModal(modal);
    });
    modal.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeModal(modal);
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = focusable(modal);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  });

  const form = document.getElementById("booking-form");
  if (!form) return;

  const status = document.getElementById("form-status");

  function setError(input, message) {
    const field = input.closest(".field");
    const slot = field ? field.querySelector(".error") : null;
    input.classList.toggle("is-invalid", Boolean(message));
    input.setAttribute("aria-invalid", message ? "true" : "false");
    if (slot) slot.textContent = message || "";
  }

  function validPhone(value) {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 10) return true;
    return digits.length === 11 && (digits.charAt(0) === "7" || digits.charAt(0) === "8");
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
  }

  function validate() {
    const name = form.name;
    const phone = form.phone;
    const email = form.email;
    const service = form.service;
    let ok = true;

    if (name.value.trim().length < 2) {
      setError(name, "Напишите, как к вам обращаться");
      ok = false;
    } else setError(name, "");

    if (!validPhone(phone.value)) {
      setError(phone, "Укажите телефон в формате +7 900 000-00-00");
      ok = false;
    } else setError(phone, "");

    if (!validEmail(email.value.trim())) {
      setError(email, "Проверьте адрес почты");
      ok = false;
    } else setError(email, "");

    if (!service.value) {
      setError(service, "Выберите формат встречи");
      ok = false;
    } else setError(service, "");

    return ok;
  }

  ["name", "phone", "email", "service"].forEach(function (key) {
    const input = form[key];
    if (!input) return;
    input.addEventListener("input", function () {
      if (input.classList.contains("is-invalid")) validate();
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    status.className = "form__status";
    status.textContent = "";
    if (form.company && form.company.value) {
      status.classList.add("is-ok");
      status.textContent = "Спасибо. Я получила заявку и отвечу в рабочее время.";
      form.reset();
      return;
    }
    if (!validate()) {
      status.classList.add("is-err");
      status.textContent = "Проверьте поля, отмеченные сообщением.";
      return;
    }

    const payload = {
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      service: form.service.value,
      comment: form.comment.value.trim(),
      page: window.location.href
    };

    const endpoint = (window.LEAD_CONFIG && window.LEAD_CONFIG.googleScriptUrl || "").trim();
    const submitBtn = form.querySelector('[type="submit"]');
    if (!endpoint) {
      status.classList.add("is-err");
      status.textContent = "Заявка пока не отправилась: приём в таблицу ещё не включён. Напишите на почту или в Telegram — я отвечу лично.";
      console.warn("Вставьте URL Google Apps Script в js/config.js (googleScriptUrl).");
      return;
    }

    submitBtn.disabled = true;
    status.textContent = "Отправляю…";

    const body = new URLSearchParams(payload);
    fetch(endpoint, { method: "POST", mode: "no-cors", body: body })
      .then(function () {
        status.className = "form__status is-ok";
        status.innerHTML = "Заявка отправлена. Я отвечу в течение 2–4 часов в рабочее время. Гайд «5 шагов к снижению тревоги» — <a href=\"guide.html\">открыть</a>.";
        form.reset();
      })
      .catch(function () {
        status.className = "form__status is-err";
        status.textContent = "Не получилось отправить. Напишите в Telegram или на почту — я на связи.";
      })
      .then(function () {
        submitBtn.disabled = false;
      });
  });
})();
