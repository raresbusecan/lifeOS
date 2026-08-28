import { runCodingPhase, handleWorkflowTestResult, } from "./workflowRunner.js";
import { WorkflowGuard, } from "./workflowGuard.js";
export class WorkflowCoordinator {
    store;
    guard;
    constructor(store) {
        this.store = store;
        this.guard = new WorkflowGuard(this.store);
    }
    attachContract(contract) {
        this.store.attachContract(contract);
    }
    getTask(taskId) {
        const task = this.store.get(taskId);
        if (!task) {
            throw new Error(`Task ${taskId} does not exist.`);
        }
        return task;
    }
    startCoding(taskId) {
        const task = this.getTask(taskId);
        return runCodingPhase(task, this.guard);
    }
    handleTestResult(taskId, result) {
        const task = this.getTask(taskId);
        return handleWorkflowTestResult(task, result, this.guard, this.store);
    }
}
