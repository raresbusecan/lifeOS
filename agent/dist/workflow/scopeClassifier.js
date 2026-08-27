function normalize(value) {
    return value
        .trim()
        .toLowerCase()
        .replace(/\\/g, "/");
}
function matches(value, scopeValue) {
    const normalizedValue = normalize(value);
    const normalizedScope = normalize(scopeValue);
    if (normalizedValue ===
        normalizedScope) {
        return true;
    }
    return (normalizedValue.includes(normalizedScope) ||
        normalizedScope.includes(normalizedValue));
}
function findMatches(values, scopeValues) {
    return values.filter((value) => scopeValues.some((scopeValue) => matches(value, scopeValue)));
}
export function classifyTestResultScope(task, result) {
    const resultFiles = result.files ?? [];
    const resultComponents = result.components ?? [];
    const resultBehavior = [
        result.expectedBehavior,
        result.actualBehavior,
    ].filter((value) => typeof value === "string" &&
        value.trim().length > 0);
    const matchedFiles = findMatches(resultFiles, task.scope.files);
    const matchedComponents = findMatches(resultComponents, task.scope.components);
    const matchedBehavior = findMatches(resultBehavior, task.scope.behavior);
    const excludedFiles = findMatches(resultFiles, task.scope.exclusions);
    const excludedComponents = findMatches(resultComponents, task.scope.exclusions);
    const excludedBehavior = findMatches(resultBehavior, task.scope.exclusions);
    const reasons = [];
    if (matchedFiles.length > 0) {
        reasons.push("Affected files overlap the task scope.");
    }
    if (matchedComponents.length > 0) {
        reasons.push("Affected components overlap the task scope.");
    }
    if (matchedBehavior.length > 0) {
        reasons.push("Reported behavior overlaps the task scope.");
    }
    if (excludedFiles.length > 0 ||
        excludedComponents.length > 0 ||
        excludedBehavior.length > 0) {
        reasons.push("The finding overlaps an explicitly excluded scope.");
    }
    const hasScopeEvidence = matchedFiles.length > 0 ||
        matchedComponents.length > 0 ||
        matchedBehavior.length > 0;
    const hasExclusion = excludedFiles.length > 0 ||
        excludedComponents.length > 0 ||
        excludedBehavior.length > 0;
    const classification = hasExclusion
        ? "OUT_OF_SCOPE"
        : hasScopeEvidence
            ? "IN_SCOPE"
            : "OUT_OF_SCOPE";
    if (!hasScopeEvidence &&
        !hasExclusion) {
        reasons.push("No reported file, component, or behavior overlaps the task scope.");
    }
    return {
        classification,
        matchedFiles,
        matchedComponents,
        matchedBehavior,
        excludedFiles,
        excludedComponents,
        excludedBehavior,
        reasons,
    };
}
