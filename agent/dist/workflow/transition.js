import { canTransition, } from "./transitions.js";
export function transitionTask(task, nextStatus) {
    if (task.status === nextStatus) {
        throw new Error(`Task ${task.id} is already in status ${nextStatus}.`);
    }
    if (!canTransition(task.status, nextStatus)) {
        throw new Error(`Invalid task transition: ${task.status} -> ${nextStatus}.`);
    }
    return {
        ...task,
        status: nextStatus,
    };
}
