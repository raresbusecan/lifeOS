import type { ToolDefinition } from "../tools/types.js";

export type DepartmentId =
| "COUNCIL"
| "PLANNING"
| "ANALYSIS"
| "ARCHITECTURE"
| "DEVELOPMENT"
| "TESTING";

export type DepartmentAgentRole =
| "PLANNER"
| "ANALYST"
| "ARCHITECT"
| "CODER"
| "TESTER";

export interface DepartmentDefinition {
id: DepartmentId;
name: string;
description: string;

responsibilities: string[];

roles: DepartmentAgentRole[];

upstream: DepartmentId[];
downstream: DepartmentId[];

produces: string[];
consumes: string[];

allowedTools: string[];
}

export interface DepartmentExecution {
taskId: string;

department: DepartmentId;
role: DepartmentAgentRole;

startedAt: string;
completedAt?: string;

status: "RUNNING" | "COMPLETED" | "FAILED";

inputSummary: string;
outputSummary?: string;

decisions: string[];
findings: string[];
risks: string[];

artifacts: string[];

error?: string;
}

export interface DepartmentDecision {
id: string;

department: DepartmentId;
role: DepartmentAgentRole;

taskId: string;

decision: string;
rationale: string;

affectedFiles: string[];

createdAt: string;
}

export interface DepartmentReport {
department: DepartmentId;
role: DepartmentAgentRole;

summary: string;

findings: string[];
recommendations: string[];
risks: string[];

files: string[];

confidence: number;

createdAt: string;
}

export interface DepartmentArtifact {
path: string;

department: DepartmentId;
role: DepartmentAgentRole;

type: "SOURCE" | "TEST" | "DOCUMENTATION" | "OTHER";

description: string;

createdAt: string;
}

export function isDepartmentId(
value: string,
): value is DepartmentId {
return (
value === "COUNCIL" ||
value === "PLANNING" ||
value === "ANALYSIS" ||
value === "ARCHITECTURE" ||
value === "DEVELOPMENT" ||
value === "TESTING"
);
}

export function isDepartmentAgentRole(
value: string,
): value is DepartmentAgentRole {
return (
value === "PLANNER" ||
value === "ANALYST" ||
value === "ARCHITECT" ||
value === "CODER" ||
value === "TESTER"
);
}

export function departmentCanUseTool(
department: DepartmentDefinition,
tool: ToolDefinition,
): boolean {
return department.allowedTools.includes(
tool.name,
);
}
