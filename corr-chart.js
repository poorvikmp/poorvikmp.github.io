/* ============================================================
   Project 2 chart: the rolling 3-month stock-bond correlation,
   drawn from corr-data.js (real weekly values, 2006-2026).
   Above zero = inflation regime (orange), below = growth (blue).
   Any element with data-corr-chart gets a chart; add data-mini
   for the small, non-interactive version on the home page card.
   ============================================================ */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let uid = 0;

  function el(tag, attrs, parent) {
    const node = document.createElementNS(NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }
  const fmt = (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(2);
  const day = (d) => +d.slice(8) + " " + MONTHS[+d.slice(5, 7) - 1] + " " + d.slice(0, 4);

  function draw(box) {
    const data = window.SB_CORR;
    if (!data) return;
    const mini = box.hasAttribute("data-mini");
    const W = box.clientWidth;
    if (!W) return;
    const narrow = W < 560;
    const H = mini ? Math.round(W * 0.56) : Math.max(260, Math.min(360, Math.round(W * 0.42)));
    const m = mini ? { t: 8, r: 8, b: 22, l: 8 } : { t: 16, r: 12, b: 30, l: narrow ? 40 : 48 };
    const n = data.dates.length;
    const lo = -0.9, hi = 0.75;
    const t0 = Date.parse(data.dates[0]), t1 = Date.parse(data.dates[n - 1]);
    const xt = (t) => m.l + ((t - t0) / (t1 - t0)) * (W - m.l - m.r);
    const x = (i) => xt(Date.parse(data.dates[i]));
    const y = (v) => m.t + ((hi - v) / (hi - lo)) * (H - m.t - m.b);
    const y0 = y(0);
    const id = "cc" + (++uid);

    box.innerHTML = "";
    const svg = el("svg", {
      width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: "img",
      "aria-label": "Rolling 3-month correlation between US stocks and Treasury bonds, 2006 to 2026. It was negative most of the time until 2021, then mostly positive from 2021 onward, peaking near +0.66 in 2026.",
    }, box);

    // Grid and axes
    const step = mini ? 0 : 0.25;
    if (step) {
      for (let v = -0.75; v <= 0.751; v += step) {
        const vv = Math.round(v * 100) / 100;
        if (vv !== 0) el("line", { x1: m.l, x2: W - m.r, y1: y(vv), y2: y(vv), class: "c-grid" }, svg);
        if (narrow && Math.abs(vv) === 0.25) continue;
        const t = el("text", { x: m.l - 8, y: y(vv) + 4, class: "c-tick", "text-anchor": "end" }, svg);
        t.textContent = vv === 0 ? "0" : fmt(vv).replace(/0$/, "");
      }
    }
    const every = mini || narrow ? 5 : 2;
    for (let yr = every === 5 ? 2010 : 2008; yr <= 2026; yr += every) {
      const xx = xt(Date.parse(yr + "-01-01"));
      if (!mini) el("line", { x1: xx, x2: xx, y1: H - m.b, y2: H - m.b + 4, class: "c-base" }, svg);
      const t = el("text", { x: xx, y: H - (mini ? 6 : 10), class: "c-tick", "text-anchor": "middle" }, svg);
      t.textContent = yr;
    }

    // Area between the line and zero, coloured by sign using two clip regions
    const defs = el("defs", {}, svg);
    const cpUp = el("clipPath", { id: id + "u" }, defs);
    el("rect", { x: 0, y: 0, width: W, height: y0 }, cpUp);
    const cpDn = el("clipPath", { id: id + "d" }, defs);
    el("rect", { x: 0, y: y0, width: W, height: H - y0 }, cpDn);

    let line = "";
    for (let i = 0; i < n; i++) line += (i ? "L" : "M") + x(i).toFixed(1) + "," + y(data.corr[i]).toFixed(1);
    const area = line + `L${x(n - 1).toFixed(1)},${y0}L${x(0).toFixed(1)},${y0}Z`;
    el("path", { d: area, class: "c-area s-infl", "clip-path": `url(#${id}u)` }, svg);
    el("path", { d: area, class: "c-area s-growth", "clip-path": `url(#${id}d)` }, svg);
    el("path", { d: line, class: "c-line s-infl", "clip-path": `url(#${id}u)` }, svg);
    el("path", { d: line, class: "c-line s-growth", "clip-path": `url(#${id}d)` }, svg);
    el("line", { x1: m.l, x2: W - m.r, y1: y0, y2: y0, class: "c-zero" }, svg);

    // Region labels and one annotation (full chart only)
    if (!mini) {
      const up = el("text", { x: m.l + 8, y: y(0.62), class: "c-note" }, svg);
      up.textContent = narrow ? "Move together" : "Stocks and bonds move together (inflation regime)";
      const dn = el("text", narrow ? { x: W - m.r - 4, y: y(-0.86), class: "c-note", "text-anchor": "end" } : { x: xt(Date.parse("2021-01-01")) - 10, y: y(-0.8), class: "c-note", "text-anchor": "end" }, svg);
      dn.textContent = narrow ? "Bonds hedge stocks" : "Bonds hedge stocks (growth regime)";
      if (!narrow) {
        const iA = data.dates.indexOf("2022-11-11");
        if (iA > 0) {
          const ax = x(iA), ay = y(data.corr[iA]);
          el("line", { x1: ax, x2: ax - 40, y1: ay - 4, y2: ay - 34, class: "c-cross" }, svg);
          const a = el("text", { x: ax - 44, y: ay - 38, class: "c-note", "text-anchor": "end" }, svg);
          a.textContent = "2022: inflation shock, 60/40's worst year";
        }
      }
    }

    if (mini) return;

    // Hover layer: crosshair, dot and tooltip
    const hover = el("g", { style: "display:none" }, svg);
    const vline = el("line", { y1: m.t, y2: H - m.b, class: "c-cross" }, hover);
    const dot = el("circle", { r: 4.5, class: "c-dot" }, hover);
    const tip = document.createElement("div");
    tip.className = "c-tip";
    tip.hidden = true;
    box.appendChild(tip);
    const hit = el("rect", { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, fill: "transparent" }, svg);

    function show(evt) {
      const r = svg.getBoundingClientRect();
      const px = evt.clientX - r.left;
      let i = Math.round(((px - m.l) / (W - m.l - m.r)) * (n - 1));
      i = Math.max(0, Math.min(n - 1, i));
      const v = data.corr[i], cx = x(i);
      hover.style.display = "";
      vline.setAttribute("x1", cx);
      vline.setAttribute("x2", cx);
      dot.setAttribute("cx", cx);
      dot.setAttribute("cy", y(v));
      dot.setAttribute("class", "c-dot " + (v > 0 ? "s-infl" : "s-growth"));
      tip.innerHTML = "<strong>Week of " + day(data.dates[i]) + "</strong>" +
        '<span><i class="sw ' + (v > 0 ? "s-infl" : "s-growth") + '"></i>' +
        (v > 0 ? "Inflation regime" : "Growth regime") + "<b>" + fmt(v) + "</b></span>";
      tip.hidden = false;
      const left = cx + 14 + tip.offsetWidth > W ? cx - 14 - tip.offsetWidth : cx + 14;
      tip.style.left = left + "px";
      tip.style.top = m.t + "px";
    }
    hit.addEventListener("pointermove", show);
    hit.addEventListener("pointerdown", show);
    hit.addEventListener("pointerleave", () => { hover.style.display = "none"; tip.hidden = true; });
  }

  const boxes = document.querySelectorAll("[data-corr-chart]");
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
