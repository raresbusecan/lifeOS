import { OllamaChatClient, } from "../llm/ollama.js";
import { executeTool, listTools, } from "../tools/registry.js";
function normalizeToolArguments(argumentsValue) {
    if (typeof argumentsValue === "object" &&
        argumentsValue !== null) {
        return argumentsValue;
    }
    try {
        const parsed = JSON.parse(argumentsValue);
        if (typeof parsed === "object" &&
            parsed !== null) {
            return parsed;
        }
    }
    catch {
        // Invalid tool arguments.
    }
    return {};
}
function formatToolResult(toolName, output) {
    return [
        `Tool: ${toolName}`,
        "",
        output,
    ].join("\n");
}
function toOllamaTools() {
    return listTools().map((tool) => {
        if (tool.name === "read_file") {
            return {
                type: "function",
                function: {
                    name: tool.name,
                    description: tool.description,
                    parameters: {
                        type: "object",
                        properties: {
                            path: {
                                type: "string",
                                description: "Repository-relative path of the file to read.",
                            },
                        },
                        required: ["path"],
                    },
                },
            };
        }
        if (tool.name === "list_files") {
            return {
                type: "function",
                function: {
                    name: tool.name,
                    description: tool.description,
                    parameters: {
                        type: "object",
                        properties: {
                            path: {
                                type: "string",
                                description: "Repository-relative directory path to list. Defaults to the repository root.",
                            },
                        },
                    },
                },
            };
        }
        if (tool.name === "write_file") {
            return {
                type: "function",
                function: {
                    name: tool.name,
                    description: tool.description,
                    parameters: {
                        type: "object",
                        properties: {
                            path: {
                                type: "string",
                                description: "Repository-relative path of the file to create or overwrite.",
                            },
                            content: {
                                type: "string",
                                description: "Complete text content that should be written to the file.",
                            },
                        },
                        required: [
                            "path",
                            "content",
                        ],
                    },
                },
            };
        }
        return {
            type: "function",
            function: {
                name: tool.name,
                description: tool.description,
                parameters: {
                    type: "object",
                    properties: {},
                },
            },
        };
    });
}
function parseTextToolCalls(content) {
    const calls = [];
    const functionRegex = /<function=([a-zA-Z0-9_-]+)>([\s\S]*?)(?:<\/function>|<\/tool_call>|$)/g;
    for (const match of content.matchAll(functionRegex)) {
        const name = match[1];
        if (!name) {
            continue;
        }
        const body = match[2]?.trim() ?? "";
        const argumentsMatch = body.match(/<parameter=([a-zA-Z0-9_-]+)>([\s\S]*?)<\/parameter>/g);
        const argumentsObject = {};
        if (argumentsMatch) {
            for (const parameter of argumentsMatch) {
                const parameterMatch = parameter.match(/<parameter=([a-zA-Z0-9_-]+)>([\s\S]*?)<\/parameter>/);
                if (!parameterMatch) {
                    continue;
                }
                const parameterName = parameterMatch[1];
                const parameterValue = parameterMatch[2]?.trim() ?? "";
                if (parameterName) {
                    argumentsObject[parameterName] =
                        parameterValue;
                }
            }
        }
        calls.push({
            function: {
                name,
                arguments: argumentsObject,
            },
        });
    }
    return calls;
}
function extractToolCalls(content, nativeCalls) {
    if (nativeCalls.length > 0) {
        return nativeCalls;
    }
    return parseTextToolCalls(content);
}
function stripTextToolCalls(content) {
    return content
        .replace(/<function=[a-zA-Z0-9_-]+>[\s\S]*?(?:<\/function>|<\/tool_call>)/g, "")
        .replace(/<parameter=[a-zA-Z0-9_-]+>[\s\S]*?<\/parameter>/g, "")
        .replace(/<\/?tool_call>/g, "")
        .trim();
}
export async function runAgentLoop(repositoryRoot, messages, options = {}) {
    const client = new OllamaChatClient({
        model: options.chatModel,
    });
    const maxSteps = options.maxSteps ?? 8;
    const conversationMessages = [...messages];
    let toolCalls = 0;
    for (let step = 1; step <= maxSteps; step++) {
        const response = await client.chatWithTools(conversationMessages, toOllamaTools());
        const calls = extractToolCalls(response.content, response.toolCalls);
        console.log("");
        console.log(`Agent step ${step}`);
        console.log("Model content:", response.content);
        console.log("Tool calls:", calls.length);
        for (const call of calls) {
            console.log("  Tool:", call.function.name, "Arguments:", call.function.arguments);
        }
        if (calls.length === 0) {
            const answer = response.content.trim();
            if (!answer) {
                throw new Error("Agent returned an empty final response");
            }
            return {
                answer,
                steps: step,
                toolCalls,
            };
        }
        const assistantContent = response.content.trim();
        conversationMessages.push({
            role: "assistant",
            content: assistantContent,
            tool_calls: calls,
        });
        for (const call of calls) {
            toolCalls++;
            const name = call.function.name;
            const args = normalizeToolArguments(call.function.arguments);
            const toolCall = {
                name,
                arguments: args,
            };
            const result = await executeTool(repositoryRoot, toolCall);
            conversationMessages.push({
                role: "tool",
                tool_name: name,
                content: formatToolResult(name, result.output),
            });
        }
    }
    throw new Error(`Agent exceeded maximum tool steps (${maxSteps})`);
}
