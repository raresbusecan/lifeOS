import type { ImpactMap } from "./impactMap.js";


export type TaskStatus =
  | "CREATED"
  | "ANALYSIS"
  | "CONTRACT_READY"
  | "IMPACT_APPROVED"
  | "GIT_READY"
  | "IMPLEMENTED"
  | "TRIAGE"
  | "FIX_REQUIRED"
  | "REVIEW"
  | "PROPOSED"
  | "COUNCIL"
  | "READY"
  | "CODING"
  | "TESTING"
  | "REWORK"
  | "DONE"
  | "BLOCKED"
  | "CANCELLED";

export type TaskDepartment =
  | "COUNCIL"
  | "CODER"
  | "TESTER";

export interface TaskScope {
  files: string[];
  components: string[];
  behavior: string[];
  exclusions: string[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  department: TaskDepartment;
  attempts: number;
  scope: TaskScope;
  parentTaskId: string | null;
  impactMap?: ImpactMap;
}
