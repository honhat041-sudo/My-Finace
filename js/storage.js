// Lớp lưu trữ dữ liệu: toàn bộ dữ liệu nằm trong localStorage của trình duyệt.
const Store = (() => {
  const KEY_TX = "pfm.transactions";
  const KEY_TASKS = "pfm.tasks";
  const KEY_CATS = "pfm.categories";

  const DEFAULT_CATEGORIES = {
    income: ["Lương", "Thưởng", "Thu nhập khác"],
    expense: ["Tiền nhà", "Tiền ăn uống", "Tiết kiệm", "Đầu tư", "Ăn ngoài", "Chi phí linh tinh khác"],
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.error("Lỗi đọc localStorage:", key, e);
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function getTransactions() {
    return read(KEY_TX, []);
  }

  function setTransactions(list) {
    write(KEY_TX, list);
  }

  function getTasks() {
    return read(KEY_TASKS, []);
  }

  function setTasks(list) {
    write(KEY_TASKS, list);
  }

  function getCategories() {
    const cats = read(KEY_CATS, null);
    if (!cats) {
      write(KEY_CATS, DEFAULT_CATEGORIES);
      return JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
    }
    return cats;
  }

  function setCategories(cats) {
    write(KEY_CATS, cats);
  }

  function exportAll() {
    return {
      app: "quan-ly-ca-nhan",
      version: 1,
      exportedAt: new Date().toISOString(),
      transactions: getTransactions(),
      tasks: getTasks(),
      categories: getCategories(),
    };
  }

  function importAll(data) {
    if (!data || typeof data !== "object") throw new Error("File không hợp lệ");
    if (Array.isArray(data.transactions)) setTransactions(data.transactions);
    if (Array.isArray(data.tasks)) setTasks(data.tasks);
    if (data.categories && typeof data.categories === "object") setCategories(data.categories);
  }

  function resetAll() {
    localStorage.removeItem(KEY_TX);
    localStorage.removeItem(KEY_TASKS);
    localStorage.removeItem(KEY_CATS);
  }

  return {
    uid,
    getTransactions,
    setTransactions,
    getTasks,
    setTasks,
    getCategories,
    setCategories,
    exportAll,
    importAll,
    resetAll,
  };
})();

function formatVND(amount) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(amount || 0);
}

function formatDate(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function currentMonthValue() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
