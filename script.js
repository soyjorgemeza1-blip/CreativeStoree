const STORAGE_KEY = "creativa-money-transactions-v1";
const categoryOptions = {
  income: [
    "Salario",
    "Freelance",
    "Venta",
    "cosas",
    "Inversión",
    "Otro ingreso",
  ],
  expense: [
    "Casa",
    "Comida",
    "Transporte",
    "Entretenimiento",
    "Salud",
    "Educación",
    "Compras",
    "Otros gastos",
  ],
};

const defaultTransactions = [
  { id: 1, description: "Salario mensual", amount: 2500, type: "income", category: "Salario", date: "2026-08-01" },
  { id: 2, description: "Supermercado", amount: 320, type: "expense", category: "Comida", date: "2026-08-04" },
  { id: 3, description: "Alquiler", amount: 900, type: "expense", category: "Casa", date: "2026-08-05" },
  { id: 4, description: "Freelance", amount: 650, type: "income", category: "Freelance", date: "2026-08-08" },
];

const transactionForm = document.getElementById("transactionForm");
const transactionList = document.getElementById("transactionList");
const filterType = document.getElementById("filterType");
const categorySelect = document.getElementById("category");
const typeSelect = document.getElementById("type");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const dateInput = document.getElementById("date");
const resetButton = document.getElementById("resetData");
const resetModal = document.getElementById("resetModal");
const confirmResetButton = document.getElementById("confirmReset");
const cancelResetButton = document.getElementById("cancelReset");
const openCalendarButton = document.getElementById("openCalendar");
const calendarModal = document.getElementById("calendarModal");
const calendarGrid = document.getElementById("calendarGrid");
const calendarTitle = document.getElementById("calendarTitle");
const prevMonthButton = document.getElementById("prevMonth");
const nextMonthButton = document.getElementById("nextMonth");
const selectedDateLabel = document.getElementById("selectedDateLabel");
const selectedDayText = document.getElementById("selectedDayText");

const moneyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
});

let transactions = loadTransactions();
let selectedDate = toISODate(new Date());
let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

function toISODate(date) {
  const normalized = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return normalized.toISOString().split("T")[0];
}

function loadTransactions() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (raw === null) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultTransactions));
    return [...defaultTransactions];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...defaultTransactions];
  } catch (error) {
    console.error("Error al leer guardados:", error);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultTransactions));
    return [...defaultTransactions];
  }
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function getCategoryOptionsFor(type) {
  return categoryOptions[type] || categoryOptions.expense;
}

function updateCategoryOptions(selectedType = typeSelect.value) {
  const options = getCategoryOptionsFor(selectedType);
  categorySelect.innerHTML = options
    .map((category) => `<option value="${category}">${category}</option>`)
    .join("");
}

function formatDate(dateString) {
  const date = new Date(dateString + "T12:00:00");
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function getTotalsForDate(dateString) {
  const dayTransactions = transactions.filter((item) => item.date === dateString);
  const incomes = dayTransactions.filter((item) => item.type === "income").reduce((sum, item) => sum + Number(item.amount), 0);
  const expenses = dayTransactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + Number(item.amount), 0);
  const balance = incomes - expenses;

  return { incomes, expenses, balance, available: balance };
}

function renderSummary() {
  const incomes = transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + Number(item.amount), 0);
  const expenses = transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + Number(item.amount), 0);
  const balance = incomes - expenses;

  document.getElementById("incomeTotal").textContent = moneyFormatter.format(incomes);
  document.getElementById("expenseTotal").textContent = moneyFormatter.format(expenses);
  document.getElementById("totalBalance").textContent = moneyFormatter.format(balance);
  document.getElementById("remainingBudget").textContent = moneyFormatter.format(balance);

  const dayTotals = getTotalsForDate(selectedDate);
  document.getElementById("dayIncome").textContent = moneyFormatter.format(dayTotals.incomes);
  document.getElementById("dayExpense").textContent = moneyFormatter.format(dayTotals.expenses);
  document.getElementById("dayBalance").textContent = moneyFormatter.format(dayTotals.balance);
  document.getElementById("dayAvailable").textContent = moneyFormatter.format(dayTotals.available);

  const formattedDate = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(selectedDate + "T12:00:00"));
  selectedDateLabel.textContent = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  selectedDayText.textContent = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
}

function renderTransactions() {
  const selectedFilter = filterType.value;
  const filteredTransactions = transactions
    .filter((item) => item.date === selectedDate)
    .filter((item) => selectedFilter === "all" || item.type === selectedFilter)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!filteredTransactions.length) {
    transactionList.innerHTML = '<li class="empty-state">No hay movimientos para este día.</li>';
    return;
  }

  transactionList.innerHTML = filteredTransactions
    .map(
      (transaction) => `
        <li class="transaction-item ${transaction.type}">
          <div class="transaction-main">
            <div class="transaction-title">
              <span class="transaction-badge">${transaction.type === "income" ? "+" : "-"}</span>
              <span>${transaction.description}</span>
            </div>
            <div class="transaction-meta">
              <span>${transaction.category}</span>
              <span>•</span>
              <span>${formatDate(transaction.date)}</span>
            </div>
          </div>

          <div class="transaction-side">
            <span class="transaction-amount">${transaction.type === "income" ? "+" : "-"}${moneyFormatter.format(transaction.amount)}</span>
            <button class="delete-button" type="button" data-id="${transaction.id}">Eliminar</button>
          </div>
        </li>
      `,
    )
    .join("");
}

function renderCategorySummary() {
  const expenseSummary = transactions
    .filter((item) => item.type === "expense")
    .reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + Number(item.amount);
      return acc;
    }, {});

  const categoryEntries = Object.entries(expenseSummary).sort((a, b) => b[1] - a[1]);
  const maxValue = categoryEntries.length ? Math.max(...categoryEntries.map(([, value]) => value)) : 1;

  const summaryContainer = document.getElementById("categorySummary");

  if (!categoryEntries.length) {
    summaryContainer.innerHTML = '<div class="empty-state">Todavía no hay gastos registrados.</div>';
    return;
  }

  summaryContainer.innerHTML = categoryEntries
    .map(([category, value]) => `
      <div class="category-item">
        <div class="category-label">
          <span>${category}</span>
          <strong>${moneyFormatter.format(value)}</strong>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${(value / maxValue) * 100}%"></div>
        </div>
      </div>
    `)
    .join("");
}

function renderCalendar() {
  calendarTitle.textContent = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(calendarMonth);

  const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - firstDay.getDay());

  const cells = [];

  for (let index = 0; index < 42; index += 1) {
    const cellDate = new Date(startDate);
    cellDate.setDate(startDate.getDate() + index);
    const isoDate = toISODate(cellDate);
    const inMonth = cellDate.getMonth() === calendarMonth.getMonth();
    const selected = isoDate === selectedDate;
    const hasData = transactions.some((item) => item.date === isoDate);

    cells.push(`
      <button
        type="button"
        class="calendar-day ${inMonth ? "" : "other-month"} ${selected ? "selected" : ""} ${hasData ? "has-data" : ""}"
        data-date="${isoDate}"
        aria-label="Seleccionar fecha ${isoDate}"
      >
        ${cellDate.getDate()}
      </button>
    `);
  }

  calendarGrid.innerHTML = cells.join("");
}

function renderApp() {
  renderSummary();
  renderTransactions();
  renderCategorySummary();
  renderCalendar();
}

function openResetModal() {
  resetModal.classList.remove("hidden");
  resetModal.setAttribute("aria-hidden", "false");
}

function closeResetModal() {
  resetModal.classList.add("hidden");
  resetModal.setAttribute("aria-hidden", "true");
}

function resetAppData() {
  transactions = [];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  closeResetModal();
  renderApp();
}

transactionForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const description = descriptionInput.value.trim();
  const amount = Number(amountInput.value);
  const type = typeSelect.value;
  const category = categorySelect.value;
  const date = dateInput.value;

  if (!description || !amount || !date) {
    window.alert("Completa todos los campos antes de guardar.");
    return;
  }

  transactions.push({
    id: Date.now(),
    description,
    amount,
    type,
    category,
    date,
  });

  selectedDate = date;
  calendarMonth = new Date(date + "T12:00:00");
  saveTransactions();
  renderApp();
  transactionForm.reset();
  dateInput.value = toISODate(new Date());
  typeSelect.value = "income";
  updateCategoryOptions("income");
  descriptionInput.focus();
});

filterType.addEventListener("change", renderTransactions);

typeSelect.addEventListener("change", (event) => {
  updateCategoryOptions(event.target.value);
});

transactionList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-id]");
  if (!button) return;

  const { id } = button.dataset;
  const itemId = Number(id);
  transactions = transactions.filter((item) => item.id !== itemId);
  saveTransactions();
  renderApp();
});

resetButton.addEventListener("click", openResetModal);
cancelResetButton.addEventListener("click", closeResetModal);
confirmResetButton.addEventListener("click", resetAppData);
resetModal.addEventListener("click", (event) => {
  if (event.target.dataset.close === "true") {
    closeResetModal();
  }
});

openCalendarButton.addEventListener("click", () => {
  calendarModal.classList.remove("hidden");
  calendarModal.setAttribute("aria-hidden", "false");
});

calendarModal.addEventListener("click", (event) => {
  if (event.target.dataset.close === "true") {
    calendarModal.classList.add("hidden");
    calendarModal.setAttribute("aria-hidden", "true");
  }
});

calendarGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-date]");
  if (!button) return;

  selectedDate = button.dataset.date;
  calendarMonth = new Date(selectedDate + "T12:00:00");
  calendarModal.classList.add("hidden");
  calendarModal.setAttribute("aria-hidden", "true");
  renderApp();
});

prevMonthButton.addEventListener("click", () => {
  calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
  renderCalendar();
});

nextMonthButton.addEventListener("click", () => {
  calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
  renderCalendar();
});

setInterval(() => {
  const now = new Date();
  const currentDay = toISODate(now);
  if (currentDay !== selectedDate) {
    selectedDate = currentDay;
    calendarMonth = new Date(currentDay + "T12:00:00");
    renderApp();
  }
}, 60000);

const today = toISODate(new Date());
selectedDate = today;
calendarMonth = new Date(today + "T12:00:00");
dateInput.value = today;
updateCategoryOptions("income");
renderApp();
