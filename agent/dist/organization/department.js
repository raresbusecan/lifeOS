export function isDepartmentId(value) {
    return (value === "COUNCIL" ||
        value === "PLANNING" ||
        value === "ANALYSIS" ||
        value === "ARCHITECTURE" ||
        value === "DEVELOPMENT" ||
        value === "TESTING");
}
export function isDepartmentAgentRole(value) {
    return (value === "PLANNER" ||
        value === "ANALYST" ||
        value === "ARCHITECT" ||
        value === "CODER" ||
        value === "TESTER");
}
export function departmentCanUseTool(department, tool) {
    return department.allowedTools.includes(tool.name);
}
