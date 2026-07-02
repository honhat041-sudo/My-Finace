// Giao dịch định kỳ: khai báo khoản cố định hàng tháng, tự thêm vào đúng ngày.
const Recurring = (() => {
  const els = {};

  function cacheEls() {
    els.form = document.getElementById("recurringForm");
    els.typeSeg = document.getElementById("recurringTypeSeg");
    els.category = document.getElementById("recurringCategory");
    els.amount = document.getElementById("recurringAmount");
    els.day = document.getElementById("recurringDay");
    els.note = document.getElementById("recurringNote");
    els.list = document.getElementById("recurringList");
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function currentType() {
    return els.typeSeg.querySelector(".seg-btn.active").dataset.value;
  }

  function setType(type) {
    els.typeSeg.querySelectorAll(".seg-btn").forEach((b) => b.classList.toggle("active", b.dataset.value === type));
    refreshCategoryOptions();
  }

  function refreshCategoryOptions() {
    const cats = Store.getCategories();
    const list = currentType() === "income" ? cats.income : cats.expense;
    els.category.innerHTML = list.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    const rule = {
      id: Store.uid(),
      type: currentType(),
      category: els.category.value,
      amount: Number(els.amount.value) || 0,
      dayOfMonth: Math.min(28, Math.max(1, Number(els.day.value) || 1)),
      note: els.note.value.trim(),
      active: true,
      createdAt: Date.now(),
    };
    const list = Store.getRecurring();
    list.push(rule);
    Store.setRecurring(list);
    els.form.reset();
    setType("expense");
    renderList();
  }

  function toggleActive(id) {
    const list = Store.getRecurring();
    const rule = list.find((r) => r.id === id);
    if (!rule) return;
    rule.active = !rule.active;
    Store.setRecurring(list);
    renderList();
  }

  function deleteRule(id) {
    if (!confirm("Xóa giao dịch định kỳ này? Các giao dịch đã tạo trước đó vẫn được giữ nguyên.")) return;
    Store.setRecurring(Store.getRecurring().filter((r) => r.id !== id));
    renderList();
  }

  function renderList() {
    const list = Store.getRecurring();
    if (!list.length) {
      els.list.innerHTML = '<p class="muted">Chưa có giao dịch định kỳ nào.</p>';
      return;
    }
    els.list.innerHTML = list
      .map(
        (r) => `
      <div class="recurring-item ${r.active ? "" : "inactive"}">
        <div class="recurring-main">
          <div class="recurring-title">${escapeHtml(r.category)} · ${formatVND(r.amount)}</div>
          <div class="recurring-meta">${r.type === "income" ? "Tiền vào" : "Tiền ra"} · Ngày ${r.dayOfMonth} hàng tháng${r.note ? " · " + escapeHtml(r.note) : ""}</div>
        </div>
        <div class="row-actions">
          <button type="button" class="icon-btn" title="${r.active ? "Tạm dừng" : "Kích hoạt"}" data-toggle="${r.id}">${r.active ? "⏸" : "▶"}</button>
          <button type="button" class="icon-btn" title="Xóa" data-del="${r.id}">🗑️</button>
        </div>
      </div>`
      )
      .join("");

    els.list.querySelectorAll("[data-toggle]").forEach((b) => b.addEventListener("click", () => toggleActive(b.dataset.toggle)));
    els.list.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => deleteRule(b.dataset.del)));
  }

  // Kiểm tra các khoản định kỳ đến hạn trong tháng hiện tại, tự thêm giao dịch nếu chưa có.
  // Trả về danh sách mô tả những gì vừa được thêm để hiển thị thông báo.
  function processDue() {
    const today = new Date();
    const day = today.getDate();
    const period = currentMonthValue();
    const rules = Store.getRecurring().filter((r) => r.active);
    if (!rules.length) return [];

    const transactions = Store.getTransactions();
    const added = [];

    rules.forEach((rule) => {
      if (day < rule.dayOfMonth) return;
      const already = transactions.some((t) => t.recurringId === rule.id && t.recurringPeriod === period);
      if (already) return;

      const dateStr = `${period}-${String(rule.dayOfMonth).padStart(2, "0")}`;
      transactions.push({
        id: Store.uid(),
        type: rule.type,
        category: rule.category,
        amount: rule.amount,
        date: dateStr,
        note: rule.note || "Giao dịch định kỳ tự động",
        recurringId: rule.id,
        recurringPeriod: period,
        createdAt: Date.now(),
      });
      added.push(rule.category);
    });

    if (added.length) Store.setTransactions(transactions);
    return added;
  }

  function init() {
    cacheEls();
    els.typeSeg.querySelectorAll(".seg-btn").forEach((btn) => {
      btn.addEventListener("click", () => setType(btn.dataset.value));
    });
    els.form.addEventListener("submit", handleSubmit);
    refreshCategoryOptions();
    renderList();
  }

  return { init, processDue, refreshCategoryOptions, renderList };
})();
