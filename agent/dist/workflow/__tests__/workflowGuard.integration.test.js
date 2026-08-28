import assert from "node:assert/strict";
import { mkdtemp, rm, } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createTask, } from "../taskFactory.js";
import { loadTaskStore, saveTaskStore, } from "../taskPersistence.js";
import { TaskStore, } from "../taskStore.js";
import { WorkflowGuard, } from "../workflowGuard.js";
import { createTaskContract, } from "../taskContract.js";

const repositoryRoot = await mkdtemp(join(tmpdir(), "lifeos-workflow-guard-"));
function createOfficialTask() {
    return createTask({
        id: "TASK-WORKFLOW-GUARD-001",
        title: "Workflow Guard integration",
        description: "Verify the official workflow is controlled and persisted.",
        status: "CREATED",
    });
}
function advance(guard, taskId, statuses) {
    for (const status of statuses) {
        guard.transition(taskId, status, `Move task to ${status}.`);
    }
}
try {
    const store = new TaskStore();
    const task = createOfficialTask();
    store.add(task);
    store.attachContract(createTaskContract({
        taskId: task.id,
        objective: task.description,
        scope: task.scope,
    }));
    const guard = new WorkflowGuard(store);
    advance(guard, task.id, [
        "ANALYSIS",
        "COUNCIL",
        "CONTRACT_READY",
        "IMPACT_APPROVED",
        "GIT_READY",
        "CODING",
        "IMPLEMENTED",
        "TESTING",
        "TRIAGE",
    ]);
    assert.throws(() => guard.transition(task.id, "DONE", "Attempt to bypass review."), /only become DONE after REVIEW/);
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
    assert.equal(restoredStore.getHistory(task.id).length, 11);
    const retryStore = new TaskStore();
    const retryTask = createOfficialTask();
    retryStore.add(retryTask);
    retryStore.attachContract(createTaskContract({
        taskId: retryTask.id,
        objective: retryTask.description,
        scope: retryTask.scope,
    }));
    const retryGuard = new WorkflowGuard(retryStore);
    advance(retryGuard, retryTask.id, [
        "ANALYSIS",
        "COUNCIL",
        "CONTRACT_READY",
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
        assert.equal(retryGuard.getTask(retryTask.id).attempts, attempt);
        if (attempt < 3) {
            continue;
        }
        assert.throws(() => retryGuard.transition(retryTask.id, "CODING", "Attempt a fourth implementation."), /maximum of 3 attempts/);
        retryGuard.transition(retryTask.id, "COUNCIL", "Escalate after three failed attempts.");
    }
    assert.equal(retryGuard.getTask(retryTask.id).status, "COUNCIL");
}
finally {
    await rm(repositoryRoot, {
        recursive: true,
        force: true,
    });
}
console.log("Workflow Guard integration test passed");
