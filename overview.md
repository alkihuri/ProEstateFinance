# ProEstateFinance — Overview

> Последнее обновление: 2026-05-02. Версия актуализирована на основе реального кода после закрытия Cards 1–6.

---

## 0. Аудит Trello Cards 1–6 — фактическое состояние в коде

> Пользователь отметил Cards 1–6 как закрытые. Ниже — результат проверки кода.

| Card | Название | Статус в коде | Комментарий |
|---|---|---|---|
| **1** | Подключить VAT в главный update pipeline | ❌ **НЕ СДЕЛАНО** | `Main.gs`: `updateVAT()` **по-прежнему не вызывается** из `updateSystem()`. VAT считается только при ручном запуске. |
| **2** | Починить VAT дубли | ✅ **СДЕЛАНО** | `VAT.gs`: добавлена очистка листа перед записью (`clearContent()`). Дубли устранены. |
| **3** | Исправить Revenue logic | ✅ **СДЕЛАНО** | `Dashboard.gs` (`getSalesStats`): суммирует только сделки со статусом `Signed`/`Closed`. `getProfitStats`: ROI исправлен — `profit / totalInvestment` (сумма `PlannedBudget` из `Projects`). |
| **4** | Вернуть фильтрацию Cash Flow | ✅ **СДЕЛАНО** | `CashFlow.gs`: платежи фильтруются по `confirmed === true / "Yes"`, расходы — только `status === "Paid"`. |
| **5** | Data cleanup | ⚠️ **НЕ ПРОВЕРЯЕМО из кода** | Это работа в таблице (заполнение Unit Type, бюджеты P002/P003, нормализация статусов). Проверьте вручную в Google Sheets. |
| **6** | Finish updateContracts() | ✅ **СДЕЛАНО** | `Contracts.gs`: добавлен write-back — `contractsSheet.getRange(2, 6, result.length, 4).setValues(result)`. Записывает: paid, remaining, percent, status. |

**Итог: из 5 проверяемых карточек — 4 выполнены в коде, 1 (Card 1) НЕ выполнена.** Card 5 не верифицируется кодом.

---

## 1. Соответствие ТЗ — актуальный статус (2026-05-02)

| # | Модуль по ТЗ | Статус | Реальное состояние |
|---|---|---|---|
| 1 | **Projects** (реестр объектов) | ✅ Частично | Лист `Projects`: ID, Name, Status, Start/End Date, Planned Budget, Planned Revenue, Sellable Area, Units Count. Dashboard считает total/active/completed. **Нет** стадий проекта, инвестиционного плана с разбивкой по периодам, фильтрации KPI по проекту. |
| 2 | **Units Sales CRM** | ✅ Частично | `Units`: Available/Reserved/Sold. `getSalesStats()` агрегирует Sales по статусу (Signed/Closed) и считает confirmed payments отдельно. **Нет** payment schedules, aging receivables, связи Unit ↔ Sale ↔ Client в логике скриптов. |
| 3 | **Client Payments** | ✅ Частично | `Client Payments`: 7 записей. Dashboard считает только confirmed (`row[8]`). `generateCashFlow()` фильтрует confirmed. **Нет** платёжного календаря, aging receivables, cash inflow analytics по проекту. |
| 4 | **Budget / Cost Control** | ✅ Частично | `Budget`: 29 категорий (P001). Dashboard читает `row[7]` (Total Real). `getExpenseStats()` фильтрует только `Paid` расходы. **Нет** BOQ import, cost per sqm, variance analysis, автосвязи Budget Category ↔ Expenses Category. |
| 5 | **Contractors / Contracts** | ✅ Улучшено | `updateContracts()` теперь **пишет в лист** paid/remaining/percent/status (cols 6–9). **Нет** двух уровней (estimate ↔ contract packages), burn-down, % освоения в дашборде. |
| 6 | **Expenses / AP** | ✅ Частично | `Expenses`: 4 записи. Фильтрация по `Paid` работает в Dashboard и CashFlow. **Нет** contract burn-down, forecast payables. |
| 7 | **Banking / Treasury** | ⚠️ Каркас | `Bank Accounts` объявлен. Dashboard суммирует `row[4]`. **Нет** мультивалютности, liquidity position. |
| 8 | **Cash Flow Engine** | ✅ Работает | `generateCashFlow()` с фильтрацией по confirmed/Paid. Записывает 7 колонок: Month, Opening, Income, Expense, Net, Closing, Verifying. **Нет** liquidity forecast, cumulative отдельной колонкой. |
| 9 | **VAT Module** | ⚠️ Написан, НЕ подключён | `updateVAT()` исправлен (очистка листа, фильтрация, batch-write), но **не вызывается из `updateSystem()`**. Это незакрытая Card 1. |
| 10 | **KPI Dashboard** | ✅ Частично | 6 блоков KPI (B2–B32). Revenue из `Sales` (Signed/Closed), ROI исправлен. **Нет** KPI: Sales %, Budget Execution %, Cost to Complete, Committed Cost, детализации по проекту. |
| 11 | **Monthly Reporting** | ❌ Не реализовано | Автоматические management reports отсутствуют. |
| 12 | **Automation / AI** | ❌ Не реализовано | Парсинг писем, Gemini — не реализованы. |

---

## 2. Архитектура данных — текущее состояние

### Листы (13 штук, объявлены в `Config.gs`)

| Лист | Колонки (фактически) | Статус данных |
|---|---|---|
| `Projects` | ID, Name, Status, Start Date, End Date, Planned Budget, Planned Revenue, Sellable Area, Units Count | ✅ 3 проекта: P001 Budva, P002 Bar, P003 Ulcin |
| `Units` | Unit ID, Project ID, Type, Number, Floor, Area, Status | ✅ 18 юнитов; ⚠️ часть без Type |
| `Clients` | — | ⚠️ Объявлен, данные не проверены |
| `Sales` | …, Price (col 4), …, Status (col 8) | ⚠️ Если пуст — Revenue = 0 на дашборде |
| `Client Payments` | ID, Date, Client, Project, Unit, Amount, Method, Reference, Confirmed | ✅ 7 платежей |
| `Budget` | ID, Project, Category, Unit, Qty, Price, Estimated, Real, Diff | ✅ 29 категорий P001; ⚠️ P002/P003 пусты |
| `Contractors` | — | ⚠️ Объявлен |
| `Contracts` | ID, …, Amount (col 4), Paid (col 5), Remaining (col 6), % (col 7), Status (col 8) | ⚠️ write-back добавлен в Card 6; статус записывается как boolean (баг) |
| `Expenses` | ID, Date, Project, Contractor, Contract, Category, Amount, Status, Payment Date, Verification | ✅ 4 записи |
| `Bank Accounts` | …, Balance (col 4) | ⚠️ Объявлен; Dashboard читает `row[4]` |
| `Cash Flow` | Month, Opening, Income, Expense, Net, Closing, Verifying | ✅ Перезаписывается скриптом (7 колонок) |
| `Dashboard` | KPI-ячейки B2–B32 | ✅ Обновляется скриптом |
| `VAT` | Month, Project, Incoming VAT, Outgoing VAT, Payable, Cumulative, Status | ✅ При ручном запуске `updateVAT()` |

### Известные проблемы с данными

- **`Sales`**: если пуст или нет строк со статусом `Signed`/`Closed` → Revenue = 0 → Profit = 0 → ROI = 0 на дашборде.
- **`Units`**: часть юнитов (C002–C018) без поля `Type` (Card 5 — возможно исправлено вручную, надо проверить).
- **`Budget`**: P002, P003 — бюджетные строки отсутствуют (Card 5).
- **`Expenses`**: статусы смешаны; фильтр по `Paid` работает корректно.
- **`Contracts`**: Cols 6–9 теперь перезаписываются скриптом, но col 8 (Status) содержит `true/false` вместо строки.

---

## 3. Модули Apps Script — детальное состояние

| Файл | Функция | Статус | Проблемы |
|---|---|---|---|
| `Config.gs` | Реестр `SHEETS` | ✅ Работает | VAT rate (21/121) захардкожен в `VAT.gs`, не вынесен в Config |
| `Main.gs` | `updateSystem()` | ❌ Критический баг | **`updateVAT()` не вызывается** — Card 1 не выполнена в коде |
| `Triggers.gs` | `onEdit()` | ✅ Работает | Срабатывает при изменении Payments, Expenses, Sales, Contracts |
| `Dashboard.gs` | 6 блоков KPI | ✅ Улучшен | Revenue из Sales (Signed/Closed); ROI = profit/investment. ⚠️ Revenue = 0 если Sales пуст |
| `CashFlow.gs` | `generateCashFlow()` | ✅ Работает | Фильтры по confirmed/Paid активны. Добавлена колонка `Verifying` — **всегда `true`** (тавтология) |
| `Contracts.gs` | `updateContracts()` | ✅ Write-back добавлен (с багами) | ⚠️ `var status = percent >= 1.0` → boolean вместо строки. ⚠️ Мёртвый код: `const paymentDate = Date(row[7])` |
| `Payments.gs` | `allocatePayments()` | ❌ Заглушка | Цикл есть, `// логика распределения` пуста |
| `VAT.gs` | `updateVAT()` | ✅ Логика исправлена | Очистка + фильтры + batch-write. **Не вызывается из pipeline** |
| `Utils.gs` | `getMonth(date)` | ⚠️ Дубль с багом | Дублирует `formatMonth()` из `CashFlow.gs`; не zero-padded → неверный формат `yyyy-M` |

---

## 4. Баги, требующие исправления (актуальные на 2026-05-02)

### 🔴 Критические

**1. `updateVAT()` не вызывается из `updateSystem()`** (Card 1 не выполнена в коде)

```js
// Main.gs — исправление:
function updateSystem() {
  updateVAT();        // ← добавить первым (до Dashboard)
  updateDashboard();
  generateCashFlow();
  updateContracts();
  allocatePayments();
}
```

**2. `updateContracts()` — `status` записывается как boolean, не строка**

```js
// Contracts.gs — было:
var status = percent >= 1.0;
// исправить на:
var status = percent >= 1.0 ? "Completed" : "Active";
```

**3. `updateContracts()` — мёртвый код с неверным вызовом конструктора**

```js
// Contracts.gs — удалить строку:
const paymentDate = Date(row[7])   // Date() без new возвращает строку, переменная никогда не используется
```

### 🟡 Важные

**4. Revenue = 0 если лист `Sales` пуст**

`getProfitStats()` берёт revenue из B7, который = 0 если `Sales` пуст. Нужно:
- заполнить `Sales` данными со статусами `Signed`/`Closed`, либо
- добавить fallback: если `totalSales === 0`, брать `totalReceived` (подтверждённые платежи).

**5. `allocatePayments()` — пустая логика** (Card 10)

Функция итерирует пары client+project, но ничего не делает.

**6. Колонка `Verifying` в `Cash Flow` — тавтология**

```js
// CashFlow.gs
var confirmed = (opening + income - expense) == closing;
// closing = opening + net = opening + (income - expense) — ВСЕГДА true
// Удалить или заменить на реальную проверку баланса
```

### 🟢 Архитектурные

**7. `getMonth()` в `Utils.gs` дублирует `formatMonth()` в `CashFlow.gs`**

`getMonth()` возвращает `"2026-5"` (без zero-padding), `formatMonth()` — `"2026-05"`. Удалить `Utils.gs` и использовать `formatMonth()` везде.

---

## 5. Советы по архитектуре и развитию системы

### Быстрые улучшения (< 1 дня каждое)

1. **Вынести константы в `Config.gs`**:
   ```js
   const VAT_RATE = 21 / 121;
   const ACTIVE_STATUSES = ["Construction", "Active"];
   const PAID_STATUS = "Paid";
   ```

2. **Создать `Schema.gs` с картой колонок** — устранить хардкод индексов `row[4]`, `row[6]`:
   ```js
   const COLS = {
     EXPENSES: { ID:0, DATE:1, PROJECT:2, CONTRACTOR:3, CONTRACT:4, CATEGORY:5, AMOUNT:6, STATUS:7, PAYMENT_DATE:8 },
     PAYMENTS: { ID:0, DATE:1, CLIENT:2, PROJECT:3, UNIT:4, AMOUNT:5, METHOD:6, REF:7, CONFIRMED:8 }
   };
   ```

3. **Обернуть критические блоки в `try/catch`** с логированием через `Logger.log`. Сейчас любая ошибка в `updateSystem()` останавливает весь pipeline.

4. **Добавить ежедневный scheduled trigger** в `Triggers.gs`:
   ```js
   ScriptApp.newTrigger("updateSystem").timeBased().everyDays(1).atHour(6).create();
   ```

### Средние улучшения (1–3 дня каждое)

5. **Revenue fallback** — если `Sales` пуст, считать revenue = сумма confirmed платежей. Временное решение до заполнения `Sales`.

6. **Budget variance report** — добавить лист `Budget Variance` с колонками: Category, Estimated, Real, Difference, Difference%. Автосвязь с `Expenses` по полю Category.

7. **Dashboard: фильтр по проекту** — добавить dropdown в ячейку D1 Dashboard (`"All" / "P001" / "P002" / "P003"`), передавать projectFilter в каждую функцию агрегации.

8. **Унифицировать `getMonth()` / `formatMonth()`** — удалить `Utils.gs`, использовать `Utilities.formatDate()` с zero-padding везде.

### Стратегические (Cards 7–18 по Trello)

9. **Card 10 — `allocatePayments()`**: реализовать распределение платежей по сделкам, обновлять колонку `Paid` и `Balance` в `Sales`. Это разблокирует Revenue ≠ 0.

10. **Card 11/12 — Payment Schedule + Aging Receivables**: добавить лист `Payment Schedule` (Sale ID, Due Date, Amount, Paid Flag) и агрегировать просрочки по bucket'ам 0-30/31-60/61-90/90+.

11. **Card 13 — Budget vs Actual variance per category**: связать `Budget.Category` ↔ `Expenses.Category` и строить variance report автоматически.

12. **Card 15 — Cost to Complete Engine**: `Remaining Budget + Unpaid Committed Contracts + Forecast Payables`. Нужны данные о прогрессе строительства.

---

## 6. Итоговая таблица статусов по ТЗ (актуальная)

### ✅ Реализовано и работает

| Пункт ТЗ | Что реализовано |
|---|---|
| Реестр проектов | `Projects`: ID, Name, Status, Dates, Planned Budget/Revenue, Sellable Area, Units Count |
| Счётчики проектов | Dashboard: Total / Active (Construction) / Completed |
| Учёт юнитов | `Units`: Available / Reserved / Sold |
| Клиентские платежи | `Client Payments`; фильтр по `confirmed`; агрегация в Dashboard и CashFlow |
| Смета (Budget) | `Budget`: 29 категорий P001; Estimated vs Real vs Difference |
| Расходы / AP | `Expenses`: Project, Contractor, Contract, Category, Amount, Status; фильтр `Paid` |
| Cash Flow Engine | `generateCashFlow()`: Opening/Income/Expense/Net/Closing + фильтры по confirmed/Paid |
| VAT Module (логика) | `updateVAT()`: фильтры, очистка, batch-write, payable/refund по месяцам |
| Contracts write-back | `updateContracts()`: paid/remaining/percent/status записываются в лист |
| KPI Dashboard (6 блоков) | Projects, Sales & Clients, Expenses & Contracts, Cash Position, Profitability, VAT |
| Revenue logic (Sales filter) | `getSalesStats()`: только Signed/Closed сделки; ROI = profit/investment |
| Auto-trigger on edit | `onEdit()` → `updateSystem()` при изменении Payments, Expenses, Sales, Contracts |
| Архитектура листов | 13 листов в `Config.gs` |

---

### 🔄 В процессе (требует доработки)

| Пункт ТЗ | Что сделано / что осталось |
|---|---|
| VAT auto-pipeline | `updateVAT()` написан и исправлен → **не вызывается из `updateSystem()`** (Card 1 не закрыта в коде) |
| Contracts status | Write-back добавлен → **статус пишется как `true/false`** вместо `"Completed"/"Active"` |
| Client payment allocation | `allocatePayments()` итерирует пары → **логика пуста** (Card 10) |
| Cash Flow Verifying | Колонка добавлена → **логика тавтологична** (всегда `true`) |
| Revenue | Фильтр по статусу сделки добавлен → **Revenue = 0 если `Sales` не заполнен** |
| Budget vs Actual | Итог бюджета на дашборде есть → **нет variance analysis, нет связки по Category** |

---

### ❌ Не реализовано (требует разработки)

| Пункт ТЗ | Описание |
|---|---|
| Payment schedules | График рассрочки для каждого клиента / юнита |
| Aging receivables | Анализ просрочек (0–30, 31–60, 61–90, 90+ дней) |
| Платёжный календарь | Ожидаемые поступления по датам |
| BOQ import из Excel | Импорт детальной сметы из внешнего файла |
| Cost per sqm | Стоимость строительства / продаж на кв. метр |
| Variance analysis по статьям | Отклонение Estimated vs Real по каждой категории |
| Два уровня контрактов | Estimate items ↔ Contract packages |
| Contract burn-down / % освоения | Визуализация расхода бюджета по контракту |
| Forecast payables | Прогноз выплат подрядчикам до завершения |
| Multiple currency support | EUR, USD, RSD на банковских счетах |
| Liquidity forecast | Прогноз ликвидности до завершения проекта |
| KPI: Sales % | Units Sold / Total Units × 100 |
| KPI: Budget Execution % | Actual Cost / Total Budget × 100 |
| KPI: Cost to Complete | Total Budget − Actual Cost |
| KPI: Committed Cost | Paid + Remaining contracted |
| KPI по проекту | Фильтрация всех KPI по конкретному проекту |
| Monthly Reporting | Автоматические management reports |
| Scheduled triggers | Ежедневный/еженедельный авто-пересчёт и snapshot |
| Bank email parsing / AI | Парсинг банковских писем, категоризация через Gemini API |
| Data validation & error handling | `try/catch`, проверки типов, защита от пустых ячеек |
| SaaS-эволюция | Веб-интерфейс, REST API, мультитенантность |
