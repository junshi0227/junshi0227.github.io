// Keep the Redefine theme in node_modules while adding project and article sections.
hexo.extend.filter.register('after_render:html', function (html) {
  html = html.replace('</head>', '<link rel="stylesheet" href="/css/custom.css"></head>');
  const marker = '<div class="home-content-container">';
  if (!html.includes(marker)) return html;

  const sections = `
    <section class="blog-home-projects" aria-labelledby="blog-projects-title">
      <div class="blog-section-heading"><div><p class="blog-eyebrow">01 / SELECTED WORK</p><h2 id="blog-projects-title">研究与项目</h2></div><a href="/projects/">查看全部内容 <span aria-hidden="true">↗</span></a></div>
      <div class="blog-project-mini-grid">
        <a class="blog-project-mini blog-project-mini-featured" href="/posts/2026-edc-periodic-signal-analyzer/"><span class="blog-project-no">PROJECT 01 <em>电赛三等奖 · 硬件模块</em></span><strong>周期信号测量<br>分析装置</strong><small>从八阶模拟低通到高速采样与频谱分析，记录2026年电赛G题的团队设计。</small><span class="blog-project-bottom">ANALOG / FPGA / STM32 <b aria-hidden="true">↗</b></span></a>
        <a class="blog-project-mini" href="/posts/51-traffic-light-system/"><span class="blog-project-no">PROJECT 02 <em>课程题目C</em></span><strong>51单片机<br>交通灯系统</strong><small>双向三色灯、紧急全红、夜间黄闪与绿灯倒计时。</small><span class="blog-project-bottom">MCS-51 / EMBEDDED C <b aria-hidden="true">↗</b></span></a>
        <a class="blog-project-mini" href="/posts/gnss-ppp-time-transfer/"><span class="blog-project-no">RESEARCH 03 <em>研究笔记</em></span><strong>GNSS高精度<br>授时</strong><small>梳理接收机偏差的溯源与温度建模，以及异构星载钟选择。</small><span class="blog-project-bottom">GNSS / PPP <b aria-hidden="true">↗</b></span></a>
        <a class="blog-project-mini blog-project-mini-modeling" href="/posts/2025-math-modeling-sic-film-thickness/"><span class="blog-project-no">PROJECT 04 <em>2025年数模 · 北京市二等奖</em></span><strong>从红外光谱反演<br>薄膜厚度</strong><small>负责编程与数据分析：比较FFT与峰值间隔法，识别多光束效应，并检视模型不确定性。</small><span class="blog-project-bottom">PYTHON / FFT / PARAMETER ESTIMATION <b aria-hidden="true">↗</b></span></a>
      </div>
    </section>
    <div class="blog-section-heading blog-latest" id="latest-posts"><div><p class="blog-eyebrow">02 / JOURNAL</p><h2>最近记录</h2></div><a href="/archives/">全部文章 <span aria-hidden="true">↗</span></a></div>`;

  return html.replace(marker, marker + sections);
});
