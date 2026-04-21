function updateVAT() {
  const ss = SpreadsheetApp.getActive();

  const payments = ss.getSheetByName(SHEETS.PAYMENTS).getDataRange().getValues();
  const expenses = ss.getSheetByName(SHEETS.EXPENSES).getDataRange().getValues();

  const vatSheet = ss.getSheetByName("VAT");

  let monthlyData = {};

  // Incoming VAT (Expenses)

  expenses.slice(1).forEach(row => {
    const date = new Date(row[1]);
    const project = row[2];
    const amount = Number(row[6]) || 0;

    const month = Utilities.formatDate(date, "GMT", "yyyy-MM");

    if (!monthlyData[month]) {
      monthlyData[month] = {};
    }

    if (!monthlyData[month][project]) {
      monthlyData[month][project] = {
        incoming: 0,
        outgoing: 0
      };
    }

    monthlyData[month][project].incoming += amount * 21 / 121;
  });


  // Outgoing VAT (Client Payments)

  payments.slice(1).forEach(row => {
    const date = new Date(row[1]);
    const project = row[2];
    const amount = Number(row[5]) || 0;

    const month = Utilities.formatDate(date, "GMT", "yyyy-MM");

    if (!monthlyData[month]) {
      monthlyData[month] = {};
    }

    if (!monthlyData[month][project]) {
      monthlyData[month][project] = {
        incoming: 0,
        outgoing: 0
      };
    }

    monthlyData[month][project].outgoing += amount * 21 / 121;
  });


  // Write VAT

  let row = 2;
  let cumulative = 0;

  Object.keys(monthlyData).sort().forEach(month => {

    Object.keys(monthlyData[month]).forEach(project => {

      const incoming = monthlyData[month][project].incoming;
      const outgoing = monthlyData[month][project].outgoing;

      const payable = outgoing - incoming;

      cumulative += payable;

      vatSheet.getRange(row,1).setValue(month);
      vatSheet.getRange(row,2).setValue(project);
      vatSheet.getRange(row,3).setValue(incoming);
      vatSheet.getRange(row,4).setValue(outgoing);
      vatSheet.getRange(row,5).setValue(payable);
      vatSheet.getRange(row,6).setValue(cumulative);

      if (payable > 0) {
        vatSheet.getRange(row,7).setValue("Payable");
      } else {
        vatSheet.getRange(row,7).setValue("Refund");
      }

      row++;
    });

  });

}