# ProEstateFinance — Overview

> Последнее обновление: 2026-05-05 (rev 4). Полный аудит post-Cards 1–13. Обнаружены регрессии rev 3, новые модули Cards 12/13.

---

## 0. System State Summary

```
Implementation:       ~65%  (Cards 1–12 + partial 13 из 29 карточек)
Data Quality:         ~25%  (платежи 20× выше продаж, D1 overpay, Units key mismatch)
Architecture Maturity:~50%  (pipeline работает, FIFO ✅, но 6 unfixed bugs, нет validation layer)
```

**MVP прогресс (Cards 1–18):** 12 из 18 = **67%**

---

## 1. Аудит Trello Cards 1–13

> Пользователь отметил Cards 1–13 как закрытые. Ниже — верификация по ФАКТИЧЕСКОМУ состоянию кода.

| Card | Название | Trello | Код | Вердикт |
|---|---|---|---|---|
| **1** | Подключить VAT в pipeline | Closed | ✅ `updateVAT()` первым в `updateSystem()` | ✅ **ВЫПОЛНЕНО** |
| **2** | Починить VAT дубли | Closed | ✅ `clearContent()` перед записью в `VAT.gs` | ✅ **ВЫПОЛНЕНО** |
| **3** | Исправить Revenue logic | Closed | ✅ Фильтр `Signed`/`Closed`; ROI = profit/investment | ⚠️ **ЧАСТИЧНО** — данные платежей (~120M) несинхронизированы с продажами (6M) |
| **4** | Вернуть фильтрацию CF | Closed | ⚠️ `CashFlow.gs` line 22: `"Yes"` hardcoded (не `CONFIRMED_YES`); line 47: `"Paid"` hardcoded | ⚠️ **РЕГРЕССИЯ** — BUG-15 из rev 3 НЕ ПРИМЕНЁН в текущих файлах |
| **5** | Data cleanup | Closed | ✅ Guard в `updateContracts()` для #N/A | ⚠️ **ЧАСТИЧНО** — Typo "Pakinkg", P002/P003 пусты, D1 overpay — не исправлены вручную |
| **6** | Finish updateContracts() | Closed | ✅ Write-back paid/remaining/percent/status; guard для #N/A строк | ✅ **ВЫПОЛНЕНО** |
| **7** | Contract burn-down tracking | Closed | ✅ `generateContractBurndown()` + лист `Contract Burn` в `Config.gs` | ✅ **ВЫПОЛНЕНО** |
| **8** | Budget ↔ Contract mapping | Closed | ❌ Нет mapping-таблицы, нет функции в коде — только rollup по `project\|TOTAL` в `Budjet.gs` | ❌ **НЕ ВЫПОЛНЕНО** |
| **9** | Committed Cost KPI | Closed | ✅ `getCommittedCostStats()` внутри `updateDashboard()`, пишет в B36–B39 | ✅ **ВЫПОЛНЕНО** |
| **10** | Implement allocatePayments() | Closed | ✅ FIFO по дате контракта; `clearContents()` перед записью | ✅ **ВЫПОЛНЕНО** |
| **11** | Payment Schedule module | Closed | ⚠️ `updatePaymentSchedule()` существует, но: нет overdue-флага, нет `clearContents()`, N×`setValue()` в цикле | ⚠️ **ЧАСТИЧНО** |
| **12** | Aging receivables | Closed | ✅ `generateAging()` в `Payments.gs`; читает из Payment Schedule; `diffDays < 0` → пропуск будущих | ✅ **ВЫПОЛНЕНО** |
| **13** | Budget vs Actual variance | Closed | ⚠️ `generateBudgetVariance()` в `Budjet.gs` существует, но: **НЕ вызывается в `updateSystem()`**; логика Committed — project-level, не category-level | ❌ **НЕ ПОЛНОСТЬЮ** — не в pipeline |

---

## 2. Audit Table — 10 ключевых проверок

| # | Проверка | Статус | Детали |
|---|---|---|---|
| 1 | **Payments vs Sales ratio** | ❌ | ~120M платежей vs 6M продаж = 20× mismatch → Receivables отрицательные, Allocations бессмысленны |
| 2 | **FIFO Allocation** | ✅ | `allocatePayments()`: сортировка по `contract date` (Sales row[7]) ✅; `updatePaymentSchedule()`: сортировка по `dueDate` ✅ |
| 3 | **Schedule vs Receivables consistency** | ⚠️ | Оба читают из `Payment Allocations`, но разная логика: Receivables = SaleAmount−AllocatedTotal; Schedule = распределение по installments. Если `SaleAmount ≠ sum(InstallmentAmounts)` → рассинхронизация |
| 4 | **Status filters** | ⚠️ | `CashFlow.gs` lines 22,47: hardcoded `"Yes"`,`"Paid"` (не константы); `Contracts.gs` line 105: hardcoded `"Paid"` в burndown; `Dashboard.gs` line 60: hardcoded `"Signed"`/`"Closed"` (не `SIGNED_STATUSES`) |
| 5 | **Unit integrity** | ❌ | `Units.Project ID` = полное имя ("Budva Residence"), не код ("P001") → join'ы сломаны; Unit ID передаётся в Payments→VAT join ✅, но до Units не доходит |
| 6 | **VAT correctness** | ✅ | Только `PAID_STATUS` expenses; только `CONFIRMED_YES` payments; `clearContent()` перед записью; batch write |
| 7 | **Idempotency** | ⚠️ | `updateContracts()`: нет `clearContents()` → stale data риск при удалении строк; `updatePaymentSchedule()`: нет `clearContents()` + N×`setValue()` в цикле |
| 8 | **Budget ↔ Contract gap** | ❌ | Card 8 не реализована. `generateBudgetVariance()` использует `project\|TOTAL` для всех категорий бюджета → Committed одинаков для всех строк проекта |
| 9 | **Payment Schedule logic** | ⚠️ | FIFO по due date ✅; Status Paid/Partial/Unpaid ✅; **нет Overdue флага**; **нет clearContents** перед записью; **N×setValue в цикле** |
| 10 | **Aging correctness** | ✅ | Читает из Payment Schedule; `diffDays < 0` → future payments исключены; `remaining <= 0` → пропуск; Buckets 0-30/31-60/61-90/90+ корректны |

---

## 3. Script Audit Summary

```
Main.gs:
  ✔ pipeline порядок корректен: VAT→Contracts→Payments→Schedule→Receivables→CashFlow→Dashboard→Burn→Aging
  ❌ generateBudgetVariance() НЕ вызывается — Card 13 не в pipeline
  ⚠️ typo в лог-метке: "updatePaymetnSchedule" (строка 6)

Config.gs:
  ✔ все листы определены, в т.ч. AGING, BUDJET_VARIANCE
  ⚠️ BUDJET_VARIANCE — опечатка в имени константы (BUDJET вместо BUDGET)

VAT.gs:
  ✔ Unit→Sales join для Project ID
  ✔ clearContent перед записью
  ✔ batch setValues
  ✔ только PAID_STATUS и CONFIRMED_YES

CashFlow.gs:
  ⚠️ line 22: "Yes" hardcoded вместо CONFIRMED_YES
  ⚠️ line 47: "Paid" hardcoded вместо PAID_STATUS
  ✔ clearContents перед записью
  ✔ batch setValues

Contracts.gs (updateContracts):
  ✔ PAID_STATUS константа используется
  ✔ guard для #N/A строк
  ❌ нет clearContents перед записью (stale data при уменьшении кол-ва контрактов)

Contracts.gs (generateContractBurndown):
  ⚠️ line 105: "Paid" hardcoded вместо PAID_STATUS
  ✔ clearContents перед записью
  ✔ batch setValues

Dashboard.gs (getProjectOverview):
  ❌ line 28: только "Construction" считается активным — не использует ACTIVE_PROJECT_STATUSES
  → P001 "Pause" НЕ считается активным на Dashboard

Dashboard.gs (getSalesStats / getExpenseStats / getCashStats / getCommittedCostStats):
  ✔ PAID_STATUS и CONFIRMED_YES используются корректно
  ✔ getCommittedCostStats вызывается внутри updateDashboard()

Dashboard.gs (getFutureIncome / getRemainingBudget / getCashGap):
  ✔ новая функциональность, логика корректна
  ⚠️ getRemainingBudget() line 304: hardcoded "Budget Variance" вместо SHEETS.BUDJET_VARIANCE

Payments.gs (allocatePayments):
  ✔ FIFO по contract date
  ✔ CONFIRMED_YES используется
  ✔ clearContents перед записью
  ✔ batch setValues

Payments.gs (updatePaymentSchedule):
  ✔ FIFO по due date
  ❌ нет clearContents перед записью
  ❌ N×setValue в цикле (lines 160-163) — должен быть batch setValues
  ❌ нет Overdue флага

Payments.gs (generateAging):
  ✔ читает из Payment Schedule (уже обновлённого)
  ✔ future payments исключены (diffDays < 0)
  ✔ remaining <= 0 → пропуск
  ✔ clearContents перед записью
  ✔ bucket логика корректна

Budjet.gs (generateBudgetVariance):
  ⚠️ NOT called in updateSystem() — не в pipeline!
  ❌ Committed column: project-level rollup для всех category строк (одно значение для всех)
  → без Budget↔Contract mapping (Card 8) это неверно
  ✔ Actual → только Paid expenses
  ✔ clearContents перед записью
  ✔ batch setValues

Receivables.gs:
  ✔ агрегация по сделке через Payment Allocations
  ✔ clearContents перед записью
  ✔ batch setValues

Utils.gs:
  ⚠️ checkSheets() отладочная функция всё ещё присутствует в production-коде
  ✔ formatMonth() делегируется к CashFlow.gs
  ✔ findClientValue() корректен

Triggers.gs:
  ✔ onEdit() триггер на ключевые листы
  ✔ setupTriggers() — ежедневный триггер 06:00 UTC
```

---

## 4. Critical Issues (Top 5)

### 🔴 CRITICAL-1: generateBudgetVariance() не в pipeline
**Файл:** `Main.gs`, `Budjet.gs`
**Проблема:** Card 13 считается закрытой, но `generateBudgetVariance()` НЕ вызывается в `updateSystem()`. Лист `Budget Variance` никогда не обновляется автоматически. Кроме того, `getRemainingBudget()` в `Dashboard.gs` читает этот лист — возвращает 0 или устаревшие данные.
**Риск:** Dashboard CashGap KPI (B18) всегда некорректен.
**Fix:** Добавить `_run("generateBudgetVariance", generateBudgetVariance)` в `updateSystem()` после `generateCashFlow`.

---

### 🔴 CRITICAL-2: getProjectOverview() не учитывает ACTIVE_PROJECT_STATUSES
**Файл:** `Dashboard.gs`, line 28
**Проблема:** `if (status === "Construction") active++` — P001 со статусом "Pause" не считается активным. Dashboard показывает Active=2 вместо Active=3.
**Риск:** Неверный Dashboard → неверные управленческие решения.
**Fix:** `if (ACTIVE_PROJECT_STATUSES.includes(status)) active++`

---

### 🔴 CRITICAL-3: Budget↔Contract mapping отсутствует (Card 8)
**Файл:** `Budjet.gs`
**Проблема:** `generateBudgetVariance()` вычисляет Committed как project-level rollup (`project|TOTAL`) и присваивает его ВСЕМ строкам бюджета проекта. Committed = одинаково для всех 29 категорий P001. Это архитектурно неверно.
**Риск:** Cost control полностью не работает.
**Fix:** Нужен маппинг Budget Category → Contract ID + rollup по контрактам.

---

### 🔴 CRITICAL-4: Payment data 20× mismatch (данные)
**Листы:** `Client Payments`, `Receivables`
**Проблема:** Client Payments суммируют ~120M+ для 5 клиентов, тогда как Sales = 6.05M. Receivables показывают отрицательный Outstanding (C001: -24.3M). Aging и Payment Allocations работают с заведомо неправильными данными.
**Риск:** Все клиентские KPI бессмысленны.
**Fix:** Ручная правка данных в `Client Payments`.

---

### ⚠️ CRITICAL-5: updatePaymentSchedule() — N×setValue + нет clearContents
**Файл:** `Payments.gs`, lines 150–163
**Проблема:** Для каждой строки расписания делается 3 отдельных вызова `setValue()`. При 50 строках = 150 API-вызовов → медленно, риск timeout. Нет `clearContents()` → при изменении данных старые значения могут остаться.
**Риск:** Производительность + data integrity.
**Fix:** Batch `setValues()` + `scheduleSheet.clearContents()` перед записью.

---

## 5. Recommendations

### 🔴 Immediate (исправить сейчас)

1. **Добавить `generateBudgetVariance()` в `updateSystem()`** — Card 13 иначе мертва
2. **Исправить `getProjectOverview()`** — `ACTIVE_PROJECT_STATUSES.includes(status)`
3. **Исправить данные в Client Payments** — платежи должны соответствовать суммам сделок
4. **Исправить `updatePaymentSchedule()`** — batch write + clearContents + Overdue flag
5. **Заменить hardcoded `"Paid"`/`"Yes"` в CashFlow.gs и Contracts.gs** на константы

### 🟡 Next iteration (следующий спринт)

6. **Реализовать Card 8** (Budget↔Contract mapping) — без этого Budget Variance всегда неверна
7. **Исправить typo в лог-метке** `"updatePaymetnSchedule"` → `"updatePaymentSchedule"` в Main.gs
8. **Исправить `getRemainingBudget()`** — использовать `SHEETS.BUDJET_VARIANCE` вместо hardcoded `"Budget Variance"`
9. **Удалить `checkSheets()`** из `Utils.gs` — отладочная функция в production-коде
10. **Добавить `clearContents()` в `updateContracts()`** — stale data риск

### 🔵 Future improvements

11. **Validation layer** — `Test.gs` с assertions: ratio платежей/продаж < 5×, overpay check, #N/A scan
12. **Унифицировать ключи** — Units.Project ID должен быть P001/P002/P003 (не полное имя)
13. **Schedule vs Receivables cross-check** — добавить проверку `SUM(Schedule.Remaining) == SUM(Receivables.Outstanding)` при каждом запуске
14. **SIGNED_STATUSES константа** в Dashboard.getSalesStats() и Receivables.gs вместо hardcoded
15. **Card 14** (Cost per sqm) — добавить в Budget Variance отчёт

---

## 6. Состояние таблицы (XLSX) — детальный аудит

> Таблица содержит **19 листов** (добавлены `Aging` и `Budget Variance` с Cards 12/13).

### 6.1 Лист `Projects` (3 строки данных)

| Project ID | Name | Status | Planned Budget | Planned Revenue | Sellable Area | Units |
|---|---|---|---|---|---|---|
| P001 | Budva Residence | **Pause** ⚠️ | 8,500,000 | 12,000,000 | 3,500 m² | 42 |
| P002 | Bar Residence | Construction | 129,000 | 1,500,000 | 2,000 m² | 12 |
| P003 | Ulcin Residence | Construction | 239,000 | 2,323,200 | 3,000 m² | 14 |

- **❌ Dashboard Active count = 2**, т.к. getProjectOverview() только считает "Construction" (BUG-21)

### 6.2 Лист `Units` (18 строк)

- 7 Sold, 4 Reserved, 7 Available
- ❗ Typo `"Pakinkg"` → "Parking" в 4 строках (U002, U005, U012, U017)
- ❗ Project ID = полное имя ("Budva Residence") вместо кода ("P001")

### 6.3 Лист `Sales` (5 записей)

- S001–S005, все Signed, Total = 6,050,000

### 6.4 Лист `Client Payments` (15 платежей)

- **🔴 ~120M+ при продажах 6M** — критическое несоответствие

### 6.5 Лист `Payment Allocations` (5 записей)

- FIFO allocations: 4.75M аллоцировано
- Остальные ~115M не аллоцированы — нет подходящих сделок

### 6.6 Лист `Budget` (29 категорий, только P001)

- Total Real ≈ 8,678,212; P002/P003 пусты

### 6.7 Лист `Contracts` (4 реальных + 11 пустых)

- D1: 100K Contract vs 400K paid → 400% overpay (CRITICAL)
- D5–D15: пустые (guard работает)

### 6.8 Лист `Expenses` (6 записей)

- Total Paid: 700,000 ✅

### 6.9 Лист `Receivables` (5 записей)

- C001–C004: Outstanding < 0 из-за 20× mismatch в платежах

### 6.10 Лист `Cash Flow` (5 месяцев)

- Dec 2025 – Apr 2026; данные корректны при текущих (нереальных) суммах

### 6.11 Лист `VAT`

- Project ID корректен: Unit→Sales join ✅

### 6.12 Лист `Dashboard`

- Текущая раскладка ячеек (после новых функций):
  - B2–B4: Projects Total/Active/Completed
  - B7–B9: Revenue/Cash received/Receivables
  - B12–B18: Budget/Contracts/Paid/Remaining + FutureIncome/RemainingBudget/CashGap
  - B21–B24: Bank balance/Inflow/Outflow/Net
  - B27–B30: Revenue/Expenses/Profit/ROI
  - B33–B35: VAT Incoming/Outgoing/Payable
  - B36–B39: Committed Total/Paid/Remaining/Execution%

### 6.13 Лист `Aging` (новый — Card 12)

- Генерируется `generateAging()`, читает Payment Schedule
- Колонки: Client ID, Client Name, Sale ID, Project, Total, 0-30, 31-60, 61-90, 90+
- Логика: только строки с remaining > 0 И dueDate в прошлом ✅

### 6.14 Лист `Budget Variance` (новый — Card 13)

- Генерируется `generateBudgetVariance()`, **НЕ вызывается в pipeline**
- Колонки: Project, Category, Budget, Actual, Committed, Variance, Variance%, Remaining Budget
- ⚠️ Committed = project-level total для всех категорий (неверно без Card 8)

---

## 7. Модули Apps Script — актуальное состояние (2026-05-05 rev 4)

| Файл | Функции | Статус | Найденные проблемы |
|---|---|---|---|
| `Config.gs` | `SHEETS`, константы | ✅ Актуален | Добавлены `AGING`, `BUDJET_VARIANCE`. Typo в имени константы `BUDJET_VARIANCE` |
| `Main.gs` | `updateSystem()`, `_run()` | ⚠️ Неполный | `generateBudgetVariance()` НЕ в pipeline; typo `"updatePaymetnSchedule"` в лог-метке |
| `Triggers.gs` | `onEdit()`, `setupTriggers()` | ✅ Готов | Ежедневный триггер 06:00 UTC |
| `VAT.gs` | `updateVAT()` | ✅ Корректен | Unit→Sales join; clearContent; batch write |
| `CashFlow.gs` | `generateCashFlow()`, `formatMonth()` | ⚠️ Регрессия | Hardcoded `"Yes"` и `"Paid"` вместо констант (BUG-15 не применён) |
| `Contracts.gs` | `updateContracts()`, `generateContractBurndown()` | ⚠️ Частично | Нет clearContents в updateContracts; `"Paid"` hardcoded в burndown (BUG-14 не применён) |
| `Dashboard.gs` | 6 блоков + getCommittedCost + getFutureIncome | ⚠️ Баг active count | `getProjectOverview()` только `"Construction"` считает активным (BUG-21 / BUG-16 не применён); `getRemainingBudget()` hardcoded sheet name |
| `Payments.gs` | `allocatePayments()`, `updatePaymentSchedule()`, `generateAging()` | ⚠️ Частично | updatePaymentSchedule: N×setValue, нет clearContents, нет overdue (BUG-18 не применён) |
| `Budjet.gs` | `generateBudgetVariance()` | ❌ Не в pipeline | Функция написана, но не вызывается; Committed column некорректен |
| `Receivables.gs` | `updateReceivables()` | ✅ Корректен | clearContents; batch write; per-sale aggregation |
| `Utils.gs` | `getMonth()`, `findClientValue()`, `checkSheets()` | ⚠️ Debug код | `checkSheets()` осталась в production-коде (BUG-19 не применён) |

---

## 8. Баги — актуальный список (rev 4)

### 🔴 Активные (не исправлены)

| ID | Файл | Описание | Приоритет |
|---|---|---|---|
| BUG-13 | `Main.gs` line 6 | Typo в лог-метке: `"updatePaymetnSchedule"` | Low |
| BUG-14 | `Contracts.gs` line 105 | Hardcoded `"Paid"` в burndown вместо `PAID_STATUS` | Medium |
| BUG-15 | `CashFlow.gs` lines 22,47 | Hardcoded `"Yes"` и `"Paid"` вместо констант | Medium |
| BUG-16 | `Dashboard.gs` line 28 | `getProjectOverview()` только `"Construction"` — P001 не Active | Critical |
| BUG-18 | `Payments.gs` lines 150–163 | N×setValue вместо batch; нет clearContents; нет Overdue | High |
| BUG-19 | `Utils.gs` lines 26–37 | Отладочная `checkSheets()` в production | Low |
| BUG-21 | `Main.gs` | `generateBudgetVariance()` не в `updateSystem()` | Critical |
| BUG-22 | `Dashboard.gs` line 304 | `getRemainingBudget()` hardcoded sheet name `"Budget Variance"` | Medium |
| BUG-23 | `Contracts.gs` | `updateContracts()` нет `clearContents()` → stale data | Medium |
| BUG-24 | `Budjet.gs` | Committed = project-level для всех категорий (неверно) | High |

### 🔴 Требует ручного исправления данных

| ID | Описание |
|---|---|
| BUG-04 | Contract D1: expenses 400K vs contract 100K |
| BUG-08 | Units.Project ID = полное имя вместо P001/P002/P003 |
| BUG-09 | Client Payments ~120M+ vs Sales 6M |
| BUG-25 | Typo "Pakinkg" → "Parking" в 4 строках Units |
| BUG-26 | P002/P003 Budget полностью пуст |

---

## 9. Соответствие ТЗ — актуальный статус (2026-05-05 rev 4)

| # | Модуль ТЗ | Статус | Комментарий |
|---|---|---|---|
| 1 | **Projects** | ⚠️ Частично | Данные есть. P001 "Pause" НЕ считается активным на Dashboard (BUG-16) |
| 2 | **Units Sales CRM** | ⚠️ Частично | 18 юнитов, 5 сделок. Typo. Units.Project ID сломан |
| 3 | **Client Payments** | ⚠️ Частично | 15 платежей. Нереальные суммы. Платёжный календарь и Aging ✅ |
| 4 | **Budget / Cost Control** | ⚠️ Частично | P001: 29 категорий. Budget Variance есть но не в pipeline и неверна |
| 5 | **Contractors / Contracts** | ⚠️ Частично | Write-back, burn-down работают. D1 overpay. Нет Budget↔Contract mapping |
| 6 | **Expenses / AP** | ⚠️ Частично | 6 расходов, все Paid. Нет forecast payables |
| 7 | **Banking / Treasury** | ⚠️ Каркас | 1 счёт, 350K EUR. CashGap KPI добавлен, но зависит от Budget Variance |
| 8 | **Cash Flow Engine** | ✅ Работает | 5 месяцев, корректная фильтрация |
| 9 | **VAT Module** | ✅ Работает | Unit→Sales join; идемпотентен |
| 10 | **KPI Dashboard** | ⚠️ Ошибки | Active count неверен (BUG-16); CashGap KPI сломан (BUG-21) |
| 11 | **Monthly Reporting** | ❌ Не реализовано | Cards 19-21 не начаты |
| 12 | **Automation / AI** | ❌ Не реализовано | Cards 25-29 в backlog |

---

## 10. Приложение: структура листов (19 листов на 2026-05-05 rev 4)

| Лист | Статус | Обновляется скриптом? |
|---|---|---|
| `Projects` | ✅ | Нет (ручной) |
| `Units` | ⚠️ Typo + key mismatch | Нет (ручной) |
| `Clients` | ✅ | Нет (ручной) |
| `Sales` | ⚠️ Мало данных | Нет (ручной) |
| `Client Payments` | ❌ 20× mismatch | Нет (ручной) |
| `Payment Allocations` | ⚠️ Данные искажены | ✅ `allocatePayments()` |
| `Payment Schedule` | ⚠️ Нет overdue флага | ✅ `updatePaymentSchedule()` |
| `Aging` | ✅ Новый | ✅ `generateAging()` |
| `Budget` | ⚠️ P002/P003 пусты | Нет (ручной) |
| `Contractors` | ⚠️ Тестовые данные | Нет (ручной) |
| `Contracts` | ⚠️ D1 overpay | ✅ `updateContracts()` |
| `Contract Burn` | ✅ | ✅ `generateContractBurndown()` |
| `Budget Variance` | ❌ Не обновляется | ⚠️ `generateBudgetVariance()` не вызывается |
| `Expenses` | ✅ | Нет (ручной) |
| `Receivables` | ⚠️ Отриц. Outstanding | ✅ `updateReceivables()` |
| `Bank Accounts` | ⚠️ Минимально | Нет (ручной) |
| `Cash Flow` | ✅ | ✅ `generateCashFlow()` |
| `VAT` | ✅ | ✅ `updateVAT()` |
| `Dashboard` | ⚠️ BUG-16, BUG-21 | ✅ `updateDashboard()` |
