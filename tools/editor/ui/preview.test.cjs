const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

test('new draft opens a visible article preview', async () => {
  const dir = __dirname;
  const dom = new JSDOM(fs.readFileSync(path.join(dir, 'index.html'), 'utf8'), {
    url: 'http://127.0.0.1:4001/', runScripts: 'outside-only'
  });
  const { window } = dom;
  window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  window.HTMLDialogElement.prototype.close = function () { this.open = false; };
  class FakeEditor {
    constructor() { this.value = ''; }
    setMarkdown(value) { this.value = value; }
    getMarkdown() { return this.value; }
    getHTML() { return `<p>${this.value}</p>`; }
    on() {}
  }
  window.toastui = { Editor: FakeEditor };
  window.fetch = async (url, options = {}) => ({
    ok: true,
    json: async () => url === '/api/init'
      ? { token: 'test', posts: [], previewPort: 4002 }
      : { post: { id: 'draft:test-article', slug: 'test-article', status: 'draft', title: '测试文章', date: '2026-10-06 12:00:00', categories: [], tags: [], body: '正文' } }
  });
  window.eval(fs.readFileSync(path.join(dir, 'app.js'), 'utf8'));
  await new Promise(resolve => setTimeout(resolve, 0));
  window.document.getElementById('title').value = '测试文章';
  window.document.getElementById('preview').click();
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(window.document.getElementById('preview-dialog')?.open, true);
  window.document.getElementById('close-preview').click();
  assert.equal(window.document.getElementById('preview-dialog').open, false);
  window.open = () => { throw Error('发布结果不应依赖弹出窗口'); };
  window.document.getElementById('publish').click();
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(window.document.getElementById('publish-result').hidden, false);
  dom.window.close();
});

test('bundled browser editor starts and loads the article list', async () => {
  const dir = __dirname;
  const dom = new JSDOM(fs.readFileSync(path.join(dir, 'index.html'), 'utf8'), {
    url: 'http://127.0.0.1:4001/', runScripts: 'outside-only', pretendToBeVisual: true
  });
  const { window } = dom;
  window.fetch = async () => ({ ok: true, json: async () => ({ token: 'test', posts: [{ id: 'post:example', slug: 'example', title: '已有文章', date: '2026-10-08 10:00:00', status: 'post' }] }) });
  const bundle = fs.readFileSync(path.join(dir, 'editor.bundle.js'), 'utf8');
  window.eval(bundle);
  window.eval(fs.readFileSync(path.join(dir, '../../../node_modules/@toast-ui/editor/dist/i18n/zh-cn.js'), 'utf8'));
  window.eval(fs.readFileSync(path.join(dir, 'app.js'), 'utf8'));
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.ok(window.document.querySelector('.toastui-editor-toolbar'));
  assert.equal(window.document.getElementById('post-count').textContent, '1');
  assert.equal(window.document.getElementById('notice').hidden, true);
  dom.window.close();
});

test('Word import opens its formatted page and PDF link', async () => {
  const dir = __dirname;
  const dom = new JSDOM(fs.readFileSync(path.join(dir, 'index.html'), 'utf8'), { url: 'http://127.0.0.1:4001/', runScripts: 'outside-only' });
  const { window } = dom;
  window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  class FakeEditor {
    setMarkdown() {}
    on() {}
  }
  window.toastui = { Editor: FakeEditor };
  const imported = { id: 'draft:word-test', slug: 'word-test', status: 'draft', title: 'Word测试', date: '2026-10-08 10:00:00', categories: [], tags: [], body: '<iframe src="/word/word-test/index.html"></iframe>', wordUrl: '/word/word-test/index.html', wordPdfUrl: '/word/word-test/index.pdf' };
  window.fetch = async url => ({ ok: true, json: async () => url === '/api/import-word' ? { post: imported } : { token: 'test', posts: [] } });
  window.eval(fs.readFileSync(path.join(dir, 'app.js'), 'utf8'));
  await new Promise(resolve => setTimeout(resolve, 0));
  const file = new window.File(['sample'], 'sample.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  const input = window.document.getElementById('word-file');
  input.onchange({ target: { files: [file], value: '' } });
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(window.document.getElementById('word-surface').hidden, false);
  assert.equal(window.document.getElementById('editor').hidden, true);
  assert.equal(window.document.getElementById('word-pdf').hidden, false);
  window.document.getElementById('preview').click();
  assert.equal(window.document.getElementById('preview-dialog').open, true);
  assert.ok(window.document.getElementById('preview-frame').src.endsWith('/word/word-test/index.html'));
  dom.window.close();
});
