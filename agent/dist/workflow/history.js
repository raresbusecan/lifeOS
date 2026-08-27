export function appendTransition(history, transition) {
    return [
        ...history,
        transition,
    ];
}
export function createTransition(from, to, reason, timestamp = new Date().toISOString()) {
    const normalizedReason = reason.trim();
    if (!normalizedReason) {
        throw new Error("Transition reason cannot be empty.");
    }
    return {
        from,
        to,
        reason: normalizedReason,
        timestamp,
    };
}
