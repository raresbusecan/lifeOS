# LifeOS Development Control System (DCS) v1

This package defines the controlled development lifecycle for the AI agent system.

## Scope

For bootstrap, work only on:
- `agent/`
- `.agent/`
- DCS documentation

Do not touch `frontend/` or `backend/` unless a later task explicitly authorizes integration.

## Existing foundation

The repository already contains substantial development-flow design:
- `AGENTS.md`
- `PROJECT_STATE.md`
- `.agent/tasks/STEP_01_CURRENT_SYSTEM_AUDIT.md`
- `agent/PLAN_IMPLEMENT.md`
- `agent/ROADMAP_TO_DEV_FLOW.md`

DCS v1 is a governance/reconciliation layer around that work, not a replacement.

## Normative documents

1. CONSTITUTION.md
2. CYCLE.md
3. STATE_MACHINE.md
4. TASK_MODEL.md
5. SCOPE_MODEL.md
6. ROLES.md
7. RISK_MODEL.md
8. GATES.md
9. DECISIONS.md
10. CHECKPOINTS.md
11. PROJECT_STATE.md
12. MEMORY_INTERFACE.md
13. AGENT_PROTOCOL.md
14. IMPLEMENTATION_PLAN.md

Templates are in `templates/`.

## Core rule

**The LLM proposes and executes within permission. Code controls lifecycle, permissions, scope, retries, validation and completion.**
