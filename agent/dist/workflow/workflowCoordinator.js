import { runCodingPhase, handleWorkflowTestResult, } from "./workflowRunner.js";
export class WorkflowCoordinator {
    store;
    constructor(store) {
        this.store = store;
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
        return runCodingPhase(task, this.store);
    }
    handleTestResult(taskId, result) {
        const task = this.getTask(taskId);
        return handleWorkflowTestResult(task, result, this.store);
    }
}
