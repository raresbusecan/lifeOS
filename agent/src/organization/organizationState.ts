import type {
    DepartmentArtifact,
    DepartmentDecision,
    DepartmentExecution,
    DepartmentId,
    DepartmentReport,
    } from "./department.js";
    
    export interface OrganizationTaskState {
    taskId: string;
    
    executions: DepartmentExecution[];
    decisions: DepartmentDecision[];
    reports: DepartmentReport[];
    artifacts: DepartmentArtifact[];
    
    createdAt: string;
    updatedAt: string;
    }
    
    export class OrganizationState {
    private readonly tasks =
    new Map<string, OrganizationTaskState>();
    
    initializeTask(
    taskId: string,
    ): OrganizationTaskState {
    const existing = this.tasks.get(taskId);
    
 
    if (existing) {
      return existing;
    }
    
    const now = new Date().toISOString();
    
    const state: OrganizationTaskState = {
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
    
    getTaskState(
    taskId: string,
    ): OrganizationTaskState {
    const state = this.tasks.get(taskId);
    

    if (!state) {
      throw new Error(
        `Organization state for task ${taskId} does not exist.`,
      );
    }
    
    return state;

    
    }
    
    hasTask(
    taskId: string,
    ): boolean {
    return this.tasks.has(taskId);
    }
    
    recordExecution(
    execution: DepartmentExecution,
    ): void {
    const state = this.initializeTask(
    execution.department === "COUNCIL"
    ? execution.inputSummary
    : "",
    );
    
   
    const taskState =
      this.findOrCreateExecutionState(
        execution,
      );
    
    taskState.executions.push(execution);
    taskState.updatedAt =
      new Date().toISOString();
    
    void state;
 
    
    }
    
    recordDecision(
    decision: DepartmentDecision,
    ): void {
    const state = this.initializeTask(
    decision.taskId,
    );
    

    state.decisions.push(decision);
    state.updatedAt =
      new Date().toISOString();
 
    
    }
    
    recordReport(
    taskId: string,
    report: DepartmentReport,
    ): void {
    const state =
    this.initializeTask(taskId);
    
 
    state.reports.push(report);
    state.updatedAt =
      new Date().toISOString();

    
    }
    
    recordArtifact(
    taskId: string,
    artifact: DepartmentArtifact,
    ): void {
    const state =
    this.initializeTask(taskId);
    
 
    state.artifacts.push(artifact);
    state.updatedAt =
      new Date().toISOString();

    
    }
    
    getExecutions(
    taskId: string,
    ): DepartmentExecution[] {
    return [
    ...this.getTaskState(taskId).executions,
    ];
    }
    
    getDecisions(
    taskId: string,
    ): DepartmentDecision[] {
    return [
    ...this.getTaskState(taskId).decisions,
    ];
    }
    
    getReports(
    taskId: string,
    ): DepartmentReport[] {
    return [
    ...this.getTaskState(taskId).reports,
    ];
    }
    
    getArtifacts(
    taskId: string,
    ): DepartmentArtifact[] {
    return [
    ...this.getTaskState(taskId).artifacts,
    ];
    }
    
    getDepartmentExecutions(
    taskId: string,
    department: DepartmentId,
    ): DepartmentExecution[] {
    return this.getExecutions(taskId).filter(
    (execution) =>
    execution.department === department,
    );
    }
    
    getDepartmentDecisions(
    taskId: string,
    department: DepartmentId,
    ): DepartmentDecision[] {
    return this.getDecisions(taskId).filter(
    (decision) =>
    decision.department === department,
    );
    }
    
    getDepartmentReports(
    taskId: string,
    department: DepartmentId,
    ): DepartmentReport[] {
    return this.getReports(taskId).filter(
    (report) =>
    report.department === department,
    );
    }
    
    getSnapshot(
    taskId: string,
    ): OrganizationTaskState {
    const state =
    this.getTaskState(taskId);
    

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
    
    private findOrCreateExecutionState(
    execution: DepartmentExecution,
    ): OrganizationTaskState {
    /*
    * DepartmentExecution currently does not carry taskId.
    * Until that field is added to the shared department contract,
    * executions cannot be reliably associated with a task.
    *
    * The caller should therefore initialize the task state before
    * recording the execution.
    */
    const possibleTaskId =
    execution.inputSummary;
    
 
    const existing =
      this.tasks.get(possibleTaskId);
    
    if (existing) {
      return existing;
    }
    
    return this.initializeTask(
      possibleTaskId,
    );

    
    }
    }
    