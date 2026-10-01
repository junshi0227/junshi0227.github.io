# 个人博客初版

这是按提供的执行说明搭建的Hexo静态博客，使用Redefine主题、Markdown文章、分类、标签、归档、站内搜索、代码高亮和按文章启用的数学公式。本站使用GitHub Pages从仓库自动构建。第一阶段不需要服务器或数据库。

首页采用Redefine主题自带的山湖横幅、居中标题和半透明导航；横幅配置在`_config.redefine.yml`。横幅下保留研究笔记式的项目摘要与文章列表，相关样式在`source/css/custom.css`，内容结构在`scripts/home-sections.js`。

> **内容状态**：先打开 [PROFILE_TODO.md](PROFILE_TODO.md)，查看仍需替换的个人简介、示例文章和项目。初版内容只用来验证页面与写作流程。

## 目录

| 路径 | 用途 |
| --- | --- |
| `_config.yml` | Hexo站点配置 |
| `_config.redefine.yml` | Redefine主题配置 |
| `scaffolds/post.md` | 新文章模板 |
| `scripts/home-sections.js` | 首页代表项目与文章分区 |
| `source/_posts/` | Markdown文章 |
| `source/about/` | 关于与联系方式 |
| `source/projects/` | 项目展示 |
| `source/categories/` | 分类页 |
| `source/tags/` | 标签页 |
| `source/css/custom.css` | 本站附加样式 |
| `source/images/` | 头像、favicon和可选图片素材 |
| `public/` | 构建结果，不提交 |

## 1. 安装与启动

安装Node.js 20及以上版本和Git。本项目用Node.js 24验证，自动部署也固定为24。

```bash
npm ci
npm run dev
```

在浏览器打开 `http://localhost:4000/`。修改配置或文章后，本地服务通常会自动更新；如果没有更新，重启服务。

构建正式静态文件：

```bash
npm run clean
npm run build
```

生成结果在 `public/`。命令以零退出码结束后，还应浏览首页、文章和项目页。

## 2. 写文章

使用`npm run new -- "文章标题"`创建文章，也可以直接在`source/_posts/`新增`.md`文件。文件名建议用英文短语，标题可写中文。每篇文章的Front Matter至少填写标题、日期、分类和标签：

```yaml
---
title: 示例标题
date: 2026-09-29 10:00:00
categories:
  - 科研
tags:
  - GNSS
  - PPP
description: 一句摘要
mathjax: true
---
```

推荐分类：科研、项目、学习笔记、随笔。`mathjax: true`只在需要公式的文章中启用；行内公式可写`$x$`，独立公式用`$$...$$`。代码块用Markdown围栏并指定语言。图片放入`source/images/`，在文章里写`![说明](/images/文件名.webp)`。尽量压缩图片并保留说明文字。

## 3. 修改页面

- 首页横幅标题、副标题和背景：`_config.redefine.yml`；代表项目：`scripts/home-sections.js`。
- 项目卡片、封面、技术栈与详情链接：`source/projects/index.md`。
- 关于与联系方式：`source/about/index.md`。
- 导航、头像、颜色、搜索：`_config.redefine.yml`。
- 站点标题、作者、网址、文章链接：`_config.yml`。

新增普通文章无需修改页面代码。若新增项目卡片，需要同步修改项目页和首页代表项目区。

## 4. GitHub Pages发布

1. 在GitHub创建名为`junshi0227.github.io`的**空白公开仓库**，不要预先添加README。GitHub免费账户的Pages站点需要公开仓库；目前的文章和项目均明确标为展示样例。不要提交`.env`、密钥、`node_modules/`或`public/`；`.gitignore`已排除这些路径。
2. 本工作目录已完成`git init`、首次提交和`origin`配置。确认`git remote -v`指向`https://github.com/junshi0227/junshi0227.github.io.git`，然后运行：

   ```bash
   git push -u origin main
   ```

   若从源码压缩包重新开始，应先初始化Git、设置提交姓名与邮箱、提交文件，再添加相同的远端地址。
3. 在仓库的**Settings → Pages → Build and deployment → Source**选择**GitHub Actions**。`.github/workflows/pages.yml`会在每次推送到`main`后执行`npm ci`和`npm run build`，并发布`public/`。
4. 在仓库的**Actions**标签页查看部署状态。成功后打开[https://junshi0227.github.io/](https://junshi0227.github.io/)；若稍有延迟，稍后刷新。
5. 后续更新文章：本地预览、构建检查、提交并推送`main`。如需自定义域名，先在仓库Settings → Pages中添加域名，再按GitHub提示配置DNS，最后把两个配置文件的`url`改成正式域名。

GitHub Pages不需要提交`public/`。自动部署参考[Hexo官方说明](https://hexo.io/docs/github-pages)和[GitHub Pages自定义工作流说明](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

## 5. 日常维护

```text
新建Markdown → 写文章与添加图片 → npm run dev本地预览
→ npm run build检查 → git add/commit/push → GitHub Pages自动上线
```

本项目已生成 `404.html` 和 `robots.txt`。RSS、sitemap、评论、访问统计可在内容稳定后再加；启用前应核对真实域名与隐私设置。
