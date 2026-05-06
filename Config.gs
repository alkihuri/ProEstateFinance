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
  PAYMENT_ALLOCATION: "Payment Allocations",   
  CONTRACT_BURN : "Contract Burn",
  PAYMENT_SCHEDULE :"Payment Schedule",
  AGING : "Aging",
  BUDJET_VARIANCE : "Budget Variance"
};

// =========================
// КОНСТАНТЫ
// =========================

const VAT_RATE = 21 / 121;          // ставка НДС (21/121 от суммы с НДС)
const PAID_STATUS = "Paid";          // статус оплаченного расхода
const CONFIRMED_YES = "Yes";         // строковое значение подтверждения платежа
const SIGNED_STATUSES = ["Signed", "Closed"];   // статусы активных сделок
const ACTIVE_PROJECT_STATUSES = ["Construction", "Active", "Pause"]; // все рабочие статусы проекта

// Constants.gs или в начале основного файла
const COLS = {
  PROJECTS: {
    SELLABLE_AREA: 7,     // или индекс столбца, где находится Sellable Area
    PLANNED_BUDGET: 5     // индекс столбца Planned Budget
  },
  EXPENSES: {
    STATUS: 7,            // индекс столбца Status
    AMOUNT: 6             // индекс столбца Amount
  },
  SALES: {
    STATUS: 8,            // индекс столбца Status
    PRICE: 4              // индекс столбца Price
  },
  CONTRACTS:
  {
    REMAINING : 6
  }
};
