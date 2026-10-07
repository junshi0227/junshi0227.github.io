const path = require('node:path');
const esbuild = require('esbuild');

const uiDir = path.join(__dirname, 'ui');
esbuild.buildSync({
  entryPoints: [path.join(uiDir, 'editor-entry.js')],
  outfile: path.join(uiDir, 'editor.bundle.js'),
  bundle: true,
  platform: 'browser',
  format: 'iife',
  minify: true
});
console.log('已生成写作台排版编辑器资源。');
