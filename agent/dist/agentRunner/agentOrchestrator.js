import { runAgent } from "./agentRunner.js";
export class AgentOrchestrator {
    options;
    constructor(options = {}) {
        this.options = options;
    }
    async run(role, input) {
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
    async runSequential(executions) {
        const results = [];
        for (const execution of executions) {
            results.push(await this.run(execution.role, execution.input));
        }
        return results;
    }
}
