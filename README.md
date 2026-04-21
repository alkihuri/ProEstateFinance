# ProEstateFinance (Google Sheets Solution)

ProEstateFinance is a Google Apps Script solution for managing real-estate project finance directly in Google Sheets.  
It centralizes sales, client payments, contracts, expenses, cash balances, and executive KPIs in one workbook and keeps key metrics updated automatically.

## Solution Architecture

### 1) Platform and Runtime
- **Platform:** Google Sheets (data storage and reporting UI)
- **Automation layer:** Google Apps Script (`.gs` files)
- **Execution model:** event-driven updates (`onEdit`) + callable orchestration functions (`initSystem`, `updateSystem`)

### 2) Data Layer (Sheet-Centric Model)
The solution uses named sheets as domain tables (configured in `Config.gs`):
- `Projects` — project catalog and status
- `Units` — inventory of units
- `Clients` — client master data
- `Sales` — sales transactions
- `Client Payments` — incoming payments
- `Budget` — planned costs
- `Contractors` — contractor master data
- `Contracts` — contract commitments
- `Expenses` — outgoing payments / cost realization
- `Bank Accounts` — current cash balances
- `Cash Flow` — target area for periodic inflow/outflow logic
- `Dashboard` — consolidated KPI output

This design keeps business data in sheets while scripts provide transformation and aggregation logic.

### 3) Application Layer (Script Modules)
- `Main.gs`
  - `updateSystem()` orchestrates all core recalculations:
    1. `updateDashboard()`
    2. `generateCashFlow()`
    3. `updateContracts()`
    4. `allocatePayments()`
  - `initSystem()` runs initial full refresh.

- `Triggers.gs`
  - `onEdit(e)` listens for edits in key transactional sheets:
    - `Client Payments`
    - `Expenses`
    - `Sales`
    - `Contracts`
  - On relevant edits, it triggers `updateSystem()` for near-real-time refresh.

- `Dashboard.gs`
  - Builds KPI blocks and writes them into fixed `Dashboard` cells:
    - **Project overview** (`B2:B4`)
    - **Sales & collection** (`B7:B9`)
    - **Budget/contract/expense tracking** (`B12:B15`)
    - **Cash position and obligations** (`B18:B21`)
    - **Profitability** (`B24:B27`)
  - Aggregates source data from multiple sheets and computes totals, balances, and ratios.

- `CashFlow.gs`
  - `generateCashFlow()` groups payment inflows and expense outflows by month (`YYYY-M`) to build a monthly cash-flow structure.

- `Contracts.gs`
  - `updateContracts()` maps contract totals and accumulates paid amounts from expenses by contract ID.

- `Payments.gs`
  - `allocatePayments()` scans payments and sales to match entries by client and project (allocation logic placeholder is prepared for extension).

- `Utils.gs`
  - Shared helper utilities (for example, month key formatting).

### 4) Processing Flow
1. User updates a transactional sheet row (sale, payment, expense, or contract).
2. `onEdit` validates the edited sheet.
3. `updateSystem` executes a full recalculation pipeline.
4. Metrics and aggregates are recomputed from source sheets.
5. Results are written to dashboard KPI cells (and logged where intermediate structures are currently used).

### 5) Architectural Characteristics
- **Single source of truth:** raw operational data stays in sheets.
- **Deterministic recalculation:** KPI outputs are rebuilt from current sheet state on every relevant edit.
- **Modular domain functions:** each financial domain has a dedicated script module.
- **Low deployment overhead:** no external database or server required; runs fully in Google Workspace.

### 6) Current Extensibility Points
- Implement final write-back from `generateCashFlow()` into the `Cash Flow` sheet.
- Complete allocation behavior inside `allocatePayments()` for installment/prioritization rules.
- Add validation and error handling for malformed or missing row data.
- Add scheduled triggers for periodic full refresh and archival snapshots.
