const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { sanitizeWordHTML } = require('./word-import.cjs');

const repo = path.resolve(__dirname, '../..');
const supported = new Set(['.docx', '.doc', '.rtf', '.odt', '.tex', '.zip', '.md', '.markdown', '.txt', '.rst', '.org', '.ipynb', '.html', '.htm', '.pdf']);
const pandocFormats = { '.tex': 'latex', '.rst': 'rst', '.org': 'org', '.ipynb': 'ipynb' };

function extensionOf(filename) {
  const extension = path.extname(filename).toLowerCase();
  if (!supported.has(extension)) throw Error('支持Word、LaTeX、Markdown、文本、HTML、PDF、Jupyter、RST和Org文档');
  return extension;
}

function validateSignature(bytes, extension) {
  if (['.docx', '.odt', '.zip'].includes(extension) && !bytes.subarray(0, 4).equals(Buffer.from('504b0304', 'hex'))) throw Error('ZIP类文档格式与扩展名不符');
  if (extension === '.pdf' && bytes.toString('ascii', 0, 5) !== '%PDF-') throw Error('PDF文件格式与扩展名不符');
  if (extension === '.doc' && !bytes.subarray(0, 8).equals(Buffer.from('d0cf11e0a1b11ae1', 'hex'))) throw Error('DOC文件格式与扩展名不符');
  if (extension === '.rtf' && bytes.toString('ascii', 0, 5) !== '{\\rtf') throw Error('RTF文件格式与扩展名不符');
}

function run(command, args, cwd, timeout = 90000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, windowsHide: true, shell: false });
    let output = '';
    const timer = setTimeout(() => { child.kill(); reject(Error('文档转换超时，请检查原文件是否完整')); }, timeout);
    for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => { output = (output + chunk).slice(-5000); });
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('close', code => { clearTimeout(timer); code === 0 ? resolve(output) : reject(Error(output.trim() || `转换工具退出代码${code}`)); });
  });
}

async function pandocPath() {
  const bundled = path.resolve(repo, '../tools/pandoc-3.12/pandoc.exe');
  try { await fs.access(bundled); return bundled; } catch { return 'pandoc'; }
}

async function safeReplaceDirectory(destination, writer) {
  const resolved = path.resolve(destination);
  if (!resolved.startsWith(repo + path.sep)) throw Error('导出目录必须位于博客仓库内');
  const suffix = crypto.randomBytes(5).toString('hex');
  const staged = `${resolved}.next-${suffix}`;
  const backup = `${resolved}.backup-${suffix}`;
  await fs.mkdir(staged, { recursive: true });
  try {
    await writer(staged);
    const hadOriginal = await fs.stat(resolved).then(() => true).catch(error => error.code === 'ENOENT' ? false : Promise.reject(error));
    if (hadOriginal) await fs.rename(resolved, backup);
    try { await fs.rename(staged, resolved); }
    catch (error) { if (hadOriginal) await fs.rename(backup, resolved); throw error; }
    if (hadOriginal) await fs.rm(backup, { recursive: true, force: true });
  } finally {
    await fs.rm(staged, { recursive: true, force: true });
  }
}

async function mainTex(project) {
  const candidates = [];
  async function walk(folder) {
    for (const entry of await fs.readdir(folder, { withFileTypes: true })) {
      const file = path.join(folder, entry.name);
      if (entry.isDirectory()) await walk(file);
      else if (entry.isFile() && /\.tex$/i.test(entry.name)) {
        const content = await fs.readFile(file, 'utf8');
        candidates.push({ file, main: /\\documentclass(?:\[[^\]]*\])?\s*\{/.test(content), namedMain: /^main\.tex$/i.test(entry.name), size: content.length });
      }
    }
  }
  await walk(project);
  candidates.sort((a, b) => Number(b.main) - Number(a.main) || Number(b.namedMain) - Number(a.namedMain) || b.size - a.size);
  if (!candidates.length) throw Error('LaTeX压缩包中没有.tex文件');
  return candidates[0].file;
}

async function convertEmbedded(bytes, filename, destination) {
  const extension = extensionOf(filename);
  validateSignature(bytes, extension);
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'blog-document-'));
  try {
    let input = path.join(temporary, `source${extension}`);
    await fs.writeFile(input, bytes);
    await safeReplaceDirectory(destination, async staged => {
      if (extension === '.pdf') {
        await fs.copyFile(input, path.join(staged, 'index.pdf'));
        await fs.writeFile(path.join(staged, 'index.html'), '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>PDF文档</title><style>html,body{margin:0;height:100%;font-family:system-ui}iframe{width:100%;height:100%;border:0}p{padding:1em}</style><iframe src="index.pdf" title="PDF文档"></iframe><p>若浏览器没有显示PDF，请<a href="index.pdf">打开原文件</a>。</p></html>');
        return;
      }
      if (extension === '.html' || extension === '.htm') {
        await fs.writeFile(path.join(staged, 'index.html'), sanitizeWordHTML(bytes.toString('utf8')));
        return;
      }
      let format = pandocFormats[extension];
      if (extension === '.zip') {
        const project = path.join(temporary, 'project');
        await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', path.join(__dirname, 'extract-latex-zip.ps1'), '-InputPath', input, '-OutputPath', project], temporary);
        input = await mainTex(project);
        format = 'latex';
      }
      if (!format) throw Error('该格式应直接导入编辑器');
      const output = path.join(temporary, 'index.html');
      const executable = await pandocPath();
      try {
        await run(executable, ['--from', format, '--to', 'html5', '--standalone', '--embed-resources', '--math-method=mathml', '--resource-path', path.dirname(input), '--output', output, input], path.dirname(input));
      } catch (error) {
        if (error.code === 'ENOENT') throw Error('尚未安装Pandoc。请安装Pandoc后重试LaTeX等格式导入。');
        throw Error(`Pandoc转换失败：${error.message}`);
      }
      let html = await fs.readFile(output, 'utf8');
      html = sanitizeWordHTML(html);
      html = html.replace('</head>', '<style>body{max-width:920px;margin:36px auto;padding:0 28px;font:16px/1.8 system-ui,sans-serif;color:#273d39}pre{overflow:auto}table{border-collapse:collapse}td,th{border:1px solid #ddd;padding:8px}math{font-size:1.1em}</style></head>');
      await fs.writeFile(path.join(staged, 'index.html'), html);
    });
    return { hasPdf: extension === '.pdf', extension };
  } finally {
    const tempRoot = path.resolve(os.tmpdir());
    if (temporary.startsWith(tempRoot + path.sep) && path.basename(temporary).startsWith('blog-document-')) await fs.rm(temporary, { recursive: true, force: true });
  }
}

module.exports = { extensionOf, validateSignature, convertEmbedded };
