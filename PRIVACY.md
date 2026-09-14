# Privacy Policy for WebSocket DevTools (this fork)

**Last updated: September 14, 2026**

This policy describes the public fork at [asidExxX/websocket-devtools](https://github.com/asidExxX/websocket-devtools). The Chrome Web Store and Edge Add-ons listings linked in the README are upstream builds with their own release and policy.

## Data handled in your browser

The extension captures WebSocket connection information and messages for debugging. It also keeps settings, favorites, and AI configuration in browser-local extension storage. This fork does not add analytics or send captured traffic to its maintainer.

## Optional AI assistant

The AI assistant sends a request only when you ask it a question. You choose its Base URL, API Key, and model. The initial request includes your question, the currently visible WebSocket messages, and any selected message. During that analysis, the model may ask the extension to send additional captured connections or filtered messages, current page text or HTML, loaded source resources, and Chrome DevTools network records. These tool results are sent to your configured AI endpoint without a separate confirmation for each read.

The API Key is saved in browser-local extension storage and sent to the configured endpoint as an authorization header. The extension masks common credential headers when reading DevTools network records, but message bodies, page content, URLs, and other fields may still contain sensitive information. Your chosen AI provider controls its own retention and processing of requests. Using an HTTP endpoint does not encrypt requests in transit.

WebSocket monitoring itself does not require the AI service. You can avoid sending debugging data to an AI endpoint by not using the assistant. Removing the extension clears its browser-local storage; you can also clear extension storage through browser developer tools.

## Permissions

`activeTab` and host permissions let the extension inspect WebSocket activity on supported pages. `storage` saves extension preferences, favorites, and AI settings. DevTools APIs let the assistant read the inspected page, loaded resources, and recorded network requests when you ask an AI question.

## Source and questions

The implementation is available in [this repository](https://github.com/asidExxX/websocket-devtools). For questions about this fork, use [GitHub Issues](https://github.com/asidExxX/websocket-devtools/issues). The original project is [law-chain-hot/websocket-devtools](https://github.com/law-chain-hot/websocket-devtools), which retains its MIT license and attribution in this fork.
