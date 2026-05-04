function updateReceivables() {
  const ss = SpreadsheetApp.getActive();

  const sales = ss.getSheetByName(SHEETS.SALES).getDataRange().getValues();
  const allocations = ss.getSheetByName(SHEETS.PAYMENT_ALLOCATION).getDataRange().getValues();
  const sheet = ss.getSheetByName(SHEETS.RECEIVABLES);
  const clients = ss.getSheetByName(SHEETS.CLIENTS).getDataRange().getValues();
  const units = ss.getSheetByName(SHEETS.UNITS).getDataRange().getValues();

  // =========================
  // BUG-03 FIX: суммируем аллоцированные платежи ПО СДЕЛКЕ (не по клиенту)
  // Используем Payment Allocations, которые записывает allocatePayments()
  // =========================
  const saleAllocated = {};
  allocations.slice(1).forEach(row => {
    const saleId = row[1];       // Sale ID
    const allocated = Number(row[3]) || 0;
    if (!saleId) return;
    saleAllocated[saleId] = (saleAllocated[saleId] || 0) + allocated;
  });

  // =========================
  // 2. Build receivables per sale
  // =========================
  let result = [["Client", "Project", "Unit", "Sale", "Paid", "Outstanding", "Status", "Detailed info"]];

  sales.slice(1).forEach(row => {
    const saleId = row[0];
    const client = row[1];
    const clientName = findClientValue(client,clients,1)
    const project = row[2];
    const unit = row[3];
    
    

    const unitName = 
                  findClientValue(unit, units, 2) 
                  +
                  ", "
                  +
                  findClientValue(unit, units, 3);



    const saleAmount = Number(row[4]) || 0;
    const status = row[8];

    if (status !== "Signed" && status !== "Closed") return;
    if (!saleId || saleAmount === 0) return;

    const paid = saleAllocated[saleId] || 0;
    const outstanding = saleAmount - paid;

    let state = "Unpaid";
    if (paid > 0 && outstanding > 0) state = "Partial";
    if (outstanding <= 0) state = "Paid";

    var detailedInfo =  clientName +  ": " + unitName;

    result.push([client, project, unit, saleAmount, paid, outstanding, state,detailedInfo]);
  });

  // =========================
  // 3. Write
  // =========================
  sheet.clearContents();
  sheet.getRange(1, 1, result.length, result[0].length).setValues(result);
}
