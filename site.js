/* ============================================================
   Motion shared by every page.

   1. Page turns between pages: modern browsers animate the switch
      themselves (see "Motion" in style.css); this file only tells
      them which way to turn. Other browsers get a short fade.
   2. On chapter pages: sections fade up as you scroll, the
      contents in the margin highlights where you are, and a thin
      line under the header shows how far you've read.

   Load this file inside <head> (not at the end of the page), so
   it's ready before the browser shows the new page. If you add a
   new chapter page, add it to ORDER below so the page turns the
   right way.
   ============================================================ */
(function () {
  const ORDER = {
    "index.html": 0,
    "regime-allocation.html": 1,
    "cross-asset-events.html": 2,
    "ai-bubble.html": 3,
  };
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nativeTurns = "CSSViewTransitionRule" in window;

  function orderOf(url) {
    try {
      const u = new URL(url, location.href);
      const file = u.pathname.split("/").pop() || "index.html";
      return file in ORDER ? ORDER[file] : null;
    } catch (e) { return null; }
  }
  function remember(dir) {
    try { sessionStorage.setItem("turn", JSON.stringify({ dir, t: Date.now() })); } catch (e) {}
  }
  function recall() {
    try {
      const v = JSON.parse(sessionStorage.getItem("turn") || "null");
      sessionStorage.removeItem("turn");
      return v && Date.now() - v.t < 4000 ? v.dir : null;
    } catch (e) { return null; }
  }

  // ---------- 1. Page turns ----------
  // Note which way we're going when a link to another page is clicked
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank") return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || (url.pathname === location.pathname && url.hash)) return;
    const from = orderOf(location.href), to = orderOf(url.href);
    if (from === null || to === null) return;
    const dir = to >= from ? "forward" : "backward";
    remember(dir);
    if (!nativeTurns && !reduce) {
      e.preventDefault();
      root.classList.add("leaving");
      setTimeout(() => { location.href = a.href; }, 260);
    }
  });

  // Modern browsers: pick the forward or backward page turn
  window.addEventListener("pagereveal", (e) => {
    if (!e.viewTransition) return;
    let dir = recall();
    if (!dir && window.navigation && navigation.activation && navigation.activation.from) {
      const from = orderOf(navigation.activation.from.url), to = orderOf(location.href);
      if (from !== null && to !== null) dir = to >= from ? "forward" : "backward";
    }
    if (e.viewTransition.types) e.viewTransition.types.add(dir || "forward");
  });

  // Other browsers: fade the new page in
  if (!nativeTurns && !reduce && recall()) {
    root.classList.add("arriving");
    setTimeout(() => root.classList.remove("arriving"), 800);
  }
  // Coming back with the Back button: undo the fade-out
  window.addEventListener("pageshow", () => root.classList.remove("leaving"));

  // ---------- 2. Chapter pages ----------
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", chapter);
  else chapter();

  // Runs once the page has loaded
  function chapter() {
    if (!document.body.classList.contains("chapter")) return;

    // Fade sections up as they scroll into view
    if (!reduce && "IntersectionObserver" in window) {
      const items = document.querySelectorAll(".article > *, .stats .stat, .tldr, .hero-chart, .next-project");
      const io = new IntersectionObserver((entries) => entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      }), { rootMargin: "0px 0px -6% 0px" });
      items.forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight) return; // already on screen
        el.classList.add("reveal");
        io.observe(el);
      });
    }

    // Highlight the current section in the margin contents
    const links = Array.from(document.querySelectorAll(".toc a[href^='#']"));
    const heads = links.map((a) => document.getElementById(a.getAttribute("href").slice(1))).filter(Boolean);
    // Reading progress line under the header
    const nav = document.querySelector(".nav");
    const bar = document.createElement("div");
    bar.className = "progress";
    if (nav) nav.appendChild(bar);

    let ticking = false;
    function onScroll() {
      ticking = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ")";
      let active = null;
      heads.forEach((h) => { if (h.getBoundingClientRect().top < window.innerHeight * 0.3) active = h; });
      links.forEach((a) => a.classList.toggle("active", !!active && a.getAttribute("href") === "#" + active.id));
    }
    window.addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();
  }
})();
