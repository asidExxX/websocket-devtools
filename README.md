<div align="center">
<img src="./ScreenShot/ScreenShot-long-quick-radius.png" alt="Main Interface" width="88%" style="border-radius: 8px;">
</div>

<div align="center">

<!-- <img src="./ScreenShot/Promo_Tile-1.png" alt="WebSocket DevTools" width="30%"> -->


# WebSocket DevTools

<a href="https://trendshift.io/repositories/20987?utm_source=trendshift-badge&amp;utm_medium=badge&amp;utm_campaign=badge-trendshift-20987" target="_blank" rel="noopener noreferrer"><img src="https://trendshift.io/api/badge/trendshift/repositories/20987/daily?language=JavaScript" alt="law-chain-hot%2Fwebsocket-devtools | Trendshift" width="250" height="55"/></a>

Complete WebSocket Traffic Control with advanced proxy, simulation, and blocking capabilities




[![][version-shield]][version-link]
[![][license-shield]][license-link]
[![][privacy-shield]][privacy-link]
[![][homepage-shield]][homepage-link]
[![][chrome-shield]][chrome-link]
[![][edge-shield]][edge-link]
[![][deepwiki-shield]][deepwiki-link]
[![][youtube-shield]][youtube-link]
[![][stars-shield]][stars-link]


**English** | [简体中文](./README_zh-CN.md)

</div>



> This is a public fork of [law-chain-hot/websocket-devtools](https://github.com/law-chain-hot/websocket-devtools). The Chrome Web Store and Edge links below install the upstream version, without this fork's changes. To use this version, build and load it from source.

## 🚀 Installation

### Chrome Web Store
1. Visit [Chrome Web Store](https://chromewebstore.google.com/detail/websocket-devtools/fmnaobbfmjaaaebelkacpmmmpaaefbod)
2. Click **"Add to Chrome"** and confirm installation
3. Open DevTools (F12) → **"WebSocket DevTools"** tab

### Microsoft Edge
1. Visit [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/websocket-devtools/idkoddoekbiekjkpfjeadehmknaoppol)
2. Click **"Get"** and confirm installation
3. Open DevTools (F12) → **"WebSocket DevTools"** tab

### Install this fork from source
1. Clone this repository or download its **Source code** archive.
2. Build the extension:

```bash
pnpm install --frozen-lockfile
pnpm i18n
pnpm exec vite build
```

3. Open `chrome://extensions` or `edge://extensions`, enable **Developer mode**, choose **Load unpacked**, and select the `dist/` folder containing `manifest.json`.

Manual installations do not update automatically. Rebuild and reload the extension after pulling changes. The repository root is source code and cannot be loaded directly.

### Homepage

- 🌐 [WebSocket DevTools](https://websocket-devtools.com) - Official website with documentation and demos 
- 📺 [YouTube Video](https://www.youtube.com/watch?v=L64x__1xORQ) - Demo video

## Star History

[![Star History Chart](https://star-history.dera.page/svg?repos=law-chain-hot/websocket-devtools&type=Date)](https://star-history.dera.page/#law-chain-hot/websocket-devtools&Date)

## ✨ Key Features

- **🔄 Background Monitoring** - Continuously monitor connections even when DevTools panel is closed
- **🎮 Message Simulation** - Send custom messages in both directions (Client ↔ Server)  
- **🚧 Traffic Control** - Block messages and simulate network issues for testing
- **💾 Favorites System** - Save and organize frequently used messages
- **🎨 DevTools Integration** - Native Chrome DevTools panel experience
- **🖼️ Iframe Support** - Full WebSocket proxy support for iframe embedded connections
- **✨ AI Assistant** - Analyze WebSocket traffic and Chrome DevTools page/network data in a docked sidebar with your own OpenAI-compatible endpoint

The assistant shows each tool read, supports stopping and clearing runs, retains the current DevTools conversation when closed, and uses separate Network list/detail tools. See the [AI assistant design references](./docs/AI_ASSISTANT_REFERENCES.md).



## 🎬 Quick Demo

### Blocking

<img src="./ScreenShot/Gif/2-block-x.gif" alt="Message Monitoring" width="65%" style="border-radius: 8px;">


### Simulation
<img src="./ScreenShot/Gif/5-Best_Practice.gif" alt="Message Monitoring" width="65%" style="border-radius: 8px;">

**Key Features Demonstrated:**
- **Message Blocking**: Intercept and block WebSocket messages in real-time
- **Message Simulation**: Send custom messages to test different scenarios
- **Traffic Control**: Manage WebSocket traffic flow for debugging
- **JSON Support**: Full JSON parsing and formatting capabilities




## 📷 Screenshots

<div align="center">


### Message Details & JSON Viewer
<img src="./ScreenShot/ScreenShot-2.png" alt="Message Monitoring" width="65%" style="border-radius: 8px;">

### Message Simulation & Traffic Control
<img src="./ScreenShot/ScreenShot-3.png" alt="Simulation" width="65%" style="border-radius: 8px;">

### Smart Favorites System
<img src="./ScreenShot/ScreenShot-4.png" alt="Additional Features" width="65%" style="border-radius: 8px;">

</div>



## 📖 Quick Start

1. **Install Extension** - Add to Chrome and enable background monitoring
2. **Open DevTools** (F12) → Find **"WebSocket DevTools"** tab
3. **View Captured Data** - All WebSocket connections are automatically captured in background
4. **Inspect Messages** - Click connections to view message history  
5. **Simulate Messages** - Use Simulate tab with JSON editor
6. **Save Favorites** - Star frequently used messages for quick access
7. **Analyze with AI** - Open the docked **AI Assistant** and set Base URL, API Key, Model ID, and the maximum reads per question (0 removes the count limit). Keep using the message panel while it is open. Visible messages are included automatically; the AI can read other captured WebSocket connections, filtered messages, page source, and DevTools network requests as needed

> **💡 Pro Tip**: The extension monitors WebSocket connections in the background, so you won't miss any connections even if you open DevTools after the WebSocket is established!

## 🔒 Privacy & Security

- ✅ **AI is user initiated** - Asking a question sends visible message context; the AI may request other captured connections, filtered messages, page source, or DevTools network records during that analysis
- ✅ **Local settings** - API settings remain in extension storage; AI requests go to your configured endpoint
- ✅ **Open source** - Fully transparent and auditable code
- ✅ **Minimal permissions** - Only what's needed for functionality

## 🤝 Contributing & Support

- Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request
- Use [GitHub Issues](https://github.com/asidExxX/websocket-devtools/issues) for bugs and feature requests about this fork
- Follow [SECURITY.md](./SECURITY.md) to report a vulnerability privately

---

<img src="./ScreenShot/ScreenShot-long.png" alt="Main Interface" width="100%" style="border-radius: 8px;">

---

<div align="center">

**MIT License** • [⭐ GitHub](https://github.com/asidExxX/websocket-devtools) • [📖 Upstream Wiki](https://github.com/law-chain-hot/websocket-devtools/wiki) • [📚 Upstream DeepWiki](https://deepwiki.com/law-chain-hot/websocket-devtools) • [🛒 Upstream Chrome Store](https://chromewebstore.google.com/detail/websocket-devtools/fmnaobbfmjaaaebelkacpmmmpaaefbod) • [📺 Upstream YouTube](https://www.youtube.com/watch?v=L64x__1xORQ)

</div> 

[version-shield]: https://img.shields.io/badge/version-1.3.0-55b467?labelColor=black&logo=github&style=flat-square
[license-shield]: https://img.shields.io/badge/license-MIT-369eff?labelColor=black&logo=opensourceinitiative&style=flat-square
[chrome-shield]: https://img.shields.io/badge/Chrome%20Web%20Store-Install-ffcb47?labelColor=black&logo=googlechrome&logoColor=white&style=flat-square
[privacy-shield]: https://img.shields.io/badge/privacy-opt--in%20AI-c4f042?labelColor=black&logo=shield-check&style=flat-square
[homepage-shield]: https://img.shields.io/badge/Homepage-WebSocket%20DevTools-blue?labelColor=black&logo=globe&style=flat-square
[websocket-shield]: https://img.shields.io/badge/WebSocket-DevTools-ff80eb?labelColor=black&logo=websocket&style=flat-square
[devtools-shield]: https://img.shields.io/badge/DevTools-Panel-8ae8ff?labelColor=black&logo=googlechrome&style=flat-square
[deepwiki-shield]: https://img.shields.io/badge/DeepWiki-Docs-orange?labelColor=black&logo=book&style=flat-square
[stars-shield]: https://img.shields.io/github/stars/asidExxX/websocket-devtools?color=ffcb47&labelColor=black&style=flat-square
[version-link]: https://github.com/asidExxX/websocket-devtools
[license-link]: ./LICENSE
[chrome-link]: https://chromewebstore.google.com/detail/websocket-devtools/fmnaobbfmjaaaebelkacpmmmpaaefbod
[privacy-link]: ./PRIVACY.md
[homepage-link]: https://websocket-devtools.com
[websocket-link]: https://github.com/asidExxX/websocket-devtools
[devtools-link]: https://chromewebstore.google.com/detail/websocket-devtools/fmnaobbfmjaaaebelkacpmmmpaaefbod
[deepwiki-link]: https://deepwiki.com/law-chain-hot/websocket-devtools
[stars-link]: https://github.com/asidExxX/websocket-devtools/stargazers
[youtube-shield]: https://img.shields.io/badge/YouTube-Video-red?labelColor=black&logo=youtube&style=flat-square
[youtube-link]: https://www.youtube.com/watch?v=L64x__1xORQ
[edge-shield]: https://img.shields.io/badge/Microsoft%20Edge-Install-0078d4?labelColor=black&style=flat-square
[edge-link]: https://microsoftedge.microsoft.com/addons/detail/websocket-devtools/idkoddoekbiekjkpfjeadehmknaoppol
