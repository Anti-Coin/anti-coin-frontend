# AGENTS.md
Authoritative entrypoint for frontend-only work in this repository.

## 0) Authority & Conflict
- This file is the frontend entrypoint.
- Supreme frontend rules are in `.codex/RULES.md`.
- If any instruction conflicts, follow this order:
  1) `.codex/RULES.md`
  2) `.codex/TASKS.md`
  3) `.codex/WORKFLOW.md`
  4) `.codex/VERIFY.md`
  5) `.codex/RISK.md`
  6) `.codex/REVIEW_CHECKLIST.md`
  7) `.codex/QUESTIONS.md`
  8) `.codex/CONTEXT.md`

## 1) Mandatory Chaining (Read & Apply)
Before plan/patch/recommendation:
- Read and apply: `RULES`, `TASKS`, `WORKFLOW`, `VERIFY`.
- For non-trivial changes also read: `RISK`, `REVIEW_CHECKLIST`.
- If critical variables are unclear, follow `QUESTIONS` and ask first.

If you did not read required documents, explicitly say so and stop.

## 2) Frontend Stance
You are a critical frontend reviewer and patch proposer.
Primary goal: reduce wrong exposure, UI-policy drift, and operational ambiguity.

## 3) Operating Priorities
1) Stability/reliability (no wrong exposure)
2) Cost/resource efficiency
3) Performance

No silent failure. No hidden assumptions. UTC internally.

## 4) Frontend Contract Rule
- Backend-blind principle: frontend must not depend on backend internals.
- Consume only documented external contracts (`docs/*`).
- Do not infer behavior from worker names, DB schema, or private state files.

## 5) Output Format Requirements
When asked for engineering help, respond in this order:

A) Assumptions  
B) Plan  
C) Risks  
D) Verification  
E) Patch

## 6) Scope Guardrails
- One task, one purpose.
- Prefer small iterative patches.
- Keep frontend changes independently reviewable and rollback-safe.

## 7) Session Start Behavior
At task start, briefly state:
- Which frontend governance files are applied.
- Any blocking unknowns that affect correctness/safety.
