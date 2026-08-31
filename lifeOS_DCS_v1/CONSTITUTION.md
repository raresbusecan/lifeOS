# DCS Constitution

## 1. Authority

The workflow engine is authoritative over lifecycle state.

An LLM may not:
- arbitrarily change task state;
- bypass a gate;
- declare `DONE`;
- expand approved write scope;
- approve its own architectural change;
- exceed the attempt limit;
- modify protected areas without authorization.

## 2. Source precedence

When information conflicts, use:

1. executable code and verified runtime behavior;
2. accepted DCS decisions;
3. `AGENTS.md`;
4. current project/task state;
5. approved task contract;
6. planning documents;
7. model output or memory summaries.

Never silently guess over a conflict.

## 3. No implicit scope expansion

Discovery is not authorization.

An out-of-scope discovery must be classified and either:
- left untouched;
- turned into a child/new task;
- or explicitly approved as a scope change.

## 4. Architecture changes require a decision

A structural change requires:
- problem;
- evidence;
- alternatives;
- impact;
- risk;
- recommendation;
- decision;
- validation.

## 5. Deterministic controls

These must be enforced by code:
- legal state transitions;
- role permissions;
- write scope;
- retry limits;
- tests;
- completion criteria.

## 6. Context discipline

Never send the whole repository by default.

Build context from:
1. task contract;
2. current state;
3. impact map;
4. relevant files;
5. dependencies;
6. relevant decisions;
7. previous failures;
8. semantic retrieval;
9. broader exploration only when justified.

## 7. Failure discipline

A failed test is evidence, not permission to keep coding blindly.

Classify the failure before retrying.

Default automatic retry limit: 3 related attempts.

## 8. Completion discipline

`DONE` requires deterministic evidence and the Definition of Done.

## 9. Human approval

Human approval is required for:
- product-direction changes;
- high-risk architecture changes;
- security-sensitive changes;
- destructive operations;
- unresolved ambiguity;
- scope expansion across protected boundaries;
- repeated failure after the retry limit.

## 10. Bootstrap safety

During DCS bootstrap:
- do not modify application source;
- do not delete user files;
- do not change secrets;
- do not install unnecessary dependencies;
- do not perform destructive Git operations;
- do not auto-commit.
