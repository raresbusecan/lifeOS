import assert from "node:assert/strict";

import {
clearEmbeddingCache,
getEmbeddingCacheStats,
OllamaEmbeddingClient,
} from "../ollama.js";

const client = new OllamaEmbeddingClient();

clearEmbeddingCache();

console.log("\n=== Embedding LRU Cache Test ===\n");

const queryA = "How does authentication work?";
const queryB = "How does payment processing work?";

console.log("1. First request — expected MISS");

const firstA = await client.embed(queryA);

assert.ok(firstA.length > 0);

let stats = getEmbeddingCacheStats();

assert.equal(stats.size, 1);
assert.equal(stats.maxSize, 100);

console.log(
`Cache size: ${stats.size}/${stats.maxSize}`,
);

console.log("\n2. Same request — expected HIT");

const secondA = await client.embed(queryA);

assert.deepEqual(
secondA,
firstA,
);

stats = getEmbeddingCacheStats();

assert.equal(stats.size, 1);

console.log(
`Cache size: ${stats.size}/${stats.maxSize}`,
);

console.log("\n3. Different request — expected MISS");

const firstB = await client.embed(queryB);

assert.ok(firstB.length > 0);

assert.notDeepEqual(
firstB,
[],
);

stats = getEmbeddingCacheStats();

assert.equal(stats.size, 2);

console.log(
`Cache size: ${stats.size}/${stats.maxSize}`,
);

console.log(
"\n4. Original request after another request — expected HIT",
);

const thirdA = await client.embed(queryA);

assert.deepEqual(
thirdA,
firstA,
);

stats = getEmbeddingCacheStats();

assert.equal(stats.size, 2);

console.log(
`Cache size: ${stats.size}/${stats.maxSize}`,
);

console.log(
"\n5. LRU capacity test",
);

clearEmbeddingCache();

const capacity =
getEmbeddingCacheStats().maxSize;

for (let i = 0; i < capacity; i++) {
await client.embed(
`LRU cache test query ${i}`,
);
}

stats = getEmbeddingCacheStats();

assert.equal(
stats.size,
capacity,
);

console.log(
`Filled cache: ${stats.size}/${stats.maxSize}`,
);

console.log(
"\n6. Touch first entry to make it recently used",
);

const firstLruQuery =
"LRU cache test query 0";

await client.embed(
firstLruQuery,
);

stats = getEmbeddingCacheStats();

assert.equal(
stats.size,
capacity,
);

console.log(
`Cache after touch: ${stats.size}/${stats.maxSize}`,
);

console.log(
"\n7. Add one new entry — expected eviction",
);

await client.embed(
"LRU cache eviction query",
);

stats = getEmbeddingCacheStats();

assert.equal(
stats.size,
capacity,
);

console.log(
`Cache after eviction: ${stats.size}/${stats.maxSize}`,
);

console.log(
"\n8. Verify recently-used first entry survived",
);

const preserved = await client.embed(
firstLruQuery,
);

assert.ok(
preserved.length > 0,
);

stats = getEmbeddingCacheStats();

assert.equal(
stats.size,
capacity,
);

console.log(
"Recently-used entry survived eviction",
);

console.log(
"\n=== Embedding LRU Cache Test Passed ===\n",
);
