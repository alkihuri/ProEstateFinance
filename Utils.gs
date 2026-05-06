// BUG-10 FIX: добавлено zero-padding (было "2026-5", стало "2026-05")
// Делегируем к formatMonth() из CashFlow.gs (одна точка форматирования)
function getMonth(date) {
  return formatMonth(date);
}


function findClientValue(searchKey, clientsData, columnIndex) {
  for (let i = 0; i < clientsData.length; i++) {
    if (clientsData[i][0] === searchKey) { // ищем в первом столбце
      return clientsData[i][columnIndex]; // возвращаем значение из нужного столбца
    }
  }
  return "Not found"; // если не найдено
}

function formatFixedWidth(value, width) {
    let str = String(value || "");
    if (str.length > width) str = str.substring(0, width - 3) + "...";
    return str.padEnd(width);
    }




    function checkSheets() {
  const ss = SpreadsheetApp.getActive();
  const sheets = ss.getSheets();
  
  Logger.log("=== Существующие листы ===");
  sheets.forEach(sheet => {
    Logger.log(`- ${sheet.getName()}`);
  });
  
  Logger.log(`\nИщем "${SHEETS.PAYMENT_SCHEDULE}": ${ss.getSheetByName(SHEETS.PAYMENT_SCHEDULE) ? "найден" : "НЕ НАЙДЕН"}`);
  Logger.log(`Ищем "${SHEETS.PAYMENT_ALLOCATION}": ${ss.getSheetByName(SHEETS.PAYMENT_ALLOCATION) ? "найден" : "НЕ НАЙДЕН"}`);
}

function getCostPerSqmStats() {
  const ss = SpreadsheetApp.getActive();

  const projectsSheet = ss.getSheetByName(SHEETS.PROJECTS);
  const expensesSheet = ss.getSheetByName(SHEETS.EXPENSES);
  const salesSheet = ss.getSheetByName(SHEETS.SALES);

  const projects = projectsSheet.getDataRange().getValues();
  const expenses = expensesSheet.getDataRange().getValues();
  const sales = salesSheet.getDataRange().getValues();

  let totalArea = 0;
  let totalBudget = 0;
  let totalPaid = 0;
  let totalRevenue = 0;

  // === Projects ===
  for (let i = 1; i < projects.length; i++) {
    const area = Number(projects[i][COLS.PROJECTS.SELLABLE_AREA]) || 0;
    const budget = Number(projects[i][COLS.PROJECTS.PLANNED_BUDGET]) || 0;

    totalArea += area;
    totalBudget += budget;
  }

  // === Expenses (ONLY PAID) ===
  for (let i = 1; i < expenses.length; i++) {
    const status = expenses[i][COLS.EXPENSES.STATUS];
    const amount = Number(expenses[i][COLS.EXPENSES.AMOUNT]) || 0;

    if (status === PAID_STATUS) {
      totalPaid += amount;
    }
  }

  // === Sales (ONLY SIGNED/CLOSED) ===
  for (let i = 1; i < sales.length; i++) {
    const status = sales[i][COLS.SALES.STATUS];
    const price = Number(sales[i][COLS.SALES.PRICE]) || 0;

    if (SIGNED_STATUSES.includes(status)) {
      totalRevenue += price;
    }
  }

  // === SAFETY ===
  if (totalArea === 0) {
    return {
      actualPerSqm: 0,
      budgetPerSqm: 0,
      salePerSqm: 0,
      marginPerSqm: 0
    };
  }

  // === CALCULATIONS ===
  const actualPerSqm = totalPaid / totalArea;
  const budgetPerSqm = totalBudget / totalArea;
  const salePerSqm = totalRevenue / totalArea;
  const marginPerSqm = salePerSqm - actualPerSqm;

  return {
    actualPerSqm,
    budgetPerSqm,
    salePerSqm,
    marginPerSqm
  };
}

function getCostToComplete() {
  const ss = SpreadsheetApp.getActive();

  const projectsSheet = ss.getSheetByName(SHEETS.PROJECTS);
  const contractsSheet = ss.getSheetByName(SHEETS.CONTRACTS);
  const expensesSheet = ss.getSheetByName(SHEETS.EXPENSES);

  const projects = projectsSheet.getDataRange().getValues();
  const contracts = contractsSheet.getDataRange().getValues();
  const expenses = expensesSheet.getDataRange().getValues();

  let totalBudget = 0;
  let totalPaid = 0;
  let totalRemainingContracts = 0;

  // === Budget ===
  for (let i = 1; i < projects.length; i++) {
    totalBudget += Number(projects[i][COLS.PROJECTS.PLANNED_BUDGET]) || 0;
  }

  // === Paid expenses ===
  for (let i = 1; i < expenses.length; i++) {
    const status = String(expenses[i][COLS.EXPENSES.STATUS]).trim().toLowerCase();
    const amount = Number(expenses[i][COLS.EXPENSES.AMOUNT]) || 0;

    if (status === "paid") {
      totalPaid += amount;
    }
  }

  // === Remaining contracts ===
  for (let i = 1; i < contracts.length; i++) {
    totalRemainingContracts += Number(contracts[i][COLS.CONTRACTS.REMAINING]) || 0;
  }

  const remainingBudget = totalBudget - totalPaid;

  const costToComplete = remainingBudget + totalRemainingContracts;

  return {
    costToComplete,
    remainingBudget,
    remainingContracts: totalRemainingContracts
  };
}