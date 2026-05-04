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

function allocatePayments() {
  const ss = SpreadsheetApp.getActive();

  const sales = ss.getSheetByName(SHEETS.SALES).getDataRange().getValues();
  const payments = ss.getSheetByName(SHEETS.PAYMENTS).getDataRange().getValues();
  const sheet = ss.getSheetByName(SHEETS.PAYMANET_ALLOCATION);

  // =========================
  // 1. Подготовка Sales
  // =========================
  let clientSales = {};

  sales.slice(1).forEach(row => {
    const saleId = row[0];
    const client = row[1];
    const amount = Number(row[4]) || 0;
    const date = new Date(row[7]);
    const status = row[8];

    if (status !== "Signed" && status !== "Closed") return;

    if (!clientSales[client]) clientSales[client] = [];

    clientSales[client].push({
      saleId,
      remaining: amount,
      date
    });
  });

  // сортируем сделки по дате (FIFO)
  Object.keys(clientSales).forEach(client => {
    clientSales[client].sort((a, b) => a.date - b.date);
  });

  // =========================
  // 2. Allocation
  // =========================
  let result = [["Payment ID", "Sale ID", "Client", "Allocated", "Date"]];

  payments.slice(1).forEach(row => {
    const paymentId = row[0];
    const client = row[2];
    const amount = Number(row[5]) || 0;
    const confirmed = row[8];
    const date = row[1];

    if (!(confirmed === true || confirmed === "Yes")) return;
    if (!client || amount === 0) return;

    let remainingPayment = amount;

    const salesList = clientSales[client] || [];

    for (let i = 0; i < salesList.length; i++) {
      if (remainingPayment <= 0) break;

      let sale = salesList[i];

      if (sale.remaining <= 0) continue;

      const allocated = Math.min(sale.remaining, remainingPayment);

      sale.remaining -= allocated;
      remainingPayment -= allocated;

      result.push([
        paymentId,
        sale.saleId,
        client,
        allocated,
        date
      ]);
    }
  });

  // =========================
  // 3. Write
  // =========================
  sheet.clearContents();
  sheet.getRange(1, 1, result.length, result[0].length).setValues(result);
}