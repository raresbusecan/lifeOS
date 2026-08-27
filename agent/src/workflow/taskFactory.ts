import type {
  Task,
  TaskDepartment,
  TaskScope,
  TaskStatus,
} from "./task.js";

import {
  createChildTaskId,
} from "./taskId.js";

export interface CreateTaskInput {
  id: string;
  title: string;
  description: string;
  department?: TaskDepartment;
  status?: TaskStatus;
  scope?: Partial<TaskScope>;
  parentTaskId?: string | null;
}

export interface CreateChildTaskInput {
  title: string;
  description: string;
  department?: TaskDepartment;
  status?: TaskStatus;
  scope?: Partial<TaskScope>;
}

export function createTask(
  input: CreateTaskInput,
): Task {
  const scope: TaskScope = {
    files: input.scope?.files ?? [],
    components:
      input.scope?.components ?? [],
    behavior:
      input.scope?.behavior ?? [],
    exclusions:
      input.scope?.exclusions ?? [],
  };

  return {
    id: input.id,
    title: input.title,
    description: input.description,
    status:
      input.status ?? "PROPOSED",
    department:
      input.department ?? "COUNCIL",
    attempts: 0,
    scope,
    parentTaskId:
      input.parentTaskId ?? null,
  };
}

export function createChildTask(
  parentTask: Task,
  input: CreateChildTaskInput,
  sequence: number,
): Task {
  return createTask({
    ...input,
    id: createChildTaskId(
      parentTask.id,
      sequence,
    ),
    parentTaskId: parentTask.id,
  });
}