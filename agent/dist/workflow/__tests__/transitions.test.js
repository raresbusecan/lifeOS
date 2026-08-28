import assert from "node:assert/strict";
import { canTransition, getAllowedTransitions, } from "../transitions.js";
assert.equal(canTransition("PROPOSED", "COUNCIL"), true);
assert.equal(canTransition("COUNCIL", "READY"), true);
assert.equal(canTransition("READY", "CODING"), true);
assert.equal(canTransition("CODING", "TESTING"), true);
assert.equal(canTransition("TESTING", "DONE"), true);
assert.equal(canTransition("TESTING", "REWORK"), true);
assert.equal(canTransition("REWORK", "CODING"), true);
assert.equal(canTransition("REWORK", "COUNCIL"), true);
assert.equal(canTransition("DONE", "CODING"), false);
assert.equal(canTransition("DONE", "TESTING"), false);
assert.equal(canTransition("CANCELLED", "COUNCIL"), false);
assert.equal(canTransition("PROPOSED", "CODING"), false);
assert.equal(canTransition("COUNCIL", "CODING"), false);
assert.equal(canTransition("TESTING", "CODING"), false);
assert.deepEqual(getAllowedTransitions("DONE"), []);
assert.deepEqual(getAllowedTransitions("CODING"), [
    "IMPLEMENTED",
    "TESTING",
    "BLOCKED",
]);
assert.deepEqual(getAllowedTransitions("TESTING"), [
    "TRIAGE",
    "DONE",
    "REWORK",
    "BLOCKED",
]);
console.log("Workflow transitions test passed");
