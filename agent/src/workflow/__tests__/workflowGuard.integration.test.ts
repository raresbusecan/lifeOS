import assert from "node:assert/strict";
import {
  mkdtemp,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  createTask,
} from "../taskFactory.js";

import {
  loadTaskStore,
  saveTaskStore,
} from "../taskPersistence.js";

import {
  TaskStore,
} from "../taskStore.js";

import {
  WorkflowGuard,
} from "../workflowGuard.js";

import {
  createTaskContract,
} from "../taskContract.js";

import type { ImpactMap } from "../impactMap.js";

const validImpactMap: ImpactMap = {
  filesToModify: ["src/workflow/task.ts"],
  filesToCreate: [],
  testsToModify: [],
  testsToCreate: [],
  componentsAffected: ["workflow"],
  componentsProtected: [],
  architectureRisks: [],
  confidence: 0.9,
};

const repositoryRoot = await mkdtemp(
  join(tmpdir(), "lifeos-workflow-guard-"),
);

function createOfficialTask() {
  return createTask({
    id: "TASK-WORKFLOW-GUARD-001",
    title: "Workflow Guard integration",
    description:
      "Verify the official workflow is controlled and persisted.",
    status: "CREATED",
  });
}

function advance(
  guard: WorkflowGuard,
  taskId: string,
  statuses: Parameters<WorkflowGuard["transition"]>[1][],
): void {
  for (const status of statuses) {
    guard.transition(
      taskId,
      status,
      `Move task to ${status}.`,
    );
  }
}

try {
  const store = new TaskStore();
  const task = createOfficialTask();

  store.add(task);
  store.attachContract(
    createTaskContract({
      taskId: task.id,
      objective: task.description,
      scope: task.scope,
    }),
  );

  const guard = new WorkflowGuard(store);

    advance(guard, task.id, [
    "ANALYSIS",
    "COUNCIL",
    "CONTRACT_READY",
  ]);

  store.update({
    ...store.get(task.id)!,
    impactMap: validImpactMap,
  });

  advance(guard, task.id, [
    "IMPACT_APPROVED",
    "GIT_READY",
    "CODING",
    "IMPLEMENTED",
    "TESTING",
    "TRIAGE",
  ]);

  assert.throws(
    () =>
      guard.transition(
        task.id,
        "DONE",
        "Attempt to bypass review.",
      ),
    /only become DONE after REVIEW/,
  );

  advance(guard, task.id, [
    "REVIEW",
    "DONE",
  ]);

  assert.equal(guard.getTask(task.id).status, "DONE");

  await saveTaskStore(repositoryRoot, store);

  const restoredStore = await loadTaskStore(repositoryRoot);
  const restoredTask = restoredStore.get(task.id);

  assert.ok(restoredTask);
  assert.equal(restoredTask.status, "DONE");
  assert.equal(
    restoredStore.getHistory(task.id).length,
    11,
  );

  const retryStore = new TaskStore();
  const retryTask = createOfficialTask();

  retryStore.add(retryTask);
  retryStore.attachContract(
    createTaskContract({
      taskId: retryTask.id,
      objective: retryTask.description,
      scope: retryTask.scope,
    }),
  );

  const retryGuard = new WorkflowGuard(retryStore);

    advance(retryGuard, retryTask.id, [
    "ANALYSIS",
    "COUNCIL",
    "CONTRACT_READY",
  ]);

  retryStore.update({
    ...retryStore.get(retryTask.id)!,
    impactMap: validImpactMap,
  });

  advance(retryGuard, retryTask.id, [
    "IMPACT_APPROVED",
    "GIT_READY",
  ]);

  for (let attempt = 1; attempt <= 3; attempt++) {
    advance(retryGuard, retryTask.id, [
      "CODING",
      "IMPLEMENTED",
      "TESTING",
      "TRIAGE",
      "FIX_REQUIRED",
    ]);

    assert.equal(
      retryGuard.getTask(retryTask.id).attempts,
      attempt,
    );

    if (attempt < 3) {
      continue;
    }

    assert.throws(
      () =>
        retryGuard.transition(
          retryTask.id,
          "CODING",
          "Attempt a fourth implementation.",
        ),
      /maximum of 3 attempts/,
    );

    retryGuard.transition(
      retryTask.id,
      "COUNCIL",
      "Escalate after three failed attempts.",
    );
  }

  assert.equal(
    retryGuard.getTask(retryTask.id).status, "COUNCIL");
      const impactMapStore = new TaskStore();
  const impactMapTask = createOfficialTask();

  impactMapStore.add(impactMapTask);
  impactMapStore.attachContract(
    createTaskContract({
      taskId: impactMapTask.id,
      objective: impactMapTask.description,
      scope: impactMapTask.scope,
    }),
  );

  const impactMapGuard = new WorkflowGuard(impactMapStore);

  advance(impactMapGuard, impactMapTask.id, [
    "ANALYSIS",
    "COUNCIL",
    "CONTRACT_READY",
  ]);

  // FAIL: fără impactMap.
  assert.throws(
    () =>
      impactMapGuard.transition(
        impactMapTask.id,
        "IMPACT_APPROVED",
        "Attempt without impact map.",
      ),
    /must have an Impact Map/,
  );

  // FAIL: impactMap invalid.
  // Notă: TaskStore.update()/add() blochează deja un impactMap invalid
  // prin taskValidator, deci nu putem ajunge aici prin API-ul public.
  // Injectăm direct în harta internă a store-ului ca să simulăm un task
  // corupt/dintr-un snapshot vechi și să dovedim că WorkflowGuard însuși
  // blochează tranziția, nu doar TaskStore.
  const invalidImpactMap = {
    ...validImpactMap,
    confidence: 1.5,
  } as ImpactMap;

  const corruptedTask = {
    ...impactMapStore.get(impactMapTask.id)!,
    impactMap: invalidImpactMap,
  };

  (
    impactMapStore as unknown as {
      tasks: Map<string, typeof corruptedTask>;
    }
  ).tasks.set(impactMapTask.id, corruptedTask);

  assert.throws(
    () =>
      impactMapGuard.transition(
        impactMapTask.id,
        "IMPACT_APPROVED",
        "Attempt with invalid impact map.",
      ),
    /has an invalid Impact Map/,
  );

  // PASS: impactMap valid.
  impactMapStore.update({
    ...impactMapStore.get(impactMapTask.id)!,
    impactMap: validImpactMap,
  });

  impactMapGuard.transition(
    impactMapTask.id,
    "IMPACT_APPROVED",
    "Approve with valid impact map.",
  );

  assert.equal(
    impactMapGuard.getTask(impactMapTask.id).status,
    "IMPACT_APPROVED",
  );

  } finally {
  await rm(repositoryRoot, {
    recursive: true,
    force: true,
  });
}

console.log("Workflow Guard integration test passed");
