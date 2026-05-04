const SHEETS = {
  PROJECTS: "Projects",
  UNITS: "Units",
  CLIENTS: "Clients",
  SALES: "Sales",
  PAYMENTS: "Client Payments",
  BUDGET: "Budget",
  CONTRACTORS: "Contractors",
  CONTRACTS: "Contracts",
  EXPENSES: "Expenses",
  BANK: "Bank Accounts",
  CASHFLOW: "Cash Flow",
  DASHBOARD: "Dashboard",
  VAT: "VAT",
  RECEIVABLES: "Receivables",
  PAYMENT_ALLOCATION: "Payment Allocations"  // FIX BUG-06: исправлена опечатка PAYMANET → PAYMENT
};

// =========================
// КОНСТАНТЫ
// =========================

const VAT_RATE = 21 / 121;          // ставка НДС (21/121 от суммы с НДС)
const PAID_STATUS = "Paid";          // статус оплаченного расхода
const CONFIRMED_YES = "Yes";         // строковое значение подтверждения платежа
const SIGNED_STATUSES = ["Signed", "Closed"];   // статусы активных сделок
const ACTIVE_PROJECT_STATUSES = ["Construction", "Active", "Pause"]; // все рабочие статусы проекта