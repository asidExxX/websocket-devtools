<div align="center">
<img src="./ScreenShot/ScreenShot-long-quick-radius.png" alt="主界面" width="88%" style="border-radius: 8px;">
</div>

<div align="center">

<!-- <img src="./ScreenShot/Promo_Tile-1.png" alt="WebSocket DevTools" width="30%"> -->

## WebSocket DevTools

专业的WebSocket调试工具，提供实时监控、消息模拟和流量拦截功能


[![][version-shield]][version-link]
[![][license-shield]][license-link]
[![][privacy-shield]][privacy-link]
[![][homepage-shield]][homepage-link]
[![][chrome-shield]][chrome-link]
[![][edge-shield]][edge-link]
[![][stars-shield]][stars-link]
[![][deepwiki-shield]][deepwiki-link]
[![][youtube-shield]][youtube-link]


[English](./README.md) | **简体中文**

</div>



> 这是 [law-chain-hot/websocket-devtools](https://github.com/law-chain-hot/websocket-devtools) 的公开 Fork。下方 Chrome 和 Edge 商店链接安装的是上游版本，不包含此 Fork 的改动。使用此版本请从源码构建并加载。

## 🚀 安装

### Chrome 网上应用店
1. 访问 [Chrome 网上应用店](https://chromewebstore.google.com/detail/websocket-devtools/fmnaobbfmjaaaebelkacpmmmpaaefbod)
2. 点击 **"添加至 Chrome"** 并确认安装
3. 打开开发者工具 (F12) → **"WebSocket DevTools"** 标签页

### Microsoft Edge
1. 访问 [Microsoft Edge 加载项](https://microsoftedge.microsoft.com/addons/detail/websocket-devtools/idkoddoekbiekjkpfjeadehmknaoppol)
2. 点击 **"获取"** 并确认安装
3. 打开开发者工具 (F12) → **"WebSocket DevTools"** 标签页

### 从此 Fork 的源码安装
1. 克隆此仓库，或下载 GitHub 的**源代码**压缩包。
2. 构建扩展：

```bash
pnpm install --frozen-lockfile
pnpm i18n
pnpm exec vite build
```

3. 打开 `chrome://extensions` 或 `edge://extensions`，开启**开发者模式**，选择**加载已解压的扩展程序**，然后选中含有 `manifest.json` 的 `dist/` 文件夹。

手动安装不会自动更新；拉取新代码后需要重新构建并加载。项目根目录只有源码，不能直接加载。

### 官网

- 🌐 [WebSocket DevTools](https://websocket-devtools.com) - 官方网站
- 📺 [YouTube视频](https://www.youtube.com/watch?v=L64x__1xORQ) - 演示视频

## ✨ 核心功能

- **🔍 实时监控** - 实时跟踪WebSocket连接和消息更新
- **🔄 后台监控** - 即使关闭DevTools面板也能持续监控连接
- **🎮 消息模拟** - 双向发送自定义消息 (客户端 ↔ 服务器)
- **🚧 流量控制** - 拦截消息并模拟网络问题进行测试
- **💾 收藏系统** - 保存和组织常用消息
- **🌍 多语言支持** - 完整的英文和中文支持
- **🎨 DevTools集成** - 原生Chrome DevTools面板体验
- **🖼️ Iframe支持** - 完整的iframe嵌入式连接WebSocket代理支持
- **✨ AI 助手** - 在停靠侧栏中，用自定义的 OpenAI 兼容接口分析 WebSocket 流量及 DevTools 页面和网络数据

助手会展示每次工具读取，支持停止和清空；关闭后再次打开仍保留当前 DevTools 会话，并使用分离的网络列表/详情工具。参考项目及采用的设计见 [AI 助手设计参考](./docs/AI_ASSISTANT_REFERENCES.md)。

## 🎬 快速演示

### 消息拦截

<img src="./ScreenShot/Gif/2-block-x.gif" alt="消息监控" width="65%" style="border-radius: 8px;">

### 消息模拟
<img src="./ScreenShot/Gif/5-Best_Practice.gif" alt="消息监控" width="65%" style="border-radius: 8px;">

**演示的核心功能:**
- **消息拦截**: 实时拦截和阻止WebSocket消息
- **消息模拟**: 发送自定义消息测试不同场景
- **流量控制**: 管理WebSocket流量进行调试
- **JSON支持**: 完整的JSON解析和格式化功能

## 📷 截图

<div align="center">


### 消息详情和JSON查看器
<img src="./ScreenShot/ScreenShot-2.png" alt="消息监控" width="65%" style="border-radius: 8px;">

### 消息模拟和流量控制
<img src="./ScreenShot/ScreenShot-3.png" alt="模拟功能" width="65%" style="border-radius: 8px;">

### 收藏系统
<img src="./ScreenShot/ScreenShot-4.png" alt="附加功能" width="65%" style="border-radius: 8px;">

</div>



## 📖 快速开始

1. **安装扩展** - 添加到Chrome并启用后台监控
2. **打开开发者工具** (F12) → 找到 **"WebSocket DevTools"** 标签页
3. **查看捕获数据** - 所有WebSocket连接都会在后台自动捕获
4. **检查消息** - 点击连接查看消息历史
5. **模拟消息** - 使用模拟标签页和JSON编辑器
6. **保存收藏** - 为常用消息添加星标以便快速访问
7. **AI 分析** - 打开停靠式 **AI 助手**，设置 Base URL、API Key、Model ID 和单轮最多读取次数（填 0 不限制次数）；侧栏打开时仍可操作消息面板。可见消息自动提供，AI 可按需读取其他 WebSocket 连接、被过滤的消息、页面代码和 DevTools 网络请求

> **💡 专业提示**: 扩展在后台监控WebSocket连接，所以即使你在WebSocket建立后才打开DevTools，也不会错过任何连接！

## 🔒 隐私和安全

- ✅ **主动发起 AI 请求** - 提问时发送可见消息上下文，AI 在本轮分析中可按需读取其他连接、被过滤的消息、页面代码或 DevTools 网络记录
- ✅ **配置本地保存** - API 配置保存在扩展存储中；AI 请求发送到你指定的服务
- ✅ **开源代码** - 完全透明且可审计的代码
- ✅ **最小权限** - 仅请求功能所需的权限

## 🤝 贡献与支持

- 提交 Pull Request 前请先阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)
- 此 Fork 的 Bug 和功能建议请通过 [GitHub Issues](https://github.com/asidExxX/websocket-devtools/issues) 提交
- 安全漏洞请按照 [SECURITY.md](./SECURITY.md) 私下报告

## 🛠 系统要求

- **Chrome 88+** 或基于Chromium的浏览器 (Edge, Brave等)
- **WebSocket API** - 兼容所有WebSocket实现
- 支持 **Socket.IO**、**ws库** 和自定义WebSocket解决方案

---

<img src="./ScreenShot/ScreenShot-long.png" alt="主界面" width="100%" style="border-radius: 8px;">

---

<div align="center">

**MIT许可证** • [⭐ GitHub](https://github.com/asidExxX/websocket-devtools) • [📖 上游 Wiki](https://github.com/law-chain-hot/websocket-devtools/wiki) • [📚 上游 DeepWiki](https://deepwiki.com/law-chain-hot/websocket-devtools) • [🛒 上游 Chrome 商店](https://chromewebstore.google.com/detail/websocket-devtools/fmnaobbfmjaaaebelkacpmmmpaaefbod) • [📺 上游 YouTube](https://www.youtube.com/watch?v=L64x__1xORQ)

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
