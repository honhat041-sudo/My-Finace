// Điều phối chung: chuyển tab, dashboard tổng hợp, cài đặt danh mục, export/import.
const App = (() => {
  const els = {};

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function cacheEls() {
    els.tabs = document.querySelectorAll(".tab-btn");
    els.panels = document.querySelectorAll(".tab-panel");
    els.dashboardMonth = document.getElementById("dashboardMonth");
    els.summaryCards = document.getElementById("summaryCards");
    els.expensePie = document.getElementById("expensePie");
    els.trendBar = document.getElementById("trendBar");
    els.taskSummary = document.getElementById("taskSummary");
    els.recentTx = document.getElementById("recentTx");

    els.expenseCatList = document.getElementById("expenseCatList");
    els.incomeCatList = document.getElementById("incomeCatList");
    els.expenseCatForm = document.getElementById("expenseCatForm");
    els.incomeCatForm = document.getElementById("incomeCatForm");
    els.newExpenseCat = document.getElementById("newExpenseCat");
    els.newIncomeCat = document.getElementById("newIncomeCat");

    els.exportBtn = document.getElementById("exportBtn");
    els.importFile = document.getElementById("importFile");
    els.resetBtn = document.getElementById("resetBtn");
  }

  // ---------- Tabs ----------
  function initTabs() {
    els.tabs.forEach((btn) => {
      btn.addEventListener("click", () => {
        els.tabs.forEach((b) => b.classList.toggle("active", b === btn));
        els.panels.forEach((p) => p.classList.toggle("active", p.id === `tab-${btn.dataset.tab}`));
        if (btn.dataset.tab === "dashboard") refreshDashboard();
      });
    });
  }

  // ---------- Dashboard ----------
  function monthTxs(month) {
    return Store.getTransactions().filter((t) => t.date && t.date.startsWith(month));
  }

  function sumByType(list, type) {
    return list.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);
  }

  function renderSummaryCards(month) {
    const list = monthTxs(month);
    const income = sumByType(list, "income");
    const expense = sumByType(list, "expense");
    const balance = income - expense;

    const savingsAmount = list
      .filter((t) => t.type === "expense" && ["Tiết kiệm", "Đầu tư"].includes(t.category))
      .reduce((s, t) => s + t.amount, 0);
    const savingsRate = income > 0 ? ((savingsAmount / income) * 100).toFixed(1) : "0";

    els.summaryCards.innerHTML = `
      <div class="summary-card income">
        <div class="label">Tổng tiền vào</div>
        <div class="value">${formatVND(income)}</div>
      </div>
      <div class="summary-card expense">
        <div class="label">Tổng tiền ra</div>
        <div class="value">${formatVND(expense)}</div>
      </div>
      <div class="summary-card balance">
        <div class="label">Số dư trong tháng</div>
        <div class="value ${balance >= 0 ? "positive" : "negative"}">${formatVND(balance)}</div>
      </div>
      <div class="summary-card">
        <div class="label">Tỷ lệ tiết kiệm + đầu tư</div>
        <div class="value">${savingsRate}%</div>
      </div>
    `;
  }

  function renderExpensePie(month) {
    const list = monthTxs(month).filter((t) => t.type === "expense");
    const byCat = {};
    list.forEach((t) => (byCat[t.category] = (byCat[t.category] || 0) + t.amount));
    const items = Object.entries(byCat)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
    Charts.renderPie(els.expensePie, items);
  }

  function renderTrendBar(month) {
    const [y, m] = month.split("-").map(Number);
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(y, m - 1 - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const list = monthTxs(key);
      months.push({
        label: `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`,
        income: sumByType(list, "income"),
        expense: sumByType(list, "expense"),
      });
    }
    Charts.renderBar(els.trendBar, months);
  }

  function renderTaskSummary() {
    const today = todayISO();
    const tasks = Store.getTasks();
    const dueToday = tasks.filter((t) => t.status !== "done" && t.dueDate === today).length;
    const overdue = tasks.filter((t) => t.status !== "done" && t.dueDate && t.dueDate < today).length;
    const doneToday = tasks.filter((t) => t.status === "done" && t.doneAt && new Date(t.doneAt).toISOString().slice(0, 10) === today).length;
    const pending = tasks.filter((t) => t.status !== "done").length;

    els.taskSummary.innerHTML = `
      <div class="stat"><div class="num">${pending}</div><div class="lbl">Đang chờ</div></div>
      <div class="stat"><div class="num">${dueToday}</div><div class="lbl">Đến hạn hôm nay</div></div>
      <div class="stat"><div class="num">${overdue}</div><div class="lbl">Quá hạn</div></div>
      <div class="stat"><div class="num">${doneToday}</div><div class="lbl">Hoàn thành hôm nay</div></div>
    `;
  }

  function renderRecentTx() {
    const list = Store.getTransactions()
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt))
      .slice(0, 8);

    if (!list.length) {
      els.recentTx.innerHTML = '<div class="empty-state">Chưa có giao dịch nào. Hãy thêm giao dịch đầu tiên ở tab "Thu chi".</div>';
      return;
    }

    const rows = list
      .map(
        (t) => `
      <tr>
        <td>${formatDate(t.date)}</td>
        <td>${escapeHtml(t.category)}</td>
        <td class="amount ${t.type}">${t.type === "income" ? "+" : "-"}${formatVND(t.amount)}</td>
        <td>${escapeHtml(t.note || "")}</td>
      </tr>`
      )
      .join("");

    els.recentTx.innerHTML = `
      <table>
        <thead><tr><th>Ngày</th><th>Danh mục</th><th>Số tiền</th><th>Ghi chú</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  function refreshDashboard() {
    const month = els.dashboardMonth.value || currentMonthValue();
    renderSummaryCards(month);
    renderExpensePie(month);
    renderTrendBar(month);
    renderTaskSummary();
    renderRecentTx();
  }

  function initDashboard() {
    els.dashboardMonth.value = currentMonthValue();
    els.dashboardMonth.addEventListener("change", refreshDashboard);
    refreshDashboard();
  }

  // ---------- Settings: categories ----------
  function renderCategoryChips() {
    const cats = Store.getCategories();

    els.expenseCatList.innerHTML = cats.expense
      .map((c) => `<span class="chip">${escapeHtml(c)}<button data-remove-expense="${escapeHtml(c)}" title="Xóa">✕</button></span>`)
      .join("") || '<span class="muted">Chưa có danh mục nào.</span>';

    els.incomeCatList.innerHTML = cats.income
      .map((c) => `<span class="chip">${escapeHtml(c)}<button data-remove-income="${escapeHtml(c)}" title="Xóa">✕</button></span>`)
      .join("") || '<span class="muted">Chưa có danh mục nào.</span>';

    els.expenseCatList.querySelectorAll("[data-remove-expense]").forEach((b) =>
      b.addEventListener("click", () => removeCategory("expense", b.dataset.removeExpense))
    );
    els.incomeCatList.querySelectorAll("[data-remove-income]").forEach((b) =>
      b.addEventListener("click", () => removeCategory("income", b.dataset.removeIncome))
    );
  }

  function removeCategory(kind, value) {
    if (!confirm(`Xóa danh mục "${value}"? Các giao dịch cũ vẫn giữ nguyên danh mục này.`)) return;
    const cats = Store.getCategories();
    cats[kind] = cats[kind].filter((c) => c !== value);
    Store.setCategories(cats);
    renderCategoryChips();
    Finance.refreshCategoryOptions();
  }

  function addCategory(kind, input) {
    const value = input.value.trim();
    if (!value) return;
    const cats = Store.getCategories();
    if (cats[kind].includes(value)) {
      input.value = "";
      return;
    }
    cats[kind].push(value);
    Store.setCategories(cats);
    input.value = "";
    renderCategoryChips();
    Finance.refreshCategoryOptions();
  }

  function initSettings() {
    renderCategoryChips();

    els.expenseCatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      addCategory("expense", els.newExpenseCat);
    });
    els.incomeCatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      addCategory("income", els.newIncomeCat);
    });

    els.exportBtn.addEventListener("click", () => {
      const data = Store.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quan-ly-ca-nhan-${todayISO()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    els.importFile.addEventListener("change", () => {
      const file = els.importFile.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          Store.importAll(data);
          alert("Nhập dữ liệu thành công!");
          location.reload();
        } catch (err) {
          alert("File không hợp lệ: " + err.message);
        }
      };
      reader.readAsText(file);
      els.importFile.value = "";
    });

    els.resetBtn.addEventListener("click", () => {
      if (!confirm("Xóa TOÀN BỘ dữ liệu thu chi, công việc và danh mục? Hành động này không thể hoàn tác.")) return;
      Store.resetAll();
      location.reload();
    });
  }

  function init() {
    cacheEls();
    initTabs();
    Finance.init();
    Tasks.init();
    initDashboard();
    initSettings();
  }

  return { init, refreshDashboard };
})();

document.addEventListener("DOMContentLoaded", App.init);
