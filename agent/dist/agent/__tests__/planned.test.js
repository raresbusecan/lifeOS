import assert from "node:assert/strict";
import { mkdtemp, rm, mkdir, writeFile, } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { runPlannedAgent, } from "../planned.js";
const repositoryRoot = await mkdtemp(resolve(tmpdir(), "lifeos-planned-agent-test-"));
try {
    await mkdir(resolve(repositoryRoot, "src"), {
        recursive: true,
    });
    await writeFile(resolve(repositoryRoot, "src", "auth.ts"), [
        "export function login(username: string, password: string) {",
        "  return authenticate(username, password);",
        "}",
    ].join("\n"), "utf8");
    const result = await runPlannedAgent(repositoryRoot, "Analyze the authentication implementation in the repository.", {
        maxStepsPerPlanStep: 10,
    });
    assert.ok(result.plan.goal);
    assert.ok(result.plan.steps.length > 0);
    assert.equal(result.steps.length, result.plan.steps.length);
    assert.ok(result.totalToolCalls > 0);
    assert.ok(result.answer);
    for (const stepResult of result.steps) {
        assert.ok(stepResult.step.id);
        assert.ok(stepResult.step.description);
        assert.ok(stepResult.result.answer);
    }
    console.log("Planned agent test passed");
    console.log(`Plan steps: ${result.plan.steps.length}`);
    console.log(`Executed steps: ${result.steps.length}`);
    console.log(`Total tool calls: ${result.totalToolCalls}`);
    console.log("");
    console.log("Plan:");
    for (const step of result.plan.steps) {
        console.log(`${step.id}: ${step.description}`);
    }
    console.log("");
    console.log("Final answer:");
    console.log(result.answer);
}
finally {
    await rm(repositoryRoot, {
        recursive: true,
        force: true,
    });
}
