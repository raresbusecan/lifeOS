import type { AgentOutput } from "./agentOutput.js";
import type { AgentRole } from "./agentRole.js";
import { runAgent } from "./agentRunner.js";

export interface AgentOrchestratorOptions {
  timeoutMs?: number;
}

export interface AgentExecution {
  role: AgentRole;
  output: AgentOutput;
}

export class AgentOrchestrator {
  constructor(
    private readonly options: AgentOrchestratorOptions = {},
  ) {}

  async run(
    role: AgentRole,
    input: string,
  ): Promise<AgentExecution> {
    const output = await runAgent({
      role,
      input,
      timeoutMs: this.options.timeoutMs,
    });

    return {
      role,
      output,
    };
  }

  async runSequential(
    executions: Array<{
      role: AgentRole;
      input: string;
    }>,
  ): Promise<AgentExecution[]> {
    const results: AgentExecution[] = [];

    for (const execution of executions) {
      results.push(
        await this.run(
          execution.role,
          execution.input,
        ),
      );
    }

    return results;
  }
}