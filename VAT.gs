function updateVAT() {
  const ss = SpreadsheetApp.getActive();

  const payments = ss.getSheetByName(SHEETS.PAYMENTS).getDataRange().getValues();
  const expenses = ss.getSheetByName(SHEETS.EXPENSES).getDataRange().getValues();
  const vatSheet = ss.getSheetByName("VAT");

  // =========================
  // ❗ FIX 1: ОЧИСТКА ЛИСТА
  // =========================
  if (vatSheet.getLastRow() > 1) {
    vatSheet.getRange(2, 1, vatSheet.getLastRow(), 7).clearContent();
  }

  let monthlyData = {};

  // =========================
  // INCOMING VAT (EXPENSES)
  // =========================
  expenses.slice(1).forEach(row => {
    const date = row[8];          // Payment Date (ВАЖНО!)
    const project = row[2];
    const amount = Number(row[6]) || 0;
    const status = row[7];

    // ❗ только оплаченные
    if (status !== "Paid") return;
    if (!date || amount === 0) return;

    const d = new Date(date);
    if (isNaN(d)) return;

    const month = Utilities.formatDate(d, "GMT", "yyyy-MM");

    if (!monthlyData[month]) monthlyData[month] = {};
    if (!monthlyData[month][project]) {
      monthlyData[month][project] = { incoming: 0, outgoing: 0 };
    }

    monthlyData[month][project].incoming += amount * 21 / 121;
  });

  // =========================
  // OUTGOING VAT (PAYMENTS)
  // =========================
  payments.slice(1).forEach(row => {
    const date = row[1];
    const project = row[2];
    const amount = Number(row[5]) || 0;
    const confirmed = row[8];

    // ❗ только подтвержденные
    if (!(confirmed === true || confirmed === "Yes")) return;
    if (!date || amount === 0) return;

    const d = new Date(date);
    if (isNaN(d)) return;

    const month = Utilities.formatDate(d, "GMT", "yyyy-MM");

    if (!monthlyData[month]) monthlyData[month] = {};
    if (!monthlyData[month][project]) {
      monthlyData[month][project] = { incoming: 0, outgoing: 0 };
    }

    monthlyData[month][project].outgoing += amount * 21 / 121;
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