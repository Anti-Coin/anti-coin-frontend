# RULES.md
Authoritative for: frontend non-negotiable constraints.

## Priority Order
Always decide in this order:
1) Stability/reliability
2) Cost/resource efficiency
3) Performance

## Core Rules
### FR1) Backend-Blind Contract First
Consume only documented frontend contracts.
Do not depend on backend internals or implementation names.

### FR2) No Wrong Exposure
If `serve_allowed=false` or hard-fail status is detected, block user exposure.

### FR3) No Silent Failure
Show explicit degraded/error state in UI.

### FR4) Idempotent UI Actions
Retries/reloads must not create duplicated user actions or state corruption.

### FR5) UTC Internally
Store and compare in UTC; convert only at view boundary.

### FR6) One Task, One Purpose
Do not mix refactor + feature + safety fixes.

### FR7) Small Patch Default
Default scope: small, reviewable, rollback-safe.

### FR8) Dependency Gate
New dependency requires rationale, cost, alternative, rollback.

### FR9) Verification Mandatory
No completion without evidence.

### FR10) Practical MVP
Prefer smallest operable frontend that preserves policy honesty.
