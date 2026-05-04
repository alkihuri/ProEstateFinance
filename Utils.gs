// BUG-10 FIX: добавлено zero-padding (было "2026-5", стало "2026-05")
// Делегируем к formatMonth() из CashFlow.gs (одна точка форматирования)
function getMonth(date) {
  return formatMonth(date);
}


function findClientValue(searchKey, clientsData, columnIndex) {
  for (let i = 0; i < clientsData.length; i++) {
    if (clientsData[i][0] === searchKey) { // ищем в первом столбце
      return clientsData[i][columnIndex]; // возвращаем значение из нужного столбца
    }
  }
  return "Not found"; // если не найдено
}

function formatFixedWidth(value, width) {
    let str = String(value || "");
    if (str.length > width) str = str.substring(0, width - 3) + "...";
    return str.padEnd(width);
    }




    function checkSheets() {
  const ss = SpreadsheetApp.getActive();
  const sheets = ss.getSheets();
  
  Logger.log("=== Существующие листы ===");
  sheets.forEach(sheet => {
    Logger.log(`- ${sheet.getName()}`);
  });
  
  Logger.log(`\nИщем "${SHEETS.PAYMENT_SCHEDULE}": ${ss.getSheetByName(SHEETS.PAYMENT_SCHEDULE) ? "найден" : "НЕ НАЙДЕН"}`);
  Logger.log(`Ищем "${SHEETS.PAYMENT_ALLOCATION}": ${ss.getSheetByName(SHEETS.PAYMENT_ALLOCATION) ? "найден" : "НЕ НАЙДЕН"}`);
}