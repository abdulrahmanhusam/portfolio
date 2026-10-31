(() => {
  "use strict";
  const motion = window.portfolioMotion;
  const root = document.documentElement;
  const menu = document.getElementById("menuPanel");
  const toggle = document.getElementById("menuToggle");
  const toggleParent = toggle.parentElement;
  const themeButton = document.getElementById("themeToggle");
  // Preserve bookmarks from the original single-page portfolio.
  if (
    document.body.dataset.page === "index" &&
    ["#achievements", "#certificates"].includes(location.hash)
  ) {
    location.replace(`about.html${location.hash}`);
  }
  let state = "closed",
    menuAnimation = null,
    focusTarget = null;
  function theme(value) {
    root.dataset.theme = value;
    themeButton.setAttribute(
      "aria-label",
      `Switch to ${value === "dark" ? "light" : "dark"} mode`,
    );
    themeButton.setAttribute("aria-pressed", String(value === "dark"));
  }
  theme(root.dataset.theme);
  themeButton.addEventListener("click", () => {
    const value = root.dataset.theme === "dark" ? "light" : "dark";
    theme(value);
    try {
      localStorage.setItem("theme", value);
    } catch (_) {}
  });
  async function openMenu() {
    if (state !== "closed") return;
    state = "opening";
    focusTarget = null;
    menu.append(toggle);
    menu.showModal();
    document.body.classList.add("menu-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
    menuAnimation = motion.animate(
      menu,
      [
        { clipPath: "circle(0% at 94% 5%)" },
        { clipPath: "circle(150% at 94% 5%)" },
      ],
      { duration: 650 },
    );
    menu.querySelectorAll("nav a").forEach((link, index) =>
      motion.animate(
        link,
        [
          { opacity: 0, transform: "translateY(35px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 650, delay: 100 + index * 65 },
      ),
    );
    await menuAnimation;
    if (state === "opening") state = "open";
  }
  async function closeMenu() {
    if (state === "closed") return;
    if (state === "closing") return menuAnimation;
    state = "closing";
    // Finish opening before reversing, so rapid toggles cannot leave an invisible modal.
    menu.getAnimations().forEach((animation) => animation.cancel());
    menuAnimation = motion.animate(
      menu,
      [
        { clipPath: "circle(150% at 94% 5%)" },
        { clipPath: "circle(0% at 94% 5%)" },
      ],
      { duration: 400, fill: "forwards" },
    );
    await menuAnimation;
    menu.close();
    menu.getAnimations().forEach((animation) => animation.cancel());
    document.body.classList.remove("menu-open");
    toggleParent.append(toggle);
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    state = "closed";
    (focusTarget || toggle).focus({ preventScroll: true });
  }
  toggle.addEventListener("click", () =>
    state === "closed" ? openMenu() : closeMenu(),
  );
  document.getElementById("closeMenu").addEventListener("click", closeMenu);
  menu.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeMenu();
  });
  menu.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const controls = [
      ...menu.querySelectorAll("a[href],button:not([disabled])"),
    ];
    const first = controls[0],
      last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  // Native dialog provides focus trapping and makes the page underneath inert.
  document.addEventListener("click", async (event) => {
    const link = event.target.closest("a[href]");
    if (
      !link ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey ||
      link.target ||
      link.hasAttribute("download")
    )
      return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || !/\.html$/.test(url.pathname)) return;
    if (
      url.pathname === location.pathname ||
      (url.pathname.endsWith("/index.html") && location.pathname.endsWith("/"))
    ) {
      if (!url.hash) return;
      const target = document.getElementById(
        decodeURIComponent(url.hash.slice(1)),
      );
      if (!target) return;
      event.preventDefault();
      focusTarget = target;
      target.setAttribute("tabindex", "-1");
      if (menu.open) await closeMenu();
      history.pushState(null, "", url.hash);
      target.scrollIntoView({
        behavior: motion.reduced.matches ? "instant" : "smooth",
      });
      target.focus({ preventScroll: true });
      return;
    }
    event.preventDefault();
    if (menu.open) await closeMenu();
    await motion.leave(url.href);
  });
  const viewButtons = [...document.querySelectorAll("[data-view]")];
  const projects = document.querySelector("[data-projects]");
  viewButtons.forEach((button) =>
    button.addEventListener("click", () => {
      const list = button.dataset.view === "list";
      motion.hidePreview();
      projects.classList.toggle("is-list", list);
      viewButtons.forEach((item) =>
        item.setAttribute("aria-pressed", String(item === button)),
      );
      motion.animate(
        projects,
        [
          { opacity: 0.25, transform: "translateY(16px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 450 },
      );
    }),
  );
  const form = document.getElementById("contactForm");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();
    const feedback = form.querySelector(".form-feedback");
    if (!name || !message) {
      feedback.textContent = "Please enter your name and message.";
      return;
    }
    const subject = `Portfolio contact from ${name}`;
    const body = `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;
    feedback.textContent =
      "Opening your email app with your message prefilled.";
    location.href = `mailto:abdulrahman.h.hasan@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
  addEventListener("pageshow", (event) => {
    if (event.persisted && menu.open) closeMenu();
  });
})();
