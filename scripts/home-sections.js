// Keep the Redefine theme in node_modules while adding project and article sections.
hexo.extend.filter.register('after_render:html', function (html) {
  html = html.replace('</head>', '<link rel="stylesheet" href="/css/custom.css"></head>');
  const marker = '<div class="home-content-container">';
  if (!html.includes(marker)) return html;

  const sections = `
    <section class="blog-home-projects" aria-labelledby="blog-projects-title">
      <div class="blog-section-heading"><div><p class="blog-eyebrow">01 / SELECTED WORK</p><h2 id="blog-projects-title">代表项目</h2></div><a href="/projects/">查看全部项目 <span aria-hidden="true">↗</span></a></div>
      <div class="blog-project-mini-grid">
        <a class="blog-project-mini" href="/posts/pcb-defect-detection-notes/"><span class="blog-project-no">PROJECT 01 <em>示例</em></span><strong>PCB缺陷检测</strong><small>从数据准备、模型训练到误检分析的项目记录结构。</small><span class="blog-project-bottom">PYTHON / COMPUTER VISION <b aria-hidden="true">↗</b></span></a>
        <a class="blog-project-mini" href="/posts/gnss-ppp-time-transfer/"><span class="blog-project-no">PROJECT 02 <em>示例</em></span><strong>多系统PPP<br>时间传递</strong><small>整理钟差估计、系统间偏差与稳定度评估的研究笔记。</small><span class="blog-project-bottom">GNSS / PPP <b aria-hidden="true">↗</b></span></a>
      </div>
    </section>
    <div class="blog-section-heading blog-latest" id="latest-posts"><div><p class="blog-eyebrow">02 / JOURNAL</p><h2>最近记录</h2></div><a href="/archives/">全部文章 <span aria-hidden="true">↗</span></a></div>`;

  return html.replace(marker, marker + sections);
});
