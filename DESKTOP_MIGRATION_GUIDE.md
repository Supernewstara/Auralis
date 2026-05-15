# Auralis - Web App 转桌面端架构设计与部署指南

这份技术文档是专为 AI Agent（以及开发者）准备的，它详细阐述了 Auralis 项目的架构信息，以及如何将目前的全栈 Web 应用（Vite + React + Express）包装成独立的桌面端应用程序（首选通过 Electron）。

## 1. 项目简介与架构概览

Auralis 是一个基于上下文感知和大型语言模型 (LLM) 提供个性化音乐推荐和深度专注氛围体验的智能播放器。

### 技术栈
*   **前端**: React 18, Vite, Tailwind CSS, TypeScript
*   **后端**: Express, Node.js (`server.ts` 作为主入口)
*   **核心模块**:
    *   **NeteaseCloudMusicApi**: 网易云音乐 API 集成，处理扫码登录、歌单获取、歌曲 URL 代理播放。
    > **⚠️ 注意: (针对 Windows 桌面端打包 Agent 的重要提示)** 
    > 在某些 Windows + npm 较高版本上，安装 `NeteaseCloudMusicApi@4.31.0` 会因为解压时出现 `ENOTDIR: not a directory, scandir ...\module` 的死锁错误（这可能是文件与文件夹命名冲突导致）。
    
    *   **Agent Brain / LLM**: (假设位于 `server/agent_brain/`) 基于 DEEPSEEK 等进行听觉情绪分析与播放列表决策。
    *   **音频系统**: 前端 `WaveformScrubber.tsx` 使用 `AudioContext` 对音频进行实时波形解析，借助 `<audio>` 标签流式播放。

## 2. 核心挑战：自带后端 (Backend-included) 架构

常见的单页应用(SPA)可以直接通过加载 `index.html` 转化为桌面应用。但 Auralis **高度依赖本地启动的 Express 服务器** 来：
1. 规避前端跨域问题 (CORS) 请求 Netease API 以及代理音频。
2. 隐藏并安全地调用 Gemini API 的 API Key。
3. 运行本地 LLM 逻辑 (`Agent Brain`)。

因此，将其转型为桌面应用的最佳方式是 **使用 Electron 并采用“前后端共生”模型**，即 Electron 在启动时，在后台子进程拉起这个 Express 服务器。

## 3. 桌面端转化建议方案：Electron

推荐使用 `Electron` + `electron-builder` 进行打包。

### 核心改造步骤：

#### 第一步：安装 Electron 依赖
运行：
`npm install --save-dev electron electron-builder wait-on concurrently cross-env`

#### 第二步：创建 Electron 主进程入口 (`main.js`)
在项目根目录创建 `main.js` （这是桌面端的启动引导脚本）。Agent 在编写此文件时，需要包含以下逻辑：
1. 分配一个空闲的本地端口（例如 3000 或动态端口）。
2. 在 Electron 初始化时，通过 `child_process.fork` 后台启动打包好的 `dist/server.cjs`（生产环境），或者使用 `npm run dev` 启动（开发环境）。
3. 监听 Express 服务器启动成功后，创建一个 `BrowserWindow` 窗口并加载 `http://localhost:<你的端口>`。

#### 第三步：修改 `package.json`
为项目增加 `main`, 并在 `scripts` 中添加桌面端的启动指令：
```json
{
  "main": "main.js",
  "scripts": {
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:3000 && electron .\"",
    "electron:build": "npm run build && electron-builder"
  },
  "build": {
    "appId": "com.auralis.app",
    "productName": "Auralis AI",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**/*",
      "main.js",
      "package.json"
    ],
    "mac": {
      "category": "public.app-category.music"
    }
  }
}
```

## 4. 给 Agent 修改代码的特别提示

*   **AudioContext 与自动播放策略**:
    Chrome/Electron 会对未进行用户交互的音频实施拦截。UI 中的播放按钮逻辑已经处理了大部分交互限制，但在编写 Electron 窗口属性时建议放宽：
    `webPreferences: { webSecurity: true, allowRunningInsecureContent: false }`
*   **音频代理接口 (`/api/proxy-audio`)**:
    不要更改这个代理机制，因为它能绕过网易云防盗链限制以及解决跨域播放和波形图解析问题。
*   **环境变量加载**:
    桌面应用打包后，根目录结构会发生变化。必须确保 Express 后端能正确利用 `dotenv` 读取打包内或所在目录下的 `.env` 文件获取 `DEEPSEEK_API_KEY`。

## 5. 项目快速启动与运行指南 (Web 模式)

如果在改造前需要重新熟悉或者验证 Web 项目，请使用以下命令：

1. **环境准备**:
   确保存在 `.env` 文件且包含相关 LLM 秘钥（如 `DEEPSEEK_API_KEY=xxx`）。
2. **安装依赖**:
   ```bash
   npm install
   ```
3. **启动开发服务器** (前端加后台集成):
   ```bash
   npm run dev
   ```
   *服务将运行在 `0.0.0.0:3000` (如果已做配置)，同时提供 Vite 前端渲染和 API 服务。*
4. **构建生产版本**:
   ```bash
   npm run build
   ```
   此步骤会通过 Vite 编译前端并在 `dist/` 生成静态文件，且使用 `esbuild` 编译服务端文件至 `dist/server.cjs`。
   通过 `npm start` 即可运行整合后的服务端。

## 6. 总结

要在不破坏现有 “Agent Brain + 代理网易云” 后端逻辑的前提下快速制作桌面版，唯一稳定且快速的方案是采用 **Electron + Express Bundle** 模式。
Agent 当下应当阅读该文档，随后在根目录初始化 `main.js` 配置，并更新包管理的构建脚本。
