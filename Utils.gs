function getMonth(date) {
  return date.getFullYear() + "-" + (date.getMonth() + 1);
}


function findClientValue(searchKey, clientsData, columnIndex) {
  for (let i = 0; i < clientsData.length; i++) {
    if (clientsData[i][0] === searchKey) { // ищем в первом столбце
      return clientsData[i][columnIndex]; // возвращаем значение из нужного столбца
    }
  }
  return "Not found"; // если не найдено
}