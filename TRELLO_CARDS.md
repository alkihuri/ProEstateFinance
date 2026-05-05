Отлично, тогда раскладываю как Trello backlog (Epic → Lists → Cards), чтобы можно было прямо переносить в доску.

# BOARD: ProEstateFinance Roadmap

---

# LIST 1 — CRITICAL FIXES (Срочно)

## Card 1 — Подключить VAT в главный update pipeline

✅ [ЗАКРЫТО]
Status: VERIFIED

Checklist:

* ✅ Добавить `updateVAT()` в `updateSystem()`
* ✅ Запуск перед dashboard recalculation
* ✅ Проверить цепочку trigger
* ✅ Протестировать ручной/auto запуск

Priority: Critical
Estimate: 1h

---

## Card 2 — Починить VAT дубли

✅ [ЗАКРЫТО]
Status: VERIFIED

Checklist:

* ✅ Очистка листа перед записью (`clearContent()` в VAT.gs)
* ✅ Проверка повторных запусков
* ✅ Тест накопительного НДС

Estimate: 30m

---

## Card 3 — Исправить Revenue logic

✅ [ЗАКРЫТО]
Status: VERIFIED (code) / NOT VERIFIED (data)

Checklist:

* ✅ Заполнить Sales sheet (5 сделок)
* ✅ Revenue из confirmed payments + Sales filter Signed/Closed
* ✅ Исправить profit KPI
* ✅ Исправить ROI formula
* ⚠️ DATA: Client Payments ~120M+ vs Sales 6M — нужна ручная правка

Estimate: 2–3h

---

## Card 4 — Вернуть фильтрацию Cash Flow

✅ [ЗАКРЫТО]
Status: NOT VERIFIED — регрессия в текущих файлах

Checklist:

* ⚠️ Confirmed payments only — CashFlow.gs line 22: hardcoded `"Yes"` вместо `CONFIRMED_YES`
* ⚠️ Paid expenses only — CashFlow.gs line 47: hardcoded `"Paid"` вместо `PAID_STATUS`
* ✅ Исключить draft/planned
* ✅ Проверить opening/closing balance

NOTE: функция `generateCashFlow()` написана корректно, но константы не используются. Требует исправления hardcoded строк.

Estimate: 2h

---

## Card 5 — Data cleanup

✅ [ЗАКРЫТО]
Status: VERIFIED (scripts) / NOT VERIFIED (manual data)

Checklist:

* ⚠️ Заполнить Unit types — Typo "Pakinkg" до сих пор в 4 строках
* ✅ Проверить Contracts sheet — guard для #N/A строк добавлен
* ⚠️ Заполнить budgets P002/P003 — до сих пор пусты
* ✅ Нормализовать expense statuses

Estimate: 3–4h

---

# LIST 2 — CONTRACTS MODULE

## Card 6 — Finish updateContracts()

✅ [ЗАКРЫТО]
Status: VERIFIED

Checklist:

* ✅ Write-back paid amount
* ✅ Remaining balance
* ✅ Percent complete
* ✅ Contract status logic (Active/Completed)

NOTE: updateContracts() не вызывает clearContents() перед записью — риск stale data при удалении контрактов (низкий приоритет).

Estimate: 5h

---

## Card 7 — Contract burn-down tracking

✅ [ЗАКРЫТО]
Status: VERIFIED

Checklist:

* ✅ Paid vs Contract Value
* ✅ Remaining committed
* ✅ Burn-down KPI (лист Contract Burn)
* ⚠️ Dashboard widget — отдельного виджета нет, данные в листе

NOTE: `generateContractBurndown()` в Contracts.gs использует hardcoded `"Paid"` вместо `PAID_STATUS` (строка 105).

Estimate: 5–6h

---

## Card 8 — Budget ↔ Contract mapping

✅ [ЗАКРЫТО] ← ОШИБОЧНО ЗАКРЫТА
Status: NOT VERIFIED — ❌ НЕ РЕАЛИЗОВАНА

Checklist:

* ❌ Mapping table — отсутствует
* ❌ Contract package rollups — отсутствует
* ❌ Budget lines linkage — отсутствует
* ❌ Category aggregation — `generateBudgetVariance()` использует project-level rollup для всех категорий

ACTION REQUIRED: Переоткрыть карточку. Без этого Budget Variance Committed column неверен.

Estimate: 1 day

---

## Card 9 — Committed Cost KPI

✅ [ЗАКРЫТО]
Status: VERIFIED

Formula:

```text
Paid + Remaining Contracts
```

Checklist:

* ✅ Calculation engine (`getCommittedCostStats()`)
* ✅ Dashboard metric (B36–B39)
* ⚠️ Project filter — отсутствует (только суммарно)

Estimate: 3h

---

# LIST 3 — CLIENT COLLECTION ENGINE

## Card 10 — Implement allocatePayments()

✅ [ЗАКРЫТО]
Status: VERIFIED

Checklist:

* ✅ Payment-to-sale allocation (FIFO по contract date)
* ✅ Outstanding balances
* ✅ Partial payment support
* ✅ Unit/client balances (через Payment Allocations лист)

NOTE: из-за 20× mismatch данных (BUG-09) результаты allocations некорректны по факту.

Estimate: 1 day

---

## Card 11 — Payment Schedule module

✅ [ЗАКРЫТО]
Status: NOT VERIFIED (частичная реализация)

Checklist:

* ✅ Installment schedule table (лист Payment Schedule)
* ✅ Due dates
* ✅ Paid vs due (FIFO по due date)
* ❌ Overdue flag — отсутствует в текущем коде

ISSUES:
- `updatePaymentSchedule()` использует N×setValue() в цикле вместо batch setValues
- Нет clearContents() перед записью → stale data риск
- Нет Overdue колонки (4-й output column)

Estimate: 1 day

---

## Card 12 — Aging receivables

✅ [ЗАКРЫТО]
Status: VERIFIED

Checklist:

* ✅ 0-30
* ✅ 31-60
* ✅ 61-90
* ✅ 90+

IMPLEMENTATION: `generateAging()` в Payments.gs.
- Читает из Payment Schedule (Remaining, DueDate)
- diffDays < 0 → future payments исключаются ✅
- remaining <= 0 → пропускаются ✅
- clearContents() + batch write ✅
- Вызывается в updateSystem() последним ✅

NOTE: корректность данных зависит от Payment Schedule, который зависит от Payment Allocations (где есть BUG-09 data mismatch).

Estimate: 4h

---

# LIST 4 — COST CONTROL

## Card 13 — Budget vs Actual variance

✅ [ЗАКРЫТО] ← ЧАСТИЧНО ВЫПОЛНЕНА
Status: NOT VERIFIED — не в pipeline + логика Committed некорректна

Checklist:

* ✅ Variance amount (Budget - Actual)
* ✅ Variance % 
* ⚠️ Overrun flags — нет явных флагов в output
* ✅ Category report (по проекту и категории)

ISSUES:
- `generateBudgetVariance()` в Budjet.gs написана, но НЕ ВЫЗЫВАЕТСЯ в `updateSystem()` — лист никогда не обновляется
- Committed column = project-level total для ВСЕХ категорий одного проекта (неверно без Card 8)
- `getRemainingBudget()` в Dashboard.gs читает Budget Variance, но т.к. лист пуст/не обновляется → Dashboard B17 = 0

ACTION REQUIRED:
1. Добавить `_run("generateBudgetVariance", generateBudgetVariance)` в updateSystem()
2. Реализовать Card 8 для корректного Committed

Estimate: 1 day

---

## Card 14 — Cost per sqm

Checklist:

* Actual cost / sqm
* Budget cost / sqm
* Dashboard KPI

Estimate: 2h

---

## Card 15 — Cost To Complete Engine

Formula:

```text
Remaining budget
+ unpaid commitments
+ forecast payables
```

Checklist:

* Model
* KPI
* Project-level calculation

Estimate: 1 day

---

# LIST 5 — DASHBOARD 2.0

## Card 16 — Project filter selector

Checklist:

* All projects view
* Single project view
* Dynamic recalculation

Estimate: 1 day

---

## Card 17 — Add advanced KPIs

Checklist:

* ✅ ROI (реализован в getProfitStats())
* Sales %
* Budget execution %
* Cost to complete
* ✅ Committed cost (реализован в getCommittedCostStats())

Estimate: 1 day

---

## Card 18 — Liquidity forecast

Checklist:

* ✅ Forward cash forecast (`getFutureIncome()` добавлен)
* ✅ Funding gap (`getCashGap()` добавлен)
* ⚠️ Monthly projection — только summary, не помесячно

NOTE: getCashGap зависит от Budget Variance, который не обновляется (BUG-21). Нужно сначала исправить Card 13.

Estimate: 1–2 days

---

# LIST 6 — MONTHLY REPORTING

## Card 19 — Monthly management report

Checklist:

* Inflows
* Outflows
* Net result
* Largest payments
* Largest expenses

Estimate: 1 day

---

## Card 20 — Overrun / overdue alerts

Checklist:

* Budget overruns
* Overdue clients
* Contracts >80% paid

Estimate: 5h

---

## Card 21 — PDF export reports

Checklist:

* Report layout
* Export script
* Test formatting

Estimate: 1 day

---

# LIST 7 — ARCHITECTURE REFACTOR

## Card 22 — Create Schema.gs

Checklist:

* ✅ Column maps (Schema.gs создан в предыдущей итерации)
* Remove hardcoded row indexes
* Refactor scripts

Estimate: 1 day

---

## Card 23 — Batch write optimization

Checklist:

* ✅ Replace setValue loops — в allocatePayments, updateReceivables, generateAging, generateBudgetVariance
* ❌ Batch setValues — updatePaymentSchedule() всё ещё использует setValue в цикле
* Speed testing

Estimate: 4h

---

## Card 24 — Error handling layer

Checklist:

* ✅ try/catch — `_run()` wrapper в Main.gs
* Validation guards
* Logging

Estimate: 4h

---

# LIST 8 — V2 AUTOMATION

## Card 25 — Bank email parsing

## Card 26 — Gemini transaction categorization

## Card 27 — Scheduled triggers

✅ [ЗАКРЫТО]
Status: VERIFIED — `setupTriggers()` добавлен в Triggers.gs; ежедневный запуск 06:00 UTC

## Card 28 — Weekly snapshots

## Card 29 — Role permissions

(parked backlog)

---

# МИЛЕСТОУНЫ

## Milestone MVP Complete

Cards:
1–18

Это ~75% продукта.

Progress: 12 из 18 Cards закрыты (67%), из них:
- 9 VERIFIED ✅
- 2 PARTIALLY VERIFIED ⚠️
- 1 NOT VERIFIED ❌ (Card 8)
- Card 13 NOT IN PIPELINE ❌

---

## Milestone Production V1

Cards:
1–24

Это почти полноценный developer finance OS.
