# Requirements — ACME Salary Management

> One-page requirements document, written **before** implementation.

## 1. Goal

Replace the spreadsheets that ACME's HR team uses to manage salaries for ~10,000 employees in several countries. The replacement is a web application that lets an **HR Manager**:

1. **Manage** salary records reliably: find, add, edit and remove employees and their pay.
2. **Understand** how the organisation pays people: answer questions such as *"What is the min / max / average salary in India?"*, *"What does a Software Engineer earn in Germany vs. the US?"* or *"Which departments cost the most?"*. Today these answers need pivot tables.

**Success looks like:** the HR manager can find any employee in under 2 seconds, update a salary in under 30 seconds, and answer the common pay questions from one screen without exporting to Excel.

## 2. Persona

**HR Manager (single role).** Comfortable with Excel and not technical. Thinks in *countries, job titles and departments*, not in SQL. Needs results they can trust, because pay data is sensitive and mistakes are costly.

## 3. Scope & Features (in)

| # | Feature | Why it matters |
|---|---------|----------------|
| F1 | **Employee directory**: paginated table over 10k rows with server-side search (name / email / employee code), filters (country, department, job title) and sorting | Replaces "Ctrl+F in a 10k-row sheet" |
| F2 | **Create / edit / delete employee** with validation (required fields, positive salary, unique email, valid country) | Core management task; validation stops the data-quality drift that spreadsheets allow |
| F3 | **Salary shown in local currency, with a USD equivalent** | Multi-country org: pay can only be compared after normalising currency |
| F4 | **Country insights**: headcount, min / max / average / median salary per country | The questions named directly in the problem statement |
| F5 | **Job-title insights within a country**: min / max / average / median per job title for a selected country | "How much do we pay a Data Analyst in the UK?" |
| F6 | **Org overview**: total headcount, total annual payroll (USD), department breakdown, salary distribution histogram | The "how do we pay people" overview for leadership conversations |
| F7 | **CSV export** of the current (filtered) employee list | HR will still want to share or pivot data. This makes the transition off Excel smooth instead of forced. |
| F8 | **Seed script** for 10,000 realistic, reproducible employees | Required; also makes demos and performance testing meaningful |

## 4. Deliberately out of scope (and why)

| Left out | Reasoning |
|----------|-----------|
| **Authentication / RBAC** | There is one persona and the assessment is about salary management. Real deployments would sit behind company SSO (OIDC). Building login forms here adds code but no insight. The API is structured so an auth dependency can be added in one place. |
| **Salary history / audit trail** | Valuable (who changed what, when), but it doubles the data model. It is the first thing I'd add next (see design notes). `updated_at` is tracked meanwhile. |
| **Payroll processing, tax, bonuses, benefits, equity** | Different domain (compliance-heavy, country-specific). The brief is about *salary data*, not running payroll. |
| **Bulk CSV/Excel import** | Migrating off Excel needs it eventually, but robust import (column mapping, partial failures, dedup) is a feature in itself. Export (F7) is cheap; import is not. |
| **Live FX rates** | A fixed, dated rate table keeps insights deterministic and testable. Live rates would make yesterday's report disagree with today's for no HR reason. |
| **Multi-tenant, i18n, mobile-first UI** | One organisation, used on desktop by HR. |
| **Horizontal scaling / Postgres** | 10k rows is small. SQLite with correct indexes answers every query here in milliseconds. The data layer uses SQLAlchemy, so a Postgres swap is a config change. |

## 5. Non-functional requirements

- **Performance:** list and insight endpoints respond in < 200 ms at 10k employees. Pagination is always server-side; the UI never loads all 10k rows.
- **Correctness:** salary is stored as an integer (whole units of local currency, annual gross), so there is no float drift. Currency is derived from country, so the two can never disagree.
- **Quality:** fast, deterministic unit and API tests; the seed is reproducible with a fixed RNG seed.
- **Operability:** one-command local run; a single Docker image deployed to Render. The app auto-seeds on first boot so a fresh deploy is demo-ready.

## 6. Assumptions

- Salary means **annual gross base salary** in the employee's country currency.
- Each employee belongs to exactly one country and one department and has one job title.
- ~10 countries and a fixed catalogue of departments and job titles are enough for the insights. Job titles are free text in the API but chosen from a list in the UI.
