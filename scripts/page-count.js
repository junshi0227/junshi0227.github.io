// Replace the theme's hidden back-to-top arrow with a visible viewport page count.
hexo.extend.filter.register('after_render:html', function (html) {
  const hiddenTopButton = /<li class="right-bottom-tools tool-scroll-to-top flex justify-center items-center">\s*<i class="fa-regular fa-arrow-up"><\/i>\s*<\/li>/;
  const visibleTools = '<ul class="visible-tools-list">';
  if (!hiddenTopButton.test(html) || !html.includes(visibleTools)) return html;

  const pageButton = '<li class="right-bottom-tools tool-scroll-to-top blog-page-count-button flex justify-center items-center" role="button" tabindex="0" aria-label="第1页，共1页，点击返回顶部"><span class="blog-page-count">1/1</span></li>';
  return html
    .replace(hiddenTopButton, '')
    .replace(visibleTools, visibleTools + pageButton)
    .replace('</body>', '<script src="/js/page-count.js" defer></script></body>');
});
