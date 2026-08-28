const OFFICIAL_WORKFLOW_STATUSES = new Set([
    "CREATED",
    "ANALYSIS",
    "COUNCIL",
    "CONTRACT_READY",
    "IMPACT_APPROVED",
    "GIT_READY",
    "CODING",
    "IMPLEMENTED",
    "TESTING",
    "TRIAGE",
    "FIX_REQUIRED",
    "REVIEW",
    "DONE",
    "BLOCKED",
    "CANCELLED",
]);
export class WorkflowGuard {
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
    transition(taskId, nextStatus, reason) {
        const task = this.getTask(taskId);
        if (!OFFICIAL_WORKFLOW_STATUSES.has(task.status)) {
            throw new Error(`Task ${task.id} uses legacy status ${task.status} and cannot be advanced by Workflow Guard.`);
        }
        if (!OFFICIAL_WORKFLOW_STATUSES.has(nextStatus)) {
            throw new Error(`Workflow Guard does not allow legacy status ${nextStatus}.`);
        }
        if (nextStatus === "DONE" &&
            task.status !== "REVIEW") {
            throw new Error("A task can only become DONE after REVIEW.");
        }
        return this.store.transition(task.id, nextStatus, reason);
    }
}
