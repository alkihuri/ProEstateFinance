function updateContracts() {
  const ss = SpreadsheetApp.getActive();

  const contractsSheet = ss.getSheetByName(SHEETS.CONTRACTS);
  const expensesSheet = ss.getSheetByName(SHEETS.EXPENSES);

  const contracts = contractsSheet.getDataRange().getValues();
  const expenses = expensesSheet.getDataRange().getValues();

  // =========================
  // 1. Собираем оплаты по контрактам
  // =========================
  let contractPayments = {};

  expenses.slice(1).forEach(row => {
    const contractId = row[4];
    const amount = Number(row[6]) || 0; 
    const status = row[7];

    // только оплаченные
    if (status !== PAID_STATUS) return;
    if (!contractId) return;

    if (!contractPayments[contractId]) {
      contractPayments[contractId] = 0;
    }

    contractPayments[contractId] += amount;
  });

  // =========================
  // 2. Считаем по каждому контракту
  // =========================
  let result = [];

  for (let i = 1; i < contracts.length; i++) {
    const row = contracts[i];

    const contractId = row[0];
    // BUG-07 FIX: пропускаем пустые строки и строки с ошибками формул (#N/A и т.д.)
    // Пишем пустые значения, чтобы сохранить выравнивание строк
    if (!contractId || String(contractId).startsWith('#')) {
      result.push(['', '', '', '']);
      continue;
    }

    const contractAmount = Number(row[4]) || 0;

    const paid = contractPayments[contractId] || 0;
    const remaining = contractAmount - paid;

    let percent = 0;
    if (contractAmount > 0) {
      percent = paid / contractAmount;
    }

    var status = percent >= 1.0 ? "Completed" : "Active";

    result.push([
      paid,
      remaining,
      percent,
      status
    ]);
  }

  // =========================
  // 3. Запись в лист
  // =========================
  contractsSheet.getRange(2, 6, result.length, 4).setValues(result);
}


function generateContractBurndown() {
  const ss = SpreadsheetApp.getActive();

  const expenses = ss.getSheetByName(SHEETS.EXPENSES).getDataRange().getValues();
  const contracts = ss.getSheetByName(SHEETS.CONTRACTS).getDataRange().getValues();
  const sheet = ss.getSheetByName(SHEETS.CONTRACT_BURN);

  let data = {};
  let contractMap = {};

  // =========================
  // 1. Map contracts
  // =========================
  contracts.slice(1).forEach(row => {
    const id = row[0];

    contractMap[id] = {
      project: row[1],
      amount: Number(row[4]) || 0
    };
  });

  // =========================
  // 2. Expenses aggregation
  // =========================
  expenses.slice(1).forEach(row => {
    const contractId = row[4];
    const amount = Number(row[6]) || 0;
    const status = row[7];
    const date = row[8];

    if (status !== "Paid") return;
    if (!contractId || !date) return;

    const d = new Date(date);
    if (isNaN(d)) return;

    const month = formatMonth(d);

    if (!data[contractId]) data[contractId] = {};
    if (!data[contractId][month]) data[contractId][month] = 0;

    data[contractId][month] += amount;
  });

  // =========================
  // 3. Build table
  // =========================
  let result = [[
    "Month",
    "Contract",
    "Project",
    "Amount",
    "Monthly Paid",
    "Paid To Date",
    "Remaining",
    "% Complete"
  ]];

  Object.keys(data).forEach(contractId => {
    let cumulative = 0;
    const months = Object.keys(data[contractId]).sort();

    months.forEach(month => {
      const monthlyPaid = data[contractId][month];
      cumulative += monthlyPaid;

      const contractAmount = contractMap[contractId]?.amount || 0;
      const remaining = contractAmount - cumulative;

      let percent = 0;
      if (contractAmount > 0) {
        percent = cumulative / contractAmount;
      }

      result.push([
        month,
        contractId,
        contractMap[contractId]?.project || "",
        contractAmount,
        monthlyPaid,
        cumulative,
        remaining,
        percent
      ]);
    });
  });

  // =========================
  // 4. Write
  // =========================
  sheet.clearContents();
  sheet.getRange(1, 1, result.length, result[0].length).setValues(result);
}