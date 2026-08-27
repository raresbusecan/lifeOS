import { canTransition, } from "./transitions.js";
import { canAttempt, incrementAttempt, MAX_TASK_ATTEMPTS, } from "./attempts.js";
export function moveTask(task, nextStatus) {
    if (task.status === nextStatus) {
        throw new Error(`Task ${task.id} is already in status ${nextStatus}.`);
    }
    if (!canTransition(task.status, nextStatus)) {
        throw new Error(`Invalid task transition: ${task.status} -> ${nextStatus}.`);
    }
    let attempts = task.attempts;
    if (task.status === "TESTING" &&
        nextStatus === "REWORK") {
        attempts =
            incrementAttempt(task.attempts);
    }
    if (task.status === "REWORK" &&
        nextStatus === "CODING" &&
        !canAttempt(task.attempts)) {
        throw new Error(`Task ${task.id} has reached the maximum of ${MAX_TASK_ATTEMPTS} attempts.`);
    }
    return {
        ...task,
        status: nextStatus,
        attempts,
    };
}
