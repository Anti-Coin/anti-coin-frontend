# RISK.md
Authoritative for: frontend risk disclosure.

## Required Sections
Every non-trivial proposal includes:
1) Uncertainty statement
2) Failure modes
3) Corner cases
4) Mitigation/detection plan

## Typical Risk Categories
- Wrong exposure (hard-fail data shown as normal)
- Contract drift (schema mismatch)
- Timezone/display mismatch
- Performance regressions (slow first render)
- Silent fallback (hidden errors)
