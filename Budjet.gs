function generateBudgetVariance() {
  const ss = SpreadsheetApp.getActive();

  const budget = ss.getSheetByName(SHEETS.BUDGET).getDataRange().getValues();
  const expenses = ss.getSheetByName(SHEETS.EXPENSES).getDataRange().getValues();
  const contracts = ss.getSheetByName(SHEETS.CONTRACTS).getDataRange().getValues();
  const sheet = ss.getSheetByName(SHEETS.BUDJET_VARIANCE);

  let actualMap = {};
  let committedMap = {};

  // =====================
  // Expenses → Actual
  // =====================
  expenses.slice(1).forEach(row => {
    const project = row[2];
    const category = row[5];
    const amount = Number(row[6]) || 0;
    const status = row[7];

    if (status !== "Paid") return;

    const key = project + "|" + category;

    if (!actualMap[key]) actualMap[key] = 0;
    actualMap[key] += amount;
  });

  // =====================
  // Contracts → Committed
  // =====================
  contracts.slice(1).forEach(row => {
    const project = row[1];
    const amount = Number(row[4]) || 0;

    const key = project + "|TOTAL";

    if (!committedMap[key]) committedMap[key] = 0;
    committedMap[key] += amount;
  });

  // =====================
  // Build table
  // =====================
  let result = [[
    "Project",
    "Category",
    "Budget",
    "Actual",
    "Committed",
    "Variance",
    "Variance %",
    "Remaining Budget"
  ]];

  budget.slice(1).forEach(row => {
    const project = row[0];
    const category = row[1];
    const budgetAmount = Number(row[7]) || 0;

    const key = project + "|" + category;

    const actual = actualMap[key] || 0;
    const committed = committedMap[project + "|TOTAL"] || 0;

    const variance = budgetAmount - actual;
    const remaining = budgetAmount - committed;

    let variancePct = 0;
    if (budgetAmount > 0) {
      variancePct = variance / budgetAmount;
    }

    result.push([
      project,
      category,
      budgetAmount,
      actual,
      committed,
      variance,
      variancePct,
      remaining
    ]);
  });

  sheet.clearContents();
  sheet.getRange(1, 1, result.length, result[0].length).setValues(result);
}