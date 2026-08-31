# Agent Protocol

## Input

Every worker receives a role-specific context pack containing:
- task contract;
- current state;
- scope;
- impact map;
- relevant repository evidence;
- decisions;
- previous failures;
- acceptance criteria.

## Output

Structured result:

```text
status
summary
evidence
findings
proposals
risks
artifacts
nextAction
```

## Universal rules

1. Distinguish FACT, INFERENCE and PROPOSAL.
2. Never hide uncertainty.
3. Never claim a check passed without evidence.
4. Never change role boundaries.
5. Never expand write scope implicitly.
6. Reference artifacts instead of copying large source blocks.
7. Keep output concise enough for the next stage.

## Coder output

Must include:
- changed files;
- created/deleted files;
- tests changed;
- tests run;
- implementation summary;
- unresolved issues;
- scope exceptions requested.

## Tester output

Must be based on deterministic test results.

## Controller rule

The controller selects the legal next state. The model does not.
