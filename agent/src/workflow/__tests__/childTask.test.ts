import assert from "node:assert/strict";

import {
  createTask,
  createChildTask,
} from "../taskFactory.js";

const parent =
  createTask({
    id: "TASK-001",
    title: "Authentication implementation",
    description:
      "Implement authentication flow.",
  });

const child =
  createChildTask(
    parent,
    {
      title: "Unrelated validation bug",
      description:
        "Fix validation bug discovered during testing.",
    },
    1,
  );

assert.equal(
  parent.parentTaskId,
  null,
);

assert.equal(
  child.id,
  "TASK-001-CHILD-001",
);

assert.equal(
  child.parentTaskId,
  parent.id,
);

assert.equal(
  child.status,
  "PROPOSED",
);

assert.equal(
  child.attempts,
  0,
);

assert.notEqual(
  child.id,
  parent.id,
);

assert.notEqual(
  child.title,
  parent.title,
);

const secondChild =
  createChildTask(
    parent,
    {
      title: "Another unrelated bug",
      description:
        "Fix another problem discovered during testing.",
    },
    2,
  );

assert.equal(
  secondChild.id,
  "TASK-001-CHILD-002",
);

assert.equal(
  secondChild.parentTaskId,
  parent.id,
);

assert.equal(
  secondChild.attempts,
  0,
);

console.log(
  "Child task creation test passed",
);