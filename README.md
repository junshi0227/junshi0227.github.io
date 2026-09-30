# 个人博客初版

这是按提供的执行说明搭建的Hexo静态博客，使用Redefine主题、Markdown文章、分类、标签、归档、站内搜索、代码高亮和按文章启用的数学公式。源码可放在GitHub，由Cloudflare Pages从仓库自动构建。第一阶段不需要服务器或数据库。

视觉采用偏研究笔记的编排：清楚的标题层级、简洁的项目摘要和按时间排列的文章。布局参考了[cutedian.top](https://cutedian.top/)的内容组织、[Redefine演示](https://redefine.ohevan.com/)的主题能力，以及[Academic Pages](https://academicpages.github.io/)的研究型信息架构；页面样式在本站重新编写。主要样式在`source/css/custom.css`，首页结构在`scripts/home-sections.js`。

> **发布前**：先打开 [PROFILE_TODO.md](PROFILE_TODO.md)，替换姓名、站点地址、联系方式、示例文章和项目。初版内容只用来验证页面与写作流程。

## 目录

| 路径 | 用途 |
| --- | --- |
| `_config.yml` | Hexo站点配置 |
| `_config.redefine.yml` | Redefine主题配置 |
| `scaffolds/post.md` | 新文章模板 |
| `scripts/home-sections.js` | 首页简介与代表项目 |
| `source/_posts/` | Markdown文章 |
| `source/about/` | 关于与联系方式 |
| `source/projects/` | 项目展示 |
| `source/categories/` | 分类页 |
| `source/tags/` | 标签页 |
| `source/css/custom.css` | 本站附加样式 |
| `source/images/` | 头像、favicon和首页背景图 |
| `public/` | 构建结果，不提交 |

## 1. 安装与启动

安装Node.js 20及以上版本和Git。本项目用Node.js 24验证，Cloudflare Pages也建议固定为24。

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

- 首页简介和代表项目：`scripts/home-sections.js`。
- 项目卡片、封面、技术栈与详情链接：`source/projects/index.md`。
- 关于与联系方式：`source/about/index.md`。
- 导航、头像、颜色、搜索：`_config.redefine.yml`。
- 站点标题、作者、网址、文章链接：`_config.yml`。

新增普通文章无需修改页面代码。若新增项目卡片，需要同步修改项目页和首页代表项目区。

## 4. GitHub与Cloudflare Pages发布

1. 在GitHub创建一个**空仓库**，例如`personal-blog`。不要把`.env`、密钥、`node_modules/`或`public/`提交；`.gitignore`已排除这些路径。
2. 在本项目目录运行以下命令，把`YOUR_USERNAME`换成自己的GitHub用户名：

   ```bash
   git init
   git add .
   git commit -m "Build initial personal blog"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/personal-blog.git
   git push -u origin main
   ```

3. 在Cloudflare控制台创建**Workers & Pages → Pages → Connect to Git**项目，授权并选中这个仓库。构建设置填写：**Build command**为`npm run build`，**Build output directory**为`public`，根目录保持仓库根目录。环境变量设置`NODE_VERSION=24`。
4. 首次部署后会得到 `*.pages.dev` 地址。把这个真实地址写入 `_config.yml` 和 `_config.redefine.yml` 的 `url`，重新构建并推送。后续每次推送到 `main` 都会自动构建发布；其他分支可用于预览。
5. 购买域名后，在Pages项目的**Custom domains**添加域名，并按Cloudflare提示完成DNS配置。确认HTTPS可用，再把两个`url`改为正式域名并推送。根域名与`www`是否同时配置，按实际域名设置。

Cloudflare Pages官方的Hexo构建配置是`npm run build`和`public`。无需把构建后的文件推送到另一个仓库，也无需配置GitHub Actions。

## 5. 日常维护

```text
新建Markdown → 写文章与添加图片 → npm run dev本地预览
→ npm run build检查 → git add/commit/push → Pages自动上线
```

本项目已生成 `404.html` 和 `robots.txt`。RSS、sitemap、评论、访问统计可在内容稳定后再加；启用前应核对真实域名与隐私设置。
