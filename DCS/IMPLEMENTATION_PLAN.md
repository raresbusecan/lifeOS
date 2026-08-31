# DCS Implementation Plan

This is the ordered path. Do not jump ahead because a later component looks useful.

## Phase 0 — Audit and freeze

### DCS-001 — Current System Audit
READ-ONLY.
Execute `.agent/tasks/STEP_01_CURRENT_SYSTEM_AUDIT.md`.
No source modifications.

### DCS-002 — Terminology Reconciliation
Compare DCS v1 with:
- `AGENTS.md`
- `PROJECT_STATE.md`
- `agent/PLAN_IMPLEMENT.md`
- `agent/ROADMAP_TO_DEV_FLOW.md`
- audit output.

Produce a terminology/conflict map.

### DCS-003 — Adversarial DCS Review
Check:
- missing states;
- illegal transitions;
- scope leaks;
- circular dependencies;
- unclear ownership;
- missing failure paths;
- excessive complexity.

### DCS-004 — DCS v1 Freeze
Accept/reject the specification through a recorded decision.

No implementation before this gate.

## Phase 1 — Deterministic foundation

### DCS-005 — State/Workflow Guard
Enforce legal transitions and role/state mapping.

### DCS-006 — Task Contract
Persist/validate task identity, acceptance criteria, dependencies and attempts.

### DCS-007 — Impact Map
Persist expected files/components/tests and risk.

### DCS-008 — Scope Enforcement
Compare approved scope with actual Git diff.

## Phase 2 — Execution controls

### DCS-009 — AgentRunner boundary
Keep provider/model details behind a stable interface.

### DCS-010 — ContextBuilder
Build role-specific context packs; no full-repository prompt dumping.

### DCS-011 — Capability/Tool layer
Separate read, write and execute capabilities.

### DCS-012 — Permission engine
Enforce role and path permissions in code.

### DCS-013 — Controlled coder path
Proposal → validate → apply → scope check.

### DCS-014 — Deterministic test executor
Raw command result is authoritative; LLM interprets it.

## Phase 3 — Roles

### DCS-015 Planner
### DCS-016 Analyst
### DCS-017 Architect
### DCS-018 Council
### DCS-019 Coder
### DCS-020 Tester
### DCS-021 Triage
### DCS-022 Reviewer

Each role is implemented and tested independently.

## Phase 4 — End-to-end proof

### DCS-023 — First real low-risk agent task

Must prove:

```text
CREATE
→ ANALYZE
→ COUNCIL
→ CONTRACT
→ IMPACT
→ GIT
→ CODER
→ TEST
→ TRIAGE
→ REVIEW
→ CHECKPOINT
→ DONE
```

## Phase 5 — Failure proof

DCS-024: related failure → retry.
DCS-025: three failures → escalation.
DCS-026: unrelated bug → new task.
DCS-027: ambiguous failure → Council.
DCS-028: scope violation → reject.
DCS-029: illegal transition → reject.
DCS-030: environment/model failure → recoverable blocked state.

## Phase 6 — Only after proof

DCS-031 Sprint engine.
DCS-032 Model router.
DCS-033 Autonomous development loop.
DCS-034 Developer console.

Do not implement Phase 6 until all core failure-path tests pass.

## Completion

DCS v1 is operational only when a small real task completes end-to-end and the major failure paths are deterministic and resumable.
