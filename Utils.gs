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