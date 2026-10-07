const $ = id => document.getElementById(id);
const fields = ['title', 'slug', 'date', 'description', 'categories', 'tags', 'thumbnail'];
let token = '';
let posts = [];
let current = null;
let dirty = false;
let working = false;
let toastTimer;
let bodyDirty = false;
let originalBody = '';
let wordReplaceId = '';

if (!window.toastui?.Editor) {
  $('notice').hidden = false;
  $('notice').textContent = '排版编辑器加载失败。请关闭写作台的命令行窗口，重新双击“打开写作台.cmd”，然后按Ctrl+F5刷新。';
  throw Error('TOAST UI Editor未加载');
}

const editor = new toastui.Editor({
  el: $('editor'), height: '720px', minHeight: '620px', initialEditType: 'wysiwyg', hideModeSwitch: true,
  placeholder: '从这里开始写正文…',
  previewStyle: 'vertical', language: 'zh-CN', usageStatistics: false,
  toolbarItems: [['heading', 'bold', 'italic', 'strike'], ['hr', 'quote'], ['ul', 'ol', 'task'], ['table', 'image', 'link'], ['code', 'codeblock']],
  hooks: { addImageBlobHook: async (blob, callback) => {
    try { const result = await upload(blob); callback(result.url, blob.name || '插图'); }
    catch (error) { toast(error.message, true); }
  } }
});

function toast(message, error = false) {
  const node = $('toast');
  node.textContent = message;
  node.style.background = error ? '#8b3d39' : '#203e3a';
  node.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('show'), 5000);
}
function notice(message) {
  const node = $('notice');
  node.textContent = message;
  node.hidden = !message;
}
function setDirty(value) { dirty = value; $('save-state').textContent = value ? '有未保存修改' : '已保存'; }
function formatLocal(date) {
  const d = date || new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}T${p(d.getDate())}:${p(d.getHours())}`;
}
function splitLabels(value) { return value.split(/[,，、]/).map(x => x.trim()).filter(Boolean); }
async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.method === 'POST') headers['X-Blog-Editor-Token'] = token;
  if (options.json) { headers['Content-Type'] = 'application/json'; options.body = JSON.stringify(options.json); }
  const response = await fetch(path, { ...options, headers });
  const data = await response.json();
  if (!response.ok) throw Error(data.error || '操作失败');
  return data;
}
async function upload(file) {
  const extension = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif' }[file.type] || '.png';
  return api('/api/upload', { method: 'POST', body: file, headers: { 'X-File-Name': encodeURIComponent(file.name || `image${extension}`) } });
}
function renderList() {
  const list = $('article-list'); list.replaceChildren();
  $('post-count').textContent = posts.length;
  for (const post of posts) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'article-item' + (current?.id === post.id ? ' active' : '');
    const title = document.createElement('strong'); title.textContent = post.title;
    const meta = document.createElement('small'); meta.textContent = `${post.date.slice(0, 10) || '未定日期'} · ${post.status === 'draft' ? '草稿' : '已发布'}`;
    button.append(title, meta); button.onclick = () => openPost(post.id); list.append(button);
  }
}
function showCover() {
  const image = $('cover-image'); const value = $('thumbnail').value.trim();
  image.hidden = !value;
  if (value) image.src = value;
}
function fill(post) {
  current = post;
  $('title').value = post?.title || '';
  $('slug').value = post?.slug || '';
  $('slug').disabled = Boolean(post?.id);
  $('date').value = post?.date ? post.date.slice(0, 16).replace(' ', 'T') : formatLocal();
  $('paper-date').textContent = $('date').value.slice(0, 10);
  $('description').value = post?.description || '';
  $('categories').value = (post?.categories || []).join('，');
  $('tags').value = (post?.tags || []).join('，');
  $('thumbnail').value = post?.thumbnail || '';
  $('save-draft').textContent = post?.status === 'post' ? '撤下并存为草稿' : '保存为草稿';
  showCover();
  $('word-surface').hidden = !post?.wordUrl;
  $('editor').hidden = Boolean(post?.wordUrl);
  $('word-frame').src = post?.wordUrl || 'about:blank';
  $('word-pdf').hidden = !post?.wordPdfUrl;
  if (post?.wordPdfUrl) $('word-pdf').href = post.wordPdfUrl;
  editor.setMarkdown(post?.wordUrl ? '' : post?.body || '', false);
  originalBody = post?.body || '';
  bodyDirty = false;
  setDirty(false);
  notice('');
  $('publish-result').hidden = true;
  renderList();
}
async function confirmSwitch() {
  if (!dirty) return true;
  const dialog = $('confirm-dialog'); dialog.showModal();
  return new Promise(resolve => dialog.addEventListener('close', () => resolve(dialog.returnValue === 'discard'), { once: true }));
}
async function openPost(id) {
  if (!(await confirmSwitch())) return;
  try {
    const post = await api('/api/post/' + encodeURIComponent(id));
    fill(post);
    if (post.complex) toast('这篇文章含数学公式或原始HTML；可编辑，但保存前请检查排版和公式。');
  } catch (error) { toast(error.message, true); }
}
async function refreshList() { posts = (await api('/api/init')).posts; renderList(); }
function collect(status) {
  return { id: current?.id || null, slug: $('slug').value.trim(), title: $('title').value.trim(), date: $('date').value.replace('T', ' ') + ':00', description: $('description').value.trim(), categories: splitLabels($('categories').value), tags: splitLabels($('tags').value), thumbnail: $('thumbnail').value.trim(), mathjax: current?.mathjax || false, body: bodyDirty ? editor.getMarkdown() : originalBody, status };
}
async function perform(label, work) {
  if (working) return;
  working = true;
  for (const button of document.querySelectorAll('.top-actions button,.bottom-actions button')) button.disabled = true;
  $('save-state').textContent = label;
  try { await work(); }
  catch (error) { toast(error.message, true); notice(error.message); $('save-state').textContent = dirty ? '有未保存修改' : '操作未完成'; }
  finally { working = false; for (const button of document.querySelectorAll('.top-actions button,.bottom-actions button')) button.disabled = false; }
}
async function save(status) {
  if (current?.complex && bodyDirty && !window.confirm('这篇文章含数学公式或原始HTML。可视化编辑可能改变这些内容。请确认已检查正文，继续保存吗？')) return null;
  const result = await api('/api/save', { method: 'POST', json: collect(status) });
  fill(result.post);
  await refreshList();
  toast(status === 'draft' ? '草稿已保存到本机' : '文章已保存到本机，点击“发布上线”推送更新');
  return result.post;
}

for (const id of fields) $(id).addEventListener('input', () => { setDirty(true); if (id === 'thumbnail') showCover(); });
$('date').addEventListener('input', () => { $('paper-date').textContent = $('date').value.slice(0, 10); });
editor.on('change', () => { bodyDirty = true; setDirty(true); });
$('new-post').onclick = async () => { if (await confirmSwitch()) fill(null); };
$('import-word').onclick = async () => { if (await confirmSwitch()) { wordReplaceId = ''; $('word-file').click(); } };
$('reimport-word').onclick = async () => { if (await confirmSwitch()) { wordReplaceId = current?.id || ''; $('word-file').click(); } };
$('word-file').onchange = async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  await perform('正在导入Word…', async () => {
    const result = await api('/api/import-word', { method: 'POST', body: file, headers: { 'X-File-Name': encodeURIComponent(file.name), ...(wordReplaceId ? { 'X-Replace-Id': wordReplaceId } : {}) } });
    fill(result.post);
    await refreshList();
    notice('Word正文已导入，字体和排版以Word导出的版本显示。请先预览，再点击“发布上线”。');
    $('save-state').textContent = 'Word已导入本机';
  });
  event.target.value = '';
};
$('word-frame').onload = () => { try { $('word-frame').style.height = Math.max(700, $('word-frame').contentDocument.documentElement.scrollHeight + 20) + 'px'; } catch {} };
$('settings-shortcut').onclick = () => { $('post-settings').open = true; $('post-settings').scrollIntoView({ behavior: 'smooth', block: 'start' }); };
$('save').onclick = () => perform('正在保存…', () => save(current?.status || 'draft'));
$('save-draft').onclick = () => perform('正在保存草稿…', () => save('draft'));
$('cover-upload').onchange = async event => {
  const file = event.target.files?.[0]; if (!file) return;
  try { const result = await upload(file); $('thumbnail').value = result.url; showCover(); setDirty(true); toast('封面已上传，保存文章后生效'); }
  catch (error) { toast(error.message, true); }
  event.target.value = '';
};
function escapeHTML(value) { return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
$('preview').onclick = () => {
  if (current?.wordUrl) {
    $('preview-frame').srcdoc = '';
    $('preview-frame').src = current.wordUrl;
    $('preview-dialog').showModal();
    return;
  }
  $('preview-frame').src = 'about:blank';
  const title = escapeHTML($('title').value.trim() || '未命名文章');
  const date = escapeHTML($('date').value.slice(0, 10));
  const content = editor.getHTML();
  $('preview-frame').srcdoc = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src http: https: data:; style-src 'unsafe-inline'"><style>body{max-width:760px;margin:58px auto;padding:0 30px;font:17px/1.85 system-ui,'Microsoft YaHei',sans-serif;color:#273d39}h1{font-size:36px;line-height:1.3;margin:0 0 12px}h2,h3{line-height:1.4;margin-top:1.7em}small{color:#8ca099}hr{border:0;border-top:1px solid #e2e8e3;margin:30px 0}img{max-width:100%;height:auto;border-radius:8px}pre{overflow:auto;background:#f3f5f3;padding:16px;border-radius:8px}blockquote{border-left:3px solid #2c6d60;padding-left:18px;color:#62736e}table{border-collapse:collapse;width:100%}th,td{border:1px solid #dce4df;padding:8px;text-align:left}a{color:#276d61}</style></head><body><h1>${title}</h1><small>${date}</small><hr>${content}</body></html>`;
  $('preview-dialog').showModal();
};
$('close-preview').onclick = () => $('preview-dialog').close();
$('publish').onclick = () => perform('正在构建并推送…', async () => {
  const post = await save('post');
  if (!post) return;
  await api('/api/publish', { method: 'POST' });
  $('save-state').textContent = '已推送，等待GitHub构建';
  toast(`《${post.title}》已推送。GitHub Pages构建完成后即可在线查看。`);
  $('publish-result').hidden = false;
});
window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });

(async () => {
  try { const init = await api('/api/init'); token = init.token; posts = init.posts; renderList(); fill(null); }
  catch (error) { toast(`无法加载文章：${error.message}`, true); }
})();
