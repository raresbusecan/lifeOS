import assert from "node:assert/strict";
import { createServer } from "node:http";

import { OllamaChatClient } from "../ollama.js";

const server = createServer((_request, _response) => {
  // Intentionally never respond, to force the client's timeout to fire.
});

await new Promise<void>((resolve) => {
  server.listen(0, "127.0.0.1", resolve);
});

const address = server.address();

if (
  typeof address !== "object" ||
  address === null
) {
  throw new Error(
    "Failed to determine test server address.",
  );
}

const baseUrl = `http://127.0.0.1:${address.port}`;

try {
  const client = new OllamaChatClient({
    baseUrl,
    timeoutMs: 50,
  });

  await assert.rejects(
    () =>
      client.chat([
        {
          role: "user",
          content: "test",
        },
      ]),
    /timed out after 50ms/,
  );

  console.log(
    "Ollama timeout handling test passed",
  );
} finally {
  server.close();
}