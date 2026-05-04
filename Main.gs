function updateSystem() {
  updateDashboard();
  generateCashFlow();
  updateContracts();
  allocatePayments();
  updateVAT();
  getCommittedCostStats();
  updateReceivables();
}

function initSystem() {
  updateSystem();
}