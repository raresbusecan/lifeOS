import type {
  Task,
  TaskDepartment,
  TaskScope,
  TaskStatus,
} from "./task.js";

const VALID_STATUSES: TaskStatus[] = [
  "PROPOSED",
  "COUNCIL",
  "READY",
  "CODING",
  "TESTING",
  "REWORK",
  "DONE",
  "BLOCKED",
  "CANCELLED",
];

const VALID_DEPARTMENTS: TaskDepartment[] = [
  "COUNCIL",
  "CODER",
  "TESTER",
];

export interface TaskValidationResult {
  valid: boolean;
  errors: string[];
}

function isNonEmptyString(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isStringArray(
  value: unknown,
): value is string[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) => typeof item === "string",
    )
  );
}

function validateScope(
  scope: unknown,
  errors: string[],
): scope is TaskScope {
  if (
    typeof scope !== "object" ||
    scope === null
  ) {
    errors.push("scope must be an object.");
    return false;
  }

  const value =
    scope as Record<string, unknown>;

  if (!isStringArray(value.files)) {
    errors.push(
      "scope.files must be an array of strings.",
    );
  }

  if (!isStringArray(value.components)) {
    errors.push(
      "scope.components must be an array of strings.",
    );
  }

  if (!isStringArray(value.behavior)) {
    errors.push(
      "scope.behavior must be an array of strings.",
    );
  }

  if (!isStringArray(value.exclusions)) {
    errors.push(
      "scope.exclusions must be an array of strings.",
    );
  }

  return errors.every(
    (error) =>
      !error.startsWith("scope."),
  );
}

export function validateTask(
  task: unknown,
): TaskValidationResult {
  const errors: string[] = [];

  if (
    typeof task !== "object" ||
    task === null
  ) {
    return {
      valid: false,
      errors: ["Task must be an object."],
    };
  }

  const value =
    task as Record<string, unknown>;

  if (!isNonEmptyString(value.id)) {
    errors.push(
      "id must be a non-empty string.",
    );
  }

  if (!isNonEmptyString(value.title)) {
    errors.push(
      "title must be a non-empty string.",
    );
  }

  if (
    !isNonEmptyString(
      value.description,
    )
  ) {
    errors.push(
      "description must be a non-empty string.",
    );
  }

  if (
    typeof value.status !== "string" ||
    !VALID_STATUSES.includes(
      value.status as TaskStatus,
    )
  ) {
    errors.push(
      "status must be a valid TaskStatus.",
    );
  }

  if (
    typeof value.department !==
      "string" ||
    !VALID_DEPARTMENTS.includes(
      value.department as TaskDepartment,
    )
  ) {
    errors.push(
      "department must be a valid TaskDepartment.",
    );
  }

  if (
    typeof value.attempts !== "number" ||
    !Number.isInteger(value.attempts) ||
    value.attempts < 0
  ) {
    errors.push(
      "attempts must be an integer greater than or equal to 0.",
    );
  }

  validateScope(
    value.scope,
    errors,
  );

  if (
    value.parentTaskId !== null &&
    typeof value.parentTaskId !==
      "string"
  ) {
    errors.push(
      "parentTaskId must be a string or null.",
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function assertValidTask(
  task: unknown,
): asserts task is Task {
  const result =
    validateTask(task);

  if (!result.valid) {
    throw new Error(
      [
        "Invalid task:",
        ...result.errors.map(
          (error) => `- ${error}`,
        ),
      ].join("\n"),
    );
  }
}