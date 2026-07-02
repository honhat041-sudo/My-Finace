// Quản lý công việc hàng ngày: thêm / sửa / xóa / hoàn thành / lọc.
const Tasks = (() => {
  let editingId = null;
  let calendarMonth = currentMonthValue();
  let selectedDate = null;
  const els = {};

  const PRIORITY_LABEL = { high: "Cao", medium: "Trung bình", low: "Thấp" };
  const DOT_COLOR = { high: "#f87171", medium: "#fbbf24", low: "#4ade80" };
  const MONTH_NAMES = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

  function cacheEls() {
    els.form = document.getElementById("taskForm");
    els.id = document.getElementById("taskId");
    els.title = document.getElementById("taskTitle");
    els.due = document.getElementById("taskDue");
    els.priority = document.getElementById("taskPriority");
    els.note = document.getElementById("taskNote");
    els.formTitle = document.getElementById("taskFormTitle");
    els.submitBtn = document.getElementById("taskSubmitBtn");
    els.cancelBtn = document.getElementById("taskCancelBtn");
    els.list = document.getElementById("taskList");
    els.filterStatus = document.getElementById("taskFilterStatus");
    els.dayFilterBadge = document.getElementById("dayFilterBadge");
    els.calendarGrid = document.getElementById("calendarGrid");
    els.calendarTitle = document.getElementById("calendarTitle");
    els.calPrevBtn = document.getElementById("calPrevBtn");
    els.calNextBtn = document.getElementById("calNextBtn");
    els.calTodayBtn = document.getElementById("calTodayBtn");
  }

  // ---------- Lịch dạng lưới (tháng) ----------
  function renderCalendar() {
    const [year, month] = calendarMonth.split("-").map(Number);
    const monthIndex = month - 1;
    const firstDow = new Date(year, monthIndex, 1).getDay();
    const leading = (firstDow + 6) % 7; // lưới bắt đầu từ Thứ 2
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const prevMonthDays = new Date(year, monthIndex, 0).getDate();
    const totalCells = leading + daysInMonth;
    const trailing = (7 - (totalCells % 7)) % 7;

    const tasksByDate = {};
    Store.getTasks().forEach((t) => {
      if (!t.dueDate) return;
      (tasksByDate[t.dueDate] = tasksByDate[t.dueDate] || []).push(t);
    });

    const today = todayISO();
    let cells = "";

    for (let i = 0; i < leading; i++) {
      cells += `<div class="cal-cell outside">${prevMonthDays - leading + 1 + i}</div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayTasks = tasksByDate[dateStr] || [];
      const dots = dayTasks
        .slice(0, 4)
        .map((t) => `<span class="cal-dot" style="background:${DOT_COLOR[t.priority] || DOT_COLOR.medium}"></span>`)
        .join("");
      const classes = ["cal-cell"];
      if (dateStr === today) classes.push("today");
      if (dateStr === selectedDate) classes.push("selected");
      cells += `<button type="button" class="${classes.join(" ")}" data-date="${dateStr}"><span>${d}</span><span class="cal-dots">${dots}</span></button>`;
    }

    for (let i = 1; i <= trailing; i++) {
      cells += `<div class="cal-cell outside">${i}</div>`;
    }

    els.calendarGrid.innerHTML = cells;
    els.calendarTitle.textContent = `${MONTH_NAMES[monthIndex]}, ${year}`;

    els.calendarGrid.querySelectorAll("[data-date]").forEach((btn) => btn.addEventListener("click", () => selectDay(btn.dataset.date)));
  }

  function changeMonth(delta) {
    const [year, month] = calendarMonth.split("-").map(Number);
    const d = new Date(year, month - 1 + delta, 1);
    calendarMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    renderCalendar();
  }

  function goToday() {
    calendarMonth = currentMonthValue();
    renderCalendar();
  }

  function selectDay(dateStr) {
    selectedDate = selectedDate === dateStr ? null : dateStr;
    renderCalendar();
    renderDayFilterBadge();
    renderList();
  }

  function renderDayFilterBadge() {
    if (!selectedDate) {
      els.dayFilterBadge.classList.add("hidden");
      els.dayFilterBadge.innerHTML = "";
      return;
    }
    els.dayFilterBadge.classList.remove("hidden");
    els.dayFilterBadge.innerHTML = `Đang lọc theo ngày ${formatDate(selectedDate)} <button type="button" id="clearDayFilter">✕</button>`;
    document.getElementById("clearDayFilter").addEventListener("click", () => {
      selectedDate = null;
      renderCalendar();
      renderDayFilterBadge();
      renderList();
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function resetForm() {
    editingId = null;
    els.id.value = "";
    els.form.reset();
    els.priority.value = "medium";
    els.formTitle.textContent = "Thêm công việc";
    els.submitBtn.textContent = "Thêm công việc";
    els.cancelBtn.classList.add("hidden");
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!els.title.value.trim()) return;
    const list = Store.getTasks();
    const existing = editingId ? list.find((t) => t.id === editingId) : null;

    const record = {
      id: editingId || Store.uid(),
      title: els.title.value.trim(),
      dueDate: els.due.value || "",
      priority: els.priority.value,
      note: els.note.value.trim(),
      status: existing ? existing.status : "pending",
      createdAt: existing ? existing.createdAt : Date.now(),
      doneAt: existing ? existing.doneAt : null,
    };

    if (editingId) {
      const idx = list.findIndex((t) => t.id === editingId);
      if (idx >= 0) list[idx] = record;
    } else {
      list.push(record);
    }
    Store.setTasks(list);
    resetForm();
    renderList();
    renderCalendar();
    if (window.App) window.App.refreshDashboard();
  }

  function startEdit(id) {
    const t = Store.getTasks().find((x) => x.id === id);
    if (!t) return;
    editingId = id;
    els.id.value = id;
    els.title.value = t.title;
    els.due.value = t.dueDate || "";
    els.priority.value = t.priority;
    els.note.value = t.note || "";
    els.formTitle.textContent = "Sửa công việc";
    els.submitBtn.textContent = "Lưu thay đổi";
    els.cancelBtn.classList.remove("hidden");
    document.getElementById("tab-tasks").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function deleteTask(id) {
    if (!confirm("Xóa công việc này?")) return;
    Store.setTasks(Store.getTasks().filter((t) => t.id !== id));
    renderList();
    renderCalendar();
    if (window.App) window.App.refreshDashboard();
  }

  function toggleDone(id) {
    const list = Store.getTasks();
    const t = list.find((x) => x.id === id);
    if (!t) return;
    t.status = t.status === "done" ? "pending" : "done";
    t.doneAt = t.status === "done" ? Date.now() : null;
    Store.setTasks(list);
    renderList();
    renderCalendar();
    if (window.App) window.App.refreshDashboard();
  }

  function getFiltered() {
    let list = Store.getTasks();
    const status = els.filterStatus.value;
    if (status !== "all") list = list.filter((t) => t.status === status);
    if (selectedDate) list = list.filter((t) => t.dueDate === selectedDate);
    return list.sort((a, b) => {
      if (a.status !== b.status) return a.status === "done" ? 1 : -1;
      const ad = a.dueDate || "9999-12-31";
      const bd = b.dueDate || "9999-12-31";
      if (ad !== bd) return ad < bd ? -1 : 1;
      return b.createdAt - a.createdAt;
    });
  }

  function renderList() {
    const list = getFiltered();
    if (!list.length) {
      els.list.innerHTML = '<div class="empty-state">Không có công việc nào.</div>';
      return;
    }

    const today = todayISO();

    els.list.innerHTML = list
      .map((t) => {
        const overdue = t.status !== "done" && t.dueDate && t.dueDate < today;
        return `
        <div class="task-item ${t.status === "done" ? "done" : ""}">
          <input type="checkbox" ${t.status === "done" ? "checked" : ""} data-toggle="${t.id}" />
          <div class="task-main">
            <div class="task-title">${escapeHtml(t.title)}</div>
            <div class="task-meta">
              ${t.dueDate ? `<span>📅 ${formatDate(t.dueDate)}</span>` : ""}
              <span class="badge priority-${t.priority}">${PRIORITY_LABEL[t.priority]}</span>
              ${overdue ? `<span class="badge overdue">Quá hạn</span>` : ""}
            </div>
            ${t.note ? `<div class="task-note">${escapeHtml(t.note)}</div>` : ""}
          </div>
          <div class="row-actions">
            <button class="icon-btn" title="Sửa" data-edit="${t.id}">✏️</button>
            <button class="icon-btn" title="Xóa" data-del="${t.id}">🗑️</button>
          </div>
        </div>`;
      })
      .join("");

    els.list.querySelectorAll("[data-toggle]").forEach((b) => b.addEventListener("change", () => toggleDone(b.dataset.toggle)));
    els.list.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => startEdit(b.dataset.edit)));
    els.list.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => deleteTask(b.dataset.del)));
  }

  function init() {
    cacheEls();
    els.form.addEventListener("submit", handleSubmit);
    els.cancelBtn.addEventListener("click", resetForm);
    els.filterStatus.addEventListener("change", renderList);
    els.calPrevBtn.addEventListener("click", () => changeMonth(-1));
    els.calNextBtn.addEventListener("click", () => changeMonth(1));
    els.calTodayBtn.addEventListener("click", goToday);
    renderCalendar();
    renderDayFilterBadge();
    renderList();
  }

  return {
    init,
    renderList,
    getAll: () => Store.getTasks(),
  };
})();
