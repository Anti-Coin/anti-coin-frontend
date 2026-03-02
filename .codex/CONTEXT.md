# CONTEXT.md
Authoritative for: frontend intent and constraints.

## Why Frontend Exists
1) Provide reliable user-plane view from validated backend outputs.
2) Preserve policy honesty (fresh/degraded/hard-fail semantics).
3) Stay decoupled from backend implementation churn.

## Non-Negotiable Priority
1) Stability/reliability
2) Cost/resource efficiency
3) Performance

## Backend-Blind Principle
- FE treats backend as a contract provider, not an implementation to infer from.
- FE does not depend on worker roles, internal files, or DB details.

## Runtime Reality
- Target infra has limited resources.
- FE should prefer low-complexity, static-first rendering where possible.
