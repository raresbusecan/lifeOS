import type {
    DepartmentDefinition,
    DepartmentId,
    DepartmentAgentRole,
    } from "./department.js";
    import {
    getDepartment,
    getDepartmentByRole,
    } from "./departments.js";
    import type {
    OrganizationState,
    OrganizationTaskState,
    } from "./organizationState.js";
    
    export interface DepartmentContext {
    taskId: string;
    
    currentDepartment: DepartmentDefinition;
    currentRole: DepartmentAgentRole;
    
    organizationState: OrganizationTaskState;
    
    upstreamDepartments: DepartmentDefinition[];
    downstreamDepartments: DepartmentDefinition[];
    
    previousExecutions: OrganizationTaskState["executions"];
    previousDecisions: OrganizationTaskState["decisions"];
    previousReports: OrganizationTaskState["reports"];
    existingArtifacts: OrganizationTaskState["artifacts"];
    
    instructions: string;
    }
    
    export class DepartmentContextBuilder {
    constructor(
    private readonly state: OrganizationState,
    ) {}
    
    buildForRole(
    taskId: string,
    role: DepartmentAgentRole,
    ): DepartmentContext {
    const department =
    getDepartmentByRole(role);
    
    
    return this.build(
      taskId,
      department.id,
      role,
    );

    
    }
    
    build(
    taskId: string,
    departmentId: DepartmentId,
    role: DepartmentAgentRole,
    ): DepartmentContext {
    const department =
    getDepartment(departmentId);
    
    if (!department.roles.includes(role)) {
      throw new Error(
        `Role ${role} does not belong to department ${departmentId}.`,
      );
    }
    
    const organizationState =
      this.state.initializeTask(taskId);
    
    const upstreamDepartments =
      department.upstream.map(
        (id) => getDepartment(id),
      );
    
    const downstreamDepartments =
      department.downstream.map(
        (id) => getDepartment(id),
      );
    
    const previousExecutions =
      organizationState.executions.filter(
        (execution) =>
          execution.taskId === taskId,
      );
    
    const previousDecisions =
      organizationState.decisions.filter(
        (decision) =>
          decision.taskId === taskId,
      );
    
    const previousReports =
      organizationState.reports.filter(
        (report) =>
          previousExecutions.some(
            (execution) =>
              execution.department ===
              report.department,
          ),
      );
    
    const existingArtifacts =
      organizationState.artifacts.filter(
        (artifact) =>
          previousExecutions.some(
            (execution) =>
              execution.department ===
              artifact.department,
          ),
      );
    
    return {
      taskId,
    
      currentDepartment: department,
      currentRole: role,
    
      organizationState,
    
      upstreamDepartments,
      downstreamDepartments,
    
      previousExecutions,
      previousDecisions,
      previousReports,
      existingArtifacts,
    
      instructions:
        this.buildInstructions(
          taskId,
          department,
          role,
          previousExecutions,
          previousDecisions,
          previousReports,
          existingArtifacts,
        ),
    };
    
    }
    
    private buildInstructions(
    taskId: string,
    department: DepartmentDefinition,
    role: DepartmentAgentRole,
    previousExecutions: OrganizationTaskState["executions"],
    previousDecisions: OrganizationTaskState["decisions"],
    previousReports: OrganizationTaskState["reports"],
    existingArtifacts: OrganizationTaskState["artifacts"],
    ): string {
    const sections: string[] = [];
    
    
    sections.push(
      `You are the ${role} agent in the ${department.name} department.`,
    );
    
    sections.push(
      `You are working on task ${taskId}.`,
    );
    
    sections.push(
      `Department responsibility: ${department.description}`,
    );
    
    sections.push("");
    
    sections.push(
      "Your responsibilities:",
    );
    
    for (
      const responsibility of department.responsibilities
    ) {
      sections.push(
        `- ${responsibility}`,
      );
    }
    
    sections.push("");
    
    sections.push(
      "Organizational rule:",
    );
    
    sections.push(
      "You are part of a multi-department workflow.",
    );
    
    sections.push(
      "Use the information produced by previous departments.",
    );
    
    sections.push(
      "Do not silently contradict previous decisions.",
    );
    
    sections.push(
      "If you need to change an earlier decision, explicitly report the change and explain why.",
    );
    
    if (previousExecutions.length > 0) {
      sections.push("");
    
      sections.push(
        "Previous department executions:",
      );
    
      for (
        const execution of previousExecutions
      ) {
        sections.push(
          [
            `- ${execution.department}`,
            `role=${execution.role}`,
            `status=${execution.status}`,
            execution.outputSummary
              ? `output=${execution.outputSummary}`
              : "",
          ]
            .filter(Boolean)
            .join(" | "),
        );
      }
    }
    
    if (previousDecisions.length > 0) {
      sections.push("");
    
      sections.push(
        "Previous organizational decisions:",
      );
    
      for (
        const decision of previousDecisions
      ) {
        sections.push(
          [
            `- [${decision.department}/${decision.role}]`,
            decision.decision,
            `Rationale: ${decision.rationale}`,
          ].join(" "),
        );
      }
    }
    
    if (previousReports.length > 0) {
      sections.push("");
    
      sections.push(
        "Previous department reports:",
      );
    
      for (
        const report of previousReports
      ) {
        sections.push(
          [
            `- ${report.department}/${report.role}`,
            `status=${report.summary}`,
            `confidence=${report.confidence}`,
          ].join(" | "),
        );
      }
    }
    
    if (existingArtifacts.length > 0) {
      sections.push("");
    
      sections.push(
        "Existing artifacts:",
      );
    
      for (
        const artifact of existingArtifacts
      ) {
        sections.push(
          [
            `- ${artifact.path}`,
            `owner=${artifact.department}/${artifact.role}`,
            `type=${artifact.type}`,
            artifact.description,
          ].join(" | "),
        );
      }
    }
    
    sections.push("");
    
    sections.push(
      `Allowed tools for this department: ${
        department.allowedTools.length > 0
          ? department.allowedTools.join(", ")
          : "none"
      }.`,
    );
    
    sections.push("");
    
    sections.push(
      "Before completing your work, make your findings, decisions, risks, and produced artifacts explicit so the next department can consume them.",
    );
    
    return sections.join("\n");
    
    }
    }
    
    export function buildDepartmentContext(
    state: OrganizationState,
    taskId: string,
    role: DepartmentAgentRole,
    ): DepartmentContext {
    const builder =
    new DepartmentContextBuilder(state);
    
    return builder.buildForRole(
    taskId,
    role,
    );
    }
    