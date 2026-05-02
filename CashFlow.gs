function generateCashFlow() {
  const ss = SpreadsheetApp.getActive();

  const paymentsSheet = ss.getSheetByName(SHEETS.PAYMENTS);
  const expensesSheet = ss.getSheetByName(SHEETS.EXPENSES);
  const cfSheet = ss.getSheetByName(SHEETS.CASHFLOW);

  const payments = paymentsSheet.getDataRange().getValues();
  const expenses = expensesSheet.getDataRange().getValues();

  let cashflow = {};

  // =========================
  // INFLOWS (CLIENT PAYMENTS)
  // =========================
  payments.slice(1).forEach(row => {
    const date = row[1];
    const amount = Number(row[5]) || 0;
    const confirmed = row[8]; // ✅ FIX: confirmed в колонке 8 (не 9!)

    // ❗ ФИЛЬТР: только подтвержденные платежи
    if (!(confirmed === true || confirmed === "Yes")) return;

    if (!date || amount === 0) return;

    const d = new Date(date);
    if (isNaN(d)) return;

    const month = formatMonth(d);

    if (!cashflow[month]) {
      cashflow[month] = { income: 0, expense: 0 };
    }

    cashflow[month].income += amount;
  });

  // =========================
  // OUTFLOWS (EXPENSES)
  // =========================
  expenses.slice(1).forEach(row => {
    const date = row[8];     // Payment Date
    const amount = Number(row[6]) || 0;
    const status = row[7];   // Status

    // ❗ ФИЛЬТР: только реально оплаченные
    if (status !== "Paid") return;

    if (!date || amount === 0) return;

    const d = new Date(date);
    if (isNaN(d)) return;

    const month = formatMonth(d);

    if (!cashflow[month]) {
      cashflow[month] = { income: 0, expense: 0 };
    }

    cashflow[month].expense += amount;
  });

  // =========================
  // SORT MONTHS
  // =========================
  const months = Object.keys(cashflow).sort();

  // =========================
  // BUILD TABLE
  // =========================
  let result = [["Month", "Opening", "Income", "Expense", "Net", "Closing","Verifying"]];

  let balance = 0;

  months.forEach(month => {
    const income = cashflow[month].income;
    const expense = cashflow[month].expense;
    const net = income - expense;

    const opening = balance;
    const closing = opening + net;

    var confirmed = (opening + income-expense) == closing; // VERIFYING LOGIC

    result.push([month, opening, income, expense, net, closing,confirmed]);

    balance = closing;
  });

  // =========================
  // WRITE TO SHEET
  // =========================
  cfSheet.clearContents(); // ❗ лучше чем clear()
  cfSheet.getRange(1, 1, result.length, result[0].length).setValues(result);
}

// ===== Helper =====
function formatMonth(date) {
  const y = date.getFullYear();
  const m = ("0" + (date.getMonth() + 1)).slice(-2);
  return `${y}-${m}`;
}