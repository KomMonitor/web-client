import { chrome, chrome_version, gecko, ie, mac, presto, safari, webkit } from '../util/browser.js';
import { e_preventDefault } from '../util/event.js';
import { updateDisplaySimple } from './update_display.js';
import { setScrollLeft, updateScrollTop } from './scrolling.js';
let wheelSamples = 0,
  wheelPixelsPerUnit = null;
function wheelEventDelta(e) {
  let l = e.wheelDeltaX,
    t = e.wheelDeltaY;
  return (
    null == l && e.detail && e.axis == e.HORIZONTAL_AXIS && (l = e.detail),
    null == t && e.detail && e.axis == e.VERTICAL_AXIS
      ? (t = e.detail)
      : null == t && (t = e.wheelDelta),
    { x: l, y: t }
  );
}
ie
  ? (wheelPixelsPerUnit = -0.53)
  : gecko
    ? (wheelPixelsPerUnit = 15)
    : chrome
      ? (wheelPixelsPerUnit = -0.7)
      : safari && (wheelPixelsPerUnit = -1 / 3);
export function wheelEventPixels(e) {
  let l = wheelEventDelta(e);
  return ((l.x *= wheelPixelsPerUnit), (l.y *= wheelPixelsPerUnit), l);
}
export function onScrollWheel(e, l) {
  chrome &&
    102 == chrome_version &&
    (null == e.display.chromeScrollHack
      ? (e.display.sizer.style.pointerEvents = 'none')
      : clearTimeout(e.display.chromeScrollHack),
    (e.display.chromeScrollHack = setTimeout(() => {
      ((e.display.chromeScrollHack = null), (e.display.sizer.style.pointerEvents = ''));
    }, 100)));
  let t = wheelEventDelta(l),
    r = t.x,
    i = t.y,
    o = wheelPixelsPerUnit;
  0 === l.deltaMode && ((r = l.deltaX), (i = l.deltaY), (o = 1));
  let a = e.display,
    h = a.scroller,
    s = h.scrollWidth > h.clientWidth,
    n = h.scrollHeight > h.clientHeight;
  if ((r && s) || (i && n)) {
    if (i && mac && webkit)
      e: for (let t = l.target, r = a.view; t != h; t = t.parentNode)
        for (let l = 0; l < r.length; l++)
          if (r[l].node == t) {
            e.display.currentWheelTarget = t;
            break e;
          }
    if (r && !gecko && !presto && null != o)
      return (
        i && n && updateScrollTop(e, Math.max(0, h.scrollTop + i * o)),
        setScrollLeft(e, Math.max(0, h.scrollLeft + r * o)),
        (!i || (i && n)) && e_preventDefault(l),
        void (a.wheelStartX = null)
      );
    if (i && null != o) {
      let l = i * o,
        t = e.doc.scrollTop,
        r = t + a.wrapper.clientHeight;
      (l < 0 ? (t = Math.max(0, t + l - 50)) : (r = Math.min(e.doc.height, r + l + 50)),
        updateDisplaySimple(e, { top: t, bottom: r }));
    }
    wheelSamples < 20 &&
      0 !== l.deltaMode &&
      (null == a.wheelStartX
        ? ((a.wheelStartX = h.scrollLeft),
          (a.wheelStartY = h.scrollTop),
          (a.wheelDX = r),
          (a.wheelDY = i),
          setTimeout(() => {
            if (null == a.wheelStartX) return;
            let e = h.scrollLeft - a.wheelStartX,
              l = h.scrollTop - a.wheelStartY,
              t = (l && a.wheelDY && l / a.wheelDY) || (e && a.wheelDX && e / a.wheelDX);
            ((a.wheelStartX = a.wheelStartY = null),
              t &&
                ((wheelPixelsPerUnit =
                  (wheelPixelsPerUnit * wheelSamples + t) / (wheelSamples + 1)),
                ++wheelSamples));
          }, 200))
        : ((a.wheelDX += r), (a.wheelDY += i)));
  }
}
