# Scope / Boundary Model

## Two scopes

### Read scope
What a worker may inspect.

### Write scope
What a worker may modify.

Read scope can be broader than write scope.

## Scope record

```text
allowedFiles
allowedDirectories
allowedComponents
protectedFiles
protectedDirectories
allowedOperations
forbiddenOperations
expectedChanges
expectedTests
```

## Expected vs actual

Before implementation:
- expected files;
- expected components;
- expected tests.

After implementation:
- actual changed/created/deleted files;
- actual test changes.

The controller compares them.

## Scope violation

If actual modifications exceed authorization:

```text
SCOPE_VIOLATION
```

The task cannot complete until:
1. unauthorized changes are reverted; or
2. scope is explicitly re-approved and the impact map is updated.

## Out-of-scope discovery

Classify as:
- BLOCKING_DEPENDENCY
- RELATED_CHANGE
- UNRELATED_BUG
- ARCHITECTURE_CONCERN
- NEW_IDEA
- UNKNOWN

## Bootstrap boundary

DCS bootstrap work is limited to `agent/` and `.agent/`.
`frontend/` and `backend/` remain protected.
