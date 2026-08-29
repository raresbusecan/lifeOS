import type {
    DepartmentDefinition,
    DepartmentId,
    DepartmentAgentRole,
    } from "./department.js";
    
    const departmentDefinitions: DepartmentDefinition[] = [
    {
    id: "COUNCIL",
    name: "Council",
    description:
    "Coordinates organizational intent, task ownership, priorities, and global constraints.",
    
    responsibilities: [
      "Define task intent and organizational priority.",
      "Establish global constraints.",
      "Resolve cross-department conflicts.",
      "Approve or reject major architectural direction.",
    ],
    
    roles: [],
    
    upstream: [],
    downstream: ["PLANNING"],
    
    produces: [
      "task intent",
      "priority",
      "global constraints",
      "organizational decisions",
    ],
    
    consumes: [
      "task request",
      "organizational state",
    ],
    
    allowedTools: [
      "list_files",
      "read_file",
    ],
  
    },
    
    {
    id: "PLANNING",
    name: "Planning",
    description:
    "Turns the task intent into an actionable development plan.",
    
    responsibilities: [
      "Clarify the objective.",
      "Define expected outcomes.",
      "Define acceptance criteria.",
      "Identify implementation direction.",
      "Identify initial scope and constraints.",
    ],
    
    roles: ["PLANNER"],
    
    upstream: ["COUNCIL"],
    downstream: ["ANALYSIS"],
    
    produces: [
      "development plan",
      "acceptance criteria",
      "initial scope",
      "planning decisions",
    ],
    
    consumes: [
      "task intent",
      "priority",
      "global constraints",
      "organizational decisions",
    ],
    
    allowedTools: [
      "list_files",
      "read_file",
    ],
    
    },
    
    {
    id: "ANALYSIS",
    name: "Analysis",
    description:
    "Inspects the repository and determines dependencies, risks, affected areas, and implementation constraints.",
    
  
    responsibilities: [
      "Inspect repository structure.",
      "Inspect relevant source files.",
      "Identify dependencies.",
      "Identify affected components.",
      "Identify technical risks.",
      "Validate the planning assumptions.",
    ],
    
    roles: ["ANALYST"],
    
    upstream: ["PLANNING"],
    downstream: ["ARCHITECTURE"],
    
    produces: [
      "repository analysis",
      "dependency analysis",
      "affected areas",
      "technical risks",
      "analysis findings",
    ],
    
    consumes: [
      "development plan",
      "acceptance criteria",
      "initial scope",
      "planning decisions",
    ],
    
    allowedTools: [
      "list_files",
      "read_file",
    ],
  
    
    },
    
    {
    id: "ARCHITECTURE",
    name: "Architecture",
    description:
    "Determines the architectural implementation boundary and protects existing system behavior.",
    
  
    responsibilities: [
      "Define implementation boundaries.",
      "Evaluate architectural impact.",
      "Select affected components.",
      "Identify interfaces and integration points.",
      "Resolve architectural risks.",
      "Define implementation constraints for development.",
    ],
    
    roles: ["ARCHITECT"],
    
    upstream: ["ANALYSIS"],
    downstream: ["DEVELOPMENT"],
    
    produces: [
      "architecture decision",
      "implementation boundary",
      "component decisions",
      "integration decisions",
      "architectural risks",
    ],
    
    consumes: [
      "development plan",
      "repository analysis",
      "dependency analysis",
      "affected areas",
      "technical risks",
    ],
    
    allowedTools: [
      "list_files",
      "read_file",
    ],
   
    
    },
    
    {
    id: "DEVELOPMENT",
    name: "Development",
    description:
    "Implements the approved task according to the organizational context and architectural decisions.",
    
   
    responsibilities: [
      "Implement the task.",
      "Modify only approved areas.",
      "Respect architectural decisions.",
      "Use repository tools safely.",
      "Produce implementation artifacts.",
      "Report implementation decisions and deviations.",
    ],
    
    roles: ["CODER"],
    
    upstream: ["ARCHITECTURE"],
    downstream: ["TESTING"],
    
    produces: [
      "source artifacts",
      "implementation report",
      "implementation decisions",
      "changed files",
    ],
    
    consumes: [
      "development plan",
      "acceptance criteria",
      "repository analysis",
      "architecture decision",
      "implementation boundary",
    ],
    
    allowedTools: [
      "list_files",
      "read_file",
      "write_file",
    ],
  
    
    },
    
    {
    id: "TESTING",
    name: "Testing",
    description:
    "Validates the implementation against the task contract, acceptance criteria, and organizational decisions.",
    
   
    responsibilities: [
      "Validate implementation behavior.",
      "Run relevant tests.",
      "Verify acceptance criteria.",
      "Detect regressions.",
      "Report failures and risks.",
      "Determine whether rework is required.",
    ],
    
    roles: ["TESTER"],
    
    upstream: ["DEVELOPMENT"],
    downstream: ["DEVELOPMENT", "COUNCIL"],
    
    produces: [
      "test results",
      "verification report",
      "failure findings",
      "rework decision",
    ],
    
    consumes: [
      "acceptance criteria",
      "architecture decision",
      "implementation artifacts",
      "changed files",
      "implementation report",
    ],
    
    allowedTools: [
      "list_files",
      "read_file",
    ],

    },
    ];
    
    export const DEPARTMENTS: readonly DepartmentDefinition[] =
    departmentDefinitions;
    
    export function getDepartment(
    id: DepartmentId,
    ): DepartmentDefinition {
    const department = departmentDefinitions.find(
    (item) => item.id === id,
    );
    
    if (!department) {
    throw new Error(
    `Department ${id} is not defined.`,
    );
    }
    
    return department;
    }
    
    export function getDepartmentByRole(
    role: DepartmentAgentRole,
    ): DepartmentDefinition {
    const department = departmentDefinitions.find(
    (item) => item.roles.includes(role),
    );
    
    if (!department) {
    throw new Error(
    `No department is assigned to role ${role}.`,
    );
    }
    
    return department;
    }
    
    export function getUpstreamDepartments(
    id: DepartmentId,
    ): DepartmentDefinition[] {
    return getDepartment(id).upstream.map(
    getDepartment,
    );
    }
    
    export function getDownstreamDepartments(
    id: DepartmentId,
    ): DepartmentDefinition[] {
    return getDepartment(id).downstream.map(
    getDepartment,
    );
    }
    
    export function canDepartmentFeed(
    from: DepartmentId,
    to: DepartmentId,
    ): boolean {
    return getDepartment(from).downstream.includes(
    to,
    );
    }
    
    export function getWorkflowOrder(): DepartmentId[] {
    return [
    "COUNCIL",
    "PLANNING",
    "ANALYSIS",
    "ARCHITECTURE",
    "DEVELOPMENT",
    "TESTING",
    ];
    }
    