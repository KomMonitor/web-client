import buble from '@rollup/plugin-buble';
import copy from 'rollup-plugin-copy';
let copyVim = copy({
  targets: [{ src: require.resolve('cm5-vim/vim.js').replace(/\\/g, '/'), dest: './keymap' }],
});
export default [
  {
    input: 'src/codemirror.js',
    output: {
      banner:
        "// CodeMirror, copyright (c) by Marijn Haverbeke and others\n// Distributed under an MIT license: https://codemirror.net/5/LICENSE\n\n// This is CodeMirror (https://codemirror.net/5), a code editor\n// implemented in JavaScript on top of the browser's DOM.\n//\n// You can find some technical background for some of the code below\n// at http://marijnhaverbeke.nl/blog/#cm-internals .\n",
      format: 'umd',
      file: 'lib/codemirror.js',
      name: 'CodeMirror',
    },
    plugins: [buble({ namedFunctionExpressions: !1 }), copyVim],
  },
  {
    input: ['src/addon/runmode/runmode-standalone.js'],
    output: {
      format: 'iife',
      file: 'addon/runmode/runmode-standalone.js',
      name: 'CodeMirror',
      freeze: !1,
    },
    plugins: [buble({ namedFunctionExpressions: !1 })],
  },
  {
    input: ['src/addon/runmode/runmode.node.js'],
    output: {
      format: 'cjs',
      file: 'addon/runmode/runmode.node.js',
      name: 'CodeMirror',
      freeze: !1,
    },
    plugins: [buble({ namedFunctionExpressions: !1 })],
  },
];
