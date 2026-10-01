# 发布前需要填写的个人资料

这个文件集中列出初版的占位内容。示例文章和示例项目只是排版样本，不能作为真实经历直接公开使用。

| 项目 | 当前占位内容 | 修改位置 |
| --- | --- | --- |
| 站点名称、副标题、作者 | `个人博客`、`科研、项目与学习笔记`、`junshi0227` | `_config.yml`、`_config.redefine.yml`；可按喜好修改 |
| 站点地址 | `https://junshi0227.github.io` | 两个配置文件中的`url`；绑定自定义域名后再改为正式域名 |
| 个人简介 | 概括性示例文字 | `source/about/index.md`、`scripts/home-sections.js` |
| 联系方式 | GitHub主页已填写，邮箱未公开 | `source/about/index.md`；按需添加公开邮箱或其他方式 |
| 头像 | `ME` 占位图 | `source/images/avatar.svg` 或把 `defaults.avatar` 改为自己的图片 |
| 首页背景 | 壁纸文件夹中的蓝调雪山照片 | `_config.redefine.yml`中的`home_banner.image`；原森林光影图保留在`source/images/forest-light.jpg`备用 |
| 项目经历、时间、结果 | 两个示例项目 | `source/projects/index.md`、`scripts/home-sections.js`、对应文章 |
| 文章 | 三篇带“示例文章”提示的样本 | `source/_posts/`；替换或删除后发布 |
| 项目封面 | 颜色块封面 | `source/projects/index.md`、`source/css/custom.css`；可换成压缩后的真实图片 |

替换后运行 `npm run build`，再检查 `public/` 中的页面。
