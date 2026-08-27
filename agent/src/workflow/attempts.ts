export const MAX_TASK_ATTEMPTS = 3;

export function canAttempt(
  attempts: number,
): boolean {
  return (
    Number.isInteger(attempts) &&
    attempts >= 0 &&
    attempts < MAX_TASK_ATTEMPTS
  );
}

export function incrementAttempt(
  attempts: number,
): number {
  if (!Number.isInteger(attempts)) {
    throw new Error(
      "Task attempts must be an integer.",
    );
  }

  if (attempts < 0) {
    throw new Error(
      "Task attempts cannot be negative.",
    );
  }

  if (
    attempts >= MAX_TASK_ATTEMPTS
  ) {
    throw new Error(
      `Task has reached the maximum of ${MAX_TASK_ATTEMPTS} attempts.`,
    );
  }

  return attempts + 1;
}