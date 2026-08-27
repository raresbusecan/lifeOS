import assert from "node:assert/strict";

import {
  createTask,
} from "../taskFactory.js";

const task =
  createTask({
    id: "TASK-001",
    title: "Define task factory",
    description:
      "Create tasks through a single factory.",
    scope: {
      files: [
        "src/workflow/task.ts",
        "src/workflow/taskFactory.ts",
      ],
      components: [
        "workflow",
      ],
      behavior: [
        "Create a valid task",
      ],
      exclusions: [
        "frontend",
        "backend",
      ],
    },
  });

assert.equal(
  task.id,
  "TASK-001",
);

assert.equal(
  task.title,
  "Define task factory",
);

assert.equal(
  task.description,
  "Create tasks through a single factory.",
);

assert.equal(
  task.status,
  "PROPOSED",
);

assert.equal(
  task.department,
  "COUNCIL",
);

assert.equal(
  task.attempts,
  0,
);

assert.equal(
  task.parentTaskId,
  null,
);

assert.equal(
  task.scope.files.length,
  2,
);

const childTask =
  createTask({
    id: "TASK-002",
    title: "Child task",
    description:
      "Create a child task.",
    scope: {
      files: [],
      components: [],
      behavior: [],
      exclusions: [],
    },
    parentTaskId: "TASK-001",
  });

assert.equal(
  childTask.parentTaskId,
  "TASK-001",
);

console.log(
  "Task factory test passed",
);