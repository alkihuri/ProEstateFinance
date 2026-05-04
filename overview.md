# ProEstateFinance — Overview

> Последнее обновление: 2026-05-04 (rev 3). Аудит Cards 1–11 (все закрыты пользователем). Исправлены новые баги в скриптах. Создан Schema.gs.

---

## 0. Краткая сводка аудита

| Метрика | Значение |
|---|---|
| ✅ Карточек реально выполнено (подтверждено кодом) | **9 из 11** (Cards 1–7, 9, 10, 11) |
| ❌ Числятся выполненными, но НЕ реализованы | **1** (Card 8 — Budget↔Contract mapping) |
| ⚠️ Выполнены частично / с замечаниями данных | **1** (Card 5 — ручная часть не сделана) |
| 🐛 Новых багов найдено (rev 3) | **6** (все исправлены скриптами) |
| 🆕 Новые функции с прошлого аудита | `generateContractBurndown()` (Card 7), `updatePaymentSchedule()` (Card 11) |
| 🔧 Скриптов изменено (rev 3) | **6 файлов** + создан `Schema.gs` |

---

## 1. Аудит Trello Cards 1–11

> Пользователь отметил все Cards 1–11 как закрытые. Card 7 теперь реализована. Ниже — проверка по коду.

| Card | Название | Статус Trello | Статус по коду | Вердикт |
|---|---|---|---|---|
| **1** | Подключить VAT в pipeline | Closed | ✅ `updateVAT()` первым в `updateSystem()`, вызывается перед Dashboard | ✅ **ВЫПОЛНЕНО** |
| **2** | Починить VAT дубли | Closed | ✅ `clearContent()` перед записью в `VAT.gs` | ✅ **ВЫПОЛНЕНО** |
| **3** | Исправить Revenue logic | Closed | ✅ Фильтр `Signed`/`Closed`; ROI = profit/investment | ⚠️ **ЧАСТИЧНО** — данные платежей (~120M) несинхронизированы с продажами (6M), требует ручной правки |
| **4** | Вернуть фильтрацию CF | Closed | ✅ `CONFIRMED_YES` + `PAID_STATUS` активны в `CashFlow.gs` | ✅ **ВЫПОЛНЕНО** |
| **5** | Data cleanup | Closed | ✅ Скриптовая часть: guard в `updateContracts()` для #N/A строк | ⚠️ **ЧАСТИЧНО** — ручная часть не сделана (Typo "Pakinkg", P002/P003 бюджет пуст, D1 overpay) |
| **6** | Finish updateContracts() | Closed | ✅ Write-back paid/remaining/percent/status; guard для пустых строк | ✅ **ВЫПОЛНЕНО** |
| **7** | Contract burn-down tracking | Closed | ✅ `generateContractBurndown()` в `Contracts.gs`; лист `Contract Burn` в `Config.gs` | ✅ **ВЫПОЛНЕНО** |
| **8** | Budget ↔ Contract mapping | Closed | ❌ Нет mapping-таблицы, нет функции агрегации Budget→Contract в коде | ❌ **НЕ ВЫПОЛНЕНО** (отмечена закрытой ошибочно) |
| **9** | Committed Cost KPI | Closed | ✅ `getCommittedCostStats()` в `Dashboard.gs`; пишет в B33–B36 | ✅ **ВЫПОЛНЕНО** |
| **10** | Implement allocatePayments() | Closed | ✅ FIFO-аллокация; дубль удалён; `PAYMENT_ALLOCATION` исправлен | ✅ **ВЫПОЛНЕНО** |
| **11** | Payment Schedule module | Closed | ✅ `updatePaymentSchedule()` в `Payments.gs`; лист `Payment Schedule`; overdue-флаг добавлен (rev 3) | ✅ **ВЫПОЛНЕНО** |

---

## 2. Состояние таблицы (XLSX) — детальный аудит

> Таблица содержит **17 листов** (добавлены `Contract Burn` и `Payment Schedule`).

### 2.1 Лист `Projects` (3 строки данных)

| Project ID | Name | Status | Planned Budget | Planned Revenue | Sellable Area | Units |
|---|---|---|---|---|---|---|
| P001 | Budva Residence | **Pause** ⚠️ | 8,500,000 | 12,000,000 | 3,500 m² | 42 |
| P002 | Bar Residence | Construction | 129,000 | 1,500,000 | 2,000 m² | 12 |
| P003 | Ulcin Residence | Construction | 239,000 | 2,323,200 | 3,000 m² | 14 |

- ✅ **Исправлено**: `getProjectOverview()` теперь считает активными все `ACTIVE_PROJECT_STATUSES` (Construction, Active, **Pause**) → P001 корректно считается активным. Dashboard: Total=3, Active=3, Completed=0.
- **⚠️ Данные P002/P003**: Planned Budget 129K и 239K — слишком мало для строительных проектов. Вероятно, недозаполнены *(ручное)*

### 2.2 Лист `Units` (18 строк)

- **7 Sold**, 4 Reserved, 7 Available
- Все 18 юнитов имеют Type
- ❗ Typo: `"Pakinkg"` вместо `"Parking"` (4 юнита: U002, U005, U012, U014, U017) — *требует ручного исправления*
- Unit ID `U001–U018`, Project ID хранится как полное имя ("Budva Residence"), а не код ("P001") — *несоответствие ключей, требует ручного исправления*

### 2.3 Лист `Clients` (14 записей)

- C001–C014, все имеют Name, Phone, Email ✅

### 2.4 Лист `Sales` (5 активных записей)

| Sale ID | Client | Project | Unit | Price | Price/m² | Status |
|---|---|---|---|---|---|---|
| S001 | C001 | P001 | U001 | 1,200,000 | 2,000 | Signed |
| S002 | C002 | P001 | U002 | 950,000 | 1,900 | Signed |
| S003 | C003 | P001 | U003 | 1,500,000 | 2,100 | Signed |
| S004 | C004 | P002 | U010 | 1,100,000 | 1,800 | Signed |
| S005 | C005 | P002 | U011 | 1,300,000 | 2,000 | Signed |

- **Total contracted revenue: 6,050,000**
- S006–S019: пустые строки (шаблон)

### 2.5 Лист `Client Payments` (15 подтверждённых платежей)

- Итого подтверждённых платежей: **≈ 120,000,000+**
- **🔴 Критическая проблема данных**: платежи в 20× превышают суммы продаж — требует ручной правки

### 2.6 Лист `Payment Allocations` (5 записей)

- `allocatePayments()` отработал: 5 аллокаций по FIFO
- Общая аллоцированная сумма: **4.75M** (из-за несоответствия сумм остальные платежи не аллоцируются)

### 2.7 Лист `Budget` (29 категорий, только P001)

- ✅ P001: 29 категорий, все с Estimated и Real; Total Real ≈ **8,678,212**
- **P002/P003: данные отсутствуют** *(ручное)*
- ⚠️ B004 содержит текст вместо числовых данных (возможно, заголовок вставлен в данные)

### 2.8 Лист `Contractors` (3 записи)

- CTR1 (Дима), CTR2 (Слава), CTR3 (Мага) — минимальные тестовые данные

### 2.9 Лист `Contracts` (4 реальных + 11 с ошибками)

| Contract ID | Name | Amount | Paid | Remaining | % | Status |
|---|---|---|---|---|---|---|
| D1 | Rough works | 100,000 | 400,000 | -300,000 | 400% | Completed |
| D2 | Electrics | 120,000 | 100,000 | 20,000 | 83% | Active |
| D3 | Facade | 150,000 | 100,000 | 50,000 | 67% | Active |
| D4 | Electrics | 100,000 | 100,000 | 0 | 100% | Completed |
| D5–D15 | — | 0 | — | — | — | (пустые / guard) |

- **D1 overpay 400%** — требует ручной правки Contract Amount *(ручное)*
- **D5–D15**: скрипт теперь пишет пустые значения (guard работает)

### 2.10 Лист `Expenses` (6 записей)

- Total Paid: **700,000** ✅; все статусы "Paid"

### 2.11 Лист `Receivables` (5 записей)

- Расчёт по сделке через `Payment Allocations` ✅
- Добавлена колонка `Detailed info` (имя клиента + тип/номер юнита)
- ⚠️ Outstanding отрицательный (C001–C004) — следствие нереальных сумм платежей *(ручное)*

### 2.12 Лист `Bank Accounts`

- 1 счёт: ACC001, Main Account, CKB, EUR, **350,000** ✅

### 2.13 Лист `Cash Flow` (5 месяцев)

| Month | Income | Expense | Net | Closing | Balance OK |
|---|---|---|---|---|---|
| 2025-12 | 15,000,000 | 0 | 15,000,000 | 15,000,000 | TRUE |
| 2026-01 | 10,000,000 | 0 | 10,000,000 | 25,000,000 | TRUE |
| 2026-02 | 36,000,000 | 300,000 | 35,700,000 | 60,700,000 | TRUE |
| 2026-03 | 1,000,000 | 100,000 | 900,000 | 61,600,000 | TRUE |
| 2026-04 | 13,000,000 | 300,000 | 12,700,000 | 74,300,000 | TRUE |

- Месяцы хранятся как строки "yyyy-MM" ✅

### 2.14 Лист `VAT` (данные по проектам)

- Project ID теперь корректен: Unit→Sales join ✅
- Для расходов: P001, P002; для платежей: по проекту через unit

### 2.15 Лист `Dashboard`

- B2–B4: Projects (Total=3, Active=3 с учётом Pause, Completed=0) ✅
- B7–B9: Sales / Cash received / Receivables
- B12–B15: Budget / Contracts / Paid / Remaining
- B18–B21: Cash position
- B24–B27: Profitability / ROI
- B30–B32: VAT incoming / outgoing / payable
- B33–B36: Committed Cost (Total contracts / Paid / Remaining / Execution %)

### 2.16 Лист `Contract Burn` (новый — Card 7)

- Генерируется `generateContractBurndown()` из `Contracts.gs`
- Колонки: Month, Contract, Project, Amount, Monthly Paid, Paid To Date, Remaining, % Complete
- Строки по месяцам для каждого контракта с историей расходов

### 2.17 Лист `Payment Schedule` (новый — Card 11)

- Обновляется `updatePaymentSchedule()` из `Payments.gs`
- Колонки: ID, Sale ID, Client, Project, Due Date, Amount, **Paid**, **Remaining**, **Status**, **Overdue**
- FIFO-аллокация по installments; overdue-флаг по дате ✅

---

## 3. Модули Apps Script — детальное состояние (2026-05-04 rev 3)

| Файл | Функции | Статус | Примечания |
|---|---|---|---|
| `Config.gs` | `SHEETS`, константы | ✅ Актуален | Добавлены `CONTRACT_BURN`, `PAYMENT_SCHEDULE` |
| `Main.gs` | `updateSystem()`, `_run()` | ✅ Исправлен | ~~Typo "updatePaymetnSchedule"~~ исправлен; порядок: VAT→Contracts→Payments→Schedule→Receivables→CashFlow→Dashboard→Burn |
| `Triggers.gs` | `onEdit()`, `setupTriggers()` | ✅ Готов | Ежедневный триггер 06:00 UTC |
| `Schema.gs` | `COLS` карта | ✅ Создан | 0-based индексы всех 16 листов |
| `VAT.gs` | `updateVAT()` | ✅ Исправлен | Unit→Sales join для Project ID |
| `CashFlow.gs` | `generateCashFlow()`, `formatMonth()` | ✅ Исправлен | ~~hardcoded "Paid"/"Yes"~~ → `PAID_STATUS`/`CONFIRMED_YES` |
| `Contracts.gs` | `updateContracts()`, `generateContractBurndown()` | ✅ Исправлен | ~~hardcoded "Paid"~~ → `PAID_STATUS` в burndown |
| `Dashboard.gs` | 6 блоков KPI + `getCommittedCostStats()` | ✅ Исправлен | ~~only "Construction"~~ → `ACTIVE_PROJECT_STATUSES`; форматирование исправлено |
| `Payments.gs` | `allocatePayments()`, `updatePaymentSchedule()` | ✅ Улучшен | Overdue-флаг добавлен; batch write (было N вызовов setValue, стало 1 setValues) |
| `Receivables.gs` | `updateReceivables()` | ✅ Работает | Agregация по сделке; `Detailed info` колонка |
| `Utils.gs` | `getMonth()`, `findClientValue()`, `formatFixedWidth()` | ✅ Исправлен | Убран debug `checkSheets()`; исправлен отступ |

---

## 4. Баги — актуальный список (rev 3)

### ✅ Исправлено в rev 1–2 (предыдущая сессия)

| Баг | Файл | Что сделано |
|---|---|---|
| BUG-01: VAT показывал Client ID | `VAT.gs` | Unit→Sales join |
| BUG-02: Дублирование функции | `Payments.gs` | Заглушка удалена |
| BUG-03: Receivables по клиенту | `Receivables.gs` | Агрегация по сделке через Payment Allocations |
| BUG-05: Порядок вызовов в pipeline | `Main.gs` | VAT первым, Dashboard последним |
| BUG-06: Опечатка PAYMANET | `Config.gs` | PAYMENT_ALLOCATION |
| BUG-07: Contracts #N/A строки | `Contracts.gs` | Guard → пустые значения |
| BUG-10: getMonth() без zero-padding | `Utils.gs` | Делегирует к formatMonth() |
| BUG-11: Verifying тавтология | `CashFlow.gs` | closing >= 0 → Balance OK |
| BUG-12: getCommittedCostStats() вне Dashboard | `Dashboard.gs` | Перенесён внутрь updateDashboard() |

### ✅ Исправлено в rev 3 (текущая сессия)

| Баг | Файл | Что сделано |
|---|---|---|
| BUG-13: Опечатка в лог-метке `_run()` | `Main.gs` | "updatePaymetnSchedule" → "updatePaymentSchedule" |
| BUG-14: Hardcoded "Paid" в burndown | `Contracts.gs` | → `PAID_STATUS` |
| BUG-15: Hardcoded "Paid"/"Yes" в CashFlow | `CashFlow.gs` | → `PAID_STATUS`/`CONFIRMED_YES` |
| BUG-16: `getProjectOverview()` не учитывал "Pause" | `Dashboard.gs` | → `ACTIVE_PROJECT_STATUSES.includes()` |
| BUG-17: Форматирование кода в getSalesStats() | `Dashboard.gs` | Исправлены сломанные отступы |
| BUG-18: `updatePaymentSchedule()` без overdue + N*setValue | `Payments.gs` | Добавлен overdue-флаг; batch setValues |
| BUG-19: Debug `checkSheets()` в production коде | `Utils.gs` | Удалён |
| BUG-20: Schema.gs заявлен но отсутствовал | — | Создан с картой всех 16 листов |

### 🔴 Требует ручного исправления данных

| Баг | Описание |
|---|---|
| BUG-04 | Contract D1: expenses 400K vs contract 100K — исправить вручную |
| BUG-08 | Units.Project ID = полное имя вместо P001/P002/P003 |
| BUG-09 | Платежи клиентов ~120M+ vs продажи 6M — скорректировать данные |

---

## 5. Соответствие ТЗ — актуальный статус (2026-05-04 rev 3)

| # | Модуль ТЗ | Статус | Комментарий |
|---|---|---|---|
| 1 | **Projects** | ✅ Работает | 3 проекта. P001 "Pause" теперь считается активным. Нет инвестплана, фильтра KPI |
| 2 | **Units Sales CRM** | ⚠️ Частично | 18 юнитов, 5 сделок. Typo "Pakinkg". Нет aging receivables |
| 3 | **Client Payments** | ✅ Работает | 15 платежей. Нереалистичные суммы. Платёжный календарь ✅ |
| 4 | **Budget / Cost Control** | ⚠️ Частично | P001: 29 категорий. P002/P003 пусты. Нет variance analysis, cost/sqm |
| 5 | **Contractors / Contracts** | ✅ Улучшено | Write-back работает. Burn-down ✅. D1 overpay (ручное). Нет двух уровней budget↔contract |
| 6 | **Expenses / AP** | ⚠️ Частично | 6 расходов, все Paid. Нет forecast payables |
| 7 | **Banking / Treasury** | ⚠️ Каркас | 1 счёт, 350K EUR. Нет мультивалюты, liquidity |
| 8 | **Cash Flow Engine** | ✅ Работает | 5 месяцев корректных данных |
| 9 | **VAT Module** | ✅ Работает | Unit→Sales join; вызывается первым в pipeline |
| 10 | **KPI Dashboard** | ✅ Улучшен | Active count с учётом Pause. Committed Cost. Нет: Sales%, BudgetExec%, CostToComplete |
| 11 | **Monthly Reporting** | ❌ Не реализовано | — |
| 12 | **Automation / AI** | ❌ Не реализовано | — |

---

## 6. Итоговые таблицы статусов

### ✅ Реализовано и работает

| Функция | Файл | Подтверждение |
|---|---|---|
| VAT pipeline (первым) | `Main.gs` | `updateVAT()` → `_run()` order |
| VAT без дублей | `VAT.gs` | `clearContent()` перед записью |
| VAT корректный Project ID | `VAT.gs` | Unit→Sales join |
| Cash Flow фильтрация | `CashFlow.gs` | `CONFIRMED_YES` + `PAID_STATUS` |
| Cash Flow Balance OK | `CashFlow.gs` | `closing >= 0` |
| Contracts write-back | `Contracts.gs` | paid/remaining/percent/status + guard |
| Contract burn-down | `Contracts.gs` | `generateContractBurndown()` → лист `Contract Burn` |
| Committed Cost KPI | `Dashboard.gs` | `getCommittedCostStats()` → B33–B36 |
| Active projects (включая Pause) | `Dashboard.gs` | `ACTIVE_PROJECT_STATUSES.includes()` |
| Revenue фильтр | `Dashboard.gs` | Signed/Closed |
| ROI formula | `Dashboard.gs` | profit / totalInvestment |
| Payment Allocations (FIFO) | `Payments.gs` | `allocatePayments()` |
| Payment Schedule | `Payments.gs` | `updatePaymentSchedule()` + overdue + batch write |
| Receivables per sale | `Receivables.gs` | через Payment Allocations |
| Receivables Detailed info | `Receivables.gs` | имя клиента + тип/номер юнита |
| Schema.gs | `Schema.gs` | Карта колонок всех 16 листов |
| Scheduled trigger | `Triggers.gs` | `setupTriggers()` 06:00 UTC |
| Error handling | `Main.gs` | `_run()` try/catch |
| Именованные константы | `Config.gs` | VAT_RATE, PAID_STATUS, CONFIRMED_YES, SIGNED_STATUSES, ACTIVE_PROJECT_STATUSES |

### ⚠️ Требует ручного исправления данных

| Проблема | Что делать |
|---|---|
| Typo "Pakinkg" в Units | Исправить на "Parking" в 4 строках |
| Contract D1 overpay | Исправить Contract Amount D1 до 400K |
| Contracts D5–D15 #N/A | Удалить формулу / строки вручную |
| Payment amounts ~120M+ | Скорректировать суммы или добавить реальные сделки |
| Units.Project ID = полное имя | Заменить на P001/P002/P003 |
| P002/P003 Budget пуст | Заполнить категории и суммы |
| B004 в Budget — текст | Убрать строку-заголовок из данных |

### ❌ Не реализовано

| Функция | Card | Статус |
|---|---|---|
| Budget ↔ Contract mapping | Card 8 | ❌ Закрыта ошибочно — нет кода |
| Budget vs Actual variance | Card 13 | ❌ Не реализовано |
| Cost per sqm | Card 14 | ❌ Не реализовано |
| Cost To Complete | Card 15 | ❌ Не реализовано |
| Project filter selector | Card 16 | ❌ Не реализовано |
| Advanced KPIs (ROI, Sales%, BudgetExec%) | Card 17 | ❌ Частично (Committed Cost есть) |
| Liquidity forecast | Card 18 | ❌ Не реализовано |
| Monthly management report | Card 19 | ❌ Не реализовано |
| Aging receivables | Card 12 | ❌ Не реализовано |

---

## 7. Советы ИИ

### 7.1 Доработки по выполненным карточкам

**Cards 1, 2, 4, 6, 9, 10:** ✅ Полностью исправлены и работают

**Card 3 (Revenue):**
- *(Ручное)* Синхронизировать суммы в `Client Payments` с реальными ценами из `Sales`
- Код корректен: `getSalesStats()` считает только Signed/Closed сделки

**Card 5 (Data cleanup):**
- ✅ Скриптовая часть выполнена (guard для #N/A)
- *(Ручное)* Исправить Typo "Pakinkg", заполнить P002/P003 бюджет, исправить D1

**Card 7 (Burn-down):**
- ✅ `generateContractBurndown()` реализован
- Улучшение: добавить прогноз до конца (forecast remaining by % rate)

**Card 8 (Budget↔Contract mapping) — ПЕРЕОТКРЫТЬ:**
- Закрыта, но не реализована. Минимум: добавить в Contracts колонку "Budget Category", написать `buildBudgetContractMap()`

**Card 11 (Payment Schedule):**
- ✅ Полностью реализовано + overdue-флаг добавлен в rev 3
- Улучшение: добавить сводку просрочек на Dashboard (сколько клиентов overdue)

### 7.2 Какие карточки брать в работу следующими

| Приоритет | Card | Причина |
|---|---|---|
| 🔴 1 | **Переоткрыть Card 8** | Закрыта ошибочно, блокирует cost control |
| 🔴 2 | *(Ручное)* Исправить данные (BUG-09) | Receivables бессмысленны без правильных сумм |
| 🟡 3 | **Card 13** (Budget variance) | Зависит от Card 8 mapping |
| 🟡 4 | **Card 14** (Cost per sqm) | Простая метрика, быстро |
| 🟡 5 | **Card 12** (Aging receivables) | Нужны сначала правильные данные receivables |
| 🟡 6 | **Card 16** (Project filter) | Разблокирует многие KPI |
| 🔵 7 | **Card 15** (Cost to Complete) | Зависит от Card 7 ✅ + Card 13 |
| 🔵 8 | **Card 17** (Advanced KPIs) | ROI есть, нужны Sales%, BudgetExec% |
| 🔵 9 | **Card 18** (Liquidity forecast) | Зависит от Card 7 ✅ + Card 15 |
| 🔵 10 | **Card 19** (Monthly report) | Зависит от готовности данных |

### 7.3 Расхождения между ТЗ, таблицей и карточками

| Тип расхождения | Описание |
|---|---|
| **ТЗ требует — не реализовано** | Два уровня контрактов (budget items ↔ contract packages). Aging receivables (buckets). Liquidity position. Multiple currencies. |
| **Реализовано сверх ТЗ** | `Receivables` с Detailed info. `Payment Allocations` (FIFO). `Contract Burn`. `Payment Schedule` с overdue. `Schema.gs`. |
| **Карточки закрыты ошибочно** | Card 8 (Budget↔Contract mapping) — нет кода. |
| **Данные не соответствуют реальности** *(ручное)* | Платежи 120M+ vs продажи 6M. D1 overpay 400%. P002/P003 budget пуст. |

### 7.4 Предложения по улучшению процесса

1. **Не закрывать карточки без code review** — Card 8 закрыта без единой строки кода.
2. **Data integrity check** — добавить скрипт-валидатор: ratio платежей/продаж, overpay flag, #N/A сканер.
3. **Унифицировать ключи** — Units.Project ID должен быть P001/P002/P003.
4. **Добавить Dashboard overdue summary** — сколько installments просрочено, сумма просрочки.
5. **Регрессионные тесты** — `Test.gs` с assertions после каждого изменения скриптов.

---

## Приложение: структура листов (17 листов на 2026-05-04 rev 3)

| Лист | Строк данных | Статус | Обновляется скриптом? |
|---|---|---|---|
| `Projects` | 3 | ✅ Заполнен | Нет (ручной) |
| `Units` | 18 | ⚠️ Typo "Pakinkg" | Нет (ручной) |
| `Clients` | 14 | ✅ Заполнен | Нет (ручной) |
| `Sales` | 5 (Signed) | ⚠️ Мало сделок | Нет (ручной) |
| `Client Payments` | 15 | ⚠️ Суммы нереальны | Нет (ручной) |
| `Payment Allocations` | 5 | ✅ Заполнен | ✅ `allocatePayments()` |
| `Payment Schedule` | — | ✅ Новый | ✅ `updatePaymentSchedule()` |
| `Budget` | 29 (P001 only) | ⚠️ P002/P003 пусты | Нет (ручной) |
| `Contractors` | 3 | ⚠️ Тестовые данные | Нет (ручной) |
| `Contracts` | 4+11(#N/A) | ⚠️ D1 overpay | ✅ `updateContracts()` |
| `Contract Burn` | — | ✅ Новый | ✅ `generateContractBurndown()` |
| `Expenses` | 6 | ✅ Заполнен | Нет (ручной) |
| `Receivables` | 5 | ⚠️ Отриц. Outstanding | ✅ `updateReceivables()` |
| `Bank Accounts` | 1 | ⚠️ Минимально | Нет (ручной) |
| `Cash Flow` | 5 | ✅ Обновляется | ✅ `generateCashFlow()` |
| `VAT` | 16 | ✅ Исправлен | ✅ `updateVAT()` |
| `Dashboard` | KPI cells | ✅ Обновляется | ✅ `updateDashboard()` |
