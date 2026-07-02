// Điều phối chung: chuyển tab, dashboard tổng hợp, cài đặt danh mục, export/import.
const App = (() => {
  const els = {};

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function cacheEls() {
    els.tabs = document.querySelectorAll(".nav-btn");
    els.panels = document.querySelectorAll(".tab-panel");
    els.pageTitle = document.getElementById("pageTitle");
    els.dashViewSeg = document.getElementById("dashViewSeg");
    els.dashboardMonth = document.getElementById("dashboardMonth");
    els.dashboardYear = document.getElementById("dashboardYear");
    els.summaryCards = document.getElementById("summaryCards");
    els.expensePie = document.getElementById("expensePie");
    els.trendBar = document.getElementById("trendBar");
    els.trendTitle = document.getElementById("trendTitle");
    els.taskSummary = document.getElementById("taskSummary");
    els.recentTx = document.getElementById("recentTx");

    els.expenseCatList = document.getElementById("expenseCatList");
    els.incomeCatList = document.getElementById("incomeCatList");
    els.expenseCatForm = document.getElementById("expenseCatForm");
    els.incomeCatForm = document.getElementById("incomeCatForm");
    els.newExpenseCat = document.getElementById("newExpenseCat");
    els.newIncomeCat = document.getElementById("newIncomeCat");
    els.budgetList = document.getElementById("budgetList");
    els.budgetCard = document.getElementById("budgetCard");
    els.budgetProgress = document.getElementById("budgetProgress");

    els.exportBtn = document.getElementById("exportBtn");
    els.importFile = document.getElementById("importFile");
    els.resetBtn = document.getElementById("resetBtn");

    els.backupBanner = document.getElementById("backupBanner");
    els.backupBannerText = document.getElementById("backupBannerText");
    els.backupNowBtn = document.getElementById("backupNowBtn");
    els.backupSnoozeBtn = document.getElementById("backupSnoozeBtn");
  }

  // ---------- Nhắc backup dữ liệu ----------
  const BACKUP_REMIND_DAYS = 7;
  const BACKUP_SNOOZE_DAYS = 3;
  const DAY_MS = 24 * 60 * 60 * 1000;

  function checkBackupReminder() {
    const hasData = Store.getTransactions().length > 0 || Store.getTasks().length > 0;
    if (!hasData) {
      els.backupBanner.classList.add("hidden");
      return;
    }

    const meta = Store.getMeta();
    const now = Date.now();

    if (meta.lastBackupPromptAt && now - meta.lastBackupPromptAt < BACKUP_SNOOZE_DAYS * DAY_MS) {
      els.backupBanner.classList.add("hidden");
      return;
    }

    if (!meta.lastBackupAt) {
      els.backupBannerText.textContent = "Bạn chưa từng sao lưu dữ liệu. Nên xuất dữ liệu để tránh mất mát nếu đổi máy hoặc xóa bộ nhớ trình duyệt.";
      els.backupBanner.classList.remove("hidden");
      return;
    }

    const daysSince = Math.floor((now - meta.lastBackupAt) / DAY_MS);
    if (daysSince >= BACKUP_REMIND_DAYS) {
      els.backupBannerText.textContent = `Đã ${daysSince} ngày bạn chưa sao lưu dữ liệu gần đây.`;
      els.backupBanner.classList.remove("hidden");
    } else {
      els.backupBanner.classList.add("hidden");
    }
  }

  function initBackupReminder() {
    els.backupNowBtn.addEventListener("click", doExport);
    els.backupSnoozeBtn.addEventListener("click", () => {
      const meta = Store.getMeta();
      meta.lastBackupPromptAt = Date.now();
      Store.setMeta(meta);
      els.backupBanner.classList.add("hidden");
    });
    checkBackupReminder();
  }

  // ---------- Tabs ----------
  function initTabs() {
    els.tabs.forEach((btn) => {
      btn.addEventListener("click", () => {
        els.tabs.forEach((b) => b.classList.toggle("active", b === btn));
        els.panels.forEach((p) => p.classList.toggle("active", p.id === `tab-${btn.dataset.tab}`));
        els.pageTitle.textContent = btn.dataset.title;
        window.scrollTo({ top: 0, behavior: "instant" });
        if (btn.dataset.tab === "dashboard") refreshDashboard();
      });
    });
  }

  // ---------- Dashboard ----------
  let dashViewMode = "month";

  function monthTxs(month) {
    return Store.getTransactions().filter((t) => t.date && t.date.startsWith(month));
  }

  function yearTxs(year) {
    return Store.getTransactions().filter((t) => t.date && t.date.startsWith(String(year)));
  }

  function sumByType(list, type) {
    return list.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);
  }

  function prevMonthKey(month) {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  function currentPeriod() {
    if (dashViewMode === "year") {
      const year = Number(els.dashboardYear.value || new Date().getFullYear());
      return { list: yearTxs(year), prevList: yearTxs(year - 1), periodLabel: "so với năm trước", year };
    }
    const month = els.dashboardMonth.value || currentMonthValue();
    return { list: monthTxs(month), prevList: monthTxs(prevMonthKey(month)), periodLabel: "so với tháng trước", month };
  }

  function trendBadge(current, previous, periodLabel) {
    if (!previous) return "";
    const diff = ((current - previous) / previous) * 100;
    if (!isFinite(diff) || Math.abs(diff) < 0.05) return `<span class="trend flat">${periodLabel}</span>`;
    const up = diff > 0;
    return `<span class="trend ${up ? "up" : "down"}">${up ? "↑" : "↓"} ${Math.abs(diff).toFixed(1)}% ${periodLabel}</span>`;
  }

  function renderSummaryCards() {
    const { list, prevList, periodLabel } = currentPeriod();
    const income = sumByType(list, "income");
    const expense = sumByType(list, "expense");
    const balance = income - expense;

    const prevIncome = sumByType(prevList, "income");
    const prevExpense = sumByType(prevList, "expense");

    const savingsAmount = list
      .filter((t) => t.type === "expense" && ["Tiết kiệm", "Đầu tư"].includes(t.category))
      .reduce((s, t) => s + t.amount, 0);
    const savingsRate = income > 0 ? ((savingsAmount / income) * 100).toFixed(1) : "0";

    els.summaryCards.innerHTML = `
      <div class="summary-card income">
        <div class="label">Tổng tiền vào</div>
        <div class="value">${formatVND(income)}</div>
        ${trendBadge(income, prevIncome, periodLabel)}
      </div>
      <div class="summary-card expense">
        <div class="label">Tổng tiền ra</div>
        <div class="value">${formatVND(expense)}</div>
        ${trendBadge(expense, prevExpense, periodLabel)}
      </div>
      <div class="summary-card balance">
        <div class="label">${dashViewMode === "year" ? "Số dư trong năm" : "Số dư trong tháng"}</div>
        <div class="value ${balance >= 0 ? "positive" : "negative"}">${formatVND(balance)}</div>
      </div>
      <div class="summary-card">
        <div class="label">Tỷ lệ tiết kiệm + đầu tư</div>
        <div class="value">${savingsRate}%</div>
      </div>
    `;
  }

  function renderExpensePie() {
    const { list } = currentPeriod();
    const byCat = {};
    list
      .filter((t) => t.type === "expense")
      .forEach((t) => (byCat[t.category] = (byCat[t.category] || 0) + t.amount));
    const items = Object.entries(byCat)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
    Charts.renderPie(els.expensePie, items);
  }

  function renderTrendBar() {
    const months = [];

    if (dashViewMode === "year") {
      const year = Number(els.dashboardYear.value || new Date().getFullYear());
      for (let m = 1; m <= 12; m++) {
        const key = `${year}-${String(m).padStart(2, "0")}`;
        const list = monthTxs(key);
        months.push({ label: `T${m}`, income: sumByType(list, "income"), expense: sumByType(list, "expense") });
      }
      els.trendTitle.textContent = `Thu / Chi 12 tháng năm ${year}`;
    } else {
      const month = els.dashboardMonth.value || currentMonthValue();
      const [y, m] = month.split("-").map(Number);
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
      els.trendTitle.textContent = "Thu / Chi 6 tháng gần nhất";
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
    renderSummaryCards();
    renderExpensePie();
    renderTrendBar();
    renderTaskSummary();
    renderRecentTx();
    renderBudgetProgress();
    checkBackupReminder();
  }

  function populateYearSelect() {
    const txYears = Store.getTransactions()
      .map((t) => t.date && t.date.slice(0, 4))
      .filter(Boolean);
    const currentYear = new Date().getFullYear();
    const years = new Set([currentYear, ...txYears.map(Number)]);
    const sorted = [...years].sort((a, b) => b - a);
    els.dashboardYear.innerHTML = sorted.map((y) => `<option value="${y}">${y}</option>`).join("");
    els.dashboardYear.value = currentYear;
  }

  function setDashViewMode(mode) {
    dashViewMode = mode;
    els.dashViewSeg.querySelectorAll(".seg-btn").forEach((b) => b.classList.toggle("active", b.dataset.value === mode));
    els.dashboardMonth.classList.toggle("hidden", mode !== "month");
    els.dashboardYear.classList.toggle("hidden", mode !== "year");
    if (mode === "year") populateYearSelect();
    refreshDashboard();
  }

  function initDashboard() {
    els.dashboardMonth.value = currentMonthValue();
    els.dashboardMonth.addEventListener("change", refreshDashboard);
    els.dashboardYear.addEventListener("change", refreshDashboard);
    els.dashViewSeg.querySelectorAll(".seg-btn").forEach((btn) => {
      btn.addEventListener("click", () => setDashViewMode(btn.dataset.value));
    });
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

  // ---------- Hạn mức chi tiêu ----------
  function renderBudgetSettings() {
    const cats = Store.getCategories();
    const budgets = Store.getBudgets();

    els.budgetList.innerHTML =
      cats.expense
        .map(
          (c) => `
      <div class="budget-row">
        <span class="budget-label">${escapeHtml(c)}</span>
        <input type="number" min="0" step="10000" placeholder="Không giới hạn" data-budget-cat="${escapeHtml(c)}" value="${budgets[c] || ""}" />
      </div>`
        )
        .join("") || '<p class="muted">Chưa có danh mục tiền ra nào.</p>';

    els.budgetList.querySelectorAll("[data-budget-cat]").forEach((input) => {
      input.addEventListener("change", () => {
        const cat = input.dataset.budgetCat;
        const b = Store.getBudgets();
        const val = Number(input.value);
        if (val > 0) b[cat] = val;
        else delete b[cat];
        Store.setBudgets(b);
        refreshDashboard();
      });
    });
  }

  function renderBudgetProgress() {
    const budgets = Store.getBudgets();
    const entries = Object.entries(budgets).filter(([, v]) => v > 0);
    if (!entries.length || dashViewMode === "year") {
      els.budgetCard.classList.add("hidden");
      return;
    }
    els.budgetCard.classList.remove("hidden");
    const month = els.dashboardMonth.value || currentMonthValue();

    const spentByCat = {};
    monthTxs(month)
      .filter((t) => t.type === "expense")
      .forEach((t) => (spentByCat[t.category] = (spentByCat[t.category] || 0) + t.amount));

    els.budgetProgress.innerHTML = entries
      .map(([cat, budget]) => {
        const spent = spentByCat[cat] || 0;
        const pct = Math.round((spent / budget) * 100);
        const state = pct >= 100 ? "over" : pct >= 70 ? "warn" : "ok";
        const noteText = state === "over" ? "· Đã vượt hạn mức" : state === "warn" ? "· Sắp đến hạn mức" : "";
        return `
        <div class="budget-progress-item">
          <div class="budget-progress-head">
            <span class="name">${escapeHtml(cat)}</span>
            <span class="amounts">${formatVND(spent)} / ${formatVND(budget)}</span>
          </div>
          <div class="budget-bar-track"><div class="budget-bar-fill ${state}" style="width:${Math.min(100, pct)}%"></div></div>
          <div class="budget-pct ${state}">${pct}% ${noteText}</div>
        </div>`;
      })
      .join("");
  }

  function removeCategory(kind, value) {
    if (!confirm(`Xóa danh mục "${value}"? Các giao dịch cũ vẫn giữ nguyên danh mục này.`)) return;
    const cats = Store.getCategories();
    cats[kind] = cats[kind].filter((c) => c !== value);
    Store.setCategories(cats);
    renderCategoryChips();
    Finance.refreshCategoryOptions();
    if (kind === "expense") renderBudgetSettings();
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
    if (kind === "expense") renderBudgetSettings();
    Finance.refreshCategoryOptions();
  }

  function doExport() {
    const data = Store.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my-finance-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    const meta = Store.getMeta();
    meta.lastBackupAt = Date.now();
    Store.setMeta(meta);
    checkBackupReminder();
  }

  function initSettings() {
    renderCategoryChips();
    renderBudgetSettings();

    els.expenseCatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      addCategory("expense", els.newExpenseCat);
    });
    els.incomeCatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      addCategory("income", els.newIncomeCat);
    });

    els.exportBtn.addEventListener("click", doExport);

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

  // Cho phép mở app kèm nội dung tin nhắn ngân hàng qua URL, ví dụ:
  // index.html?text=<nội dung SMS đã encode> — dùng cho iOS Shortcuts Automation.
  function handleQuickAdd() {
    const params = new URLSearchParams(location.search);
    const text = params.get("text") || params.get("share_text") || params.get("body");
    if (!text) return;

    const financeBtn = document.querySelector('.nav-btn[data-tab="finance"]');
    if (financeBtn) financeBtn.click();
    Finance.applyBankMessage(text);

    history.replaceState({}, "", location.pathname);
  }

  function init() {
    cacheEls();
    initTabs();
    Finance.init();
    Tasks.init();
    initDashboard();
    initSettings();
    initBackupReminder();
    handleQuickAdd();
  }

  return { init, refreshDashboard };
})();

document.addEventListener("DOMContentLoaded", App.init);
