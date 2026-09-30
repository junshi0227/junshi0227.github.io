# 发布前需要填写的个人资料

这个文件集中列出初版的占位内容。示例文章和示例项目只是排版样本，不能作为真实经历直接公开使用。

| 项目 | 当前占位内容 | 修改位置 |
| --- | --- | --- |
| 站点名称、副标题、作者 | `个人博客`、`科研、项目与学习笔记`、`你的名字` | `_config.yml`、`_config.redefine.yml` |
| 站点地址 | `https://YOUR_PROJECT.pages.dev` | 两个配置文件中的`url`；拿到Pages地址后先替换，绑定域名后再改为正式域名 |
| 个人简介 | 概括性示例文字 | `source/about/index.md`、`scripts/home-sections.js` |
| 邮箱、GitHub | `YOUR_EMAIL@example.com`、`YOUR_USERNAME` | `source/about/index.md`；按需在主题配置中启用社交链接 |
| 头像 | `ME` 占位图 | `source/images/avatar.svg` 或把 `defaults.avatar` 改为自己的图片 |
| 首页背景 | 从个人壁纸文件夹选用的森林光影图 | `source/images/forest-light.jpg`；背景位置和遮罩在 `source/css/custom.css` |
| 项目经历、时间、结果 | 两个示例项目 | `source/projects/index.md`、`scripts/home-sections.js`、对应文章 |
| 文章 | 三篇带“示例文章”提示的样本 | `source/_posts/`；替换或删除后发布 |
| 项目封面 | 颜色块封面 | `source/projects/index.md`、`source/css/custom.css`；可换成压缩后的真实图片 |

替换后运行 `npm run build`，再检查 `public/` 中的页面。
