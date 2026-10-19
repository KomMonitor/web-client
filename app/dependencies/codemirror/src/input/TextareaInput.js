import { operation, runInOp } from '../display/operations.js';
import { prepareSelection } from '../display/selection.js';
import {
  applyTextInput,
  copyableRanges,
  handlePaste,
  hiddenTextarea,
  disableBrowserMagic,
  setLastCopied,
} from './input.js';
import { cursorCoords, posFromMouse } from '../measurement/position_measurement.js';
import { eventInWidget } from '../measurement/widgets.js';
import { simpleSelection } from '../model/selection.js';
import { selectAll, setSelection } from '../model/selection_updates.js';
import {
  captureRightClick,
  ie,
  ie_version,
  ios,
  mac,
  mobile,
  presto,
  webkit,
} from '../util/browser.js';
import { activeElt, removeChildrenAndAdd, selectInput, rootNode } from '../util/dom.js';
import { e_preventDefault, e_stop, off, on, signalDOMEvent } from '../util/event.js';
import { hasSelection } from '../util/feature_detection.js';
import { Delayed, sel_dontScroll } from '../util/misc.js';
export default class TextareaInput {
  constructor(e) {
    ((this.cm = e),
      (this.prevInput = ''),
      (this.pollingFast = !1),
      (this.polling = new Delayed()),
      (this.hasSelection = !1),
      (this.composing = null),
      (this.resetting = !1));
  }
  init(e) {
    let t = this,
      i = this.cm;
    this.createField(e);
    const s = this.textarea;
    function o(e) {
      if (!signalDOMEvent(i, e)) {
        if (i.somethingSelected()) setLastCopied({ lineWise: !1, text: i.getSelections() });
        else {
          if (!i.options.lineWiseCopyCut) return;
          {
            let o = copyableRanges(i);
            (setLastCopied({ lineWise: !0, text: o.text }),
              'cut' == e.type
                ? i.setSelections(o.ranges, null, sel_dontScroll)
                : ((t.prevInput = ''), (s.value = o.text.join('\n')), selectInput(s)));
          }
        }
        'cut' == e.type && (i.state.cutIncoming = +new Date());
      }
    }
    (e.wrapper.insertBefore(this.wrapper, e.wrapper.firstChild),
      ios && (s.style.width = '0px'),
      on(s, 'input', () => {
        (ie && ie_version >= 9 && this.hasSelection && (this.hasSelection = null), t.poll());
      }),
      on(s, 'paste', (e) => {
        signalDOMEvent(i, e) ||
          handlePaste(e, i) ||
          ((i.state.pasteIncoming = +new Date()), t.fastPoll());
      }),
      on(s, 'cut', o),
      on(s, 'copy', o),
      on(e.scroller, 'paste', (o) => {
        if (eventInWidget(e, o) || signalDOMEvent(i, o)) return;
        if (!s.dispatchEvent) return ((i.state.pasteIncoming = +new Date()), void t.focus());
        const n = new Event('paste');
        ((n.clipboardData = o.clipboardData), s.dispatchEvent(n));
      }),
      on(e.lineSpace, 'selectstart', (t) => {
        eventInWidget(e, t) || e_preventDefault(t);
      }),
      on(s, 'compositionstart', () => {
        let e = i.getCursor('from');
        (t.composing && t.composing.range.clear(),
          (t.composing = {
            start: e,
            range: i.markText(e, i.getCursor('to'), { className: 'CodeMirror-composing' }),
          }));
      }),
      on(s, 'compositionend', () => {
        t.composing && (t.poll(), t.composing.range.clear(), (t.composing = null));
      }));
  }
  createField(e) {
    ((this.wrapper = hiddenTextarea()), (this.textarea = this.wrapper.firstChild));
    let t = this.cm.options;
    disableBrowserMagic(this.textarea, t.spellcheck, t.autocorrect, t.autocapitalize);
  }
  screenReaderLabelChanged(e) {
    e ? this.textarea.setAttribute('aria-label', e) : this.textarea.removeAttribute('aria-label');
  }
  prepareSelection() {
    let e = this.cm,
      t = e.display,
      i = e.doc,
      s = prepareSelection(e);
    if (e.options.moveInputWithCursor) {
      let o = cursorCoords(e, i.sel.primary().head, 'div'),
        n = t.wrapper.getBoundingClientRect(),
        l = t.lineDiv.getBoundingClientRect();
      ((s.teTop = Math.max(0, Math.min(t.wrapper.clientHeight - 10, o.top + l.top - n.top))),
        (s.teLeft = Math.max(0, Math.min(t.wrapper.clientWidth - 10, o.left + l.left - n.left))));
    }
    return s;
  }
  showSelection(e) {
    let t = this.cm.display;
    (removeChildrenAndAdd(t.cursorDiv, e.cursors),
      removeChildrenAndAdd(t.selectionDiv, e.selection),
      null != e.teTop &&
        ((this.wrapper.style.top = e.teTop + 'px'), (this.wrapper.style.left = e.teLeft + 'px')));
  }
  reset(e) {
    if (this.contextMenuPending || (this.composing && e)) return;
    let t = this.cm;
    if (((this.resetting = !0), t.somethingSelected())) {
      this.prevInput = '';
      let e = t.getSelection();
      ((this.textarea.value = e),
        t.state.focused && selectInput(this.textarea),
        ie && ie_version >= 9 && (this.hasSelection = e));
    } else
      e ||
        ((this.prevInput = this.textarea.value = ''),
        ie && ie_version >= 9 && (this.hasSelection = null));
    this.resetting = !1;
  }
  getField() {
    return this.textarea;
  }
  supportsTouch() {
    return !1;
  }
  focus() {
    if (
      'nocursor' != this.cm.options.readOnly &&
      (!mobile || activeElt(rootNode(this.textarea)) != this.textarea)
    )
      try {
        this.textarea.focus();
      } catch (e) {}
  }
  blur() {
    this.textarea.blur();
  }
  resetPosition() {
    this.wrapper.style.top = this.wrapper.style.left = 0;
  }
  receivedFocus() {
    this.slowPoll();
  }
  slowPoll() {
    this.pollingFast ||
      this.polling.set(this.cm.options.pollInterval, () => {
        (this.poll(), this.cm.state.focused && this.slowPoll());
      });
  }
  fastPoll() {
    let e = !1,
      t = this;
    ((t.pollingFast = !0),
      t.polling.set(20, function i() {
        t.poll() || e ? ((t.pollingFast = !1), t.slowPoll()) : ((e = !0), t.polling.set(60, i));
      }));
  }
  poll() {
    let e = this.cm,
      t = this.textarea,
      i = this.prevInput;
    if (
      this.contextMenuPending ||
      this.resetting ||
      !e.state.focused ||
      (hasSelection(t) && !i && !this.composing) ||
      e.isReadOnly() ||
      e.options.disableInput ||
      e.state.keySeq
    )
      return !1;
    let s = t.value;
    if (s == i && !e.somethingSelected()) return !1;
    if ((ie && ie_version >= 9 && this.hasSelection === s) || (mac && /[\uf700-\uf7ff]/.test(s)))
      return (e.display.input.reset(), !1);
    if (e.doc.sel == e.display.selForContextMenu) {
      let e = s.charCodeAt(0);
      if ((8203 != e || i || (i = '​'), 8666 == e))
        return (this.reset(), this.cm.execCommand('undo'));
    }
    let o = 0,
      n = Math.min(i.length, s.length);
    for (; o < n && i.charCodeAt(o) == s.charCodeAt(o); ) ++o;
    return (
      runInOp(e, () => {
        (applyTextInput(e, s.slice(o), i.length - o, null, this.composing ? '*compose' : null),
          s.length > 1e3 || s.indexOf('\n') > -1
            ? (t.value = this.prevInput = '')
            : (this.prevInput = s),
          this.composing &&
            (this.composing.range.clear(),
            (this.composing.range = e.markText(this.composing.start, e.getCursor('to'), {
              className: 'CodeMirror-composing',
            }))));
      }),
      !0
    );
  }
  ensurePolled() {
    this.pollingFast && this.poll() && (this.pollingFast = !1);
  }
  onKeyPress() {
    (ie && ie_version >= 9 && (this.hasSelection = null), this.fastPoll());
  }
  onContextMenu(e) {
    let t = this,
      i = t.cm,
      s = i.display,
      o = t.textarea;
    t.contextMenuPending && t.contextMenuPending();
    let n = posFromMouse(i, e),
      l = s.scroller.scrollTop;
    if (!n || presto) return;
    i.options.resetSelectionOnContextMenu &&
      -1 == i.doc.sel.contains(n) &&
      operation(i, setSelection)(i.doc, simpleSelection(n), sel_dontScroll);
    let r,
      a = o.style.cssText,
      p = t.wrapper.style.cssText,
      c = t.wrapper.offsetParent.getBoundingClientRect();
    function u() {
      if (null != o.selectionStart) {
        let e = i.somethingSelected(),
          n = '​' + (e ? o.value : '');
        ((o.value = '⇚'),
          (o.value = n),
          (t.prevInput = e ? '' : '​'),
          (o.selectionStart = 1),
          (o.selectionEnd = n.length),
          (s.selForContextMenu = i.doc.sel));
      }
    }
    function h() {
      if (
        t.contextMenuPending == h &&
        ((t.contextMenuPending = !1),
        (t.wrapper.style.cssText = p),
        (o.style.cssText = a),
        ie && ie_version < 9 && s.scrollbars.setScrollTop((s.scroller.scrollTop = l)),
        null != o.selectionStart)
      ) {
        (!ie || (ie && ie_version < 9)) && u();
        let e = 0,
          n = () => {
            s.selForContextMenu == i.doc.sel &&
            0 == o.selectionStart &&
            o.selectionEnd > 0 &&
            '​' == t.prevInput
              ? operation(i, selectAll)(i)
              : e++ < 10
                ? (s.detectingSelectAll = setTimeout(n, 500))
                : ((s.selForContextMenu = null), s.input.reset());
          };
        s.detectingSelectAll = setTimeout(n, 200);
      }
    }
    if (
      ((t.wrapper.style.cssText = 'position: static'),
      (o.style.cssText = `position: absolute; width: 30px; height: 30px;\n      top: ${e.clientY - c.top - 5}px; left: ${e.clientX - c.left - 5}px;\n      z-index: 1000; background: ${ie ? 'rgba(255, 255, 255, .05)' : 'transparent'};\n      outline: none; border-width: 0; outline: none; overflow: hidden; opacity: .05; filter: alpha(opacity=5);`),
      webkit && (r = o.ownerDocument.defaultView.scrollY),
      s.input.focus(),
      webkit && o.ownerDocument.defaultView.scrollTo(null, r),
      s.input.reset(),
      i.somethingSelected() || (o.value = t.prevInput = ' '),
      (t.contextMenuPending = h),
      (s.selForContextMenu = i.doc.sel),
      clearTimeout(s.detectingSelectAll),
      ie && ie_version >= 9 && u(),
      captureRightClick)
    ) {
      e_stop(e);
      let t = () => {
        (off(window, 'mouseup', t), setTimeout(h, 20));
      };
      on(window, 'mouseup', t);
    } else setTimeout(h, 50);
  }
  readOnlyChanged(e) {
    (e || this.reset(), (this.textarea.disabled = 'nocursor' == e), (this.textarea.readOnly = !!e));
  }
  setUneditable() {}
}
TextareaInput.prototype.needsContentAttribute = !1;
