# DCS State

## Purpose

`DCS_STATE.json` is the machine-readable source of truth for the current Development Control System state.

`DCS_STATE.schema.json` defines the valid structure and values.

This Markdown file is documentation only. It is **not** a source of runtime state.

## Current State Fields

| Field          | Meaning                                         |
| -------------- | ----------------------------------------------- |
| `dcsVersion`   | Active DCS specification version                |
| `project`      | Project identifier                              |
| `activeTask`   | The single task currently authorized to execute |
| `state`        | Current lifecycle state of the active task      |
| `attempt`      | Current implementation attempt                  |
| `maxAttempts`  | Maximum allowed attempts                        |
| `status`       | Overall DCS runtime status                      |
| `nextTask`     | Next controller-approved task                   |
| `freezeStatus` | Whether DCS governance is frozen                |

## Authority

The controller is responsible for changing `DCS_STATE.json`.

The LLM must never directly modify lifecycle state.

The LLM may recommend a transition, but the controller validates and applies it.

## Bootstrap State

The initial bootstrap state is:

```text
DCS Version: 1.0.0
Active Task: DCS-000
State: ANALYSIS
Attempt: 0
Max Attempts: 3
Status: ACTIVE
Next Task: DCS-000
Freeze Status: BOOTSTRAP
```

## State Changes

A state change must:

1. originate from a valid workflow transition;
2. satisfy the required gate;
3. have supporting evidence;
4. be recorded in the transition ledger;
5. update the checkpoint when required.

Manual edits to lifecycle state are not permitted during normal operation.

## Recovery

If the runtime is interrupted, the controller reconstructs the current execution from:

```text
DCS_STATE.json
+
CURRENT_TASK.json
+
LAST_CHECKPOINT.json
+
transitions.jsonl
```

The system must never infer a new task merely from conversational context.
