---
logo: https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg
logoPosition: top-right
title: MD2Slide 演示
---

# 🎉 欢迎使用 MD2Slide

用 Markdown 写演示文稿，实时预览 + 一键导出 HTML

---

## 新增功能：Logo & 标题浮层

在 `.md` 文件顶部添加 YAML Frontmatter 即可在**每一页 slide 右上角**显示 Logo 和标题：

```yaml
---
logo: ./assets/logo.png    # 本地路径或 URL
logoPosition: top-right     # 左上角: top-left / 右上角: top-right
title: 你的演示标题
---
```

当前页面右上角就有一个 GitHub Logo + 标题！

---

## Logo 来源

| 来源 | 写法 | 说明 |
|------|------|------|
| 远程 URL | `logo: https://example.com/logo.png` | 直接使用，需联网 |
| 本地文件 | `logo: ./assets/logo.png` | 相对路径，导出时自动转 base64 内嵌 |
| VS Code 设置 | 在 settings.json 中配 `md2slide.logo` | 全局默认值 |

---

## 配置优先级

```
Frontmatter（.md 文件头部） > VS Code 全局设置
```

---

## 只显示标题（无 Logo）

```yaml
---
title: 纯文字标题
---
```

---

## 只显示 Logo（无标题）

```yaml
---
logo: https://example.com/logo.png
logoPosition: top-left
---
```

---

## 快速开始

1. 打开任意 `.md` 文件
2. 点击编辑器上方的 **▶ Preview Slides** CodeLens
3. 或点击工具栏的 📺 图标
4. 按 `Ctrl+Shift+O` 切换缩略图模式
5. 导出 HTML：`Ctrl+Shift+P` → `MD2Slide: Export to Standalone HTML`

---

# 🙏 谢谢
