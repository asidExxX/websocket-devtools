import assert from "node:assert/strict";
import test from "node:test";

import {
  filterConnections,
  filterMessages,
} from "../src/utils/filterUtils.js";

test("filters messages with a regular expression", () => {
  const messages = [
    { data: "hello websocket", direction: "incoming", timestamp: 1 },
    { data: "plain text", direction: "incoming", timestamp: 2 },
  ];

  const result = filterMessages(messages, { text: "/websocket/i" });

  assert.deepEqual(result, [messages[0]]);
});

test("filters messages matching any comma-separated term", () => {
  const messages = [
    { data: "heartbeat", direction: "incoming", timestamp: 1 },
    { data: "PING", direction: "outgoing", timestamp: 2 },
    { data: "important data", direction: "incoming", timestamp: 3 },
  ];

  assert.deepEqual(
    filterMessages(messages, { text: "heartbeat, PING, ," }),
    [messages[1], messages[0]],
  );
  assert.deepEqual(
    filterMessages(messages, { text: "heartbeat，PING", invert: true }),
    [messages[2]],
  );
  assert.deepEqual(
    filterMessages(messages, { text: "heartbeat、PING", direction: "incoming" }),
    [messages[0]],
  );
});

test("keeps a regex containing commas as one message filter", () => {
  const messages = [
    { data: "value, one", direction: "incoming", timestamp: 1 },
    { data: "value, two", direction: "incoming", timestamp: 2 },
    { data: "other", direction: "incoming", timestamp: 3 },
  ];

  assert.deepEqual(filterMessages(messages, { text: "/value, /g" }), [messages[1], messages[0]]);
  assert.deepEqual(filterMessages(messages, { text: "/value, /g", invert: true }), [messages[2]]);
});

test("evaluates a global regular expression independently for every connection", () => {
  const connections = [
    { id: "first", url: "wss://example.test/socket" },
    { id: "second", url: "wss://example.test/socket" },
  ];

  const result = filterConnections(connections, { text: "/example/g" });

  assert.deepEqual(result, connections);
});

test("evaluates a sticky regular expression independently for every connection", () => {
  const connections = [
    { id: "first", url: "wss://example.test/socket" },
    { id: "second", url: "wss://example.test/socket" },
  ];

  const result = filterConnections(connections, { text: "/wss/y" });

  assert.deepEqual(result, connections);
});
