import {
  mkdir,
  readFile,
  rename,
  writeFile,
} from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";

import {
  TaskStore,
  type TaskStoreSnapshot,
} from "./taskStore.js";

function getTaskStateDirectory(
  repositoryRoot: string,
): string {
  return resolve(
    repositoryRoot,
    ".agent",
    "runtime",
  );
}

export function getTaskStoreFile(
  repositoryRoot: string,
): string {
  return resolve(
    getTaskStateDirectory(repositoryRoot),
    "tasks.json",
  );
}

export async function loadTaskStore(
  repositoryRoot: string,
): Promise<TaskStore> {
  const file = getTaskStoreFile(
    repositoryRoot,
  );

  try {
    const content = await readFile(file, "utf8");
    const snapshot = JSON.parse(
      content,
    ) as TaskStoreSnapshot;

    return TaskStore.fromSnapshot(snapshot);
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return new TaskStore();
    }

    throw new Error(
      `Unable to load task state from ${file}.`,
      { cause: error },
    );
  }
}

export async function saveTaskStore(
  repositoryRoot: string,
  store: TaskStore,
): Promise<void> {
  const directory = getTaskStateDirectory(
    repositoryRoot,
  );
  const file = getTaskStoreFile(repositoryRoot);
  const temporaryFile = resolve(
    directory,
    `tasks.${randomUUID()}.tmp`,
  );

  await mkdir(directory, {
    recursive: true,
  });

  try {
    await writeFile(
      temporaryFile,
      JSON.stringify(
        store.toSnapshot(),
        null,
        2,
      ) + "\n",
      "utf8",
    );

    await rename(temporaryFile, file);
  } catch (error) {
    throw new Error(
      `Unable to save task state to ${file}.`,
      { cause: error },
    );
  }
}
