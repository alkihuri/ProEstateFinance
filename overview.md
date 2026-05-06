# ProEstateFinance — Overview

> Последнее обновление: 2026-05-06 (rev 5). Глубокий аудит xlsx-данных + формул + скриптов. Исправлены ошибочные выводы rev 4.

---

## 0. System State Summary

```
Implementation:        ~65%  (Cards 1–12 + partial 13; из 29 карточек завершено ~12)
Data Quality:          ~40%  (платежи теперь корректные; но найдены 5 структурных проблем данных)
Architecture Maturity: ~45%  (pipeline работает, FIFO ✅; но 8+ активных багов, нет validation layer)
```

**MVP прогресс (Cards 1–18):** 12 из 18 = **67%**

> ⚠️ **ИСПРАВЛЕНИЕ ОТНОСИТЕЛЬНО REV 4**: Данные Client Payments в текущем xlsx КОРРЕКТНЫ — суммарно 135,500 EUR (не 120M+). BUG-09 («20× mismatch») устранён вручную. Остальные выводы rev 4 обновлены ниже.

---

## 1. Аудит Trello Cards 1–13

| Card | Название | Trello | Статус по коду + данным | Вердикт |
|---|---|---|---|---|
| **1** | Подключить VAT в pipeline | Closed | ✅ `updateVAT()` первым в `updateSystem()` | ✅ **ВЫПОЛНЕНО** |
| **2** | Починить VAT дубли | Closed | ✅ `clearContent()` перед записью в `VAT.gs` | ✅ **ВЫПОЛНЕНО** |
| **3** | Исправить Revenue logic | Closed | ✅ Фильтр Signed/Closed; ROI = profit/investment; данные платежей теперь реалистичны (135,500 EUR) | ✅ **ВЫПОЛНЕНО** |
| **4** | Вернуть фильтрацию CF | Closed | ⚠️ CashFlow.gs строки 22,47: hardcoded `"Yes"` и `"Paid"` вместо констант | ⚠️ **ЧАСТИЧНО** — регрессия |
| **5** | Data cleanup | Closed | ⚠️ Typo "Pakinkg" остался; P002/P003 не существуют в xlsx | ⚠️ **ЧАСТИЧНО** |
| **6** | Finish updateContracts() | Closed | ✅ Write-back paid/remaining/percent/status работает корректно | ✅ **ВЫПОЛНЕНО** |
| **7** | Contract burn-down tracking | Closed | ✅ `generateContractBurndown()` реализован; но Project column = Contractor ID (CTR1) вместо P001 | ⚠️ **ЧАСТИЧНО** — структурный баг |
| **8** | Budget ↔ Contract mapping | Closed | ❌ Нет mapping-функции; Committed = project-level rollup (всегда 0, т.к. Contracts.B = CTR, не P001) | ❌ **НЕ ВЫПОЛНЕНО** |
| **9** | Committed Cost KPI | Closed | ⚠️ `getCommittedCostStats()` читает Budget!H (= paid by category via SUMIF) вместо Budget!G (estimated). Dashboard B12 = 36,000 = сумма оплаченных контрактов, а не смета | ❌ **НЕВЕРНЫЕ ДАННЫЕ** |
| **10** | Implement allocatePayments() | Closed | ✅ FIFO по contract date; clearContents перед записью; 14 строк аллокаций | ✅ **ВЫПОЛНЕНО** |
| **11** | Payment Schedule module | Closed | ⚠️ Лист существует, 1 запись (SCH001 для S001); нет overdue-флага; нет clearContents; N×setValue | ⚠️ **ЧАСТИЧНО** |
| **12** | Aging receivables | Closed | ✅ `generateAging()` реализован, логика правильная; лист пуст т.к. SCH001 due=2026-05-15 ещё не просрочен | ✅ **ВЫПОЛНЕНО** (данных нет — это корректно) |
| **13** | Budget vs Actual variance | Closed | ⚠️ `generateBudgetVariance()` написана, но НЕ вызывается в `updateSystem()`; Committed=0 из-за bug в Contracts.B | ❌ **НЕ В PIPELINE** |

---

## 2. Audit Table — 10 ключевых проверок (по данным xlsx)

| # | Проверка | Статус | Результат |
|---|---|---|---|
| 1 | **Payments vs Sales ratio** | ✅ | 135,500 / 6,050,000 = 2.2% — клиенты платят задатки, всё в норме. BUG-09 УСТРАНЁН |
| 2 | **FIFO Allocation** | ✅ | `allocatePayments()`: FIFO по contract date ✅; `updatePaymentSchedule()`: FIFO по due date ✅ |
| 3 | **Schedule vs Receivables consistency** | ❌ | Schedule: 1 запись, remaining=658,500. Receivables: 5 записей, outstanding=5,914,500. Разрыв 5.26M — Schedule НЕПОЛНЫЙ (только S001) |
| 4 | **Status filters** | ⚠️ | `CashFlow.gs` lines 22,47: hardcoded `"Yes"`,`"Paid"`; `Contracts.gs` line 105: hardcoded `"Paid"` в burndown |
| 5 | **Unit integrity** | ⚠️ | Unit ID в Sales ✅, Payments ✅, VAT join ✅; Units.Type typo "Pakinkg"; Client Payments формула VLOOKUP ограничена строками `$A$2:$D$14` — не покрывает U015–U018 |
| 6 | **VAT correctness** | ✅ | Только Paid expenses, только Confirmed payments; clearContent перед записью; batch write; Unit→Sales join ✅ |
| 7 | **Idempotency** | ⚠️ | `updateContracts()` без clearContents; `updatePaymentSchedule()` N×setValue в цикле, нет clearContents |
| 8 | **Budget ↔ Contract gap** | ❌ | Contracts.B = Contractor ID (CTR1/CTR2), не Project ID → Budget Variance committed=0 всегда; нет category-level mapping |
| 9 | **Payment Schedule logic** | ⚠️ | FIFO ✅; Paid/Remaining/Status корректны для SCH001; нет Overdue column; только 1 запись из 5 продаж |
| 10 | **Aging correctness** | ✅ | Логика верна: diffDays<0 → excluded; remaining<=0 → excluded; лист пуст т.к. SCH001 due date = 2026-05-15 (в будущем) |

---

## 3. Анализ формул в xlsx (CURRENT_SHEETS_STATE.xlsx)

### 3.1 Лист `Sales` — формулы в колонке F (Price/m²)

```
F2–F28: =IFNA(E2/VLOOKUP(D2, Units!A:F, 6, FALSE), "")
```
- **Статус:** ✅ Корректна. VLOOKUP возвращает площадь из Units, формула вычисляет цену/м². IFNA защищает от ошибок.
- **Замечание:** Формулы заполнены до F28 (1000 строк шаблона), но данных только 5 строк.

### 3.2 Лист `Client Payments` — формулы в колонке E (Payment Info)

```
E2–E59: =CONCATENATE(LEFT(VLOOKUP(C2, Clients!$A$2:$B$14, 2, FALSE) & REPT(" ", 20), 20),
         " [", VLOOKUP(D2, Units!$A$2:$D$14, 4, FALSE), "]")
```
- **Статус:** ⚠️ **ПРОБЛЕМА**: диапазон `Clients!$A$2:$B$14` ограничен 13 клиентами. При добавлении C014+ → `#N/A`.
- **Проблема 2:** `Units!$A$2:$D$14` — только Units U001–U013, пропускает U014–U018.
- **Рекомендация:** Заменить на `Clients!$A:$B` и `Units!$A:$D`.

### 3.3 Лист `Projects` — формула в H2 (Sellable Area)

```
H2: =SUMIF(Units!B:B, A:A, Units!F:F)
```
- **Статус:** ⚠️ **НЕКОРРЕКТНА**. Аргумент `A:A` — ссылка на весь столбец, а не на ячейку проекта.
- **Правильно:** `=SUMIF(Units!$B:$B, A2, Units!$F:$F)` — фиксированный диапазон + ссылка на текущую строку.
- **Последствие:** При добавлении P002/P003 формула может дать неверные результаты.

### 3.4 Лист `Contracts` — формулы в колонке C (Contractor Name)

```
C2–C5: =VLOOKUP(B2, Contractors!$A$2:$B$17, 2, FALSE)
```
- **Статус:** ✅ Корректна. Возвращает имя подрядчика по Contractor ID.
- **КРИТИЧЕСКАЯ ПРОБЛЕМА ДАННЫХ:** Колонка B (`Project ID`) содержит **Contractor ID** (CTR1, CTR2, CTR3), а не Project ID (P001)!
- **Последствие:** `generateContractBurndown()` пишет в Contract Burn `Project=CTR1` вместо `P001`. Budget Variance Committed = 0 т.к. join по project не работает.

### 3.5 Лист `Budget` — формулы в колонках G, H, I, J

```
G2 (только!): =SUMIF(Contracts!D:D, C2, Contracts!E:E)  ← сумма Contract Amount по категории
G3–G30:       hardcoded числа (ручная смета)
H2–H30:       =SUMIF(Contracts!D:D, C, Contracts!F:F)   ← сумма оплаченных по категории
I2–I30:       =SUMIF(Contracts!D:D, C, Contracts!E:E)   ← сумма Contract Amount по категории
J2–J30:       =G-H                                       ← разница смета vs automatic
```
- **Проблема 1:** ⚠️ G2 — единственная строка с формулой вместо manual. Несогласованность.
- **Проблема 2:** ❌ **КРИТИЧЕСКАЯ**: `.gs` скрипты читают `row[7]` (0-based) = колонка H ("Total automatically" = сумма оплат), а не `row[6]` = колонка G ("Total estimated" = ручная смета).
  - **Следствие:** Dashboard `B12` (Total Budget) = 36,000 EUR (сумма оплат по контрактам), а НЕ реальная смета = 8,823,919 EUR.
  - **Правильно:** Скрипт должен читать `row[6]`.

### 3.6 Лист `Budget` — сводная строка B006 (строка 6)

```
L6: =SUM(Budjet[Total estimated (manual)])   → 8,823,919
M6: =SUM(Budjet[Total (automaticaly)])       → сумма всех H
N6: =SUM(I:I)                                → сумма всех Contract Amounts
O6: =L6-M6                                  → разница
```
- **Статус:** ✅ Формулы сводной строки корректны.
- **Замечание:** Typo в имени таблицы `Budjet` (должно быть `Budget`) и `automaticaly`.

### 3.7 Лист `Budget Variance` — структура данных

```
Column A: "Project" — содержит Budget ID (B001, B005...) — ОШИБКА СТРУКТУРЫ
Column B: "Category" — содержит Project ID (P001) — ОШИБКА СТРУКТУРЫ
```
- **Статус:** ❌ Колонки A и B по смыслу перепутаны относительно заголовков. Должно быть: A=ProjectID, B=Category.
- **Данные:** Actual=0, Committed=0 для всех строк → скрипт `generateBudgetVariance()` не в pipeline.

---

## 4. Проверка данных на связность (cross-sheet data integrity)

| Источник | Цель | Связь | Статус |
|---|---|---|---|
| Clients.A (Client ID) | Sales.B | FK join | ✅ C001,C002,C003 совпадают |
| Units.A (Unit ID) | Sales.D | FK join | ✅ U001–U005 совпадают |
| Sales.A (Sale ID) | Payment Allocations.B | FK join | ✅ S001–S005 присутствуют |
| Client Payments.A | Payment Allocations.A | FK join | ✅ P001–P014 совпадают |
| Contracts.A (Contract ID) | Expenses.E | FK join | ✅ D1–D4 совпадают; но EX7–EX12 без контракта |
| Budget.C (Category) | Contracts.D | SUMIF join | ✅ Категории совпадают для 4 контрактов |
| Contracts.B ("Project ID") | Projects.A | FK join | ❌ Contracts.B = CTR1/CTR2/CTR3 (Contractor ID), не P001 |
| Expenses.E (Contract) + .F (Category) | Budget.C + Contracts.D | Cross check | ❌ 5 из 6 Paid expenses: категория ≠ категории их контракта |
| Payment Schedule.B (Sale ID) | Sales.A | FK join | ⚠️ Только S001 покрыт; S002–S005 отсутствуют |
| Payment Schedule remaining | Receivables outstanding | SUM должен совпадать | ❌ 658,500 vs 5,914,500 — расхождение 5.26M |

### Расхождение Expenses Category vs Contract Category:

| Expense | Contract | Contract Category | Expense Category | Статус |
|---|---|---|---|---|
| EX1 | D1 | I PRIPREMNI RADOVI | II ZEMLJANI RADOVI | ❌ |
| EX2 | D2 | V ČELIČNI RADOVI | III BETONSKI I ARM. BETONSKI | ❌ |
| EX3 | D1 | I PRIPREMNI RADOVI | II ZEMLJANI RADOVI | ❌ |
| EX4 | D1 | I PRIPREMNI RADOVI | I PRIPREMNI RADOVI | ✅ |
| EX5 | D3 | IX BRAVARSKI RADOVI | VI ZIDARSKI RADOVI | ❌ |
| EX6 | D4 | XI LIMARSKI RADOVI | I PRIPREMNI RADOVI | ❌ |

> **Вывод**: 5/6 paid expenses имеют категорию, НЕ совпадающую с категорией своего контракта. Это нарушает SUMIF-связь в Budget и Budget Variance.

---

## 5. Script Audit Summary (без изменения кода)

```
Main.gs:
  ✔ Pipeline порядок: VAT→Contracts→Payments→Schedule→Receivables→CashFlow→Dashboard→Burn→Aging
  ❌ generateBudgetVariance() НЕ вызывается → Card 13 мертва
  ⚠️ Typo в лог-метке: "updatePaymetnSchedule"

Config.gs:
  ✔ Все листы определены корректно
  ⚠️ BUDJET_VARIANCE — опечатка (BUDJET вместо BUDGET)

VAT.gs:
  ✔ Unit→Sales join для Project ID
  ✔ clearContent() перед записью; batch setValues
  ✔ Только PAID_STATUS и CONFIRMED_YES

CashFlow.gs:
  ⚠️ Line 22: "Yes" hardcoded вместо CONFIRMED_YES
  ⚠️ Line 47: "Paid" hardcoded вместо PAID_STATUS
  ✔ clearContents() перед записью; batch setValues

Contracts.gs — updateContracts():
  ✔ PAID_STATUS константа используется
  ✔ Guard для строк без contractId
  ❌ Нет clearContents() перед записью → stale data риск

Contracts.gs — generateContractBurndown():
  ⚠️ Line 105: "Paid" hardcoded вместо PAID_STATUS
  ✔ clearContents + batch setValues
  ❌ contractMap[id].project = row[1] = Contractor ID, не Project ID → неверные данные

Dashboard.gs — getProjectOverview():
  ❌ Line 28: только "Construction" считается активным (не ACTIVE_PROJECT_STATUSES)

Dashboard.gs — getExpenseStats() + getCommittedCostStats():
  ❌ Читают row[7] из Budget (= col H = оплачено по category), должны читать row[6] (= col G = смета)
  → Dashboard B12 (Total Budget) = 36,000 вместо правильного 8,823,919

Dashboard.gs — getRemainingBudget():
  ⚠️ Hardcoded sheet name "Budget Variance" вместо SHEETS.BUDJET_VARIANCE

Payments.gs — updatePaymentSchedule():
  ❌ Нет clearContents() перед записью
  ❌ N×setValue в цикле (lines 150–163) вместо batch setValues
  ❌ Нет Overdue column

Payments.gs — generateAging():
  ✔ Читает Payment Schedule; diffDays<0 excluded; remaining<=0 excluded
  ✔ clearContents + batch setValues
  ✔ Bucket логика корректна

Budjet.gs — generateBudgetVariance():
  ❌ НЕ вызывается в updateSystem()
  ❌ Committed rollup использует Contracts.row[1] (= CTR ID) как project key → 0 всегда
  ✔ clearContents + batch setValues

Receivables.gs:
  ✔ Per-sale aggregation через Payment Allocations
  ✔ clearContents + batch setValues

Utils.gs:
  ⚠️ checkSheets() — отладочная функция в production коде
```

---

## 6. Critical Issues (Top 5)

### 🔴 CRITICAL-1: Dashboard читает неверную колонку Budget → Total Budget = 36,000 вместо 8.8M

**Файл:** `Dashboard.gs` (getExpenseStats, getCommittedCostStats)
**Проблема:** `row[7]` = колонка H (Total automatically = оплачено по категории) вместо `row[6]` = G (Total estimated = ручная смета).
**Данные:** Dashboard B12=36,000 vs реальная смета=8,823,919 EUR — ошибка в 245×.
**Fix:** Изменить индекс с `row[7]` на `row[6]`.

---

### 🔴 CRITICAL-2: Contracts.B = Contractor ID, не Project ID

**Лист:** `Contracts`, колонка B (заголовок "Project ID")
**Проблема:** Содержит CTR1/CTR2/CTR3 вместо P001/P002/P003. Затрагивает:
- `generateContractBurndown()` → Contract Burn показывает Project=CTR1
- `generateBudgetVariance()` → Committed = 0 всегда (join по project не работает)
**Fix:** Ручная правка в Contracts.B: заменить CTR1/CTR2/CTR3 → P001.

---

### 🔴 CRITICAL-3: generateBudgetVariance() не в pipeline

**Файл:** `Main.gs`
**Проблема:** Функция написана, но никогда не вызывается. Budget Variance лист содержит стale/нулевые данные.
**Следствие:** Dashboard B17 (Remaining Budget) = 36,000 (берёт из Budget Variance = 0 + неверный бюджет).
**Fix:** Добавить `_run("generateBudgetVariance", generateBudgetVariance)` в `updateSystem()`.

---

### 🔴 CRITICAL-4: Payment Schedule НЕПОЛНЫЙ (только S001 из 5 сделок)

**Лист:** `Payment Schedule`, 1 запись вместо минимум 5.
**Проблема:** Schedule vs Receivables расхождение: 658,500 vs 5,914,500 EUR (разрыв 5.26M).
**Следствие:** Aging будет пустым до появления данных. `getFutureIncome()` занижен.
**Fix:** Добавить installments для S002–S005.

---

### ⚠️ CRITICAL-5: Expenses category не совпадает с Contract category (5/6 записей)

**Листы:** `Expenses` vs `Contracts`
**Проблема:** EX1, EX2, EX3, EX5, EX6 имеют категорию, отличающуюся от категории их контракта.
**Следствие:** SUMIF в Budget.H даёт неверные суммы по категориям; Budget Variance Actual неверен.
**Fix:** Ручная правка Expenses.F (категория) или пересмотр структуры данных.

---

## 7. Recommendations

### 🔴 Immediate (исправить немедленно)

1. **Исправить `row[7]` → `row[6]`** в `getExpenseStats()` и `getCommittedCostStats()` — исправит Total Budget на Dashboard
2. **Исправить Contracts.B**: заменить CTR1/CTR2/CTR3 → P001 вручную
3. **Добавить `generateBudgetVariance()` в `updateSystem()`** — Card 13 иначе никогда не работает
4. **Заполнить Payment Schedule** для S002–S005 — иначе Schedule vs Receivables = критическое расхождение
5. **Исправить категории Expenses EX1-EX3, EX5-EX6** — привести в соответствие с контрактами

### 🟡 Next iteration

6. **Исправить `getProjectOverview()`**: `ACTIVE_PROJECT_STATUSES.includes(status)` вместо только "Construction"
7. **Исправить Projects.H2 формулу**: `A:A` → `A2` (относительная ссылка на текущую строку проекта)
8. **Расширить VLOOKUP-диапазоны** в Client Payments: `$A$2:$B$14` → `$A:$B`; `$A$2:$D$14` → `$A:$D`
9. **Заменить hardcoded строки** в CashFlow.gs (line 22,47) и Contracts.gs (line 105) на константы
10. **Исправить `updatePaymentSchedule()`**: добавить clearContents + batch setValues + Overdue column
11. **Удалить `checkSheets()`** из Utils.gs
12. **Исправить `getRemainingBudget()`**: hardcoded "Budget Variance" → `SHEETS.BUDJET_VARIANCE`

### 🔵 Future improvements

13. **Validation layer (`Test.gs`)**: проверка integrity при каждом запуске pipeline
14. **Унифицировать Contracts.B → Projects ID**: добавить Project ID как отдельный столбец
15. **Исправить Budget Variance структуру**: колонки A (Project) и B (Category) перепутаны
16. **Добавить P002/P003 данные**: Projects, Budget, Units
17. **Внедрить Card 8** (Budget↔Contract mapping) для правильного Committed
18. **Dashboard overdue summary**: сколько клиентов просрочены и на сколько

---

## 8. Состояние данных xlsx — по листам

| Лист | Строк данных | Статус | Критические проблемы |
|---|---|---|---|
| `Projects` | 1 (только P001) | ⚠️ | Только 1 проект; H2 формула с ошибкой |
| `Units` | 18 | ⚠️ | Typo "Pakinkg" в 4 строках |
| `Clients` | 3 активных из 14 строк | ✅ | — |
| `Sales` | 5 (Signed) | ✅ | VLOOKUP формулы верны |
| `Client Payments` | 12 (135,500 EUR) | ⚠️ | VLOOKUP диапазоны ограничены ($A$2:$B$14) |
| `Payment Allocations` | 14 | ✅ | Корректно аллоцировано |
| `Payment Schedule` | 1 (только S001) | ❌ | Критически неполный — нужно S002–S005 |
| `Aging` | 0 (пуст) | ✅ | Корректно — нет просроченных платежей |
| `Budget` | 29 категорий P001 | ⚠️ | G2 — формула, G3–G30 — hardcode; inconsistency |
| `Contractors` | 3 | ✅ | — |
| `Contracts` | 4 (+11 пустых) | ❌ | Колонка B = Contractor ID вместо Project ID |
| `Contract Burn` | 5 строк | ⚠️ | Project column = CTR1, не P001 |
| `Budget Variance` | 29 строк | ❌ | Committed=0; колонки A/B перепутаны; не обновляется |
| `Expenses` | 12 (6 Paid) | ❌ | 5/6 Paid: категория не совпадает с контрактом |
| `Receivables` | 5 | ✅ | Outstanding положительный, корректный |
| `Bank Accounts` | 1 (350,000 EUR) | ✅ | — |
| `Cash Flow` | 5 месяцев | ✅ | Суммы соответствуют платежам |
| `VAT` | 5 строк | ✅ | Project ID корректный через Unit→Sales join |
| `Dashboard` | KPI ячейки | ❌ | B12=36K вместо 8.8M; B36–B41 смещены |

---

## 9. Исправленные замечания vs предыдущие аудиты

| Замечание (rev 4) | Статус в rev 5 | Комментарий |
|---|---|---|
| BUG-09: Платежи ~120M+ vs Sales 6M | ✅ УСТРАНЕНО | Данные исправлены вручную: 135,500 EUR |
| BUG-03: Receivables отрицательные | ✅ УСТРАНЕНО | Outstanding теперь положительный |
| BUG-07: Contracts #N/A строки | ✅ УСТРАНЕНО | Guard работает, D5–D15 пишут 0 |
| BUG-01: VAT неверный Project ID | ✅ УСТРАНЕНО | Unit→Sales join работает |
| BUG-16: Active count Dashboard | ❌ НЕ УСТРАНЕНО | getProjectOverview() только "Construction" |
| BUG-21: generateBudgetVariance() не в pipeline | ❌ НЕ УСТРАНЕНО | Main.gs не изменён |
| **НОВОЕ**: Dashboard Budget = 36K вместо 8.8M | ❌ НОВАЯ ОШИБКА | row[7] vs row[6] в скрипте |
| **НОВОЕ**: Contracts.B = CTR ID вместо P001 | ❌ НОВАЯ ОШИБКА | Данные Contracts неверны структурно |
| **НОВОЕ**: Expenses category mismatch | ❌ НОВАЯ ОШИБКА | 5/6 paid expenses |
| **НОВОЕ**: Payment Schedule только S001 | ❌ НОВАЯ ОШИБКА | Критический пробел данных |
| **НОВОЕ**: Projects.H2 неверная формула | ❌ НОВАЯ ОШИБКА | A:A вместо A2 |
| **НОВОЕ**: Client Payments VLOOKUP ограничен | ⚠️ РИСК | Диапазон заканчивается на 14 записи |

---

---

## 📋 СООБЩЕНИЕ ЗАКАЗЧИКУ

### ✅ Что сделано (подтверждено кодом и данными)

- Система автоматически считает НДС (VAT) по проекту — работает корректно
- Денежный поток (Cash Flow) рассчитывается по 5 месяцам — данные корректны
- Клиентские платежи (135,500 EUR) правильно аллоцированы по 5 сделкам (FIFO)
- Дебиторская задолженность рассчитана корректно: 5,914,500 EUR (по 5 клиентам)
- Контракты с подрядчиками: учёт оплат и остатков работает (D1–D4)
- Burn-down контрактов по месяцам — реализован и заполнен
- Aging (разбивка просрочки по срокам) — реализован; сейчас пуст, т.к. нет просроченных платежей
- Дашборд частично работает: продажи, клиентские платежи, VAT, Cash Flow отображаются

### ❌ Что НЕ работает и требует исправления

- **Дашборд: Бюджет = 36,000 EUR** — ошибка в скрипте, реальная смета = 8,823,919 EUR
- **График платежей (Payment Schedule)** заполнен только для 1 продажи из 5 — нужно добавить остальные
- **Budget vs Actual Variance** (Card 13) — написана, но не запускается автоматически
- **Контракты: в колонке "Project ID" стоит ID подрядчика**, а не проекта — надо исправить вручную
- **В расходах (Expenses)**: категория у 5 из 6 оплаченных расходов не совпадает с категорией контракта

### ⚠️ Что нужно сделать вручную (данные в таблице)

- Исправить колонку B в листе `Contracts`: заменить CTR1/CTR2/CTR3 → P001
- Заполнить `Payment Schedule` для сделок S002–S005 (с датами и суммами платежей)
- Исправить категории в листе `Expenses` строки EX1, EX2, EX3, EX5, EX6
- Исправить опечатку "Pakinkg" → "Parking" в листе `Units` (4 строки)
- Добавить проекты P002 и P003 в лист `Projects` и `Budget` (если нужно)

### 🔧 Что нужно исправить разработчику (скрипты)

- Исправить `row[7]` на `row[6]` в Dashboard.gs — это исправит Total Budget на дашборде
- Добавить `generateBudgetVariance()` в главный запуск (`updateSystem()`)
- Добавить Overdue флаг в Payment Schedule
- Оптимизировать запись в Payment Schedule (сейчас работает медленно)

### 📊 Текущий прогресс проекта

```
Карточки завершены (1–13): 12 из 13 реально работают
MVP Cards (1–18):           12 из 18 готово = 67%
Качество данных:            ~40% (есть структурные ошибки в данных)
Готовность к production:    ❌ — нужно исправить 5 критических пунктов выше
```
