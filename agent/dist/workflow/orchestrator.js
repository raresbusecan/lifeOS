import { WorkflowGuard } from "./workflowGuard.js";
import { runCodingPhase } from "./workflowRunner.js";
import { handleWorkflowTestResult } from "./workflowRunner.js";
export class WorkflowOrchestrator {
    store;
    guard;
    constructor(store) {
        this.store = store;
        this.guard = new WorkflowGuard(store);
    }
    getTask(taskId) {
        const task = this.store.get(taskId);
        if (!task) {
            throw new Error(`Task ${taskId} does not exist.`);
        }
        return task;
    }
    getContract(taskId) {
        return this.store.getContract(taskId);
    }
    attachContract(contract) {
        this.store.attachContract(contract);
    }
    startCoding(taskId) {
        const task = this.getTask(taskId);
        const result = runCodingPhase(task, this.guard);
        return {
            task: result.task,
            phase: "CODING",
        };
    }
    handleTestResult(taskId, result) {
        const task = this.getTask(taskId);
        const outcome = handleWorkflowTestResult(task, result, this.guard, this.store);
        return {
            task: outcome.task,
            phase: outcome.task.status,
        };
    }
}
