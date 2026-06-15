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

## 新特性：每页独立角标标题

在任意 slide 内插入 HTML 注释，即可为该页定义**独立标题**，覆盖全局标题：

```markdown
<!-- slide-title: 自定义标题 | bottom-left -->
```

---

<!-- slide-title: 📍 左下角标题 | bottom-left -->

## 左下角示例

这页的标题显示在**左下角**

语法：`<!-- slide-title: 📍 左下角标题 | bottom-left -->`

---

<!-- slide-title: 📍 右下角标题 | bottom-right -->

## 右下角示例

这页的标题显示在**右下角**

语法：`<!-- slide-title: 📍 右下角标题 | bottom-right -->`

---

<!-- slide-title: 📍 左上角标题 | top-left -->

## 左上角示例

这页的标题显示在**左上角**

语法：`<!-- slide-title: 📍 左上角标题 | top-left -->`

---

<!-- slide-title: 继承全局位置 -->

## 省略位置参数

这页的标题没有指定位置，会**继承全局设置**（当前为 `top-right`）

语法：`<!-- slide-title: 继承全局位置 -->`

---

## 无独立标题

这页没有 `<!-- slide-title: -->` 注释

会显示全局标题：「**MD2Slide 演示**」在右上角

---

## 新特性：Slide 背景色

在任意 slide 内插入 HTML 注释，即可为该页设置**背景颜色**：

```markdown
<!-- slide-bg: color=#ff6b6b -->
```

---

<!-- slide-bg: color=#2d3436 -->

## 深色背景示例

这页有深灰色背景，文字自动适配（Reveal.js 会调整文字颜色）

语法：`<!-- slide-bg: color=#2d3436 -->`

---

<!-- slide-bg: color=#a29bfe -->

## 紫色背景示例

柔和的紫色背景

语法：`<!-- slide-bg: color=#a29bfe -->`

---

<!-- slide-bg: color=linear-gradient(135deg, #667eea 0%, #764ba2 100%) -->

## 渐变背景示例

CSS 渐变也支持！

语法：`<!-- slide-bg: color=linear-gradient(135deg, #667eea 0%, #764ba2 100%) -->`

---

## 背景图 + 透明效果

<!-- slide-bg: image=https://images.unsplash.com/photo-1557683316-973673baf926?w=800 | size=cover | opacity=0.3 -->

这页有背景图并设置了透明度

语法：`<!-- slide-bg: image=URL | size=cover | opacity=0.3 -->`

---

## 纯色背景 + 左上角标题

<!-- slide-bg: color=#00b894 -->
<!-- slide-title: Green Theme | top-left -->

这页同时使用了**背景色**和**角标标题**两个特性！

---

# 🙏 谢谢
