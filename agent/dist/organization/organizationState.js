export class OrganizationState {
    tasks = new Map();
    initializeTask(taskId) {
        const existing = this.tasks.get(taskId);
        if (existing) {
            return existing;
        }
        const now = new Date().toISOString();
        const state = {
            taskId,
            executions: [],
            decisions: [],
            reports: [],
            artifacts: [],
            createdAt: now,
            updatedAt: now,
        };
        this.tasks.set(taskId, state);
        return state;
    }
    getTaskState(taskId) {
        const state = this.tasks.get(taskId);
        if (!state) {
            throw new Error(`Organization state for task ${taskId} does not exist.`);
        }
        return state;
    }
    hasTask(taskId) {
        return this.tasks.has(taskId);
    }
    recordExecution(execution) {
        const state = this.initializeTask(execution.department === "COUNCIL"
            ? execution.inputSummary
            : "");
        const taskState = this.findOrCreateExecutionState(execution);
        taskState.executions.push(execution);
        taskState.updatedAt =
            new Date().toISOString();
        void state;
    }
    recordDecision(decision) {
        const state = this.initializeTask(decision.taskId);
        state.decisions.push(decision);
        state.updatedAt =
            new Date().toISOString();
    }
    recordReport(taskId, report) {
        const state = this.initializeTask(taskId);
        state.reports.push(report);
        state.updatedAt =
            new Date().toISOString();
    }
    recordArtifact(taskId, artifact) {
        const state = this.initializeTask(taskId);
        state.artifacts.push(artifact);
        state.updatedAt =
            new Date().toISOString();
    }
    getExecutions(taskId) {
        return [
            ...this.getTaskState(taskId).executions,
        ];
    }
    getDecisions(taskId) {
        return [
            ...this.getTaskState(taskId).decisions,
        ];
    }
    getReports(taskId) {
        return [
            ...this.getTaskState(taskId).reports,
        ];
    }
    getArtifacts(taskId) {
        return [
            ...this.getTaskState(taskId).artifacts,
        ];
    }
    getDepartmentExecutions(taskId, department) {
        return this.getExecutions(taskId).filter((execution) => execution.department === department);
    }
    getDepartmentDecisions(taskId, department) {
        return this.getDecisions(taskId).filter((decision) => decision.department === department);
    }
    getDepartmentReports(taskId, department) {
        return this.getReports(taskId).filter((report) => report.department === department);
    }
    getSnapshot(taskId) {
        const state = this.getTaskState(taskId);
        return {
            taskId: state.taskId,
            executions: [...state.executions],
            decisions: [...state.decisions],
            reports: [...state.reports],
            artifacts: [...state.artifacts],
            createdAt: state.createdAt,
            updatedAt: state.updatedAt,
        };
    }
    findOrCreateExecutionState(execution) {
        /*
        * DepartmentExecution currently does not carry taskId.
        * Until that field is added to the shared department contract,
        * executions cannot be reliably associated with a task.
        *
        * The caller should therefore initialize the task state before
        * recording the execution.
        */
        const possibleTaskId = execution.inputSummary;
        const existing = this.tasks.get(possibleTaskId);
        if (existing) {
            return existing;
        }
        return this.initializeTask(possibleTaskId);
    }
}
