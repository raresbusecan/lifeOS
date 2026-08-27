export function validateTestResult(task, result) {
    if (!result.relatedTaskId.trim()) {
        throw new Error("Test result must contain a related task ID.");
    }
    if (result.relatedTaskId !== task.id) {
        throw new Error(`Test result belongs to task ${result.relatedTaskId}, not ${task.id}.`);
    }
    if (!result.summary.trim()) {
        throw new Error("Test result summary cannot be empty.");
    }
    if (!result.details.trim()) {
        throw new Error("Test result details cannot be empty.");
    }
    if (result.type === "PASS") {
        return;
    }
    if (result.type === "REWORK") {
        if (!result.expectedBehavior?.trim()) {
            throw new Error("REWORK result must describe expected behavior.");
        }
        if (!result.actualBehavior?.trim()) {
            throw new Error("REWORK result must describe actual behavior.");
        }
        return;
    }
    if (result.type === "NEW_TASK") {
        if (!result.expectedBehavior?.trim()) {
            throw new Error("NEW_TASK result must describe expected behavior.");
        }
        if (!result.actualBehavior?.trim()) {
            throw new Error("NEW_TASK result must describe actual behavior.");
        }
        if ((!result.files ||
            result.files.length === 0) &&
            (!result.components ||
                result.components.length === 0)) {
            throw new Error("NEW_TASK result must identify affected files or components.");
        }
        return;
    }
    throw new Error(`Unknown test result type: ${result.type}`);
}
