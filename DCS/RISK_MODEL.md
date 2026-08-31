# Risk Model

## LOW
Examples:
- documentation;
- isolated tests;
- local low-impact bug fix;
- non-structural refactor.

Normal gate and validation.

## MEDIUM
Examples:
- multi-component changes;
- new modules;
- persistence behavior;
- workflow changes;
- cross-module API changes.

Requires explicit risk record and stronger review.

## HIGH
Examples:
- architecture;
- security/authentication;
- destructive data changes;
- permission model;
- breaking contracts;
- DCS governance changes.

Requires human approval.

## Record

```text
level
reason
affectedComponents
failureImpact
reversibility
mitigations
requiredGate
```

If discovered risk is higher than the approved risk:

```text
STOP
→ update risk
→ required gate
→ continue only after approval
```

The model cannot downgrade risk merely to avoid a gate.
