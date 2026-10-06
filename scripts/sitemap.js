// Build a sitemap from published posts and pages whenever Hexo generates the site.
hexo.extend.generator.register('site-map', function (locals) {
  const base = new URL(`${this.config.url.replace(/\/$/, '')}/`);
  const routes = new Set(['/']);

  function addRoute(item) {
    if (!item.path || item.path === '404.html') return;
    if (!item.path.endsWith('/') && !item.path.endsWith('.html')) return;
    const path = item.path.replace(/^\/+/, '').replace(/index\.html$/, '');
    routes.add(`/${path}`);
  }

  locals.posts.forEach(addRoute);
  locals.pages.forEach(addRoute);

  const escapeXml = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const entries = [...routes].sort().map(path => {
    const address = new URL(path.slice(1), base).href;
    return `  <url><loc>${escapeXml(address)}</loc></url>`;
  });

  return {
    path: 'sitemap.xml',
    data: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`
  };
});
