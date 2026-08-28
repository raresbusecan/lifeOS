import type {
  Task,
} from "./task.js";

import {
  appendTransition,
  createTransition,
  type TaskTransition,
} from "./history.js";

import type {
  TaskStatus,
} from "./task.js";

import {
  moveTask,
} from "./workflow.js";

import {
  assertValidTask,
} from "./taskValidator.js";

export interface TaskStoreSnapshot {
  version: 1;
  tasks: Task[];
  histories: Record<string, TaskTransition[]>;
}

export class TaskStore {
  private readonly tasks =
    new Map<string, Task>();

  private readonly histories =
    new Map<string, TaskTransition[]>();

  add(task: Task): void {
    assertValidTask(task);

    if (
      this.tasks.has(task.id)
    ) {
      throw new Error(
        `Task ${task.id} already exists.`,
      );
    }

    this.tasks.set(
      task.id,
      task,
    );

    this.histories.set(
      task.id,
      [],
    );
  }

  get(
    taskId: string,
  ): Task | undefined {
    return this.tasks.get(taskId);
  }

  has(
    taskId: string,
  ): boolean {
    return this.tasks.has(taskId);
  }

  update(task: Task): void {
    assertValidTask(task);

    if (
      !this.tasks.has(task.id)
    ) {
      throw new Error(
        `Task ${task.id} does not exist.`,
      );
    }

    this.tasks.set(
      task.id,
      task,
    );

    if (
      !this.histories.has(task.id)
    ) {
      this.histories.set(
        task.id,
        [],
      );
    }
  }

  transition(
    taskId: string,
    nextStatus: TaskStatus,
    reason: string,
  ): Task {
    const task =
      this.tasks.get(taskId);

    if (!task) {
      throw new Error(
        `Task ${taskId} does not exist.`,
      );
    }

    const updatedTask =
      moveTask(
        task,
        nextStatus,
      );

    const transition =
      createTransition(
        task.status,
        nextStatus,
        reason,
      );

    const currentHistory =
      this.histories.get(
        taskId,
      ) ?? [];

    this.histories.set(
      taskId,
      appendTransition(
        currentHistory,
        transition,
      ),
    );

    this.tasks.set(
      taskId,
      updatedTask,
    );

    return updatedTask;
  }

  getHistory(
    taskId: string,
  ): TaskTransition[] {
    if (
      !this.tasks.has(taskId)
    ) {
      throw new Error(
        `Task ${taskId} does not exist.`,
      );
    }

    return [
      ...(this.histories.get(
        taskId,
      ) ?? []),
    ];
  }

  getChildren(
    parentTaskId: string,
  ): Task[] {
    return Array.from(
      this.tasks.values(),
    ).filter(
      (task) =>
        task.parentTaskId ===
        parentTaskId,
    );
  }

  getNextChildSequence(
    parentTaskId: string,
  ): number {
    const children =
      this.getChildren(
        parentTaskId,
      );

    if (children.length === 0) {
      return 1;
    }

    const prefix =
      `${parentTaskId}-CHILD-`;

    let highestSequence = 0;

    for (const child of children) {
      if (
        !child.id.startsWith(prefix)
      ) {
        continue;
      }

      const sequenceText =
        child.id.slice(
          prefix.length,
        );

      const sequence =
        Number(sequenceText);

      if (
        Number.isInteger(sequence) &&
        sequence > highestSequence
      ) {
        highestSequence = sequence;
      }
    }

    return highestSequence + 1;
  }

  getAll(): Task[] {
    return Array.from(
      this.tasks.values(),
    );
  }

  toSnapshot(): TaskStoreSnapshot {
    const histories: Record<
      string,
      TaskTransition[]
    > = {};

    for (const [taskId, history] of this.histories) {
      histories[taskId] = [...history];
    }

    return {
      version: 1,
      tasks: this.getAll().map(
        (task) => ({
          ...task,
          scope: {
            ...task.scope,
            files: [...task.scope.files],
            components: [
              ...task.scope.components,
            ],
            behavior: [
              ...task.scope.behavior,
            ],
            exclusions: [
              ...task.scope.exclusions,
            ],
          },
        }),
      ),
      histories,
    };
  }

  static fromSnapshot(
    snapshot: TaskStoreSnapshot,
  ): TaskStore {
    if (snapshot.version !== 1) {
      throw new Error(
        `Unsupported task store version: ${snapshot.version}.`,
      );
    }

    const store = new TaskStore();

    for (const task of snapshot.tasks) {
      store.add(task);
    }

    for (const task of snapshot.tasks) {
      const history = snapshot.histories[task.id] ?? [];

      if (!Array.isArray(history)) {
        throw new Error(
          `Task ${task.id} has an invalid transition history.`,
        );
      }

      store.histories.set(
        task.id,
        history.map((transition) => ({
          ...transition,
        })),
      );
    }

    return store;
  }
}
