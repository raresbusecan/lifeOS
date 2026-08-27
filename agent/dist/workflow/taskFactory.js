import { createChildTaskId, } from "./taskId.js";
export function createTask(input) {
    const scope = {
        files: input.scope?.files ?? [],
        components: input.scope?.components ?? [],
        behavior: input.scope?.behavior ?? [],
        exclusions: input.scope?.exclusions ?? [],
    };
    return {
        id: input.id,
        title: input.title,
        description: input.description,
        status: input.status ?? "PROPOSED",
        department: input.department ?? "COUNCIL",
        attempts: 0,
        scope,
        parentTaskId: input.parentTaskId ?? null,
    };
}
export function createChildTask(parentTask, input, sequence) {
    return createTask({
        ...input,
        id: createChildTaskId(parentTask.id, sequence),
        parentTaskId: parentTask.id,
    });
}
