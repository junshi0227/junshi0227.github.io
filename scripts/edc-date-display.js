// This retrospective post uses the report's creation time as its displayed date.
// Keep the real modification time in metadata, but omit the extra visible date.
hexo.extend.filter.register('after_render:html', function (html) {
  const postUrl = `${hexo.config.url.replace(/\/$/, '')}/posts/2026-edc-periodic-signal-analyzer/index.html`;
  if (!html.includes(`<meta property="og:url" content="${postUrl}">`)) return html;

  return html
    .replace(
      /<span class="article-date article-meta-item">\s*<i class="fa-regular fa-wrench"><\/i>[\s\S]*?<span class="hover-info">[\s\S]*?<\/span>\s*<\/span>/,
      ''
    )
    .replace(/<li>\s*<strong>\s*更新于\s*:\s*<\/strong>[\s\S]*?<\/li>/, '');
});
