# Development Cycle

## Canonical lifecycle

```text
INTAKE
  ↓
QUALIFY
  ↓
ANALYZE
  ↓
CONTEXT_READY
  ↓
PLAN
  ↓
RISK_ASSESSED
  ↓
GATE
  ↓
IMPLEMENT
  ↓
VALIDATE
  ↓
TRIAGE
  ↓
REVIEW
  ↓
CHECKPOINT
  ↓
DONE
```

## Failure branches

```text
TRIAGE
├─ PASS → REVIEW
├─ RELATED → IMPLEMENT (attempt + 1)
├─ UNRELATED → CREATE NEW TASK
├─ AMBIGUOUS → COUNCIL
├─ ENVIRONMENT → BLOCKED
└─ SCOPE_VIOLATION → reject or re-authorize
```

## Stage contracts

### INTAKE
Turn a request into a task candidate.

### QUALIFY
Check objective, parent, duplicate work, dependencies and acceptance criteria.

### ANALYZE
Inspect relevant repository evidence. No implementation writes.

### CONTEXT_READY
Create a role-specific context pack.

### PLAN
Produce implementation steps, expected files and tests.

### RISK_ASSESSED
Assign risk and required gate.

### GATE
Workflow decides whether implementation is authorized.

### IMPLEMENT
Coder writes only inside approved scope.

### VALIDATE
Run deterministic checks.

### TRIAGE
Classify failures using evidence.

### REVIEW
Independent review against requirements, diff, tests and scope.

### CHECKPOINT
Persist recovery state and evidence.

### DONE
Only the workflow engine can transition a task to DONE.

## Mandatory stop conditions

Stop/escalate if:
- required context is unavailable;
- scope must expand;
- architecture must change;
- failure is ambiguous;
- retry limit is reached;
- validation cannot establish correctness.
