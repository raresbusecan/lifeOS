import { appendTransition, createTransition, } from "./history.js";
import { moveTask, } from "./workflow.js";
import { assertValidTask, } from "./taskValidator.js";
export class TaskStore {
    tasks = new Map();
    histories = new Map();
    add(task) {
        assertValidTask(task);
        if (this.tasks.has(task.id)) {
            throw new Error(`Task ${task.id} already exists.`);
        }
        this.tasks.set(task.id, task);
        this.histories.set(task.id, []);
    }
    get(taskId) {
        return this.tasks.get(taskId);
    }
    has(taskId) {
        return this.tasks.has(taskId);
    }
    update(task) {
        assertValidTask(task);
        if (!this.tasks.has(task.id)) {
            throw new Error(`Task ${task.id} does not exist.`);
        }
        this.tasks.set(task.id, task);
        if (!this.histories.has(task.id)) {
            this.histories.set(task.id, []);
        }
    }
    transition(taskId, nextStatus, reason) {
        const task = this.tasks.get(taskId);
        if (!task) {
            throw new Error(`Task ${taskId} does not exist.`);
        }
        const updatedTask = moveTask(task, nextStatus);
        const transition = createTransition(task.status, nextStatus, reason);
        const currentHistory = this.histories.get(taskId) ?? [];
        this.histories.set(taskId, appendTransition(currentHistory, transition));
        this.tasks.set(taskId, updatedTask);
        return updatedTask;
    }
    getHistory(taskId) {
        if (!this.tasks.has(taskId)) {
            throw new Error(`Task ${taskId} does not exist.`);
        }
        return [
            ...(this.histories.get(taskId) ?? []),
        ];
    }
    getChildren(parentTaskId) {
        return Array.from(this.tasks.values()).filter((task) => task.parentTaskId ===
            parentTaskId);
    }
    getNextChildSequence(parentTaskId) {
        const children = this.getChildren(parentTaskId);
        if (children.length === 0) {
            return 1;
        }
        const prefix = `${parentTaskId}-CHILD-`;
        let highestSequence = 0;
        for (const child of children) {
            if (!child.id.startsWith(prefix)) {
                continue;
            }
            const sequenceText = child.id.slice(prefix.length);
            const sequence = Number(sequenceText);
            if (Number.isInteger(sequence) &&
                sequence > highestSequence) {
                highestSequence = sequence;
            }
        }
        return highestSequence + 1;
    }
    getAll() {
        return Array.from(this.tasks.values());
    }
    toSnapshot() {
        const histories = {};
        for (const [taskId, history] of this.histories) {
            histories[taskId] = [...history];
        }
        return {
            version: 1,
            tasks: this.getAll().map((task) => ({
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
            })),
            histories,
        };
    }
    static fromSnapshot(snapshot) {
        if (snapshot.version !== 1) {
            throw new Error(`Unsupported task store version: ${snapshot.version}.`);
        }
        const store = new TaskStore();
        for (const task of snapshot.tasks) {
            store.add(task);
        }
        for (const task of snapshot.tasks) {
            const history = snapshot.histories[task.id] ?? [];
            if (!Array.isArray(history)) {
                throw new Error(`Task ${task.id} has an invalid transition history.`);
            }
            store.histories.set(task.id, history.map((transition) => ({
                ...transition,
            })));
        }
        return store;
    }
}
