function updateSystem() {
  updateDashboard();
  generateCashFlow();
  updateContracts();
  allocatePayments();
  updateVAT();
}

function initSystem() {
  updateSystem();
}