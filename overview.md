# ProEstateFinance — Overview

## 1. Соответствие ТЗ

| # | Модуль по ТЗ | Статус | Примечание |
|---|---|---|---|
| 1 | Projects (реестр объектов) | ✅ Частично | Лист `Projects` есть; считается total/active/completed, но нет инвестплана, плановой выручки, площади, стадий |
| 2 | Units Sales CRM | ✅ Частично | Листы `Units`, `Sales`, `Clients` есть; агрегация выручки реализована; **нет** payment schedules, aging receivables, статусов сделки |
| 3 | Client Payments | ✅ Частично | Лист `Client Payments`; суммы поступлений считаются; **нет** платёжного календаря, aging, cash inflow по месяцам (только log) |
| 4 | Budget / Cost Control | ✅ Частично | Лист `Budget`; читается итоговый бюджет vs факт; **нет** импорта из Excel/BOQ, детализации по статьям, cost per sqm, variance analysis |
| 5 | Contractors / Contracts | ✅ Частично | Листы `Contractors`, `Contracts`; `updateContracts()` считает paid/total per contract; **нет** write-back в лист, нет двух уровней (estimate ↔ package) |
| 6 | Expenses / AP | ✅ Частично | Лист `Expenses`; итоговые выплаты и остаток бюджета на дашборде; **нет** contract burn-down, % освоения, прогноза выплат |
| 7 | Banking / Treasury | ✅ Частично | Лист `Bank Accounts`; общий остаток денег агрегируется; **нет** поддержки нескольких валют, liquidity position, детализации по счетам |
| 8 | Cash Flow Engine | ⚠️ Каркас | `generateCashFlow()` группирует по месяцам в памяти, но **не пишет** результат в лист `Cash Flow`; нет cumulative, нет liquidity forecast |
| 9 | VAT Module | ✅ Хорошо | `updateVAT()` считает входящий/исходящий НДС по месяцам и проектам, нарастающий итог, статус payable/refund; **не вызывается** из `updateSystem()` |
| 10 | KPI Dashboard | ✅ Частично | 6 блоков KPI (projects, sales, expenses, cash, profit, VAT); **нет** ROI, sales %, budget execution %, cost to complete, committed cost |
| 11 | Monthly Reporting | ❌ Не реализовано | Автоматические management reports отсутствуют |
| 12 | Automation / AI | ❌ Не реализовано | Парсинг банковских писем, категоризация транзакций — не реализованы |

---

## 2. Что реализовано

### Архитектура данных
- **13 листов** объявлены в `Config.gs` как именованные константы (`SHEETS`): Projects, Units, Clients, Sales, Client Payments, Budget, Contractors, Contracts, Expenses, Bank Accounts, Cash Flow, Dashboard, VAT.
- Принцип «единого источника правды»: все данные хранятся в листах, скрипты только читают и агрегируют.

### Модули Apps Script
| Файл | Что делает |
|---|---|
| `Config.gs` | Центральный реестр имён листов |
| `Main.gs` | Оркестрация: `initSystem()` → `updateSystem()` запускает полный пересчёт |
| `Triggers.gs` | `onEdit()` — запускает `updateSystem()` при изменении ключевых листов (Payments, Expenses, Sales, Contracts) |
| `Dashboard.gs` | Пишет KPI в фиксированные ячейки дашборда: обзор проектов, продажи, расходы, cash position, прибыльность, VAT |
| `CashFlow.gs` | Группирует поступления и расходы по месяцам (результат — в памяти, не записывается) |
| `Contracts.gs` | Считает paid/total по каждому контракту (результат — только лог) |
| `Payments.gs` | Заготовка для распределения платежей по клиентам и проектам |
| `VAT.gs` | Считает входящий/исходящий НДС по месяцам и проектам, нарастающий итог, статус; пишет результат в лист `VAT` |
| `Utils.gs` | Вспомогательная функция `getMonth()` |

### KPI Dashboard (реализованные ячейки)
- **B2:B4** — всего проектов / активных / завершённых
- **B7:B9** — сумма договоров продаж / поступило / остаток дебиторки
- **B12:B15** — бюджет / сумма контрактов / оплачено / остаток бюджета
- **B18:B21** — остаток на счетах / дебиторка / кредиторка / прогнозная позиция
- **B24:B27** — выручка / расходы / прибыль / рентабельность
- **B30:B32** — входящий НДС / исходящий НДС / к уплате

---

## 3. Что не реализовано

### Критические пробелы

1. **`generateCashFlow()` не пишет в лист** — результат только в `Logger.log`. Лист `Cash Flow` остаётся пустым. Нет накопительного cash flow и liquidity forecast.

2. **`updateContracts()` не пишет в лист** — аналогично, только лог. Нет write-back данных о burn-down контрактов.

3. **`allocatePayments()` — заглушка** — функция содержит цикл сопоставления клиент+проект, но блок логики распределения пуст (комментарий `// логика распределения`).

4. **`updateVAT()` не вызывается из `updateSystem()`** — VAT пересчитывается только при явном вызове, а не автоматически при каждом `updateSystem()`. `getVATStats()` читает устаревшие данные из листа.

5. **Нет схемы колонок** — нигде не документировано, какие колонки ожидаются в каждом листе. Скрипты используют жёсткие индексы (`row[4]`, `row[6]` и т.д.) без пояснений.

### Отсутствующие модули / функции

| Что нужно по ТЗ | Статус |
|---|---|
| Payment schedules для клиентов (installment plan) | ❌ |
| Aging receivables (просрочки по дебиторке) | ❌ |
| Платёжный календарь (cash inflow calendar) | ❌ |
| Импорт сметы из Excel (BOQ import) | ❌ |
| Cost per sqm | ❌ |
| Variance analysis по статьям бюджета | ❌ |
| Два уровня контрактов (estimate items ↔ contract packages) | ❌ |
| Contract burn-down / % освоения | ❌ |
| Forecast payables | ❌ |
| Multiple currency support | ❌ |
| Liquidity forecast / funding need to completion | ❌ |
| KPI: ROI | ❌ |
| KPI: Sales % (продано/всего) | ❌ |
| KPI: Budget execution % | ❌ |
| KPI: Cost to complete | ❌ |
| KPI: Committed cost | ❌ |
| Детализация KPI по проекту (сейчас всё — итого по компании) | ❌ |
| Monthly Reporting (автоматические отчёты) | ❌ |
| Scheduled triggers (периодический пересчёт, архивирование) | ❌ |
| Parsing bank emails / AI categorization | ❌ |
| Data validation и error handling | ❌ |
| SaaS-эволюция (веб-интерфейс, API) | ❌ |

---

## 4. Советы по улучшению

### Баги, которые нужно исправить немедленно

1. **Добавить `updateVAT()` в `updateSystem()`**:
   ```js
   function updateSystem() {
     updateVAT();       // ← добавить
     updateDashboard();
     generateCashFlow();
     updateContracts();
     allocatePayments();
   }
   ```

2. **Реализовать write-back в `generateCashFlow()`** — после построения объекта `cashflow` записывать строки в лист `Cash Flow` (предварительно очищая его).

3. **Реализовать write-back в `updateContracts()`** — записывать `paid`, `balance`, `%` обратно в лист `Contracts`.

4. **Очищать лист `VAT` перед записью** — сейчас `updateVAT()` пишет начиная со строки 2 без очистки, что приводит к накоплению дублей при каждом вызове.

5. **Реализовать `allocatePayments()`** — добавить логику распределения платежей по installment plan клиента.

### Архитектурные улучшения

6. **Вынести VAT rate в `Config.gs`**:
   ```js
   const VAT_RATE = 21 / 121; // 21% VAT (inclusive)
   ```
   Сейчас `21/121` захардкожено в `VAT.gs`.

7. **Документировать схему колонок** для каждого листа в `Config.gs` или отдельном `Schema.gs` — это устранит хрупкость жёстких индексов и упростит поддержку.

8. **Добавить фильтрацию по проекту** — все текущие агрегации суммируют данные по всей компании. Дашборд должен уметь показывать KPI по отдельному проекту.

9. **Добавить scheduled triggers** в `Triggers.gs`:
   - Ежедневный пересчёт всей системы
   - Еженедельный snapshot cash flow и VAT позиции

10. **Добавить error handling** — оборачивать критические операции в `try/catch`, логировать ошибки, валидировать типы данных (`isNaN`, пустые ячейки) перед арифметикой.

11. **Использовать batch операции** — заменить множественные `sheet.getRange(row, col).setValue(val)` на одиночный `sheet.getRange(...).setValues([[...]])` для повышения производительности.

12. **Aging receivables** — добавить функцию, которая сравнивает дату ожидаемого платежа с текущей датой и группирует просрочки по бакетам: 0–30, 31–60, 61–90, 90+ дней.

13. **Monthly Reporting** — добавить функцию `generateMonthlyReport()`, которая формирует отдельный лист-отчёт с inflows/outflows, overruns, overdue receivables, liquidity forecast на конец месяца.

14. **KPI расширение** — добавить недостающие показатели:
    - Sales % = Units Sold / Total Units × 100
    - Budget Execution % = Actual Cost / Total Budget × 100
    - ROI = Net Profit / Total Investment × 100
    - Cost to Complete = Total Budget − Actual Cost
    - Committed Cost = Expenses Paid + Contracts Remaining
