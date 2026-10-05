(() => {
  const pageButton = document.querySelector('.blog-page-count-button');
  const pageCount = pageButton?.querySelector('.blog-page-count');
  if (!pageButton || !pageCount) return;

  let pendingFrame = 0;

  function update() {
    pendingFrame = 0;
    const viewport = Math.max(1, window.innerHeight || document.documentElement.clientHeight);
    const documentHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    const total = Math.max(1, Math.ceil(documentHeight / viewport));
    const maxScroll = Math.max(0, documentHeight - viewport);
    const scrollTop = Math.min(maxScroll, Math.max(0, window.scrollY || document.documentElement.scrollTop));
    const current = maxScroll - scrollTop <= 2
      ? total
      : Math.min(total, Math.floor(scrollTop / viewport) + 1);

    pageCount.textContent = `${current}/${total}`;
    pageButton.setAttribute('aria-label', `第${current}页，共${total}页，点击返回顶部`);
  }

  function schedule() {
    if (!pendingFrame) pendingFrame = window.requestAnimationFrame(update);
  }

  pageButton.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      pageButton.click();
    }
  });
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('load', schedule);
  document.addEventListener('redefine:page:refresh', schedule);
  if (window.ResizeObserver) new ResizeObserver(schedule).observe(document.body);
  schedule();
})();
