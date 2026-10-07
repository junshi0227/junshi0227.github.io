const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { JSDOM } = require('jsdom');

function runConverter(script, input, output) {
  return new Promise((resolve, reject) => {
    const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', script, '-InputPath', input, '-OutputPath', output], { windowsHide: true });
    let outputText = '';
    const timer = setTimeout(() => { child.kill(); reject(Error('Word转换超时，请关闭Word中的弹窗后重试')); }, 90000);
    for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => { outputText = (outputText + chunk).slice(-3000); });
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('close', code => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(Error(`Word转换失败：${outputText.trim() || `退出代码${code}`}。请确认已安装桌面版Microsoft Word，且文档未设置打开密码。`));
    });
  });
}

function sanitizeWordHTML(source) {
  const dom = new JSDOM(source);
  const document = dom.window.document;
  for (const element of document.querySelectorAll('script,iframe,object,embed,form,base,meta[http-equiv="refresh"]')) element.remove();
  for (const element of document.querySelectorAll('*')) {
    for (const attribute of [...element.attributes]) {
      if (/^on/i.test(attribute.name)) element.removeAttribute(attribute.name);
      if (['href', 'src', 'action', 'formaction'].includes(attribute.name.toLowerCase()) && /^(?:\s*javascript:|\s*data:text\/html|\s*file:)/i.test(attribute.value)) element.removeAttribute(attribute.name);
    }
  }
  for (const style of document.querySelectorAll('style')) style.textContent = style.textContent.replace(/@import\s+[^;]+;/gi, '').replace(/url\s*\(\s*['"]?\s*(?:javascript:|data:text\/html)[^)]*\)/gi, 'none');
  const mobile = document.createElement('style');
  mobile.textContent = 'html,body{max-width:100%;overflow-x:auto}img{max-width:100%;height:auto}';
  document.head.append(mobile);
  document.documentElement.setAttribute('lang', 'zh-CN');
  return '<!doctype html>\n' + document.documentElement.outerHTML;
}

async function walkFiles(dir, prefix = '') {
  const found = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) found.push(...await walkFiles(path.join(dir, entry.name), relative));
    else if (entry.isFile()) found.push(relative);
  }
  return found;
}

async function convertWordDocument(bytes, destination, script) {
  const tempRoot = path.resolve(os.tmpdir());
  const workspaceRoot = path.resolve(__dirname, '../..');
  const resolvedDestination = path.resolve(destination);
  if (!resolvedDestination.startsWith(workspaceRoot + path.sep)) throw Error('Word导出目录不在博客仓库内');
  const temporary = await fs.mkdtemp(path.join(tempRoot, 'blog-word-'));
  const suffix = crypto.randomBytes(4).toString('hex');
  const staged = `${resolvedDestination}.next-${suffix}`;
  const backup = `${resolvedDestination}.backup-${suffix}`;
  if (![staged, backup].every(file => file.startsWith(workspaceRoot + path.sep))) throw Error('Word暂存目录不在博客仓库内');
  try {
    const input = path.join(temporary, 'source.docx');
    const output = path.join(temporary, 'index.html');
    await fs.writeFile(input, bytes);
    await runConverter(script, input, output);
    const cleanHTML = sanitizeWordHTML(await fs.readFile(output, 'utf8'));
    const previous = await fs.stat(resolvedDestination).then(() => walkFiles(resolvedDestination)).catch(error => error.code === 'ENOENT' ? [] : Promise.reject(error));
    await fs.mkdir(staged, { recursive: true });
    await fs.writeFile(path.join(staged, 'index.html'), cleanHTML, 'utf8');
    const pdf = path.join(temporary, 'index.pdf');
    try { await fs.access(pdf); await fs.copyFile(pdf, path.join(staged, 'index.pdf')); } catch {}
    for (const entry of await fs.readdir(temporary, { withFileTypes: true })) {
      if (entry.isDirectory() && /(?:\.files|_files)$/i.test(entry.name)) await fs.cp(path.join(temporary, entry.name), path.join(staged, entry.name), { recursive: true });
    }
    const next = await walkFiles(staged);
    const hadOriginal = await fs.stat(resolvedDestination).then(() => true).catch(error => error.code === 'ENOENT' ? false : Promise.reject(error));
    if (hadOriginal) await fs.rename(resolvedDestination, backup);
    try { await fs.rename(staged, resolvedDestination); }
    catch (error) { if (hadOriginal) await fs.rename(backup, resolvedDestination); throw error; }
    if (hadOriginal) await fs.rm(backup, { recursive: true, force: true });
    return [...new Set([...previous, ...next])];
  } finally {
    await fs.rm(staged, { recursive: true, force: true });
    if (temporary.startsWith(tempRoot + path.sep) && path.basename(temporary).startsWith('blog-word-')) await fs.rm(temporary, { recursive: true, force: true });
  }
}

module.exports = { convertWordDocument, sanitizeWordHTML };
