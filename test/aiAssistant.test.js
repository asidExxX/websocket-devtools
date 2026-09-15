import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {
  buildAnalysisContext,
  buildChatMessages,
  createAiMessageView,
  executeAiReadTool,
  getNetworkRequest,
  getChatCompletionsUrl,
  inspectNetworkRequests,
  inspectPageResources,
  listNetworkRequests,
  parseMaxToolCalls,
  parseTextToolCalls,
  readPageChunk,
  requestAiAnalysis,
  runAiAnalysis,
} from "../src/utils/aiAssistant.js";

test("AI endpoint accepts an API base URL or full chat completions endpoint", () => {
  assert.equal(getChatCompletionsUrl("https://example.com/v1/"), "https://example.com/v1/chat/completions");
  assert.equal(getChatCompletionsUrl("http://localhost:11434/v1/chat/completions"), "http://localhost:11434/v1/chat/completions");
  for (const invalid of ["javascript:alert(1)", "https://user:secret@example.com/v1", "https://example.com/v1?token=x"]) {
    assert.throws(() => getChatCompletionsUrl(invalid), /invalidBaseUrl/);
  }
});

test("AI read limit accepts a custom nonnegative integer", () => {
  assert.equal(parseMaxToolCalls("2"), 2);
  assert.equal(parseMaxToolCalls(0), 0);
  for (const invalid of ["", -1, 1.5, "infinite", "9999999999999999999999"]) {
    assert.throws(() => parseMaxToolCalls(invalid), /invalidToolLimit/);
  }
});

test("AI receives currently visible panel messages automatically, while filtered messages stay available on demand", async () => {
  const messages = Array.from({ length: 20 }, (_, index) => ({
    type: "message",
    messageId: `m${index}`,
    timestamp: index + 1,
    direction: index % 2 ? "incoming" : "outgoing",
    data: `payload-${index}-${"x".repeat(2000)}`,
  }));
  const messageView = createAiMessageView({ id: "socket-1", messages }, { direction: "all", text: "payload-1", invert: false }, "desc");
  const context = buildAnalysisContext({
    connection: { url: "wss://example.com/socket", messages },
    selectedMessage: messages[19],
    messageView,
  });
  assert.match(context, /Selected message/);
  assert.match(context, /payload-19/);
  assert.match(context, /11 visible entries, 9 filtered-out messages/);
  assert.doesNotMatch(context, /payload-0/);
  assert.ok(context.length < 16000);

  const filtered = await executeAiReadTool("read_messages", { scope: "filtered", search: "payload-0", limit: 2 }, messageView);
  assert.equal(filtered.matched, 1);
  assert.match(filtered.entries[0].entry.data, /payload-0/);
  const visible = await executeAiReadTool("read_messages", { scope: "visible", offset: 1, limit: 1 }, messageView);
  assert.equal(visible.entries[0].index, 1);
  assert.match(visible.entries[0].entry.data, /payload-18/);
});

test("AI tool-call loop can request filtered messages and then answer", async () => {
  const oldFetch = globalThis.fetch;
  const requests = [];
  const toolCall = { id: "call_1", type: "function", function: { name: "read_messages", arguments: '{"scope":"filtered","limit":1}' } };
  globalThis.fetch = async (_url, options) => {
    requests.push(JSON.parse(options.body));
    const message = requests.length === 1
      ? { role: "assistant", content: null, tool_calls: [toolCall] }
      : { role: "assistant", content: "A filtered error message explains the disconnect." };
    return { ok: true, text: async () => JSON.stringify({ choices: [{ message }] }) };
  };
  try {
    const view = { visibleMessages: [], filteredMessages: [{ type: "message", data: "hidden error", timestamp: 1, direction: "incoming" }] };
    const log = [];
    const answer = await runAiAnalysis(
      { baseUrl: "https://example.com/v1", apiKey: "key", modelId: "model" },
      buildChatMessages([], "What disconnected?", "No visible messages"),
      view,
      { onToolCall: item => log.push(item) },
    );
    assert.match(answer, /filtered error/);
    assert.equal(requests.length, 2);
    assert.equal(requests[0].tools[0].function.name, "read_messages");
    assert.equal(requests[1].messages.at(-1).role, "tool");
    assert.match(requests[1].messages.at(-1).content, /hidden error/);
    assert.equal(log[0].name, "read_messages");
  } finally {
    globalThis.fetch = oldFetch;
  }
});

test("AI executes DSML tool calls returned as plain text and accepts Markdown resource URLs", async () => {
  const oldFetch = globalThis.fetch;
  const oldChrome = globalThis.chrome;
  const resourceUrl = "https://pmos.hn.sgcc.cn/1ywuKELSO2ahQuWZ/js/app.7bd690cc.js";
  const markup = `<｜｜DSML｜｜ calls>
<｜｜DSML｜｜ invoke name="inspect\\_page\\_resources">
<｜｜DSML｜｜ parameter name="maxChars" string="false">4000\\</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name="search" string="true">newLogin\\</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name="url" string="true">[${resourceUrl}](${resourceUrl})\\</｜｜DSML｜｜ parameter>
\\</｜｜DSML｜｜ invoke>
<｜｜DSML｜｜ invoke name="inspect\\_page\\_resources">
<｜｜DSML｜｜ parameter name="maxChars" string="false">4000\\</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name="search" string="true">verify-img\\</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name="url" string="true">[${resourceUrl}](${resourceUrl})\\</｜｜DSML｜｜ parameter>
\\</｜｜DSML｜｜ invoke>
\\</｜｜DSML｜｜ calls>`;
  const parsed = parseTextToolCalls(markup);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].name, "inspect_page_resources");
  assert.equal(parsed[0].args.maxChars, 4000);
  assert.equal(parsed[0].args.url, resourceUrl);
  assert.equal(parsed[1].args.search, "verify-img");
  assert.equal(parseTextToolCalls('<｜DSML｜tool_calls><｜DSML｜invoke name="read_messages"><｜DSML｜parameter name="scope" string="true">filtered</｜DSML｜parameter></｜DSML｜invoke></｜DSML｜tool_calls>')[0].args.scope, "filtered");
  assert.throws(() => parseTextToolCalls('<｜DSML｜tool_calls><｜DSML｜invoke name="read_messages">'), /invalidToolMarkup/);

  const requests = [];
  globalThis.fetch = async (_url, options) => {
    requests.push(JSON.parse(options.body));
    return { ok: true, text: async () => JSON.stringify({ choices: [{ message: { role: "assistant", content: requests.length === 1 ? markup : "Found both login references." } }] }) };
  };
  globalThis.chrome = { devtools: { inspectedWindow: { getResources(callback) {
    callback([{ url: resourceUrl, getContent(done) { done("newLogin(); verify-img;", ""); } }]);
  } } } };
  try {
    const log = [];
    const answer = await runAiAnalysis(
      { baseUrl: "https://example.com/v1", modelId: "model" },
      buildChatMessages([], "Find login code", "visible messages"),
      { visibleMessages: [], filteredMessages: [] },
      { onToolCall: item => log.push(item) },
    );
    assert.equal(answer, "Found both login references.");
    assert.equal(requests.length, 2);
    assert.equal(log.filter(item => item.status === "complete").length, 2);
    assert.equal(log.filter(item => item.status === "running").length, 2);
    assert.equal(requests[1].messages.at(-1).role, "user");
    assert.match(requests[1].messages.at(-1).content, /newLogin/);
    assert.match(requests[1].messages.at(-1).content, /verify-img/);
    assert.doesNotMatch(requests[1].messages.at(-1).content, /resourceUnavailable/);
  } finally {
    globalThis.fetch = oldFetch;
    globalThis.chrome = oldChrome;
  }
});

test("AI uses a larger read budget and asks the model for a final answer when it is exhausted", async () => {
  const oldFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    requests.push(body);
    const message = body.tools
      ? { role: "assistant", content: null, tool_calls: [{ id: `call_${requests.length}`, type: "function", function: { name: "read_messages", arguments: JSON.stringify({ scope: "visible", offset: requests.length - 1, limit: 1 }) } }] }
      : { role: "assistant", content: "Enough evidence to answer." };
    return { ok: true, text: async () => JSON.stringify({ choices: [{ message }] }) };
  };
  try {
    const answer = await runAiAnalysis(
      { baseUrl: "https://example.com/v1", modelId: "model" },
      buildChatMessages([], "Analyze", "visible traffic"),
      { visibleMessages: Array.from({ length: 30 }, (_, index) => ({ type: "message", data: `message-${index}`, timestamp: index + 1 })), filteredMessages: [] },
    );
    assert.equal(answer, "Enough evidence to answer.");
    assert.equal(requests.length, 25);
    assert.equal(requests.at(-1).tools, undefined);
    assert.match(requests.at(-1).messages.at(-1).content, /answer directly/);
  } finally {
    globalThis.fetch = oldFetch;
  }
});

test("AI applies a saved per-question read limit", async () => {
  const oldFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    requests.push(body);
    const message = body.tools
      ? { role: "assistant", content: null, tool_calls: [{ id: `call_${requests.length}`, type: "function", function: { name: "read_messages", arguments: JSON.stringify({ scope: "visible", offset: requests.length - 1, limit: 1 }) } }] }
      : { role: "assistant", content: "Answer from the two reads." };
    return { ok: true, text: async () => JSON.stringify({ choices: [{ message }] }) };
  };
  try {
    const answer = await runAiAnalysis(
      { baseUrl: "https://example.com/v1", modelId: "model", maxToolCalls: 2 },
      buildChatMessages([], "Analyze", "visible traffic"),
      { visibleMessages: [{ type: "message", data: "first", timestamp: 1 }, { type: "message", data: "second", timestamp: 2 }], filteredMessages: [] },
    );
    assert.equal(answer, "Answer from the two reads.");
    assert.equal(requests.length, 3);
    assert.equal(requests.at(-1).tools, undefined);
  } finally {
    globalThis.fetch = oldFetch;
  }
});

test("zero removes the read-count limit while preserving normal answers", async () => {
  const oldFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async (_url, options) => {
    requests += 1;
    const body = JSON.parse(options.body);
    const message = requests <= 25
      ? { role: "assistant", content: null, tool_calls: [{ id: `call_${requests}`, type: "function", function: { name: "read_messages", arguments: JSON.stringify({ scope: "visible", offset: requests - 1, limit: 1 }) } }] }
      : { role: "assistant", content: "Finished after 25 reads." };
    assert.ok(body.tools);
    return { ok: true, text: async () => JSON.stringify({ choices: [{ message }] }) };
  };
  try {
    const answer = await runAiAnalysis(
      { baseUrl: "https://example.com/v1", modelId: "model", maxToolCalls: 0 },
      buildChatMessages([], "Analyze", "visible traffic"),
      { visibleMessages: Array.from({ length: 25 }, (_, index) => ({ type: "message", data: `message-${index}`, timestamp: index + 1 })), filteredMessages: [] },
    );
    assert.equal(answer, "Finished after 25 reads.");
    assert.equal(requests, 26);
  } finally {
    globalThis.fetch = oldFetch;
  }
});

test("AI reuses duplicate reads and still returns a final answer", async () => {
  const oldFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    requests.push(body);
    const message = body.tools
      ? { role: "assistant", content: null, tool_calls: [{ id: `call_${requests.length}`, type: "function", function: { name: "read_messages", arguments: '{"scope":"visible","limit":1}' } }] }
      : { role: "assistant", content: "The repeated payload is a heartbeat." };
    return { ok: true, text: async () => JSON.stringify({ choices: [{ message }] }) };
  };
  try {
    const log = [];
    const answer = await runAiAnalysis(
      { baseUrl: "https://example.com/v1", modelId: "model" },
      buildChatMessages([], "Analyze", "visible traffic"),
      { visibleMessages: [{ type: "message", data: "ping", timestamp: 1 }], filteredMessages: [] },
      { onToolCall: item => log.push(item) },
    );
    assert.match(answer, /heartbeat/);
    assert.equal(requests.length, 4);
    assert.deepEqual(log.filter(item => item.status !== "running").map(item => item.cached), [false, true, true]);
    assert.equal(requests.at(-1).tools, undefined);
  } finally {
    globalThis.fetch = oldFetch;
  }
});

test("AI stops a model that keeps emitting DSML reads after the final-answer request", async () => {
  const oldFetch = globalThis.fetch;
  let requests = 0;
  const markup = '<｜DSML｜calls><｜DSML｜invoke name="read_messages"><｜DSML｜parameter name="scope" string="true">visible</｜DSML｜parameter></｜DSML｜invoke></｜DSML｜calls>';
  globalThis.fetch = async () => {
    requests += 1;
    return { ok: true, text: async () => JSON.stringify({ choices: [{ message: { role: "assistant", content: markup } }] }) };
  };
  try {
    await assert.rejects(
      runAiAnalysis(
        { baseUrl: "https://example.com/v1", modelId: "model" },
        buildChatMessages([], "Analyze", "visible traffic"),
        { visibleMessages: [{ type: "message", data: "ping", timestamp: 1 }], filteredMessages: [] },
      ),
      /modelDidNotAnswer/,
    );
    assert.equal(requests, 5);
  } finally {
    globalThis.fetch = oldFetch;
  }
});

test("AI can read bounded live page HTML and loaded script source on demand", async () => {
  const oldChrome = globalThis.chrome;
  const html = '<html><body><script>new WebSocket("wss://example.com/socket")</script></body></html>';
  const script = 'const socket = new WebSocket("wss://example.com/socket");';
  globalThis.chrome = { devtools: { inspectedWindow: {
    eval(expression, callback) {
      callback(vm.runInNewContext(expression, {
        document: { title: "Example", documentElement: { outerHTML: html }, body: { innerText: "Example page" } },
        location: { origin: "https://example.com", pathname: "/" },
      }), null);
    },
    getResources(callback) {
      callback([{ url: "https://example.com/app.js", getContent(done) { done(script, ""); } }]);
    },
  } } };
  try {
    const page = await readPageChunk({ mode: "html", search: "WebSocket", maxChars: 24 });
    assert.equal(page.mode, "html");
    assert.match(page.content, /^WebSocket/);
    assert.equal(page.content.length, 24);
    const text = await readPageChunk({ mode: "text" });
    assert.equal(text.content, "Example page");
    const list = await inspectPageResources({});
    assert.deepEqual(list.urls, ["https://example.com/app.js"]);
    const resource = await inspectPageResources({ url: "[https://example.com/app.js](https://example.com/app.js)", search: "WebSocket", maxChars: 20 });
    assert.match(resource.content, /^WebSocket/);
    assert.equal(resource.content.length, 20);
    await assert.rejects(inspectPageResources({ url: "https://other.example/secret.js" }), /resourceUnavailable/);
  } finally {
    globalThis.chrome = oldChrome;
  }
});

test("AI can discover and read messages from another captured WebSocket connection", async () => {
  const view = {
    connections: [
      { id: "socket-1", url: "wss://example.com/live", status: "open" },
      { id: "socket-2", url: "wss://example.com/login", status: "close" },
    ],
    events: [
      { id: "socket-1", type: "message", data: "ping", timestamp: 1 },
      { id: "socket-2", type: "open", timestamp: 2 },
      { id: "socket-2", type: "message", data: "login failed", timestamp: 3, direction: "incoming" },
      { id: "socket-2", type: "message", data: "retry", timestamp: 4, direction: "outgoing" },
    ],
  };
  const listed = await executeAiReadTool("list_websocket_connections", { search: "login" }, view);
  assert.equal(listed.matched, 1);
  assert.equal(listed.connections[0].id, "socket-2");
  assert.equal(listed.connections[0].messageCount, 2);
  const messages = await executeAiReadTool("read_connection_messages", { connectionId: "socket-2", search: "failed" }, view);
  assert.equal(messages.matched, 1);
  assert.equal(messages.entries[0].entry.data, "login failed");
  const lifecycle = await executeAiReadTool("read_connection_messages", { connectionId: "socket-2", includeEvents: true, limit: 3 }, view);
  assert.equal(lifecycle.total, 3);
  assert.equal(lifecycle.entries[0].entry.type, "open");
  await assert.rejects(executeAiReadTool("read_connection_messages", { connectionId: "unknown" }, view), /connectionUnavailable/);
});

test("AI can inspect bounded DevTools network records and redacts credential headers", async () => {
  const oldChrome = globalThis.chrome;
  globalThis.chrome = { devtools: { network: { getHAR(callback) {
    callback({ entries: [{
      request: { url: "https://example.com/api/login", method: "POST", headers: [
        { name: "Authorization", value: "Bearer secret" },
        { name: "X-Trace", value: "abc" },
      ] },
      _resourceType: "xhr",
      response: { status: 401, statusText: "Unauthorized", content: { mimeType: "application/json" }, headers: [{ name: "Set-Cookie", value: "sid=secret" }] },
      startedDateTime: "2026-09-14T00:00:00Z",
      time: 12,
      getContent(done) { done('{"error":"unauthorized"}', ""); },
    }] });
  } } } };
  try {
    const list = await listNetworkRequests({ search: "login", status: 401, resourceType: "xhr" });
    assert.equal(list.entries[0].requestId, 0);
    assert.equal(list.entries[0].resourceType, "xhr");
    const detail = await getNetworkRequest({ requestId: 0, includeResponseBody: true });
    assert.equal(detail.statusText, "Unauthorized");
    assert.match(detail.responseBody.content, /unauthorized/);
    const result = await inspectNetworkRequests({ url: "https://example.com/api/login", includeHeaders: true, includeBody: true });
    assert.equal(result.entries[0].status, 401);
    assert.equal(result.headers.request[0].value, "[redacted]");
    assert.equal(result.headers.response[0].value, "[redacted]");
    assert.equal(result.headers.request[1].value, "abc");
    assert.match(result.responseBody.content, /unauthorized/);
    assert.doesNotMatch(JSON.stringify(result), /Bearer secret|sid=secret/);
    await assert.rejects(getNetworkRequest({ requestId: 9 }), /networkRequestUnavailable/);
  } finally {
    globalThis.chrome = oldChrome;
  }
});

test("AI request sends chat messages and key only to the configured endpoint", async () => {
  const oldFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return { ok: true, text: async () => JSON.stringify({ choices: [{ message: { content: "Likely a heartbeat." } }] }) };
  };
  try {
    const messages = buildChatMessages([], "What is this?", "incoming ping");
    const answer = await requestAiAnalysis({ baseUrl: "https://example.com/v1", apiKey: "test-key", modelId: "model-1" }, messages);
    assert.equal(answer, "Likely a heartbeat.");
    assert.equal(request.url, "https://example.com/v1/chat/completions");
    assert.equal(request.options.headers.Authorization, "Bearer test-key");
    assert.equal(JSON.parse(request.options.body).model, "model-1");
    assert.match(JSON.parse(request.options.body).messages.at(-1).content, /incoming ping/);
    assert.doesNotMatch(request.options.body, /test-key/);
  } finally {
    globalThis.fetch = oldFetch;
  }
});

test("AI request errors do not expose the configured API Key", async () => {
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 401,
    text: async () => JSON.stringify({ error: { message: "Rejected key test-secret" } }),
  });
  try {
    await assert.rejects(
      requestAiAnalysis({ baseUrl: "https://example.com/v1", apiKey: "test-secret", modelId: "model-1" }, []),
      error => error.message === "HTTP 401: Rejected key [redacted]",
    );
  } finally {
    globalThis.fetch = oldFetch;
  }
});
