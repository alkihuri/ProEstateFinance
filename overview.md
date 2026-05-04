# ProEstateFinance — Overview

> Последнее обновление: 2026-05-04 (rev 2). Исправлены BUG-01—BUG-03, BUG-05—BUG-07, BUG-10—BUG-12 в скриптах. Добавлены: `Schema.gs`, `setupTriggers()`, именованные константы.

---

## 0. Краткая сводка аудита

| Метрика | Значение |
|---|---|
| ✅ Карточек реально выполнено (подтверждено кодом И таблицей) | **6 из 10** (Cards 1, 2, 4, 6, 9, частично 10) |
| ❌ Числятся выполненными, но НЕ реализованы | **1** (Card 8 — Budget↔Contract mapping) |
| ⚠️ Выполнены частично / с замечаниями | **3** (Cards 3, 5, 10) |
| 🔴 Открытая карточка (Card 7) блокирует | Cards 15, 17, 18 |
| 🐛 Багов найдено | **12** (исправлено скриптами: **9**, требует ручных данных: **3**) |
| 🔧 Скриптов изменено | **10 файлов** + создан `Schema.gs` |

---

## 1. Аудит Trello Cards 1–10

> Пользователь отметил Cards 1–6, 8, 9, 10 как закрытые. Card 7 — открытая. Ниже — проверка по коду и XLSX.

| Card | Название | Статус | Код | XLSX | Вердикт |
|---|---|---|---|---|---|
| **1** | Подключить VAT в pipeline | Closed | ✅ `updateVAT()` вызывается в `updateSystem()` (строка 5 `Main.gs`) | ✅ Лист `VAT` содержит 16 строк данных | ✅ **ВЫПОЛНЕНО** |
| **2** | Починить VAT дубли | Closed | ✅ `clearContent()` перед записью (`VAT.gs` стр.12) | ✅ Нет дублей в `VAT` | ✅ **ВЫПОЛНЕНО** |
| **3** | Исправить Revenue logic | Closed | ✅ Фильтр `Signed`/`Closed`, ROI = profit/investment | ⚠️ Sales: 5 сделок × 1–1.5M = **6.05M** договорная выручка. Платежи от клиентов = **120M+**. Несоответствие в 20× — данные несинхронизированы | ⚠️ **ЧАСТИЧНО** |
| **4** | Вернуть фильтрацию CF | Closed | ✅ `confirmed==true/"Yes"` + `status=="Paid"` активны | ✅ `Cash Flow`: 5 месяцев корректных данных | ✅ **ВЫПОЛНЕНО** |
| **5** | Data cleanup | Closed | N/A | ⚠️ Units: все 18 имеют Type, но есть опечатка "**Pakinkg**". Budget P002/P003: **по-прежнему пусты**. Contracts: D5–D15 содержат **`#N/A`** (ошибка формулы). | ⚠️ **ЧАСТИЧНО** |
| **6** | Finish updateContracts() | Closed | ✅ Write-back в листе, статусы — строки `"Completed"/"Active"`, мёртвый код убран | ⚠️ D1: Contract=100K, Paid=400K → **400% освоения** (данные ошибочны). D5–D15: `#N/A` в Project ID. | ⚠️ **ВЫПОЛНЕНО с ошибками данных** |
| **7** | Contract burn-down tracking | **Open** | ❌ Нет функции burn-down, нет Dashboard-виджета | ❌ Нет отдельного листа/визуализации | ❌ **НЕ ВЫПОЛНЕНО** |
| **8** | Budget ↔ Contract mapping | Closed | ❌ Нет mapping-таблицы, нет функции агрегации Budget→Contract | ❌ Нет соответствующего листа в таблице | ❌ **НЕ ВЫПОЛНЕНО В КОДЕ** (отмечена закрытой ошибочно) |
| **9** | Committed Cost KPI | Closed | ✅ `getCommittedCostStats()` добавлена в `Dashboard.gs`, вызывается из `updateSystem()`, пишет в B33–B36 | ✅ Contracts: sum(D1–D4) = 470K, paid/remaining подсчитаны | ✅ **ВЫПОЛНЕНО** |
| **10** | Implement allocatePayments() | Closed | ⚠️ Реализовано, но в файле **две функции `allocatePayments()`** (дублирование — первая — заглушка, вторая — рабочая). Typo в константе: `PAYMANET_ALLOCATION` вместо `PAYMENT_ALLOCATION`. | ✅ Лист `Payment Allocations`: 5 записей. Но из-за несоответствия сумм большинство платежей не аллоцируется. | ⚠️ **ВЫПОЛНЕНО с багами** |

---

## 2. Состояние таблицы (XLSX) — детальный аудит

> Таблица содержит **15 листов**. Ниже — построчный анализ данных.

### 2.1 Лист `Projects` (3 строки данных)

| Project ID | Name | Status | Planned Budget | Planned Revenue | Sellable Area | Units |
|---|---|---|---|---|---|---|
| P001 | Budva Residence | **Pause** ⚠️ | 8,500,000 | 12,000,000 | 3,500 m² | 42 |
| P002 | Bar Residence | Construction | 129,000 | 1,500,000 | 2,000 m² | 12 |
| P003 | Ulcin Residence | Construction | 239,000 | 2,323,200 | 3,000 m² | 14 |

**⚠️ P001 статус "Pause"**: `getProjectOverview()` считает активными только `"Construction"` → P001 **не считается активным** проектом. На Dashboard: Total=3, Active=2, Completed=0 (некорректно для P001, который явно работает).

**⚠️ Данные P002/P003 выглядят неправдоподобно**: Planned Budget P002 = 129,000, P003 = 239,000 — слишком мало для строительных проектов. Вероятно, недозаполнены.

### 2.2 Лист `Units` (18 строк)

- **7 Sold**, 4 Reserved, 7 Available
- Все 18 юнитов имеют Type (Card 5 выполнена для Units)
- ❗ Typo: `"Pakinkg"` вместо `"Parking"` (4 юнита: U002, U005, U012, U014, U017)
- Unit ID формат: `U001–U018`, Project ID ссылается на имя проекта ("Budva Residence"), а не ID ("P001") — **несоответствие ключей** (Sales использует P001, Units — полное имя)

### 2.3 Лист `Clients` (14 записей)

- C001–C014, все имеют Name, Phone, Email
- ✅ Лист заполнен (ранее считался пустым)

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
- ❗ Sales ссылаются на Unit ID (U001, U002...), но в Units Unit ID "Budva Residence" — разные системы ключей

### 2.5 Лист `Client Payments` (15 подтверждённых платежей)

Итого по всем подтверждённым платежам: **≈ 120,000,000+** (суммы отдельных платежей от 1M до 20M)

**🔴 КРИТИЧЕСКАЯ ПРОБЛЕМА**: Суммы платежей в 20× превышают суммы продаж. Пример:
- C001 заплатил: 10M + 3M + 1.5M + 1M + 10M = **25.5M**, но купил за **1.2M**
- Это делает Receivables/Allocations некорректными

❗ P012 (C003, 2M): поле `Reference` заполнено "Yes" вместо `Confirmed` — возможный сдвиг колонок для этой строки.

### 2.6 Лист `Payment Allocations` (5 записей)

- Скрипт `allocatePayments()` отработал: 5 аллокаций записаны
- Общая аллоцированная сумма: 1.2M + 0.95M + 1.1M + 1.0M + 0.5M = **4.75M**
- Из-за несоответствия сумм оставшиеся ~115M не аллоцированы ни к одной сделке (нет подходящих Sale с большим балансом)

### 2.7 Лист `Budget` (29 категорий, только P001)

- ✅ P001: 29 категорий работ (I–XXIX), все с Estimated и Real
- **P002/P003: данные отсутствуют** (Card 5 не выполнена для бюджета)
- Total Real ≈ **8,678,212** (сумма col 7 по всем строкам P001)
- ⚠️ B004 содержит текст "ESTIMATED / REAL / BALANCE" в числовых полях (возможно итоговая строка или заголовок вставлен в данные)

### 2.8 Лист `Contractors` (3 записи)

| ID | Name |
|---|---|
| CTR1 | Дима |
| CTR2 | Слава |
| CTR3 | Мага |

- Минимальные данные, Phone = "911" — тестовые данные

### 2.9 Лист `Contracts` (4 реальных + 11 с ошибками)

| Contract ID | Contractor | Name | Amount | Paid | Remaining | % | Status |
|---|---|---|---|---|---|---|---|
| D1 | CTR1 | Rough works | 100,000 | 400,000 | -300,000 | 400% | Completed |
| D2 | CTR2 | Electrics | 120,000 | 100,000 | 20,000 | 83% | Active |
| D3 | CTR3 | Facade | 150,000 | 100,000 | 50,000 | 67% | Active |
| D4 | CTR1 | Electrics | 100,000 | 100,000 | 0 | 100% | Completed |
| D5–D15 | — | — | 0 | 0 | 0 | — | Active |

**🔴 D1: OVERPAY 400%** — Expenses по D1: EX1(100K) + EX3(200K) + EX4(100K) = 400K vs контракт 100K. Либо Contract Amount занижен, либо расходы ошибочны.

**🔴 D5–D15: ошибка `#N/A`** в колонке Project ID — формула ссылается на несуществующие данные. `getCommittedCostStats()` читает `row[4]` (Amount=0) — не влияет на суммы, но засоряет лист.

### 2.10 Лист `Expenses` (6 записей)

| EX | Project | Contract | Category | Amount | Status | Payment Date |
|---|---|---|---|---|---|---|
| EX1 | P001 | D1 | II ZEMLJANI RADOVI | 100,000 | Paid | 46065 |
| EX2 | P002 | D2 | III BETONSKI... | 100,000 | Paid | 46084 |
| EX3 | P001 | D1 | II ZEMLJANI RADOVI | 200,000 | Paid | 46065 |
| EX4 | P001 | D1 | I PRIPREMNI RADOVI | 100,000 | Paid | 46129 |
| EX5 | P002 | D3 | VI ZIDARSKI RADOVI | 100,000 | Paid | 46131 |
| EX6 | P001 | D4 | I PRIPREMNI RADOVI | 100,000 | Paid | 46132 |

- Total Paid: **700,000** ✅
- Все статусы "Paid" — нормализованы (Card 5 выполнена для Expenses)
- ⚠️ EX5 ссылается на D3, но D3 = CTR3 "Facade", а EX5 категория "VI ZIDARSKI RADOVI" — несоответствие контракт/категория

### 2.11 Лист `Receivables` (5 записей)

| Client | Project | Unit | Sale | Paid | Outstanding | Status |
|---|---|---|---|---|---|---|
| C001 | P001 | U001 | 1,200,000 | 25,500,000 | **-24,300,000** | Paid |
| C002 | P001 | U002 | 950,000 | 21,000,000 | **-20,050,000** | Paid |
| C003 | P001 | U003 | 1,500,000 | 6,000,000 | **-4,500,000** | Paid |
| C004 | P002 | U010 | 1,100,000 | 4,500,000 | **-3,400,000** | Paid |
| C005 | P002 | U011 | 1,300,000 | 0 | 1,300,000 | Unpaid |

**🔴 Отрицательный Outstanding** — следствие неправильных сумм платежей (платежи клиентов в 10-20× больше цен продаж). Агрегация платежей по клиенту (не по сделке) даёт неверную дебиторку.

### 2.12 Лист `Bank Accounts`

- 1 счёт: ACC001, Main Account, CKB, EUR, **350,000** ✅
- Дата обновления: 01.04.2026

### 2.13 Лист `Cash Flow` (5 месяцев)

| Month (Excel date) | Month (реальный) | Income | Expense | Net | Closing |
|---|---|---|---|---|---|
| 45992 | Dec 2025 | 15,000,000 | 0 | 15,000,000 | 15,000,000 |
| 46023 | Jan 2026 | 10,000,000 | 0 | 10,000,000 | 25,000,000 |
| 46054 | Feb 2026 | 36,000,000 | 300,000 | 35,700,000 | 60,700,000 |
| 46082 | Mar 2026 | 1,000,000 | 100,000 | 900,000 | 61,600,000 |
| 46113 | Apr 2026 | 13,000,000 | 300,000 | 12,700,000 | 74,300,000 |

**⚠️ Колонка Month хранит Excel serial dates**, а не строки "yyyy-MM". Google Sheets автоматически конвертирует строку "2025-12" в дату при записи скриптом.

### 2.14 Лист `VAT` (16 строк)

- VAT данные есть, очистка перед записью работает (нет дублей)
- **🔴 BUG**: В колонке "Project ID" для платежей клиентов стоят **Client ID** (C001, C002...) вместо Project ID. Причина: `VAT.gs` строка `const project = row[2]` — для `Client Payments` `row[2]` это Client, не Project.
- Для расходов (P001, P002) — правильно, т.к. `Expenses.row[2]` = Project

### 2.15 Лист `Dashboard`

- Обновляется скриптом (ячейки B2–B36)
- Новые KPI: B33 (Total Contracts), B34 (Total Paid), B35 (Total Remaining), B36 (Budget Execution %) — добавлены Card 9

---

## 3. Модули Apps Script — детальное состояние (2026-05-04)

| Файл | Функция | Статус | Проблемы |
|---|---|---|---|
| `Config.gs` | Реестр `SHEETS` + константы | ✅ Исправлен | ~~Typo PAYMANET~~ → `PAYMENT_ALLOCATION`. Добавлены: `VAT_RATE`, `PAID_STATUS`, `CONFIRMED_YES`, `SIGNED_STATUSES`, `ACTIVE_PROJECT_STATUSES` |
| `Main.gs` | `updateSystem()` | ✅ Исправлен | ~~Неверный порядок~~ → VAT первым, Dashboard последним. Добавлен `_run()` с try/catch. `getCommittedCostStats()` убран отсюда (перенесён в updateDashboard) |
| `Triggers.gs` | `onEdit()` + `setupTriggers()` | ✅ Улучшен | Добавлен `setupTriggers()` — ежедневный триггер на 06:00 UTC |
| `Dashboard.gs` | 6 + 1 блоков KPI | ✅ Исправлен | ~~BUG-12~~: `getCommittedCostStats()` теперь вызывается внутри `updateDashboard()`. Строковые литералы → именованные константы |
| `CashFlow.gs` | `generateCashFlow()` | ✅ Исправлен | ~~BUG-11~~: Verifying → `Balance OK` (`closing >= 0`) |
| `Contracts.gs` | `updateContracts()` | ✅ Улучшен | ~~BUG-07~~: Добавлен guard для пустых строк и строк с `#N/A`. Использует `PAID_STATUS` |
| `Payments.gs` | `allocatePayments()` | ✅ Исправлен | ~~BUG-02~~: Удалена заглушка-дубль. ~~BUG-06~~: `PAYMANET_ALLOCATION` → `PAYMENT_ALLOCATION`. Использует `CONFIRMED_YES` |
| `VAT.gs` | `updateVAT()` | ✅ Исправлен | ~~BUG-01~~: Project ID теперь определяется через Unit→Sales join. Использует `VAT_RATE`, `PAID_STATUS`, `CONFIRMED_YES` |
| `Receivables.gs` | `updateReceivables()` | ✅ Исправлен | ~~BUG-03~~: Агрегация платежей ПО СДЕЛКЕ через `Payment Allocations` (не по клиенту) |
| `Utils.gs` | `getMonth()`, `findClientValue()` | ✅ Исправлен | ~~BUG-10~~: `getMonth()` делегирует к `formatMonth()` (zero-padding) |
| `Schema.gs` | Карта колонок `COLS` | ✅ Создан | Новый файл: 0-based индексы всех 14 листов для устранения хардкода |

---

## 4. Баги — актуальный список (2026-05-04 rev 2)

### ✅ Исправлено в скриптах

**BUG-01: VAT.gs — Client ID вместо Project ID** → **ИСПРАВЛЕНО**
- `VAT.gs`: добавлен Unit→Sales join, Project ID теперь берётся из Sales (`unitProjectMap[unit]`)

**BUG-02: Payments.gs — дублирование функции** → **ИСПРАВЛЕНО**
- Заглушка (строки 1–23) удалена. Осталась только рабочая реализация.

**BUG-03: Receivables.gs — агрегация по клиенту, не по сделке** → **ИСПРАВЛЕНО**
- `updateReceivables()` теперь читает `Payment Allocations` и агрегирует `Allocated` по `Sale ID`

**BUG-05: Main.gs — порядок вызовов (VAT после Dashboard)** → **ИСПРАВЛЕНО**
- Новый порядок: `updateVAT()` → `updateContracts()` → `allocatePayments()` → `updateReceivables()` → `generateCashFlow()` → `updateDashboard()`
- Добавлен `_run()` с try/catch: ошибка в одном шаге не останавливает остальные

**BUG-06: Config.gs — typo PAYMANET_ALLOCATION** → **ИСПРАВЛЕНО**
- `PAYMANET_ALLOCATION` → `PAYMENT_ALLOCATION`. Все ссылки обновлены.

**BUG-07: Contracts D5–D15 с `#N/A`** → **ЧАСТИЧНО ИСПРАВЛЕНО** *(скриптовая часть)*
- `updateContracts()`: добавлен guard — строки с `!contractId` или `#` пишут пустые значения вместо мусора
- Причина `#N/A` в таблице (формула VLOOKUP) требует ручного исправления

**BUG-10: `getMonth()` в Utils.gs не использует zero-padding** → **ИСПРАВЛЕНО**
- `getMonth()` теперь вызывает `formatMonth()` из `CashFlow.gs`

**BUG-11: Verifying в Cash Flow — тавтология** → **ИСПРАВЛЕНО**
- Заменено на `closing >= 0` (`Balance OK`): `true` = положительный баланс, `false` = уходим в минус
- Переименовано в `"Balance OK"` в заголовке

**BUG-12: `updateDashboard()` не вызывает `getCommittedCostStats()`** → **ИСПРАВЛЕНО**
- `getCommittedCostStats()` перенесён внутрь `updateDashboard()`. B33–B36 обновляются при любом вызове.

### 🔴 Требует ручного исправления данных (скрипты не могут)

**BUG-04: Contract D1 — переплата 400%**
- EX1 + EX3 + EX4 = 400K vs D1 Contract Amount = 100K
- Нужно: вручную исправить Contract Amount D1 до 400K, либо скорректировать записи в Expenses

**BUG-08: Units — несоответствие ключей** *(ручное)*
- `Units.Project ID` = "Budva Residence" (полное имя) vs `Sales.Project ID` = "P001" (короткий ID)
- Нужно: вручную исправить Units.Project ID на коды P001/P002/P003

**BUG-09: Data integrity — суммы платежей в 20× больше цен продаж** *(ручное)*
- Sales: 5 сделок на сумму 6.05M; Client Payments: ~120M+
- Нужно: вручную скорректировать суммы платежей или заполнить реальные сделки в Sales

---

## 5. Соответствие ТЗ — актуальный статус (2026-05-04)

| # | Модуль ТЗ | Статус | Комментарий |
|---|---|---|---|
| 1 | **Projects** | ✅ Частично | 3 проекта. ⚠️ P001 "Pause" ломает Active-счётчик. Нет стадий, инвестплана, фильтра KPI |
| 2 | **Units Sales CRM** | ✅ Частично | 18 юнитов, 5 сделок. ⚠️ Typo "Pakinkg". Нет payment schedules, aging receivables |
| 3 | **Client Payments** | ✅ Работает | 15 платежей. ⚠️ Суммы нереалистичны. Нет платёжного календаря |
| 4 | **Budget / Cost Control** | ✅ Частично | P001: 29 категорий. P002/P003 пусты. Нет variance analysis, cost/sqm |
| 5 | **Contractors / Contracts** | ✅ Улучшено | Write-back работает. ⚠️ D1 overpay, D5–D15 #N/A. Нет двух уровней (budget↔contract) |
| 6 | **Expenses / AP** | ✅ Частично | 6 расходов, все Paid. Нет forecast payables, burn-down |
| 7 | **Banking / Treasury** | ⚠️ Каркас | 1 счёт, 350K EUR. Нет мультивалюты, liquidity |
| 8 | **Cash Flow Engine** | ✅ Работает | 5 месяцев. ⚠️ Месяцы как Excel dates. Нет cumulative отдельной колонки |
| 9 | **VAT Module** | ✅ Исправлен | ~~Client ID вместо Project ID~~ — исправлено: Unit→Sales join. VAT вызывается первым в pipeline. |
| 10 | **KPI Dashboard** | ✅ Улучшен | 6 + Committed Cost блоков. Нет: Sales%, BudgetExec%, CostToComplete |
| 11 | **Monthly Reporting** | ❌ Не реализовано | — |
| 12 | **Automation / AI** | ❌ Не реализовано | — |

---

## 6. Итоговые таблицы статусов

### ✅ Реализовано и работает

| Функция | Подтверждение |
|---|---|
| VAT pipeline интегрирован | `Main.gs`: `updateVAT()` вызывается первым |
| VAT без дублей | `VAT.gs`: `clearContent()` перед записью |
| VAT корректный Project ID | `VAT.gs`: Unit→Sales join для определения проекта |
| Cash Flow фильтрация | Только confirmed + Paid |
| Cash Flow Balance OK | Колонка `Balance OK` = `closing >= 0` (заменила тавтологию) |
| Contracts write-back | paid/remaining/percent/status строками; guard для #N/A строк |
| Committed Cost KPI | `getCommittedCostStats()` вызывается из `updateDashboard()` (B33–B36) |
| Revenue фильтр (Signed/Closed) | `getSalesStats()` |
| ROI formula | `profit / totalInvestment` |
| Receivables per sale | `updateReceivables()`: аллокации по сделке через Payment Allocations |
| Payment Allocations | FIFO аллокация → лист с записями |
| Clients лист заполнен | 14 клиентов с данными |
| Именованные константы | `Config.gs`: `VAT_RATE`, `PAID_STATUS`, `CONFIRMED_YES`, `SIGNED_STATUSES` |
| Schema.gs | Новый файл: карта колонок всех 14 листов |
| Scheduled trigger | `setupTriggers()` в `Triggers.gs` |
| Error handling | `_run()` с try/catch в `Main.gs` |

### ⚠️ Требует ручного исправления данных

| Функция | Проблема |
|---|---|
| Units types | Typo "Pakinkg" → нужно вручную исправить на "Parking" |
| Contract D1 | 400% overpay — вручную исправить Contract Amount или Expenses |
| Contracts D5–D15 | `#N/A` в Project ID — вручную удалить формулу или строки |
| Payment amounts | Суммы платежей ~120M+ vs продажи 6M — вручную скорректировать |
| Units Project ID | Полное имя вместо кода — вручную заменить на P001/P002/P003 |

### ❌ Не реализовано или выполнено ошибочно

| Функция | Статус |
|---|---|
| Budget ↔ Contract mapping (Card 8) | ❌ Закрыта, но не реализована в коде |
| Contract burn-down (Card 7) | ❌ Открытая, не реализована |
| Budget P002/P003 | ❌ Пусто (Card 5 не выполнена для бюджета) |
| Payment schedules (Card 11) | ❌ Не реализовано |
| Aging receivables (Card 12) | ❌ Есть лист, нет age-buckets |
| Budget vs Actual variance (Card 13) | ❌ Не реализовано |
| Cost per sqm (Card 14) | ❌ Не реализовано |
| Cost to Complete (Card 15) | ❌ Не реализовано |
| Project filter selector (Card 16) | ❌ Не реализовано |
| Advanced KPIs (Card 17) | ❌ Частично (Committed Cost есть, остальные нет) |
| Liquidity forecast (Card 18) | ❌ Не реализовано |
| Monthly reporting (Card 19) | ❌ Не реализовано |
| Scheduled triggers (Card 27) | ✅ `setupTriggers()` добавлен в Triggers.gs |

---

## 7. Советы ИИ

### 7.1 Доработки по выполненным карточкам

**Card 1 (VAT pipeline):** ✅ Исправлено
- `updateVAT()` теперь первый в `updateSystem()`, Dashboard читает актуальный VAT
- Project ID для платежей теперь корректен (Unit→Sales join)

**Card 3 (Revenue):**
- Суммы в `Client Payments` нужно синхронизировать с реальными ценами из `Sales` *(ручное)*
- Добавить fallback: если `Sales` пуст → Revenue = сумма confirmed payments

**Card 5 (Data cleanup):**
- ✅ *Скрипты*: Contracts guard для пустых строк добавлен
- *(Ручное)* Заполнить Budget для P002, P003
- *(Ручное)* Исправить "Pakinkg" → "Parking" во всех юнитах
- *(Ручное)* Удалить строки D5–D15 из Contracts или исправить формулу Project ID
- *(Ручное)* P001 изменить Status с "Pause" на реальный

**Card 6 (Contracts):**
- ✅ `getCommittedCostStats()` теперь внутри `updateDashboard()`
- *(Ручное)* Исправить Contract Amount D1 (должно быть 400K)

**Card 8 (Budget↔Contract mapping) — ПЕРЕОТКРЫТЬ:**
- Карточка отмечена как выполненная, но в коде нет реализации
- ✅ Создан `Schema.gs` — первый шаг к маппингу
- Следующий шаг: добавить колонку "Budget Category" в Contracts, написать `buildBudgetContractMap()`

**Card 10 (allocatePayments):** ✅ Исправлено
- ~~Дубль удалён~~, ~~PAYMANET_ALLOCATION исправлен~~, Receivables теперь использует Payment Allocations

### 7.2 Какие карточки брать в работу следующими

**Рекомендуемый порядок с учётом блокировки Card 7:**

| Приоритет | Card | Причина | Зависит от Card 7? |
|---|---|---|---|
| 🔴 1 | **Переоткрыть Card 8** | Закрыта ошибочно, блокирует cost control | Нет |
| 🔴 2 | *(Ручное)* Исправить данные (BUG-09) | Суммы платежей — Receivables бессмысленны | Нет |
| 🟡 3 | **Card 13** (Budget variance) | Зависит от Card 8 mapping | Нет |
| 🟡 4 | **Card 14** (Cost per sqm) | Простая метрика, быстро | Нет |
| 🟡 5 | **Card 11** (Payment Schedule) | Нужен для клиентов | Нет |
| 🟡 6 | **Card 16** (Project filter) | Разблокирует многие KPI | Нет |
| 🟡 7 | **Card 7** (Burn-down) | Открытая, нужна для Card 15, 18 | — |
| 🔵 8 | **Card 15** (Cost to Complete) | Нужен Card 7 + Card 13 | **Да** |
| 🔵 9 | **Card 17** (Advanced KPIs) | Нужен Card 7 (burn-down KPI) | **Да (частично)** |
| 🔵 10 | **Card 18** (Liquidity forecast) | Нужен Card 7 + Card 15 | **Да** |
| 🔵 11 | **Card 12** (Aging receivables) | Нужны реальные данные receivables | Нет |

**Карточки, БЛОКИРУЕМЫЕ Card 7:**
- Card 15 (Cost to Complete) — нужны данные о remaining contracts
- Card 17 (Advanced KPIs) — burn-down KPI входит в список
- Card 18 (Liquidity forecast) — нужен прогноз будущих выплат по контрактам

### 7.3 Расхождения между ТЗ, таблицей и карточками

| Тип расхождения | Описание |
|---|---|
| **ТЗ требует — в таблице нет** | Два уровня контрактов (budget items ↔ contract packages). Aging receivables (buckets 0-30/31-60/90+). Liquidity position. Multiple currencies. |
| **В таблице есть — в ТЗ не детализировано** | Лист `Receivables` (новый). Лист `Payment Allocations` (новый). `getCommittedCostStats()`. `Schema.gs`. |
| **Карточки закрыты, но не реализованы** | Card 8 (Budget↔Contract mapping) — нет кода. |
| **Данные не соответствуют реальности** *(ручное)* | Суммы платежей (120M+) vs цены продаж (6M) — расхождение 20×. D1 overpay 400%. P002/P003 budget пуст. Units.Project ID = полное имя. |
| ~~Архитектурный долг~~ → исправлено | ~~Два `allocatePayments()` в одном файле~~ ✅. ~~Typo PAYMANET~~ ✅. ~~VAT sheet Client ID~~ ✅. ~~Receivables агрегация по клиенту~~ ✅ |

### 7.4 Предложения по улучшению процесса

1. **Не закрывать карточки без code review** — Card 8 числится закрытой без единой строки кода. Ввести правило: карточка закрывается только если: (a) функция написана, (b) данные в таблице обновлены, (c) dashboard отображает результат.

2. **Data integrity check при каждом релизе** — скрипт-валидатор, который проверяет:
   - Суммы платежей vs цены продаж (ratio < 5×)
   - Contract Amount vs sum(Expenses) для каждого контракта (overpay flag)
   - Наличие #N/A в ключевых колонках

3. **Зафиксировать Units.Project ID как P001/P002/P003** (не полное имя) — это разблокирует корректные джойны между листами. *(Ручное исправление данных)*

4. ✅ **`Schema.gs` создан** — файл с картой колонок всех 14 листов. Использовать `COLS.SALES.PRICE` вместо `row[4]` в новом коде.

5. **Создать автоматический аудит-лист** — `Audit` лист, куда при каждом запуске `updateSystem()` записывается: дата, количество обработанных записей, найденные аномалии (overpay, #N/A, пустые обязательные поля).

6. **Регрессионные тесты для данных** — Google Apps Script позволяет создать `Test.gs` с набором assertions. Запускать после каждого изменения скриптов.

7. **Унифицировать ключи между листами**: везде использовать Project ID = P001/P002/P003, Unit ID = U001…U018, Client ID = C001…C014. *(Ручное исправление данных)*

8. ✅ **`setupTriggers()` добавлен** в `Triggers.gs` — запустите один раз из Apps Script Editor для установки ежедневного триггера в 06:00 UTC.

9. ✅ **try/catch добавлен** в `Main.gs` (`_run()`) — ошибка в одном шаге не останавливает весь pipeline.

---

## Приложение: структура листов (15 листов в XLSX на 2026-05-04)

| Лист | Строк данных | Статус | Обновляется скриптом? |
|---|---|---|---|
| `Projects` | 3 | ✅ Заполнен | Нет (ручной) |
| `Units` | 18 | ✅ Заполнен | Нет (ручной) |
| `Clients` | 14 | ✅ Заполнен | Нет (ручной) |
| `Sales` | 5 (Signed) | ⚠️ Частично | Нет (ручной) |
| `Payment Allocations` | 5 | ✅ Заполнен | ✅ `allocatePayments()` |
| `Client Payments` | 15 | ✅ Заполнен | Нет (ручной) |
| `Budget` | 29 (P001 only) | ⚠️ Частично | Нет (ручной) |
| `Contractors` | 3 | ⚠️ Минимально | Нет (ручной) |
| `Contracts` | 4 + 11(#N/A) | ⚠️ С ошибками данных | ✅ `updateContracts()` + guard для пустых строк |
| `Expenses` | 6 | ✅ Заполнен | Нет (ручной) |
| `Receivables` | 5 | ✅ Заполнен | ✅ `updateReceivables()` |
| `Bank Accounts` | 1 | ⚠️ Минимально | Нет (ручной) |
| `Cash Flow` | 5 | ✅ Обновляется | ✅ `generateCashFlow()` |
| `VAT` | 16 | ✅ Исправлен | ✅ `updateVAT()` — Project ID через Unit→Sales join |
| `Dashboard` | KPI cells | ✅ Обновляется | ✅ `updateDashboard()` включает `getCommittedCostStats()` |
| `Schema.gs` | — | ✅ Создан | Карта колонок `COLS` для всех 14 листов |
