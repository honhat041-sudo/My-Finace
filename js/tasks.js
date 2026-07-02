// Quản lý công việc hàng ngày: thêm / sửa / xóa / hoàn thành / lọc.
const Tasks = (() => {
  let editingId = null;
  const els = {};

  const PRIORITY_LABEL = { high: "Cao", medium: "Trung bình", low: "Thấp" };

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
    if (window.App) window.App.refreshDashboard();
  }

  function getFiltered() {
    let list = Store.getTasks();
    const status = els.filterStatus.value;
    if (status !== "all") list = list.filter((t) => t.status === status);
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
    renderList();
  }

  return {
    init,
    renderList,
    getAll: () => Store.getTasks(),
  };
})();
