function updateDashboard() {
  // Главный оркестратор — порядок важен
  getProjectOverview();
  getSalesStats();
  getExpenseStats();
  getCashStats();
  getProfitStats();
  getVATStats();
  getCommittedCostStats();  // BUG-12 FIX: вызываем здесь, чтобы B33-B36 обновлялись при любом вызове updateDashboard()
}


// =========================
// PROJECT OVERVIEW
// =========================

function getProjectOverview() {
  const ss = SpreadsheetApp.getActive();
  const projects = ss.getSheetByName(SHEETS.PROJECTS).getDataRange().getValues();

  let total = projects.length - 1;
  let active = 0;
  let completed = 0;

  projects.slice(1).forEach(row => {
    const status = row[2];

    // Используем ACTIVE_PROJECT_STATUSES из Config.gs (включает "Pause", "Construction", "Active")
    if (ACTIVE_PROJECT_STATUSES.includes(status)) active++;
    if (status === "Completed") completed++;
  });

  const dashboard = ss.getSheetByName(SHEETS.DASHBOARD);

  dashboard.getRange("B2").setValue(total);
  dashboard.getRange("B3").setValue(active);
  dashboard.getRange("B4").setValue(completed);
}



// =========================
// SALES & CLIENTS
// =========================

function getSalesStats() {
  const ss = SpreadsheetApp.getActive();

  const sales = ss.getSheetByName(SHEETS.SALES).getDataRange().getValues();
  const payments = ss.getSheetByName(SHEETS.PAYMENTS).getDataRange().getValues();

  let totalSales = 0;
  let totalReceived = 0;

  // 👉 Revenue (contracted sales)
  sales.slice(1).forEach(row => {
    const price = Number(row[4]) || 0;
    const status = row[8];

    // считаем только подписанные сделки
    if (status === "Signed" || status === "Closed") {
      totalSales += price;
    }
  });

  // 👉 Cash received (ВАЖНО: только confirmed)
  payments.slice(1).forEach(row => {
    const amount = Number(row[5]) || 0;
    const confirmed = row[8];

    if (confirmed === true || confirmed === CONFIRMED_YES) {
      totalReceived += amount;
    }
  });

  const dashboard = ss.getSheetByName(SHEETS.DASHBOARD);

  dashboard.getRange("B7").setValue(totalSales);        // Revenue
  dashboard.getRange("B8").setValue(totalReceived);     // Cash received
  dashboard.getRange("B9").setValue(totalSales - totalReceived); // Receivables
}



// =========================
// EXPENSES & CONTRACTS
// =========================

function getExpenseStats() {
  const ss = SpreadsheetApp.getActive();

  const budget = ss.getSheetByName(SHEETS.BUDGET).getDataRange().getValues();
  const contracts = ss.getSheetByName(SHEETS.CONTRACTS).getDataRange().getValues();
  const expenses = ss.getSheetByName(SHEETS.EXPENSES).getDataRange().getValues();

  let totalBudget = 0;
  let totalContracts = 0;
  let totalPaid = 0;

  // Budget (факт)
  budget.slice(1).forEach(row => {
    totalBudget += Number(row[7]) || 0;
  });

  // Contracts (обязательства)
  contracts.slice(1).forEach(row => {
    totalContracts += Number(row[4]) || 0;
  });

  // Paid expenses (ВАЖНО: только оплаченные)
  expenses.slice(1).forEach(row => {
    const amount = Number(row[6]) || 0;
    const status = row[7];

    if (status === PAID_STATUS) {
      totalPaid += amount;
    }
  });

  const dashboard = ss.getSheetByName(SHEETS.DASHBOARD);

  dashboard.getRange("B12").setValue(totalBudget);
  dashboard.getRange("B13").setValue(totalContracts);
  dashboard.getRange("B14").setValue(totalPaid);
  dashboard.getRange("B15").setValue(totalBudget - totalPaid);
}



// =========================
// CASH POSITION
// =========================

function getCashStats() {
  const ss = SpreadsheetApp.getActive();

  const bank = ss.getSheetByName(SHEETS.BANK).getDataRange().getValues();
  const payments = ss.getSheetByName(SHEETS.PAYMENTS).getDataRange().getValues();
  const expenses = ss.getSheetByName(SHEETS.EXPENSES).getDataRange().getValues();

  let cash = 0;
  let received = 0;
  let paid = 0;

  // Остатки на счетах
  bank.slice(1).forEach(row => {
    cash += Number(row[4]) || 0;
  });

  // Полученные деньги
  payments.slice(1).forEach(row => {
    const amount = Number(row[5]) || 0;
    const confirmed = row[8];

    if (confirmed === true || confirmed === CONFIRMED_YES) {
      received += amount;
    }
  });

  // Выплаты
  expenses.slice(1).forEach(row => {
    const amount = Number(row[6]) || 0;
    const status = row[7];

    if (status === PAID_STATUS) {
      paid += amount;
    }
  });

  const dashboard = ss.getSheetByName(SHEETS.DASHBOARD);

  dashboard.getRange("B18").setValue(cash);           // текущий баланс
  dashboard.getRange("B19").setValue(received);       // inflow
  dashboard.getRange("B20").setValue(paid);           // outflow
  dashboard.getRange("B21").setValue(cash);           // net cash (реальный)
}



// =========================
// PROFITABILITY (ИСПРАВЛЕНО)
// =========================

function getProfitStats() {
  const ss = SpreadsheetApp.getActive();
  const dashboard = ss.getSheetByName(SHEETS.DASHBOARD);

  const revenue = dashboard.getRange("B7").getValue();   // Sales
  const expenses = dashboard.getRange("B14").getValue(); // Paid expenses

  const profit = revenue - expenses;

  dashboard.getRange("B24").setValue(revenue);
  dashboard.getRange("B25").setValue(expenses);
  dashboard.getRange("B26").setValue(profit);

  // ❗ ИСПРАВЛЕНИЕ: ROI теперь считается правильно
  const projects = ss.getSheetByName(SHEETS.PROJECTS).getDataRange().getValues();

  let totalInvestment = 0;
  projects.slice(1).forEach(row => {
    totalInvestment += Number(row[5]) || 0;
  });

  if (totalInvestment > 0) {
    dashboard.getRange("B27").setValue(profit / totalInvestment);
  }
}



// =========================
// VAT
// =========================

function getVATStats() {
  const ss = SpreadsheetApp.getActive();
  const vat = ss.getSheetByName(SHEETS.VAT).getDataRange().getValues();

  let incoming = 0;
  let outgoing = 0;
  let payable = 0;

  vat.slice(1).forEach(row => {
    incoming += Number(row[2]) || 0;
    outgoing += Number(row[3]) || 0;
    payable += Number(row[4]) || 0;
  });

  const dashboard = ss.getSheetByName(SHEETS.DASHBOARD);

  dashboard.getRange("B30").setValue(incoming);
  dashboard.getRange("B31").setValue(outgoing);
  dashboard.getRange("B32").setValue(payable);
}

function getCommittedCostStats() {
  const ss = SpreadsheetApp.getActive();

  const contracts = ss.getSheetByName(SHEETS.CONTRACTS).getDataRange().getValues();
  const budget = ss.getSheetByName(SHEETS.BUDGET).getDataRange().getValues();

  let totalContracts = 0;
  let totalPaid = 0;
  let totalRemaining = 0;
  let totalBudget = 0;

  // =========================
  // Contracts
  // =========================
  contracts.slice(1).forEach(row => {
    const amount = Number(row[4]) || 0;
    const paid = Number(row[5]) || 0;
    const remaining = Number(row[6]) || 0;

    totalContracts += amount;
    totalPaid += paid;
    totalRemaining += remaining;
  });

  // =========================
  // Budget
  // =========================
  budget.slice(1).forEach(row => {
    totalBudget += Number(row[7]) || 0;
  });

  const dashboard = ss.getSheetByName(SHEETS.DASHBOARD);

  dashboard.getRange("B33").setValue(totalContracts);
  dashboard.getRange("B34").setValue(totalPaid);
  dashboard.getRange("B35").setValue(totalRemaining);

  if (totalBudget > 0) {
    dashboard.getRange("B36").setValue(totalContracts / totalBudget);
  }
}