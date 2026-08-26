import {
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";

export type ConversationRole =
  | "system"
  | "user"
  | "assistant";

export interface ConversationMessage {
  role: ConversationRole;
  content: string;
  createdAt: string;
}

export interface Conversation {
  version: 1;
  id: string;
  createdAt: string;
  updatedAt: string;
  messages: ConversationMessage[];
}

interface ConversationIndexEntry {
  id: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

interface ConversationIndex {
  version: 1;
  conversations: ConversationIndexEntry[];
}

function getMemoryDirectory(
  repositoryRoot: string,
): string {
  return resolve(
    repositoryRoot,
    ".agent",
    "memory",
  );
}

function getConversationDirectory(
  repositoryRoot: string,
): string {
  return resolve(
    getMemoryDirectory(repositoryRoot),
    "conversations",
  );
}

function getConversationFile(
  repositoryRoot: string,
  conversationId: string,
): string {
  return resolve(
    getConversationDirectory(repositoryRoot),
    `${conversationId}.json`,
  );
}

function getConversationIndexFile(
  repositoryRoot: string,
): string {
  return resolve(
    getMemoryDirectory(repositoryRoot),
    "index.json",
  );
}

async function loadConversationIndex(
  repositoryRoot: string,
): Promise<ConversationIndex> {
  const indexFile =
    getConversationIndexFile(
      repositoryRoot,
    );

  try {
    const content = await readFile(
      indexFile,
      "utf8",
    );

    const index =
      JSON.parse(content) as ConversationIndex;

    if (index.version === 1) {
      return index;
    }
  } catch {
    // Empty memory.
  }

  return {
    version: 1,
    conversations: [],
  };
}

async function saveConversationIndex(
  repositoryRoot: string,
  index: ConversationIndex,
): Promise<void> {
  const memoryDirectory =
    getMemoryDirectory(repositoryRoot);

  await mkdir(memoryDirectory, {
    recursive: true,
  });

  await writeFile(
    getConversationIndexFile(
      repositoryRoot,
    ),
    JSON.stringify(index, null, 2) + "\n",
    "utf8",
  );
}

export async function createConversation(
  repositoryRoot: string,
): Promise<Conversation> {
  const now =
    new Date().toISOString();

  const conversation: Conversation = {
    version: 1,
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    messages: [],
  };

  await mkdir(
    getConversationDirectory(
      repositoryRoot,
    ),
    {
      recursive: true,
    },
  );

  await saveConversation(
    repositoryRoot,
    conversation,
  );

  return conversation;
}

export async function loadConversation(
  repositoryRoot: string,
  conversationId: string,
): Promise<Conversation | null> {
  try {
    const content = await readFile(
      getConversationFile(
        repositoryRoot,
        conversationId,
      ),
      "utf8",
    );

    return JSON.parse(
      content,
    ) as Conversation;
  } catch {
    return null;
  }
}

export async function saveConversation(
  repositoryRoot: string,
  conversation: Conversation,
): Promise<void> {
  const directory =
    getConversationDirectory(
      repositoryRoot,
    );

  await mkdir(directory, {
    recursive: true,
  });

  conversation.updatedAt =
    new Date().toISOString();

  await writeFile(
    getConversationFile(
      repositoryRoot,
      conversation.id,
    ),
    JSON.stringify(
      conversation,
      null,
      2,
    ) + "\n",
    "utf8",
  );

  const index =
    await loadConversationIndex(
      repositoryRoot,
    );

  const existing =
    index.conversations.find(
      (entry) =>
        entry.id === conversation.id,
    );

  const entry: ConversationIndexEntry = {
    id: conversation.id,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    messageCount:
      conversation.messages.length,
  };

  if (existing) {
    Object.assign(existing, entry);
  } else {
    index.conversations.push(entry);
  }

  index.conversations.sort(
    (a, b) =>
      b.updatedAt.localeCompare(
        a.updatedAt,
      ),
  );

  await saveConversationIndex(
    repositoryRoot,
    index,
  );
}

export async function addMessage(
  repositoryRoot: string,
  conversationId: string,
  role: ConversationRole,
  content: string,
): Promise<Conversation> {
  const conversation =
    await loadConversation(
      repositoryRoot,
      conversationId,
    );

  if (!conversation) {
    throw new Error(
      `Conversation not found: ${conversationId}`,
    );
  }

  if (!content.trim()) {
    throw new Error(
      "Conversation message cannot be empty",
    );
  }

  conversation.messages.push({
    role,
    content,
    createdAt:
      new Date().toISOString(),
  });

  await saveConversation(
    repositoryRoot,
    conversation,
  );

  return conversation;
}

export async function listConversations(
  repositoryRoot: string,
): Promise<ConversationIndexEntry[]> {
  const index =
    await loadConversationIndex(
      repositoryRoot,
    );

  return index.conversations;
}
