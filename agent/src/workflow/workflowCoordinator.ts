import type {
Task,
} from "./task.js";

import type {
TestResult,
} from "./testing.js";

import {
runCodingPhase,
handleWorkflowTestResult,
type WorkflowRunResult,
type WorkflowTestingResult,
} from "./workflowRunner.js";

import {
TaskStore,
} from "./taskStore.js";

import {
WorkflowGuard,
} from "./workflowGuard.js";

export class WorkflowCoordinator {
private readonly guard: WorkflowGuard;

constructor(
private readonly store: TaskStore,
) {
this.guard =
new WorkflowGuard(
this.store,
);
}

getTask(
taskId: string,
): Task {
const task =
this.store.get(
taskId,
);


if (!task) {
  throw new Error(
    `Task ${taskId} does not exist.`,
  );
}

return task;


}

startCoding(
taskId: string,
): WorkflowRunResult {
const task =
this.getTask(
taskId,
);

return runCodingPhase(
  task,
  this.guard,
);


}

handleTestResult(
taskId: string,
result: TestResult,
): WorkflowTestingResult {
const task =
this.getTask(
taskId,
);


return handleWorkflowTestResult(
  task,
  result,
  this.guard,
  this.store,
);


}
}
