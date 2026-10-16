/* ============================================================
   Project 2 chart: stock-bond correlation by type of day,
   split by regime. Numbers come from cross_asset_events/report.md
   (Finding 1). Any element with data-corr-chart gets a chart;
   add data-mini for the small version on the home page card.
   ============================================================ */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const DATA = [
    { day: "CPI days", short: "CPI", growth: -0.11, infl: 0.55 },
    { day: "FOMC days", short: "Fed", growth: 0.0, infl: 0.53 },
    { day: "Jobs days (control)", short: "Jobs", growth: -0.47, infl: 0.01 },
    { day: "Normal days", short: "Normal", growth: -0.41, infl: 0.12 },
  ];
  const SERIES = [
    { key: "growth", name: "Growth regime", cls: "s-growth" },
    { key: "infl", name: "Inflation regime", cls: "s-infl" },
  ];

  function el(tag, attrs, parent) {
    const node = document.createElementNS(NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }
  const fmt = (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(2);

  // A bar with rounded corners only at its data end (the end away from zero)
  function barPath(x, w, y0, y1) {
    const h = Math.abs(y1 - y0);
    const r = Math.min(4, h, w / 2);
    if (y1 < y0) {
      return `M${x},${y0}V${y1 + r}Q${x},${y1} ${x + r},${y1}H${x + w - r}Q${x + w},${y1} ${x + w},${y1 + r}V${y0}Z`;
    }
    return `M${x},${y0}V${y1 - r}Q${x},${y1} ${x + r},${y1}H${x + w - r}Q${x + w},${y1} ${x + w},${y1 - r}V${y0}Z`;
  }

  function draw(box) {
    const mini = box.hasAttribute("data-mini");
    const W = box.clientWidth;
    if (!W) return;
    const narrow = W < 560;
    const H = mini ? Math.round(W * 0.62) : Math.max(280, Math.min(360, Math.round(W * 0.46)));
    const m = mini ? { t: 22, r: 6, b: 26, l: 6 } : { t: 26, r: 8, b: 40, l: narrow ? 40 : 48 };
    const lo = -0.6, hi = 0.7;
    const y = (v) => m.t + ((hi - v) / (hi - lo)) * (H - m.t - m.b);
    const gw = (W - m.l - m.r) / DATA.length;
    const bw = Math.min(mini ? 30 : 46, gw * 0.32);
    const gap = 4;

    box.innerHTML = "";
    const svg = el("svg", {
      width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: "img",
      "aria-label": "Stock-bond correlation in the inflation regime is +0.55 on CPI days and +0.53 on FOMC days, against +0.12 on normal days and +0.01 on jobs days. In the growth regime it is negative on all day types.",
    }, box);

    if (!mini) {
      for (let v = -0.4; v <= 0.61; v += 0.2) {
        const vv = Math.round(v * 10) / 10;
        if (vv === 0) {
          const z = el("text", { x: m.l - 8, y: y(0) + 4, class: "c-tick", "text-anchor": "end" }, svg);
          z.textContent = "0";
          continue;
        }
        el("line", { x1: m.l, x2: W - m.r, y1: y(vv), y2: y(vv), class: "c-grid" }, svg);
        const t = el("text", { x: m.l - 8, y: y(vv) + 4, class: "c-tick", "text-anchor": "end" }, svg);
        t.textContent = fmt(vv).replace(".00", ".0").replace(/0$/, "");
      }
    }

    const tip = document.createElement("div");
    tip.className = "c-tip";
    tip.hidden = true;
    if (!mini) box.appendChild(tip);

    DATA.forEach((d, i) => {
      const cx = m.l + gw * (i + 0.5);
      const label = el("text", { x: cx, y: H - (mini ? 6 : 14), class: mini ? "c-tick" : "c-cat", "text-anchor": "middle" }, svg);
      label.textContent = mini || narrow ? d.short : d.day;

      SERIES.forEach((s, k) => {
        const v = d[s.key];
        const x = k === 0 ? cx - gap / 2 - bw : cx + gap / 2;
        const y0 = y(0), y1 = Math.abs(y(v) - y0) < 1.5 ? y0 - 1.5 : y(v);
        el("path", { d: barPath(x, bw, y0, y1), class: "c-bar " + s.cls }, svg);
        const hot = s.key === "infl" && (d.short === "CPI" || d.short === "Fed");
        const ty = v >= 0 ? y1 - 6 : y1 + (mini ? 12 : 15);
        const t = el("text", { x: x + bw / 2, y: ty, class: (hot ? "c-val hot" : "c-val") + (mini ? " sm" : ""), "text-anchor": "middle" }, svg);
        t.textContent = fmt(v);

        if (!mini) {
          const hit = el("rect", { x: x - gap / 2, y: m.t, width: bw + gap, height: H - m.t - m.b, fill: "transparent" }, svg);
          const show = () => {
            tip.innerHTML = "<strong>" + d.day + "</strong>" +
              '<span><i class="sw ' + s.cls + '"></i>' + s.name + "<b>" + fmt(v) + "</b></span>";
            tip.hidden = false;
            const left = x + bw + 12 + tip.offsetWidth > W ? x - 12 - tip.offsetWidth : x + bw + 12;
            tip.style.left = Math.max(0, left) + "px";
            tip.style.top = m.t + "px";
          };
          hit.addEventListener("pointerenter", show);
          hit.addEventListener("pointerdown", show);
          hit.addEventListener("pointerleave", () => { tip.hidden = true; });
        }
      });
    });

    el("line", { x1: m.l, x2: W - m.r, y1: y(0), y2: y(0), class: "c-base" }, svg);
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
