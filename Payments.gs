function allocatePayments() {
  const ss = SpreadsheetApp.getActive();

  const sales = ss.getSheetByName(SHEETS.SALES).getDataRange().getValues();
  const payments = ss.getSheetByName(SHEETS.PAYMENTS).getDataRange().getValues();
  const sheet = ss.getSheetByName(SHEETS.PAYMENT_ALLOCATION);  // BUG-06 FIX: исправлена опечатка

  // =========================
  // 1. Подготовка Sales (только активные сделки, FIFO по дате договора)
  // =========================
  let clientSales = {};

  sales.slice(1).forEach(row => {
    const saleId = row[0];
    const client = row[1];
    const amount = Number(row[4]) || 0;
    const date = new Date(row[7]);
    const status = row[8];

    if (status !== "Signed" && status !== "Closed") return;
    if (!saleId || !client || amount === 0) return;

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

    if (!(confirmed === true || confirmed === CONFIRMED_YES)) return;
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

function updatePaymentSchedule() {
  const ss = SpreadsheetApp.getActive();

  const scheduleSheet = ss.getSheetByName(SHEETS.PAYMENT_SCHEDULE);
  const allocationsSheet = ss.getSheetByName(SHEETS.PAYMENT_ALLOCATION);

  const schedule = scheduleSheet.getDataRange().getValues();
  const allocations = allocationsSheet.getDataRange().getValues();

  const today = new Date();

  // =========================
  // 1. Группируем allocations по sale
  // =========================
  let saleAllocations = {};

  allocations.slice(1).forEach(row => {
    const saleId = row[1];
    const amount = Number(row[3]) || 0;

    if (!saleAllocations[saleId]) saleAllocations[saleId] = 0;
    saleAllocations[saleId] += amount;
  });

  // =========================
  // 2. Группируем schedule по sale
  // =========================
  let saleSchedules = {};

  for (let i = 1; i < schedule.length; i++) {
    const saleId = schedule[i][1];
    const dueDate = new Date(schedule[i][4]);

    if (!saleSchedules[saleId]) saleSchedules[saleId] = [];

    saleSchedules[saleId].push({
      index: i,
      dueDate,
      amount: Number(schedule[i][5]) || 0,
      paid: 0
    });
  }

  // сортировка по due date
  Object.keys(saleSchedules).forEach(sale => {
    saleSchedules[sale].sort((a, b) => a.dueDate - b.dueDate);
  });

  // =========================
  // 3. Allocation по schedule
  // =========================
  Object.keys(saleSchedules).forEach(saleId => {
    let remaining = saleAllocations[saleId] || 0;

    saleSchedules[saleId].forEach(item => {
      if (remaining <= 0) return;

      const paid = Math.min(item.amount, remaining);

      item.paid = paid;
      remaining -= paid;
    });
  });

  // =========================
  // 4. Batch-запись (оптимизация: одна операция на весь диапазон)
  // =========================
  const totalRows = schedule.length - 1;
  if (totalRows <= 0) return;

  // Готовим массив обновлений [paid, remaining, status, overdue]
  const updates = new Array(totalRows).fill(null).map(() => ['', '', '', '']);

  for (let saleId in saleSchedules) {
    saleSchedules[saleId].forEach(item => {
      const rowIdx = item.index - 1; // 0-based для массива
      const remaining = item.amount - item.paid;

      let status = "Unpaid";
      if (item.paid > 0 && remaining > 0) status = "Partial";
      if (remaining <= 0) status = "Paid";

      // Overdue flag: просрочена, если дата прошла И не оплачена полностью
      const isOverdue = (item.dueDate < today) && (status !== "Paid");
      const overdueFlag = isOverdue ? "Overdue" : "";

      updates[rowIdx] = [item.paid, remaining, status, overdueFlag];
    });
  }

  // Записываем 4 колонки (7,8,9,10) одним вызовом
  scheduleSheet.getRange(2, 7, totalRows, 4).setValues(updates);
}