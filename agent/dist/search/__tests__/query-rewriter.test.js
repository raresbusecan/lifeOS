import assert from "node:assert/strict";
import { rewriteQuery, } from "../queryRewriter.js";
const first = await rewriteQuery("How does authentication work?", []);
assert.equal(first, "How does authentication work?");
const second = await rewriteQuery("Where is the login implemented?", [
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
]);
assert.ok(second.length > 0);
console.log("Query rewriter test passed");
console.log(`Original: Where is the login implemented?`);
console.log(`Rewritten: ${second}`);
