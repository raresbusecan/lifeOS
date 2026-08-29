export function assertValidImpactMap(impactMap) {
    if (!impactMap || typeof impactMap !== "object") {
        throw new Error("Impact Map is required.");
    }
    assertStringArray(impactMap.filesToModify, "filesToModify");
    assertStringArray(impactMap.filesToCreate, "filesToCreate");
    assertStringArray(impactMap.testsToModify, "testsToModify");
    assertStringArray(impactMap.testsToCreate, "testsToCreate");
    assertStringArray(impactMap.componentsAffected, "componentsAffected");
    assertStringArray(impactMap.componentsProtected, "componentsProtected");
    assertStringArray(impactMap.architectureRisks, "architectureRisks");
    if (typeof impactMap.confidence !== "number" ||
        !Number.isFinite(impactMap.confidence) ||
        impactMap.confidence < 0 ||
        impactMap.confidence > 1) {
        throw new Error("Impact Map confidence must be a number between 0 and 1.");
    }
}
function assertStringArray(value, fieldName) {
    if (!Array.isArray(value)) {
        throw new Error(`Impact Map ${fieldName} must be an array.`);
    }
    for (const item of value) {
        if (typeof item !== "string" ||
            item.trim().length === 0) {
            throw new Error(`Impact Map ${fieldName} must contain only non-empty strings.`);
        }
    }
}
