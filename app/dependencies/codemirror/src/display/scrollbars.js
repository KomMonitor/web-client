import { addClass, elt, rmClass } from '../util/dom.js';
import { on } from '../util/event.js';
import { scrollGap, paddingVert } from '../measurement/position_measurement.js';
import { ie, ie_version, mac, mac_geMountainLion } from '../util/browser.js';
import { updateHeightsInViewport } from './update_lines.js';
import { Delayed } from '../util/misc.js';
import { setScrollLeft, updateScrollTop } from './scrolling.js';
export function measureForScrollbars(t) {
  let e = t.display,
    i = e.gutters.offsetWidth,
    l = Math.round(t.doc.height + paddingVert(t.display));
  return {
    clientHeight: e.scroller.clientHeight,
    viewHeight: e.wrapper.clientHeight,
    scrollWidth: e.scroller.scrollWidth,
    clientWidth: e.scroller.clientWidth,
    viewWidth: e.wrapper.clientWidth,
    barLeft: t.options.fixedGutter ? i : 0,
    docHeight: l,
    scrollHeight: l + scrollGap(t) + e.barHeight,
    nativeBarWidth: e.nativeBarWidth,
    gutterWidth: i,
  };
}
class NativeScrollbars {
  constructor(t, e, i) {
    this.cm = i;
    let l = (this.vert = elt(
        'div',
        [elt('div', null, null, 'min-width: 1px')],
        'CodeMirror-vscrollbar'
      )),
      r = (this.horiz = elt(
        'div',
        [elt('div', null, null, 'height: 100%; min-height: 1px')],
        'CodeMirror-hscrollbar'
      ));
    ((l.tabIndex = r.tabIndex = -1),
      t(l),
      t(r),
      on(l, 'scroll', () => {
        l.clientHeight && e(l.scrollTop, 'vertical');
      }),
      on(r, 'scroll', () => {
        r.clientWidth && e(r.scrollLeft, 'horizontal');
      }),
      (this.checkedZeroWidth = !1),
      ie && ie_version < 8 && (this.horiz.style.minHeight = this.vert.style.minWidth = '18px'));
  }
  update(t) {
    let e = t.scrollWidth > t.clientWidth + 1,
      i = t.scrollHeight > t.clientHeight + 1,
      l = t.nativeBarWidth;
    if (i) {
      ((this.vert.style.display = 'block'), (this.vert.style.bottom = e ? l + 'px' : '0'));
      let i = t.viewHeight - (e ? l : 0);
      this.vert.firstChild.style.height = Math.max(0, t.scrollHeight - t.clientHeight + i) + 'px';
    } else
      ((this.vert.scrollTop = 0),
        (this.vert.style.display = ''),
        (this.vert.firstChild.style.height = '0'));
    if (e) {
      ((this.horiz.style.display = 'block'),
        (this.horiz.style.right = i ? l + 'px' : '0'),
        (this.horiz.style.left = t.barLeft + 'px'));
      let e = t.viewWidth - t.barLeft - (i ? l : 0);
      this.horiz.firstChild.style.width = Math.max(0, t.scrollWidth - t.clientWidth + e) + 'px';
    } else ((this.horiz.style.display = ''), (this.horiz.firstChild.style.width = '0'));
    return (
      !this.checkedZeroWidth &&
        t.clientHeight > 0 &&
        (0 == l && this.zeroWidthHack(), (this.checkedZeroWidth = !0)),
      { right: i ? l : 0, bottom: e ? l : 0 }
    );
  }
  setScrollLeft(t) {
    (this.horiz.scrollLeft != t && (this.horiz.scrollLeft = t),
      this.disableHoriz && this.enableZeroWidthBar(this.horiz, this.disableHoriz, 'horiz'));
  }
  setScrollTop(t) {
    (this.vert.scrollTop != t && (this.vert.scrollTop = t),
      this.disableVert && this.enableZeroWidthBar(this.vert, this.disableVert, 'vert'));
  }
  zeroWidthHack() {
    let t = mac && !mac_geMountainLion ? '12px' : '18px';
    ((this.horiz.style.height = this.vert.style.width = t),
      (this.horiz.style.visibility = this.vert.style.visibility = 'hidden'),
      (this.disableHoriz = new Delayed()),
      (this.disableVert = new Delayed()));
  }
  enableZeroWidthBar(t, e, i) {
    ((t.style.visibility = ''),
      e.set(1e3, function l() {
        let r = t.getBoundingClientRect();
        ('vert' == i
          ? document.elementFromPoint(r.right - 1, (r.top + r.bottom) / 2)
          : document.elementFromPoint((r.right + r.left) / 2, r.bottom - 1)) != t
          ? (t.style.visibility = 'hidden')
          : e.set(1e3, l);
      }));
  }
  clear() {
    let t = this.horiz.parentNode;
    (t.removeChild(this.horiz), t.removeChild(this.vert));
  }
}
class NullScrollbars {
  update() {
    return { bottom: 0, right: 0 };
  }
  setScrollLeft() {}
  setScrollTop() {}
  clear() {}
}
export function updateScrollbars(t, e) {
  e || (e = measureForScrollbars(t));
  let i = t.display.barWidth,
    l = t.display.barHeight;
  updateScrollbarsInner(t, e);
  for (let e = 0; (e < 4 && i != t.display.barWidth) || l != t.display.barHeight; e++)
    (i != t.display.barWidth && t.options.lineWrapping && updateHeightsInViewport(t),
      updateScrollbarsInner(t, measureForScrollbars(t)),
      (i = t.display.barWidth),
      (l = t.display.barHeight));
}
function updateScrollbarsInner(t, e) {
  let i = t.display,
    l = i.scrollbars.update(e);
  ((i.sizer.style.paddingRight = (i.barWidth = l.right) + 'px'),
    (i.sizer.style.paddingBottom = (i.barHeight = l.bottom) + 'px'),
    (i.heightForcer.style.borderBottom = l.bottom + 'px solid transparent'),
    l.right && l.bottom
      ? ((i.scrollbarFiller.style.display = 'block'),
        (i.scrollbarFiller.style.height = l.bottom + 'px'),
        (i.scrollbarFiller.style.width = l.right + 'px'))
      : (i.scrollbarFiller.style.display = ''),
    l.bottom && t.options.coverGutterNextToScrollbar && t.options.fixedGutter
      ? ((i.gutterFiller.style.display = 'block'),
        (i.gutterFiller.style.height = l.bottom + 'px'),
        (i.gutterFiller.style.width = e.gutterWidth + 'px'))
      : (i.gutterFiller.style.display = ''));
}
export let scrollbarModel = { native: NativeScrollbars, null: NullScrollbars };
export function initScrollbars(t) {
  (t.display.scrollbars &&
    (t.display.scrollbars.clear(),
    t.display.scrollbars.addClass && rmClass(t.display.wrapper, t.display.scrollbars.addClass)),
    (t.display.scrollbars = new scrollbarModel[t.options.scrollbarStyle](
      (e) => {
        (t.display.wrapper.insertBefore(e, t.display.scrollbarFiller),
          on(e, 'mousedown', () => {
            t.state.focused && setTimeout(() => t.display.input.focus(), 0);
          }),
          e.setAttribute('cm-not-content', 'true'));
      },
      (e, i) => {
        'horizontal' == i ? setScrollLeft(t, e) : updateScrollTop(t, e);
      },
      t
    )),
    t.display.scrollbars.addClass && addClass(t.display.wrapper, t.display.scrollbars.addClass));
}
