import { sawCollapsedSpans } from '../line/saw_special_spans.js';
import { heightAtLine, visualLineEndNo, visualLineNo } from '../line/spans.js';
import { getLine, lineNumberFor } from '../line/utils_line.js';
import {
  displayHeight,
  displayWidth,
  getDimensions,
  paddingVert,
  scrollGap,
} from '../measurement/position_measurement.js';
import { mac, webkit } from '../util/browser.js';
import { activeElt, removeChildren, contains, win, root, rootNode } from '../util/dom.js';
import { hasHandler, signal } from '../util/event.js';
import { signalLater } from '../util/operation_group.js';
import { indexOf } from '../util/misc.js';
import { buildLineElement, updateLineForChanges } from './update_line.js';
import { startWorker } from './highlight_worker.js';
import { maybeUpdateLineNumberWidth } from './line_numbers.js';
import { measureForScrollbars, updateScrollbars } from './scrollbars.js';
import { updateSelection } from './selection.js';
import { updateHeightsInViewport, visibleLines } from './update_lines.js';
import { adjustView, countDirtyView, resetView } from './view_tracking.js';
export class DisplayUpdate {
  constructor(e, i, t) {
    let o = e.display;
    ((this.viewport = i),
      (this.visible = visibleLines(o, e.doc, i)),
      (this.editorIsHidden = !o.wrapper.offsetWidth),
      (this.wrapperHeight = o.wrapper.clientHeight),
      (this.wrapperWidth = o.wrapper.clientWidth),
      (this.oldDisplayWidth = displayWidth(e)),
      (this.force = t),
      (this.dims = getDimensions(e)),
      (this.events = []));
  }
  signal(e, i) {
    hasHandler(e, i) && this.events.push(arguments);
  }
  finish() {
    for (let e = 0; e < this.events.length; e++) signal.apply(null, this.events[e]);
  }
}
export function maybeClipScrollbars(e) {
  let i = e.display;
  !i.scrollbarsClipped &&
    i.scroller.offsetWidth &&
    ((i.nativeBarWidth = i.scroller.offsetWidth - i.scroller.clientWidth),
    (i.heightForcer.style.height = scrollGap(e) + 'px'),
    (i.sizer.style.marginBottom = -i.nativeBarWidth + 'px'),
    (i.sizer.style.borderRightWidth = scrollGap(e) + 'px'),
    (i.scrollbarsClipped = !0));
}
function selectionSnapshot(e) {
  if (e.hasFocus()) return null;
  let i = activeElt(root(e));
  if (!i || !contains(e.display.lineDiv, i)) return null;
  let t = { activeElt: i };
  if (window.getSelection) {
    let i = win(e).getSelection();
    i.anchorNode &&
      i.extend &&
      contains(e.display.lineDiv, i.anchorNode) &&
      ((t.anchorNode = i.anchorNode),
      (t.anchorOffset = i.anchorOffset),
      (t.focusNode = i.focusNode),
      (t.focusOffset = i.focusOffset));
  }
  return t;
}
function restoreSelection(e) {
  if (
    e &&
    e.activeElt &&
    e.activeElt != activeElt(rootNode(e.activeElt)) &&
    (e.activeElt.focus(),
    !/^(INPUT|TEXTAREA)$/.test(e.activeElt.nodeName) &&
      e.anchorNode &&
      contains(document.body, e.anchorNode) &&
      contains(document.body, e.focusNode))
  ) {
    let i = e.activeElt.ownerDocument,
      t = i.defaultView.getSelection(),
      o = i.createRange();
    (o.setEnd(e.anchorNode, e.anchorOffset),
      o.collapse(!1),
      t.removeAllRanges(),
      t.addRange(o),
      t.extend(e.focusNode, e.focusOffset));
  }
}
export function updateDisplayIfNeeded(e, i) {
  let t = e.display,
    o = e.doc;
  if (i.editorIsHidden) return (resetView(e), !1);
  if (
    !i.force &&
    i.visible.from >= t.viewFrom &&
    i.visible.to <= t.viewTo &&
    (null == t.updateLineNumbers || t.updateLineNumbers >= t.viewTo) &&
    t.renderedView == t.view &&
    0 == countDirtyView(e)
  )
    return !1;
  maybeUpdateLineNumberWidth(e) && (resetView(e), (i.dims = getDimensions(e)));
  let r = o.first + o.size,
    s = Math.max(i.visible.from - e.options.viewportMargin, o.first),
    l = Math.min(r, i.visible.to + e.options.viewportMargin);
  (t.viewFrom < s && s - t.viewFrom < 20 && (s = Math.max(o.first, t.viewFrom)),
    t.viewTo > l && t.viewTo - l < 20 && (l = Math.min(r, t.viewTo)),
    sawCollapsedSpans && ((s = visualLineNo(e.doc, s)), (l = visualLineEndNo(e.doc, l))));
  let n =
    s != t.viewFrom ||
    l != t.viewTo ||
    t.lastWrapHeight != i.wrapperHeight ||
    t.lastWrapWidth != i.wrapperWidth;
  (adjustView(e, s, l),
    (t.viewOffset = heightAtLine(getLine(e.doc, t.viewFrom))),
    (e.display.mover.style.top = t.viewOffset + 'px'));
  let a = countDirtyView(e);
  if (
    !n &&
    0 == a &&
    !i.force &&
    t.renderedView == t.view &&
    (null == t.updateLineNumbers || t.updateLineNumbers >= t.viewTo)
  )
    return !1;
  let p = selectionSnapshot(e);
  return (
    a > 4 && (t.lineDiv.style.display = 'none'),
    patchDisplay(e, t.updateLineNumbers, i.dims),
    a > 4 && (t.lineDiv.style.display = ''),
    (t.renderedView = t.view),
    restoreSelection(p),
    removeChildren(t.cursorDiv),
    removeChildren(t.selectionDiv),
    (t.gutters.style.height = t.sizer.style.minHeight = 0),
    n &&
      ((t.lastWrapHeight = i.wrapperHeight),
      (t.lastWrapWidth = i.wrapperWidth),
      startWorker(e, 400)),
    (t.updateLineNumbers = null),
    !0
  );
}
export function postUpdateDisplay(e, i) {
  let t = i.viewport;
  for (let o = !0; ; o = !1) {
    if (o && e.options.lineWrapping && i.oldDisplayWidth != displayWidth(e))
      o && (i.visible = visibleLines(e.display, e.doc, t));
    else if (
      (t &&
        null != t.top &&
        (t = { top: Math.min(e.doc.height + paddingVert(e.display) - displayHeight(e), t.top) }),
      (i.visible = visibleLines(e.display, e.doc, t)),
      i.visible.from >= e.display.viewFrom && i.visible.to <= e.display.viewTo)
    )
      break;
    if (!updateDisplayIfNeeded(e, i)) break;
    updateHeightsInViewport(e);
    let r = measureForScrollbars(e);
    (updateSelection(e), updateScrollbars(e, r), setDocumentHeight(e, r), (i.force = !1));
  }
  (i.signal(e, 'update', e),
    (e.display.viewFrom == e.display.reportedViewFrom &&
      e.display.viewTo == e.display.reportedViewTo) ||
      (i.signal(e, 'viewportChange', e, e.display.viewFrom, e.display.viewTo),
      (e.display.reportedViewFrom = e.display.viewFrom),
      (e.display.reportedViewTo = e.display.viewTo)));
}
export function updateDisplaySimple(e, i) {
  let t = new DisplayUpdate(e, i);
  if (updateDisplayIfNeeded(e, t)) {
    (updateHeightsInViewport(e), postUpdateDisplay(e, t));
    let i = measureForScrollbars(e);
    (updateSelection(e), updateScrollbars(e, i), setDocumentHeight(e, i), t.finish());
  }
}
function patchDisplay(e, i, t) {
  let o = e.display,
    r = e.options.lineNumbers,
    s = o.lineDiv,
    l = s.firstChild;
  function n(i) {
    let t = i.nextSibling;
    return (
      webkit && mac && e.display.currentWheelTarget == i
        ? (i.style.display = 'none')
        : i.parentNode.removeChild(i),
      t
    );
  }
  let a = o.view,
    p = o.viewFrom;
  for (let o = 0; o < a.length; o++) {
    let d = a[o];
    if (d.hidden);
    else if (d.node && d.node.parentNode == s) {
      for (; l != d.node; ) l = n(l);
      let o = r && null != i && i <= p && d.lineNumber;
      (d.changes &&
        (indexOf(d.changes, 'gutter') > -1 && (o = !1), updateLineForChanges(e, d, p, t)),
        o &&
          (removeChildren(d.lineNumber),
          d.lineNumber.appendChild(document.createTextNode(lineNumberFor(e.options, p)))),
        (l = d.node.nextSibling));
    } else {
      let i = buildLineElement(e, d, p, t);
      s.insertBefore(i, l);
    }
    p += d.size;
  }
  for (; l; ) l = n(l);
}
export function updateGutterSpace(e) {
  let i = e.gutters.offsetWidth;
  ((e.sizer.style.marginLeft = i + 'px'), signalLater(e, 'gutterChanged', e));
}
export function setDocumentHeight(e, i) {
  ((e.display.sizer.style.minHeight = i.docHeight + 'px'),
    (e.display.heightForcer.style.top = i.docHeight + 'px'),
    (e.display.gutters.style.height = i.docHeight + e.display.barHeight + scrollGap(e) + 'px'));
}
