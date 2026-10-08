const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { extensionOf, validateSignature, convertEmbedded } = require('./document-import.cjs');

const repo = path.resolve(__dirname, '../..');

test('import rejects a PDF extension on unrelated bytes', () => {
  assert.equal(extensionOf('paper.tex'), '.tex');
  assert.throws(() => validateSignature(Buffer.from('not pdf'), '.pdf'), /PDF/);
  assert.throws(() => extensionOf('program.exe'), /支持Word/);
});

test('LaTeX equations become browser MathML', async t => {
  const pandoc = path.resolve(repo, '../tools/pandoc-3.12/pandoc.exe');
  try { await fs.access(pandoc); } catch { t.skip('Pandoc is not installed in this workspace'); return; }
  const parent = path.join(repo, 'source/imports');
  const destination = path.join(parent, `test-${process.pid}-${Date.now()}`);
  assert.ok(destination.startsWith(repo + path.sep));
  const latex = String.raw`\documentclass{article}
\begin{document}
\section{测试}
公式 $E=mc^2$。
\end{document}`;
  try {
    await convertEmbedded(Buffer.from(latex), 'paper.tex', destination);
    const html = await fs.readFile(path.join(destination, 'index.html'), 'utf8');
    assert.match(html, /<math[\s>]/);
    assert.match(html, /测试/);
    assert.doesNotMatch(html, /<script/i);
  } finally {
    await fs.rm(destination, { recursive: true, force: true });
  }
});

test('a LaTeX project ZIP imports its main file and local image', async t => {
  if (process.platform !== 'win32') { t.skip('ZIP project extraction uses Windows PowerShell'); return; }
  const pandoc = path.resolve(repo, '../tools/pandoc-3.12/pandoc.exe');
  try { await fs.access(pandoc); } catch { t.skip('Pandoc is not installed in this workspace'); return; }
  const parent = path.join(repo, 'source/imports', `test-zip-${process.pid}-${Date.now()}`);
  const destination = path.join(parent, 'article');
  assert.ok(parent.startsWith(repo + path.sep));
  await fs.mkdir(parent, { recursive: true });
  try {
    const main = path.join(parent, 'main.tex');
    const zip = path.join(parent, 'project.zip');
    await fs.writeFile(main, String.raw`\documentclass{article}
\usepackage{graphicx}
\begin{document}
Project $x^2$. \includegraphics{dot.png}
\input{chapter}
\end{document}`);
    await fs.writeFile(path.join(parent, 'chapter.tex'), 'Included chapter text.');
    await fs.writeFile(path.join(parent, 'dot.png'), Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==', 'base64'));
    const quote = value => `'${value.replaceAll("'", "''")}'`;
    const command = `Compress-Archive -LiteralPath ${quote(main)},${quote(path.join(parent, 'dot.png'))},${quote(path.join(parent, 'chapter.tex'))} -DestinationPath ${quote(zip)} -Force`;
    const compressed = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], { encoding: 'utf8' });
    assert.equal(compressed.status, 0, compressed.stderr);
    await convertEmbedded(await fs.readFile(zip), 'project.zip', destination);
    const html = await fs.readFile(path.join(destination, 'index.html'), 'utf8');
    assert.match(html, /<math[\s>]/);
    assert.match(html, /data:image\/png;base64,/);
    assert.match(html, /Included chapter text/);
  } finally {
    await fs.rm(parent, { recursive: true, force: true });
  }
});
