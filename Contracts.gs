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
    const paymentDate = Date(row[7])
    const status = row[7];

    // только оплаченные
    if (status !== "Paid") return;
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
    const contractAmount = Number(row[4]) || 0;

    const paid = contractPayments[contractId] || 0;
    const remaining = contractAmount - paid;

    let percent = 0;
    if (contractAmount > 0) {
      percent = paid / contractAmount;
    }

    var status = percent >= 1.0;

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