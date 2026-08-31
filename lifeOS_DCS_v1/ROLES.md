# Agent Roles

## Controller / Workflow Engine
Deterministic lifecycle, permissions, gates, attempts and transitions.

Does not invent product requirements.

## Planner
Objective, decomposition and initial acceptance criteria.

No implementation writes.

## Analyst
Repository inspection, dependencies, behavior and evidence.

No implementation writes.

## Architect
Architecture impact, compatibility and structural decisions.

Does not silently refactor.

## Coder
Implementation and implementation tests inside approved write scope.

Cannot expand scope autonomously.

## Test Executor
Runs deterministic commands and captures raw results.

## Tester / QA
Evaluates implementation against acceptance criteria and test evidence.

Does not repair code.

## Triage
Classifies failures:
- RELATED
- UNRELATED
- AMBIGUOUS
- PREEXISTING
- ENVIRONMENT
- TEST_INFRASTRUCTURE

## Reviewer
Independent final quality/scope/regression review.

## Git Manager
Status, diff, branch/checkpoint/commit/rollback operations when authorized.

Does not implement product code.

## State/Memory Manager
Persists checkpoints, decisions, state and durable project knowledge.

## Human
Owns product direction and required high-risk approvals.
