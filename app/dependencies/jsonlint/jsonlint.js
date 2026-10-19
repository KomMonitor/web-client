var jsonlint = (function () {
  var t = !0,
    e = {},
    i = (function () {
      var t = {
          trace: function () {},
          yy: {},
          symbols_: {
            error: 2,
            JSONString: 3,
            STRING: 4,
            JSONNumber: 5,
            NUMBER: 6,
            JSONNullLiteral: 7,
            NULL: 8,
            JSONBooleanLiteral: 9,
            TRUE: 10,
            FALSE: 11,
            JSONText: 12,
            JSONValue: 13,
            EOF: 14,
            JSONObject: 15,
            JSONArray: 16,
            '{': 17,
            '}': 18,
            JSONMemberList: 19,
            JSONMember: 20,
            ':': 21,
            ',': 22,
            '[': 23,
            ']': 24,
            JSONElementList: 25,
            $accept: 0,
            $end: 1,
          },
          terminals_: {
            2: 'error',
            4: 'STRING',
            6: 'NUMBER',
            8: 'NULL',
            10: 'TRUE',
            11: 'FALSE',
            14: 'EOF',
            17: '{',
            18: '}',
            21: ':',
            22: ',',
            23: '[',
            24: ']',
          },
          productions_: [
            0,
            [3, 1],
            [5, 1],
            [7, 1],
            [9, 1],
            [9, 1],
            [12, 2],
            [13, 1],
            [13, 1],
            [13, 1],
            [13, 1],
            [13, 1],
            [13, 1],
            [15, 2],
            [15, 3],
            [20, 3],
            [19, 1],
            [19, 3],
            [16, 2],
            [16, 3],
            [25, 1],
            [25, 3],
          ],
          performAction: function (t, e, i, n, s, r, h) {
            var l = r.length - 1;
            switch (s) {
              case 1:
                this.$ = t
                  .replace(/\\(\\|")/g, '$1')
                  .replace(/\\n/g, '\n')
                  .replace(/\\r/g, '\r')
                  .replace(/\\t/g, '\t')
                  .replace(/\\v/g, '\v')
                  .replace(/\\f/g, '\f')
                  .replace(/\\b/g, '\b');
                break;
              case 2:
                this.$ = Number(t);
                break;
              case 3:
                this.$ = null;
                break;
              case 4:
                this.$ = !0;
                break;
              case 5:
                this.$ = !1;
                break;
              case 6:
                return (this.$ = r[l - 1]);
              case 13:
                this.$ = {};
                break;
              case 14:
              case 19:
                this.$ = r[l - 1];
                break;
              case 15:
                this.$ = [r[l - 2], r[l]];
                break;
              case 16:
                ((this.$ = {}), (this.$[r[l][0]] = r[l][1]));
                break;
              case 17:
                ((this.$ = r[l - 2]), (r[l - 2][r[l][0]] = r[l][1]));
                break;
              case 18:
                this.$ = [];
                break;
              case 20:
                this.$ = [r[l]];
                break;
              case 21:
                ((this.$ = r[l - 2]), r[l - 2].push(r[l]));
            }
          },
          table: [
            {
              3: 5,
              4: [1, 12],
              5: 6,
              6: [1, 13],
              7: 3,
              8: [1, 9],
              9: 4,
              10: [1, 10],
              11: [1, 11],
              12: 1,
              13: 2,
              15: 7,
              16: 8,
              17: [1, 14],
              23: [1, 15],
            },
            { 1: [3] },
            { 14: [1, 16] },
            { 14: [2, 7], 18: [2, 7], 22: [2, 7], 24: [2, 7] },
            { 14: [2, 8], 18: [2, 8], 22: [2, 8], 24: [2, 8] },
            { 14: [2, 9], 18: [2, 9], 22: [2, 9], 24: [2, 9] },
            { 14: [2, 10], 18: [2, 10], 22: [2, 10], 24: [2, 10] },
            { 14: [2, 11], 18: [2, 11], 22: [2, 11], 24: [2, 11] },
            { 14: [2, 12], 18: [2, 12], 22: [2, 12], 24: [2, 12] },
            { 14: [2, 3], 18: [2, 3], 22: [2, 3], 24: [2, 3] },
            { 14: [2, 4], 18: [2, 4], 22: [2, 4], 24: [2, 4] },
            { 14: [2, 5], 18: [2, 5], 22: [2, 5], 24: [2, 5] },
            { 14: [2, 1], 18: [2, 1], 21: [2, 1], 22: [2, 1], 24: [2, 1] },
            { 14: [2, 2], 18: [2, 2], 22: [2, 2], 24: [2, 2] },
            { 3: 20, 4: [1, 12], 18: [1, 17], 19: 18, 20: 19 },
            {
              3: 5,
              4: [1, 12],
              5: 6,
              6: [1, 13],
              7: 3,
              8: [1, 9],
              9: 4,
              10: [1, 10],
              11: [1, 11],
              13: 23,
              15: 7,
              16: 8,
              17: [1, 14],
              23: [1, 15],
              24: [1, 21],
              25: 22,
            },
            { 1: [2, 6] },
            { 14: [2, 13], 18: [2, 13], 22: [2, 13], 24: [2, 13] },
            { 18: [1, 24], 22: [1, 25] },
            { 18: [2, 16], 22: [2, 16] },
            { 21: [1, 26] },
            { 14: [2, 18], 18: [2, 18], 22: [2, 18], 24: [2, 18] },
            { 22: [1, 28], 24: [1, 27] },
            { 22: [2, 20], 24: [2, 20] },
            { 14: [2, 14], 18: [2, 14], 22: [2, 14], 24: [2, 14] },
            { 3: 20, 4: [1, 12], 20: 29 },
            {
              3: 5,
              4: [1, 12],
              5: 6,
              6: [1, 13],
              7: 3,
              8: [1, 9],
              9: 4,
              10: [1, 10],
              11: [1, 11],
              13: 30,
              15: 7,
              16: 8,
              17: [1, 14],
              23: [1, 15],
            },
            { 14: [2, 19], 18: [2, 19], 22: [2, 19], 24: [2, 19] },
            {
              3: 5,
              4: [1, 12],
              5: 6,
              6: [1, 13],
              7: 3,
              8: [1, 9],
              9: 4,
              10: [1, 10],
              11: [1, 11],
              13: 31,
              15: 7,
              16: 8,
              17: [1, 14],
              23: [1, 15],
            },
            { 18: [2, 17], 22: [2, 17] },
            { 18: [2, 15], 22: [2, 15] },
            { 22: [2, 21], 24: [2, 21] },
          ],
          defaultActions: { 16: [2, 6] },
          parseError: function (t, e) {
            throw new Error(t);
          },
          parse: function (t) {
            function e(t) {
              ((s.length = s.length - 2 * t), (r.length = r.length - t), (h.length = h.length - t));
            }
            function i() {
              var t;
              return ('number' != typeof (t = n.lexer.lex() || 1) && (t = n.symbols_[t] || t), t);
            }
            var n = this,
              s = [0],
              r = [null],
              h = [],
              l = this.table,
              o = '',
              a = 0,
              c = 0,
              u = 0;
            (this.lexer.setInput(t),
              (this.lexer.yy = this.yy),
              (this.yy.lexer = this.lexer),
              void 0 === this.lexer.yylloc && (this.lexer.yylloc = {}));
            var y = this.lexer.yylloc;
            (h.push(y),
              'function' == typeof this.yy.parseError && (this.parseError = this.yy.parseError));
            for (var p, f, g, m, _, x, d, b, E, S = {}; ; ) {
              if (
                ((g = s[s.length - 1]),
                this.defaultActions[g]
                  ? (m = this.defaultActions[g])
                  : (null == p && (p = i()), (m = l[g] && l[g][p])),
                void 0 === m || !m.length || !m[0])
              ) {
                if (!u) {
                  for (x in ((E = []), l[g]))
                    this.terminals_[x] && x > 2 && E.push("'" + this.terminals_[x] + "'");
                  var v = '';
                  ((v = this.lexer.showPosition
                    ? 'Parse error on line ' +
                      (a + 1) +
                      ':\n' +
                      this.lexer.showPosition() +
                      '\nExpecting ' +
                      E.join(', ') +
                      ", got '" +
                      this.terminals_[p] +
                      "'"
                    : 'Parse error on line ' +
                      (a + 1) +
                      ': Unexpected ' +
                      (1 == p ? 'end of input' : "'" + (this.terminals_[p] || p) + "'")),
                    this.parseError(v, {
                      text: this.lexer.match,
                      token: this.terminals_[p] || p,
                      line: this.lexer.yylineno,
                      loc: y,
                      expected: E,
                    }));
                }
                if (3 == u) {
                  if (1 == p) throw new Error(v || 'Parsing halted.');
                  ((c = this.lexer.yyleng),
                    (o = this.lexer.yytext),
                    (a = this.lexer.yylineno),
                    (y = this.lexer.yylloc),
                    (p = i()));
                }
                for (; !((2).toString() in l[g]); ) {
                  if (0 == g) throw new Error(v || 'Parsing halted.');
                  (e(1), (g = s[s.length - 1]));
                }
                ((f = p), (p = 2), (m = l[(g = s[s.length - 1])] && l[g][2]), (u = 3));
              }
              if (m[0] instanceof Array && m.length > 1)
                throw new Error(
                  'Parse Error: multiple actions possible at state: ' + g + ', token: ' + p
                );
              switch (m[0]) {
                case 1:
                  (s.push(p),
                    r.push(this.lexer.yytext),
                    h.push(this.lexer.yylloc),
                    s.push(m[1]),
                    (p = null),
                    f
                      ? ((p = f), (f = null))
                      : ((c = this.lexer.yyleng),
                        (o = this.lexer.yytext),
                        (a = this.lexer.yylineno),
                        (y = this.lexer.yylloc),
                        u > 0 && u--));
                  break;
                case 2:
                  if (
                    ((d = this.productions_[m[1]][1]),
                    (S.$ = r[r.length - d]),
                    (S._$ = {
                      first_line: h[h.length - (d || 1)].first_line,
                      last_line: h[h.length - 1].last_line,
                      first_column: h[h.length - (d || 1)].first_column,
                      last_column: h[h.length - 1].last_column,
                    }),
                    void 0 !== (_ = this.performAction.call(S, o, c, a, this.yy, m[1], r, h)))
                  )
                    return _;
                  (d &&
                    ((s = s.slice(0, -1 * d * 2)),
                    (r = r.slice(0, -1 * d)),
                    (h = h.slice(0, -1 * d))),
                    s.push(this.productions_[m[1]][0]),
                    r.push(S.$),
                    h.push(S._$),
                    (b = l[s[s.length - 2]][s[s.length - 1]]),
                    s.push(b));
                  break;
                case 3:
                  return !0;
              }
            }
            return !0;
          },
        },
        e = (function () {
          var t = {
            EOF: 1,
            parseError: function (t, e) {
              if (!this.yy.parseError) throw new Error(t);
              this.yy.parseError(t, e);
            },
            setInput: function (t) {
              return (
                (this._input = t),
                (this._more = this._less = this.done = !1),
                (this.yylineno = this.yyleng = 0),
                (this.yytext = this.matched = this.match = ''),
                (this.conditionStack = ['INITIAL']),
                (this.yylloc = { first_line: 1, first_column: 0, last_line: 1, last_column: 0 }),
                this
              );
            },
            input: function () {
              var t = this._input[0];
              return (
                (this.yytext += t),
                this.yyleng++,
                (this.match += t),
                (this.matched += t),
                t.match(/\n/) && this.yylineno++,
                (this._input = this._input.slice(1)),
                t
              );
            },
            unput: function (t) {
              return ((this._input = t + this._input), this);
            },
            more: function () {
              return ((this._more = !0), this);
            },
            less: function (t) {
              this._input = this.match.slice(t) + this._input;
            },
            pastInput: function () {
              var t = this.matched.substr(0, this.matched.length - this.match.length);
              return (t.length > 20 ? '...' : '') + t.substr(-20).replace(/\n/g, '');
            },
            upcomingInput: function () {
              var t = this.match;
              return (
                t.length < 20 && (t += this._input.substr(0, 20 - t.length)),
                (t.substr(0, 20) + (t.length > 20 ? '...' : '')).replace(/\n/g, '')
              );
            },
            showPosition: function () {
              var t = this.pastInput(),
                e = new Array(t.length + 1).join('-');
              return t + this.upcomingInput() + '\n' + e + '^';
            },
            next: function () {
              if (this.done) return this.EOF;
              var t, e, i, n, s;
              (this._input || (this.done = !0),
                this._more || ((this.yytext = ''), (this.match = '')));
              for (
                var r = this._currentRules(), h = 0;
                h < r.length &&
                (!(i = this._input.match(this.rules[r[h]])) ||
                  (e && !(i[0].length > e[0].length)) ||
                  ((e = i), (n = h), this.options.flex));
                h++
              );
              return e
                ? ((s = e[0].match(/\n.*/g)) && (this.yylineno += s.length),
                  (this.yylloc = {
                    first_line: this.yylloc.last_line,
                    last_line: this.yylineno + 1,
                    first_column: this.yylloc.last_column,
                    last_column: s
                      ? s[s.length - 1].length - 1
                      : this.yylloc.last_column + e[0].length,
                  }),
                  (this.yytext += e[0]),
                  (this.match += e[0]),
                  (this.yyleng = this.yytext.length),
                  (this._more = !1),
                  (this._input = this._input.slice(e[0].length)),
                  (this.matched += e[0]),
                  (t = this.performAction.call(
                    this,
                    this.yy,
                    this,
                    r[n],
                    this.conditionStack[this.conditionStack.length - 1]
                  )),
                  this.done && this._input && (this.done = !1),
                  t || void 0)
                : '' === this._input
                  ? this.EOF
                  : void this.parseError(
                      'Lexical error on line ' +
                        (this.yylineno + 1) +
                        '. Unrecognized text.\n' +
                        this.showPosition(),
                      { text: '', token: null, line: this.yylineno }
                    );
            },
            lex: function () {
              var t = this.next();
              return void 0 !== t ? t : this.lex();
            },
            begin: function (t) {
              this.conditionStack.push(t);
            },
            popState: function () {
              return this.conditionStack.pop();
            },
            _currentRules: function () {
              return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
            },
            topState: function () {
              return this.conditionStack[this.conditionStack.length - 2];
            },
            pushState: function (t) {
              this.begin(t);
            },
            options: {},
            performAction: function (t, e, i, n) {
              switch (i) {
                case 0:
                  break;
                case 1:
                  return 6;
                case 2:
                  return ((e.yytext = e.yytext.substr(1, e.yyleng - 2)), 4);
                case 3:
                  return 17;
                case 4:
                  return 18;
                case 5:
                  return 23;
                case 6:
                  return 24;
                case 7:
                  return 22;
                case 8:
                  return 21;
                case 9:
                  return 10;
                case 10:
                  return 11;
                case 11:
                  return 8;
                case 12:
                  return 14;
                case 13:
                  return 'INVALID';
              }
            },
            rules: [
              /^(?:\s+)/,
              /^(?:(-?([0-9]|[1-9][0-9]+))(\.[0-9]+)?([eE][-+]?[0-9]+)?\b)/,
              /^(?:"(?:\\[\\"bfnrt/]|\\u[a-fA-F0-9]{4}|[^\\\0-\x09\x0a-\x1f"])*")/,
              /^(?:\{)/,
              /^(?:\})/,
              /^(?:\[)/,
              /^(?:\])/,
              /^(?:,)/,
              /^(?::)/,
              /^(?:true\b)/,
              /^(?:false\b)/,
              /^(?:null\b)/,
              /^(?:$)/,
              /^(?:.)/,
            ],
            conditions: {
              INITIAL: { rules: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], inclusive: !0 },
            },
          };
          return t;
        })();
      return ((t.lexer = e), t);
    })();
  return (
    void 0 !== e &&
      ((e.parser = i),
      (e.parse = function () {
        return i.parse.apply(i, arguments);
      }),
      (e.main = function (i) {
        if (!i[1]) throw new Error('Usage: ' + i[0] + ' FILE');
        if ('undefined' != typeof process)
          var n = t('fs').readFileSync(t('path').join(process.cwd(), i[1]), 'utf8');
        else n = t('file').path(t('file').cwd()).join(i[1]).read({ charset: 'utf-8' });
        return e.parser.parse(n);
      }),
      !1 === t.main &&
        e.main('undefined' != typeof process ? process.argv.slice(1) : t('system').args)),
    e
  );
})();
