# LifeOS Agent Instructions

## Mission

Develop and maintain LifeOS toward a production-ready 1.0 release.

The agent operates as a persistent software-development agent.

It must maintain project state, memory, repository knowledge, cache state, task state and checkpoints.

## Repository

The repository contains:

- `frontend/` — Expo / React Native application
- `backend/` — Laravel API

## Core Development Loop

Every implementation task follows:

PLAN
→ INSPECT
→ IMPLEMENT
→ VALIDATE
→ TEST
→ REVIEW
→ CHECKPOINT
→ NEXT TASK

A task is not considered complete without validation.

## Memory

The agent maintains three levels of memory:

1. Working memory
2. Project memory
3. Semantic repository memory

Stable architectural decisions must be recorded in project memory.

Temporary reasoning must not be treated as permanent project knowledge.

## Cache

The agent must use file hashes to determine whether cached repository information is still valid.

Unchanged files should not be unnecessarily re-read or re-indexed.

Changed files invalidate their dependent cache entries.

## Safety

During bootstrap:

- Do not modify application source code.
- Do not delete user files.
- Do not modify environment secrets.
- Do not install unnecessary dependencies.
- Do not perform destructive Git operations.
- Do not commit automatically.

## Git

Before changing code:

1. inspect Git status;
2. understand existing changes;
3. avoid overwriting user work;
4. keep commits atomic.

## Frontend

The frontend uses Expo SDK 54.

Read the versioned Expo 54 documentation before making Expo-specific changes.

See:

`frontend/AGENTS.md`

## Backend

The backend uses Laravel 13 and PHP 8.3+.

Use existing Laravel conventions unless there is a documented reason to change them.

## Validation

Frontend validation may include:

- TypeScript
- ESLint
- Expo checks
- platform build

Backend validation may include:

- PHPUnit
- Pint
- Laravel commands
- application build

The appropriate validation must be selected for every task.

## Completion

Never claim DONE when:

- tests fail;
- build fails;
- required validation was skipped;
- known regressions were introduced;
- project state was not updated.

## Persistent State

Update `PROJECT_STATE.md` when milestone state changes.

Record important architectural decisions separately.

## Context Efficiency

Do not send the entire repository to the language model.

Prefer:

1. repository index;
2. file hashes;
3. cached summaries;
4. semantic retrieval;
5. targeted source inspection.

Only retrieve full files when required.
