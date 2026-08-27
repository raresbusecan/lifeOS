const transitions = {
    PROPOSED: [
        "COUNCIL",
        "CANCELLED",
    ],
    COUNCIL: [
        "READY",
        "BLOCKED",
        "CANCELLED",
    ],
    READY: [
        "CODING",
        "CANCELLED",
    ],
    CODING: [
        "TESTING",
        "BLOCKED",
    ],
    TESTING: [
        "DONE",
        "REWORK",
        "BLOCKED",
    ],
    REWORK: [
        "CODING",
        "COUNCIL",
        "BLOCKED",
    ],
    DONE: [],
    BLOCKED: [
        "COUNCIL",
        "CANCELLED",
    ],
    CANCELLED: [],
};
export function getAllowedTransitions(status) {
    return transitions[status];
}
export function canTransition(from, to) {
    return transitions[from].includes(to);
}
