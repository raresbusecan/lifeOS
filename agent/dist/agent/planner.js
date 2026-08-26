import { OllamaChatClient, } from "../llm/ollama.js";
function parsePlan(content) {
    const cleaned = content
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
    const parsed = JSON.parse(cleaned);
    if (typeof parsed !== "object" ||
        parsed === null) {
        throw new Error("Planner returned an invalid plan.");
    }
    const value = parsed;
    if (typeof value.goal !== "string" ||
        !value.goal.trim()) {
        throw new Error("Planner returned an invalid goal.");
    }
    if (!Array.isArray(value.steps) ||
        value.steps.length === 0) {
        throw new Error("Planner returned no steps.");
    }
    const steps = value.steps.map((step, index) => {
        if (typeof step !== "object" ||
            step === null) {
            throw new Error(`Planner returned an invalid step at index ${index}.`);
        }
        const item = step;
        if (typeof item.description !==
            "string" ||
            !item.description.trim()) {
            throw new Error(`Planner returned an invalid step at index ${index}.`);
        }
        return {
            id: typeof item.id === "string" &&
                item.id.trim()
                ? item.id
                : `step-${index + 1}`,
            description: item.description.trim(),
        };
    });
    return {
        goal: value.goal.trim(),
        steps,
    };
}
export async function createPlan(goal, options = {}) {
    const normalizedGoal = goal.trim();
    if (!normalizedGoal) {
        throw new Error("Cannot create a plan for an empty goal");
    }
    const client = new OllamaChatClient({
        model: options.chatModel,
    });
    const messages = [
        {
            role: "system",
            content: [
                "You are the LifeOS planning engine.",
                "Create a concise execution plan for the user's goal.",
                "Return ONLY valid JSON.",
                "",
                "Required JSON shape:",
                "{",
                '  "goal": "string",',
                '  "steps": [',
                '    { "id": "step-1", "description": "string" }',
                "  ]",
                "}",
                "",
                "Each step must be concrete and executable.",
                "Do not include markdown.",
                "Do not include explanations outside the JSON.",
            ].join("\n"),
        },
        {
            role: "user",
            content: normalizedGoal,
        },
    ];
    const response = await client.chat(messages);
    return parsePlan(response);
}
