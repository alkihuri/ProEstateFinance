function updateReceivables() {
  const ss = SpreadsheetApp.getActive();

  const sales = ss.getSheetByName(SHEETS.SALES).getDataRange().getValues();
  const payments = ss.getSheetByName(SHEETS.PAYMENTS).getDataRange().getValues();
  const sheet = ss.getSheetByName(SHEETS.RECEIVABLES);
  const clients = ss.getSheetByName(SHEETS.CLIENTS).getDataRange().getValues();

  // =========================
  // 1. Payments by client
  // =========================
  let clientPayments = {};

  payments.slice(1).forEach(row => {
    const client = row[2]; // Client ID
    const amount = Number(row[5]) || 0;
    const confirmed = row[8];

    if (!(confirmed === true || confirmed === "Yes")) return;
    if (!client) return;

    if (!clientPayments[client]) clientPayments[client] = 0;

    clientPayments[client] += amount;
  });

  // =========================
  // 2. Build receivables
  // =========================
  let result = [["Client", "Project", "Unit", "Sale", "Paid", "Outstanding", "Status"]];

  sales.slice(1).forEach(row => {
    const client = row[1];//findClientValue(row[1], clients,1);
    const project = row[2];
    const unit = row[3];
    const saleAmount = Number(row[4]) || 0;
    const status = row[8];

    if (status !== "Signed" && status !== "Closed") return;

    const paid = clientPayments[client] || 0;
    const outstanding = saleAmount - paid;

    // после расчета outstanding по sale


    let state = "Unpaid";
    if (paid > 0 && outstanding > 0) state = "Partial";
    if (outstanding <= 0) state = "Paid";

    result.push([
      client,
      project,
      unit,
      saleAmount,
      paid,
      outstanding,
      state
    ]);
  });

  
  

  // =========================
  // 3. Write
  // =========================
  sheet.clearContents();
  sheet.getRange(1, 1, result.length, result[0].length).setValues(result);

  
}