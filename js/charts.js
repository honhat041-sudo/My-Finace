// Vẽ biểu đồ đơn giản bằng SVG thuần, không phụ thuộc thư viện ngoài.
const Charts = (() => {
  const PALETTE = ["#7c5cff", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#a3e635", "#f97316", "#64748b", "#eab308"];

  function colorFor(index) {
    return PALETTE[index % PALETTE.length];
  }

  function renderPie(container, items) {
    container.innerHTML = "";
    const total = items.reduce((s, i) => s + i.value, 0);

    if (!items.length || total <= 0) {
      container.innerHTML = '<div class="empty-state">Chưa có dữ liệu chi tiêu trong kỳ này.</div>';
      return;
    }

    const size = 180;
    const r = 70;
    const cx = size / 2;
    const cy = size / 2;
    const circumference = 2 * Math.PI * r;

    let offset = 0;
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);

    const bg = document.createElementNS(svgNS, "circle");
    bg.setAttribute("cx", cx);
    bg.setAttribute("cy", cy);
    bg.setAttribute("r", r);
    bg.setAttribute("fill", "none");
    bg.setAttribute("stroke", "#232329");
    bg.setAttribute("stroke-width", 26);
    svg.appendChild(bg);

    items.forEach((item, idx) => {
      const frac = item.value / total;
      const len = frac * circumference;
      const circle = document.createElementNS(svgNS, "circle");
      circle.setAttribute("cx", cx);
      circle.setAttribute("cy", cy);
      circle.setAttribute("r", r);
      circle.setAttribute("fill", "none");
      circle.setAttribute("stroke", colorFor(idx));
      circle.setAttribute("stroke-width", 26);
      circle.setAttribute("stroke-dasharray", `${len} ${circumference - len}`);
      circle.setAttribute("stroke-dashoffset", -offset);
      circle.setAttribute("transform", `rotate(-90 ${cx} ${cy})`);
      svg.appendChild(circle);
      offset += len;
    });

    const wrap = document.createElement("div");
    wrap.style.display = "flex";
    wrap.style.flexDirection = "column";
    wrap.style.alignItems = "center";
    wrap.style.gap = "14px";
    wrap.style.width = "100%";
    wrap.appendChild(svg);

    const legend = document.createElement("div");
    legend.className = "legend";
    items.forEach((item, idx) => {
      const pct = ((item.value / total) * 100).toFixed(1);
      const row = document.createElement("div");
      row.className = "legend-item";
      row.innerHTML = `
        <div class="legend-left">
          <span class="swatch" style="background:${colorFor(idx)}"></span>
          <span>${item.label}</span>
        </div>
        <strong>${pct}% · ${formatVND(item.value)}</strong>
      `;
      legend.appendChild(row);
    });
    wrap.appendChild(legend);
    container.appendChild(wrap);
  }

  function renderBar(container, months) {
    container.innerHTML = "";
    const max = Math.max(1, ...months.map((m) => Math.max(m.income, m.expense)));
    const width = Math.max(320, months.length * 90);
    const height = 220;
    const barAreaH = 160;

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", height);
    svg.setAttribute("preserveAspectRatio", "xMidYMax meet");

    const groupW = width / months.length;
    const barW = 20;

    months.forEach((m, idx) => {
      const gx = idx * groupW + groupW / 2;
      const incH = (m.income / max) * barAreaH;
      const expH = (m.expense / max) * barAreaH;

      const incRect = document.createElementNS(svgNS, "rect");
      incRect.setAttribute("x", gx - barW - 3);
      incRect.setAttribute("y", barAreaH - incH + 10);
      incRect.setAttribute("width", barW);
      incRect.setAttribute("height", Math.max(incH, 1));
      incRect.setAttribute("rx", 3);
      incRect.setAttribute("fill", "#22c55e");
      svg.appendChild(incRect);

      const expRect = document.createElementNS(svgNS, "rect");
      expRect.setAttribute("x", gx + 3);
      expRect.setAttribute("y", barAreaH - expH + 10);
      expRect.setAttribute("width", barW);
      expRect.setAttribute("height", Math.max(expH, 1));
      expRect.setAttribute("rx", 3);
      expRect.setAttribute("fill", "#ef4444");
      svg.appendChild(expRect);

      const label = document.createElementNS(svgNS, "text");
      label.setAttribute("x", gx);
      label.setAttribute("y", barAreaH + 28);
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("font-size", "11");
      label.setAttribute("fill", "#8b8b95");
      label.textContent = m.label;
      svg.appendChild(label);
    });

    const wrap = document.createElement("div");
    wrap.style.width = "100%";
    wrap.style.overflowX = "auto";
    wrap.appendChild(svg);

    const legend = document.createElement("div");
    legend.className = "legend";
    legend.style.marginTop = "8px";
    legend.innerHTML = `
      <div class="legend-item"><div class="legend-left"><span class="swatch" style="background:#22c55e"></span><span>Tiền vào</span></div></div>
      <div class="legend-item"><div class="legend-left"><span class="swatch" style="background:#ef4444"></span><span>Tiền ra</span></div></div>
    `;

    const outer = document.createElement("div");
    outer.style.width = "100%";
    outer.appendChild(wrap);
    outer.appendChild(legend);

    container.appendChild(outer);
  }

  return { renderPie, renderBar, colorFor };
})();
