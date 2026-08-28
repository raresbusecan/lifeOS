import { validateTestResult, } from "./testing.js";
import { classifyTestResultScope, } from "./scopeClassifier.js";
import { createChildTask, } from "./taskFactory.js";
export function handleTestResult(task, result, guard, store) {
    validateTestResult(task, result);
    if (task.status !== "TESTING") {
        throw new Error(`Testing result can only be handled for a task in TESTING status. Current status: ${task.status}.`);
    }
    if (result.type === "PASS") {
        const triageTask = guard.transition(task.id, "TRIAGE", "Testing passed; task moved to TRIAGE.");
        const reviewTask = guard.transition(triageTask.id, "REVIEW", "Triage passed; task moved to REVIEW.");
        const completedTask = guard.transition(reviewTask.id, "DONE", "Review approved; task completed.");
        return {
            task: completedTask,
            resultType: "PASS",
            scope: null,
            newTask: null,
        };
    }
    const scope = classifyTestResultScope(task, result);
    if (scope.classification ===
        "IN_SCOPE") {
        const triageTask = guard.transition(task.id, "TRIAGE", "Testing failed; task moved to TRIAGE.");
        const reworkTask = guard.transition(triageTask.id, "FIX_REQUIRED", "Triage classified the failure as related to the task.");
        return {
            task: reworkTask,
            resultType: "REWORK",
            scope,
            newTask: null,
        };
    }
    const triageTask = guard.transition(task.id, "TRIAGE", "Testing failed; task moved to TRIAGE.");
    const reviewTask = guard.transition(triageTask.id, "REVIEW", "Triage classified the failure as unrelated to the task.");
    const completedTask = guard.transition(reviewTask.id, "DONE", "Original task completed; unrelated issue tracked separately.");
    const sequence = store.getNextChildSequence(task.id);
    const newTask = createChildTask(completedTask, {
        title: result.summary,
        description: result.details,
        scope: {
            files: result.files ?? [],
            components: result.components ?? [],
            behavior: result.expectedBehavior
                ? [
                    result.expectedBehavior,
                ]
                : [],
            exclusions: [],
        },
    }, sequence);
    store.add(newTask);
    return {
        task: completedTask,
        resultType: "NEW_TASK",
        scope,
        newTask,
    };
}
