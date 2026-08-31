# Task Model

## Identity

Recommended ID: `TASK-YYYY-NNN`.

## Required fields

```text
id
title
objective
parentTaskId
lineage
priority
status
risk
ownerRole
acceptanceCriteria
constraints
dependencies
readScope
writeScope
protectedAreas
impactMap
requiredTests
attemptCount
attemptHistory
decisions
checkpoints
createdAt
updatedAt
```

## Hierarchy

```text
PLAN/EPIC
  └─ TASK
      ├─ CHILD TASK
      ├─ BUG TASK
      └─ FOLLOW-UP TASK
```

A discovered issue never silently becomes part of the current task.

## Task contract

Before coding:
- objective is explicit;
- acceptance criteria are testable;
- constraints are explicit;
- scope is approved;
- dependencies are known or marked unknown;
- tests are identified;
- risk and gate are assigned.

## Immutability

Approved objective and acceptance criteria cannot be silently weakened.

Scope changes require an explicit decision.

Decisions and attempts are append-only.

## Attempts

Each attempt records:
- attempt number;
- context reference;
- changes;
- tests;
- failures;
- diagnosis;
- result.

Default maximum automatic attempts: 3.
