# Memory Interface

## Purpose

Define what the development system needs to retrieve/store without coupling the contract to one storage implementation.

## Memory levels

### Working memory
Current model call only.

### Task memory
Task contract, attempts, failures, current evidence.

### Project memory
Stable architecture, decisions, constraints, verified facts.

### Semantic repository memory
Searchable code/document summaries and embeddings.

## Conceptual operations

```text
getProjectState()
getCurrentTask(taskId)
getTaskHistory(taskId)
getDecision(id)
getDecisionsFor(component)
getRelevantArchitecture(component)
getRelevantFiles(task)
getPreviousFailures(task)
getKnownUnknowns()
recordCheckpoint(checkpoint)
recordDecision(decision)
recordFailure(failure)
```

## Retrieval order

```text
exact task
→ exact files
→ direct dependencies
→ relevant decisions
→ previous failures
→ semantic retrieval
→ broader exploration
```

## Cache

Use file hashes and dependency invalidation. Unchanged content should not be re-read or re-indexed unnecessarily.

## Do not persist

- secrets;
- credentials;
- temporary chain-of-thought;
- unverified assumptions as facts.

Persist evidence, decisions, reproducible state and verified summaries.
