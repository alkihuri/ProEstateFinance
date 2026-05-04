function updateVAT() {
  const ss = SpreadsheetApp.getActive();

  const payments = ss.getSheetByName(SHEETS.PAYMENTS).getDataRange().getValues();
  const expenses = ss.getSheetByName(SHEETS.EXPENSES).getDataRange().getValues();
  const sales = ss.getSheetByName(SHEETS.SALES).getDataRange().getValues();
  const vatSheet = ss.getSheetByName(SHEETS.VAT);

  // =========================
  // BUG-01 FIX: строим карту Unit → Project из листа Sales
  // (Client Payments хранит Unit в col[3], а не Project в col[2])
  // =========================
  const unitProjectMap = {};
  sales.slice(1).forEach(row => {
    const unit = row[3];
    const project = row[2];
    if (unit && project) unitProjectMap[unit] = project;
  });

  // =========================
  // ОЧИСТКА ЛИСТА
  // =========================
  if (vatSheet.getLastRow() > 1) {
    vatSheet.getRange(2, 1, vatSheet.getLastRow() - 1, 7).clearContent();
  }

  let monthlyData = {};

  // =========================
  // INCOMING VAT (EXPENSES — входящий НДС от подрядчиков)
  // =========================
  expenses.slice(1).forEach(row => {
    const date = row[8];          // Payment Date
    const project = row[2];       // Project ID — корректен для Expenses
    const amount = Number(row[6]) || 0;
    const status = row[7];

    if (status !== PAID_STATUS) return;
    if (!date || amount === 0) return;

    const d = new Date(date);
    if (isNaN(d)) return;

    const month = Utilities.formatDate(d, "GMT", "yyyy-MM");

    if (!monthlyData[month]) monthlyData[month] = {};
    if (!monthlyData[month][project]) {
      monthlyData[month][project] = { incoming: 0, outgoing: 0 };
    }

    monthlyData[month][project].incoming += amount * VAT_RATE;
  });

  // =========================
  // OUTGOING VAT (PAYMENTS — исходящий НДС от клиентов)
  // =========================
  payments.slice(1).forEach(row => {
    const date = row[1];
    const unit = row[3];           // BUG-01 FIX: используем Unit (col[3]) для поиска проекта
    const amount = Number(row[5]) || 0;
    const confirmed = row[8];

    if (!(confirmed === true || confirmed === CONFIRMED_YES)) return;
    if (!date || amount === 0) return;

    const d = new Date(date);
    if (isNaN(d)) return;

    // BUG-01 FIX: получаем Project ID через Unit→Sales map
    const project = unitProjectMap[unit] || "Unknown";

    const month = Utilities.formatDate(d, "GMT", "yyyy-MM");

    if (!monthlyData[month]) monthlyData[month] = {};
    if (!monthlyData[month][project]) {
      monthlyData[month][project] = { incoming: 0, outgoing: 0 };
    }

    monthlyData[month][project].outgoing += amount * VAT_RATE;
  });

  // =========================
  // BUILD RESULT TABLE
  // =========================
  let result = [];
  let cumulative = 0;

  const months = Object.keys(monthlyData).sort();

  months.forEach(month => {
    Object.keys(monthlyData[month]).forEach(project => {
      const incoming = monthlyData[month][project].incoming;
      const outgoing = monthlyData[month][project].outgoing;

      const payable = outgoing - incoming;

      cumulative += payable;

      result.push([
        month,
        project,
        incoming,
        outgoing,
        payable,
        cumulative,
        payable > 0 ? "Payable" : "Refund"
      ]);
    });
  });

  // =========================
  // WRITE (BATCH)
  // =========================
  if (result.length > 0) {
    vatSheet.getRange(2, 1, result.length, result[0].length).setValues(result);
  }
}