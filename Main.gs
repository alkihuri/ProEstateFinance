function updateSystem() {
  updateDashboard();
  generateCashFlow();
  updateContracts();
  allocatePayments();
}

function initSystem() {
  updateSystem();
}