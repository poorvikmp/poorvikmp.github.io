/* ============================================================
   The book on the home page.

   Every <section class="page"> inside <main data-book> is one page.
   This script binds them into leaves (two pages back to back) and
   turns them with a 3D page flip. On a wide screen you see two
   pages side by side; on a phone, one page at a time.

   Ways to turn a page: click a page, the arrow buttons, the arrow
   keys, or swipe. Links like href="#contents" flip straight to
   that page. Page numbers in the contents fill in by themselves.
   ============================================================ */
(function () {
  const book = document.querySelector("[data-book]");
  if (!book) return;
  const root = document.documentElement;
  root.classList.add("has-book");

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pages = Array.from(book.querySelectorAll(":scope > .page"));
  const controls = document.querySelector(".book-controls");
  const where = controls.querySelector(".where");
  const prevBtn = controls.querySelector(".prev");
  const nextBtn = controls.querySelector(".next");

  // Page size at scale 1 (the "trim size"), in px
  const PW = 480, PH = 650;
  const TURN = 950;           // one page turn, ms
  const RIFFLE = 720;         // each page when flipping through several
  const STAGGER = 110;        // gap between pages in a riffle

  // ---------- Running heads, page numbers, contents ----------
  pages.forEach((p, i) => {
    if (p.hasAttribute("data-plain")) return;
    if (p.dataset.head) {
      const head = document.createElement("div");
      head.className = "runhead";
      head.setAttribute("aria-hidden", "true");
      head.textContent = p.dataset.head;
      p.prepend(head);
    }
    const folio = document.createElement("div");
    folio.className = "folio";
    folio.setAttribute("aria-hidden", "true");
    folio.textContent = i;
    p.append(folio);
  });
  book.querySelectorAll(".toc-list a[href^='#']").forEach((a) => {
    const i = pageIndex(a.getAttribute("href"));
    const pg = a.querySelector(".pg");
    if (pg && i > 0) pg.textContent = i;
  });

  function pageIndex(hash) {
    const id = (hash || "").replace(/^#/, "");
    if (!id) return -1;
    return pages.findIndex((p) => p.id === id || (p.dataset.alias || "").split(" ").includes(id));
  }

  // ---------- Build the leaves ----------
  const spread = document.createElement("div");
  spread.className = "book-spread";
  book.appendChild(spread);
  const edgeL = document.createElement("div");
  const edgeR = document.createElement("div");
  edgeL.className = "edges l";
  edgeR.className = "edges r";

  let mode = null;
  let leaves = [];
  let current = 0;          // which spread (or page, on a phone) is open
  let filler = null;        // blank page so the back cover lands on the left

  function build() {
    pages.forEach((p) => p.remove());
    if (filler) filler.remove();
    spread.textContent = "";
    spread.append(edgeL, edgeR);
    leaves = [];
    let list = pages.slice();
    if (mode === "spread" && list.length % 2 === 1) {
      filler = filler || Object.assign(document.createElement("section"), { className: "page blank" });
      list.splice(list.length - 1, 0, filler);
    }
    const per = mode === "spread" ? 2 : 1;
    for (let i = 0; i < list.length; i += per) {
      const leaf = document.createElement("div");
      leaf.className = "leaf";
      const front = face("front", list[i]);
      const back = face("back", per === 2 ? list[i + 1] : null);
      leaf.append(front, back);
      leaf._pages = [list[i], per === 2 ? list[i + 1] : null];
      spread.appendChild(leaf);
      leaves.push(leaf);
    }
    root.dataset.bookMode = mode;
  }
  function face(side, page) {
    const f = document.createElement("div");
    f.className = "face " + side;
    if (page) {
      f.appendChild(page);
      if (page.classList.contains("cloth")) f.classList.add("cloth");
    }
    return f;
  }

  // Spread s shows the back of leaf s-1 (left) and the front of leaf s (right)
  function maxSpread() { return mode === "spread" ? leaves.length : leaves.length - 1; }
  function visiblePages(s) {
    if (mode === "single") return [leaves[s]._pages[0]];
    return [s > 0 ? leaves[s - 1]._pages[1] : null, s < leaves.length ? leaves[s]._pages[0] : null].filter(Boolean);
  }
  function spreadOfPage(page) {
    const k = leaves.findIndex((l) => l._pages.includes(page));
    if (mode === "single") return k;
    return leaves[k]._pages[0] === page ? k : k + 1;
  }

  // ---------- Sizing ----------
  function measure() {
    const vw = document.documentElement.clientWidth, vh = window.innerHeight;
    const bar = 52, ctl = vw <= 640 ? 56 : 60;
    const s = Math.min((vw - 64) / (2 * PW), (vh - bar - ctl - 24) / PH);
    if (vw >= 860 && s >= 0.8) {
      const k = Math.min(s, 1.25);
      return { mode: "spread", pw: PW * k, ph: PH * k, fs: 16 * k };
    }
    const pw = Math.min(vw - 20, 620);
    const ph = Math.max(420, vh - bar - ctl - 10);
    const k = Math.min(pw / 400, ph / 640); // smaller text on small or short phones
    return { mode: "single", pw, ph, fs: 16 * Math.min(1.12, Math.max(0.86, k)) };
  }
  let size;
  function layout() {
    size = measure();
    book.style.setProperty("--pw", size.pw + "px");
    book.style.setProperty("--ph", size.ph + "px");
    book.style.setProperty("--fs", size.fs + "px");
    if (size.mode !== mode) {
      const keep = mode ? visiblePages(current)[0] : null;
      mode = size.mode;
      build();
      setState(keep ? spreadOfPage(keep) : current);
    } else {
      place(false);
    }
  }

  // ---------- Showing a spread without animation ----------
  function setState(s, want) {
    current = Math.max(0, Math.min(maxSpread(), s));
    spread.classList.add("still");
    leaves.forEach((leaf, k) => {
      clearTimeout(leaf._mid);
      clearTimeout(leaf._end);
      leaf.classList.remove("turning", "fwd", "bwd");
      leaf.classList.toggle("flipped", k < current);
    });
    restack();
    place(false);
    void spread.offsetWidth;
    spread.classList.remove("still");
    update(want);
  }

  // Stack order: on the right, the lowest leaf is on top; on the left, the highest
  function restack() {
    const L = leaves.length;
    leaves.forEach((leaf, k) => {
      if (leaf.classList.contains("turning")) return;
      const flipped = leaf.classList.contains("flipped");
      leaf.style.zIndex = flipped ? k + 1 : L - k;
      leaf.classList.toggle("gone", mode === "single" && flipped);
      leaf.classList.toggle("top", k === current || k === current - 1);
    });
    // Only the open pages can be clicked or tabbed into
    const open = visiblePages(current);
    leaves.forEach((leaf) => leaf.querySelectorAll(".face").forEach((f) => {
      const page = f.firstElementChild;
      f.inert = !(page && open.includes(page));
    }));
  }

  // Centre the closed book on its cover (or back cover)
  function place(animate, ms) {
    let x = 0;
    if (mode === "spread") {
      if (current === 0) x = -size.pw / 2;
      else if (current === leaves.length) x = size.pw / 2;
    }
    spread.style.setProperty("--move", (animate ? ms || TURN : 0) + "ms");
    spread.style.transform = x ? `translateX(${x}px)` : "";
    edgeL.style.width = mode === "spread" && current > 0 && current < leaves.length ? Math.min(7, current * 1.3) + "px" : "0";
    edgeR.style.width = mode === "spread" && current > 0 && current < leaves.length ? Math.min(7, (leaves.length - current) * 1.3) + "px" : "0";
  }

  // ---------- Turning ----------
  // want: the page that was asked for, so the address bar can name it
  function go(target, want) {
    target = Math.max(0, Math.min(maxSpread(), target));
    if (target === current) return;
    if (reduce.matches) { setState(target, want); return; }
    const dir = target > current ? 1 : -1;
    const steps = Math.abs(target - current);
    const dur = steps > 1 ? RIFFLE : TURN;
    const gap = steps > 1 ? Math.min(STAGGER, 600 / steps) : 0;
    const order = [];
    if (dir > 0) for (let k = current; k < target; k++) order.push(k);
    else for (let k = current - 1; k >= target; k--) order.push(k);
    current = target;
    order.forEach((k, i) => setTimeout(() => turn(k, dir, dur), i * gap));
    place(true, dur + gap * (steps - 1));
    update(want);
  }

  function turn(k, dir, dur) {
    const leaf = leaves[k], L = leaves.length;
    if (!leaf) return;
    clearTimeout(leaf._mid);
    clearTimeout(leaf._end);
    leaf.classList.remove("gone", "fwd", "bwd");
    leaf.style.setProperty("--turn", dur + "ms");
    void leaf.offsetWidth; // restart the shading animation
    leaf.classList.add("turning", dir > 0 ? "fwd" : "bwd");
    // Above everything; swap stacking order as the page crosses the spine
    leaf.style.zIndex = 100 + (dir > 0 ? L - k : k);
    leaf.classList.toggle("flipped", dir > 0);
    leaf._mid = setTimeout(() => { leaf.style.zIndex = 100 + (dir > 0 ? k : L - k); }, dur * 0.5);
    leaf._end = setTimeout(() => {
      leaf.classList.remove("turning", "fwd", "bwd");
      restack();
    }, dur + 40);
    restack();
  }

  const next = () => go(current + 1);
  const prev = () => go(current - 1);

  // ---------- Labels and buttons ----------
  function update(want) {
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === maxSpread();
    const open = visiblePages(current).filter((p) => !p.classList.contains("blank"));
    const titles = [...new Set(open.map((p) => p.dataset.title).filter(Boolean))];
    const nums = open.map((p) => pages.indexOf(p)).filter((n) => n > 0 && !pages[n].hasAttribute("data-plain"));
    let text = "<b>" + titles.join(" · ") + "</b>";
    if (current === 0) text += " · tap to open";
    else if (nums.length) text += " · " + (nums.length > 1 ? "pages " + nums[0] + "–" + nums[nums.length - 1] : "page " + nums[0]);
    where.innerHTML = text;
    const first = want && open.includes(want) ? want : open[0];
    if (first && first.id) history.replaceState(null, "", current === 0 ? location.pathname + location.search : "#" + first.id);
  }

  // ---------- Input ----------
  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);

  // Click a page to turn it (links and buttons still work as normal)
  spread.addEventListener("click", (e) => {
    if (e.target.closest("a, button, input, textarea, select, label, [data-no-turn]")) return;
    if (String(window.getSelection()).length) return;
    const f = e.target.closest(".face");
    if (!f) return;
    if (mode === "spread") {
      if (f.classList.contains("front")) next(); else prev();
    } else {
      const r = f.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      if (x > 0.6) next(); else if (x < 0.4) prev();
    }
  });

  // Links to a page of the book flip to it
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href^='#']");
    if (!a) return;
    const i = pageIndex(a.getAttribute("href"));
    if (i < 0) return;
    e.preventDefault();
    go(spreadOfPage(pages[i]), pages[i]);
  });
  window.addEventListener("hashchange", () => {
    const i = pageIndex(location.hash);
    if (i >= 0) go(spreadOfPage(pages[i]), pages[i]);
  });

  document.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.target.closest("input, textarea, select")) return;
    if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); next(); }
    else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); prev(); }
    else if (e.key === "Home") { e.preventDefault(); go(0); }
    else if (e.key === "End") { e.preventDefault(); go(maxSpread()); }
  });

  // Swipe on touch screens
  let tx = null, ty = null;
  spread.addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  spread.addEventListener("touchend", (e) => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    tx = ty = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) (dx < 0 ? next : prev)();
  }, { passive: true });

  let raf = 0;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(layout);
  });

  // ---------- Start ----------
  const start = pageIndex(location.hash); // read before layout() tidies the address bar
  layout();
  if (start >= 0) setState(spreadOfPage(pages[start]), pages[start]);
})();
