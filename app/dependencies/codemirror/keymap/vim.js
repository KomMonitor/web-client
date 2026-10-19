!(function (e) {
  'object' == typeof exports && 'object' == typeof module
    ? e(
        require('../lib/codemirror'),
        require('../addon/search/searchcursor'),
        require('../addon/dialog/dialog'),
        require('../addon/edit/matchbrackets.js')
      )
    : 'function' == typeof define && define.amd
      ? define(
          [
            '../lib/codemirror',
            '../addon/search/searchcursor',
            '../addon/dialog/dialog',
            '../addon/edit/matchbrackets',
          ],
          e
        )
      : e(CodeMirror);
})(function (e) {
  'use strict';
  var t;
  e.Vim =
    (((t = e).Vim = (function (e) {
      var t = e.Pos;
      function n(e, n) {
        var r = e.state.vim;
        if (!r || r.insertMode) return n.head;
        var o = r.sel.head;
        return o
          ? r.visualBlock && n.head.line != o.line
            ? void 0
            : n.from() != n.anchor || n.empty() || n.head.line != o.line || n.head.ch == o.ch
              ? n.head
              : new t(n.head.line, n.head.ch - 1)
          : n.head;
      }
      var r = [
          { keys: '<Left>', type: 'keyToKey', toKeys: 'h' },
          { keys: '<Right>', type: 'keyToKey', toKeys: 'l' },
          { keys: '<Up>', type: 'keyToKey', toKeys: 'k' },
          { keys: '<Down>', type: 'keyToKey', toKeys: 'j' },
          { keys: 'g<Up>', type: 'keyToKey', toKeys: 'gk' },
          { keys: 'g<Down>', type: 'keyToKey', toKeys: 'gj' },
          { keys: '<Space>', type: 'keyToKey', toKeys: 'l' },
          { keys: '<BS>', type: 'keyToKey', toKeys: 'h', context: 'normal' },
          { keys: '<Del>', type: 'keyToKey', toKeys: 'x', context: 'normal' },
          { keys: '<C-Space>', type: 'keyToKey', toKeys: 'W' },
          { keys: '<C-BS>', type: 'keyToKey', toKeys: 'B', context: 'normal' },
          { keys: '<S-Space>', type: 'keyToKey', toKeys: 'w' },
          { keys: '<S-BS>', type: 'keyToKey', toKeys: 'b', context: 'normal' },
          { keys: '<C-n>', type: 'keyToKey', toKeys: 'j' },
          { keys: '<C-p>', type: 'keyToKey', toKeys: 'k' },
          { keys: '<C-[>', type: 'keyToKey', toKeys: '<Esc>' },
          { keys: '<C-c>', type: 'keyToKey', toKeys: '<Esc>' },
          { keys: '<C-[>', type: 'keyToKey', toKeys: '<Esc>', context: 'insert' },
          { keys: '<C-c>', type: 'keyToKey', toKeys: '<Esc>', context: 'insert' },
          { keys: '<C-Esc>', type: 'keyToKey', toKeys: '<Esc>' },
          { keys: '<C-Esc>', type: 'keyToKey', toKeys: '<Esc>', context: 'insert' },
          { keys: 's', type: 'keyToKey', toKeys: 'cl', context: 'normal' },
          { keys: 's', type: 'keyToKey', toKeys: 'c', context: 'visual' },
          { keys: 'S', type: 'keyToKey', toKeys: 'cc', context: 'normal' },
          { keys: 'S', type: 'keyToKey', toKeys: 'VdO', context: 'visual' },
          { keys: '<Home>', type: 'keyToKey', toKeys: '0' },
          { keys: '<End>', type: 'keyToKey', toKeys: '$' },
          { keys: '<PageUp>', type: 'keyToKey', toKeys: '<C-b>' },
          { keys: '<PageDown>', type: 'keyToKey', toKeys: '<C-f>' },
          { keys: '<CR>', type: 'keyToKey', toKeys: 'j^', context: 'normal' },
          { keys: '<Ins>', type: 'keyToKey', toKeys: 'i', context: 'normal' },
          { keys: '<Ins>', type: 'action', action: 'toggleOverwrite', context: 'insert' },
          {
            keys: 'H',
            type: 'motion',
            motion: 'moveToTopLine',
            motionArgs: { linewise: !0, toJumplist: !0 },
          },
          {
            keys: 'M',
            type: 'motion',
            motion: 'moveToMiddleLine',
            motionArgs: { linewise: !0, toJumplist: !0 },
          },
          {
            keys: 'L',
            type: 'motion',
            motion: 'moveToBottomLine',
            motionArgs: { linewise: !0, toJumplist: !0 },
          },
          { keys: 'h', type: 'motion', motion: 'moveByCharacters', motionArgs: { forward: !1 } },
          { keys: 'l', type: 'motion', motion: 'moveByCharacters', motionArgs: { forward: !0 } },
          {
            keys: 'j',
            type: 'motion',
            motion: 'moveByLines',
            motionArgs: { forward: !0, linewise: !0 },
          },
          {
            keys: 'k',
            type: 'motion',
            motion: 'moveByLines',
            motionArgs: { forward: !1, linewise: !0 },
          },
          { keys: 'gj', type: 'motion', motion: 'moveByDisplayLines', motionArgs: { forward: !0 } },
          { keys: 'gk', type: 'motion', motion: 'moveByDisplayLines', motionArgs: { forward: !1 } },
          {
            keys: 'w',
            type: 'motion',
            motion: 'moveByWords',
            motionArgs: { forward: !0, wordEnd: !1 },
          },
          {
            keys: 'W',
            type: 'motion',
            motion: 'moveByWords',
            motionArgs: { forward: !0, wordEnd: !1, bigWord: !0 },
          },
          {
            keys: 'e',
            type: 'motion',
            motion: 'moveByWords',
            motionArgs: { forward: !0, wordEnd: !0, inclusive: !0 },
          },
          {
            keys: 'E',
            type: 'motion',
            motion: 'moveByWords',
            motionArgs: { forward: !0, wordEnd: !0, bigWord: !0, inclusive: !0 },
          },
          {
            keys: 'b',
            type: 'motion',
            motion: 'moveByWords',
            motionArgs: { forward: !1, wordEnd: !1 },
          },
          {
            keys: 'B',
            type: 'motion',
            motion: 'moveByWords',
            motionArgs: { forward: !1, wordEnd: !1, bigWord: !0 },
          },
          {
            keys: 'ge',
            type: 'motion',
            motion: 'moveByWords',
            motionArgs: { forward: !1, wordEnd: !0, inclusive: !0 },
          },
          {
            keys: 'gE',
            type: 'motion',
            motion: 'moveByWords',
            motionArgs: { forward: !1, wordEnd: !0, bigWord: !0, inclusive: !0 },
          },
          {
            keys: '{',
            type: 'motion',
            motion: 'moveByParagraph',
            motionArgs: { forward: !1, toJumplist: !0 },
          },
          {
            keys: '}',
            type: 'motion',
            motion: 'moveByParagraph',
            motionArgs: { forward: !0, toJumplist: !0 },
          },
          { keys: '(', type: 'motion', motion: 'moveBySentence', motionArgs: { forward: !1 } },
          { keys: ')', type: 'motion', motion: 'moveBySentence', motionArgs: { forward: !0 } },
          { keys: '<C-f>', type: 'motion', motion: 'moveByPage', motionArgs: { forward: !0 } },
          { keys: '<C-b>', type: 'motion', motion: 'moveByPage', motionArgs: { forward: !1 } },
          {
            keys: '<C-d>',
            type: 'motion',
            motion: 'moveByScroll',
            motionArgs: { forward: !0, explicitRepeat: !0 },
          },
          {
            keys: '<C-u>',
            type: 'motion',
            motion: 'moveByScroll',
            motionArgs: { forward: !1, explicitRepeat: !0 },
          },
          {
            keys: 'gg',
            type: 'motion',
            motion: 'moveToLineOrEdgeOfDocument',
            motionArgs: { forward: !1, explicitRepeat: !0, linewise: !0, toJumplist: !0 },
          },
          {
            keys: 'G',
            type: 'motion',
            motion: 'moveToLineOrEdgeOfDocument',
            motionArgs: { forward: !0, explicitRepeat: !0, linewise: !0, toJumplist: !0 },
          },
          { keys: 'g$', type: 'motion', motion: 'moveToEndOfDisplayLine' },
          { keys: 'g^', type: 'motion', motion: 'moveToStartOfDisplayLine' },
          { keys: 'g0', type: 'motion', motion: 'moveToStartOfDisplayLine' },
          { keys: '0', type: 'motion', motion: 'moveToStartOfLine' },
          { keys: '^', type: 'motion', motion: 'moveToFirstNonWhiteSpaceCharacter' },
          {
            keys: '+',
            type: 'motion',
            motion: 'moveByLines',
            motionArgs: { forward: !0, toFirstChar: !0 },
          },
          {
            keys: '-',
            type: 'motion',
            motion: 'moveByLines',
            motionArgs: { forward: !1, toFirstChar: !0 },
          },
          {
            keys: '_',
            type: 'motion',
            motion: 'moveByLines',
            motionArgs: { forward: !0, toFirstChar: !0, repeatOffset: -1 },
          },
          { keys: '$', type: 'motion', motion: 'moveToEol', motionArgs: { inclusive: !0 } },
          {
            keys: '%',
            type: 'motion',
            motion: 'moveToMatchedSymbol',
            motionArgs: { inclusive: !0, toJumplist: !0 },
          },
          {
            keys: 'f<character>',
            type: 'motion',
            motion: 'moveToCharacter',
            motionArgs: { forward: !0, inclusive: !0 },
          },
          {
            keys: 'F<character>',
            type: 'motion',
            motion: 'moveToCharacter',
            motionArgs: { forward: !1 },
          },
          {
            keys: 't<character>',
            type: 'motion',
            motion: 'moveTillCharacter',
            motionArgs: { forward: !0, inclusive: !0 },
          },
          {
            keys: 'T<character>',
            type: 'motion',
            motion: 'moveTillCharacter',
            motionArgs: { forward: !1 },
          },
          {
            keys: ';',
            type: 'motion',
            motion: 'repeatLastCharacterSearch',
            motionArgs: { forward: !0 },
          },
          {
            keys: ',',
            type: 'motion',
            motion: 'repeatLastCharacterSearch',
            motionArgs: { forward: !1 },
          },
          {
            keys: "'<character>",
            type: 'motion',
            motion: 'goToMark',
            motionArgs: { toJumplist: !0, linewise: !0 },
          },
          {
            keys: '`<character>',
            type: 'motion',
            motion: 'goToMark',
            motionArgs: { toJumplist: !0 },
          },
          { keys: ']`', type: 'motion', motion: 'jumpToMark', motionArgs: { forward: !0 } },
          { keys: '[`', type: 'motion', motion: 'jumpToMark', motionArgs: { forward: !1 } },
          {
            keys: "]'",
            type: 'motion',
            motion: 'jumpToMark',
            motionArgs: { forward: !0, linewise: !0 },
          },
          {
            keys: "['",
            type: 'motion',
            motion: 'jumpToMark',
            motionArgs: { forward: !1, linewise: !0 },
          },
          {
            keys: ']p',
            type: 'action',
            action: 'paste',
            isEdit: !0,
            actionArgs: { after: !0, isEdit: !0, matchIndent: !0 },
          },
          {
            keys: '[p',
            type: 'action',
            action: 'paste',
            isEdit: !0,
            actionArgs: { after: !1, isEdit: !0, matchIndent: !0 },
          },
          {
            keys: ']<character>',
            type: 'motion',
            motion: 'moveToSymbol',
            motionArgs: { forward: !0, toJumplist: !0 },
          },
          {
            keys: '[<character>',
            type: 'motion',
            motion: 'moveToSymbol',
            motionArgs: { forward: !1, toJumplist: !0 },
          },
          { keys: '|', type: 'motion', motion: 'moveToColumn' },
          { keys: 'o', type: 'motion', motion: 'moveToOtherHighlightedEnd', context: 'visual' },
          {
            keys: 'O',
            type: 'motion',
            motion: 'moveToOtherHighlightedEnd',
            motionArgs: { sameLine: !0 },
            context: 'visual',
          },
          { keys: 'd', type: 'operator', operator: 'delete' },
          { keys: 'y', type: 'operator', operator: 'yank' },
          { keys: 'c', type: 'operator', operator: 'change' },
          { keys: '=', type: 'operator', operator: 'indentAuto' },
          { keys: '>', type: 'operator', operator: 'indent', operatorArgs: { indentRight: !0 } },
          { keys: '<', type: 'operator', operator: 'indent', operatorArgs: { indentRight: !1 } },
          { keys: 'g~', type: 'operator', operator: 'changeCase' },
          {
            keys: 'gu',
            type: 'operator',
            operator: 'changeCase',
            operatorArgs: { toLower: !0 },
            isEdit: !0,
          },
          {
            keys: 'gU',
            type: 'operator',
            operator: 'changeCase',
            operatorArgs: { toLower: !1 },
            isEdit: !0,
          },
          {
            keys: 'n',
            type: 'motion',
            motion: 'findNext',
            motionArgs: { forward: !0, toJumplist: !0 },
          },
          {
            keys: 'N',
            type: 'motion',
            motion: 'findNext',
            motionArgs: { forward: !1, toJumplist: !0 },
          },
          {
            keys: 'gn',
            type: 'motion',
            motion: 'findAndSelectNextInclusive',
            motionArgs: { forward: !0 },
          },
          {
            keys: 'gN',
            type: 'motion',
            motion: 'findAndSelectNextInclusive',
            motionArgs: { forward: !1 },
          },
          {
            keys: 'x',
            type: 'operatorMotion',
            operator: 'delete',
            motion: 'moveByCharacters',
            motionArgs: { forward: !0 },
            operatorMotionArgs: { visualLine: !1 },
          },
          {
            keys: 'X',
            type: 'operatorMotion',
            operator: 'delete',
            motion: 'moveByCharacters',
            motionArgs: { forward: !1 },
            operatorMotionArgs: { visualLine: !0 },
          },
          {
            keys: 'D',
            type: 'operatorMotion',
            operator: 'delete',
            motion: 'moveToEol',
            motionArgs: { inclusive: !0 },
            context: 'normal',
          },
          {
            keys: 'D',
            type: 'operator',
            operator: 'delete',
            operatorArgs: { linewise: !0 },
            context: 'visual',
          },
          {
            keys: 'Y',
            type: 'operatorMotion',
            operator: 'yank',
            motion: 'expandToLine',
            motionArgs: { linewise: !0 },
            context: 'normal',
          },
          {
            keys: 'Y',
            type: 'operator',
            operator: 'yank',
            operatorArgs: { linewise: !0 },
            context: 'visual',
          },
          {
            keys: 'C',
            type: 'operatorMotion',
            operator: 'change',
            motion: 'moveToEol',
            motionArgs: { inclusive: !0 },
            context: 'normal',
          },
          {
            keys: 'C',
            type: 'operator',
            operator: 'change',
            operatorArgs: { linewise: !0 },
            context: 'visual',
          },
          {
            keys: '~',
            type: 'operatorMotion',
            operator: 'changeCase',
            motion: 'moveByCharacters',
            motionArgs: { forward: !0 },
            operatorArgs: { shouldMoveCursor: !0 },
            context: 'normal',
          },
          { keys: '~', type: 'operator', operator: 'changeCase', context: 'visual' },
          {
            keys: '<C-u>',
            type: 'operatorMotion',
            operator: 'delete',
            motion: 'moveToStartOfLine',
            context: 'insert',
          },
          {
            keys: '<C-w>',
            type: 'operatorMotion',
            operator: 'delete',
            motion: 'moveByWords',
            motionArgs: { forward: !1, wordEnd: !1 },
            context: 'insert',
          },
          { keys: '<C-w>', type: 'idle', context: 'normal' },
          { keys: '<C-i>', type: 'action', action: 'jumpListWalk', actionArgs: { forward: !0 } },
          { keys: '<C-o>', type: 'action', action: 'jumpListWalk', actionArgs: { forward: !1 } },
          {
            keys: '<C-e>',
            type: 'action',
            action: 'scroll',
            actionArgs: { forward: !0, linewise: !0 },
          },
          {
            keys: '<C-y>',
            type: 'action',
            action: 'scroll',
            actionArgs: { forward: !1, linewise: !0 },
          },
          {
            keys: 'a',
            type: 'action',
            action: 'enterInsertMode',
            isEdit: !0,
            actionArgs: { insertAt: 'charAfter' },
            context: 'normal',
          },
          {
            keys: 'A',
            type: 'action',
            action: 'enterInsertMode',
            isEdit: !0,
            actionArgs: { insertAt: 'eol' },
            context: 'normal',
          },
          {
            keys: 'A',
            type: 'action',
            action: 'enterInsertMode',
            isEdit: !0,
            actionArgs: { insertAt: 'endOfSelectedArea' },
            context: 'visual',
          },
          {
            keys: 'i',
            type: 'action',
            action: 'enterInsertMode',
            isEdit: !0,
            actionArgs: { insertAt: 'inplace' },
            context: 'normal',
          },
          {
            keys: 'gi',
            type: 'action',
            action: 'enterInsertMode',
            isEdit: !0,
            actionArgs: { insertAt: 'lastEdit' },
            context: 'normal',
          },
          {
            keys: 'I',
            type: 'action',
            action: 'enterInsertMode',
            isEdit: !0,
            actionArgs: { insertAt: 'firstNonBlank' },
            context: 'normal',
          },
          {
            keys: 'gI',
            type: 'action',
            action: 'enterInsertMode',
            isEdit: !0,
            actionArgs: { insertAt: 'bol' },
            context: 'normal',
          },
          {
            keys: 'I',
            type: 'action',
            action: 'enterInsertMode',
            isEdit: !0,
            actionArgs: { insertAt: 'startOfSelectedArea' },
            context: 'visual',
          },
          {
            keys: 'o',
            type: 'action',
            action: 'newLineAndEnterInsertMode',
            isEdit: !0,
            interlaceInsertRepeat: !0,
            actionArgs: { after: !0 },
            context: 'normal',
          },
          {
            keys: 'O',
            type: 'action',
            action: 'newLineAndEnterInsertMode',
            isEdit: !0,
            interlaceInsertRepeat: !0,
            actionArgs: { after: !1 },
            context: 'normal',
          },
          { keys: 'v', type: 'action', action: 'toggleVisualMode' },
          { keys: 'V', type: 'action', action: 'toggleVisualMode', actionArgs: { linewise: !0 } },
          {
            keys: '<C-v>',
            type: 'action',
            action: 'toggleVisualMode',
            actionArgs: { blockwise: !0 },
          },
          {
            keys: '<C-q>',
            type: 'action',
            action: 'toggleVisualMode',
            actionArgs: { blockwise: !0 },
          },
          { keys: 'gv', type: 'action', action: 'reselectLastSelection' },
          { keys: 'J', type: 'action', action: 'joinLines', isEdit: !0 },
          {
            keys: 'gJ',
            type: 'action',
            action: 'joinLines',
            actionArgs: { keepSpaces: !0 },
            isEdit: !0,
          },
          {
            keys: 'p',
            type: 'action',
            action: 'paste',
            isEdit: !0,
            actionArgs: { after: !0, isEdit: !0 },
          },
          {
            keys: 'P',
            type: 'action',
            action: 'paste',
            isEdit: !0,
            actionArgs: { after: !1, isEdit: !0 },
          },
          { keys: 'r<character>', type: 'action', action: 'replace', isEdit: !0 },
          { keys: '@<character>', type: 'action', action: 'replayMacro' },
          { keys: 'q<character>', type: 'action', action: 'enterMacroRecordMode' },
          {
            keys: 'R',
            type: 'action',
            action: 'enterInsertMode',
            isEdit: !0,
            actionArgs: { replace: !0 },
            context: 'normal',
          },
          {
            keys: 'R',
            type: 'operator',
            operator: 'change',
            operatorArgs: { linewise: !0, fullLine: !0 },
            context: 'visual',
            exitVisualBlock: !0,
          },
          { keys: 'u', type: 'action', action: 'undo', context: 'normal' },
          {
            keys: 'u',
            type: 'operator',
            operator: 'changeCase',
            operatorArgs: { toLower: !0 },
            context: 'visual',
            isEdit: !0,
          },
          {
            keys: 'U',
            type: 'operator',
            operator: 'changeCase',
            operatorArgs: { toLower: !1 },
            context: 'visual',
            isEdit: !0,
          },
          { keys: '<C-r>', type: 'action', action: 'redo' },
          { keys: 'm<character>', type: 'action', action: 'setMark' },
          { keys: '"<character>', type: 'action', action: 'setRegister' },
          {
            keys: 'zz',
            type: 'action',
            action: 'scrollToCursor',
            actionArgs: { position: 'center' },
          },
          {
            keys: 'z.',
            type: 'action',
            action: 'scrollToCursor',
            actionArgs: { position: 'center' },
            motion: 'moveToFirstNonWhiteSpaceCharacter',
          },
          { keys: 'zt', type: 'action', action: 'scrollToCursor', actionArgs: { position: 'top' } },
          {
            keys: 'z<CR>',
            type: 'action',
            action: 'scrollToCursor',
            actionArgs: { position: 'top' },
            motion: 'moveToFirstNonWhiteSpaceCharacter',
          },
          {
            keys: 'zb',
            type: 'action',
            action: 'scrollToCursor',
            actionArgs: { position: 'bottom' },
          },
          {
            keys: 'z-',
            type: 'action',
            action: 'scrollToCursor',
            actionArgs: { position: 'bottom' },
            motion: 'moveToFirstNonWhiteSpaceCharacter',
          },
          { keys: '.', type: 'action', action: 'repeatLastEdit' },
          {
            keys: '<C-a>',
            type: 'action',
            action: 'incrementNumberToken',
            isEdit: !0,
            actionArgs: { increase: !0, backtrack: !1 },
          },
          {
            keys: '<C-x>',
            type: 'action',
            action: 'incrementNumberToken',
            isEdit: !0,
            actionArgs: { increase: !1, backtrack: !1 },
          },
          {
            keys: '<C-t>',
            type: 'action',
            action: 'indent',
            actionArgs: { indentRight: !0 },
            context: 'insert',
          },
          {
            keys: '<C-d>',
            type: 'action',
            action: 'indent',
            actionArgs: { indentRight: !1 },
            context: 'insert',
          },
          { keys: 'a<character>', type: 'motion', motion: 'textObjectManipulation' },
          {
            keys: 'i<character>',
            type: 'motion',
            motion: 'textObjectManipulation',
            motionArgs: { textObjectInner: !0 },
          },
          {
            keys: '/',
            type: 'search',
            searchArgs: { forward: !0, querySrc: 'prompt', toJumplist: !0 },
          },
          {
            keys: '?',
            type: 'search',
            searchArgs: { forward: !1, querySrc: 'prompt', toJumplist: !0 },
          },
          {
            keys: '*',
            type: 'search',
            searchArgs: {
              forward: !0,
              querySrc: 'wordUnderCursor',
              wholeWordOnly: !0,
              toJumplist: !0,
            },
          },
          {
            keys: '#',
            type: 'search',
            searchArgs: {
              forward: !1,
              querySrc: 'wordUnderCursor',
              wholeWordOnly: !0,
              toJumplist: !0,
            },
          },
          {
            keys: 'g*',
            type: 'search',
            searchArgs: { forward: !0, querySrc: 'wordUnderCursor', toJumplist: !0 },
          },
          {
            keys: 'g#',
            type: 'search',
            searchArgs: { forward: !1, querySrc: 'wordUnderCursor', toJumplist: !0 },
          },
          { keys: ':', type: 'ex' },
        ],
        o = r.length,
        i = [
          { name: 'colorscheme', shortName: 'colo' },
          { name: 'map' },
          { name: 'imap', shortName: 'im' },
          { name: 'nmap', shortName: 'nm' },
          { name: 'vmap', shortName: 'vm' },
          { name: 'unmap' },
          { name: 'write', shortName: 'w' },
          { name: 'undo', shortName: 'u' },
          { name: 'redo', shortName: 'red' },
          { name: 'set', shortName: 'se' },
          { name: 'setlocal', shortName: 'setl' },
          { name: 'setglobal', shortName: 'setg' },
          { name: 'sort', shortName: 'sor' },
          { name: 'substitute', shortName: 's', possiblyAsync: !0 },
          { name: 'nohlsearch', shortName: 'noh' },
          { name: 'yank', shortName: 'y' },
          { name: 'delmarks', shortName: 'delm' },
          { name: 'registers', shortName: 'reg', excludeFromCommandHistory: !0 },
          { name: 'vglobal', shortName: 'v' },
          { name: 'global', shortName: 'g' },
        ];
      function a(t) {
        (t.setOption('disableInput', !0),
          t.setOption('showCursorWhenSelecting', !1),
          e.signal(t, 'vim-mode-change', { mode: 'normal' }),
          t.on('cursorActivity', et),
          _(t),
          e.on(t.getInputField(), 'paste', h(t)));
      }
      function s(t, n) {
        (this == e.keyMap.vim &&
          ((t.options.$customCursor = null), e.rmClass(t.getWrapperElement(), 'cm-fat-cursor')),
          (n && n.attach == l) ||
            (function (t) {
              (t.setOption('disableInput', !1),
                t.off('cursorActivity', et),
                e.off(t.getInputField(), 'paste', h(t)),
                (t.state.vim = null),
                De && clearTimeout(De));
            })(t));
      }
      function l(t, r) {
        (this == e.keyMap.vim &&
          (t.curOp && (t.curOp.selectionChanged = !0),
          (t.options.$customCursor = n),
          e.addClass(t.getWrapperElement(), 'cm-fat-cursor')),
          (r && r.attach == l) || a(t));
      }
      function c(t, n) {
        if (n) {
          if (this[t]) return this[t];
          var r = (function (e) {
            if ("'" == e.charAt(0)) return e.charAt(1);
            var t = e.split(/-(?!$)/),
              n = t[t.length - 1];
            if (1 == t.length && 1 == t[0].length) return !1;
            if (2 == t.length && 'Shift' == t[0] && 1 == n.length) return !1;
            for (var r = !1, o = 0; o < t.length; o++) {
              var i = t[o];
              (i in u ? (t[o] = u[i]) : (r = !0), i in p && (t[o] = p[i]));
            }
            return !!r && (A(n) && (t[t.length - 1] = n.toLowerCase()), '<' + t.join('-') + '>');
          })(t);
          if (!r) return !1;
          var o = D.findKey(n, r);
          return ('function' == typeof o && e.signal(n, 'vim-keypress', r), o);
        }
      }
      e.defineOption('vimMode', !1, function (t, n, r) {
        n && 'vim' != t.getOption('keyMap')
          ? t.setOption('keyMap', 'vim')
          : !n &&
            r != e.Init &&
            /^vim/.test(t.getOption('keyMap')) &&
            t.setOption('keyMap', 'default');
      });
      var u = { Shift: 'S', Ctrl: 'C', Alt: 'A', Cmd: 'D', Mod: 'A', CapsLock: '' },
        p = { Enter: 'CR', Backspace: 'BS', Delete: 'Del', Insert: 'Ins' };
      function h(e) {
        var t = e.state.vim;
        return (
          t.onPasteFn ||
            (t.onPasteFn = function () {
              t.insertMode || (e.setCursor(Y(e.getCursor(), 0, 1)), X.enterInsertMode(e, {}, t));
            }),
          t.onPasteFn
        );
      }
      var f = /[\d]/,
        d = [
          e.isWordChar,
          function (t) {
            return t && !e.isWordChar(t) && !/\s/.test(t);
          },
        ],
        m = [
          function (e) {
            return /\S/.test(e);
          },
        ];
      function g(e, t) {
        for (var n = [], r = e; r < e + t; r++) n.push(String.fromCharCode(r));
        return n;
      }
      var v,
        y = g(65, 26),
        k = g(97, 26),
        C = g(48, 10),
        w = [].concat(y, k, C, ['<', '>']),
        x = [].concat(y, k, C, ['-', '"', '.', ':', '_', '/']);
      try {
        v = new RegExp('^[\\p{Lu}]$', 'u');
      } catch (e) {
        v = /^[A-Z]$/;
      }
      function M(e, t) {
        return t >= e.firstLine() && t <= e.lastLine();
      }
      function S(e) {
        return /^[a-z]$/.test(e);
      }
      function A(e) {
        return v.test(e);
      }
      function b(e) {
        return /^\s*$/.test(e);
      }
      function L(e) {
        return -1 != '.?!'.indexOf(e);
      }
      function T(e, t) {
        for (var n = 0; n < t.length; n++) if (t[n] == e) return !0;
        return !1;
      }
      var R = {};
      function E(e, t, n, r, o) {
        if (void 0 === t && !o) throw Error('defaultValue is required unless callback is provided');
        if ((n || (n = 'string'), (R[e] = { type: n, defaultValue: t, callback: o }), r))
          for (var i = 0; i < r.length; i++) R[r[i]] = R[e];
        t && O(e, t);
      }
      function O(e, t, n, r) {
        var o = R[e],
          i = (r = r || {}).scope;
        if (!o) return new Error('Unknown option: ' + e);
        if ('boolean' == o.type) {
          if (t && !0 !== t) return new Error('Invalid argument: ' + e + '=' + t);
          !1 !== t && (t = !0);
        }
        o.callback
          ? ('local' !== i && o.callback(t, void 0), 'global' !== i && n && o.callback(t, n))
          : ('local' !== i && (o.value = 'boolean' == o.type ? !!t : t),
            'global' !== i && n && (n.state.vim.options[e] = { value: t }));
      }
      function I(e, t, n) {
        var r = R[e],
          o = (n = n || {}).scope;
        if (!r) return new Error('Unknown option: ' + e);
        if (r.callback) {
          var i = t && r.callback(void 0, t);
          return 'global' !== o && void 0 !== i ? i : 'local' !== o ? r.callback() : void 0;
        }
        return ((i = 'global' !== o && t && t.state.vim.options[e]) || ('local' !== o && r) || {})
          .value;
      }
      E('filetype', void 0, 'string', ['ft'], function (e, t) {
        if (void 0 !== t) {
          if (void 0 === e) return 'null' == (n = t.getOption('mode')) ? '' : n;
          var n = '' == e ? 'null' : e;
          t.setOption('mode', n);
        }
      });
      var B,
        K,
        N = function () {
          var e = 100,
            t = -1,
            n = 0,
            r = 0,
            o = new Array(e);
          function i(i, a) {
            (t += a) > n ? (t = n) : t < r && (t = r);
            var s = o[(e + t) % e];
            if (s && !s.find()) {
              var l,
                c = a > 0 ? 1 : -1,
                u = i.getCursor();
              do {
                if ((s = o[(e + (t += c)) % e]) && (l = s.find()) && !re(u, l)) break;
              } while (t < n && t > r);
            }
            return s;
          }
          return {
            cachedCursor: void 0,
            add: function (i, a, s) {
              var l = o[t % e];
              function c(n) {
                var r = ++t % e,
                  a = o[r];
                (a && a.clear(), (o[r] = i.setBookmark(n)));
              }
              if (l) {
                var u = l.find();
                u && !re(u, a) && c(a);
              } else c(a);
              (c(s), (n = t), (r = t - e + 1) < 0 && (r = 0));
            },
            find: function (e, n) {
              var r = t,
                o = i(e, n);
              return ((t = r), o && o.find());
            },
            move: i,
          };
        },
        P = function (e) {
          return e
            ? { changes: e.changes, expectCursorActivityForChange: e.expectCursorActivityForChange }
            : { changes: [], expectCursorActivityForChange: !1 };
        };
      function j() {
        ((this.latestRegister = void 0),
          (this.isPlaying = !1),
          (this.isRecording = !1),
          (this.replaySearchQueries = []),
          (this.onRecordingDone = void 0),
          (this.lastInsertModeChanges = P()));
      }
      function _(e) {
        return (
          e.state.vim ||
            (e.state.vim = {
              inputState: new V(),
              lastEditInputState: void 0,
              lastEditActionCommand: void 0,
              lastHPos: -1,
              lastHSPos: -1,
              lastMotion: null,
              marks: {},
              insertMode: !1,
              insertModeRepeat: void 0,
              visualMode: !1,
              visualLine: !1,
              visualBlock: !1,
              lastSelection: null,
              lastPastedText: null,
              sel: {},
              options: {},
            }),
          e.state.vim
        );
      }
      function H() {
        for (var e in ((B = {
          searchQuery: null,
          searchIsReversed: !1,
          lastSubstituteReplacePart: void 0,
          jumpList: N(),
          macroModeState: new j(),
          lastCharacterSearch: { increment: 0, forward: !0, selectedCharacter: '' },
          registerController: new $({}),
          searchHistoryController: new U(),
          exCommandHistoryController: new U(),
        }),
        R)) {
          var t = R[e];
          t.value = t.defaultValue;
        }
      }
      j.prototype = {
        exitMacroRecordMode: function () {
          var e = B.macroModeState;
          (e.onRecordingDone && e.onRecordingDone(),
            (e.onRecordingDone = void 0),
            (e.isRecording = !1));
        },
        enterMacroRecordMode: function (e, t) {
          var n = B.registerController.getRegister(t);
          if (n) {
            if ((n.clear(), (this.latestRegister = t), e.openDialog)) {
              var r = Pe('span', { class: 'cm-vim-message' }, 'recording @' + t);
              this.onRecordingDone = e.openDialog(r, null, { bottom: !0 });
            }
            this.isRecording = !0;
          }
        },
      };
      var D = {
        enterVimMode: a,
        buildKeyMap: function () {},
        getRegisterController: function () {
          return B.registerController;
        },
        resetVimGlobalState_: H,
        getVimGlobalState_: function () {
          return B;
        },
        maybeInitVimState_: _,
        suppressErrorLogging: !1,
        InsertModeKey: nt,
        map: function (e, t, n) {
          ze.map(e, t, n);
        },
        unmap: function (e, t) {
          return ze.unmap(e, t);
        },
        noremap: function (e, t, n) {
          function i(e) {
            return e ? [e] : ['normal', 'insert', 'visual'];
          }
          for (var a = i(n), s = r.length, l = s - o; l < s && a.length; l++) {
            var c = r[l];
            if (
              !(
                c.keys != t ||
                (n && c.context && c.context !== n) ||
                'ex' === c.type.substr(0, 2) ||
                'key' === c.type.substr(0, 3)
              )
            ) {
              var u = {};
              for (var p in c) u[p] = c[p];
              ((u.keys = e), n && !u.context && (u.context = n), this._mapCommand(u));
              var h = i(c.context);
              a = a.filter(function (e) {
                return -1 === h.indexOf(e);
              });
            }
          }
        },
        mapclear: function (e) {
          var t = r.length,
            n = o,
            i = r.slice(0, t - n);
          if (((r = r.slice(t - n)), e))
            for (var a = i.length - 1; a >= 0; a--) {
              var s = i[a];
              if (e !== s.context)
                if (s.context) this._mapCommand(s);
                else {
                  var l = ['normal', 'insert', 'visual'];
                  for (var c in l)
                    if (l[c] !== e) {
                      var u = {};
                      for (var p in s) u[p] = s[p];
                      ((u.context = l[c]), this._mapCommand(u));
                    }
                }
            }
        },
        setOption: O,
        getOption: I,
        defineOption: E,
        defineEx: function (e, t, n) {
          if (t) {
            if (0 !== e.indexOf(t))
              throw new Error(
                '(Vim.defineEx) "' + t + '" is not a prefix of "' + e + '", command not registered'
              );
          } else t = e;
          ((Qe[e] = n), (ze.commandMap_[t] = { name: e, shortName: t, type: 'api' }));
        },
        handleKey: function (e, t, n) {
          var r = this.findKey(e, t, n);
          if ('function' == typeof r) return r();
        },
        multiSelectHandleKey: function (e, t, n) {
          var r = !1,
            o = D.maybeInitVimState_(e),
            i = o.visualBlock || o.wasInVisualBlock,
            a = e.isInMultiSelectMode();
          if (
            (o.wasInVisualBlock && !a
              ? (o.wasInVisualBlock = !1)
              : a && o.visualBlock && (o.wasInVisualBlock = !0),
            '<Esc>' != t || o.insertMode || o.visualMode || !a || '<Esc>' != o.status)
          )
            if (i || !a || e.inVirtualSelectionMode) r = D.handleKey(e, t, n);
            else {
              var s = at(o);
              e.operation(function () {
                ((e.curOp.isVimOp = !0),
                  e.forEachSelection(function () {
                    var o = e.getCursor('head'),
                      i = e.getCursor('anchor'),
                      a = oe(o, i) ? 0 : -1,
                      l = oe(o, i) ? -1 : 0;
                    ((o = Y(o, 0, a)),
                      (i = Y(i, 0, l)),
                      (e.state.vim.sel.head = o),
                      (e.state.vim.sel.anchor = i),
                      (r = D.handleKey(e, t, n)),
                      e.virtualSelection && (e.state.vim = at(s)));
                  }),
                  e.curOp.cursorActivity && !r && (e.curOp.cursorActivity = !1),
                  (e.state.vim = o));
              }, !0);
            }
          else F(e);
          return (
            !r || o.visualMode || o.insert || o.visualMode == e.somethingSelected() || tt(e, o),
            r
          );
        },
        findKey: function (e, t, n) {
          var o,
            i = _(e);
          function a() {
            if ('<Esc>' == t) {
              if (i.visualMode) ge(e);
              else {
                if (!i.insertMode) return;
                Xe(e);
              }
              return (F(e), !0);
            }
          }
          return !1 ===
            (o = i.insertMode
              ? (function () {
                  if (a()) return !0;
                  for (
                    var n = (i.inputState.keyBuffer = i.inputState.keyBuffer + t),
                      o = 1 == t.length,
                      s = J.matchCommand(n, r, i.inputState, 'insert');
                    n.length > 1 && 'full' != s.type;
                  ) {
                    n = i.inputState.keyBuffer = n.slice(1);
                    var l = J.matchCommand(n, r, i.inputState, 'insert');
                    'none' != l.type && (s = l);
                  }
                  if ('none' == s.type) return (F(e), !1);
                  if ('partial' == s.type)
                    return (
                      K && window.clearTimeout(K),
                      (K = window.setTimeout(function () {
                        i.insertMode && i.inputState.keyBuffer && F(e);
                      }, I('insertModeEscKeysTimeout'))),
                      !o
                    );
                  if ((K && window.clearTimeout(K), o)) {
                    for (var c = e.listSelections(), u = 0; u < c.length; u++) {
                      var p = c[u].head;
                      e.replaceRange('', Y(p, 0, -(n.length - 1)), p, '+input');
                    }
                    B.macroModeState.lastInsertModeChanges.changes.pop();
                  }
                  return (F(e), s.command);
                })()
              : (function () {
                  if (
                    (function () {
                      var r = B.macroModeState;
                      if (r.isRecording) {
                        if ('q' == t) return (r.exitMacroRecordMode(), F(e), !0);
                        'mapping' != n &&
                          (function (e, t) {
                            if (!e.isPlaying) {
                              var n = e.latestRegister,
                                r = B.registerController.getRegister(n);
                              r && r.pushText(t);
                            }
                          })(r, t);
                      }
                    })() ||
                    a()
                  )
                    return !0;
                  var o = (i.inputState.keyBuffer = i.inputState.keyBuffer + t);
                  if (/^[1-9]\d*$/.test(o)) return !0;
                  var s = /^(\d*)(.*)$/.exec(o);
                  if (!s) return (F(e), !1);
                  var l = i.visualMode ? 'visual' : 'normal',
                    c = s[2] || s[1];
                  i.inputState.operatorShortcut &&
                    i.inputState.operatorShortcut.slice(-1) == c &&
                    (c = i.inputState.operatorShortcut);
                  var u = J.matchCommand(c, r, i.inputState, l);
                  return 'none' == u.type
                    ? (F(e), !1)
                    : 'partial' == u.type ||
                        ('clear' == u.type
                          ? (F(e), !0)
                          : ((i.inputState.keyBuffer = ''),
                            (s = /^(\d*)(.*)$/.exec(o))[1] &&
                              '0' != s[1] &&
                              i.inputState.pushRepeatDigit(s[1]),
                            u.command));
                })())
            ? i.insertMode || 1 !== t.length
              ? void 0
              : function () {
                  return !0;
                }
            : !0 === o
              ? function () {
                  return !0;
                }
              : function () {
                  return e.operation(function () {
                    e.curOp.isVimOp = !0;
                    try {
                      'keyToKey' == o.type
                        ? (function (n) {
                            for (var r; n; )
                              ((r = /<\w+-.+?>|<\w+>|./.exec(n)),
                                (t = r[0]),
                                (n = n.substring(r.index + t.length)),
                                D.handleKey(e, t, 'mapping'));
                          })(o.toKeys)
                        : J.processCommand(e, i, o);
                    } catch (t) {
                      throw (
                        (e.state.vim = void 0),
                        _(e),
                        D.suppressErrorLogging || console.log(t),
                        t
                      );
                    }
                    return !0;
                  });
                };
        },
        handleEx: function (e, t) {
          ze.processCommand(e, t);
        },
        defineMotion: function (e, t) {
          q[e] = t;
        },
        defineAction: function (e, t) {
          X[e] = t;
        },
        defineOperator: function (e, t) {
          z[e] = t;
        },
        mapCommand: function (e, t, n, r, o) {
          var i = { keys: e, type: t };
          for (var a in ((i[t] = n), (i[t + 'Args'] = r), o)) i[a] = o[a];
          Ze(i);
        },
        _mapCommand: Ze,
        defineRegister: function (e, t) {
          var n = B.registerController.registers;
          if (!e || 1 != e.length) throw Error('Register name must be 1 character');
          if (n[e]) throw Error('Register already defined ' + e);
          ((n[e] = t), x.push(e));
        },
        exitVisualMode: ge,
        exitInsertMode: Xe,
      };
      function V() {
        ((this.prefixRepeat = []),
          (this.motionRepeat = []),
          (this.operator = null),
          (this.operatorArgs = null),
          (this.motion = null),
          (this.motionArgs = null),
          (this.keyBuffer = []),
          (this.registerName = null));
      }
      function F(t, n) {
        ((t.state.vim.inputState = new V()), e.signal(t, 'vim-command-done', n));
      }
      function W(e, t, n) {
        (this.clear(),
          (this.keyBuffer = [e || '']),
          (this.insertModeChanges = []),
          (this.searchQueries = []),
          (this.linewise = !!t),
          (this.blockwise = !!n));
      }
      function $(e) {
        ((this.registers = e),
          (this.unnamedRegister = e['"'] = new W()),
          (e['.'] = new W()),
          (e[':'] = new W()),
          (e['/'] = new W()));
      }
      function U() {
        ((this.historyBuffer = []), (this.iterator = 0), (this.initialPrefix = null));
      }
      ((V.prototype.pushRepeatDigit = function (e) {
        this.operator
          ? (this.motionRepeat = this.motionRepeat.concat(e))
          : (this.prefixRepeat = this.prefixRepeat.concat(e));
      }),
        (V.prototype.getRepeat = function () {
          var e = 0;
          return (
            (this.prefixRepeat.length > 0 || this.motionRepeat.length > 0) &&
              ((e = 1),
              this.prefixRepeat.length > 0 && (e *= parseInt(this.prefixRepeat.join(''), 10)),
              this.motionRepeat.length > 0 && (e *= parseInt(this.motionRepeat.join(''), 10))),
            e
          );
        }),
        (W.prototype = {
          setText: function (e, t, n) {
            ((this.keyBuffer = [e || '']), (this.linewise = !!t), (this.blockwise = !!n));
          },
          pushText: function (e, t) {
            (t && (this.linewise || this.keyBuffer.push('\n'), (this.linewise = !0)),
              this.keyBuffer.push(e));
          },
          pushInsertModeChanges: function (e) {
            this.insertModeChanges.push(P(e));
          },
          pushSearchQuery: function (e) {
            this.searchQueries.push(e);
          },
          clear: function () {
            ((this.keyBuffer = []),
              (this.insertModeChanges = []),
              (this.searchQueries = []),
              (this.linewise = !1));
          },
          toString: function () {
            return this.keyBuffer.join('');
          },
        }),
        ($.prototype = {
          pushText: function (e, t, n, r, o) {
            if ('_' !== e) {
              r && '\n' !== n.charAt(n.length - 1) && (n += '\n');
              var i = this.isValidRegister(e) ? this.getRegister(e) : null;
              if (i)
                (A(e) ? i.pushText(n, r) : i.setText(n, r, o),
                  this.unnamedRegister.setText(i.toString(), r));
              else {
                switch (t) {
                  case 'yank':
                    this.registers[0] = new W(n, r, o);
                    break;
                  case 'delete':
                  case 'change':
                    -1 == n.indexOf('\n')
                      ? (this.registers['-'] = new W(n, r))
                      : (this.shiftNumericRegisters_(), (this.registers[1] = new W(n, r)));
                }
                this.unnamedRegister.setText(n, r, o);
              }
            }
          },
          getRegister: function (e) {
            return this.isValidRegister(e)
              ? ((e = e.toLowerCase()),
                this.registers[e] || (this.registers[e] = new W()),
                this.registers[e])
              : this.unnamedRegister;
          },
          isValidRegister: function (e) {
            return e && T(e, x);
          },
          shiftNumericRegisters_: function () {
            for (var e = 9; e >= 2; e--) this.registers[e] = this.getRegister('' + (e - 1));
          },
        }),
        (U.prototype = {
          nextMatch: function (e, t) {
            var n = this.historyBuffer,
              r = t ? -1 : 1;
            null === this.initialPrefix && (this.initialPrefix = e);
            for (var o = this.iterator + r; t ? o >= 0 : o < n.length; o += r)
              for (var i = n[o], a = 0; a <= i.length; a++)
                if (this.initialPrefix == i.substring(0, a)) return ((this.iterator = o), i);
            return o >= n.length
              ? ((this.iterator = n.length), this.initialPrefix)
              : o < 0
                ? e
                : void 0;
          },
          pushInput: function (e) {
            var t = this.historyBuffer.indexOf(e);
            (t > -1 && this.historyBuffer.splice(t, 1), e.length && this.historyBuffer.push(e));
          },
          reset: function () {
            ((this.initialPrefix = null), (this.iterator = this.historyBuffer.length));
          },
        }));
      var J = {
          matchCommand: function (e, t, n, r) {
            var o,
              i = (function (e, t, n, r) {
                for (var o, i = [], a = [], s = 0; s < t.length; s++) {
                  var l = t[s];
                  ('insert' == n && 'insert' != l.context) ||
                    (l.context && l.context != n) ||
                    (r.operator && 'action' == l.type) ||
                    !(o = ee(e, l.keys)) ||
                    ('partial' == o && i.push(l), 'full' == o && a.push(l));
                }
                return { partial: i.length && i, full: a.length && a };
              })(e, t, r, n);
            if (!i.full && !i.partial) return { type: 'none' };
            if (!i.full && i.partial) return { type: 'partial' };
            for (var a = 0; a < i.full.length; a++) {
              var s = i.full[a];
              o || (o = s);
            }
            if ('<character>' == o.keys.slice(-11)) {
              var l = (function (e) {
                var t = /^.*(<[^>]+>)$/.exec(e),
                  n = t ? t[1] : e.slice(-1);
                if (n.length > 1)
                  switch (n) {
                    case '<CR>':
                      n = '\n';
                      break;
                    case '<Space>':
                      n = ' ';
                      break;
                    default:
                      n = '';
                  }
                return n;
              })(e);
              if (!l || l.length > 1) return { type: 'clear' };
              n.selectedCharacter = l;
            }
            return { type: 'full', command: o };
          },
          processCommand: function (e, t, n) {
            switch (((t.inputState.repeatOverride = n.repeatOverride), n.type)) {
              case 'motion':
                this.processMotion(e, t, n);
                break;
              case 'operator':
                this.processOperator(e, t, n);
                break;
              case 'operatorMotion':
                this.processOperatorMotion(e, t, n);
                break;
              case 'action':
                this.processAction(e, t, n);
                break;
              case 'search':
                this.processSearch(e, t, n);
                break;
              case 'ex':
              case 'keyToEx':
                this.processEx(e, t, n);
            }
          },
          processMotion: function (e, t, n) {
            ((t.inputState.motion = n.motion),
              (t.inputState.motionArgs = G(n.motionArgs)),
              this.evalInput(e, t));
          },
          processOperator: function (e, t, n) {
            var r = t.inputState;
            if (r.operator) {
              if (r.operator == n.operator)
                return (
                  (r.motion = 'expandToLine'),
                  (r.motionArgs = { linewise: !0 }),
                  void this.evalInput(e, t)
                );
              F(e);
            }
            ((r.operator = n.operator),
              (r.operatorArgs = G(n.operatorArgs)),
              n.keys.length > 1 && (r.operatorShortcut = n.keys),
              n.exitVisualBlock && ((t.visualBlock = !1), de(e)),
              t.visualMode && this.evalInput(e, t));
          },
          processOperatorMotion: function (e, t, n) {
            var r = t.visualMode,
              o = G(n.operatorMotionArgs);
            (o && r && o.visualLine && (t.visualLine = !0),
              this.processOperator(e, t, n),
              r || this.processMotion(e, t, n));
          },
          processAction: function (e, t, n) {
            var r = t.inputState,
              o = r.getRepeat(),
              i = !!o,
              a = G(n.actionArgs) || {};
            (r.selectedCharacter && (a.selectedCharacter = r.selectedCharacter),
              n.operator && this.processOperator(e, t, n),
              n.motion && this.processMotion(e, t, n),
              (n.motion || n.operator) && this.evalInput(e, t),
              (a.repeat = o || 1),
              (a.repeatIsExplicit = i),
              (a.registerName = r.registerName),
              F(e),
              (t.lastMotion = null),
              n.isEdit && this.recordLastEdit(t, r, n),
              X[n.action](e, a, t));
          },
          processSearch: function (t, n, r) {
            if (t.getSearchCursor) {
              var o = r.searchArgs.forward,
                i = r.searchArgs.wholeWordOnly;
              Oe(t).setReversed(!o);
              var a = o ? '/' : '?',
                s = Oe(t).getQuery(),
                l = t.getScrollInfo();
              switch (r.searchArgs.querySrc) {
                case 'prompt':
                  var c = B.macroModeState;
                  c.isPlaying
                    ? f((h = c.replaySearchQueries.shift()), !0, !1)
                    : _e(t, {
                        onClose: function (e) {
                          (t.scrollTo(l.left, l.top), f(e, !0, !0));
                          var n = B.macroModeState;
                          n.isRecording &&
                            (function (e, t) {
                              if (!e.isPlaying) {
                                var n = e.latestRegister,
                                  r = B.registerController.getRegister(n);
                                r && r.pushSearchQuery && r.pushSearchQuery(t);
                              }
                            })(n, e);
                        },
                        prefix: a,
                        desc: '(JavaScript regexp)',
                        onKeyUp: function (n, r, i) {
                          var a,
                            s,
                            c,
                            u = e.keyName(n);
                          'Up' == u || 'Down' == u
                            ? ((a = 'Up' == u),
                              (s = n.target ? n.target.selectionEnd : 0),
                              i((r = B.searchHistoryController.nextMatch(r, a) || '')),
                              s &&
                                n.target &&
                                (n.target.selectionEnd = n.target.selectionStart =
                                  Math.min(s, n.target.value.length)))
                            : 'Left' != u &&
                              'Right' != u &&
                              'Ctrl' != u &&
                              'Alt' != u &&
                              'Shift' != u &&
                              B.searchHistoryController.reset();
                          try {
                            c = He(t, r, !0, !0);
                          } catch (n) {}
                          c
                            ? t.scrollIntoView(Fe(t, !o, c), 30)
                            : (We(t), t.scrollTo(l.left, l.top));
                        },
                        onKeyDown: function (n, r, o) {
                          var i = e.keyName(n);
                          'Esc' == i ||
                          'Ctrl-C' == i ||
                          'Ctrl-[' == i ||
                          ('Backspace' == i && '' == r)
                            ? (B.searchHistoryController.pushInput(r),
                              B.searchHistoryController.reset(),
                              He(t, s),
                              We(t),
                              t.scrollTo(l.left, l.top),
                              e.e_stop(n),
                              F(t),
                              o(),
                              t.focus())
                            : 'Up' == i || 'Down' == i
                              ? e.e_stop(n)
                              : 'Ctrl-U' == i && (e.e_stop(n), o(''));
                        },
                      });
                  break;
                case 'wordUnderCursor':
                  var u = ye(t, !1, 0, !1, !0),
                    p = !0;
                  if ((u || ((u = ye(t, !1, 0, !1, !1)), (p = !1)), !u)) return;
                  var h = t.getLine(u.start.line).substring(u.start.ch, u.end.ch);
                  ((h =
                    p && i ? '\\b' + h + '\\b' : h.replace(/([.?*+$\[\]\/\\(){}|\-])/g, '\\$1')),
                    (B.jumpList.cachedCursor = t.getCursor()),
                    t.setCursor(u.start),
                    f(h, !0, !1));
              }
            }
            function f(e, o, i) {
              (B.searchHistoryController.pushInput(e), B.searchHistoryController.reset());
              try {
                He(t, e, o, i);
              } catch (n) {
                return (je(t, 'Invalid regex: ' + e), void F(t));
              }
              J.processMotion(t, n, {
                type: 'motion',
                motion: 'findNext',
                motionArgs: { forward: !0, toJumplist: r.searchArgs.toJumplist },
              });
            }
          },
          processEx: function (t, n, r) {
            function o(e) {
              (B.exCommandHistoryController.pushInput(e),
                B.exCommandHistoryController.reset(),
                ze.processCommand(t, e),
                F(t));
            }
            function i(n, r, o) {
              var i,
                a,
                s = e.keyName(n);
              (('Esc' == s || 'Ctrl-C' == s || 'Ctrl-[' == s || ('Backspace' == s && '' == r)) &&
                (B.exCommandHistoryController.pushInput(r),
                B.exCommandHistoryController.reset(),
                e.e_stop(n),
                F(t),
                o(),
                t.focus()),
                'Up' == s || 'Down' == s
                  ? (e.e_stop(n),
                    (i = 'Up' == s),
                    (a = n.target ? n.target.selectionEnd : 0),
                    o((r = B.exCommandHistoryController.nextMatch(r, i) || '')),
                    a &&
                      n.target &&
                      (n.target.selectionEnd = n.target.selectionStart =
                        Math.min(a, n.target.value.length)))
                  : 'Ctrl-U' == s
                    ? (e.e_stop(n), o(''))
                    : 'Left' != s &&
                      'Right' != s &&
                      'Ctrl' != s &&
                      'Alt' != s &&
                      'Shift' != s &&
                      B.exCommandHistoryController.reset());
            }
            'keyToEx' == r.type
              ? ze.processCommand(t, r.exArgs.input)
              : n.visualMode
                ? _e(t, {
                    onClose: o,
                    prefix: ':',
                    value: "'<,'>",
                    onKeyDown: i,
                    selectValueOnOpen: !1,
                  })
                : _e(t, { onClose: o, prefix: ':', onKeyDown: i });
          },
          evalInput: function (e, n) {
            var r,
              o,
              i,
              a = n.inputState,
              s = a.motion,
              l = a.motionArgs || {},
              c = a.operator,
              u = a.operatorArgs || {},
              p = a.registerName,
              h = n.sel,
              f = ne(n.visualMode ? Z(e, h.head) : e.getCursor('head')),
              d = ne(n.visualMode ? Z(e, h.anchor) : e.getCursor('anchor')),
              m = ne(f),
              g = ne(d);
            if (
              (c && this.recordLastEdit(n, a),
              (i = void 0 !== a.repeatOverride ? a.repeatOverride : a.getRepeat()) > 0 &&
              l.explicitRepeat
                ? (l.repeatIsExplicit = !0)
                : (l.noRepeat || (!l.explicitRepeat && 0 === i)) &&
                  ((i = 1), (l.repeatIsExplicit = !1)),
              a.selectedCharacter &&
                (l.selectedCharacter = u.selectedCharacter = a.selectedCharacter),
              (l.repeat = i),
              F(e),
              s)
            ) {
              var v = q[s](e, f, l, n, a);
              if (((n.lastMotion = q[s]), !v)) return;
              if (l.toJumplist) {
                var y = B.jumpList,
                  k = y.cachedCursor;
                k ? (ke(e, k, v), delete y.cachedCursor) : ke(e, f, v);
              }
              (v instanceof Array ? ((o = v[0]), (r = v[1])) : (r = v),
                r || (r = ne(f)),
                n.visualMode
                  ? ((n.visualBlock && r.ch === 1 / 0) || (r = Z(e, r)),
                    o && (o = Z(e, o)),
                    (o = o || g),
                    (h.anchor = o),
                    (h.head = r),
                    de(e),
                    be(e, n, '<', oe(o, r) ? o : r),
                    be(e, n, '>', oe(o, r) ? r : o))
                  : c || ((r = Z(e, r)), e.setCursor(r.line, r.ch)));
            }
            if (c) {
              if (u.lastSel) {
                o = g;
                var C = u.lastSel,
                  w = Math.abs(C.head.line - C.anchor.line),
                  x = Math.abs(C.head.ch - C.anchor.ch);
                ((r = C.visualLine
                  ? new t(g.line + w, g.ch)
                  : C.visualBlock
                    ? new t(g.line + w, g.ch + x)
                    : C.head.line == C.anchor.line
                      ? new t(g.line, g.ch + x)
                      : new t(g.line + w, g.ch)),
                  (n.visualMode = !0),
                  (n.visualLine = C.visualLine),
                  (n.visualBlock = C.visualBlock),
                  (h = n.sel = { anchor: o, head: r }),
                  de(e));
              } else
                n.visualMode &&
                  (u.lastSel = {
                    anchor: ne(h.anchor),
                    head: ne(h.head),
                    visualBlock: n.visualBlock,
                    visualLine: n.visualLine,
                  });
              var M, S, A, L, T;
              if (n.visualMode) {
                if (
                  ((M = ie(h.head, h.anchor)),
                  (S = ae(h.head, h.anchor)),
                  (A = n.visualLine || u.linewise),
                  (T = me(
                    e,
                    { anchor: M, head: S },
                    (L = n.visualBlock ? 'block' : A ? 'line' : 'char')
                  )),
                  A)
                ) {
                  var R = T.ranges;
                  if ('block' == L)
                    for (var E = 0; E < R.length; E++) R[E].head.ch = le(e, R[E].head.line);
                  else 'line' == L && (R[0].head = new t(R[0].head.line + 1, 0));
                }
              } else {
                if (((M = ne(o || g)), oe((S = ne(r || m)), M))) {
                  var O = M;
                  ((M = S), (S = O));
                }
                ((A = l.linewise || u.linewise)
                  ? (function (e, t, n) {
                      ((t.ch = 0), (n.ch = 0), n.line++);
                    })(0, M, S)
                  : l.forward &&
                    (function (e, t, n) {
                      var r = e.getRange(t, n);
                      if (/\n\s*$/.test(r)) {
                        var o = r.split('\n');
                        o.pop();
                        for (var i = o.pop(); o.length > 0 && i && b(i); i = o.pop())
                          (n.line--, (n.ch = 0));
                        i ? (n.line--, (n.ch = le(e, n.line))) : (n.ch = 0);
                      }
                    })(e, M, S),
                  (T = me(e, { anchor: M, head: S }, (L = 'char'), !l.inclusive || A)));
              }
              (e.setSelections(T.ranges, T.primary),
                (n.lastMotion = null),
                (u.repeat = i),
                (u.registerName = p),
                (u.linewise = A));
              var I = z[c](e, u, T.ranges, g, r);
              (n.visualMode && ge(e, null != I), I && e.setCursor(I));
            }
          },
          recordLastEdit: function (e, t, n) {
            var r = B.macroModeState;
            r.isPlaying ||
              ((e.lastEditInputState = t),
              (e.lastEditActionCommand = n),
              (r.lastInsertModeChanges.changes = []),
              (r.lastInsertModeChanges.expectCursorActivityForChange = !1),
              (r.lastInsertModeChanges.visualBlock = e.visualBlock
                ? e.sel.head.line - e.sel.anchor.line
                : 0));
          },
        },
        q = {
          moveToTopLine: function (e, n, r) {
            var o = $e(e).top + r.repeat - 1;
            return new t(o, ve(e.getLine(o)));
          },
          moveToMiddleLine: function (e) {
            var n = $e(e),
              r = Math.floor(0.5 * (n.top + n.bottom));
            return new t(r, ve(e.getLine(r)));
          },
          moveToBottomLine: function (e, n, r) {
            var o = $e(e).bottom - r.repeat + 1;
            return new t(o, ve(e.getLine(o)));
          },
          expandToLine: function (e, n, r) {
            return new t(n.line + r.repeat - 1, 1 / 0);
          },
          findNext: function (e, t, n) {
            var r = Oe(e),
              o = r.getQuery();
            if (o) {
              var i = !n.forward;
              return ((i = r.isReversed() ? !i : i), Ve(e, o), Fe(e, i, o, n.repeat));
            }
          },
          findAndSelectNextInclusive: function (n, r, o, i, a) {
            var s = Oe(n),
              l = s.getQuery();
            if (l) {
              var c = !o.forward,
                u = (function (e, n, r, o, i) {
                  return (
                    void 0 === o && (o = 1),
                    e.operation(function () {
                      var a = e.getCursor(),
                        s = e.getSearchCursor(r, a),
                        l = s.find(!n);
                      !i.visualMode && l && re(s.from(), a) && s.find(!n);
                      for (var c = 0; c < o; c++)
                        if (
                          !(l = s.find(n)) &&
                          !(s = e.getSearchCursor(
                            r,
                            n ? new t(e.lastLine()) : new t(e.firstLine(), 0)
                          )).find(n)
                        )
                          return;
                      return [s.from(), s.to()];
                    })
                  );
                })(n, (c = s.isReversed() ? !c : c), l, o.repeat, i);
              if (u) {
                if (a.operator) return u;
                var p = u[0],
                  h = new t(u[1].line, u[1].ch - 1);
                if (i.visualMode) {
                  (i.visualLine || i.visualBlock) &&
                    ((i.visualLine = !1),
                    (i.visualBlock = !1),
                    e.signal(n, 'vim-mode-change', { mode: 'visual', subMode: '' }));
                  var f = i.sel.anchor;
                  if (f)
                    return s.isReversed()
                      ? o.forward
                        ? [f, p]
                        : [f, h]
                      : o.forward
                        ? [f, h]
                        : [f, p];
                } else
                  ((i.visualMode = !0),
                    (i.visualLine = !1),
                    (i.visualBlock = !1),
                    e.signal(n, 'vim-mode-change', { mode: 'visual', subMode: '' }));
                return c ? [h, p] : [p, h];
              }
            }
          },
          goToMark: function (e, t, n, r) {
            var o = Ue(e, r, n.selectedCharacter);
            return o ? (n.linewise ? { line: o.line, ch: ve(e.getLine(o.line)) } : o) : null;
          },
          moveToOtherHighlightedEnd: function (e, n, r, o) {
            if (o.visualBlock && r.sameLine) {
              var i = o.sel;
              return [Z(e, new t(i.anchor.line, i.head.ch)), Z(e, new t(i.head.line, i.anchor.ch))];
            }
            return [o.sel.head, o.sel.anchor];
          },
          jumpToMark: function (e, n, r, o) {
            for (var i = n, a = 0; a < r.repeat; a++) {
              var s = i;
              for (var l in o.marks)
                if (S(l)) {
                  var c = o.marks[l].find();
                  if (!((r.forward ? oe(c, s) : oe(s, c)) || (r.linewise && c.line == s.line))) {
                    var u = re(s, i),
                      p = r.forward ? se(s, c, i) : se(i, c, s);
                    (u || p) && (i = c);
                  }
                }
            }
            return (r.linewise && (i = new t(i.line, ve(e.getLine(i.line)))), i);
          },
          moveByCharacters: function (e, n, r) {
            var o = n,
              i = r.repeat,
              a = r.forward ? o.ch + i : o.ch - i;
            return new t(o.line, a);
          },
          moveByLines: function (e, n, r, o) {
            var i = n,
              a = i.ch;
            switch (o.lastMotion) {
              case this.moveByLines:
              case this.moveByDisplayLines:
              case this.moveByScroll:
              case this.moveToColumn:
              case this.moveToEol:
                a = o.lastHPos;
                break;
              default:
                o.lastHPos = a;
            }
            var s = r.repeat + (r.repeatOffset || 0),
              l = r.forward ? i.line + s : i.line - s,
              c = e.firstLine(),
              u = e.lastLine(),
              p = e.findPosV(i, r.forward ? s : -s, 'line', o.lastHSPos);
            return (
              (r.forward ? p.line > l : p.line < l) && ((l = p.line), (a = p.ch)),
              l < c && i.line == c
                ? this.moveToStartOfLine(e, n, r, o)
                : l > u && i.line == u
                  ? Se(e, n, r, o, !0)
                  : (r.toFirstChar && ((a = ve(e.getLine(l))), (o.lastHPos = a)),
                    (o.lastHSPos = e.charCoords(new t(l, a), 'div').left),
                    new t(l, a))
            );
          },
          moveByDisplayLines: function (e, n, r, o) {
            var i = n;
            switch (o.lastMotion) {
              case this.moveByDisplayLines:
              case this.moveByScroll:
              case this.moveByLines:
              case this.moveToColumn:
              case this.moveToEol:
                break;
              default:
                o.lastHSPos = e.charCoords(i, 'div').left;
            }
            var a = r.repeat;
            if ((l = e.findPosV(i, r.forward ? a : -a, 'line', o.lastHSPos)).hitSide)
              if (r.forward)
                var s = { top: e.charCoords(l, 'div').top + 8, left: o.lastHSPos },
                  l = e.coordsChar(s, 'div');
              else {
                var c = e.charCoords(new t(e.firstLine(), 0), 'div');
                ((c.left = o.lastHSPos), (l = e.coordsChar(c, 'div')));
              }
            return ((o.lastHPos = l.ch), l);
          },
          moveByPage: function (e, t, n) {
            var r = t,
              o = n.repeat;
            return e.findPosV(r, n.forward ? o : -o, 'page');
          },
          moveByParagraph: function (e, t, n) {
            var r = n.forward ? 1 : -1;
            return Te(e, t, n.repeat, r);
          },
          moveBySentence: function (e, n, r) {
            var o = r.forward ? 1 : -1;
            return (function (e, n, r, o) {
              function i(e, t) {
                if (t.pos + t.dir < 0 || t.pos + t.dir >= t.line.length) {
                  if (((t.ln += t.dir), !M(e, t.ln)))
                    return ((t.line = null), (t.ln = null), void (t.pos = null));
                  ((t.line = e.getLine(t.ln)), (t.pos = t.dir > 0 ? 0 : t.line.length - 1));
                } else t.pos += t.dir;
              }
              function a(e, t, n, r) {
                var o = '' === (c = e.getLine(t)),
                  a = { line: c, ln: t, pos: n, dir: r },
                  s = { ln: a.ln, pos: a.pos },
                  l = '' === a.line;
                for (i(e, a); null !== a.line; ) {
                  if (((s.ln = a.ln), (s.pos = a.pos), '' === a.line && !l))
                    return { ln: a.ln, pos: a.pos };
                  if (o && '' !== a.line && !b(a.line[a.pos])) return { ln: a.ln, pos: a.pos };
                  (!L(a.line[a.pos]) ||
                    o ||
                    (a.pos !== a.line.length - 1 && !b(a.line[a.pos + 1])) ||
                    (o = !0),
                    i(e, a));
                }
                var c = e.getLine(s.ln);
                s.pos = 0;
                for (var u = c.length - 1; u >= 0; --u)
                  if (!b(c[u])) {
                    s.pos = u;
                    break;
                  }
                return s;
              }
              function s(e, t, n, r) {
                var o = { line: e.getLine(t), ln: t, pos: n, dir: r },
                  a = { ln: o.ln, pos: null },
                  s = '' === o.line;
                for (i(e, o); null !== o.line; ) {
                  if ('' === o.line && !s) return null !== a.pos ? a : { ln: o.ln, pos: o.pos };
                  if (L(o.line[o.pos]) && null !== a.pos && (o.ln !== a.ln || o.pos + 1 !== a.pos))
                    return a;
                  ('' === o.line || b(o.line[o.pos]) || ((s = !1), (a = { ln: o.ln, pos: o.pos })),
                    i(e, o));
                }
                var l = e.getLine(a.ln);
                a.pos = 0;
                for (var c = 0; c < l.length; ++c)
                  if (!b(l[c])) {
                    a.pos = c;
                    break;
                  }
                return a;
              }
              for (var l = { ln: n.line, pos: n.ch }; r > 0; )
                ((l = o < 0 ? s(e, l.ln, l.pos, o) : a(e, l.ln, l.pos, o)), r--);
              return new t(l.ln, l.pos);
            })(e, n, r.repeat, o);
          },
          moveByScroll: function (e, t, n, r) {
            var o,
              i = e.getScrollInfo(),
              a = n.repeat;
            a || (a = i.clientHeight / (2 * e.defaultTextHeight()));
            var s = e.charCoords(t, 'local');
            if (((n.repeat = a), !(o = q.moveByDisplayLines(e, t, n, r)))) return null;
            var l = e.charCoords(o, 'local');
            return (e.scrollTo(null, i.top + l.top - s.top), o);
          },
          moveByWords: function (e, n, r) {
            return (function (e, n, r, o, i, a) {
              var s = ne(n),
                l = [];
              ((o && !i) || (!o && i)) && r++;
              for (var c = !(o && i), u = 0; u < r; u++) {
                var p = Me(e, n, o, a, c);
                if (!p) {
                  var h = le(e, e.lastLine());
                  l.push(o ? { line: e.lastLine(), from: h, to: h } : { line: 0, from: 0, to: 0 });
                  break;
                }
                (l.push(p), (n = new t(p.line, o ? p.to - 1 : p.from)));
              }
              var f = l.length != r,
                d = l[0],
                m = l.pop();
              return o && !i
                ? (f || (d.from == s.ch && d.line == s.line) || (m = l.pop()),
                  new t(m.line, m.from))
                : o && i
                  ? new t(m.line, m.to - 1)
                  : !o && i
                    ? (f || (d.to == s.ch && d.line == s.line) || (m = l.pop()),
                      new t(m.line, m.to))
                    : new t(m.line, m.from);
            })(e, n, r.repeat, !!r.forward, !!r.wordEnd, !!r.bigWord);
          },
          moveTillCharacter: function (e, t, n) {
            var r = Ae(e, n.repeat, n.forward, n.selectedCharacter),
              o = n.forward ? -1 : 1;
            return (Ce(o, n), r ? ((r.ch += o), r) : null);
          },
          moveToCharacter: function (e, t, n) {
            var r = n.repeat;
            return (Ce(0, n), Ae(e, r, n.forward, n.selectedCharacter) || t);
          },
          moveToSymbol: function (e, n, r) {
            return (
              (function (e, n, r, o) {
                var i = ne(e.getCursor()),
                  a = r ? 1 : -1,
                  s = r ? e.lineCount() : -1,
                  l = i.ch,
                  c = i.line,
                  u = e.getLine(c),
                  p = {
                    lineText: u,
                    nextCh: u.charAt(l),
                    lastCh: null,
                    index: l,
                    symb: o,
                    reverseSymb: (r ? { ')': '(', '}': '{' } : { '(': ')', '{': '}' })[o],
                    forward: r,
                    depth: 0,
                    curMoveThrough: !1,
                  },
                  h = we[o];
                if (!h) return i;
                var f = xe[h].init,
                  d = xe[h].isComplete;
                for (f && f(p); c !== s && n; ) {
                  if (((p.index += a), (p.nextCh = p.lineText.charAt(p.index)), !p.nextCh)) {
                    if (((c += a), (p.lineText = e.getLine(c) || ''), a > 0)) p.index = 0;
                    else {
                      var m = p.lineText.length;
                      p.index = m > 0 ? m - 1 : 0;
                    }
                    p.nextCh = p.lineText.charAt(p.index);
                  }
                  d(p) && ((i.line = c), (i.ch = p.index), n--);
                }
                return p.nextCh || p.curMoveThrough ? new t(c, p.index) : i;
              })(e, r.repeat, r.forward, r.selectedCharacter) || n
            );
          },
          moveToColumn: function (e, n, r, o) {
            var i = r.repeat;
            return (
              (o.lastHPos = i - 1),
              (o.lastHSPos = e.charCoords(n, 'div').left),
              (function (e, n) {
                var r = e.getCursor().line;
                return Z(e, new t(r, n - 1));
              })(e, i)
            );
          },
          moveToEol: function (e, t, n, r) {
            return Se(e, t, n, r, !1);
          },
          moveToFirstNonWhiteSpaceCharacter: function (e, n) {
            var r = n;
            return new t(r.line, ve(e.getLine(r.line)));
          },
          moveToMatchedSymbol: function (e, n) {
            for (var r, o = n, i = o.line, a = o.ch, s = e.getLine(i); a < s.length; a++)
              if ((r = s.charAt(a)) && -1 != '()[]{}'.indexOf(r)) {
                var l = e.getTokenTypeAt(new t(i, a + 1));
                if ('string' !== l && 'comment' !== l) break;
              }
            if (a < s.length) {
              var c = '<' === a || '>' === a ? /[(){}[\]<>]/ : /[(){}[\]]/;
              return e.findMatchingBracket(new t(i, a), { bracketRegex: c }).to;
            }
            return o;
          },
          moveToStartOfLine: function (e, n) {
            return new t(n.line, 0);
          },
          moveToLineOrEdgeOfDocument: function (e, n, r) {
            var o = r.forward ? e.lastLine() : e.firstLine();
            return (
              r.repeatIsExplicit && (o = r.repeat - e.getOption('firstLineNumber')),
              new t(o, ve(e.getLine(o)))
            );
          },
          moveToStartOfDisplayLine: function (e) {
            return (e.execCommand('goLineLeft'), e.getCursor());
          },
          moveToEndOfDisplayLine: function (e) {
            e.execCommand('goLineRight');
            var t = e.getCursor();
            return ('before' == t.sticky && t.ch--, t);
          },
          textObjectManipulation: function (n, r, o, i) {
            var a = o.selectedCharacter;
            'b' == a ? (a = '(') : 'B' == a && (a = '{');
            var s,
              l = !o.textObjectInner;
            if (
              { '(': ')', ')': '(', '{': '}', '}': '{', '[': ']', ']': '[', '<': '>', '>': '<' }[a]
            )
              s = (function (e, n, r, o) {
                var i,
                  a,
                  s = n,
                  l = {
                    '(': /[()]/,
                    ')': /[()]/,
                    '[': /[[\]]/,
                    ']': /[[\]]/,
                    '{': /[{}]/,
                    '}': /[{}]/,
                    '<': /[<>]/,
                    '>': /[<>]/,
                  }[r],
                  c = {
                    '(': '(',
                    ')': '(',
                    '[': '[',
                    ']': '[',
                    '{': '{',
                    '}': '{',
                    '<': '<',
                    '>': '<',
                  }[r],
                  u = e.getLine(s.line).charAt(s.ch) === c ? 1 : 0;
                if (
                  ((i = e.scanForBracket(new t(s.line, s.ch + u), -1, void 0, { bracketRegex: l })),
                  (a = e.scanForBracket(new t(s.line, s.ch + u), 1, void 0, { bracketRegex: l })),
                  !i || !a)
                )
                  return { start: s, end: s };
                if (
                  ((i = i.pos), (a = a.pos), (i.line == a.line && i.ch > a.ch) || i.line > a.line)
                ) {
                  var p = i;
                  ((i = a), (a = p));
                }
                return (o ? (a.ch += 1) : (i.ch += 1), { start: i, end: a });
              })(n, r, a, l);
            else if ({ "'": !0, '"': !0, '`': !0 }[a])
              s = (function (e, n, r, o) {
                var i,
                  a,
                  s,
                  l,
                  c = ne(n),
                  u = e.getLine(c.line).split(''),
                  p = u.indexOf(r);
                if (
                  (c.ch < p ? (c.ch = p) : p < c.ch && u[c.ch] == r && ((a = c.ch), --c.ch),
                  u[c.ch] != r || a)
                )
                  for (s = c.ch; s > -1 && !i; s--) u[s] == r && (i = s + 1);
                else i = c.ch + 1;
                if (i && !a) for (s = i, l = u.length; s < l && !a; s++) u[s] == r && (a = s);
                return i && a
                  ? (o && (--i, ++a), { start: new t(c.line, i), end: new t(c.line, a) })
                  : { start: c, end: c };
              })(n, r, a, l);
            else if ('W' === a) s = ye(n, l, 0, !0);
            else if ('w' === a) s = ye(n, l, 0, !1);
            else if ('p' === a)
              if (((s = Te(n, r, o.repeat, 0, l)), (o.linewise = !0), i.visualMode))
                i.visualLine || (i.visualLine = !0);
              else {
                var c = i.inputState.operatorArgs;
                (c && (c.linewise = !0), s.end.line--);
              }
            else if ('t' === a)
              s = (function (t, n, r) {
                var o = n;
                if (!e.findMatchingTag || !e.findEnclosingTag) return { start: o, end: o };
                var i = e.findMatchingTag(t, n) || e.findEnclosingTag(t, n);
                return i && i.open && i.close
                  ? r
                    ? { start: i.open.from, end: i.close.to }
                    : { start: i.open.to, end: i.close.from }
                  : { start: o, end: o };
              })(n, r, l);
            else {
              if ('s' !== a) return null;
              var u = n.getLine(r.line);
              r.ch > 0 && L(u[r.ch]) && (r.ch -= 1);
              var p = Re(n, r, o.repeat, 1, l),
                h = Re(n, r, o.repeat, -1, l);
              (b(n.getLine(h.line)[h.ch]) &&
                b(n.getLine(p.line)[p.ch - 1]) &&
                (h = { line: h.line, ch: h.ch + 1 }),
                (s = { start: h, end: p }));
            }
            return n.state.vim.visualMode
              ? (function (e, n, r) {
                  var o,
                    i = e.state.vim.sel,
                    a = i.head,
                    s = i.anchor;
                  return (
                    oe(r, n) && ((o = r), (r = n), (n = o)),
                    oe(a, s)
                      ? ((a = ie(n, a)), (s = ae(s, r)))
                      : ((s = ie(n, s)),
                        -1 == (a = Y((a = ae(a, r)), 0, -1)).ch &&
                          a.line != e.firstLine() &&
                          (a = new t(a.line - 1, le(e, a.line - 1)))),
                    [s, a]
                  );
                })(n, s.start, s.end)
              : [s.start, s.end];
          },
          repeatLastCharacterSearch: function (e, t, n) {
            var r = B.lastCharacterSearch,
              o = n.repeat,
              i = n.forward === r.forward,
              a = (r.increment ? 1 : 0) * (i ? -1 : 1);
            (e.moveH(-a, 'char'), (n.inclusive = !!i));
            var s = Ae(e, o, i, r.selectedCharacter);
            return s ? ((s.ch += a), s) : (e.moveH(a, 'char'), t);
          },
        };
      function Q(e, t) {
        for (var n = [], r = 0; r < t; r++) n.push(e);
        return n;
      }
      var z = {
          change: function (n, r, o) {
            var i,
              a,
              s = n.state.vim,
              l = o[0].anchor,
              c = o[0].head;
            if (s.visualMode)
              if (r.fullLine)
                ((c.ch = Number.MAX_VALUE),
                  c.line--,
                  n.setSelection(l, c),
                  (a = n.getSelection()),
                  n.replaceSelection(''),
                  (i = l));
              else {
                a = n.getSelection();
                var u = Q('', o.length);
                (n.replaceSelections(u), (i = ie(o[0].head, o[0].anchor)));
              }
            else {
              a = n.getRange(l, c);
              var p = s.lastEditInputState || {};
              if ('moveByWords' == p.motion && !b(a)) {
                var h = /\s+$/.exec(a);
                h &&
                  p.motionArgs &&
                  p.motionArgs.forward &&
                  ((c = Y(c, 0, -h[0].length)), (a = a.slice(0, -h[0].length)));
              }
              var f = new t(l.line - 1, Number.MAX_VALUE),
                d = n.firstLine() == n.lastLine();
              (c.line > n.lastLine() && r.linewise && !d
                ? n.replaceRange('', f, c)
                : n.replaceRange('', l, c),
                r.linewise &&
                  (d || (n.setCursor(f), e.commands.newlineAndIndent(n)),
                  (l.ch = Number.MAX_VALUE)),
                (i = l));
            }
            (B.registerController.pushText(r.registerName, 'change', a, r.linewise, o.length > 1),
              X.enterInsertMode(n, { head: i }, n.state.vim));
          },
          delete: function (e, n, r) {
            var o,
              i,
              a = e.state.vim;
            if (a.visualBlock) {
              i = e.getSelection();
              var s = Q('', r.length);
              (e.replaceSelections(s), (o = ie(r[0].head, r[0].anchor)));
            } else {
              var l = r[0].anchor,
                c = r[0].head;
              (n.linewise &&
                c.line != e.firstLine() &&
                l.line == e.lastLine() &&
                l.line == c.line - 1 &&
                (l.line == e.firstLine() ? (l.ch = 0) : (l = new t(l.line - 1, le(e, l.line - 1)))),
                (i = e.getRange(l, c)),
                e.replaceRange('', l, c),
                (o = l),
                n.linewise && (o = q.moveToFirstNonWhiteSpaceCharacter(e, l)));
            }
            return (
              B.registerController.pushText(n.registerName, 'delete', i, n.linewise, a.visualBlock),
              Z(e, o)
            );
          },
          indent: function (e, t, n) {
            var r = e.state.vim;
            if (e.indentMore)
              for (var o = r.visualMode ? t.repeat : 1, i = 0; i < o; i++)
                t.indentRight ? e.indentMore() : e.indentLess();
            else {
              var a = n[0].anchor.line,
                s = r.visualBlock ? n[n.length - 1].anchor.line : n[0].head.line;
              ((o = r.visualMode ? t.repeat : 1), t.linewise && s--);
              for (var l = a; l <= s; l++) for (i = 0; i < o; i++) e.indentLine(l, t.indentRight);
            }
            return q.moveToFirstNonWhiteSpaceCharacter(e, n[0].anchor);
          },
          indentAuto: function (e, t, n) {
            return (
              e.execCommand('indentAuto'),
              q.moveToFirstNonWhiteSpaceCharacter(e, n[0].anchor)
            );
          },
          changeCase: function (e, t, n, r, o) {
            for (var i = e.getSelections(), a = [], s = t.toLower, l = 0; l < i.length; l++) {
              var c = i[l],
                u = '';
              if (!0 === s) u = c.toLowerCase();
              else if (!1 === s) u = c.toUpperCase();
              else
                for (var p = 0; p < c.length; p++) {
                  var h = c.charAt(p);
                  u += A(h) ? h.toLowerCase() : h.toUpperCase();
                }
              a.push(u);
            }
            return (
              e.replaceSelections(a),
              t.shouldMoveCursor
                ? o
                : !e.state.vim.visualMode && t.linewise && n[0].anchor.line + 1 == n[0].head.line
                  ? q.moveToFirstNonWhiteSpaceCharacter(e, r)
                  : t.linewise
                    ? r
                    : ie(n[0].anchor, n[0].head)
            );
          },
          yank: function (e, t, n, r) {
            var o = e.state.vim,
              i = e.getSelection(),
              a = o.visualMode ? ie(o.sel.anchor, o.sel.head, n[0].head, n[0].anchor) : r;
            return (
              B.registerController.pushText(t.registerName, 'yank', i, t.linewise, o.visualBlock),
              a
            );
          },
        },
        X = {
          jumpListWalk: function (e, t, n) {
            if (!n.visualMode) {
              var r = t.repeat,
                o = t.forward,
                i = B.jumpList.move(e, o ? r : -r),
                a = i ? i.find() : void 0;
              ((a = a || e.getCursor()), e.setCursor(a));
            }
          },
          scroll: function (e, t, n) {
            if (!n.visualMode) {
              var r = t.repeat || 1,
                o = e.defaultTextHeight(),
                i = e.getScrollInfo().top,
                a = o * r,
                s = t.forward ? i + a : i - a,
                l = ne(e.getCursor()),
                c = e.charCoords(l, 'local');
              if (t.forward)
                s > c.top
                  ? ((l.line += (s - c.top) / o),
                    (l.line = Math.ceil(l.line)),
                    e.setCursor(l),
                    (c = e.charCoords(l, 'local')),
                    e.scrollTo(null, c.top))
                  : e.scrollTo(null, s);
              else {
                var u = s + e.getScrollInfo().clientHeight;
                u < c.bottom
                  ? ((l.line -= (c.bottom - u) / o),
                    (l.line = Math.floor(l.line)),
                    e.setCursor(l),
                    (c = e.charCoords(l, 'local')),
                    e.scrollTo(null, c.bottom - e.getScrollInfo().clientHeight))
                  : e.scrollTo(null, s);
              }
            }
          },
          scrollToCursor: function (e, n) {
            var r = e.getCursor().line,
              o = e.charCoords(new t(r, 0), 'local'),
              i = e.getScrollInfo().clientHeight,
              a = o.top;
            switch (n.position) {
              case 'center':
                a = o.bottom - i / 2;
                break;
              case 'bottom':
                var s = new t(r, e.getLine(r).length - 1);
                a = a - i + (e.charCoords(s, 'local').bottom - a);
            }
            e.scrollTo(null, a);
          },
          replayMacro: function (e, t, n) {
            var r = t.selectedCharacter,
              o = t.repeat,
              i = B.macroModeState;
            for ('@' == r ? (r = i.latestRegister) : (i.latestRegister = r); o--; ) Ge(e, n, i, r);
          },
          enterMacroRecordMode: function (e, t) {
            var n = B.macroModeState,
              r = t.selectedCharacter;
            B.registerController.isValidRegister(r) && n.enterMacroRecordMode(e, r);
          },
          toggleOverwrite: function (t) {
            t.state.overwrite
              ? (t.toggleOverwrite(!1),
                t.setOption('keyMap', 'vim-insert'),
                e.signal(t, 'vim-mode-change', { mode: 'insert' }))
              : (t.toggleOverwrite(!0),
                t.setOption('keyMap', 'vim-replace'),
                e.signal(t, 'vim-mode-change', { mode: 'replace' }));
          },
          enterInsertMode: function (n, r, o) {
            if (!n.getOption('readOnly')) {
              ((o.insertMode = !0), (o.insertModeRepeat = (r && r.repeat) || 1));
              var i = r ? r.insertAt : null,
                a = o.sel,
                s = r.head || n.getCursor('head'),
                l = n.listSelections().length;
              if ('eol' == i) s = new t(s.line, le(n, s.line));
              else if ('bol' == i) s = new t(s.line, 0);
              else if ('charAfter' == i) s = Y(s, 0, 1);
              else if ('firstNonBlank' == i) s = q.moveToFirstNonWhiteSpaceCharacter(n, s);
              else if ('startOfSelectedArea' == i) {
                if (!o.visualMode) return;
                o.visualBlock
                  ? ((s = new t(
                      Math.min(a.head.line, a.anchor.line),
                      Math.min(a.head.ch, a.anchor.ch)
                    )),
                    (l = Math.abs(a.head.line - a.anchor.line) + 1))
                  : (s = a.head.line < a.anchor.line ? a.head : new t(a.anchor.line, 0));
              } else if ('endOfSelectedArea' == i) {
                if (!o.visualMode) return;
                o.visualBlock
                  ? ((s = new t(
                      Math.min(a.head.line, a.anchor.line),
                      Math.max(a.head.ch, a.anchor.ch) + 1
                    )),
                    (l = Math.abs(a.head.line - a.anchor.line) + 1))
                  : (s = a.head.line >= a.anchor.line ? Y(a.head, 0, 1) : new t(a.anchor.line, 0));
              } else if ('inplace' == i) {
                if (o.visualMode) return;
              } else 'lastEdit' == i && (s = Je(n) || s);
              (n.setOption('disableInput', !1),
                r && r.replace
                  ? (n.toggleOverwrite(!0),
                    n.setOption('keyMap', 'vim-replace'),
                    e.signal(n, 'vim-mode-change', { mode: 'replace' }))
                  : (n.toggleOverwrite(!1),
                    n.setOption('keyMap', 'vim-insert'),
                    e.signal(n, 'vim-mode-change', { mode: 'insert' })),
                B.macroModeState.isPlaying ||
                  (n.on('change', Ye), e.on(n.getInputField(), 'keydown', rt)),
                o.visualMode && ge(n),
                he(n, s, l));
            }
          },
          toggleVisualMode: function (n, r, o) {
            var i,
              a = r.repeat,
              s = n.getCursor();
            o.visualMode
              ? o.visualLine ^ r.linewise || o.visualBlock ^ r.blockwise
                ? ((o.visualLine = !!r.linewise),
                  (o.visualBlock = !!r.blockwise),
                  e.signal(n, 'vim-mode-change', {
                    mode: 'visual',
                    subMode: o.visualLine ? 'linewise' : o.visualBlock ? 'blockwise' : '',
                  }),
                  de(n))
                : ge(n)
              : ((o.visualMode = !0),
                (o.visualLine = !!r.linewise),
                (o.visualBlock = !!r.blockwise),
                (i = Z(n, new t(s.line, s.ch + a - 1))),
                (o.sel = { anchor: s, head: i }),
                e.signal(n, 'vim-mode-change', {
                  mode: 'visual',
                  subMode: o.visualLine ? 'linewise' : o.visualBlock ? 'blockwise' : '',
                }),
                de(n),
                be(n, o, '<', ie(s, i)),
                be(n, o, '>', ae(s, i)));
          },
          reselectLastSelection: function (t, n, r) {
            var o = r.lastSelection;
            if ((r.visualMode && fe(t, r), o)) {
              var i = o.anchorMark.find(),
                a = o.headMark.find();
              if (!i || !a) return;
              ((r.sel = { anchor: i, head: a }),
                (r.visualMode = !0),
                (r.visualLine = o.visualLine),
                (r.visualBlock = o.visualBlock),
                de(t),
                be(t, r, '<', ie(i, a)),
                be(t, r, '>', ae(i, a)),
                e.signal(t, 'vim-mode-change', {
                  mode: 'visual',
                  subMode: r.visualLine ? 'linewise' : r.visualBlock ? 'blockwise' : '',
                }));
            }
          },
          joinLines: function (e, n, r) {
            var o, i;
            if (r.visualMode) {
              if (((o = e.getCursor('anchor')), oe((i = e.getCursor('head')), o))) {
                var a = i;
                ((i = o), (o = a));
              }
              i.ch = le(e, i.line) - 1;
            } else {
              var s = Math.max(n.repeat, 2);
              ((o = e.getCursor()), (i = Z(e, new t(o.line + s - 1, 1 / 0))));
            }
            for (var l = 0, c = o.line; c < i.line; c++) {
              ((l = le(e, o.line)), (a = new t(o.line + 1, le(e, o.line + 1))));
              var u = e.getRange(o, a);
              ((u = n.keepSpaces ? u.replace(/\n\r?/g, '') : u.replace(/\n\s*/g, ' ')),
                e.replaceRange(u, o, a));
            }
            var p = new t(o.line, l);
            (r.visualMode && ge(e, !1), e.setCursor(p));
          },
          newLineAndEnterInsertMode: function (n, r, o) {
            o.insertMode = !0;
            var i = ne(n.getCursor());
            (i.line !== n.firstLine() || r.after
              ? ((i.line = r.after ? i.line : i.line - 1),
                (i.ch = le(n, i.line)),
                n.setCursor(i),
                (e.commands.newlineAndIndentContinueComment || e.commands.newlineAndIndent)(n))
              : (n.replaceRange('\n', new t(n.firstLine(), 0)), n.setCursor(n.firstLine(), 0)),
              this.enterInsertMode(n, { repeat: r.repeat }, o));
          },
          paste: function (e, n, r) {
            var o = ne(e.getCursor()),
              i = B.registerController.getRegister(n.registerName);
            if ((f = i.toString())) {
              if (n.matchIndent) {
                var a = e.getOption('tabSize'),
                  s = function (e) {
                    var t = e.split('\t').length - 1,
                      n = e.split(' ').length - 1;
                    return t * a + 1 * n;
                  },
                  l = e.getLine(e.getCursor().line),
                  c = s(l.match(/^\s*/)[0]),
                  u = f.replace(/\n$/, ''),
                  p = f !== u,
                  h = s(f.match(/^\s*/)[0]),
                  f = u.replace(/^\s*/gm, function (t) {
                    var n = c + (s(t) - h);
                    if (n < 0) return '';
                    if (e.getOption('indentWithTabs')) {
                      var r = Math.floor(n / a);
                      return Array(r + 1).join('\t');
                    }
                    return Array(n + 1).join(' ');
                  });
                f += p ? '\n' : '';
              }
              n.repeat > 1 && (f = Array(n.repeat + 1).join(f));
              var d,
                m,
                g = i.linewise,
                v = i.blockwise;
              if (v) {
                ((f = f.split('\n')), g && f.pop());
                for (var y = 0; y < f.length; y++) f[y] = '' == f[y] ? ' ' : f[y];
                ((o.ch += n.after ? 1 : 0), (o.ch = Math.min(le(e, o.line), o.ch)));
              } else
                g
                  ? r.visualMode
                    ? (f = r.visualLine ? f.slice(0, -1) : '\n' + f.slice(0, f.length - 1) + '\n')
                    : n.after
                      ? ((f = '\n' + f.slice(0, f.length - 1)), (o.ch = le(e, o.line)))
                      : (o.ch = 0)
                  : (o.ch += n.after ? 1 : 0);
              if (r.visualMode) {
                var k;
                r.lastPastedText = f;
                var C = (function (e, n) {
                    var r = n.lastSelection;
                    return n.visualMode
                      ? (function () {
                          var t = e.listSelections(),
                            n = t[0],
                            r = t[t.length - 1];
                          return [
                            oe(n.anchor, n.head) ? n.anchor : n.head,
                            oe(r.anchor, r.head) ? r.head : r.anchor,
                          ];
                        })()
                      : (function () {
                          var n = e.getCursor(),
                            o = e.getCursor(),
                            i = r.visualBlock;
                          if (i) {
                            var a = i.width,
                              s = i.height;
                            o = new t(n.line + s, n.ch + a);
                            for (var l = [], c = n.line; c < o.line; c++) {
                              var u = { anchor: new t(c, n.ch), head: new t(c, o.ch) };
                              l.push(u);
                            }
                            e.setSelections(l);
                          } else {
                            var p = r.anchorMark.find(),
                              h = r.headMark.find(),
                              f = h.line - p.line,
                              d = h.ch - p.ch;
                            ((o = { line: o.line + f, ch: f ? o.ch : d + o.ch }),
                              r.visualLine &&
                                ((n = new t(n.line, 0)), (o = new t(o.line, le(e, o.line)))),
                              e.setSelection(n, o));
                          }
                          return [n, o];
                        })();
                  })(e, r),
                  w = C[0],
                  x = C[1],
                  M = e.getSelection(),
                  S = e.listSelections(),
                  A = new Array(S.length).join('1').split('1');
                (r.lastSelection && (k = r.lastSelection.headMark.find()),
                  B.registerController.unnamedRegister.setText(M),
                  v
                    ? (e.replaceSelections(A),
                      (x = new t(w.line + f.length - 1, w.ch)),
                      e.setCursor(w),
                      pe(e, x),
                      e.replaceSelections(f),
                      (d = w))
                    : r.visualBlock
                      ? (e.replaceSelections(A), e.setCursor(w), e.replaceRange(f, w, w), (d = w))
                      : (e.replaceRange(f, w, x),
                        (d = e.posFromIndex(e.indexFromPos(w) + f.length - 1))),
                  k && (r.lastSelection.headMark = e.setBookmark(k)),
                  g && (d.ch = 0));
              } else if (v) {
                for (e.setCursor(o), y = 0; y < f.length; y++) {
                  var b = o.line + y;
                  (b > e.lastLine() && e.replaceRange('\n', new t(b, 0)),
                    le(e, b) < o.ch && ue(e, b, o.ch));
                }
                (e.setCursor(o),
                  pe(e, new t(o.line + f.length - 1, o.ch)),
                  e.replaceSelections(f),
                  (d = o));
              } else
                (e.replaceRange(f, o),
                  g && n.after
                    ? (d = new t(o.line + 1, ve(e.getLine(o.line + 1))))
                    : g && !n.after
                      ? (d = new t(o.line, ve(e.getLine(o.line))))
                      : !g && n.after
                        ? ((m = e.indexFromPos(o)), (d = e.posFromIndex(m + f.length - 1)))
                        : ((m = e.indexFromPos(o)), (d = e.posFromIndex(m + f.length))));
              (r.visualMode && ge(e, !1), e.setCursor(d));
            }
          },
          undo: function (t, n) {
            t.operation(function () {
              (te(t, e.commands.undo, n.repeat)(), t.setCursor(t.getCursor('anchor')));
            });
          },
          redo: function (t, n) {
            te(t, e.commands.redo, n.repeat)();
          },
          setRegister: function (e, t, n) {
            n.inputState.registerName = t.selectedCharacter;
          },
          setMark: function (e, t, n) {
            be(e, n, t.selectedCharacter, e.getCursor());
          },
          replace: function (n, r, o) {
            var i,
              a,
              s = r.selectedCharacter,
              l = n.getCursor(),
              c = n.listSelections();
            if (o.visualMode) ((l = n.getCursor('start')), (a = n.getCursor('end')));
            else {
              var u = n.getLine(l.line);
              ((i = l.ch + r.repeat) > u.length && (i = u.length), (a = new t(l.line, i)));
            }
            if ('\n' == s)
              (o.visualMode || n.replaceRange('', l, a),
                (e.commands.newlineAndIndentContinueComment || e.commands.newlineAndIndent)(n));
            else {
              var p = n.getRange(l, a);
              if (((p = p.replace(/[^\n]/g, s)), o.visualBlock)) {
                var h = new Array(n.getOption('tabSize') + 1).join(' ');
                ((p = (p = n.getSelection()).replace(/\t/g, h).replace(/[^\n]/g, s).split('\n')),
                  n.replaceSelections(p));
              } else n.replaceRange(p, l, a);
              o.visualMode
                ? ((l = oe(c[0].anchor, c[0].head) ? c[0].anchor : c[0].head),
                  n.setCursor(l),
                  ge(n, !1))
                : n.setCursor(Y(a, 0, -1));
            }
          },
          incrementNumberToken: function (e, n) {
            for (
              var r,
                o,
                i,
                a,
                s = e.getCursor(),
                l = e.getLine(s.line),
                c = /(-?)(?:(0x)([\da-f]+)|(0b|0|)(\d+))/gi;
              null !== (r = c.exec(l)) && ((i = (o = r.index) + r[0].length), !(s.ch < i));
            );
            if ((n.backtrack || !(i <= s.ch)) && r) {
              var u = r[2] || r[4],
                p = r[3] || r[5],
                h = n.increase ? 1 : -1,
                f = { '0b': 2, 0: 8, '': 10, '0x': 16 }[u.toLowerCase()];
              a = (parseInt(r[1] + p, f) + h * n.repeat).toString(f);
              var d = u ? new Array(p.length - a.length + 1 + r[1].length).join('0') : '';
              a = '-' === a.charAt(0) ? '-' + u + d + a.substr(1) : u + d + a;
              var m = new t(s.line, o),
                g = new t(s.line, i);
              (e.replaceRange(a, m, g), e.setCursor(new t(s.line, o + a.length - 1)));
            }
          },
          repeatLastEdit: function (e, t, n) {
            if (n.lastEditInputState) {
              var r = t.repeat;
              (r && t.repeatIsExplicit
                ? (n.lastEditInputState.repeatOverride = r)
                : (r = n.lastEditInputState.repeatOverride || r),
                ot(e, n, r, !1));
            }
          },
          indent: function (e, t) {
            e.indentLine(e.getCursor().line, t.indentRight);
          },
          exitInsertMode: Xe,
        };
      function Z(e, n) {
        var r = e.state.vim,
          o = r.insertMode || r.visualMode,
          i = Math.min(Math.max(e.firstLine(), n.line), e.lastLine()),
          a = le(e, i) - 1 + !!o,
          s = Math.min(Math.max(0, n.ch), a);
        return new t(i, s);
      }
      function G(e) {
        var t = {};
        for (var n in e) e.hasOwnProperty(n) && (t[n] = e[n]);
        return t;
      }
      function Y(e, n, r) {
        return ('object' == typeof n && ((r = n.ch), (n = n.line)), new t(e.line + n, e.ch + r));
      }
      function ee(e, t) {
        if ('<character>' == t.slice(-11)) {
          var n = t.length - 11,
            r = e.slice(0, n),
            o = t.slice(0, n);
          return r == o && e.length > n ? 'full' : 0 == o.indexOf(r) && 'partial';
        }
        return e == t ? 'full' : 0 == t.indexOf(e) && 'partial';
      }
      function te(e, t, n) {
        return function () {
          for (var r = 0; r < n; r++) t(e);
        };
      }
      function ne(e) {
        return new t(e.line, e.ch);
      }
      function re(e, t) {
        return e.ch == t.ch && e.line == t.line;
      }
      function oe(e, t) {
        return e.line < t.line || (e.line == t.line && e.ch < t.ch);
      }
      function ie(e, t) {
        return (
          arguments.length > 2 && (t = ie.apply(void 0, Array.prototype.slice.call(arguments, 1))),
          oe(e, t) ? e : t
        );
      }
      function ae(e, t) {
        return (
          arguments.length > 2 && (t = ae.apply(void 0, Array.prototype.slice.call(arguments, 1))),
          oe(e, t) ? t : e
        );
      }
      function se(e, t, n) {
        var r = oe(e, t),
          o = oe(t, n);
        return r && o;
      }
      function le(e, t) {
        return e.getLine(t).length;
      }
      function ce(e) {
        return e.trim ? e.trim() : e.replace(/^\s+|\s+$/g, '');
      }
      function ue(e, n, r) {
        var o = le(e, n),
          i = new Array(r - o + 1).join(' ');
        (e.setCursor(new t(n, o)), e.replaceRange(i, e.getCursor()));
      }
      function pe(e, n) {
        var r = [],
          o = e.listSelections(),
          i = ne(e.clipPos(n)),
          a = !re(n, i),
          s = (function (e, t, n) {
            for (var r = 0; r < e.length; r++) {
              var o = re(e[r].anchor, t),
                i = re(e[r].head, t);
              if (o || i) return r;
            }
            return -1;
          })(o, e.getCursor('head')),
          l = re(o[s].head, o[s].anchor),
          c = o.length - 1,
          u = c - s > s ? c : 0,
          p = o[u].anchor,
          h = Math.min(p.line, i.line),
          f = Math.max(p.line, i.line),
          d = p.ch,
          m = i.ch,
          g = o[u].head.ch - d,
          v = m - d;
        g > 0 && v <= 0
          ? (d++, a || m--)
          : g < 0 && v >= 0
            ? (d--, l || m++)
            : g < 0 && -1 == v && (d--, m++);
        for (var y = h; y <= f; y++) {
          var k = { anchor: new t(y, d), head: new t(y, m) };
          r.push(k);
        }
        return (e.setSelections(r), (n.ch = m), (p.ch = d), p);
      }
      function he(e, t, n) {
        for (var r = [], o = 0; o < n; o++) {
          var i = Y(t, o, 0);
          r.push({ anchor: i, head: i });
        }
        e.setSelections(r, 0);
      }
      function fe(e, t) {
        var n = t.sel.anchor,
          r = t.sel.head;
        (t.lastPastedText &&
          ((r = e.posFromIndex(e.indexFromPos(n) + t.lastPastedText.length)),
          (t.lastPastedText = null)),
          (t.lastSelection = {
            anchorMark: e.setBookmark(n),
            headMark: e.setBookmark(r),
            anchor: ne(n),
            head: ne(r),
            visualMode: t.visualMode,
            visualLine: t.visualLine,
            visualBlock: t.visualBlock,
          }));
      }
      function de(e, t, n) {
        var r = e.state.vim,
          o = me(
            e,
            (t = t || r.sel),
            (n = n || r.visualLine ? 'line' : r.visualBlock ? 'block' : 'char')
          );
        e.setSelections(o.ranges, o.primary);
      }
      function me(e, n, r, o) {
        var i = ne(n.head),
          a = ne(n.anchor);
        if ('char' == r) {
          var s = o || oe(n.head, n.anchor) ? 0 : 1,
            l = oe(n.head, n.anchor) ? 1 : 0;
          return (
            (i = Y(n.head, 0, s)),
            { ranges: [{ anchor: (a = Y(n.anchor, 0, l)), head: i }], primary: 0 }
          );
        }
        if ('line' == r) {
          if (oe(n.head, n.anchor)) ((i.ch = 0), (a.ch = le(e, a.line)));
          else {
            a.ch = 0;
            var c = e.lastLine();
            (i.line > c && (i.line = c), (i.ch = le(e, i.line)));
          }
          return { ranges: [{ anchor: a, head: i }], primary: 0 };
        }
        if ('block' == r) {
          var u = Math.min(a.line, i.line),
            p = a.ch,
            h = Math.max(a.line, i.line),
            f = i.ch;
          p < f ? (f += 1) : (p += 1);
          for (var d = h - u + 1, m = i.line == u ? 0 : d - 1, g = [], v = 0; v < d; v++)
            g.push({ anchor: new t(u + v, p), head: new t(u + v, f) });
          return { ranges: g, primary: m };
        }
      }
      function ge(t, n) {
        var r = t.state.vim;
        (!1 !== n && t.setCursor(Z(t, r.sel.head)),
          fe(t, r),
          (r.visualMode = !1),
          (r.visualLine = !1),
          (r.visualBlock = !1),
          r.insertMode || e.signal(t, 'vim-mode-change', { mode: 'normal' }));
      }
      function ve(e) {
        if (!e) return 0;
        var t = e.search(/\S/);
        return -1 == t ? e.length : t;
      }
      function ye(e, n, r, o, i) {
        for (
          var a = (function (e) {
              var t = e.getCursor('head');
              return (1 == e.getSelection().length && (t = ie(t, e.getCursor('anchor'))), t);
            })(e),
            s = e.getLine(a.line),
            l = a.ch,
            c = i ? d[0] : m[0];
          !c(s.charAt(l));
        )
          if (++l >= s.length) return null;
        o ? (c = m[0]) : (c = d[0])(s.charAt(l)) || (c = d[1]);
        for (var u = l, p = l; c(s.charAt(u)) && u < s.length; ) u++;
        for (; c(s.charAt(p)) && p >= 0; ) p--;
        if ((p++, n)) {
          for (var h = u; /\s/.test(s.charAt(u)) && u < s.length; ) u++;
          if (h == u) {
            for (var f = p; /\s/.test(s.charAt(p - 1)) && p > 0; ) p--;
            p || (p = f);
          }
        }
        return { start: new t(a.line, p), end: new t(a.line, u) };
      }
      function ke(e, t, n) {
        re(t, n) || B.jumpList.add(e, t, n);
      }
      function Ce(e, t) {
        ((B.lastCharacterSearch.increment = e),
          (B.lastCharacterSearch.forward = t.forward),
          (B.lastCharacterSearch.selectedCharacter = t.selectedCharacter));
      }
      var we = {
          '(': 'bracket',
          ')': 'bracket',
          '{': 'bracket',
          '}': 'bracket',
          '[': 'section',
          ']': 'section',
          '*': 'comment',
          '/': 'comment',
          m: 'method',
          M: 'method',
          '#': 'preprocess',
        },
        xe = {
          bracket: {
            isComplete: function (e) {
              if (e.nextCh === e.symb) {
                if ((e.depth++, e.depth >= 1)) return !0;
              } else e.nextCh === e.reverseSymb && e.depth--;
              return !1;
            },
          },
          section: {
            init: function (e) {
              ((e.curMoveThrough = !0), (e.symb = (e.forward ? ']' : '[') === e.symb ? '{' : '}'));
            },
            isComplete: function (e) {
              return 0 === e.index && e.nextCh === e.symb;
            },
          },
          comment: {
            isComplete: function (e) {
              var t = '*' === e.lastCh && '/' === e.nextCh;
              return ((e.lastCh = e.nextCh), t);
            },
          },
          method: {
            init: function (e) {
              ((e.symb = 'm' === e.symb ? '{' : '}'), (e.reverseSymb = '{' === e.symb ? '}' : '{'));
            },
            isComplete: function (e) {
              return e.nextCh === e.symb;
            },
          },
          preprocess: {
            init: function (e) {
              e.index = 0;
            },
            isComplete: function (e) {
              if ('#' === e.nextCh) {
                var t = e.lineText.match(/^#(\w+)/)[1];
                if ('endif' === t) {
                  if (e.forward && 0 === e.depth) return !0;
                  e.depth++;
                } else if ('if' === t) {
                  if (!e.forward && 0 === e.depth) return !0;
                  e.depth--;
                }
                if ('else' === t && 0 === e.depth) return !0;
              }
              return !1;
            },
          },
        };
      function Me(e, t, n, r, o) {
        var i = t.line,
          a = t.ch,
          s = e.getLine(i),
          l = n ? 1 : -1,
          c = r ? m : d;
        if (o && '' == s) {
          if (((i += l), (s = e.getLine(i)), !M(e, i))) return null;
          a = n ? 0 : s.length;
        }
        for (;;) {
          if (o && '' == s) return { from: 0, to: 0, line: i };
          for (var u = l > 0 ? s.length : -1, p = u, h = u; a != u; ) {
            for (var f = !1, g = 0; g < c.length && !f; ++g)
              if (c[g](s.charAt(a))) {
                for (p = a; a != u && c[g](s.charAt(a)); ) a += l;
                if (((f = p != (h = a)), p == t.ch && i == t.line && h == p + l)) continue;
                return { from: Math.min(p, h + 1), to: Math.max(p, h), line: i };
              }
            f || (a += l);
          }
          if (!M(e, (i += l))) return null;
          ((s = e.getLine(i)), (a = l > 0 ? 0 : s.length));
        }
      }
      function Se(e, n, r, o, i) {
        var a = new t(n.line + r.repeat - 1, 1 / 0),
          s = e.clipPos(a);
        return (
          s.ch--,
          i || ((o.lastHPos = 1 / 0), (o.lastHSPos = e.charCoords(s, 'div').left)),
          a
        );
      }
      function Ae(e, n, r, o) {
        for (var i, a = e.getCursor(), s = a.ch, l = 0; l < n; l++) {
          if (-1 == (i = Le(s, e.getLine(a.line), o, r, !0))) return null;
          s = i;
        }
        return new t(e.getCursor().line, i);
      }
      function be(e, t, n, r) {
        T(n, w) && (t.marks[n] && t.marks[n].clear(), (t.marks[n] = e.setBookmark(r)));
      }
      function Le(e, t, n, r, o) {
        var i;
        return (
          r
            ? -1 == (i = t.indexOf(n, e + 1)) || o || (i -= 1)
            : -1 == (i = t.lastIndexOf(n, e - 1)) || o || (i += 1),
          i
        );
      }
      function Te(e, n, r, o, i) {
        var a,
          s = n.line,
          l = e.firstLine(),
          c = e.lastLine(),
          u = s;
        function p(t) {
          return !e.getLine(t);
        }
        function h(e, t, n) {
          return n ? p(e) != p(e + t) : !p(e) && p(e + t);
        }
        if (o) {
          for (; l <= u && u <= c && r > 0; ) (h(u, o) && r--, (u += o));
          return new t(u, 0);
        }
        var f = e.state.vim;
        if (f.visualLine && h(s, 1, !0)) {
          var d = f.sel.anchor;
          h(d.line, -1, !0) && ((i && d.line == s) || (s += 1));
        }
        var m = p(s);
        for (u = s; u <= c && r; u++) h(u, 1, !0) && ((i && p(u) == m) || r--);
        for (
          a = new t(u, 0), u > c && !m ? (m = !0) : (i = !1), u = s;
          u > l && ((i && p(u) != m && u != s) || !h(u, -1, !0));
          u--
        );
        return { start: new t(u, 0), end: a };
      }
      function Re(e, n, r, o, i) {
        function a(e) {
          e.pos + e.dir < 0 || e.pos + e.dir >= e.line.length ? (e.line = null) : (e.pos += e.dir);
        }
        function s(e, t, n, r) {
          var o = { line: e.getLine(t), ln: t, pos: n, dir: r };
          if ('' === o.line) return { ln: o.ln, pos: o.pos };
          var s = o.pos;
          for (a(o); null !== o.line; ) {
            if (((s = o.pos), L(o.line[o.pos]))) {
              if (i) {
                for (a(o); null !== o.line && b(o.line[o.pos]); ) ((s = o.pos), a(o));
                return { ln: o.ln, pos: s + 1 };
              }
              return { ln: o.ln, pos: o.pos + 1 };
            }
            a(o);
          }
          return { ln: o.ln, pos: s + 1 };
        }
        function l(e, t, n, r) {
          var o = e.getLine(t),
            s = { line: o, ln: t, pos: n, dir: r };
          if ('' === s.line) return { ln: s.ln, pos: s.pos };
          var l = s.pos;
          for (a(s); null !== s.line; ) {
            if (b(s.line[s.pos]) || L(s.line[s.pos])) {
              if (L(s.line[s.pos]))
                return i && b(s.line[s.pos + 1])
                  ? { ln: s.ln, pos: s.pos + 1 }
                  : { ln: s.ln, pos: l };
            } else l = s.pos;
            a(s);
          }
          return (
            (s.line = o),
            i && b(s.line[s.pos]) ? { ln: s.ln, pos: s.pos } : { ln: s.ln, pos: l }
          );
        }
        for (var c = { ln: n.line, pos: n.ch }; r > 0; )
          ((c = o < 0 ? l(e, c.ln, c.pos, o) : s(e, c.ln, c.pos, o)), r--);
        return new t(c.ln, c.pos);
      }
      function Ee() {}
      function Oe(e) {
        var t = e.state.vim;
        return t.searchState_ || (t.searchState_ = new Ee());
      }
      function Ie(e, t) {
        var n = Be(e, t) || [];
        if (!n.length) return [];
        var r = [];
        if (0 === n[0]) {
          for (var o = 0; o < n.length; o++)
            'number' == typeof n[o] && r.push(e.substring(n[o] + 1, n[o + 1]));
          return r;
        }
      }
      function Be(e, t) {
        t || (t = '/');
        for (var n = !1, r = [], o = 0; o < e.length; o++) {
          var i = e.charAt(o);
          (n || i != t || r.push(o), (n = !n && '\\' == i));
        }
        return r;
      }
      (E('pcre', !0, 'boolean'),
        (Ee.prototype = {
          getQuery: function () {
            return B.query;
          },
          setQuery: function (e) {
            B.query = e;
          },
          getOverlay: function () {
            return this.searchOverlay;
          },
          setOverlay: function (e) {
            this.searchOverlay = e;
          },
          isReversed: function () {
            return B.isReversed;
          },
          setReversed: function (e) {
            B.isReversed = e;
          },
          getScrollbarAnnotate: function () {
            return this.annotate;
          },
          setScrollbarAnnotate: function (e) {
            this.annotate = e;
          },
        }));
      var Ke = { '\\n': '\n', '\\r': '\r', '\\t': '\t' },
        Ne = { '\\/': '/', '\\\\': '\\', '\\n': '\n', '\\r': '\r', '\\t': '\t', '\\&': '&' };
      function Pe(e) {
        'string' == typeof e && (e = document.createElement(e));
        for (var t, n = 1; n < arguments.length; n++)
          if ((t = arguments[n]))
            if (('object' != typeof t && (t = document.createTextNode(t)), t.nodeType))
              e.appendChild(t);
            else
              for (var r in t)
                Object.prototype.hasOwnProperty.call(t, r) &&
                  ('$' === r[0] ? (e.style[r.slice(1)] = t[r]) : e.setAttribute(r, t[r]));
        return e;
      }
      function je(e, t) {
        var n = Pe('div', { $color: 'red', $whiteSpace: 'pre', class: 'cm-vim-message' }, t);
        e.openNotification
          ? e.openNotification(n, { bottom: !0, duration: 5e3 })
          : alert(n.innerText);
      }
      function _e(e, t) {
        var n,
          r,
          o =
            ((n = t.prefix),
            (r = t.desc),
            Pe(
              document.createDocumentFragment(),
              Pe(
                'span',
                { $fontFamily: 'monospace', $whiteSpace: 'pre' },
                n,
                Pe('input', {
                  type: 'text',
                  autocorrect: 'off',
                  autocapitalize: 'off',
                  spellcheck: 'false',
                })
              ),
              r && Pe('span', { $color: '#888' }, r)
            ));
        if (e.openDialog)
          e.openDialog(o, t.onClose, {
            onKeyDown: t.onKeyDown,
            onKeyUp: t.onKeyUp,
            bottom: !0,
            selectValueOnOpen: !1,
            value: t.value,
          });
        else {
          var i = '';
          ('string' != typeof t.prefix && t.prefix && (i += t.prefix.textContent),
            t.desc && (i += ' ' + t.desc),
            t.onClose(prompt(i, '')));
        }
      }
      function He(e, t, n, r) {
        if (t) {
          var o = Oe(e),
            i = (function (e, t, n) {
              if ((B.registerController.getRegister('/').setText(e), e instanceof RegExp)) return e;
              var r,
                o,
                i = Be(e, '/');
              return (
                i.length
                  ? ((r = e.substring(0, i[0])), (o = -1 != e.substring(i[0]).indexOf('i')))
                  : (r = e),
                r
                  ? (I('pcre') ||
                      (r = (function (e) {
                        for (var t = !1, n = [], r = -1; r < e.length; r++) {
                          var o = e.charAt(r) || '',
                            i = e.charAt(r + 1) || '',
                            a = i && -1 != '|(){'.indexOf(i);
                          t
                            ? (('\\' === o && a) || n.push(o), (t = !1))
                            : '\\' === o
                              ? ((t = !0),
                                i && -1 != '}'.indexOf(i) && (a = !0),
                                (a && '\\' !== i) || n.push(o))
                              : (n.push(o), a && '\\' !== i && n.push('\\'));
                        }
                        return n.join('');
                      })(r)),
                    n && (t = /^[^A-Z]*$/.test(r)),
                    new RegExp(r, t || o ? 'im' : 'm'))
                  : null
              );
            })(t, !!n, !!r);
          if (i)
            return (
              Ve(e, i),
              (function (e, t) {
                if (e instanceof RegExp && t instanceof RegExp) {
                  for (
                    var n = ['global', 'multiline', 'ignoreCase', 'source'], r = 0;
                    r < n.length;
                    r++
                  ) {
                    var o = n[r];
                    if (e[o] !== t[o]) return !1;
                  }
                  return !0;
                }
                return !1;
              })(i, o.getQuery()) || o.setQuery(i),
              i
            );
        }
      }
      var De = 0;
      function Ve(e, t) {
        (clearTimeout(De),
          (De = setTimeout(function () {
            if (e.state.vim) {
              var n = Oe(e),
                r = n.getOverlay();
              (r && t == r.query) ||
                (r && e.removeOverlay(r),
                (r = (function (e) {
                  if ('^' == e.source.charAt(0)) var t = !0;
                  return {
                    token: function (n) {
                      if (!t || n.sol()) {
                        var r = n.match(e, !1);
                        if (r)
                          return 0 == r[0].length
                            ? (n.next(), 'searching')
                            : n.sol() || (n.backUp(1), e.exec(n.next() + r[0]))
                              ? (n.match(e), 'searching')
                              : (n.next(), null);
                        for (; !n.eol() && (n.next(), !n.match(e, !1)); );
                      } else n.skipToEnd();
                    },
                    query: e,
                  };
                })(t)),
                e.addOverlay(r),
                e.showMatchesOnScrollbar &&
                  (n.getScrollbarAnnotate() && n.getScrollbarAnnotate().clear(),
                  n.setScrollbarAnnotate(e.showMatchesOnScrollbar(t))),
                n.setOverlay(r));
            }
          }, 50)));
      }
      function Fe(e, n, r, o) {
        return (
          void 0 === o && (o = 1),
          e.operation(function () {
            for (var i = e.getCursor(), a = e.getSearchCursor(r, i), s = 0; s < o; s++) {
              var l = a.find(n);
              if (0 == s && l && re(a.from(), i)) {
                var c = n ? a.from() : a.to();
                (l = a.find(n)) &&
                  !l[0] &&
                  re(a.from(), c) &&
                  e.getLine(c.line).length == c.ch &&
                  (l = a.find(n));
              }
              if (
                !l &&
                !(a = e.getSearchCursor(r, n ? new t(e.lastLine()) : new t(e.firstLine(), 0))).find(
                  n
                )
              )
                return;
            }
            return a.from();
          })
        );
      }
      function We(e) {
        var t = Oe(e);
        (e.removeOverlay(Oe(e).getOverlay()),
          t.setOverlay(null),
          t.getScrollbarAnnotate() &&
            (t.getScrollbarAnnotate().clear(), t.setScrollbarAnnotate(null)));
      }
      function $e(e) {
        var t = e.getScrollInfo(),
          n = e.coordsChar({ left: 0, top: 6 + t.top }, 'local'),
          r = t.clientHeight - 10 + t.top,
          o = e.coordsChar({ left: 0, top: r }, 'local');
        return { top: n.line, bottom: o.line };
      }
      function Ue(e, n, r) {
        if ("'" == r || '`' == r) return B.jumpList.find(e, -1) || new t(0, 0);
        if ('.' == r) return Je(e);
        var o = n.marks[r];
        return o && o.find();
      }
      function Je(e) {
        for (var t = e.doc.history.done, n = t.length; n--; )
          if (t[n].changes) return ne(t[n].changes[0].to);
      }
      var qe = function () {
        this.buildCommandMap_();
      };
      qe.prototype = {
        processCommand: function (e, t, n) {
          var r = this;
          e.operation(function () {
            ((e.curOp.isVimOp = !0), r._processCommand(e, t, n));
          });
        },
        _processCommand: function (t, n, r) {
          var o = t.state.vim,
            i = B.registerController.getRegister(':'),
            a = i.toString();
          o.visualMode && ge(t);
          var s = new e.StringStream(n);
          i.setText(n);
          var l,
            c,
            u = r || {};
          u.input = n;
          try {
            this.parseInput_(t, s, u);
          } catch (e) {
            throw (je(t, e.toString()), e);
          }
          if (u.commandName) {
            if ((l = this.matchCommand_(u.commandName))) {
              if (
                ((c = l.name),
                l.excludeFromCommandHistory && i.setText(a),
                this.parseCommandArgs_(s, u, l),
                'exToKey' == l.type)
              ) {
                for (var p = 0; p < l.toKeys.length; p++) D.handleKey(t, l.toKeys[p], 'mapping');
                return;
              }
              if ('exToEx' == l.type) return void this.processCommand(t, l.toInput);
            }
          } else void 0 !== u.line && (c = 'move');
          if (c)
            try {
              (Qe[c](t, u), (l && l.possiblyAsync) || !u.callback || u.callback());
            } catch (e) {
              throw (je(t, e.toString()), e);
            }
          else je(t, 'Not an editor command ":' + n + '"');
        },
        parseInput_: function (e, t, n) {
          (t.eatWhile(':'),
            t.eat('%')
              ? ((n.line = e.firstLine()), (n.lineEnd = e.lastLine()))
              : ((n.line = this.parseLineSpec_(e, t)),
                void 0 !== n.line && t.eat(',') && (n.lineEnd = this.parseLineSpec_(e, t))));
          var r = t.match(/^(\w+|!!|@@|[!#&*<=>@~])/);
          return ((n.commandName = r ? r[1] : t.match(/.*/)[0]), n);
        },
        parseLineSpec_: function (e, t) {
          var n = t.match(/^(\d+)/);
          if (n) return parseInt(n[1], 10) - 1;
          switch (t.next()) {
            case '.':
              return this.parseLineSpecOffset_(t, e.getCursor().line);
            case '$':
              return this.parseLineSpecOffset_(t, e.lastLine());
            case "'":
              var r = t.next(),
                o = Ue(e, e.state.vim, r);
              if (!o) throw new Error('Mark not set');
              return this.parseLineSpecOffset_(t, o.line);
            case '-':
            case '+':
              return (t.backUp(1), this.parseLineSpecOffset_(t, e.getCursor().line));
            default:
              return void t.backUp(1);
          }
        },
        parseLineSpecOffset_: function (e, t) {
          var n = e.match(/^([+-])?(\d+)/);
          if (n) {
            var r = parseInt(n[2], 10);
            '-' == n[1] ? (t -= r) : (t += r);
          }
          return t;
        },
        parseCommandArgs_: function (e, t, n) {
          if (!e.eol()) {
            t.argString = e.match(/.*/)[0];
            var r = n.argDelimiter || /\s+/,
              o = ce(t.argString).split(r);
            o.length && o[0] && (t.args = o);
          }
        },
        matchCommand_: function (e) {
          for (var t = e.length; t > 0; t--) {
            var n = e.substring(0, t);
            if (this.commandMap_[n]) {
              var r = this.commandMap_[n];
              if (0 === r.name.indexOf(e)) return r;
            }
          }
          return null;
        },
        buildCommandMap_: function () {
          this.commandMap_ = {};
          for (var e = 0; e < i.length; e++) {
            var t = i[e],
              n = t.shortName || t.name;
            this.commandMap_[n] = t;
          }
        },
        map: function (e, t, n) {
          if (':' != e && ':' == e.charAt(0)) {
            if (n) throw Error('Mode not supported for ex mappings');
            var o = e.substring(1);
            ':' != t && ':' == t.charAt(0)
              ? (this.commandMap_[o] = {
                  name: o,
                  type: 'exToEx',
                  toInput: t.substring(1),
                  user: !0,
                })
              : (this.commandMap_[o] = { name: o, type: 'exToKey', toKeys: t, user: !0 });
          } else if (':' != t && ':' == t.charAt(0)) {
            var i = { keys: e, type: 'keyToEx', exArgs: { input: t.substring(1) } };
            (n && (i.context = n), r.unshift(i));
          } else
            ((i = { keys: e, type: 'keyToKey', toKeys: t }), n && (i.context = n), r.unshift(i));
        },
        unmap: function (e, t) {
          if (':' != e && ':' == e.charAt(0)) {
            if (t) throw Error('Mode not supported for ex mappings');
            var n = e.substring(1);
            if (this.commandMap_[n] && this.commandMap_[n].user)
              return (delete this.commandMap_[n], !0);
          } else
            for (var o = e, i = 0; i < r.length; i++)
              if (o == r[i].keys && r[i].context === t) return (r.splice(i, 1), !0);
        },
      };
      var Qe = {
          colorscheme: function (e, t) {
            !t.args || t.args.length < 1
              ? je(e, e.getOption('theme'))
              : e.setOption('theme', t.args[0]);
          },
          map: function (e, t, n) {
            var r = t.args;
            !r || r.length < 2 ? e && je(e, 'Invalid mapping: ' + t.input) : ze.map(r[0], r[1], n);
          },
          imap: function (e, t) {
            this.map(e, t, 'insert');
          },
          nmap: function (e, t) {
            this.map(e, t, 'normal');
          },
          vmap: function (e, t) {
            this.map(e, t, 'visual');
          },
          unmap: function (e, t, n) {
            var r = t.args;
            (!r || r.length < 1 || !ze.unmap(r[0], n)) && e && je(e, 'No such mapping: ' + t.input);
          },
          move: function (e, t) {
            J.processCommand(e, e.state.vim, {
              type: 'motion',
              motion: 'moveToLineOrEdgeOfDocument',
              motionArgs: { forward: !1, explicitRepeat: !0, linewise: !0 },
              repeatOverride: t.line + 1,
            });
          },
          set: function (e, t) {
            var n = t.args,
              r = t.setCfg || {};
            if (!n || n.length < 1) e && je(e, 'Invalid mapping: ' + t.input);
            else {
              var o = n[0].split('='),
                i = o[0],
                a = o[1],
                s = !1;
              if ('?' == i.charAt(i.length - 1)) {
                if (a) throw Error('Trailing characters: ' + t.argString);
                ((i = i.substring(0, i.length - 1)), (s = !0));
              }
              void 0 === a && 'no' == i.substring(0, 2) && ((i = i.substring(2)), (a = !1));
              var l = R[i] && 'boolean' == R[i].type;
              if ((l && null == a && (a = !0), (!l && void 0 === a) || s)) {
                var c = I(i, e, r);
                c instanceof Error
                  ? je(e, c.message)
                  : je(e, !0 === c || !1 === c ? ' ' + (c ? '' : 'no') + i : '  ' + i + '=' + c);
              } else {
                var u = O(i, a, e, r);
                u instanceof Error && je(e, u.message);
              }
            }
          },
          setlocal: function (e, t) {
            ((t.setCfg = { scope: 'local' }), this.set(e, t));
          },
          setglobal: function (e, t) {
            ((t.setCfg = { scope: 'global' }), this.set(e, t));
          },
          registers: function (e, t) {
            var n = t.args,
              r = B.registerController.registers,
              o = '----------Registers----------\n\n';
            if (n) {
              n = n.join('');
              for (var i = 0; i < n.length; i++)
                ((a = n.charAt(i)),
                  B.registerController.isValidRegister(a) &&
                    (o += '"' + a + '    ' + (r[a] || new W()).toString() + '\n'));
            } else
              for (var a in r) {
                var s = r[a].toString();
                s.length && (o += '"' + a + '    ' + s + '\n');
              }
            je(e, o);
          },
          sort: function (n, r) {
            var o,
              i,
              a,
              s,
              l,
              c = (function () {
                if (r.argString) {
                  var t = new e.StringStream(r.argString);
                  if ((t.eat('!') && (o = !0), t.eol())) return;
                  if (!t.eatSpace()) return 'Invalid arguments';
                  var n = t.match(/([dinuox]+)?\s*(\/.+\/)?\s*/);
                  if (!n && !t.eol()) return 'Invalid arguments';
                  if (n[1]) {
                    ((i = -1 != n[1].indexOf('i')), (a = -1 != n[1].indexOf('u')));
                    var c = -1 != n[1].indexOf('d') || (-1 != n[1].indexOf('n') && 1),
                      u = -1 != n[1].indexOf('x') && 1,
                      p = -1 != n[1].indexOf('o') && 1;
                    if (c + u + p > 1) return 'Invalid arguments';
                    s = (c ? 'decimal' : u && 'hex') || (p && 'octal');
                  }
                  n[2] && (l = new RegExp(n[2].substr(1, n[2].length - 2), i ? 'i' : ''));
                }
              })();
            if (c) je(n, c + ': ' + r.argString);
            else {
              var u = r.line || n.firstLine(),
                p = r.lineEnd || r.line || n.lastLine();
              if (u != p) {
                var h = new t(u, 0),
                  f = new t(p, le(n, p)),
                  d = n.getRange(h, f).split('\n'),
                  m =
                    l ||
                    ('decimal' == s
                      ? /(-?)([\d]+)/
                      : 'hex' == s
                        ? /(-?)(?:0x)?([0-9a-f]+)/i
                        : 'octal' == s
                          ? /([0-7]+)/
                          : null),
                  g = 'decimal' == s ? 10 : 'hex' == s ? 16 : 'octal' == s ? 8 : null,
                  v = [],
                  y = [];
                if (s || l)
                  for (var k = 0; k < d.length; k++) {
                    var C = l ? d[k].match(l) : null;
                    C && '' != C[0] ? v.push(C) : !l && m.exec(d[k]) ? v.push(d[k]) : y.push(d[k]);
                  }
                else y = d;
                if (
                  (v.sort(
                    l
                      ? function (e, t) {
                          var n;
                          return (
                            o && ((n = e), (e = t), (t = n)),
                            i && ((e[0] = e[0].toLowerCase()), (t[0] = t[0].toLowerCase())),
                            e[0] < t[0] ? -1 : 1
                          );
                        }
                      : M
                  ),
                  l)
                )
                  for (k = 0; k < v.length; k++) v[k] = v[k].input;
                else s || y.sort(M);
                if (((d = o ? v.concat(y) : y.concat(v)), a)) {
                  var w,
                    x = d;
                  for (d = [], k = 0; k < x.length; k++) (x[k] != w && d.push(x[k]), (w = x[k]));
                }
                n.replaceRange(d.join('\n'), h, f);
              }
            }
            function M(e, t) {
              var n;
              (o && ((n = e), (e = t), (t = n)),
                i && ((e = e.toLowerCase()), (t = t.toLowerCase())));
              var r = s && m.exec(e),
                a = s && m.exec(t);
              return r
                ? (r = parseInt((r[1] + r[2]).toLowerCase(), g)) -
                    (a = parseInt((a[1] + a[2]).toLowerCase(), g))
                : e < t
                  ? -1
                  : 1;
            }
          },
          vglobal: function (e, t) {
            this.global(e, t);
          },
          global: function (e, t) {
            var n = t.argString;
            if (n) {
              var r,
                o = 'v' === t.commandName[0],
                i = void 0 !== t.line ? t.line : e.firstLine(),
                a = t.lineEnd || t.line || e.lastLine(),
                s = (function (e) {
                  return Ie(e, '/');
                })(n),
                l = n;
              if ((s.length && ((l = s[0]), (r = s.slice(1, s.length).join('/'))), l))
                try {
                  He(e, l, !0, !0);
                } catch (t) {
                  return void je(e, 'Invalid regex: ' + l);
                }
              for (var c = Oe(e).getQuery(), u = [], p = i; p <= a; p++) {
                var h = e.getLineHandle(p);
                c.test(h.text) !== o && u.push(r ? h : h.text);
              }
              if (r) {
                var f = 0,
                  d = function () {
                    if (f < u.length) {
                      var t = u[f++],
                        n = e.getLineNumber(t);
                      if (null == n) return void d();
                      var o = n + 1 + r;
                      ze.processCommand(e, o, { callback: d });
                    }
                  };
                d();
              } else je(e, u.join('\n'));
            } else je(e, 'Regular Expression missing from global');
          },
          substitute: function (n, r) {
            if (!n.getSearchCursor)
              throw new Error(
                'Search feature not available. Requires searchcursor.js or any other getSearchCursor implementation.'
              );
            var o,
              i,
              a,
              s,
              l = r.argString,
              c = l ? Ie(l, l[0]) : [],
              u = '',
              p = !1,
              h = !1;
            if (c.length)
              ((o = c[0]),
                I('pcre') && '' !== o && (o = new RegExp(o).source),
                void 0 !== (u = c[1]) &&
                  ((u = I('pcre')
                    ? (function (t) {
                        for (var n = new e.StringStream(t), r = []; !n.eol(); ) {
                          for (; n.peek() && '\\' != n.peek(); ) r.push(n.next());
                          var o = !1;
                          for (var i in Ne)
                            if (n.match(i, !0)) {
                              ((o = !0), r.push(Ne[i]));
                              break;
                            }
                          o || r.push(n.next());
                        }
                        return r.join('');
                      })(u.replace(/([^\\])&/g, '$1$$&'))
                    : (function (e) {
                        for (var t, n = !1, r = [], o = -1; o < e.length; o++) {
                          var i = e.charAt(o) || '',
                            a = e.charAt(o + 1) || '';
                          Ke[i + a]
                            ? (r.push(Ke[i + a]), o++)
                            : n
                              ? (r.push(i), (n = !1))
                              : '\\' === i
                                ? ((n = !0),
                                  (t = a),
                                  f.test(t) || '$' === a
                                    ? r.push('$')
                                    : '/' !== a && '\\' !== a && r.push('\\'))
                                : ('$' === i && r.push('$'), r.push(i), '/' === a && r.push('\\'));
                        }
                        return r.join('');
                      })(u)),
                  (B.lastSubstituteReplacePart = u)),
                (i = c[2] ? c[2].split(' ') : []));
            else if (l && l.length)
              return void je(n, 'Substitutions should be of the form :s/pattern/replace/');
            if (
              (i &&
                ((a = i[0]),
                (s = parseInt(i[1])),
                a &&
                  (-1 != a.indexOf('c') && (p = !0),
                  -1 != a.indexOf('g') && (h = !0),
                  (o = I('pcre') ? o + '/' + a : o.replace(/\//g, '\\/') + '/' + a))),
              o)
            )
              try {
                He(n, o, !0, !0);
              } catch (e) {
                return void je(n, 'Invalid regex: ' + o);
              }
            if (void 0 !== (u = u || B.lastSubstituteReplacePart)) {
              var d = Oe(n).getQuery(),
                m = void 0 !== r.line ? r.line : n.getCursor().line,
                g = r.lineEnd || m;
              (m == n.firstLine() && g == n.lastLine() && (g = 1 / 0), s && (g = (m = g) + s - 1));
              var v = Z(n, new t(m, 0)),
                y = n.getSearchCursor(d, v);
              !(function (t, n, r, o, i, a, s, l, c) {
                t.state.vim.exMode = !0;
                var u,
                  p,
                  h,
                  f = !1;
                function d() {
                  t.operation(function () {
                    for (; !f; ) (m(), g());
                    v();
                  });
                }
                function m() {
                  var e = t.getRange(a.from(), a.to()).replace(s, l),
                    n = a.to().line;
                  (a.replace(e), (p = a.to().line), (i += p - n), (h = p < n));
                }
                function g() {
                  for (
                    ;
                    (l = void 0),
                      (c = void 0),
                      (l = u && ne(a.to())),
                      (c = a.findNext()) && !c[0] && l && re(a.from(), l) && (c = a.findNext()),
                      c &&
                        ((e = a.from()),
                        (n = o),
                        (s = i),
                        'number' != typeof e && (e = e.line),
                        n instanceof Array
                          ? T(e, n)
                          : 'number' == typeof s
                            ? e >= n && e <= s
                            : e == n);
                  )
                    if (r || a.from().line != p || h)
                      return (
                        t.scrollIntoView(a.from(), 30),
                        t.setSelection(a.from(), a.to()),
                        (u = a.from()),
                        void (f = !1)
                      );
                  var e, n, s, l, c;
                  f = !0;
                }
                function v(e) {
                  if ((e && e(), t.focus(), u)) {
                    t.setCursor(u);
                    var n = t.state.vim;
                    ((n.exMode = !1), (n.lastHPos = n.lastHSPos = u.ch));
                  }
                  c && c();
                }
                if ((g(), !f))
                  return n
                    ? void _e(t, {
                        prefix: Pe('span', 'replace with ', Pe('strong', l), ' (y/n/a/q/l)'),
                        onKeyDown: function (n, r, o) {
                          switch ((e.e_stop(n), e.keyName(n))) {
                            case 'Y':
                              (m(), g());
                              break;
                            case 'N':
                              g();
                              break;
                            case 'A':
                              var i = c;
                              ((c = void 0), t.operation(d), (c = i));
                              break;
                            case 'L':
                              m();
                            case 'Q':
                            case 'Esc':
                            case 'Ctrl-C':
                            case 'Ctrl-[':
                              v(o);
                          }
                          return (f && v(o), !0);
                        },
                      })
                    : (d(), void (c && c()));
                je(t, 'No matches for ' + s.source);
              })(n, p, h, m, g, y, d, u, r.callback);
            } else je(n, 'No previous substitute regular expression');
          },
          redo: e.commands.redo,
          undo: e.commands.undo,
          write: function (t) {
            e.commands.save ? e.commands.save(t) : t.save && t.save();
          },
          nohlsearch: function (e) {
            We(e);
          },
          yank: function (e) {
            var t = ne(e.getCursor()).line,
              n = e.getLine(t);
            B.registerController.pushText('0', 'yank', n, !0, !0);
          },
          delmarks: function (t, n) {
            if (n.argString && ce(n.argString))
              for (var r = t.state.vim, o = new e.StringStream(ce(n.argString)); !o.eol(); ) {
                o.eatSpace();
                var i = o.pos;
                if (!o.match(/[a-zA-Z]/, !1))
                  return void je(t, 'Invalid argument: ' + n.argString.substring(i));
                var a = o.next();
                if (o.match('-', !0)) {
                  if (!o.match(/[a-zA-Z]/, !1))
                    return void je(t, 'Invalid argument: ' + n.argString.substring(i));
                  var s = a,
                    l = o.next();
                  if (!((S(s) && S(l)) || (A(s) && A(l))))
                    return void je(t, 'Invalid argument: ' + s + '-');
                  var c = s.charCodeAt(0),
                    u = l.charCodeAt(0);
                  if (c >= u) return void je(t, 'Invalid argument: ' + n.argString.substring(i));
                  for (var p = 0; p <= u - c; p++) {
                    var h = String.fromCharCode(c + p);
                    delete r.marks[h];
                  }
                } else delete r.marks[a];
              }
            else je(t, 'Argument required');
          },
        },
        ze = new qe();
      function Xe(t) {
        var n = t.state.vim,
          r = B.macroModeState,
          o = B.registerController.getRegister('.'),
          i = r.isPlaying,
          a = r.lastInsertModeChanges;
        (i || (t.off('change', Ye), e.off(t.getInputField(), 'keydown', rt)),
          !i &&
            n.insertModeRepeat > 1 &&
            (ot(t, n, n.insertModeRepeat - 1, !0),
            (n.lastEditInputState.repeatOverride = n.insertModeRepeat)),
          delete n.insertModeRepeat,
          (n.insertMode = !1),
          t.setCursor(t.getCursor().line, t.getCursor().ch - 1),
          t.setOption('keyMap', 'vim'),
          t.setOption('disableInput', !0),
          t.toggleOverwrite(!1),
          o.setText(a.changes.join('')),
          e.signal(t, 'vim-mode-change', { mode: 'normal' }),
          r.isRecording &&
            (function (e) {
              if (!e.isPlaying) {
                var t = e.latestRegister,
                  n = B.registerController.getRegister(t);
                n && n.pushInsertModeChanges && n.pushInsertModeChanges(e.lastInsertModeChanges);
              }
            })(r));
      }
      function Ze(e) {
        r.unshift(e);
      }
      function Ge(e, t, n, r) {
        var o = B.registerController.getRegister(r);
        if (':' == r)
          return (o.keyBuffer[0] && ze.processCommand(e, o.keyBuffer[0]), void (n.isPlaying = !1));
        var i = o.keyBuffer,
          a = 0;
        ((n.isPlaying = !0), (n.replaySearchQueries = o.searchQueries.slice(0)));
        for (var s = 0; s < i.length; s++)
          for (var l, c, u = i[s]; u; )
            if (
              ((c = (l = /<\w+-.+?>|<\w+>|./.exec(u))[0]),
              (u = u.substring(l.index + c.length)),
              D.handleKey(e, c, 'macro'),
              t.insertMode)
            ) {
              var p = o.insertModeChanges[a++].changes;
              ((B.macroModeState.lastInsertModeChanges.changes = p), it(e, p, 1), Xe(e));
            }
        n.isPlaying = !1;
      }
      function Ye(e, t) {
        var n = B.macroModeState,
          r = n.lastInsertModeChanges;
        if (!n.isPlaying)
          for (; t; ) {
            if (((r.expectCursorActivityForChange = !0), r.ignoreCount > 1)) r.ignoreCount--;
            else if ('+input' == t.origin || 'paste' == t.origin || void 0 === t.origin) {
              var o = e.listSelections().length;
              o > 1 && (r.ignoreCount = o);
              var i = t.text.join('\n');
              (r.maybeReset && ((r.changes = []), (r.maybeReset = !1)),
                i &&
                  (e.state.overwrite && !/\n/.test(i) ? r.changes.push([i]) : r.changes.push(i)));
            }
            t = t.next;
          }
      }
      function et(e) {
        var t = e.state.vim;
        if (t.insertMode) {
          var n = B.macroModeState;
          if (n.isPlaying) return;
          var r = n.lastInsertModeChanges;
          r.expectCursorActivityForChange
            ? (r.expectCursorActivityForChange = !1)
            : (r.maybeReset = !0);
        } else e.curOp.isVimOp || tt(e, t);
      }
      function tt(t, n) {
        var r = t.getCursor('anchor'),
          o = t.getCursor('head');
        if (
          (n.visualMode && !t.somethingSelected()
            ? ge(t, !1)
            : n.visualMode ||
              n.insertMode ||
              !t.somethingSelected() ||
              ((n.visualMode = !0),
              (n.visualLine = !1),
              e.signal(t, 'vim-mode-change', { mode: 'visual' })),
          n.visualMode)
        ) {
          var i = oe(o, r) ? 0 : -1,
            a = oe(o, r) ? -1 : 0;
          ((o = Y(o, 0, i)),
            (r = Y(r, 0, a)),
            (n.sel = { anchor: r, head: o }),
            be(t, n, '<', ie(o, r)),
            be(t, n, '>', ae(o, r)));
        } else n.insertMode || (n.lastHPos = t.getCursor().ch);
      }
      function nt(e) {
        this.keyName = e;
      }
      function rt(t) {
        var n = B.macroModeState.lastInsertModeChanges,
          r = e.keyName(t);
        r &&
          ((-1 == r.indexOf('Delete') && -1 == r.indexOf('Backspace')) ||
            e.lookupKey(r, 'vim-insert', function () {
              return (
                n.maybeReset && ((n.changes = []), (n.maybeReset = !1)),
                n.changes.push(new nt(r)),
                !0
              );
            }));
      }
      function ot(e, t, n, r) {
        var o = B.macroModeState;
        o.isPlaying = !0;
        var i = !!t.lastEditActionCommand,
          a = t.inputState;
        function s() {
          i ? J.processAction(e, t, t.lastEditActionCommand) : J.evalInput(e, t);
        }
        function l(n) {
          if (o.lastInsertModeChanges.changes.length > 0) {
            n = t.lastEditActionCommand ? n : 1;
            var r = o.lastInsertModeChanges;
            it(e, r.changes, n);
          }
        }
        if (
          ((t.inputState = t.lastEditInputState),
          i && t.lastEditActionCommand.interlaceInsertRepeat)
        )
          for (var c = 0; c < n; c++) (s(), l(1));
        else (r || s(), l(n));
        ((t.inputState = a), t.insertMode && !r && Xe(e), (o.isPlaying = !1));
      }
      function it(t, n, r) {
        function o(n) {
          return ('string' == typeof n ? e.commands[n](t) : n(t), !0);
        }
        var i = t.getCursor('head'),
          a = B.macroModeState.lastInsertModeChanges.visualBlock;
        a && (he(t, i, a + 1), (r = t.listSelections().length), t.setCursor(i));
        for (var s = 0; s < r; s++) {
          a && t.setCursor(Y(i, s, 0));
          for (var l = 0; l < n.length; l++) {
            var c = n[l];
            if (c instanceof nt) e.lookupKey(c.keyName, 'vim-insert', o);
            else if ('string' == typeof c) t.replaceSelection(c);
            else {
              var u = t.getCursor(),
                p = Y(u, 0, c[0].length);
              (t.replaceRange(c[0], u, p), t.setCursor(p));
            }
          }
        }
        a && t.setCursor(Y(i, 0, 1));
      }
      function at(e) {
        var t = new e.constructor();
        return (
          Object.keys(e).forEach(function (n) {
            var r = e[n];
            (Array.isArray(r)
              ? (r = r.slice())
              : r && 'object' == typeof r && r.constructor != Object && (r = at(r)),
              (t[n] = r));
          }),
          e.sel &&
            (t.sel = {
              head: e.sel.head && ne(e.sel.head),
              anchor: e.sel.anchor && ne(e.sel.anchor),
            }),
          t
        );
      }
      return (
        (e.keyMap.vim = { attach: l, detach: s, call: c }),
        E('insertModeEscKeysTimeout', 200, 'number'),
        (e.keyMap['vim-insert'] = { fallthrough: ['default'], attach: l, detach: s, call: c }),
        (e.keyMap['vim-replace'] = {
          Backspace: 'goCharLeft',
          fallthrough: ['vim-insert'],
          attach: l,
          detach: s,
          call: c,
        }),
        H(),
        D
      );
    })(t)),
    t.Vim);
});
