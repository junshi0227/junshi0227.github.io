// Keep the Redefine theme in node_modules while adding a small home introduction.
hexo.extend.filter.register('after_render:html', function (html) {
  html = html.replace('</head>', '<link rel="stylesheet" href="/css/custom.css"></head>');
  const marker = '<div class="home-content-container">';
  if (!html.includes(marker)) return html;

  const intro = `
    <section class="blog-home-intro" aria-labelledby="blog-intro-title">
      <div class="blog-hero-kicker"><span>PERSONAL FIELD NOTES</span><span>研究 / 工程 / 学习</span></div>
      <div class="blog-hero-main">
        <h1 id="blog-intro-title">把问题写清楚，<br>把过程留下来。</h1>
        <div class="blog-hero-aside">
          <p>从GNSS时间传递到视觉检测，整理问题如何被定义、实现与验证。</p>
          <p>当前文章和项目是展示样例，个人经历会在正式发布前补充。</p>
        </div>
      </div>
      <div class="blog-hero-foot">
        <div class="blog-intro-actions">
          <a href="#latest-posts">浏览文章 <span aria-hidden="true">↗</span></a>
          <a href="/about/">关于本站</a>
        </div>
        <span class="blog-hero-note">记录研究，也记录走过的路</span>
      </div>
    </section>
    <section class="blog-home-projects" aria-labelledby="blog-projects-title">
      <div class="blog-section-heading"><div><p class="blog-eyebrow">01 / SELECTED WORK</p><h2 id="blog-projects-title">代表项目</h2></div><a href="/projects/">查看全部项目 <span aria-hidden="true">↗</span></a></div>
      <div class="blog-project-mini-grid">
        <a class="blog-project-mini" href="/posts/pcb-defect-detection-notes/"><span class="blog-project-no">PROJECT 01 <em>示例</em></span><strong>PCB缺陷检测</strong><small>从数据准备、模型训练到误检分析的项目记录结构。</small><span class="blog-project-bottom">PYTHON / COMPUTER VISION <b aria-hidden="true">↗</b></span></a>
        <a class="blog-project-mini" href="/posts/gnss-ppp-time-transfer/"><span class="blog-project-no">PROJECT 02 <em>示例</em></span><strong>多系统PPP<br>时间传递</strong><small>整理钟差估计、系统间偏差与稳定度评估的研究笔记。</small><span class="blog-project-bottom">GNSS / PPP <b aria-hidden="true">↗</b></span></a>
      </div>
    </section>
    <div class="blog-section-heading blog-latest" id="latest-posts"><div><p class="blog-eyebrow">02 / JOURNAL</p><h2>最近记录</h2></div><a href="/archives/">全部文章 <span aria-hidden="true">↗</span></a></div>`;

  return html.replace(marker, marker + intro);
});
