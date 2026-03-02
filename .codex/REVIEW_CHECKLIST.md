# REVIEW_CHECKLIST.md
Authoritative for: frontend pre-merge review gate.

## Critical
- [ ] One clear purpose
- [ ] Scope is small and reviewable
- [ ] Contract changes are explicit
- [ ] No wrong exposure risk introduced
- [ ] Verification evidence exists
- [ ] Rollback is clear

## Warning
- [ ] Added dependency justified
- [ ] Performance impact measured or estimated
- [ ] Degraded/error UX is explicit

## Final Gate
If backend payload is partially missing at 3 a.m., does UI fail closed and stay diagnosable?
