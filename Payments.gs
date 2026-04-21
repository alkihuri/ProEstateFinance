function allocatePayments() {
  const ss = SpreadsheetApp.getActive();
  const paymentsSheet = ss.getSheetByName(SHEETS.PAYMENTS);
  const salesSheet = ss.getSheetByName(SHEETS.SALES);

  const payments = paymentsSheet.getDataRange().getValues();
  const sales = salesSheet.getDataRange().getValues();

  for (let i = 1; i < payments.length; i++) {
    const client = payments[i][2];
    const project = payments[i][3];
    const amount = payments[i][5];

    for (let j = 1; j < sales.length; j++) {
      const saleClient = sales[j][1];
      const saleProject = sales[j][2];

      if (client === saleClient && project === saleProject) {
        // логика распределения
      }
    }
  }
}