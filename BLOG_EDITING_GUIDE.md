# 博客文章编辑与上线指南

适用于本仓库`junshi0227/junshi0227.github.io`。这是一个Hexo博客：编辑`source/`里的源文件，推送到`main`后，GitHub Actions自动生成并部署网站。线上地址是[https://junshi0227.github.io/](https://junshi0227.github.io/)。

## 先找对要修改的文件

| 要改什么 | 文件位置 |
| --- | --- |
| 已有文章的标题、日期、分类、正文 | `source/_posts/对应文件名.md` |
| 新增文章 | 在`source/_posts/`新建`.md`文件 |
| 关于页、微信和B站联系卡片 | `source/about/index.md` |
| 项目列表的文字与链接 | `source/projects/index.md` |
| 首页代表项目卡片 | `scripts/home-sections.js` |
| 首页标题、背景、导航、头像路径、社交图标 | `_config.redefine.yml` |
| 站点名称、网址、文章链接格式 | `_config.yml` |
| 图片素材 | `source/images/` |
| 圆角、颜色、卡片排版等附加样式 | `source/css/custom.css` |
| 新文章默认结构 | `scaffolds/post.md` |
| 自动部署流程 | `.github/workflows/pages.yml` |

不要编辑`public/`：它是构建时自动生成的，且不会提交到仓库。`node_modules/`也是自动安装的依赖目录。

## 方法一：直接在GitHub网页改文字

适合改错字、日期或短段落，不需要在本机安装工具。

1. 打开[博客仓库](https://github.com/junshi0227/junshi0227.github.io)，确认右上角已登录自己的GitHub账号。
2. 进入`source/_posts/`，打开要改的`.md`文件；点击文件右上角的铅笔图标。
3. 修改内容后，点击`Commit changes…`，填写简短说明，例如“修正交通灯文章中的日期”，提交到`main`。
4. 打开仓库的`Actions`页，等待`Deploy blog to GitHub Pages`显示绿色成功标记。
5. 打开线上文章并刷新检查。短暂延迟时可用`Ctrl+F5`强制刷新。

要新建文件：在仓库的`source/_posts/`目录选择`Add file`→`Create new file`，输入英文短文件名加`.md`，粘贴下文模板后提交。图片可用`Add file`→`Upload files`上传到`source/images/`。网页编辑提交后会直接触发部署，建议先认真检查内容。

## 方法二：本地写作、预览、再推送

本机仓库位置：

```text
C:\Users\钧师\Documents\Codex\2026-09-29\an\outputs\personal-blog
```

在PowerShell中进入目录：

```powershell
cd 'C:\Users\钧师\Documents\Codex\2026-09-29\an\outputs\personal-blog'
```

请安装完整的Git for Windows与Node.js 20或以上版本。当前项目使用Node.js 24构建；首次在新电脑使用时运行`npm ci`。随后可用VS Code或其他纯文本编辑器修改Markdown。

```powershell
npm ci                 # 仅在首次安装或依赖变动后执行
npm run dev            # 本地预览：打开 http://localhost:4000/
```

写完后按`Ctrl+C`停止预览，再检查并发布：

```powershell
npm run build
git status
git add source/_posts/文章文件名.md
git commit -m "更新文章内容"
git push origin main
```

若还修改图片、项目页或配置，把相应文件也加入`git add`；不确定改了哪些文件时先看`git status`。可以用`git add -A`添加所有改动，但提交前务必再看一次`git status`，确认没有误加入私人文件。不要把密码、令牌、未公开稿件或`.gh-auth/`提交到公开仓库。

本机已存在一个供自动化使用的便携Git；普通PowerShell的`git push`可能因其HTTPS组件不完整而失败。自己操作时建议安装完整Git for Windows，或用GitHub Desktop打开此仓库并点击`Commit`、`Push origin`。GitHub网页编辑也不依赖本机Git。不要把GitHub账号密码写进命令或文档；按GitHub弹出的授权流程登录。

## 新文章模板

文件名使用稳定的英文短语，例如`gnss-temperature-experiment.md`；真正显示给读者的标题写在`title`中。将下方内容保存到`source/_posts/文件名.md`：

````markdown
---
title: 一篇具体的文章标题
date: 2026-10-05 20:00:00
categories:
  - 科研
tags:
  - GNSS
  - 实验记录
description: 用一句话说明文章解决什么问题。
mathjax: false
---

开头用两三句话交代背景和本文内容。

<!-- more -->

## 问题与目标

## 方法与实现

## 结果与验证

## 遇到的问题

## 总结与下一步
````

文章开头的两条`---`之间是Front Matter，采用YAML格式；缩进要保留，冒号后留一个空格。`date`控制发表日期，`updated`可以在需要时手动填写更新时间。不要为了让文章排在首页前面而把日期改成不真实的时间。当前站点按`date`从新到旧排列，每页6篇。`<!-- more -->`之前是首页文章摘要。需要公式时把`mathjax`改为`true`；不需要时保持`false`。

常用分类建议固定为`科研`、`项目记录`、`学习笔记`、`随笔`。标签写更具体的主题，例如`GNSS`、`51单片机`、`模拟电路`。文章的网址由文件名决定，例如`source/_posts/51-traffic-light-system.md`对应`/posts/51-traffic-light-system/`；改文件名会改变网址，旧链接可能失效。

### 插入图片、链接、代码和公式

把图片放到`source/images/`，例如`source/images/traffic-board.jpg`，正文中写：

````markdown
![交通灯实物连接图](/images/traffic-board.jpg)

[查看项目演示](https://www.bilibili.com/)

```c
// 这里写C语言示例代码
```
````

一段代码用三个反引号开始，语言名紧跟在开始围栏后，结束时再写三个反引号。公式可写`$f=1/T$`；独立公式写在成对的`$$`之间。图片请使用自己有权公开的版本，尽量压缩，文件名用英文并写清替代文字。

### 修改项目或首页

普通新文章只需添加`source/_posts/`下的文件，首页“最近记录”、归档、分类和标签会自动更新。项目展示页是手工维护的；要新增项目卡片，请同时编辑`source/projects/index.md`。首页“研究与项目”代表卡片也由`scripts/home-sections.js`手工维护，只有希望它成为代表项目时才需要改这里。

## 上线后的检查

1. 在[Actions](https://github.com/junshi0227/junshi0227.github.io/actions)确认最新一次`Deploy blog to GitHub Pages`成功；若失败，点击运行记录看`build`或`deploy`步骤。
2. 打开[网站首页](https://junshi0227.github.io/)以及刚改的文章，检查标题、日期、图片、链接和手机排版。
3. 如果线上没变化，先确认提交在`main`、工作流已经结束，再强制刷新；若仍异常，检查文件路径、Front Matter的YAML格式，以及构建日志。
4. 本地继续写作前，若曾在GitHub网页改过仓库，先运行`git pull --ff-only origin main`（或在GitHub Desktop点`Fetch origin`、`Pull origin`），再修改本地文件，避免版本落后。

参考：[Hexo写作说明](https://hexo.io/docs/writing)、[Hexo Front Matter](https://hexo.io/docs/front-matter)、[GitHub网页编辑文件](https://docs.github.com/en/repositories/working-with-files/managing-files/editing-files)、[GitHub Pages自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。
