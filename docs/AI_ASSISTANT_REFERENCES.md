# AI assistant design references

The AI assistant was reviewed against these open-source GitHub projects on September 15, 2026. This project did not copy their source code; it uses the general product and API design ideas described below.

## Projects reviewed

- [ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) (Apache-2.0) exposes small, structured Chrome DevTools tools. Its network API separates request listing from request details, and its design principles favor bounded semantic results, progressive complexity, and actionable errors.
- [BrowyHQ/browy](https://github.com/BrowyHQ/browy) (Apache-2.0) displays tool activity as it happens, supports stopping a run, and keeps a per-tab agent session in its browser and DevTools surfaces.
- [webbrain-one/webbrain](https://github.com/webbrain-one/webbrain) (GPL-3.0-or-later) documents read-only and developer modes, tool-step limits, context compaction, a stop control, and visible tool activity. It was used only for product comparison; no GPL source was copied.
- [maotoumao/Cebian](https://github.com/maotoumao/Cebian) (AGPL-3.0-only) demonstrates a browser sidebar with custom model providers and reusable prompt shortcuts. It was used only for product comparison; no AGPL source was copied.

## Changes adopted here

- Chrome DevTools network access now uses `list_network_requests` followed by `get_network_request`, so the model can inspect a concise list before requesting headers or bodies.
- Tool activity is visible in the assistant, including running, completed, reused, failed, and stopped states.
- The assistant has explicit Stop and Clear controls. Closing and reopening the docked sidebar keeps the current DevTools conversation.
- Common WebSocket investigations are available as prompt shortcuts.
- Tool errors include recovery hints, and credential-like network headers remain redacted.

The assistant remains read-only. It does not click, type, navigate, run arbitrary page JavaScript, or modify WebSocket traffic.
