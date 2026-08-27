import assert from "node:assert/strict";

import {
  createTask,
  createChildTask,
} from "../taskFactory.js";

import {
  TaskStore,
} from "../taskStore.js";

const store =
  new TaskStore();

const parent =
  createTask({
    id: "TASK-001",
    title: "Parent task",
    description:
      "Test parent task.",
  });

store.add(parent);

assert.equal(
  store.has("TASK-001"),
  true,
);

assert.equal(
  store.get("TASK-001"),
  parent,
);

assert.equal(
  store.getNextChildSequence(
    parent.id,
  ),
  1,
);

const childOne =
  createChildTask(
    parent,
    {
      title: "Child one",
      description:
        "First child task.",
    },
    store.getNextChildSequence(
      parent.id,
    ),
  );

store.add(childOne);

assert.equal(
  childOne.id,
  "TASK-001-CHILD-001",
);

assert.equal(
  store.getNextChildSequence(
    parent.id,
  ),
  2,
);

const childTwo =
  createChildTask(
    parent,
    {
      title: "Child two",
      description:
        "Second child task.",
    },
    store.getNextChildSequence(
      parent.id,
    ),
  );

store.add(childTwo);

assert.equal(
  childTwo.id,
  "TASK-001-CHILD-002",
);

assert.equal(
  store.getNextChildSequence(
    parent.id,
  ),
  3,
);

const children =
  store.getChildren(
    parent.id,
  );

assert.equal(
  children.length,
  2,
);

assert.deepEqual(
  children.map(
    (task) => task.id,
  ),
  [
    "TASK-001-CHILD-001",
    "TASK-001-CHILD-002",
  ],
);

assert.equal(
  store.getAll().length,
  3,
);

assert.throws(
  () => store.add(parent),
  /already exists/,
);

const unknownTask =
  createTask({
    id: "TASK-999",
    title: "Unknown",
    description:
      "Not registered.",
  });

assert.throws(
  () => store.update(unknownTask),
  /does not exist/,
);

const updatedParent =
  {
    ...parent,
    title: "Updated parent",
  };

store.update(
  updatedParent,
);

assert.equal(
  store.get("TASK-001")?.title,
  "Updated parent",
);

console.log(
  "Task store test passed",
);