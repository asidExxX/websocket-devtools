import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

test("loads the saved rate limit before injection and forwards later changes", async () => {
  const postedMessages = [];
  const scripts = [];
  let onStorageChanged;
  const pageWindow = {
    addEventListener() {},
    postMessage(message) { postedMessages.push(message); },
  };
  pageWindow.top = pageWindow;
  const document = {
    createElement() { return { dataset: {}, remove() {} }; },
    head: { appendChild(script) { scripts.push(script); } },
  };
  const chrome = {
    runtime: {
      getURL(path) { return `chrome-extension://test/${path}`; },
      onMessage: { addListener() {} },
      sendMessage() { return Promise.resolve({}); },
    },
    storage: {
      local: {
        get(keys, callback) {
          assert.ok(keys.includes("websocket-proxy-traffic-rate-limit"));
          callback({ "websocket-proxy-traffic-rate-limit": 2500 });
        },
      },
      onChanged: { addListener(listener) { onStorageChanged = listener; } },
    },
  };

  const source = await readFile(new URL("../src/content/content.js", import.meta.url), "utf8");
  vm.runInContext(source, vm.createContext({ chrome, document, window: pageWindow }));
  await Promise.resolve();

  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].dataset.trafficRateLimit, "2500");

  onStorageChanged({ "websocket-proxy-traffic-rate-limit": { newValue: 0 } }, "local");
  scripts[0].onload.call(scripts[0]);
  assert.equal(postedMessages.at(-1).rateLimit, 0);
  assert.equal(postedMessages.at(-1).type, "set-traffic-rate-limit");
});
