# QUESTIONS.md
Authoritative for: when frontend should ask first vs proceed.

## Ask First If Missing
- API/static contract version and owner
- Serving policy details (`serve_allowed`, status handling)
- Timezone/display contract
- Done condition and verification method
- Runtime environment (hosting/CDN/auth)

## Proceed Without Blocking Questions Only If
- change is local and mechanical
- contract impact is zero
- verification is obvious

## Question Rule
Ask only questions that affect correctness, safety, or policy compliance.
