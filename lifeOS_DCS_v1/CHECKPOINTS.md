# Checkpoint System

## Purpose

Make development resumable, auditable and recoverable.

## Checkpoint moments

1. before implementation;
2. after every implementation attempt;
3. after validation;
4. before escalation;
5. at task completion.

## Required data

```text
taskId
state
attempt
timestamp
gitRef
changedFiles
testResult
decisionRefs
discoveries
knownProblems
nextAction
```

## Recovery question

A fresh session must be able to answer:

- where are we?
- what was attempted?
- what worked?
- what failed?
- what is approved?
- what is blocked?
- what happens next?

A checkpoint cannot declare success without validation evidence.
