function updateSystem() {
  // BUG-05 FIX: правильный порядок — VAT и Contracts первыми, Dashboard последним
  _run("updateVAT", updateVAT);
  _run("updateContracts", updateContracts);
  _run("allocatePayments", allocatePayments);
  _run("updatePaymetnSchedule",updatePaymentSchedule);
  _run("updateReceivables", updateReceivables);
  _run("generateCashFlow", generateCashFlow);
  _run("updateDashboard", updateDashboard);  // последним — читает все обновлённые листы
  _run("updateContractBurn", generateContractBurndown);
  _run("updateAging", generateAging);
}

// BUG-12 FIX: getCommittedCostStats() теперь внутри updateDashboard() (Dashboard.gs)
// Здесь больше не вызывается явно

function initSystem() {
  updateSystem();
}

// =========================
// ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ERROR HANDLING
// =========================

function _run(name, fn) {
  try {
    fn();
  } catch (e) {
    Logger.log("[ERROR] " + name + ": " + e.message + "\n" + e.stack);
  }
}