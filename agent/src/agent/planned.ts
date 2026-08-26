import {
  createPlan,
  type AgentPlan,
  type PlanStep,
} from "./planner.js";

import {
  runAgentLoop,
  type AgentLoopResult,
} from "./loop.js";

export interface PlannedStepResult {
  step: PlanStep;
  result: AgentLoopResult;
}

export interface PlannedAgentResult {
  plan: AgentPlan;
  steps: PlannedStepResult[];
  answer: string;
  totalToolCalls: number;
}

export interface PlannedAgentOptions {
  chatModel?: string;
  maxStepsPerPlanStep?: number;
}

export async function runPlannedAgent(
  repositoryRoot: string,
  goal: string,
  options: PlannedAgentOptions = {},
): Promise<PlannedAgentResult> {
  const plan =
    await createPlan(
      goal,
      {
        chatModel: options.chatModel,
      },
    );

  const results: PlannedStepResult[] = [];

  let totalToolCalls = 0;

  for (const step of plan.steps) {
    const previousFindings =
      results.length === 0
        ? "No previous findings. This is the first plan step."
        : results
            .map(
              ({ step: previousStep, result }) =>
                [
                  `Previous step: ${previousStep.id}`,
                  `Task: ${previousStep.description}`,
                  `Result:`,
                  result.answer,
                ].join("\n"),
            )
            .join("\n\n");

    const result =
      await runAgentLoop(
        repositoryRoot,
        [
          {
            role: "system",
            content: [
              "You are the LifeOS repository assistant.",
              "Execute the current plan step using the available repository tools.",
              "Use tools when repository information is needed.",
              "Complete the current step before giving your answer.",
              "Answer using only information obtained from the repository.",
              "",
              `Overall goal: ${plan.goal}`,
              "",
              `Current step: ${step.id}`,
              `Task: ${step.description}`,
              "",
              "Findings from previous plan steps:",
              previousFindings,
              "",
              "Do not repeat repository exploration that previous steps have already completed unless verification is necessary.",
            ].join("\n"),
          },
          {
            role: "user",
            content:
              [
                `Execute this plan step: ${step.description}`,
                "",
                "Use the findings from previous steps and only use repository tools when additional information is actually required.",
              ].join("\n"),
          },
        ],
        {
          chatModel:
            options.chatModel,
          maxSteps:
            options.maxStepsPerPlanStep ?? 8,
        },
      );

    results.push({
      step,
      result,
    });

    totalToolCalls +=
      result.toolCalls;
  }

  const answer =
    results
      .map(
        ({ step, result }) =>
          `${step.id}: ${result.answer}`,
      )
      .join("\n\n");

  return {
    plan,
    steps: results,
    answer,
    totalToolCalls,
  };
}