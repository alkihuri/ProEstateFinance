function updateDashboard() {
  getProjectOverview();
  getSalesStats();
  getExpenseStats();
  getCashStats();
  getProfitStats();
}


// PROJECT OVERVIEW

function getProjectOverview() {
  const ss = SpreadsheetApp.getActive();
  const projects = ss.getSheetByName(SHEETS.PROJECTS).getDataRange().getValues();

  let total = projects.length - 1;
  let active = 0;
  let completed = 0;

  projects.slice(1).forEach(row => {
    const status = row[2];

    if (status === "Construction") active++;
    if (status === "Completed") completed++;
  });

  const dashboard = ss.getSheetByName(SHEETS.DASHBOARD);

  dashboard.getRange("B2").setValue(total);
  dashboard.getRange("B3").setValue(active);
  dashboard.getRange("B4").setValue(completed);
}



// SALES & CLIENTS

function getSalesStats() {
  const ss = SpreadsheetApp.getActive();

  const sales = ss.getSheetByName(SHEETS.SALES).getDataRange().getValues();
  const payments = ss.getSheetByName(SHEETS.PAYMENTS).getDataRange().getValues();

  let totalSales = 0;
  let totalReceived = 0;

  sales.slice(1).forEach(row => {
    totalSales += Number(row[4]) || 0;
  });

  payments.slice(1).forEach(row => {
    totalReceived += Number(row[5]) || 0;
  });

  const dashboard = ss.getSheetByName(SHEETS.DASHBOARD);

  dashboard.getRange("B7").setValue(totalSales);
  dashboard.getRange("B8").setValue(totalReceived);
  dashboard.getRange("B9").setValue(totalSales - totalReceived);
}



// EXPENSES & CONTRACTS

function getExpenseStats() {
  const ss = SpreadsheetApp.getActive();

  const budget = ss.getSheetByName(SHEETS.BUDGET).getDataRange().getValues();
  const contracts = ss.getSheetByName(SHEETS.CONTRACTS).getDataRange().getValues();
  const expenses = ss.getSheetByName(SHEETS.EXPENSES).getDataRange().getValues();

  let totalBudget = 0;
  let totalContracts = 0;
  let totalPaid = 0;

  budget.slice(1).forEach(row => totalBudget += Number(row[8]) || 0);
  contracts.slice(1).forEach(row => totalContracts += Number(row[4]) || 0);
  expenses.slice(1).forEach(row => totalPaid += Number(row[6]) || 0);

  const dashboard = ss.getSheetByName(SHEETS.DASHBOARD);

  dashboard.getRange("B12").setValue(totalBudget);
  dashboard.getRange("B13").setValue(totalContracts);
  dashboard.getRange("B14").setValue(totalPaid);
  dashboard.getRange("B15").setValue(totalBudget - totalPaid);
}



// CASH POSITION

function getCashStats() {
  const ss = SpreadsheetApp.getActive();

  const bank = ss.getSheetByName(SHEETS.BANK).getDataRange().getValues();
  const sales = ss.getSheetByName(SHEETS.SALES).getDataRange().getValues();
  const payments = ss.getSheetByName(SHEETS.PAYMENTS).getDataRange().getValues();
  const contracts = ss.getSheetByName(SHEETS.CONTRACTS).getDataRange().getValues();
  const expenses = ss.getSheetByName(SHEETS.EXPENSES).getDataRange().getValues();

  let cash = 0;
  let totalSales = 0;
  let received = 0;
  let totalContracts = 0;
  let paid = 0;

  bank.slice(1).forEach(row => cash += Number(row[4]) || 0);
  sales.slice(1).forEach(row => totalSales += Number(row[4]) || 0);
  payments.slice(1).forEach(row => received += Number(row[5]) || 0);
  contracts.slice(1).forEach(row => totalContracts += Number(row[4]) || 0);
  expenses.slice(1).forEach(row => paid += Number(row[6]) || 0);

  const dashboard = ss.getSheetByName(SHEETS.DASHBOARD);

  dashboard.getRange("B18").setValue(cash);
  dashboard.getRange("B19").setValue(totalSales - received);
  dashboard.getRange("B20").setValue(totalContracts - paid);
  dashboard.getRange("B21").setValue(cash + received - paid);
}



// PROFITABILITY

function getProfitStats() {
  const ss = SpreadsheetApp.getActive();

  const dashboard = ss.getSheetByName(SHEETS.DASHBOARD);

  const revenue = dashboard.getRange("B7").getValue();
  const expenses = dashboard.getRange("B14").getValue();

  const profit = revenue - expenses;

  dashboard.getRange("B24").setValue(revenue);
  dashboard.getRange("B25").setValue(expenses);
  dashboard.getRange("B26").setValue(profit);

  if (expenses > 0) {
    dashboard.getRange("B27").setValue(profit / expenses);
  }
}