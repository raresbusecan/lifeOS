import { getDepartment, getDepartmentByRole, } from "./departments.js";
export class DepartmentContextBuilder {
    state;
    constructor(state) {
        this.state = state;
    }
    buildForRole(taskId, role) {
        const department = getDepartmentByRole(role);
        return this.build(taskId, department.id, role);
    }
    build(taskId, departmentId, role) {
        const department = getDepartment(departmentId);
        if (!department.roles.includes(role)) {
            throw new Error(`Role ${role} does not belong to department ${departmentId}.`);
        }
        const organizationState = this.state.initializeTask(taskId);
        const upstreamDepartments = department.upstream.map((id) => getDepartment(id));
        const downstreamDepartments = department.downstream.map((id) => getDepartment(id));
        const previousExecutions = organizationState.executions.filter((execution) => execution.taskId === taskId);
        const previousDecisions = organizationState.decisions.filter((decision) => decision.taskId === taskId);
        const previousReports = organizationState.reports;
        const existingArtifacts = organizationState.artifacts;
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
            instructions: this.buildInstructions(taskId, department, role, upstreamDepartments, downstreamDepartments, previousExecutions, previousDecisions, previousReports, existingArtifacts),
        };
    }
    buildInstructions(taskId, department, role, upstreamDepartments, downstreamDepartments, previousExecutions, previousDecisions, previousReports, existingArtifacts) {
        const sections = [];
        sections.push(`You are the ${role} agent in the ${department.name} department.`);
        sections.push(`You are working on task ${taskId}.`);
        sections.push(`Department responsibility: ${department.description}`);
        sections.push("");
        sections.push("Organizational workflow:");
        sections.push(`Current department: ${department.id}`);
        sections.push(`Upstream departments: ${upstreamDepartments.length > 0
            ? upstreamDepartments
                .map((item) => `${item.id} (${item.name})`)
                .join(", ")
            : "none"}`);
        sections.push(`Downstream departments: ${downstreamDepartments.length > 0
            ? downstreamDepartments
                .map((item) => `${item.id} (${item.name})`)
                .join(", ")
            : "none"}`);
        sections.push("");
        sections.push("Your responsibilities:");
        for (const responsibility of department.responsibilities) {
            sections.push(`- ${responsibility}`);
        }
        sections.push("");
        sections.push("Information this department consumes:");
        if (department.consumes.length > 0) {
            for (const item of department.consumes) {
                sections.push(`- ${item}`);
            }
        }
        else {
            sections.push("- none");
        }
        sections.push("");
        sections.push("Information this department produces:");
        if (department.produces.length > 0) {
            for (const item of department.produces) {
                sections.push(`- ${item}`);
            }
        }
        else {
            sections.push("- none");
        }
        sections.push("");
        sections.push("Organizational rules:");
        sections.push("- You are part of a multi-department workflow.");
        sections.push("- Treat the organization state as the shared memory of this task.");
        sections.push("- Use information produced by previous departments before making new decisions.");
        sections.push("- Do not silently contradict previous decisions.");
        sections.push("- If you need to change an earlier decision, explicitly report the change and explain why.");
        sections.push("- Make important findings, decisions, risks, and artifacts explicit so downstream departments can consume them.");
        if (previousExecutions.length > 0) {
            sections.push("");
            sections.push("Previous department executions:");
            for (const execution of previousExecutions) {
                sections.push([
                    `- ${execution.department}`,
                    `role=${execution.role}`,
                    `status=${execution.status}`,
                    `input=${execution.inputSummary}`,
                    execution.outputSummary
                        ? `output=${execution.outputSummary}`
                        : "",
                    execution.error
                        ? `error=${execution.error}`
                        : "",
                ]
                    .filter(Boolean)
                    .join(" | "));
            }
        }
        if (previousDecisions.length > 0) {
            sections.push("");
            sections.push("Previous organizational decisions:");
            for (const decision of previousDecisions) {
                sections.push([
                    `- [${decision.department}/${decision.role}]`,
                    decision.decision,
                    `Rationale: ${decision.rationale}`,
                    decision.affectedFiles.length > 0
                        ? `Affected files: ${decision.affectedFiles.join(", ")}`
                        : "",
                ]
                    .filter(Boolean)
                    .join(" | "));
            }
        }
        if (previousReports.length > 0) {
            sections.push("");
            sections.push("Previous department reports:");
            for (const report of previousReports) {
                sections.push([
                    `- ${report.department}/${report.role}`,
                    `summary=${report.summary}`,
                    `findings=${report.findings.join("; ")}`,
                    `recommendations=${report.recommendations.join("; ")}`,
                    `risks=${report.risks.join("; ")}`,
                    `files=${report.files.join(", ")}`,
                    `confidence=${report.confidence}`,
                ].join(" | "));
            }
        }
        if (existingArtifacts.length > 0) {
            sections.push("");
            sections.push("Existing organizational artifacts:");
            for (const artifact of existingArtifacts) {
                sections.push([
                    `- ${artifact.path}`,
                    `owner=${artifact.department}/${artifact.role}`,
                    `type=${artifact.type}`,
                    artifact.description,
                ].join(" | "));
            }
        }
        sections.push("");
        sections.push(`Allowed tools for this department: ${department.allowedTools.length > 0
            ? department.allowedTools.join(", ")
            : "none"}.`);
        sections.push("");
        sections.push("Before completing your work, explicitly identify:");
        sections.push("- findings");
        sections.push("- decisions");
        sections.push("- risks");
        sections.push("- affected files");
        sections.push("- produced artifacts");
        sections.push("- anything that the next department must know");
        return sections.join("\n");
    }
}
export function buildDepartmentContext(state, taskId, role) {
    const builder = new DepartmentContextBuilder(state);
    return builder.buildForRole(taskId, role);
}
