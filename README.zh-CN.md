# MD2Slide

> 将 Markdown 实时预览并导出为精美的网页幻灯片。专为喜欢用代码代替 PowerPoint 的开发者打造。

一款 VS Code 扩展，可将 Markdown 文件转换为 [Reveal.js](https://revealjs.com/) 演示文稿，支持热重载预览和独立的 HTML 导出。

## 功能特性

- **实时预览** — 编辑内容时幻灯片即时更新（300ms 防抖）
- **YAML Frontmatter** — 为每个演示文稿设置 Logo、标题和位置
- **Logo 与标题叠加层** — 每张幻灯片上固定的页眉，可包含 Logo 图片和/或标题文字
- **快速启动** — 编辑器标题栏按钮 + 快捷键 `Ctrl+Shift+M`
- **幻灯片大纲** — 侧边栏列出所有幻灯片，点击即可跳转
- **概览模式** — 所有幻灯片的缩略图网格视图（`Ctrl+Shift+O`）
- **导出 HTML** — 生成包含内嵌资源的独立 HTML 文件

## 快速开始

1. 在 VS Code 中打开任意 `.md` 文件
2. 按 `Ctrl+Shift+M` 或点击编辑器标题栏的 📺 按钮
3. 编辑 Markdown — 预览即时更新
4. 导出：`Ctrl+Shift+P` → `MD2Slide: Export to Standalone HTML`

## 幻灯片分割

使用单独一行的 `---` 将内容分割为多张幻灯片：

```markdown
# 幻灯片 1
内容在这里

---

# 幻灯片 2
更多内容
```

## YAML Frontmatter

在 `.md` 文件顶部的 frontmatter 中为所有幻灯片添加 Logo 和标题叠加层：

```yaml
---
logo: ./assets/logo.png   # 本地路径或 URL
logoPosition: top-right    # "top-left" / "top-right" / "bottom-left" / "bottom-right"
title: 我的演示文稿
---
```

| 字段 | 描述 | 默认值 |
|------|------|--------|
| `logo` | 图片 URL 或本地路径 | （无） |
| `logoPosition` | 叠加层位置 | `top-right` |
| `title` | 演示文稿标题文字 | （无） |

**本地路径**相对于 `.md` 文件解析。导出时，图片会以 base64 格式嵌入——输出的 HTML 文件完全独立，无需外部依赖。

**VS Code 设置**（`md2slide.logo`、`md2slide.logoPosition`、`md2slide.presentationTitle`）提供全局默认值。Frontmatter 中的值会覆盖它们。

## 命令

| 命令 | 快捷键 |
|------|--------|
| `MD2Slide: Open Presentation Preview` | `Ctrl+Shift+M` |
| `MD2Slide: Export to Standalone HTML` | — |
| `MD2Slide: Toggle Slide Overview` | `Ctrl+Shift+O` |
| `MD2Slide: Refresh Outline` | — |

## 配置

| 设置项 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `md2slide.theme` | `string` | `black` | Reveal.js 主题：`black`、`white`、`league`、`beige`、`night`、`serif`、`simple` |
| `md2slide.logo` | `string` | `""` | 默认 Logo 路径或 URL |
| `md2slide.logoPosition` | `string` | `top-right` | Logo 叠加层位置：`top-left`、`top-right`、`bottom-left`、`bottom-right` |
| `md2slide.presentationTitle` | `string` | `""` | 默认演示文稿标题 |
| `md2slide.backgroundColor` | `string` | `""` | 所有幻灯片的默认背景颜色（CSS 颜色值） |
| `md2slide.backgroundImage` | `string` | `""` | 所有幻灯片的默认背景图片 URL 或本地路径 |
| `md2slide.backgroundSize` | `string` | `cover` | 背景尺寸（cover、contain、auto 等） |
| `md2slide.backgroundPosition` | `string` | `center` | 背景位置（CSS background-position 值） |
| `md2slide.backgroundRepeat` | `string` | `no-repeat` | 背景重复方式（no-repeat、repeat、repeat-x、repeat-y） |
| `md2slide.backgroundOpacity` | `number` | `1.0` | 背景不透明度（0.0 到 1.0） |

## 开发

```bash
pnpm install        # 安装依赖
pnpm run compile    # 类型检查 + 打包
pnpm run watch      # 监视模式
```

在 VS Code 中按 **F5** 启动扩展开发宿主窗口。

## 技术栈

- [Reveal.js](https://revealjs.com/) — 演示文稿框架
- [markdown-it](https://github.com/markdown-it/markdown-it) — Markdown 解析器
- [js-yaml](https://github.com/nodeca/js-yaml) — YAML frontmatter 解析器
- TypeScript + esbuild

## 许可证

[MIT](LICENSE)
