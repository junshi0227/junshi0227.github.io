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
