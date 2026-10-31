/* Shared motion for the static pages. No scroll hijacking or per-page runtimes. */
(() => {
  "use strict";
  document.documentElement.classList.add("js");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const desktop = matchMedia(
    "(hover: hover) and (pointer: fine) and (min-width: 701px)",
  );
  const animations = new Set();
  const observers = [];
  const curtain = document.querySelector(".transition-curtain");
  const ease = "cubic-bezier(.22,1,.36,1)";
  async function animate(element, frames, options = {}) {
    if (!element || reduced.matches || !element.animate) return;
    const animation = element.animate(frames, {
      duration: 650,
      easing: ease,
      fill: "backwards",
      ...options,
    });
    animations.add(animation);
    try {
      await animation.finished;
    } catch (_) {
      /* Changes in motion preference cancel safely. */
    } finally {
      animations.delete(animation);
    }
  }
  let leaving = false;
  async function leave(url) {
    if (leaving) return;
    leaving = true;
    hidePreview();
    curtain.style.visibility = "visible";
    try {
      sessionStorage.setItem("portfolio:enter", "1");
    } catch (_) {}
    await Promise.all([
      animate(
        curtain,
        [{ transform: "translateY(110%)" }, { transform: "translateY(0)" }],
        { duration: 420, fill: "forwards" },
      ),
      animate(
        document.querySelector("main"),
        [{ opacity: 1 }, { opacity: 0.65 }],
        { duration: 350 },
      ),
    ]);
    location.assign(url);
  }
  function entrance() {
    let arriving = false;
    try {
      arriving = sessionStorage.getItem("portfolio:enter") === "1";
      sessionStorage.removeItem("portfolio:enter");
    } catch (_) {}
    if (arriving && !reduced.matches) {
      curtain.style.visibility = "visible";
      animate(
        curtain,
        [{ transform: "translateY(0)" }, { transform: "translateY(-110%)" }],
        { duration: 650 },
      ).then(() => {
        curtain.style.visibility = "hidden";
      });
    } else curtain.style.visibility = "hidden";
    document
      .querySelectorAll(".hero-enter, [data-heading]")
      .forEach((element, index) => {
        animate(
          element,
          [
            {
              opacity: 0,
              transform: "translateY(40px)",
              clipPath: "inset(0 0 100% 0)",
            },
            { opacity: 1, transform: "translateY(0)", clipPath: "inset(0)" },
          ],
          { duration: 950, delay: (arriving ? 120 : 0) + index * 75 },
        );
      });
    const marker = document.querySelector(".location-mark");
    animate(
      marker,
      [
        { rotate: "-90deg", opacity: 0 },
        { rotate: "0deg", opacity: 1 },
      ],
      { duration: 1200, delay: 400 },
    );
  }
  function observe(selector, callback, threshold = 0.12) {
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(selector).forEach(callback);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            observer.unobserve(entry.target);
            callback(entry.target);
          }
        }),
      { threshold },
    );
    document
      .querySelectorAll(selector)
      .forEach((element) => observer.observe(element));
    observers.push(observer);
  }
  const revealElements = [...document.querySelectorAll("[data-reveal]")];
  revealElements.forEach((element) => {
    if (!reduced.matches && element.getBoundingClientRect().top > innerHeight)
      element.classList.add("reveal-pending");
  });
  observe("[data-reveal]", (element) => {
    element.classList.remove("reveal-pending");
    element.dataset.revealed = "true";
    animate(
      element,
      [
        { opacity: 0, transform: "translateY(28px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 800 },
    );
  });
  document.querySelectorAll("[data-words]").forEach((element) => {
    const words = element.textContent.trim().split(/\s+/);
    element.replaceChildren(
      ...words.map((word) => {
        const mask = document.createElement("span");
        mask.className = "word-mask";
        const span = document.createElement("span");
        span.textContent = word;
        mask.append(span, document.createTextNode(" "));
        return mask;
      }),
    );
  });
  observe("[data-words]", (element) => {
    element.classList.add("words-visible");
    element.querySelectorAll(".word-mask>span").forEach((span, index) =>
      animate(
        span,
        [
          { opacity: 0.2, transform: "translateY(105%)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 700, delay: index * 24 },
      ),
    );
  });
  observe("[data-divider]", (element) =>
    animate(
      element.querySelector(".rule-line") || element,
      [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }],
      { duration: 1000 },
    ),
  );
  // Only visible media are read and written in the shared scroll frame.
  const visibleMedia = new Set();
  const media = [
    ...document.querySelectorAll("[data-parallax],.parallax-media"),
  ];
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) visibleMedia.add(entry.target);
        else visibleMedia.delete(entry.target);
      }),
    );
    media.forEach((el) => observer.observe(el));
    observers.push(observer);
  }
  let scrollFrame = 0;
  function onScroll() {
    if (scrollFrame || reduced.matches) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      const positions = [...visibleMedia].map((el) => ({
        el,
        rect: el.getBoundingClientRect(),
      }));
      positions.forEach(({ el, rect }) => {
        el.style.translate = `0 ${Math.max(-12, Math.min(12, (innerHeight / 2 - rect.top - rect.height / 2) * 0.035))}px`;
      });
    });
  }
  addEventListener("scroll", onScroll, { passive: true });
  // Move inner content; the anchor/button hit area never moves away from the pointer.
  document.querySelectorAll(".magnetic").forEach((control) => {
    control.addEventListener("pointermove", (event) => {
      if (reduced.matches || !desktop.matches) return;
      const rect = control.getBoundingClientRect();
      control.style.setProperty(
        "--mx",
        `${(event.clientX - rect.left - rect.width / 2) * 0.2}px`,
      );
      control.style.setProperty(
        "--my",
        `${(event.clientY - rect.top - rect.height / 2) * 0.2}px`,
      );
    });
    control.addEventListener("pointerleave", () => resetMagnet(control));
    control.addEventListener("blur", () => resetMagnet(control));
  });
  function resetMagnet(control) {
    control.style.setProperty("--mx", "0px");
    control.style.setProperty("--my", "0px");
  }
  const preview = document.createElement("div");
  preview.className = "hover-preview";
  preview.setAttribute("aria-hidden", "true");
  preview.innerHTML =
    '<img alt=""><span class="preview-label"><span>View project</span><span>↗</span></span>';
  const cursor = document.createElement("div");
  cursor.className = "context-cursor";
  cursor.textContent = "View ↗";
  cursor.setAttribute("aria-hidden", "true");
  document.body.append(preview, cursor);
  let pointerFrame = 0,
    x = 0,
    y = 0,
    targetX = 0,
    targetY = 0,
    previewMode = "",
    currentSource = "";
  function follow() {
    x += (targetX - x) * 0.22;
    y += (targetY - y) * 0.22;
    preview.style.transform = `translate3d(${Math.max(12, Math.min(innerWidth - 332, x + 24))}px,${Math.max(12, Math.min(innerHeight - 252, y - 120))}px,0)`;
    cursor.style.transform = `translate3d(${x - 44}px,${y - 44}px,0)`;
    if (previewMode) pointerFrame = requestAnimationFrame(follow);
    else pointerFrame = 0;
  }
  function hidePreview() {
    previewMode = "";
    preview.classList.remove("active");
    cursor.classList.remove("active");
  }
  document.querySelectorAll("[data-project-preview]").forEach((link) => {
    link.addEventListener("pointermove", (event) => {
      if (reduced.matches || !desktop.matches) return;
      targetX = event.clientX;
      targetY = event.clientY;
      const visual = event.target.closest(".project-visual");
      const mode = visual ? "cursor" : "preview";
      const source = link.dataset.projectPreview;
      if (currentSource !== source) {
        currentSource = source;
        const img = preview.querySelector("img");
        img.src = source;
        preview.className = `hover-preview ${link.dataset.previewTone || ""}`;
        animate(
          img,
          [
            { opacity: 0, transform: "translateY(20px) scale(1.05)" },
            { opacity: 1, transform: "translateY(0) scale(1)" },
          ],
          { duration: 450 },
        );
      }
      previewMode = mode;
      preview.classList.toggle("active", mode === "preview");
      cursor.classList.toggle("active", mode === "cursor");
      if (!pointerFrame) {
        x = targetX;
        y = targetY;
        follow();
      }
    });
    link.addEventListener("pointerleave", hidePreview);
    link.addEventListener("click", hidePreview);
  });
  addEventListener("scroll", hidePreview, { passive: true });
  function reset() {
    hidePreview();
    animations.forEach((animation) => animation.cancel());
    document.querySelectorAll(".magnetic").forEach(resetMagnet);
    media.forEach((el) => {
      el.style.translate = "";
    });
    revealElements.forEach((el) => el.classList.remove("reveal-pending"));
    document
      .querySelectorAll("[data-words]")
      .forEach((el) => el.classList.add("words-visible"));
  }
  reduced.addEventListener("change", reset);
  desktop.addEventListener("change", hidePreview);
  addEventListener("pagehide", (event) => {
    reset();
    cancelAnimationFrame(scrollFrame);
    cancelAnimationFrame(pointerFrame);
    scrollFrame = pointerFrame = 0;
    if (!event.persisted)
      observers.forEach((observer) => observer.disconnect());
  });
  addEventListener("pageshow", (event) => {
    if (event.persisted) {
      leaving = false;
      curtain.getAnimations().forEach((a) => a.cancel());
      curtain.style.visibility = "hidden";
    }
  });
  window.portfolioMotion = { animate, leave, reduced, hidePreview };
  entrance();
})();
