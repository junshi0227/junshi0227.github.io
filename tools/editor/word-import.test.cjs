const test = require('node:test');
const assert = require('node:assert/strict');
const { sanitizeWordHTML } = require('./word-import.cjs');

test('Word styling and images survive while executable content is removed', () => {
  const html = '<html><head><style>.title{font-family:Arial;color:red}</style><script>alert(1)</script></head><body><p class="title" onclick="alert(2)">标题</p><img src="index.files/image001.jpg"><a href="javascript:alert(3)">链接</a></body></html>';
  const clean = sanitizeWordHTML(html);
  assert.match(clean, /font-family:Arial/);
  assert.match(clean, /index\.files\/image001\.jpg/);
  assert.doesNotMatch(clean, /<script|onclick=|javascript:/i);
});
