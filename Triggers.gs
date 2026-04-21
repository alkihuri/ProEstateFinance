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



 