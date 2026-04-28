function generateCashFlow() {
  const ss = SpreadsheetApp.getActive();

  const paymentsSheet = ss.getSheetByName(SHEETS.PAYMENTS);
  const expensesSheet = ss.getSheetByName(SHEETS.EXPENSES);
  const cfSheet = ss.getSheetByName(SHEETS.CASHFLOW);

  const payments = paymentsSheet.getDataRange().getValues();
  const expenses = expensesSheet.getDataRange().getValues();

  let cashflow = {};

  // ===== Поступления =====
  payments.slice(1).forEach(row => {
    const date = row[1];
    const amount = Number(row[5]);
    const confirmed = row[9]; // "да/нет"
 

    const d = new Date(date);
    if (isNaN(d)) return;

    const month = formatMonth(d);

    if (!cashflow[month]) cashflow[month] = { income: 0, expense: 0 };

    cashflow[month].income += amount;
  });

  // ===== Расходы =====
  expenses.slice(1).forEach(row => {
    const date = row[8];
    const amount = Number(row[6]);
    const status = row[7]; // статус

    //if (!date || status !== "Verified") return;

    const d = new Date(date);
    if (isNaN(d)) return;

    const month = formatMonth(d);

    if (!cashflow[month]) cashflow[month] = { income: 0, expense: 0 };

    cashflow[month].expense += amount;
  });

  // ===== Сортировка месяцев =====
  const months = Object.keys(cashflow).sort();

// ===== Generating a table =====
let result = [["Month", "Opening", "Income", "Expense", "Net", "Closing"]];

  let balance = 0;

  months.forEach(month => {
    const income = cashflow[month].income;
    const expense = cashflow[month].expense;
    const net = income - expense;

    const start = balance;
    const end = start + net;

    result.push([month, start, income, expense, net, end]);

    balance = end;
  });

  // ===== Запись в таблицу =====
  cfSheet.clear();
  cfSheet.getRange(1, 1, result.length, result[0].length).setValues(result);
}

// ===== Helper =====
function formatMonth(date) {
  const y = date.getFullYear();
  const m = ("0" + (date.getMonth() + 1)).slice(-2);
  return `${y}-${m}`;
}