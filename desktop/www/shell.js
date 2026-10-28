(function () {
  const root = document.documentElement;

  function applyTheme(theme, announce) {
    const dark = theme !== "light";
    const next = dark ? "dark" : "light";
    root.dataset.theme = next;
    const color = document.querySelector('meta[name="theme-color"]');
    if (color) color.setAttribute("content", dark ? "#141614" : "#f4f1ea");
    const toggle = document.querySelector("#theme-toggle");
    const status = document.querySelector("#theme-status");
    if (toggle) {
      const label = dark ? "Switch to light mode" : "Switch to dark mode";
      toggle.setAttribute("aria-pressed", dark ? "true" : "false");
      toggle.setAttribute("aria-label", label);
      toggle.setAttribute("title", label);
    }
    if (announce && status) status.textContent = dark ? "Night theme" : "Day theme";
    try {
      localStorage.setItem("theme", next);
    } catch (err) {}
  }

  applyTheme(root.dataset.theme === "light" ? "light" : "dark", false);
  document.querySelector("#theme-toggle")?.addEventListener("click", () => {
    applyTheme(root.dataset.theme === "light" ? "dark" : "light", true);
  });

  const header = document.querySelector(".site-header");
  const footer = document.querySelector(".site-footer");
  const track = footer?.querySelector(".wrap");
  if (header && track) {
    const measure = () => {
      root.style.setProperty("--header-h", `${header.getBoundingClientRect().height}px`);
      root.style.setProperty("--grid-x", `${track.getBoundingClientRect().left}px`);
    };
    measure();
    if (typeof ResizeObserver === "function") {
      const observer = new ResizeObserver(measure);
      observer.observe(header);
      if (footer) observer.observe(footer);
      observer.observe(track);
    }
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure).catch(() => {});
  }

  const tools = document.querySelector(".nav-tools");
  const toolsToggle = tools?.querySelector(".nav-tools__toggle");
  const toolsMenu = tools?.querySelector(".nav-tools__menu");
  const toolsLink = tools?.querySelector(":scope > a");
  if (tools && toolsToggle && toolsMenu) {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let pinned = false;
    let suppress = false;
    const items = () => [...toolsMenu.querySelectorAll("a")];
    const open = () => tools.classList.contains("is-open");
    const setOpen = (value) => {
      tools.classList.toggle("is-open", value);
      toolsToggle.setAttribute("aria-expanded", value ? "true" : "false");
      toolsToggle.setAttribute("aria-label", value ? "Hide tools" : "Show tools");
    };
    const close = () => {
      pinned = false;
      setOpen(false);
    };

    tools.addEventListener("mouseenter", () => {
      if (finePointer.matches && !suppress) setOpen(true);
    });
    tools.addEventListener("mouseleave", () => {
      suppress = false;
      if (!pinned && !tools.contains(document.activeElement)) close();
    });
    toolsLink?.addEventListener("click", (event) => {
      if (finePointer.matches || open()) return;
      event.preventDefault();
      pinned = true;
      suppress = false;
      setOpen(true);
    });
    toolsLink?.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowDown") return;
      event.preventDefault();
      pinned = true;
      suppress = false;
      setOpen(true);
      items()[0]?.focus();
    });
    toolsToggle.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (open() && !pinned && finePointer.matches) {
        pinned = true;
        return;
      }
      if (open()) {
        pinned = false;
        suppress = true;
        setOpen(false);
        return;
      }
      suppress = false;
      pinned = true;
      setOpen(true);
    });
    toolsMenu.addEventListener("keydown", (event) => {
      const links = items();
      const index = links.indexOf(document.activeElement);
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close();
        toolsToggle.focus();
        return;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        event.stopPropagation();
        if (!links.length) return;
        const step = event.key === "ArrowDown" ? 1 : -1;
        links[(index + step + links.length) % links.length]?.focus();
      }
      if (event.key === "Home") {
        event.preventDefault();
        links[0]?.focus();
      }
      if (event.key === "End") {
        event.preventDefault();
        links.at(-1)?.focus();
      }
    });
    document.addEventListener("click", (event) => {
      if (!(event.target instanceof Node) || !tools.contains(event.target)) {
        suppress = false;
        close();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && open() && !toolsMenu.contains(document.activeElement)) close();
    });
    tools.addEventListener("focusout", (event) => {
      const next = event.relatedTarget;
      if (!(next instanceof Node) || !tools.contains(next)) close();
    });
  }

  document.addEventListener("click", (event) => {
    const link = event.target instanceof Element ? event.target.closest("a") : null;
    if (!link) return;
    if ((link.getAttribute("href") || "") === "#main") return;
    event.preventDefault();
  });

  window.open = function () {
    return null;
  };
})();
