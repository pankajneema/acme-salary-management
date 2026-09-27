# AI Workflow

I used **Claude Code** (an agentic CLI in VS Code) as a pair programmer. This file records *how* it was used and is updated at every step, so the commit history shows it growing next to the code.

## Principles

1. **Think first, then generate.** The requirements and design docs came before any code. The AI drafted; I reviewed the scope cuts and trade-offs. The first commit is docs only.
2. **Small, reviewable slices.** Each section is generated, run, tested and committed on its own, so every diff can be reviewed.
3. **Tests are the contract.** Every backend slice ships with its tests, and I run them before committing.
4. **Verify, don't trust.** Generated code is run against real data before it's committed.

## Log

| Step | What I asked for | Outcome / my decisions |
|------|------------------|------------------------|
| 1. Framing | Pasted the assessment brief. Asked for a one-page requirements doc (goal, persona, scope, deliberate exclusions with reasons) and design notes *before* any code. | Picked the stack when the AI asked instead of letting it guess: **FastAPI + SQLite** backend (my role), React + Mantine UI, deployed on **Render**. Reviewed the scope cuts. |
| 1b. Review | Asked whether this AI-workflow file was appropriate to commit. | The first draft listed prompts for steps that hadn't happened yet. I trimmed it to real history only; each later step adds its own row. |
| 2. Backend scaffold | FastAPI app factory, SQLAlchemy 2.0 typed models, env-based settings, and a pytest fixture with an isolated in-memory DB per test. | `uv init` generated a packaged `src/` layout with a CLI entry point, which was changed to a plain app (`package = false`). Ruff flagged `Depends()` in argument defaults (B008); this was fixed with an `Annotated` `DbSession` alias rather than suppressed. A test that only checked a tautology was dropped. Smoke-tested `/api/meta` against a running server. |
| 3. Employee API | Implement the employee endpoints per the design doc: server-side search/filter/sort/pagination, allow-listed sort fields, 409 on duplicate email, CSV export, and API tests for the happy paths and every validation branch. | Changes during review: the first router wrapped every call in lambda error mappers, which was replaced by app-level exception handlers so routes stay one line and services stay HTTP-agnostic. A double JOIN (eager load + sort join) became a single join with `contains_eager`. Salary sorting uses the **USD equivalent**, because sorting local amounts across currencies ranks 3,000,000 INR above 150,000 USD; a test pins this. CSV cells are escaped against spreadsheet formula injection, since HR opens exports in Excel. The first test run failed 35 tests because `email-validator` rejects the reserved `.test` TLD; test data moved to `acme.com`. Result: 48 tests, 97% coverage, under 1.5 s. |

## Where I steered the AI

- Chose the backend stack and the deployment target myself.
- Rejected a pre-written log of future steps: this file only records what actually happened.
- Kept AI attribution out of the commit messages; these commits are mine, and AI use is documented here instead.
