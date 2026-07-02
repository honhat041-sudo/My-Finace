// Quản lý thu chi: thêm / sửa / xóa / lọc giao dịch.
const Finance = (() => {
  let editingId = null;

  const els = {};

  function cacheEls() {
    els.form = document.getElementById("txForm");
    els.id = document.getElementById("txId");
    els.typeSeg = document.getElementById("txTypeSeg");
    els.category = document.getElementById("txCategory");
    els.amount = document.getElementById("txAmount");
    els.date = document.getElementById("txDate");
    els.note = document.getElementById("txNote");
    els.formTitle = document.getElementById("txFormTitle");
    els.submitBtn = document.getElementById("txSubmitBtn");
    els.cancelBtn = document.getElementById("txCancelBtn");
    els.table = document.getElementById("txTable");
    els.filterMonth = document.getElementById("txFilterMonth");
    els.filterType = document.getElementById("txFilterType");
    els.filterCategory = document.getElementById("txFilterCategory");
  }

  function currentType() {
    return els.typeSeg.querySelector(".seg-btn.active").dataset.value;
  }

  function refreshCategoryOptions() {
    const cats = Store.getCategories();
    const type = currentType();
    const list = type === "income" ? cats.income : cats.expense;
    const prev = els.category.value;
    els.category.innerHTML = list.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
    if (list.includes(prev)) els.category.value = prev;

    // filter dropdown
    const filterType = els.filterType.value;
    const filterList = filterType === "income" ? cats.income : filterType === "expense" ? cats.expense : [...cats.income, ...cats.expense];
    const prevFilter = els.filterCategory.value;
    els.filterCategory.innerHTML =
      '<option value="all">Tất cả danh mục</option>' + [...new Set(filterList)].map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
    if ([...els.filterCategory.options].some((o) => o.value === prevFilter)) els.filterCategory.value = prevFilter;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function resetForm() {
    editingId = null;
    els.id.value = "";
    els.form.reset();
    setType("income");
    els.date.value = todayISO();
    refreshCategoryOptions();
    els.formTitle.textContent = "Thêm giao dịch";
    els.submitBtn.textContent = "Thêm giao dịch";
    els.cancelBtn.classList.add("hidden");
  }

  function setType(type) {
    [...els.typeSeg.querySelectorAll(".seg-btn")].forEach((b) => b.classList.toggle("active", b.dataset.value === type));
    refreshCategoryOptions();
  }

  function handleSubmit(e) {
    e.preventDefault();
    const list = Store.getTransactions();
    const record = {
      id: editingId || Store.uid(),
      type: currentType(),
      category: els.category.value,
      amount: Number(els.amount.value) || 0,
      date: els.date.value || todayISO(),
      note: els.note.value.trim(),
      createdAt: editingId ? list.find((t) => t.id === editingId)?.createdAt || Date.now() : Date.now(),
    };

    if (editingId) {
      const idx = list.findIndex((t) => t.id === editingId);
      if (idx >= 0) list[idx] = record;
    } else {
      list.push(record);
    }
    Store.setTransactions(list);
    resetForm();
    renderTable();
    if (window.App) window.App.refreshDashboard();
  }

  function startEdit(id) {
    const tx = Store.getTransactions().find((t) => t.id === id);
    if (!tx) return;
    editingId = id;
    els.id.value = id;
    setType(tx.type);
    els.category.value = tx.category;
    els.amount.value = tx.amount;
    els.date.value = tx.date;
    els.note.value = tx.note || "";
    els.formTitle.textContent = "Sửa giao dịch";
    els.submitBtn.textContent = "Lưu thay đổi";
    els.cancelBtn.classList.remove("hidden");
    document.getElementById("tab-finance").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function deleteTx(id) {
    if (!confirm("Xóa giao dịch này?")) return;
    const list = Store.getTransactions().filter((t) => t.id !== id);
    Store.setTransactions(list);
    renderTable();
    if (window.App) window.App.refreshDashboard();
  }

  function getFiltered() {
    let list = Store.getTransactions();
    const month = els.filterMonth.value;
    const type = els.filterType.value;
    const cat = els.filterCategory.value;

    if (month) list = list.filter((t) => t.date && t.date.startsWith(month));
    if (type !== "all") list = list.filter((t) => t.type === type);
    if (cat !== "all") list = list.filter((t) => t.category === cat);

    return list.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt));
  }

  function renderTable() {
    const list = getFiltered();
    if (!list.length) {
      els.table.innerHTML = '<div class="empty-state">Không có giao dịch nào phù hợp bộ lọc.</div>';
      return;
    }

    const rows = list
      .map(
        (t) => `
      <tr>
        <td>${formatDate(t.date)}</td>
        <td>${t.type === "income" ? "Tiền vào" : "Tiền ra"}</td>
        <td>${escapeHtml(t.category)}</td>
        <td class="amount ${t.type}">${t.type === "income" ? "+" : "-"}${formatVND(t.amount)}</td>
        <td>${escapeHtml(t.note || "")}</td>
        <td>
          <div class="row-actions">
            <button class="icon-btn" title="Sửa" data-edit="${t.id}">✏️</button>
            <button class="icon-btn" title="Xóa" data-del="${t.id}">🗑️</button>
          </div>
        </td>
      </tr>`
      )
      .join("");

    els.table.innerHTML = `
      <table>
        <thead>
          <tr><th>Ngày</th><th>Loại</th><th>Danh mục</th><th>Số tiền</th><th>Ghi chú</th><th></th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;

    els.table.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => startEdit(b.dataset.edit)));
    els.table.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => deleteTx(b.dataset.del)));
  }

  function init() {
    cacheEls();
    els.date.value = todayISO();
    els.filterMonth.value = currentMonthValue();

    els.typeSeg.querySelectorAll(".seg-btn").forEach((btn) => {
      btn.addEventListener("click", () => setType(btn.dataset.value));
    });

    els.form.addEventListener("submit", handleSubmit);
    els.cancelBtn.addEventListener("click", resetForm);

    els.filterMonth.addEventListener("change", renderTable);
    els.filterType.addEventListener("change", () => {
      refreshCategoryOptions();
      renderTable();
    });
    els.filterCategory.addEventListener("change", renderTable);

    refreshCategoryOptions();
    renderTable();
  }

  return {
    init,
    renderTable,
    refreshCategoryOptions,
    getAll: () => Store.getTransactions(),
  };
})();
