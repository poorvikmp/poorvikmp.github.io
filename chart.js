/* ============================================================
   Draws the "growth of $1" chart from growth-data.js.
   Any element with data-growth-chart gets a chart; add
   data-mini for the small, non-interactive version on cards.
   ============================================================ */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const TEST_START = "2015-01";

  function el(tag, attrs, parent) {
    const node = document.createElementNS(NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }
  const money = (v) => "$" + v.toFixed(2);
  const month = (d) => MONTHS[+d.slice(5) - 1] + " " + d.slice(0, 4);

  function draw(box) {
    const data = window.GROWTH;
    if (!data) return;
    const mini = box.hasAttribute("data-mini");
    const W = box.clientWidth;
    if (!W) return;
    const narrow = W < 560;
    const H = mini ? Math.round(W * 0.56) : Math.max(260, Math.min(380, Math.round(W * 0.48)));
    const m = mini ? { t: 28, r: 92, b: 14, l: 14 } : { t: 34, r: narrow ? 100 : 112, b: 30, l: narrow ? 34 : 46 };
    const n = data.dates.length;
    const lo = 0.5, hi = 7.2;
    const x = (i) => m.l + (i / (n - 1)) * (W - m.l - m.r);
    const y = (v) => m.t + ((hi - v) / (hi - lo)) * (H - m.t - m.b);

    box.innerHTML = "";
    const svg = el("svg", {
      width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: "img",
      "aria-label": "Growth of $1 from 2000 to 2026: Version 2 grew to $" + data.v2[n - 1].toFixed(2) +
        " and 60/40 to $" + data.b[n - 1].toFixed(2) + ", after trading costs.",
    }, box);

    // Test-period band: the years never used for tuning
    const iTest = data.dates.indexOf(TEST_START);
    el("rect", { x: x(iTest), y: m.t - (mini ? 22 : 26), width: x(n - 1) - x(iTest), height: H - m.b - m.t + (mini ? 22 : 26), class: "c-band" }, svg);
    const tl = el("text", { x: x(iTest) + 8, y: m.t - (mini ? 8 : 10), class: "c-note" }, svg);
    tl.textContent = mini || narrow ? "Test" : "Test period, 2015–2026";
    if (!mini) {
      const tr = el("text", { x: m.l + 4, y: m.t - 10, class: "c-note" }, svg);
      tr.textContent = narrow ? "Training" : "Training period, 2000–2014";
    }

    // Grid and axes (full chart only)
    if (!mini) {
      for (let v = 1; v <= 7; v++) {
        el("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: v === 1 ? "c-base" : "c-grid" }, svg);
        const t = el("text", { x: m.l - 8, y: y(v) + 4, class: "c-tick", "text-anchor": "end" }, svg);
        t.textContent = "$" + v;
      }
      data.dates.forEach((d, i) => {
        if (d.endsWith("-01") && +d.slice(0, 4) % (narrow ? 10 : 5) === 0) {
          const t = el("text", { x: x(i), y: H - 8, class: "c-tick", "text-anchor": "middle" }, svg);
          t.textContent = d.slice(0, 4);
        }
      });
    } else {
      el("line", { x1: m.l, x2: W - m.r, y1: y(1), y2: y(1), class: "c-base" }, svg);
    }

    // The two lines: benchmark first, so Version 2 sits on top
    const series = [
      { key: "b", name: "60/40", cls: "s-b" },
      { key: "v2", name: "Version 2", cls: "s-v2" },
    ];
    series.forEach((s) => {
      const d = data[s.key].map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + "," + y(v).toFixed(1)).join("");
      el("path", { d, class: "c-line " + s.cls }, svg);
    });

    // Direct labels at the right-hand end of each line
    const ends = series.map((s) => ({ ...s, v: data[s.key][n - 1] }));
    const yA = y(ends[0].v), yB = y(ends[1].v);
    const gap = 16, shift = Math.max(0, (gap - Math.abs(yA - yB)) / 2);
    ends.forEach((s, k) => {
      const yy = y(s.v) + (k === 0 ? shift : -shift) * (yA > yB ? 1 : -1);
      el("circle", { cx: x(n - 1), cy: y(s.v), r: 4, class: "c-dot " + s.cls }, svg);
      const t = el("text", { x: x(n - 1) + 10, y: yy + 4, class: "c-end" }, svg);
      t.textContent = s.name + " " + money(s.v);
    });

    if (mini) return;

    // Hover layer: crosshair, two dots and a tooltip
    const hover = el("g", { class: "c-hover", style: "display:none" }, svg);
    const vline = el("line", { y1: m.t, y2: H - m.b, class: "c-cross" }, hover);
    const dots = series.map((s) => el("circle", { r: 5, class: "c-dot " + s.cls }, hover));
    const tip = document.createElement("div");
    tip.className = "c-tip";
    tip.hidden = true;
    box.appendChild(tip);
    const hit = el("rect", { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, fill: "transparent" }, svg);

    function show(evt) {
      const r = svg.getBoundingClientRect();
      const px = evt.clientX - r.left;
      const i = Math.max(0, Math.min(n - 1, Math.round(((px - m.l) / (W - m.l - m.r)) * (n - 1))));
      const cx = x(i);
      hover.style.display = "";
      vline.setAttribute("x1", cx);
      vline.setAttribute("x2", cx);
      series.forEach((s, k) => { dots[k].setAttribute("cx", cx); dots[k].setAttribute("cy", y(data[s.key][i])); });
      const v2 = data.v2[i], b = data.b[i];
      tip.innerHTML =
        "<strong>" + month(data.dates[i]) + "</strong>" +
        '<span><i class="sw s-v2"></i>Version 2<b>' + money(v2) + "</b></span>" +
        '<span><i class="sw s-b"></i>60/40<b>' + money(b) + "</b></span>";
      tip.hidden = false;
      const left = cx + 14 + tip.offsetWidth > W ? cx - 14 - tip.offsetWidth : cx + 14;
      tip.style.left = left + "px";
      tip.style.top = m.t + "px";
    }
    hit.addEventListener("pointermove", show);
    hit.addEventListener("pointerdown", show);
    hit.addEventListener("pointerleave", () => { hover.style.display = "none"; tip.hidden = true; });
  }

  const boxes = document.querySelectorAll("[data-growth-chart]");
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
