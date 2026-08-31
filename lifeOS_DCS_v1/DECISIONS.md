# Decisions / Proposals

## Why

Prevent architectural drift and repeated rediscovery of rejected ideas.

## Lifecycle

```text
DISCOVERED
→ PROPOSED
→ REVIEW
→ ACCEPTED | REJECTED | DEFERRED
```

## Proposal required when

- architecture changes;
- protected scope expands;
- an accepted decision is contradicted;
- a dependency changes the plan;
- task objective/acceptance criteria must change;
- failure remains ambiguous.

## Schema

```text
id
taskId
title
problem
evidence
currentBehavior
proposedChange
alternatives
impact
risk
reversibility
recommendation
decision
decisionBy
decisionAt
```

## Rules

Accepted decisions become durable knowledge.

Rejected decisions remain recorded.

Decisions are append-only; never rewrite history to hide a previous choice.
