import assert from "node:assert/strict";
import { mkdtemp, rm, } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createChildTask, createTask, } from "../taskFactory.js";
import { TaskStore, } from "../taskStore.js";
import { getTaskStoreFile, loadTaskStore, saveTaskStore, } from "../taskPersistence.js";
const repositoryRoot = await mkdtemp(join(tmpdir(), "lifeos-task-store-"));
try {
    const store = new TaskStore();
    const task = createTask({
        id: "TASK-PERSISTENCE-001",
        title: "Persist workflow task",
        description: "Verify that workflow state survives a restart.",
        status: "READY",
        scope: {
            files: ["src/workflow/taskStore.ts"],
            components: ["workflow"],
            behavior: [
                "Task history remains available after reload.",
            ],
            exclusions: [],
        },
    });
    store.add(task);
    store.transition(task.id, "CODING", "Coding started.");
    store.transition(task.id, "TESTING", "Implementation ready for testing.");
    const childTask = createChildTask(task, {
        title: "Follow-up task",
        description: "Track a separately discovered concern.",
        scope: {
            files: ["src/workflow/testingHandler.ts"],
            components: ["workflow"],
            behavior: [
                "Follow-up tasks retain their parent relation.",
            ],
        },
    }, 1);
    store.add(childTask);
    await saveTaskStore(repositoryRoot, store);
    const restored = await loadTaskStore(repositoryRoot);
    const restoredTask = restored.get(task.id);
    assert.ok(restoredTask);
    assert.deepEqual(restoredTask, store.get(task.id));
    assert.deepEqual(restored.getHistory(task.id), store.getHistory(task.id));
    assert.deepEqual(restored.getChildren(task.id), [childTask]);
    assert.equal(getTaskStoreFile(repositoryRoot).endsWith(".agent/runtime/tasks.json"), true);
    const emptyStore = await loadTaskStore(join(repositoryRoot, "new-repository"));
    assert.equal(emptyStore.getAll().length, 0);
}
finally {
    await rm(repositoryRoot, {
        recursive: true,
        force: true,
    });
}
console.log("Task store persistence test passed");
