const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const matter = require('gray-matter');
const { convertWordDocument } = require('./word-import.cjs');

const root = path.resolve(__dirname, '../..');
const postsDir = path.join(root, 'source/_posts');
const draftsDir = path.join(root, 'source/_drafts');
const imageDir = path.join(root, 'source/images/editor');
const wordDir = path.join(root, 'source/word');
const publicDir = path.join(root, 'public');
const uiDir = path.join(__dirname, 'ui');
const vendorDir = path.join(root, 'node_modules/@toast-ui/editor/dist');
const session = crypto.randomBytes(32).toString('hex');
const touched = new Set();
const ports = { editor: Number(process.env.BLOG_EDITOR_PORT || 4001), preview: Number(process.env.BLOG_PREVIEW_PORT || 4002) };
let busy = false;

const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.woff': 'font/woff', '.woff2': 'font/woff2', '.json': 'application/json; charset=utf-8' };
function json(res, code, value) { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); }
function safeFile(base, name) {
  const file = path.resolve(base, name);
  if (file !== base && !file.startsWith(base + path.sep)) throw Error('无效文件路径');
  return file;
}
function idPath(id) {
  if (!/^(post|draft):[a-zA-Z0-9_-]+$/.test(id || '')) throw Error('文章编号无效');
  const [kind, slug] = id.split(':');
  return safeFile(kind === 'post' ? postsDir : draftsDir, slug + '.md');
}
function slugify(value) {
  const slug = String(value || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);
  return slug || `article-${Date.now()}`;
}
function dateString(value) {
  if (value instanceof Date) return `${value.getFullYear()}-${pad(value.getMonth()+1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
  return String(value || '');
}
function pad(n) { return String(n).padStart(2, '0'); }
function now() { return dateString(new Date()); }
function labels(value) { return Array.isArray(value) ? value.map(String) : value ? [String(value)] : []; }
function summary(id, parsed) {
  return { id, slug: id.split(':')[1], status: id.startsWith('draft:') ? 'draft' : 'post', title: String(parsed.data.title || '未命名文章'), date: dateString(parsed.data.date), description: String(parsed.data.description || ''), thumbnail: String(parsed.data.thumbnail || '') };
}
async function list() {
  const found = [];
  for (const [kind, dir] of [['post', postsDir], ['draft', draftsDir]]) {
    await fs.mkdir(dir, { recursive: true });
    for (const name of await fs.readdir(dir)) {
      if (!/^[a-zA-Z0-9_-]+\.md$/.test(name)) continue;
      const parsed = matter(await fs.readFile(path.join(dir, name), 'utf8'));
      found.push(summary(`${kind}:${name.slice(0, -3)}`, parsed));
    }
  }
  return found.sort((a, b) => b.date.localeCompare(a.date));
}
async function readPost(id) {
  const parsed = matter(await fs.readFile(idPath(id), 'utf8'));
  const wordUrl = parsed.content.match(/<iframe[^>]+src=["'](\/word\/[a-z0-9-]+\/index\.html)["']/i)?.[1] || '';
  const wordPdfUrl = wordUrl && await fs.access(safeFile(path.join(root, 'source'), wordUrl.slice(1).replace(/index\.html$/, 'index.pdf'))).then(() => wordUrl.replace(/index\.html$/, 'index.pdf')).catch(() => '') || '';
  return { ...summary(id, parsed), updated: dateString(parsed.data.updated), categories: labels(parsed.data.categories), tags: labels(parsed.data.tags), mathjax: Boolean(parsed.data.mathjax), body: parsed.content.trimStart(), complex: /(?:\$\$|\\\(|\\\[|<script\b|<iframe\b|<table\b)/i.test(parsed.content), wordUrl, wordPdfUrl };
}
async function body(req, limit = 4 * 1024 * 1024) {
  const chunks = []; let size = 0;
  for await (const chunk of req) { size += chunk.length; if (size > limit) throw Error('文件或文章过大'); chunks.push(chunk); }
  return Buffer.concat(chunks);
}
function checkWrite(req) {
  const origin = req.headers.origin;
  if (origin && origin !== `http://127.0.0.1:${ports.editor}` && origin !== `http://localhost:${ports.editor}`) throw Error('请求来源无效');
  if (req.headers['x-blog-editor-token'] !== session) throw Error('写入凭证无效，请刷新页面');
}
async function save(data) {
  if (!data || typeof data !== 'object') throw Error('文章数据无效');
  const title = String(data.title || '').trim();
  if (!title) throw Error('请填写标题');
  if (typeof data.body !== 'string' || data.body.length > 2_000_000) throw Error('正文无效或过长');
  const state = data.status === 'post' ? 'post' : 'draft';
  const slug = data.id ? data.id.split(':')[1] : slugify(data.slug || title);
  if (!/^[a-zA-Z0-9_-]+$/.test(slug)) throw Error('链接名称只支持英文字母、数字和连字符');
  const id = `${state}:${slug}`;
  const destination = idPath(id);
  const previous = data.id ? idPath(data.id) : null;
  if (!previous || previous !== destination) {
    try { await fs.access(destination); throw Error('该链接名称已存在，请换一个'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  let metadata = {};
  if (previous) metadata = matter(await fs.readFile(previous, 'utf8')).data;
  metadata.title = title;
  metadata.date = String(data.date || metadata.date && dateString(metadata.date) || now()).replace('T', ' ').slice(0, 19);
  metadata.updated = now();
  metadata.categories = labels(data.categories);
  metadata.tags = labels(data.tags);
  metadata.description = String(data.description || '').trim();
  metadata.thumbnail = String(data.thumbnail || '').trim();
  if (data.mathjax || metadata.mathjax) metadata.mathjax = true;
  const content = matter.stringify('\n' + data.body.trim() + '\n', metadata);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, content, 'utf8');
  touched.add(path.relative(root, destination).replaceAll('\\', '/'));
  if (previous && previous !== destination) {
    await fs.unlink(previous);
    touched.add(path.relative(root, previous).replaceAll('\\', '/'));
  }
  return readPost(id);
}
async function importWord(bytes, filename, replaceId) {
  if (!/^PK[\x03\x05\x07]/.test(bytes.toString('binary', 0, 4))) throw Error('这不是有效的DOCX文件');
  let existing = null;
  if (replaceId) {
    existing = await readPost(replaceId);
    if (!existing.wordUrl) throw Error('只能对已导入的Word文章重新导入');
  }
  const slug = existing?.slug || `word-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const destination = safeFile(wordDir, slug);
  const files = await convertWordDocument(bytes, destination, path.join(__dirname, 'convert-word.ps1'));
  for (const file of files) touched.add(`source/word/${slug}/${file.replaceAll('\\', '/')}`);
  const pdfLink = await fs.access(path.join(destination, 'index.pdf')).then(() => `<p><a href="/word/${slug}/index.pdf" target="_blank" rel="noopener">查看Word原版排版(PDF)</a></p>\n`).catch(() => '');
  const embedded = `${pdfLink}<iframe class="word-article-embed" src="/word/${slug}/index.html" title="Word文章正文" sandbox="allow-same-origin" style="width:100%;height:900px;border:0;display:block" onload="this.style.height=Math.max(720,this.contentDocument.documentElement.scrollHeight)+'px'"></iframe>`;
  return save({ id: existing?.id, slug, title: existing?.title || filename.replace(/\.docx$/i, ''), date: existing?.date || now(), description: existing?.description || '', categories: existing?.categories || [], tags: existing?.tags || [], thumbnail: existing?.thumbnail || '', mathjax: existing?.mathjax || false, body: embedded, status: existing?.status || 'draft' });
}
function run(command, args, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, env, windowsHide: true, shell: false });
    let output = '';
    child.stdout.on('data', chunk => { output = (output + chunk).slice(-16000); });
    child.stderr.on('data', chunk => { output = (output + chunk).slice(-16000); });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve(output) : reject(Error(output.trim() || `${command}退出代码${code}`)));
  });
}
async function executable(relative, fallback) { try { await fs.access(path.join(root, relative)); return path.join(root, relative); } catch { return fallback; } }
async function gitEnv() {
  const git = await executable('../tools/portable-git/cmd/git.exe', 'git');
  const gh = await executable('../tools/bin/gh.exe', 'gh');
  const env = { ...process.env };
  const authDir = path.join(root, '.gh-auth');
  try { await fs.access(authDir); env.GH_CONFIG_DIR = authDir; } catch {}
  let token = '';
  try { token = (await run(gh, ['auth', 'token'], env)).trim(); } catch {}
  const config = [['safe.directory', root]];
  const ca = path.join(root, '../tools/portable-git/ucrt64/etc/ssl/certs/ca-bundle.crt');
  try { await fs.access(ca); config.push(['http.sslBackend', 'openssl'], ['http.sslCAInfo', ca]); } catch {}
  if (token) config.push(['http.extraHeader', `AUTHORIZATION: basic ${Buffer.from(`x-access-token:${token}`).toString('base64')}`]);
  env.GIT_CONFIG_COUNT = String(config.length);
  config.forEach(([key, value], i) => { env[`GIT_CONFIG_KEY_${i}`] = key; env[`GIT_CONFIG_VALUE_${i}`] = value; });
  return { git, env, authenticated: Boolean(token) };
}
async function publish() {
  await run(process.execPath, [path.join(root, 'node_modules/hexo/bin/hexo'), 'generate']);
  const { git, env, authenticated } = await gitEnv();
  if (!authenticated) throw Error('GitHub尚未登录。请先在终端运行gh auth login，然后重试。');
  if (touched.size) {
    const paths = [];
    const published = [...touched].filter(file => file.startsWith('source/_posts/'));
    const publishedText = (await Promise.all(published.map(async file => {
      try { return await fs.readFile(path.join(root, file), 'utf8'); } catch { return ''; }
    }))).join('\n');
    const images = [...publishedText.matchAll(/\/images\/editor\/([a-zA-Z0-9._-]+)/g)].map(match => `source/images/editor/${match[1]}`);
    const wordPaths = [...publishedText.matchAll(/\/word\/([a-z0-9-]+)\/index\.html/g)].map(match => `source/word/${match[1]}`);
    for (const file of [...new Set([...published, ...images, ...wordPaths])]) {
      try { await fs.access(path.join(root, file)); paths.push(file); }
      catch {
        try { await run(git, ['ls-files', '--error-unmatch', '--', file], env); paths.push(file); }
        catch {}
      }
    }
    if (paths.length) await run(git, ['add', '-A', '--', ...paths], env);
    try { await run(git, ['diff', '--cached', '--quiet'], env); }
    catch { await run(git, ['commit', '-m', 'Update blog articles from visual editor'], env); }
  }
  await run(git, ['push', 'origin', 'main'], env);
  touched.clear();
  return { site: 'https://junshi0227.github.io/', actions: 'https://github.com/junshi0227/junshi0227.github.io/actions' };
}
async function staticFile(res, base, relative) {
  const filename = safeFile(base, decodeURIComponent(relative));
  try {
    const stat = await fs.stat(filename);
    if (!stat.isFile()) throw Error('not file');
    res.writeHead(200, { 'Content-Type': mime[path.extname(filename).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(await fs.readFile(filename));
  } catch { res.writeHead(404); res.end('Not found'); }
}
const editorServer = http.createServer(async (req, res) => {
  try {
    const host = req.headers.host || '';
    if (![`127.0.0.1:${ports.editor}`, `localhost:${ports.editor}`].includes(host)) { json(res, 403, { error: '仅允许本机访问' }); return; }
    const url = new URL(req.url, `http://${host}`);
    if (req.method === 'GET' && url.pathname === '/api/init') return json(res, 200, { token: session, posts: await list(), previewPort: ports.preview });
    if (req.method === 'GET' && url.pathname.startsWith('/api/post/')) return json(res, 200, await readPost(decodeURIComponent(url.pathname.slice(10))));
    if (req.method === 'POST') {
      checkWrite(req);
      if (url.pathname === '/api/save') return json(res, 200, { post: await save(JSON.parse((await body(req)).toString('utf8'))) });
      if (url.pathname === '/api/import-word') {
        const filename = decodeURIComponent(String(req.headers['x-file-name'] || '文章.docx'));
        if (!/\.docx$/i.test(filename) || filename.includes('/') || filename.includes('\\')) throw Error('请选择DOCX格式的Word文档');
        const replaceId = req.headers['x-replace-id'] ? String(req.headers['x-replace-id']) : '';
        return json(res, 200, { post: await importWord(await body(req, 25 * 1024 * 1024), filename, replaceId) });
      }
      if (url.pathname === '/api/upload') {
        const name = String(req.headers['x-file-name'] || 'image.png');
        const ext = path.extname(name).toLowerCase();
        if (!['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext)) throw Error('仅支持PNG、JPG、WebP或GIF图片');
        const bytes = await body(req, 10 * 1024 * 1024);
        const signatures = { '.png': bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')), '.jpg': bytes.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex')), '.jpeg': bytes.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex')), '.webp': bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP', '.gif': bytes.toString('ascii', 0, 3) === 'GIF' };
        if (!signatures[ext]) throw Error('图片格式与扩展名不一致');
        await fs.mkdir(imageDir, { recursive: true });
        const file = `${Date.now()}-${crypto.randomBytes(5).toString('hex')}${ext}`;
        await fs.writeFile(path.join(imageDir, file), bytes);
        touched.add(`source/images/editor/${file}`);
        return json(res, 200, { url: `/images/editor/${file}` });
      }
      if (url.pathname === '/api/preview' || url.pathname === '/api/publish') {
        if (busy) throw Error('正在构建或发布，请稍候');
        busy = true;
        try {
          if (url.pathname === '/api/publish') return json(res, 200, await publish());
          await run(process.execPath, [path.join(root, 'node_modules/hexo/bin/hexo'), 'generate']);
          return json(res, 200, { url: `http://127.0.0.1:${ports.preview}/` });
        } finally { busy = false; }
      }
    }
    if (req.method === 'GET' && url.pathname.startsWith('/vendor/')) return staticFile(res, vendorDir, url.pathname.slice(8));
    if (req.method === 'GET' && url.pathname.startsWith('/images/')) return staticFile(res, path.join(root, 'source'), url.pathname.slice(1));
    if (req.method === 'GET' && url.pathname.startsWith('/word/')) return staticFile(res, path.join(root, 'source'), url.pathname.slice(1));
    if (req.method === 'GET' && url.pathname === '/') return staticFile(res, uiDir, 'index.html');
    if (req.method === 'GET') return staticFile(res, uiDir, url.pathname.slice(1));
    json(res, 404, { error: '页面不存在' });
  } catch (error) { json(res, 400, { error: error.message }); }
});
const previewServer = http.createServer(async (req, res) => {
  const host = req.headers.host || '';
  if (![ `127.0.0.1:${ports.preview}`, `localhost:${ports.preview}` ].includes(host)) { res.writeHead(403); res.end(); return; }
  const url = new URL(req.url, `http://${host}`);
  let relative = url.pathname.replace(/^\/+/, '');
  if (!path.extname(relative)) relative = path.join(relative, 'index.html');
  await staticFile(res, publicDir, relative);
});
editorServer.on('error', error => { console.error(`写作台启动失败：${error.message}`); process.exitCode = 1; });
previewServer.on('error', error => { console.error(`预览服务启动失败：${error.message}`); process.exitCode = 1; });
editorServer.listen(ports.editor, '127.0.0.1', () => {
  console.log(`写作台：http://127.0.0.1:${ports.editor}/`);
  if (process.argv.includes('--open')) spawn('powershell.exe', ['-NoProfile', '-Command', 'Start-Process', `http://127.0.0.1:${ports.editor}/`], { windowsHide: true, stdio: 'ignore' });
});
previewServer.listen(ports.preview, '127.0.0.1', () => console.log(`预览：http://127.0.0.1:${ports.preview}/`));
module.exports = { editorServer, previewServer };
