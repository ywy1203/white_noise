# iOS 打包指南 (Capacitor)

## 前提条件

1. **Mac 电脑**（Windows 无法编译 iOS）
2. **Xcode 16+**（从 Mac App Store 安装）
3. **Apple 开发者账号**（$99/年）或 免费个人账号（侧载 7 天有效期）
4. **Node.js 18+**

## 步骤

### 1. 在 Mac 上克隆/拷贝项目

将整个项目文件夹拷贝到 Mac 上。

### 2. 安装依赖

```bash
cd study-companion
npm install
```

### 3. 添加 iOS 平台

```bash
npx cap add ios
```

> 这会在项目根目录创建 `ios/` 文件夹，里面是完整的 Xcode 项目。

### 4. 同步网页到 iOS 项目

每次修改 `web/` 下的文件后，运行：

```bash
npx cap sync
```

### 5. 在 Xcode 中打开

```bash
npx cap open ios
```

### 6. 配置签名

在 Xcode 中：
1. 左侧文件树选择 **App** target
2. **Signing & Capabilities** 标签
3. 勾选 "Automatically manage signing"
4. 选择你的 **Team**（Apple ID）
5. Bundle Identifier: `com.studycompanion.app`

### 7. 真机运行

- 用 USB 连接 iPhone
- 在 Xcode 顶部选择你的 iPhone 作为 target
- 点击 ▶ 运行按钮

### 8. 打包 IPA（发布用）

1. Xcode → Product → Archive
2. 在弹出的 Organizer 窗口中点击 "Distribute App"
3. 选择 "App Store Connect" 或 "Development"（侧载用）

## 常见问题

### 视频无法加载

iOS WKWebView 需要服务器返回正确的 CORS 头。如果视频存储在 COS（腾讯云），确保 COS 桶配置了跨域规则。

### 音频无法播放

iOS 要求 `muted` 属性开头的视频才能自动播放（已设置）。音频需要在用户交互后通过 `AudioContext.resume()` 激活（代码已处理）。

### 白屏

检查 `capacitor.config.json` 中 `server.hostname` 是否匹配你的域名。本地开发用 `localhost`，正式上线换成你的域名。
