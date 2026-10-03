// Keep the Redefine theme in node_modules while adding project and article sections.
hexo.extend.filter.register('after_render:html', function (html) {
  html = html.replace('</head>', '<link rel="stylesheet" href="/css/custom.css"></head>');
  const marker = '<div class="home-content-container">';
  if (!html.includes(marker)) return html;

  const sections = `
    <section class="blog-home-projects" aria-labelledby="blog-projects-title">
      <div class="blog-section-heading"><div><p class="blog-eyebrow">01 / SELECTED WORK</p><h2 id="blog-projects-title">研究与项目</h2></div><a href="/projects/">查看全部内容 <span aria-hidden="true">↗</span></a></div>
      <div class="blog-project-mini-grid">
        <a class="blog-project-mini" href="/posts/51-traffic-light-system/"><span class="blog-project-no">PROJECT 01 <em>课程项目</em></span><strong>51单片机<br>交通灯系统</strong><small>双向信号灯、LCD1602倒计时，以及模式切换与按键调时。</small><span class="blog-project-bottom">MCS-51 / EMBEDDED C <b aria-hidden="true">↗</b></span></a>
        <a class="blog-project-mini" href="/posts/gnss-ppp-time-transfer/"><span class="blog-project-no">RESEARCH 02 <em>研究笔记</em></span><strong>GNSS高精度<br>授时</strong><small>梳理接收机偏差的溯源与温度建模，以及异构星载钟选择。</small><span class="blog-project-bottom">GNSS / PPP <b aria-hidden="true">↗</b></span></a>
      </div>
    </section>
    <div class="blog-section-heading blog-latest" id="latest-posts"><div><p class="blog-eyebrow">02 / JOURNAL</p><h2>最近记录</h2></div><a href="/archives/">全部文章 <span aria-hidden="true">↗</span></a></div>`;

  return html.replace(marker, marker + sections);
});
