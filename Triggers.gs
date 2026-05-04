function onEdit(e){
   const sheet = e.source.getActiveSheet().getName();

  if (
    sheet === SHEETS.PAYMENTS ||
    sheet === SHEETS.EXPENSES ||
    sheet === SHEETS.SALES ||
    sheet === SHEETS.CONTRACTS
    ) {
      updateSystem();
    }
}

// =========================
// НАСТРОЙКА ТРИГГЕРОВ
// =========================

// Запустить один раз вручную из Apps Script Editor для установки ежедневного триггера
function setupTriggers() {
  // Удаляем старые триггеры на updateSystem, чтобы не дублировать
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === "updateSystem")
    .forEach(t => ScriptApp.deleteTrigger(t));

  // Ежедневный запуск в 06:00 UTC
  ScriptApp.newTrigger("updateSystem")
    .timeBased()
    .everyDays(1)
    .atHour(6)
    .create();

  Logger.log("Daily trigger for updateSystem set at 06:00 UTC");
}
 