const transitions = {
    CREATED: [
        "ANALYSIS",
        "CANCELLED",
    ],
    ANALYSIS: [
        "COUNCIL",
        "BLOCKED",
        "CANCELLED",
    ],
    CONTRACT_READY: [
        "IMPACT_APPROVED",
        "BLOCKED",
        "CANCELLED",
    ],
    IMPACT_APPROVED: [
        "GIT_READY",
        "COUNCIL",
        "BLOCKED",
        "CANCELLED",
    ],
    GIT_READY: [
        "CODING",
        "BLOCKED",
        "CANCELLED",
    ],
    IMPLEMENTED: [
        "TESTING",
        "FIX_REQUIRED",
        "BLOCKED",
    ],
    TRIAGE: [
        "REVIEW",
        "FIX_REQUIRED",
        "COUNCIL",
        "BLOCKED",
    ],
    FIX_REQUIRED: [
        "CODING",
        "COUNCIL",
        "BLOCKED",
    ],
    REVIEW: [
        "DONE",
        "COUNCIL",
        "BLOCKED",
    ],
    PROPOSED: [
        "COUNCIL",
        "CANCELLED",
    ],
    COUNCIL: [
        "CONTRACT_READY",
        "READY",
        "BLOCKED",
        "CANCELLED",
    ],
    READY: [
        "CODING",
        "CANCELLED",
    ],
    CODING: [
        "IMPLEMENTED",
        "TESTING",
        "BLOCKED",
    ],
    TESTING: [
        "TRIAGE",
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
