const $ = id => document.getElementById(id);
const fields = ['title', 'slug', 'date', 'description', 'categories', 'tags', 'thumbnail'];
let token = '';
let posts = [];
let current = null;
let dirty = false;
let working = false;
let previewPort = 4002;
let toastTimer;
let bodyDirty = false;
let originalBody = '';

const editor = new toastui.Editor({
  el: $('editor'), height: '620px', initialEditType: 'wysiwyg', hideModeSwitch: true,
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
function setDirty(value) { dirty = value; $('save-state').textContent = value ? '有未保存修改' : '已保存'; }
function formatLocal(date) {
  const d = date || new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}T${p(d.getDate())}:${p(d.getHours())}`;
}
function splitLabels(value) { return value.split(/[,，、]/).map(x => x.trim()).filter(Boolean); }
function slugify(value) { return value.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70); }
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
  $('description').value = post?.description || '';
  $('categories').value = (post?.categories || []).join('，');
  $('tags').value = (post?.tags || []).join('，');
  $('thumbnail').value = post?.thumbnail || '';
  $('save-draft').textContent = post?.status === 'post' ? '撤下并存为草稿' : '保存为草稿';
  showCover();
  editor.setMarkdown(post?.body || '', false);
  originalBody = post?.body || '';
  bodyDirty = false;
  setDirty(false);
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
  catch (error) { toast(error.message, true); $('save-state').textContent = dirty ? '有未保存修改' : '操作未完成'; }
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
editor.on('change', () => { bodyDirty = true; setDirty(true); });
$('new-post').onclick = async () => { if (await confirmSwitch()) fill(null); };
$('save').onclick = () => perform('正在保存…', () => save(current?.status || 'draft'));
$('save-draft').onclick = () => perform('正在保存草稿…', () => save('draft'));
$('cover-upload').onchange = async event => {
  const file = event.target.files?.[0]; if (!file) return;
  try { const result = await upload(file); $('thumbnail').value = result.url; showCover(); setDirty(true); toast('封面已上传，保存文章后生效'); }
  catch (error) { toast(error.message, true); }
  event.target.value = '';
};
$('preview').onclick = () => perform('正在生成预览…', async () => {
  const post = await save(current?.status || 'draft');
  if (!post) return;
  if (post.status === 'draft') { toast('草稿已保存。正式网站预览需要先将文章设为已发布；当前编辑区可以直接查看排版。'); return; }
  await api('/api/preview', { method: 'POST' });
  window.open(`http://127.0.0.1:${previewPort}/posts/${post.slug}/`, '_blank', 'noopener');
  $('save-state').textContent = '预览已打开';
});
$('publish').onclick = () => perform('正在构建并推送…', async () => {
  const post = await save('post');
  if (!post) return;
  const result = await api('/api/publish', { method: 'POST' });
  $('save-state').textContent = '已推送，等待GitHub构建';
  toast(`《${post.title}》已推送。GitHub Pages构建完成后即可在线查看。`);
  window.open(result.actions, '_blank', 'noopener');
});
window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });

(async () => {
  try { const init = await api('/api/init'); token = init.token; posts = init.posts; previewPort = init.previewPort; renderList(); fill(null); }
  catch (error) { toast(`无法加载文章：${error.message}`, true); }
})();
