export function createTaskId(
  sequence: number,
): string {
  if (
    !Number.isInteger(sequence) ||
    sequence <= 0
  ) {
    throw new Error(
      "Task sequence must be a positive integer.",
    );
  }

  return `TASK-${String(sequence).padStart(3, "0")}`;
}

export function createChildTaskId(
  parentTaskId: string,
  sequence: number,
): string {
  const normalizedParentId =
    parentTaskId.trim();

  if (!normalizedParentId) {
    throw new Error(
      "Parent task ID cannot be empty.",
    );
  }

  if (
    !Number.isInteger(sequence) ||
    sequence <= 0
  ) {
    throw new Error(
      "Child task sequence must be a positive integer.",
    );
  }

  return `${normalizedParentId}-CHILD-${String(sequence).padStart(3, "0")}`;
}