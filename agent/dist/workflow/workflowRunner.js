import { handleTestResult, } from "./testingHandler.js";
export function runCodingPhase(task, store) {
    if (task.status !== "READY") {
        throw new Error(`Coding phase can only start for a task in READY status. Current status: ${task.status}.`);
    }
    const codingTask = store.transition(task.id, "CODING", "Task moved to CODING.");
    const testingTask = store.transition(codingTask.id, "TESTING", "Task moved to TESTING.");
    return {
        task: testingTask,
    };
}
export function handleWorkflowTestResult(task, result, store) {
    if (task.status !== "TESTING") {
        throw new Error(`Testing phase can only handle a task in TESTING status. Current status: ${task.status}.`);
    }
    const outcome = handleTestResult(task, result, store);
    return {
        task: outcome.task,
        result: outcome,
    };
}
