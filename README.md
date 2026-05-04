# ProEstateFinance — Система финансового управления девелоперскими проектами

> Версия документации: 2026-05-04 rev 3 | Создан для передачи другой ИИ-сетке

---

## 1. Назначение системы

ProEstateFinance — это lightweight ERP для строительного девелопера на базе Google Sheets + Apps Script. Система обеспечивает в режиме реального времени: учёт поступлений от клиентов и выплат подрядчикам, контроль бюджета по проектам, мониторинг дебиторской задолженности, расчёт НДС и формирование KPI-дашборда. Главный принцип: за 30 секунд понять — сколько денег пришло, сколько ушло, кто должен заплатить, сколько нужно до завершения и зарабатывает ли проект.

---

## 2. Структура данных

### 2.1 Листы таблицы (всего 17)

| Лист | Назначение | Заполняется |
|---|---|---|
| `Projects` | Реестр проектов | Вручную |
| `Units` | Квартиры, паркинги, коммерция | Вручную |
| `Clients` | База клиентов | Вручную |
| `Sales` | Сделки продажи | Вручную |
| `Client Payments` | Платежи от клиентов | Вручную |
| `Payment Allocations` | Распределение платежей по сделкам | `allocatePayments()` |
| `Payment Schedule` | График платежей с overdue-флагом | `updatePaymentSchedule()` |
| `Budget` | Смета по статьям | Вручную |
| `Contractors` | База подрядчиков | Вручную |
| `Contracts` | Договоры с подрядчиками | Вручную + `updateContracts()` |
| `Contract Burn` | Burn-down освоения по контрактам | `generateContractBurndown()` |
| `Expenses` | Расходы/платежи подрядчикам | Вручную |
| `Receivables` | Дебиторская задолженность | `updateReceivables()` |
| `Bank Accounts` | Банковские счета | Вручную |
| `Cash Flow` | Ежемесячный денежный поток | `generateCashFlow()` |
| `VAT` | НДС входящий и исходящий | `updateVAT()` |
| `Dashboard` | KPI-панель | `updateDashboard()` |

### 2.2 Схема колонок ключевых листов

Полная карта индексов — в `Schema.gs` (`COLS.SHEET_NAME.COLUMN_NAME`).

**Projects** (строки 2+):
- [0] Project ID (P001, P002, P003)
- [1] Name
- [2] Status ("Construction" | "Active" | "Pause" | "Completed")
- [3] Start Date, [4] End Date
- [5] Planned Budget, [6] Planned Revenue, [7] Sellable Area m², [8] Units Count

**Units** (строки 2+):
- [0] Unit ID (U001–U018), [1] Project ID, [2] Type, [3] Number, [4] Floor, [5] Area, [6] Status

**Sales** (строки 2+):
- [0] Sale ID, [1] Client ID, [2] Project ID, [3] Unit ID, [4] Price
- [5] Price/m², [6] Reserve Date, [7] Contract Date, [8] Status ("Signed" | "Closed")

**Client Payments** (строки 2+):
- [0] Payment ID, [1] Date, [2] Client ID, [3] Unit ID, [4] Info
- [5] Amount, [6] Method, [7] Reference, [8] Confirmed (TRUE | "Yes")

**Expenses** (строки 2+):
- [0] ID, [1] Date, [2] Project ID, [3] Contractor ID, [4] Contract ID
- [5] Category, [6] Amount, [7] Status ("Paid"), [8] Payment Date, [9] Verification

**Contracts** (строки 2+):
- [0] Contract ID, [1] Project ID, [2] Contractor, [3] Name, [4] Amount (ручной)
- [5] Paid, [6] Remaining, [7] % Complete, [8] Status — **col 5–8 пишет скрипт**

**Payment Schedule** (строки 2+):
- [0] ID, [1] Sale ID, [2] Client, [3] Project, [4] Due Date, [5] Amount (ручные)
- [6] Paid, [7] Remaining, [8] Status, [9] Overdue — **col 6–9 пишет скрипт**

### 2.3 Связи между листами

```
Projects ──────────────── Sales ──────────────── Client Payments
    │                      │                           │
    └── Units ─────────────┘                    Payment Allocations
                                                       │
    Contractors ── Contracts ──── Expenses             └── Receivables
                        │                              └── Payment Schedule
                   Contract Burn
                        │
                   Dashboard ← VAT ← Expenses + Payments
                             ← Cash Flow ← Expenses + Payments
```

**Ключевые join'ы в скриптах:**
- `VAT.gs`: `unitProjectMap[unit] = project` (Sales → VAT для платежей)
- `Receivables.gs`: `saleAllocated[saleId]` (Payment Allocations → Receivables)
- `Contracts.gs`: `contractPayments[contractId]` (Expenses → Contracts)
- `Dashboard.gs`: читает обновлённые листы VAT, Contracts, Budget, Payments, Expenses

---

## 3. Ключевые бизнес-правила и формулы

### Константы (Config.gs)
```js
VAT_RATE = 21 / 121          // НДС 21% от суммы с НДС
PAID_STATUS = "Paid"          // статус оплаченного расхода
CONFIRMED_YES = "Yes"         // подтверждённый платёж (также: TRUE)
SIGNED_STATUSES = ["Signed", "Closed"]          // активные сделки
ACTIVE_PROJECT_STATUSES = ["Construction", "Active", "Pause"]  // активные проекты
```

### Расчёты в скриптах

**Payment Allocation (FIFO):**
- Платёж клиента → распределяется на сделки клиента в порядке даты договора
- Каждая сделка получает до своей полной суммы, остаток идёт на следующую

**Cash Flow:**
- Income = подтверждённые платежи клиентов (`Confirmed = TRUE/"Yes"`)
- Expense = расходы со статусом `"Paid"` (по Payment Date)
- Opening balance = Closing предыдущего месяца
- Balance OK = `closing >= 0`

**VAT:**
- Incoming VAT (от подрядчиков) = Amount × 21/121, только Paid расходы
- Outgoing VAT (от клиентов) = Amount × 21/121, только Confirmed платежи
- Project ID платежей = через Unit→Sales join

**Committed Cost:**
- Total Contracts = sum(Contracts.Amount)
- Remaining = sum(Contracts.Remaining)
- Budget Execution % = Total Contracts / Total Budget Real

**Contract Burn-down:**
- По каждому контракту: нарастающий итог выплат по месяцам
- Remaining = Contract Amount - cumulative paid
- % Complete = cumulative / Contract Amount

**Payment Schedule:**
- FIFO-аллокация аллоцированных сумм по сделке → installments по дате due
- Overdue = due_date < today AND status != "Paid"
- Запись: batch setValues (4 колонки за один вызов)

---

## 4. Текущее состояние реализации

### ✅ Выполнены (проверено кодом): Cards 1–7, 9, 10, 11

| Card | Функция | Скрипт |
|---|---|---|
| 1 | VAT в pipeline | `updateVAT()` первым в `updateSystem()` |
| 2 | VAT без дублей | `clearContent()` в `VAT.gs` |
| 3 | Revenue logic | `getSalesStats()` — Signed/Closed + ROI |
| 4 | Cash Flow фильтрация | `generateCashFlow()` — confirmed + paid only |
| 5 | Data cleanup | Guard в `updateContracts()` |
| 6 | updateContracts() | Write-back paid/remaining/percent/status |
| 7 | Contract burn-down | `generateContractBurndown()` → Contract Burn |
| 9 | Committed Cost KPI | `getCommittedCostStats()` → B33–B36 |
| 10 | allocatePayments() | FIFO → Payment Allocations |
| 11 | Payment Schedule | `updatePaymentSchedule()` + overdue + batch write |

### ❌ Не выполнена: Card 8 (Budget↔Contract mapping)

Карточка отмечена как закрытая, но код не написан. Нужно: создать mapping-таблицу Budget Category → Contract.

### 🔄 Не начаты: Cards 12–19

Budget variance (13), Cost per sqm (14), Cost To Complete (15), Project filter (16), Advanced KPIs (17), Liquidity forecast (18), Monthly report (19), Aging receivables (12).

---

## 5. Известные проблемы и несоответствия

### Критические (данные)
1. **Платежи ~120M vs продажи 6M** — суммы в `Client Payments` в 20× больше цен в `Sales`; Receivables показывают отрицательный Outstanding — требует ручной правки
2. **Contract D1 overpay 400%** — Expenses по D1 = 400K, но Contract Amount = 100K
3. **Units.Project ID = полное имя** ("Budva Residence" вместо "P001") — ломает join'ы

### Данные (ручное исправление)
- Typo "Pakinkg" → "Parking" в Units (4 строки)
- Contracts D5–D15: `#N/A` в Project ID (формула VLOOKUP) — удалить строки вручную
- Budget P002/P003 пуст — добавить статьи
- P002/P003 Planned Budget (129K, 239K) нереалистично мал

### Архитектурные
- Card 8 (Budget↔Contract mapping) закрыта без реализации
- Нет двух уровней контрактов (budget items ↔ contract packages) — требует ТЗ
- Нет мультивалютности (только EUR)
- Нет project filter на Dashboard — все KPI суммарные

---

## 6. Инструкция для следующего ИИ

Ты получил этот readme. Действуй так:

### Шаг 1 — Сверка документации
1. Прочитай `TECHNICAL_DESCRIPTION.txt` — это исходное ТЗ
2. Сверь с этим README: нет ли расхождений в структуре листов или формулах
3. Прочитай `overview.md` — там детальный аудит с историей багов и текущим статусом

### Шаг 2 — Проверка данных
1. Открой `CURRETN_SHEETS_STATE.xlsx` (опечатка в имени файла!)
2. Проверь: есть ли листы `Contract Burn` и `Payment Schedule` (появились в Cards 7, 11)
3. Проверь суммы в `Client Payments` vs `Sales` — ratio должен быть < 5×; если > 10× — данные неправильные
4. Проверь `Contracts` D5–D15 — там должны быть пустые значения или строки удалены

### Шаг 3 — Проверка скриптов
1. Открой `Config.gs` — проверь, что `SHEETS` содержит все 17 листов
2. Открой `Main.gs` — проверь порядок: VAT первым, Dashboard последним, нет опечаток в `_run()`
3. Открой `Schema.gs` — если файл отсутствует, создай его заново по шаблону в разделе 2.2
4. Проверь константы: `PAID_STATUS`, `CONFIRMED_YES`, `ACTIVE_PROJECT_STATUSES` используются везде (не строковые литералы)

### Шаг 4 — Карточки к работе
1. Прочитай `TRELLO_CARDS.md`
2. **Первое**: переоткрыть Card 8 (Budget↔Contract mapping) — она закрыта ошибочно
3. **Второе**: исправить данные вручную (BUG-09: платежи vs продажи)
4. **Третье**: реализовать Card 13 (Budget vs Actual variance)
5. Следуй приоритетному порядку из `overview.md` раздел 7.2

### Ключевые предостережения
- **Не трогай** ручные листы (Projects, Units, Clients, Sales, Client Payments, Budget, Contractors, Expenses, Bank Accounts) — они заполняются пользователем
- **Скриптовые листы** (Payment Allocations, Payment Schedule, Contract Burn, Receivables, Cash Flow, VAT, Dashboard) — перезаписываются каждый запуск `updateSystem()`
- **`updateSystem()` порядок важен**: VAT → Contracts → allocatePayments → updatePaymentSchedule → updateReceivables → generateCashFlow → updateDashboard → generateContractBurndown
- Перед изменением скриптов убедись, что `Schema.gs` существует
- Все новые hardcoded строки ("Paid", "Yes", "Signed") заменяй константами из `Config.gs`
