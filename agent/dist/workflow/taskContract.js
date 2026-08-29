function isNonEmptyString(value) {
    return (typeof value === "string" &&
        value.trim().length > 0);
}
function isStringArray(value) {
    return (Array.isArray(value) &&
        value.every((item) => typeof item === "string"));
}
function validateScope(scope, errors) {
    if (typeof scope !== "object" ||
        scope === null) {
        errors.push("scope must be an object.");
        return false;
    }
    const value = scope;
    if (!isStringArray(value.files)) {
        errors.push("scope.files must be an array of strings.");
    }
    if (!isStringArray(value.components)) {
        errors.push("scope.components must be an array of strings.");
    }
    if (!isStringArray(value.behavior)) {
        errors.push("scope.behavior must be an array of strings.");
    }
    if (!isStringArray(value.exclusions)) {
        errors.push("scope.exclusions must be an array of strings.");
    }
    return errors.every((error) => !error.startsWith("scope."));
}
export function validateTaskContract(contract) {
    const errors = [];
    if (typeof contract !== "object" ||
        contract === null) {
        return {
            valid: false,
            errors: ["Task contract must be an object."],
        };
    }
    const value = contract;
    if (!isNonEmptyString(value.taskId)) {
        errors.push("taskId must be a non-empty string.");
    }
    if (!isNonEmptyString(value.objective)) {
        errors.push("objective must be a non-empty string.");
    }
    if (!isStringArray(value.acceptanceCriteria)) {
        errors.push("acceptanceCriteria must be an array of strings.");
    }
    if (!isStringArray(value.constraints)) {
        errors.push("constraints must be an array of strings.");
    }
    if (!isStringArray(value.requiredTests)) {
        errors.push("requiredTests must be an array of strings.");
    }
    if (!isStringArray(value.dependencies)) {
        errors.push("dependencies must be an array of strings.");
    }
    validateScope(value.scope, errors);
    return {
        valid: errors.length === 0,
        errors,
    };
}
export function assertValidTaskContract(contract) {
    const result = validateTaskContract(contract);
    if (!result.valid) {
        throw new Error([
            "Invalid task contract:",
            ...result.errors.map((error) => `- ${error}`),
        ].join("\n"));
    }
}
export function createTaskContract(params) {
    const contract = {
        taskId: params.taskId,
        objective: params.objective,
        acceptanceCriteria: params.acceptanceCriteria ?? [],
        scope: {
            files: [...params.scope.files],
            components: [...params.scope.components],
            behavior: [...params.scope.behavior],
            exclusions: [...params.scope.exclusions],
        },
        constraints: params.constraints ?? [],
        requiredTests: params.requiredTests ?? [],
        dependencies: params.dependencies ?? [],
    };
    assertValidTaskContract(contract);
    return contract;
}
