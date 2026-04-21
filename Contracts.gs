function updateContracts() {
  const ss = SpreadsheetApp.getActive();
  const contracts = ss.getSheetByName(SHEETS.CONTRACTS).getDataRange().getValues();
  const expenses = ss.getSheetByName(SHEETS.EXPENSES).getDataRange().getValues();

  let result = {};

  for (let i = 1; i < contracts.length; i++) {
    const id = contracts[i][0];
    const amount = contracts[i][4];

    result[id] = {
      total: amount,
      paid: 0
    };
  }

  for (let i = 1; i < expenses.length; i++) {
    const contract = expenses[i][4];
    const amount = expenses[i][6];

    if (result[contract]) {
      result[contract].paid += amount;
    }
  }

  Logger.log(result);
}