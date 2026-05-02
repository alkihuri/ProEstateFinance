Отлично, тогда раскладываю как Trello backlog (Epic → Lists → Cards), чтобы можно было прямо переносить в доску.

# BOARD: ProEstateFinance Roadmap

---

# LIST 1 — CRITICAL FIXES (Срочно)

## Card 1 — Подключить VAT в главный update pipeline

Checklist:

* Добавить `updateVAT()` в `updateSystem()`
* Запуск перед dashboard recalculation
* Проверить цепочку trigger
* Протестировать ручной/auto запуск

Priority: Critical
Estimate: 1h

---

## Card 2 — Починить VAT дубли

Checklist:

* Очистка листа перед записью
* Проверка повторных запусков
* Тест накопительного НДС

Estimate: 30m

---

## Card 3 — Исправить Revenue logic

Checklist:

* Заполнить Sales sheet
* Или временно revenue из confirmed payments
* Исправить profit KPI
* Исправить ROI formula

Estimate: 2–3h

---

## Card 4 — Вернуть фильтрацию Cash Flow

Checklist:

* Confirmed payments only
* Paid expenses only
* Исключить draft/planned
* Проверить opening/closing balance

Estimate: 2h

---

## Card 5 — Data cleanup

Checklist:

* Заполнить Unit types
* Проверить Contracts sheet
* Заполнить budgets P002/P003
* Нормализовать expense statuses

Estimate: 3–4h

---

# LIST 2 — CONTRACTS MODULE

## Card 6 — Finish updateContracts()

Checklist:

* Write-back paid amount
* Remaining balance
* Percent complete
* Contract status logic

Estimate: 5h

---

## Card 7 — Contract burn-down tracking

Checklist:

* Paid vs Contract Value
* Remaining committed
* Burn-down KPI
* Dashboard widget

Estimate: 5–6h

---

## Card 8 — Budget ↔ Contract mapping

Checklist:

* Mapping table
* Contract package rollups
* Budget lines linkage
* Category aggregation

Estimate: 1 day

---

## Card 9 — Committed Cost KPI

Formula:

```text id="jz3ee7"
Paid + Remaining Contracts
```

Checklist:

* Calculation engine
* Dashboard metric
* Project filter

Estimate: 3h

---

# LIST 3 — CLIENT COLLECTION ENGINE

## Card 10 — Implement allocatePayments()

Checklist:

* Payment-to-sale allocation
* Outstanding balances
* Partial payment support
* Unit/client balances

Estimate: 1 day

---

## Card 11 — Payment Schedule module

Checklist:

* Installment schedule table
* Due dates
* Paid vs due
* Overdue flag

Estimate: 1 day

---

## Card 12 — Aging receivables

Checklist:

* 0-30
* 31-60
* 61-90
* 90+

Estimate: 4h

---

# LIST 4 — COST CONTROL

## Card 13 — Budget vs Actual variance

Checklist:

* Variance amount
* Variance %
* Overrun flags
* Category report

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

```text id="8h6xzx"
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

* ROI
* Sales %
* Budget execution %
* Cost to complete
* Committed cost

Estimate: 1 day

---

## Card 18 — Liquidity forecast

Checklist:

* Forward cash forecast
* Funding gap
* Monthly projection

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

* Column maps
* Remove hardcoded row indexes
* Refactor scripts

Estimate: 1 day

---

## Card 23 — Batch write optimization

Checklist:

* Replace setValue loops
* Batch setValues
* Speed testing

Estimate: 4h

---

## Card 24 — Error handling layer

Checklist:

* try/catch
* Validation guards
* Logging

Estimate: 4h

---

# LIST 8 — V2 AUTOMATION

## Card 25 — Bank email parsing

## Card 26 — Gemini transaction categorization

## Card 27 — Scheduled triggers

## Card 28 — Weekly snapshots

## Card 29 — Role permissions

(parked backlog)

---

# МИЛЕСТОУНЫ

## Milestone MVP Complete

Cards:
1–18

Это ~75% продукта.

---

## Milestone Production V1

Cards:
1–24

Это почти полноценный developer finance OS.
 
 