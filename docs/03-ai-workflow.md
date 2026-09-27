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

## Where I steered the AI

- Chose the backend stack and the deployment target myself.
- Rejected a pre-written log of future steps: this file only records what actually happened.
- Kept AI attribution out of the commit messages; these commits are mine, and AI use is documented here instead.
