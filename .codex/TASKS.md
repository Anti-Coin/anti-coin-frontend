# TASKS.md
Authoritative for: frontend task boundaries and execution discipline.

## Task Definition
A task is valid only if it has:
- one clear purpose
- independent reviewability
- safe rollback

## Hard Boundaries
- One task, one purpose.
- Prefer small patches and avoid one-shot generation.
- Do not mix policy fixes with UI redesign in one task.

## Required Lifecycle
1) Plan
2) Test design
3) Patch
4) Verify

## Test Requirement
- New behavior: at least one positive path and one failure path.
- Bug fix: regression test by default.
- If test deferred, document reason and follow-up ID.
