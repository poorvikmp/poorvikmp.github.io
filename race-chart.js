/* ============================================================
   Project 3 chart: three booms on one clock. Growth of $1 in each
   boom's leader basket, by months since the boom started, on a log
   scale. Drawn from race-data.js (real weekly values).
   Any element with data-race-chart gets a chart; add data-mini
   for the small, non-interactive version on the home page card.
   ============================================================ */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  // Drawing order: AI last so it sits on top
  const SERIES = [
    { key: "Housing", cls: "s-housing" },
    { key: "Dot-com", cls: "s-dotcom" },
    { key: "AI", cls: "s-ai" },
  ];
  const TICKS = [1, 2, 5, 10, 20];

  function el(tag, attrs, parent) {
    const node = document.createElementNS(NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }
  const monthYear = (d) => MONTHS[+d.slice(5, 7) - 1] + " " + d.slice(0, 4);
  const fmtX = (v) => (v < 10 ? v.toFixed(1) : Math.round(v)) + "×";

  function draw(box) {
    const data = window.P3_RACE;
    if (!data) return;
    const mini = box.hasAttribute("data-mini");
    const W = box.clientWidth;
    if (!W) return;
    const narrow = W < 560;
    const H = mini ? Math.round(W * 0.56) : Math.max(280, Math.min(380, Math.round(W * 0.44)));
    const m = mini ? { t: 8, r: 8, b: 22, l: 8 } : { t: 18, r: narrow ? 12 : 72, b: 30, l: narrow ? 36 : 44 };
    const lo = Math.log(0.9), hi = Math.log(40);
    const x = (mo) => m.l + (mo / 108) * (W - m.l - m.r);
    const y = (v) => m.t + ((hi - Math.log(v)) / (hi - lo)) * (H - m.t - m.b);
    const ai = data["AI"];
    const aiNow = ai.months[ai.months.length - 1];

    box.innerHTML = "";
    const svg = el("svg", {
      width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: "img",
      "aria-label": "Growth of $1 in each boom's leader stocks by months since the boom started, log scale. Dot-com leaders peaked at about 30 times after 60 months, housing leaders at about 9.5 times after 60 months. The AI leaders are about 7 times after 47 months, close to the dot-com path at the same point.",
    }, box);

    // Grid and axes
    TICKS.forEach((v) => {
      if (!mini) {
        el("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: v === 1 ? "c-base" : "c-grid" }, svg);
        const t = el("text", { x: m.l - 8, y: y(v) + 4, class: "c-tick", "text-anchor": "end" }, svg);
        t.textContent = v + "×";
      }
    });
    const every = mini || narrow ? 2 : 1;
    for (let yr = 0; yr <= 9; yr += every) {
      const xx = x(yr * 12);
      if (!mini) el("line", { x1: xx, x2: xx, y1: H - m.b, y2: H - m.b + 4, class: "c-base" }, svg);
      const t = el("text", { x: xx, y: H - (mini ? 6 : 10), class: "c-tick", "text-anchor": yr === 0 ? "start" : "middle" }, svg);
      t.textContent = yr === 0 ? "Start" : (narrow || mini ? yr + "y" : "Year " + yr);
    }

    // "AI today" marker
    el("line", { x1: x(aiNow), x2: x(aiNow), y1: m.t, y2: H - m.b, class: "c-cross" }, svg);
    if (!mini) {
      const t = el("text", { x: x(aiNow) + 6, y: H - m.b - 8, class: "c-note" }, svg);
      t.textContent = "AI today";
    }

    // The three lines
    SERIES.forEach((s) => {
      const d = data[s.key];
      let path = `M${x(0).toFixed(1)},${y(1).toFixed(1)}`;
      for (let i = 0; i < d.months.length; i++) path += "L" + x(d.months[i]).toFixed(1) + "," + y(d.growth[i]).toFixed(1);
      el("path", { d: path, class: "c-line " + s.cls }, svg);
    });

    // Peak dots, the AI end dot, and direct labels
    ["Dot-com", "Housing"].forEach((k) => {
      const d = data[k];
      const i = d.growth.indexOf(Math.max(...d.growth));
      const px = x(d.months[i]), py = y(d.growth[i]);
      el("circle", { cx: px, cy: py, r: mini ? 3 : 4, class: "c-dot " + (k === "Dot-com" ? "s-dotcom" : "s-housing") }, svg);
      if (!mini) {
        // On phones the housing label drops below the line, on a short leader, to stay clear of it
        const drop = narrow && k === "Housing";
        if (drop) el("line", { x1: px, x2: px, y1: py + 6, y2: y(3.4), class: "c-cross" }, svg);
        const t = el("text", drop ? { x: px, y: y(3.4) + 14, class: "c-note c-halo", "text-anchor": "middle" } : { x: px + 8, y: py - 9, class: "c-note c-halo" }, svg);
        t.textContent = (narrow ? "" : k + " peak, ") + monthYear(d.peak);
      }
    });
    el("circle", { cx: x(aiNow), cy: y(ai.growth[ai.growth.length - 1]), r: mini ? 3 : 4, class: "c-dot s-ai" }, svg);
    if (!mini && !narrow) {
      SERIES.filter((s) => s.key !== "AI").forEach((s) => {
        const d = data[s.key];
        const t = el("text", { x: W - m.r + 6, y: y(d.growth[d.growth.length - 1]) + 4, class: "c-end" }, svg);
        t.textContent = s.key;
      });
    }

    if (mini) return;

    // Hover layer: crosshair, one dot per line, tooltip
    const hover = el("g", { style: "display:none" }, svg);
    const vline = el("line", { y1: m.t, y2: H - m.b, class: "c-cross" }, hover);
    const dots = {};
    SERIES.forEach((s) => { dots[s.key] = el("circle", { r: 4.5, class: "c-dot " + s.cls }, hover); });
    const tip = document.createElement("div");
    tip.className = "c-tip";
    tip.hidden = true;
    box.appendChild(tip);
    const hit = el("rect", { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, fill: "transparent" }, svg);

    function nearest(d, mo) {
      let best = 0;
      for (let i = 1; i < d.months.length; i++) if (Math.abs(d.months[i] - mo) < Math.abs(d.months[best] - mo)) best = i;
      return best;
    }
    function show(evt) {
      const r = svg.getBoundingClientRect();
      const mo = Math.max(0, Math.min(108, ((evt.clientX - r.left - m.l) / (W - m.l - m.r)) * 108));
      const cx = x(mo);
      hover.style.display = "";
      vline.setAttribute("x1", cx);
      vline.setAttribute("x2", cx);
      const yrs = Math.floor(mo / 12), mos = Math.round(mo % 12);
      let html = "<strong>" + (mo < 1 ? "At the start" : (yrs ? yrs + (yrs === 1 ? " year " : " years ") : "") + (mos ? mos + (mos === 1 ? " month" : " months") : "") + " in") + "</strong>";
      ["Dot-com", "Housing", "AI"].forEach((k) => {
        const s = SERIES.find((q) => q.key === k);
        const d = data[k];
        const dot = dots[k];
        if (mo > d.months[d.months.length - 1] + 0.3) { dot.style.display = "none"; return; }
        const i = nearest(d, mo);
        dot.style.display = "";
        dot.setAttribute("cx", x(d.months[i]));
        dot.setAttribute("cy", y(d.growth[i]));
        html += '<span><i class="sw ' + s.cls + '"></i>' + k + " · " + monthYear(d.dates[i]) + "<b>" + fmtX(d.growth[i]) + "</b></span>";
      });
      tip.innerHTML = html;
      tip.hidden = false;
      const left = cx + 14 + tip.offsetWidth > W ? cx - 14 - tip.offsetWidth : cx + 14;
      tip.style.left = left + "px";
      tip.style.top = m.t + 16 + "px";
    }
    hit.addEventListener("pointermove", show);
    hit.addEventListener("pointerdown", show);
    hit.addEventListener("pointerleave", () => { hover.style.display = "none"; tip.hidden = true; });
  }

  const boxes = document.querySelectorAll("[data-race-chart]");
  boxes.forEach(draw);
  if ("ResizeObserver" in window) {
    const seen = new WeakMap();
    const ro = new ResizeObserver((entries) => entries.forEach((e) => {
      const w = Math.round(e.contentRect.width);
      if (seen.get(e.target) !== w) { seen.set(e.target, w); draw(e.target); }
    }));
    boxes.forEach((b) => ro.observe(b));
  }
})();
