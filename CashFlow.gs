function generateCashFlow() {
  const ss = SpreadsheetApp.getActive();

  const payments = ss.getSheetByName(SHEETS.PAYMENTS).getDataRange().getValues();
  const expenses = ss.getSheetByName(SHEETS.EXPENSES).getDataRange().getValues();

  let cashflow = {};

  payments.slice(1).forEach(row => {
    const date = new Date(row[1]);
    const amount = row[5];

    const month = date.getFullYear() + "-" + (date.getMonth() + 1);

    if (!cashflow[month]) cashflow[month] = { income: 0, expense: 0 };

    cashflow[month].income += amount;
  });

  expenses.slice(1).forEach(row => {
    const date = new Date(row[1]);
    const amount = row[6];

    const month = date.getFullYear() + "-" + (date.getMonth() + 1);

    if (!cashflow[month]) cashflow[month] = { income: 0, expense: 0 };

    cashflow[month].expense += amount;
  });

  Logger.log(cashflow);
}