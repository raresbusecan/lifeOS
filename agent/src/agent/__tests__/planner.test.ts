import assert from "node:assert/strict";

import {
  createPlan,
} from "../planner.js";

const plan =
  await createPlan(
    "Analyze the authentication implementation in the repository",
  );

assert.ok(plan.goal);

assert.ok(
  plan.steps.length > 0,
);

for (const step of plan.steps) {
  assert.ok(step.id);
  assert.ok(step.description);
}

console.log(
  "LLM planner test passed",
);

console.log(
  `Goal: ${plan.goal}`,
);

console.log(
  `Steps: ${plan.steps.length}`,
);

for (const step of plan.steps) {
  console.log(
    `${step.id}: ${step.description}`,
  );
}
