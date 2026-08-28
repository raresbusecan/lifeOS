import { handleTestResult, } from "./testingHandler.js";
export function runCodingPhase(task, guard) {
    if (task.status !== "GIT_READY") {
        throw new Error(`Coding phase can only start for a task in GIT_READY status. Current status: ${task.status}.`);
    }
    const codingTask = guard.transition(task.id, "CODING", "Task moved to CODING.");
    const implementedTask = guard.transition(codingTask.id, "IMPLEMENTED", "Coding phase completed.");
    const testingTask = guard.transition(implementedTask.id, "TESTING", "Task moved to TESTING.");
    return {
        task: testingTask,
    };
}
export function handleWorkflowTestResult(task, result, guard, store) {
    if (task.status !== "TESTING") {
        throw new Error(`Testing phase can only handle a task in TESTING status. Current status: ${task.status}.`);
    }
    const outcome = handleTestResult(task, result, guard, store);
    return {
        task: outcome.task,
        result: outcome,
    };
}
