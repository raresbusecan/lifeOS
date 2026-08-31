
import {
  existsSync,
  readFileSync,
} from "node:fs";
import { resolve } from "node:path";

import { AgentOrchestrator } from "../agentRunner/agentOrchestrator.js";
import type { AgentRole } from "../agentRunner/agentRole.js";
import type { AgentOutput } from "../agentRunner/agentOutput.js";

interface CurrentTask {
  taskId: string;
  state: string;
  attempt: number;
  readScope: string[];
  writeScope: string[];
  protectedScope: string[];
  nextAction: string;
}

interface Checkpoint {
  taskId: string;
  state: string;
  attempt: number;
  timestamp: string;
  gitRef: string;
  changedFiles: string[];
  testResult?: Record<string, unknown>;
  decisionRefs: string[];
  discoveries: string[];
  knownProblems: string[];
  nextAction: string;
}

interface CurrentContext {
  taskId: string;
  contextVersion: string;
  facts: string[];
  relevantFiles: string[];
  decisions: string[];
  previousFailures: string[];
  retrievalMode: string;
  explorationBudget: string;
}

export interface DcsRuntimeResult {
  taskId: string;
  state: string;
  role: AgentRole;
  nextAction: string;
  output: AgentOutput;
}

function readJson<T>(file: string): T {
  if (!existsSync(file)) {
    throw new Error(`Missing DCS file: ${file}`);
  }

  return JSON.parse(
    readFileSync(file, "utf8"),
  ) as T;
}

function readText(
  repositoryRoot: string,
  relativePath: string,
): string {
  const file = resolve(
    repositoryRoot,
    relativePath,
  );

  if (!existsSync(file)) {
    return `[MISSING: ${relativePath}]`;
  }

  return readFileSync(
    file,
    "utf8",
  );
}

function truncate(
  value: string,
  maxLength: number,
): string {
  if (value.length <= maxLength) {
    return value;
  }

  return (
    value.slice(0, maxLength) +
    `\n\n[TRUNCATED: ${value.length - maxLength} characters omitted]`
  );
}

function selectRole(
  state: string,
): AgentRole {
  switch (state) {
    case "TESTING":
      return "TESTER";

    case "CODING":
    case "FIX_REQUIRED":
      return "CODER";

    default:
      return "ANALYST";
  }
}

function deriveNextAction(
  state: string,
  output: AgentOutput,
): string {
  if (
    output.status ===
    "NEEDS_CLARIFICATION"
  ) {
    return "Resolve clarification required by agent.";
  }

  if (output.status === "BLOCKED") {
    return "Resolve the blocking condition identified by the agent.";
  }

  if (output.status === "FAILED") {
    return "Investigate the failed agent execution.";
  }

  if (
    typeof output.nextAction === "string" &&
    output.nextAction.trim()
  ) {
    return output.nextAction.trim();
  }

  if (output.recommendations.length > 0) {
    return output.recommendations[0];
  }

  return `Continue ${state} task execution.`;
}

function buildInventory(
  repositoryRoot: string,
  currentTask: CurrentTask,
) {
  const importantFiles = [
    "AGENTS.md",
    "PROJECT_STATE.md",
    "agent/PLAN_IMPLEMENT.md",
    "agent/ROADMAP_TO_DEV_FLOW.md",
    "DCS/CONSTITUTION.md",
    "DCS/CYCLE.md",
    "DCS/TASK_MODEL.md",
    "DCS/SCOPE_MODEL.md",
    "DCS/ROLES.md",
    "DCS/RISK_MODEL.md",
    "DCS/GATES.md",
    "DCS/DECISIONS.md",
    "DCS/CHECKPOINTS.md",
    "DCS/MEMORY_INTERFACE.md",
    "DCS/AGENT_PROTOCOL.md",
    "DCS/IMPLEMENTATION_PLAN.md",
    `DCS/tasks/${currentTask.taskId}.md`,
  ];

  const existingFiles = importantFiles.filter(
    (file) =>
      existsSync(
        resolve(
          repositoryRoot,
          file,
        ),
      ),
  );

  const missingFiles = importantFiles.filter(
    (file) =>
      !existsSync(
        resolve(
          repositoryRoot,
          file,
        ),
      ),
  );

  return {
    taskId: currentTask.taskId,
    state: currentTask.state,
    attempt: currentTask.attempt,

    readScope: currentTask.readScope,
    writeScope: currentTask.writeScope,
    protectedScope:
      currentTask.protectedScope,

    auditMode: true,
    readOnly: true,

    repositoryRoot,

    importantFiles: existingFiles,
    missingFiles,

    directoriesToInspect: [
      "agent/",
      ".agent/",
    ],

    taskDocumentPath:
      `DCS/tasks/${currentTask.taskId}.md`,

    taskDocumentAvailable:
      existsSync(
        resolve(
          repositoryRoot,
          `DCS/tasks/${currentTask.taskId}.md`,
        ),
      ),
  };
}

function buildEvidence(
  repositoryRoot: string,
  currentTask: CurrentTask,
): Record<string, string> {
  const files = [
    "AGENTS.md",
    "PROJECT_STATE.md",
    "agent/PLAN_IMPLEMENT.md",
    "agent/ROADMAP_TO_DEV_FLOW.md",
    "DCS/CONSTITUTION.md",
    "DCS/CYCLE.md",
    "DCS/TASK_MODEL.md",
    "DCS/SCOPE_MODEL.md",
    "DCS/ROLES.md",
    "DCS/RISK_MODEL.md",
    "DCS/GATES.md",
    "DCS/DECISIONS.md",
    "DCS/CHECKPOINTS.md",
    "DCS/MEMORY_INTERFACE.md",
    "DCS/AGENT_PROTOCOL.md",
    "DCS/IMPLEMENTATION_PLAN.md",
    `DCS/tasks/${currentTask.taskId}.md`,
  ];

  const evidence: Record<string, string> = {};

  for (const file of files) {
    const absolutePath = resolve(
      repositoryRoot,
      file,
    );

    if (!existsSync(absolutePath)) {
      evidence[file] = `[MISSING: ${file}]`;
      continue;
    }

    evidence[file] = truncate(
      readFileSync(
        absolutePath,
        "utf8",
      ),
      12000,
    );
  }

  return evidence;
}

export async function runDcsRuntime(
  repositoryRoot = resolve(
    process.cwd(),
    "..",
  ),
): Promise<DcsRuntimeResult> {
  const dcsRoot = resolve(
    repositoryRoot,
    "DCS",
  );

  const runtimeRoot = resolve(
    dcsRoot,
    "runtime",
  );

  const currentTask =
    readJson<CurrentTask>(
      resolve(
        runtimeRoot,
        "CURRENT_TASK.JSON",
      ),
    );

  const checkpoint =
    readJson<Checkpoint>(
      resolve(
        runtimeRoot,
        "LAST_CHECKPOINT.JSON",
      ),
    );

  const context =
    readJson<CurrentContext>(
      resolve(
        runtimeRoot,
        "CURRENT_CONTEXT.JSON",
      ),
    );

  const taskDocumentPath = resolve(
    dcsRoot,
    "tasks",
    `${currentTask.taskId}.md`,
  );

  const taskDocument =
    existsSync(taskDocumentPath)
      ? readFileSync(
          taskDocumentPath,
          "utf8",
        )
      : "[NO TASK DOCUMENT]";

  if (taskDocument === "[NO TASK DOCUMENT]") {
    throw new Error(
      `DCS task document is required: DCS/tasks/${currentTask.taskId}.md`,
    );
  }

  const role =
    selectRole(
      currentTask.state,
    );

  const inventory =
    buildInventory(
      repositoryRoot,
      currentTask,
    );

  const evidence =
    buildEvidence(
      repositoryRoot,
      currentTask,
    );

  const input = JSON.stringify(
    {
      mission:
        "Execute the CURRENT DCS task. For DCS-001, perform a concrete current-system audit.",

      currentTask,

      currentContext: {
        taskId: context.taskId,
        contextVersion:
          context.contextVersion,
        facts: context.facts,
        relevantFiles:
          context.relevantFiles,
        decisions: context.decisions,
        previousFailures:
          context.previousFailures,
        retrievalMode:
          context.retrievalMode,
        explorationBudget:
          context.explorationBudget,
      },

      previousCheckpoint: {
        taskId: checkpoint.taskId,
        state: checkpoint.state,
        attempt: checkpoint.attempt,
        changedFiles:
          checkpoint.changedFiles,
        discoveries:
          checkpoint.discoveries,
        knownProblems:
          checkpoint.knownProblems,
        nextAction:
          checkpoint.nextAction,
      },

      inventory,

      taskDocument,

      referenceDocuments: {
        "AGENTS.md":
          evidence["AGENTS.md"],

        "PROJECT_STATE.md":
          evidence["PROJECT_STATE.md"],

        "agent/PLAN_IMPLEMENT.md":
          evidence[
            "agent/PLAN_IMPLEMENT.md"
          ],

        "agent/ROADMAP_TO_DEV_FLOW.md":
          evidence[
            "agent/ROADMAP_TO_DEV_FLOW.md"
          ],

        "DCS/CONSTITUTION.md":
          evidence[
            "DCS/CONSTITUTION.md"
          ],

        "DCS/CYCLE.md":
          evidence["DCS/CYCLE.md"],

        "DCS/TASK_MODEL.md":
          evidence["DCS/TASK_MODEL.md"],

        "DCS/SCOPE_MODEL.md":
          evidence["DCS/SCOPE_MODEL.md"],

        "DCS/ROLES.md":
          evidence["DCS/ROLES.md"],

        "DCS/RISK_MODEL.md":
          evidence["DCS/RISK_MODEL.md"],

        "DCS/GATES.md":
          evidence["DCS/GATES.md"],

        "DCS/DECISIONS.md":
          evidence["DCS/DECISIONS.md"],

        "DCS/CHECKPOINTS.md":
          evidence["DCS/CHECKPOINTS.md"],

        "DCS/MEMORY_INTERFACE.md":
          evidence[
            "DCS/MEMORY_INTERFACE.md"
          ],

        "DCS/AGENT_PROTOCOL.md":
          evidence[
            "DCS/AGENT_PROTOCOL.md"
          ],

        "DCS/IMPLEMENTATION_PLAN.md":
          evidence[
            "DCS/IMPLEMENTATION_PLAN.md"
          ],
      },

      instructions: [
        "You are the ANALYST executing DCS-001.",

        "This is a READ-ONLY audit.",

        "Do not modify files.",
        "Do not create files.",
        "Do not install packages.",
        "Do not refactor.",
        "Do not commit.",
        "Do not push.",
        "Do not modify frontend or backend.",
        "Do not change workflow state.",

        "Use repository evidence, not filenames alone.",

        "The audit must distinguish FACT, INFERENCE and PROPOSAL.",

        "Classify each required capability as IMPLEMENTED, PARTIAL, MISSING or UNKNOWN.",

        "Required capabilities:",
        "workspace/repository awareness;",
        "scanner;",
        "hashing;",
        "cache;",
        "semantic memory;",
        "embeddings;",
        "Ollama/LLM;",
        "task state;",
        "checkpoints;",
        "logging/audit;",
        "orchestration;",
        "roles;",
        "context/history;",
        "coder write path;",
        "testing;",
        "triage;",
        "Git;",
        "scope prediction/enforcement;",
        "failure classification.",

        "The final audit must explicitly answer:",
        "what actually works;",
        "what is partial;",
        "what is old or unused;",
        "what is reusable;",
        "what must change;",
        "what is missing;",
        "what is unknown;",
        "the smallest safe next implementation step.",

        "Do not claim that an implementation exists merely because documentation describes it.",

        "If repository evidence is insufficient, classify the capability as UNKNOWN.",

        "nextAction must identify one concrete executable next action.",

        "Return the required structured DCS JSON output.",
      ].join(" "),
    },
    null,
    2,
  );

  const execution =
    await new AgentOrchestrator().run(
      role,
      input,
    );

  const output =
    execution.output;

  const nextAction =
    deriveNextAction(
      currentTask.state,
      output,
    );

  /*
   * DCS-001 is a read-only audit.
   *
   * Runtime persistence is intentionally disabled here.
   * The workflow controller owns state transitions
   * and checkpoint persistence.
   */

  return {
    taskId:
      currentTask.taskId,

    state:
      currentTask.state,

    role,

    nextAction,

    output,
  };
}

