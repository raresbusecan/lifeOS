# State Machine

## Primary states

```text
CREATED
ANALYSIS
COUNCIL
CONTRACT_READY
IMPACT_APPROVED
GIT_READY
CODING
IMPLEMENTED
TESTING
TRIAGE
REVIEW
DONE
```

## Special states

```text
BLOCKED
NEEDS_CLARIFICATION
ARCHITECTURE_REVIEW
FAILED
CANCELLED
```

## Legal transitions

```text
CREATED → ANALYSIS
ANALYSIS → COUNCIL | NEEDS_CLARIFICATION
COUNCIL → CONTRACT_READY | IMPACT_APPROVED | NEEDS_CLARIFICATION | ARCHITECTURE_REVIEW | BLOCKED
CONTRACT_READY → IMPACT_APPROVED
IMPACT_APPROVED → GIT_READY
GIT_READY → CODING
CODING → IMPLEMENTED
IMPLEMENTED → TESTING
TESTING → TRIAGE
TRIAGE → REVIEW              [PASS]
TRIAGE → CODING              [RELATED + attempts remain]
TRIAGE → NEW_TASK_CREATED    [UNRELATED]
TRIAGE → COUNCIL             [AMBIGUOUS]
TRIAGE → BLOCKED             [environment/unrecoverable]
REVIEW → DONE
REVIEW → CODING              [changes required]
```

`NEW_TASK_CREATED` is an event/result, not a permanent state.

## Forbidden examples

```text
CREATED → CODING
CODING → DONE
TESTING → DONE
TRIAGE → DONE
```

The workflow guard must reject them.

## Transition evidence

Every transition records:
- task ID;
- current state;
- target state;
- actor/role;
- evidence;
- reason;
- timestamp.

The model can recommend a transition. It cannot apply one directly.
