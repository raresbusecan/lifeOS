import assert from "node:assert/strict";
import { rewriteQuery } from "../queryRewriter.js";
const conversation = [
    {
        role: "user",
        content: "How does authentication work?",
        createdAt: new Date().toISOString(),
    },
    {
        role: "assistant",
        content: "Authentication is implemented in src/auth.ts.",
        createdAt: new Date().toISOString(),
    },
];
const contextualQuery = "Where is the login implemented?";
const rewritten = await rewriteQuery(contextualQuery, conversation);
assert.ok(rewritten.trim().length > 0);
assert.notEqual(rewritten, contextualQuery);
assert.match(rewritten.toLowerCase(), /login/);
assert.match(rewritten.toLowerCase(), /src\/auth\.ts|authentication/);
const independentQuery = "How does payment processing work?";
const independentResult = await rewriteQuery(independentQuery, conversation);
assert.equal(independentResult, independentQuery);
console.log("Query context test passed");
console.log(`Original contextual query: ${contextualQuery}`);
console.log(`Rewritten query: ${rewritten}`);
console.log(`Independent query: ${independentResult}`);
