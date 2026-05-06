# BOARD: ProEstateFinance Roadmap

> Последнее обновление: 2026-05-06 (rev 5). Статусы карточек актуализированы по результатам полного аудита xlsx + .gs скриптов.

---

# ═══════════════════════════════════════
# ✅ ЗАКРЫТЫЕ КАРТОЧКИ (Cards 1–13)
# ═══════════════════════════════════════

---

# LIST 1 — CRITICAL FIXES

## ✅ Card 1 — Подключить VAT в главный update pipeline
**[ЗАКРЫТО]** | Status: VERIFIED ✅

Checklist:
* ✅ `updateVAT()` добавлен в `updateSystem()` — первым в порядке запуска
* ✅ Запуск перед dashboard recalculation
* ✅ Trigger chain проверен
* ✅ Ручной и auto запуск работают

Priority: Critical | Estimate: 1h

---

## ✅ Card 2 — Починить VAT дубли
**[ЗАКРЫТО]** | Status: VERIFIED ✅

Checklist:
* ✅ `clearContent()` перед записью в VAT.gs
* ✅ Повторные запуски не дублируют данные
* ✅ Накопительный НДС считается корректно

Estimate: 30m

---

## ✅ Card 3 — Исправить Revenue logic
**[ЗАКРЫТО]** | Status: VERIFIED ✅

Checklist:
* ✅ Sales sheet заполнен (5 сделок, 6,050,000 EUR)
* ✅ Revenue = сумма Signed/Closed сделок
* ✅ Cash received = только Confirmed payments (135,500 EUR)
* ✅ Profit KPI = Revenue − Paid Expenses
* ✅ ROI = Profit / Investment
* ✅ Данные платежей корректны (BUG-09 устранён)

Estimate: 2–3h

---

## ✅ Card 4 — Вернуть фильтрацию Cash Flow
**[ЗАКРЫТО]** | Status: PARTIALLY VERIFIED ⚠️

Checklist:
* ⚠️ Confirmed payments only — CashFlow.gs line 22: hardcoded `"Yes"` вместо `CONFIRMED_YES` (нужно исправить)
* ⚠️ Paid expenses only — CashFlow.gs line 47: hardcoded `"Paid"` вместо `PAID_STATUS` (нужно исправить)
* ✅ Draft/Planned исключены
* ✅ Opening/Closing balance корректен (5 месяцев, суммы совпадают)

NOTE: Функция работает корректно для текущих данных (только "Yes" и "Paid" в таблице), но при добавлении новых статусов потребует исправления констант.

Estimate: 2h

---

## ✅ Card 5 — Data cleanup
**[ЗАКРЫТО]** | Status: PARTIALLY VERIFIED ⚠️

Checklist:
* ✅ Guard для пустых Contracts строк (#N/A → пустые значения)
* ✅ Expense statuses нормализованы (EX1–EX6: Paid; EX7–EX12: Due/Planned)
* ⚠️ Typo "Pakinkg" в Units → НЕ исправлен (4 строки: U004, U005, и др.)
* ⚠️ P002/P003 не существуют в xlsx — только P001
* ❌ НОВАЯ ПРОБЛЕМА: Expenses categories (EX1-EX3, EX5-EX6) не совпадают с контрактными категориями

Estimate: 3–4h

---

# LIST 2 — CONTRACTS MODULE

## ✅ Card 6 — Finish updateContracts()
**[ЗАКРЫТО]** | Status: VERIFIED ✅

Checklist:
* ✅ Write-back paid amount (из Expenses по contractId)
* ✅ Remaining balance (contract − paid)
* ✅ Percent complete (paid / contract)
* ✅ Contract status: Active / Completed

NOTE: Нет clearContents() перед записью — низкий риск stale data.
DATA: D1=42%, D2=14%, D3=10%, D4=6% — значения корректны.

Estimate: 5h

---

## ✅ Card 7 — Contract burn-down tracking
**[ЗАКРЫТО]** | Status: PARTIALLY VERIFIED ⚠️

Checklist:
* ✅ Paid vs Contract Value — работает
* ✅ Remaining committed — работает
* ✅ Burn-down таблица (лист Contract Burn): 5 строк, месячная динамика
* ⚠️ Project column = Contractor ID (CTR1/CTR2) вместо Project ID (P001)

ACTION: Исправить Contracts.B: CTR1/CTR2/CTR3 → P001 в таблице.

Estimate: 5–6h

---

## ✅ Card 8 — Budget ↔ Contract mapping
**[ЗАКРЫТО] ← ОШИБОЧНО ЗАКРЫТА** | Status: NOT VERIFIED ❌

Checklist:
* ❌ Mapping-таблица отсутствует
* ❌ Contract package rollups — не реализованы
* ❌ Budget lines linkage — нет прямой связи Budget Category → Contract ID
* ❌ `generateBudgetVariance()` committed = 0 из-за неверного join (Contracts.B = CTR, не P001)

ACTION REQUIRED: Переоткрыть карточку. Без исправления Contracts.B и реализации mapping — Budget Variance Committed всегда 0.

Estimate: 1 day

---

## ✅ Card 9 — Committed Cost KPI
**[ЗАКРЫТО]** | Status: NOT VERIFIED ❌

Checklist:
* ❌ Calculation engine — `getCommittedCostStats()` читает Budget!row[7] (= col H = оплаченные суммы) вместо row[6] (= col G = смета)
* ❌ Dashboard B12 (Total Budget) = 36,000 EUR вместо реальных 8,823,919 EUR
* ⚠️ Committed Total отображается, но значение неверное

ACTION REQUIRED: Исправить `row[7]` → `row[6]` в Dashboard.gs.

Estimate: 3h

---

# LIST 3 — CLIENT COLLECTION ENGINE

## ✅ Card 10 — Implement allocatePayments()
**[ЗАКРЫТО]** | Status: VERIFIED ✅

Checklist:
* ✅ FIFO по contract date (Sales.row[7])
* ✅ Outstanding balances корректны
* ✅ Partial payment support
* ✅ Payment Allocations: 14 записей, суммы верные
* ✅ Данные реалистичны (135,500 EUR аллоцировано)

Estimate: 1 day

---

## ✅ Card 11 — Payment Schedule module
**[ЗАКРЫТО]** | Status: PARTIALLY VERIFIED ⚠️

Checklist:
* ✅ Installment schedule table (лист Payment Schedule)
* ✅ Due dates
* ✅ FIFO по due date (сортировка installments)
* ❌ Overdue flag — отсутствует в коде
* ❌ Только 1 запись (SCH001 для S001) — нет данных для S002–S005
* ❌ N×setValue в цикле вместо batch setValues
* ❌ Нет clearContents() перед записью

CRITICAL DATA GAP: Отсутствие Schedule для S002–S005 создаёт расхождение Receivables vs Schedule = 5.26M EUR.

ACTION: Заполнить Payment Schedule для сделок S002–S005.

Estimate: 1 day

---

## ✅ Card 12 — Aging receivables
**[ЗАКРЫТО]** | Status: VERIFIED ✅

Checklist:
* ✅ Bucket 0–30 дней
* ✅ Bucket 31–60 дней
* ✅ Bucket 61–90 дней
* ✅ Bucket 90+ дней
* ✅ Future payments excluded (diffDays < 0 → skip)
* ✅ Remaining ≤ 0 → skip
* ✅ clearContents + batch setValues

NOTE: Aging лист сейчас ПУСТ — это корректно, т.к. единственный scheduled платёж (SCH001, due 2026-05-15) ещё не просрочен. Данные появятся автоматически после 2026-05-15.

Estimate: 4h

---

# LIST 4 — COST CONTROL

## ✅ Card 13 — Budget vs Actual variance
**[ЗАКРЫТО] ← ЧАСТИЧНО** | Status: NOT VERIFIED ❌

Checklist:
* ✅ Функция `generateBudgetVariance()` написана (Budjet.gs)
* ✅ Variance amount = Budget − Actual
* ✅ Variance %
* ❌ НЕ ВЫЗЫВАЕТСЯ в `updateSystem()` → лист не обновляется автоматически
* ❌ Committed = 0 т.к. join сломан (Contracts.B = CTR, не P001)
* ❌ Actual = 0 т.к. Expense Categories не совпадают с Budget Categories

ACTION REQUIRED:
1. Добавить `_run("generateBudgetVariance", generateBudgetVariance)` в `updateSystem()`
2. Исправить Contracts.B → P001
3. Исправить Expense categories

Estimate: 1 day

---

# ═══════════════════════════════════════
# 🔄 АКТИВНЫЕ КАРТОЧКИ (Cards 14–29)
# ═══════════════════════════════════════

---

## Card 14 — Cost per sqm

Checklist:
* Actual cost / sqm
* Budget cost / sqm
* Dashboard KPI

Зависит от: Card 13 (корректный Budget Variance), Card 8 (Budget mapping)
Estimate: 2h

---

## Card 15 — Cost To Complete Engine

Formula:
```
Remaining budget + unpaid commitments + forecast payables
```

Checklist:
* Model
* KPI
* Project-level calculation

Зависит от: Card 7 ✅, Card 13
Estimate: 1 day

---

## Card 16 — Project filter selector

Checklist:
* All projects view
* Single project view
* Dynamic recalculation

NOTE: Сейчас только P001 существует. Нужно добавить P002/P003 в данные.
Estimate: 1 day

---

## Card 17 — Add advanced KPIs

Checklist:
* ✅ ROI (реализован в getProfitStats())
* Sales %
* Budget execution %
* Cost to complete
* ✅ Committed cost (реализован, но неверные данные)

Estimate: 1 day

---

## Card 18 — Liquidity forecast

Checklist:
* ✅ `getFutureIncome()` добавлен (читает Payment Schedule)
* ✅ `getCashGap()` добавлен
* ⚠️ Monthly projection — только summary, не помесячно

NOTE: getFutureIncome = 658,500 EUR (только SCH001). При заполнении S002–S005 значение изменится.
Estimate: 1–2 days

---

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

## Card 22 — Create Schema.gs

Checklist:
* ✅ Column maps (Schema.gs существует — создан в предыдущей итерации)
* Remove hardcoded row indexes
* Refactor scripts

Estimate: 1 day

---

## Card 23 — Batch write optimization

Checklist:
* ✅ Replace setValue loops — в allocatePayments, updateReceivables, generateAging, generateBudgetVariance
* ❌ updatePaymentSchedule() всё ещё использует N×setValue
* Speed testing

Estimate: 4h

---

## Card 24 — Error handling layer

Checklist:
* ✅ try/catch — `_run()` wrapper в Main.gs
* Validation guards (нет)
* Logging (Logger.log в _run)

Estimate: 4h

---

## Card 25 — Bank email parsing
(backlog)

## Card 26 — Gemini transaction categorization
(backlog)

## Card 27 — Scheduled triggers
✅ [ЗАКРЫТО] | Status: VERIFIED
`setupTriggers()` в Triggers.gs; ежедневный запуск 06:00 UTC.

## Card 28 — Weekly snapshots
(backlog)

## Card 29 — Role permissions
(backlog)

---

# МИЛЕСТОУНЫ

## Milestone MVP Complete (Cards 1–18)

**Прогресс: 12 из 18 = 67%**

| Card | Статус |
|---|---|
| 1–3 | ✅ Закрыто и VERIFIED |
| 4, 5, 7 | ✅ Закрыто, PARTIALLY VERIFIED |
| 6, 10, 12 | ✅ Закрыто, VERIFIED |
| 8, 9, 13 | ✅ Закрыто, **НО НЕ РАБОТАЕТ** — требует переоткрытия |
| 11 | ✅ Закрыто, PARTIALLY VERIFIED (данные неполные) |
| 14–18 | ⬜ Не начаты |

---

## Milestone Production V1 (Cards 1–24)

Текущий статус: ~50% готовности к production.

**Блокеры:**
1. Dashboard Budget = 36K вместо 8.8M (скрипт)
2. Contracts.B = Contractor ID вместо Project ID (данные)
3. generateBudgetVariance() не в pipeline (скрипт)
4. Payment Schedule неполный (данные)
5. Expenses categories mismatch (данные)
