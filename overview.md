# ProEstateFinance — Overview

> Последнее обновление: 2026-04-28. Версия актуализирована на основе реального кода, данных в таблице и требований ТЗ.

---

## 1. Соответствие ТЗ — актуальный статус

| # | Модуль по ТЗ | Статус | Реальное состояние |
|---|---|---|---|
| 1 | **Projects** (реестр объектов) | ✅ Реализовано частично | Лист `Projects` содержит: Project ID, Name, Status, Start/End Date, Planned Budget, Planned Revenue, Sellable Area, Units Count. Dashboard считает total/active/completed. **Нет** стадий проекта, инвестиционного плана с разбивкой по периодам, фильтрации KPI по проекту. |
| 2 | **Units Sales CRM** | ✅ Реализовано частично | Листы `Units`, `Sales`, `Clients` объявлены. `Units` содержит Unit ID, Project ID, Type, Number, Floor, Area, Status (Available/Reserved/Sold). Агрегация выручки в Dashboard (B7). **Нет** payment schedules, aging receivables, статусов договора, связи Unit ↔ Sale ↔ Client в логике скриптов. |
| 3 | **Client Payments** | ✅ Реализовано частично | Лист `Client Payments` содержит Payment ID, Date, Client, Project, Unit, Amount, Method, Reference, Confirmed. Суммы поступлений считаются в Dashboard (B8). `generateCashFlow()` учитывает платежи. **Нет** платёжного календаря, aging receivables, cash inflow analytics по проекту. |
| 4 | **Budget / Cost Control** | ✅ Реализовано частично | Лист `Budget` содержит детальную смету с категориями (I–XXIX), Total Estimated и Total Real. Dashboard читает `row[7]` (Total Real) как фактический бюджет. `Expenses` фиксируют выплаты по категориям. **Нет** автоматического импорта BOQ из Excel, cost per sqm, variance analysis по статьям, автосвязи Budget ↔ Expenses по Category. |
| 5 | **Contractors / Contracts** | ⚠️ Каркас | Листы `Contractors`, `Contracts` объявлены. `updateContracts()` считает paid/total по каждому контракту в памяти, **но не пишет результат в лист** (только `Logger.log`). **Нет** write-back, двух уровней (estimate items ↔ contract packages), % освоения. |
| 6 | **Expenses / AP** | ✅ Реализовано частично | Лист `Expenses` содержит Expense ID, Date, Project, Contractor, Contract, Category, Amount, Status, Payment Date, Verification. Dashboard агрегирует итоговые выплаты (B14) и остаток бюджета (B15). `generateCashFlow()` учитывает расходы. **Нет** contract burn-down, % освоения контракта, forecast payables. |
| 7 | **Banking / Treasury** | ✅ Реализовано частично | Лист `Bank Accounts` объявлен. Dashboard суммирует остатки (B18) по `row[4]`. **Нет** мультивалютности, liquidity position по счетам, детализации выписки. |
| 8 | **Cash Flow Engine** | ✅ Реализовано (базово) | `generateCashFlow()` группирует поступления и расходы по месяцам с нарастающим балансом и **записывает результат в лист `Cash Flow`** (очищает перед записью). Лист содержит: Month, Opening, Income, Expense, Net, Closing. **Нет** cumulative cash flow в отдельной колонке, liquidity forecast, funding need to completion. |
| 9 | **VAT Module** | ⚠️ Реализован, не подключён | `updateVAT()` в `VAT.gs` считает входящий/исходящий НДС (21/121) по месяцам и проектам, нарастающий итог, статус payable/refund, пишет в лист `VAT`. **Не вызывается** из `updateSystem()` — расчёт происходит только при ручном запуске. Лист `VAT` не очищается перед записью — при повторном запуске накапливаются дубли. |
| 10 | **KPI Dashboard** | ✅ Реализовано частично | 6 блоков KPI в ячейках B2–B32. Фактические значения (на 28.04.2026): 3 проекта / 2 активных, поступлено от клиентов, бюджет vs факт, cash position, прибыль/убыток, VAT. **Нет** KPI: ROI, Sales %, Budget Execution %, Cost to Complete, Committed Cost, детализации по проекту. |
| 11 | **Monthly Reporting** | ❌ Не реализовано | Автоматические management reports отсутствуют полностью. |
| 12 | **Automation / AI** | ❌ Не реализовано | Парсинг банковских писем, категоризация транзакций через Gemini — не реализованы. |

---

## 2. Архитектура данных — текущее состояние

### Листы (13 штук, все объявлены в `Config.gs`)

| Лист | Колонки (фактически в таблице) | Статус данных |
|---|---|---|
| `Projects` | Project ID, Name, Status, Start Date, End Date, Planned Budget, Planned Revenue, Sellable Area, Units Count | ✅ Заполнен (3 проекта: P001 Budva, P002 Bar, P003 Ulcin) |
| `Units` | Unit ID, Project ID, Type, Number, Floor, Area, Status | ✅ Заполнен (18 юнитов, часть без Type) |
| `Clients` | — | ⚠️ Объявлен, данные не проверены |
| `Sales` | — | ⚠️ Объявлен; скрипт читает `row[4]` как сумму сделки — если лист пуст, Total Sales Value = 0 |
| `Client Payments` | Payment ID, Date, Client, Project, Unit, Amount, Method, Reference, Confirmed | ✅ Заполнен (7 платежей) |
| `Budget` | Budget ID, Project, Category, Unit, Qty, Price, Total (Estimated), Total (Real), Difference | ✅ Заполнен (29 категорий для P001) |
| `Contractors` | — | ⚠️ Объявлен |
| `Contracts` | Contract ID, …, Amount (col 5) | ⚠️ Объявлен; `updateContracts()` читает `row[0]` (ID) и `row[4]` (Amount) |
| `Expenses` | Expense ID, Date, Project, Contractor, Contract, Category, Amount, Status, Payment Date, Verification | ✅ Заполнен (4 записи) |
| `Bank Accounts` | …, Balance (col 5) | ⚠️ Объявлен; Dashboard читает `row[4]` |
| `Cash Flow` | Month, Opening, Income, Expense, Net, Closing | ✅ Заполнен вручную + перезаписывается скриптом |
| `Dashboard` | KPI-ячейки B2–B32 | ✅ Обновляется скриптом |
| `VAT` | Month, Project, Incoming VAT, Outgoing VAT, Payable, Cumulative, Status | ✅ Заполняется `updateVAT()` (при ручном запуске) |

### Известные проблемы с данными

- Лист **`Sales`** по всей видимости пуст или не содержит сумм в `row[4]` → `Total Sales Value = 0` на дашборде, хотя `Client Payments` суммируют ~40 млн. Нет связи Sales ↔ Payments на уровне данных.
- В **`Units`** часть юнитов (C002–C018) не имеет заполненного поля `Type`.
- **`Budget`** заполнен только для P001 (Budva Residence); для P002 и P003 бюджетных строк нет.
- В **`Expenses`**: расходы привязаны к проектам P001 и P002, статусы смешаны (Paid / Planned) — скрипт не фильтрует по статусу при агрегации.
- В **`Cash Flow`** данные введены вручную (2025-12 по 2026-04); скрипт `generateCashFlow()` перезапишет их при следующем запуске.

---

## 3. Модули Apps Script — детальное состояние

| Файл | Функция | Статус | Проблемы |
|---|---|---|---|
| `Config.gs` | Реестр имён листов (`SHEETS`) | ✅ Работает | VAT rate (21/121) захардкожен в `VAT.gs`, не вынесен в Config |
| `Main.gs` | `updateSystem()` — оркестрация | ⚠️ Неполный | **`updateVAT()` не вызывается**; порядок вызовов: Dashboard → CashFlow → Contracts → Payments |
| `Triggers.gs` | `onEdit()` — авто-пересчёт | ✅ Работает | Срабатывает при редактировании Payments, Expenses, Sales, Contracts |
| `Dashboard.gs` | 6 блоков KPI | ⚠️ Частично | `getProfitStats()` берёт revenue из B7 (Sales sheet), который = 0; ROI считается как `profit/expenses`, а не `profit/investment` |
| `CashFlow.gs` | `generateCashFlow()` | ✅ Работает | Нет liquidity forecast; фильтрация по `confirmed` и `status` закомментирована |
| `Contracts.gs` | `updateContracts()` | ❌ Заглушка | Результат только в `Logger.log`, в лист не записывается |
| `Payments.gs` | `allocatePayments()` | ❌ Заглушка | Цикл сопоставления есть, логика распределения пуста (`// логика распределения`) |
| `VAT.gs` | `updateVAT()` | ⚠️ Работает, не подключён | Не вызывается из `updateSystem()`; лист не очищается перед записью → дубли |
| `Utils.gs` | `getMonth(date)` | ⚠️ Дублирует | `formatMonth()` в `CashFlow.gs` делает то же самое в правильном формате `yyyy-MM` |

---

## 4. Баги, требующие немедленного исправления

1. **`updateVAT()` не вызывается из `updateSystem()`** — добавить в `Main.gs`:
   ```js
   function updateSystem() {
     updateVAT();        // ← добавить первым (до Dashboard)
     updateDashboard();
     generateCashFlow();
     updateContracts();
     allocatePayments();
   }
   ```

2. **Лист `VAT` не очищается перед записью** — в `VAT.gs` перед циклом записи добавить:
   ```js
   vatSheet.getRange(2, 1, vatSheet.getLastRow(), 7).clearContent();
   ```

3. **`updateContracts()` не пишет в лист** — нужно добавить write-back в лист `Contracts`: колонки paid, balance, % освоения.

4. **`getProfitStats()` считает Revenue = 0** — Revenue берётся из B7 (Total Sales из листа `Sales`). Пока лист `Sales` пуст, Revenue = 0. Нужно либо заполнить `Sales`, либо считать Revenue напрямую из суммы подтверждённых платежей.

5. **`allocatePayments()` — пустая логика** — функция итерирует, но ничего не делает.

6. **Фильтрация в `generateCashFlow()` закомментирована** — условия по полю `confirmed` и `status` у расходов отключены; скрипт включает непроверенные и незапланированные транзакции.

---

## 5. Советы по архитектурным улучшениям

1. **Вынести VAT rate и другие константы в `Config.gs`**:
   ```js
   const VAT_RATE = 21 / 121;
   const ACTIVE_STATUSES = ["Construction", "Active"];
   ```

2. **Документировать схему колонок** — скрипты используют жёсткие индексы (`row[4]`, `row[6]`). Добавить объект `COLUMNS` в `Config.gs` или отдельный `Schema.gs`.

3. **Batch-запись в листы** — заменить множественные `sheet.getRange(row, col).setValue(val)` на одиночный `sheet.getRange(...).setValues([[...]])`.

4. **Error handling** — оборачивать критические блоки в `try/catch`, проверять `isNaN`, пустые ячейки перед арифметикой.

5. **Scheduled triggers** — добавить в `Triggers.gs` ежедневный пересчёт всей системы и еженедельный snapshot.

6. **Фильтрация по проекту** — все агрегации сейчас суммируют данные по всей компании. Дашборд должен поддерживать выбор проекта.

---

## 6. Итоговая таблица статусов по ТЗ

### ✅ Реализовано (работает в коде и данных)

| Пункт ТЗ | Что реализовано |
|---|---|
| Реестр проектов | Лист `Projects` с полями: ID, Name, Status, Dates, Planned Budget/Revenue, Sellable Area, Units Count |
| Счётчики проектов на дашборде | Total / Active (Construction) / Completed |
| Учёт юнитов | Лист `Units` со статусами Available / Reserved / Sold |
| Учёт клиентских платежей | Лист `Client Payments`; агрегация суммы поступлений на дашборде |
| Детальная смета (Budget) | Лист `Budget` с 29 категориями работ, Estimated vs Real vs Difference для P001 |
| Учёт расходов / AP | Лист `Expenses` с полями: Project, Contractor, Contract, Category, Amount, Status, Verification |
| Cash Flow Engine | `generateCashFlow()` строит таблицу по месяцам (Opening/Income/Expense/Net/Closing) и записывает в лист |
| VAT Module (логика) | `updateVAT()` считает входящий/исходящий НДС, нарастающий итог, payable/refund по месяцам и проектам |
| KPI Dashboard (базовые блоки) | 6 блоков: Projects, Sales & Clients, Expenses & Contracts, Cash Position, Profitability, VAT |
| Auto-trigger on edit | `onEdit()` в `Triggers.gs` запускает `updateSystem()` при изменении ключевых листов |
| Архитектура листов | 13 листов объявлены в `Config.gs`; единый источник правды |

---

### 🔄 В процессе (каркас есть, функция не завершена)

| Пункт ТЗ | Что сделано / что осталось |
|---|---|
| Contractors / Contracts | `updateContracts()` считает paid/total в памяти → **нужен write-back в лист** |
| Client payment allocation | `allocatePayments()` итерирует пары client+project → **логика распределения пуста** |
| VAT auto-update | `updateVAT()` написан и работает → **не вызывается из `updateSystem()`** |
| Cash Flow — cumulative | Базовый месячный CF есть → **нет отдельной колонки cumulative и liquidity forecast** |
| KPI — Profitability | Revenue / Expenses / Profit считаются → **Revenue = 0 из-за пустого листа `Sales`; ROI формула некорректна** |
| Budget vs Actual | Итог бюджета на дашборде есть → **нет variance analysis по статьям, нет связки Budget Category ↔ Expenses Category** |

---

### ❌ Не реализовано (требует разработки)

| Пункт ТЗ | Описание |
|---|---|
| Payment schedules (installment plan) | График рассрочки для каждого клиента / юнита |
| Aging receivables | Анализ просрочек по дебиторке (0–30, 31–60, 61–90, 90+ дней) |
| Платёжный календарь | Ожидаемые поступления по датам |
| BOQ import из Excel | Импорт детальной сметы из внешнего файла |
| Cost per sqm | Стоимость строительства / продаж на квадратный метр |
| Variance analysis по статьям | Отклонение Estimated vs Real по каждой категории работ |
| Два уровня контрактов | Estimate items ↔ Contract packages (связь смета → договор) |
| Contract burn-down / % освоения | Визуализация расхода бюджета по контракту |
| Forecast payables | Прогноз выплат подрядчикам до завершения проекта |
| Multiple currency support | Несколько валют на банковских счетах (EUR, USD, RSD) |
| Liquidity forecast | Прогноз ликвидности и потребность в финансировании до завершения |
| KPI: ROI | Net Profit / Total Investment × 100 |
| KPI: Sales % | Units Sold / Total Units × 100 |
| KPI: Budget Execution % | Actual Cost / Total Budget × 100 |
| KPI: Cost to Complete | Total Budget − Actual Cost |
| KPI: Committed Cost | Paid + Remaining contracted |
| KPI по проекту | Детализация всех KPI в разрезе каждого проекта |
| Monthly Reporting | Автоматические management reports: inflows/outflows, overruns, overdue, liquidity |
| Scheduled triggers | Ежедневный/еженедельный авто-пересчёт и snapshot |
| Parsing bank emails / AI | Парсинг банковских писем, категоризация транзакций через Gemini API |
| Data validation & error handling | `try/catch`, проверки типов, защита от пустых ячеек |
| SaaS-эволюция | Веб-интерфейс, REST API, мультитенантность |
