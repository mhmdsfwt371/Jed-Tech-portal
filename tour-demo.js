// Visual simulation for the My KPIs tutorial. No network requests or changes to the real browser.
const node = (tag, className = '', ...children) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  for (const child of children.flat()) if (child != null) {
    element.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return element;
};
const text = (tag, className, value) => node(tag, className, value);
const siteName = (from, p, page) => page === 3 ? from : p;
const choices = { desktop: 'tour_desktop', android: 'tour_android', ios: 'tour_ios' };
const deviceIcon = { desktop: '🖥', android: '📱', ios: '📱' };
function resultScene(t) {
  const result = node('div', 'tour-demo-profile',
    text('b', '', t('tour_demo_success')),
    text('p', '', t('tour_demo_result')));
  const metrics = node('div', 'tour-demo-metrics');
  for (const key of ['tour_demo_work', 'tour_demo_kpis']) {
    metrics.append(node('div', 'tour-demo-metric', text('span', '', t(key)), text('b', '', '—')));
  }
  result.append(metrics);
  return result;
}
function scene(plan, translated, after) {
  const t = translated;
  const n = plan.step;
  if (n === 0) {
    const options = node('div', 'tour-demo-devices');
    for (const device of ['desktop', 'android', 'ios']) {
      options.append(text('span', 'tour-demo-device-chip' + (after && plan.device === device ? ' selected' : ''),
        deviceIcon[device] + ' ' + t(choices[device])));
    }
    return node('div', 'tour-demo-scene tour-demo-choose', text('b', '', t('tour_demo_device')), options);
  }
  if (n === 1) {
    if (plan.device !== 'desktop') {
      return node('div', 'tour-demo-scene tour-demo-setup',
        text('span', 'tour-demo-action-icon', after ? '★' : '📋'),
        text('b', '', t(after ? 'tour_demo_edit' : 'tour_demo_copy')),
        text('span', 'tour-demo-fake-button', after ? 'javascript:…' : t('tour_copy')));
    }
    return node('div', 'tour-demo-scene tour-demo-setup',
      text('span', 'tour-demo-action-icon', after ? '★' : '↗'),
      text('span', 'tour-demo-fake-button', t(after ? 'tour_demo_saved' : 'tour_bookmark')));
  }
  if (n === 2) {
    if (!after) return node('div', 'tour-demo-scene tour-demo-setup',
      text('span', 'tour-demo-action-icon', '🌐'),
      text('span', 'tour-demo-fake-button', t('tour_open_site')));
    return node('div', 'tour-demo-scene tour-demo-login',
      text('b', '', t('tour_demo_login')),
      node('div', 'tour-demo-input'),
      node('div', 'tour-demo-input short'),
      text('span', 'tour-demo-fake-button', t('tour_demo_signin')));
  }
  if (n === 3) {
    if (after) return node('div', 'tour-demo-scene', resultScene(t));
    return node('div', 'tour-demo-scene tour-demo-crm',
      text('b', '', 'MyAFAQY'),
      node('div', 'tour-demo-rows', node('div', 'tour-demo-row'), node('div', 'tour-demo-row'),
        node('div', 'tour-demo-row short')),
      plan.device === 'desktop' ? null : text('span', 'tour-demo-fake-button',
        t(plan.device === 'ios' ? 'tour_demo_mobilebar' : 'tour_demo_search')));
  }
  return after ? node('div', 'tour-demo-scene', resultScene(t))
    : node('div', 'tour-demo-scene tour-demo-loading',
        text('b', '', t('me_title')),
        node('div', 'tour-demo-rows', node('div', 'tour-demo-row'), node('div', 'tour-demo-row short')));
}
function makePointer(mobile) {
  const cursor = node('span', 'tour-demo-pointer ' + (mobile ? 'is-touch' : 'is-mouse'));
  if (!mobile) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 34 42');
    const shape = document.createElementNS(ns, 'path');
    shape.setAttribute('d', 'M3 2 L3 36 L11 27 L18 40 L25 36 L18 24 L30 23 Z');
    svg.append(shape); cursor.append(svg);
  }
  return cursor;
}
export function mountTourDemo(host, plan, t, portalUrl) {
  const mobile = plan.device !== 'desktop';
  const myAfaqy = 'https://myafaqy.com/';
  const urlBefore = siteName(myAfaqy, portalUrl, plan.step);
  const urlAfter = plan.step === 2 ? myAfaqy : plan.step === 3 ? portalUrl : urlBefore;
  const address = node('div', 'tour-demo-address',
    text('span', 'tour-demo-url-before', urlBefore),
    text('span', 'tour-demo-url-after', urlAfter));
  const bookmarkBar = mobile ? null : node('div', 'tour-demo-bookmarks',
    text('span', '', '☆'),
    text('span', 'tour-demo-bookmark-before', t(plan.step === 1 ? 'tour_demo_drag' : 'tour_demo_saved')),
    text('span', 'tour-demo-bookmark-after', t('tour_demo_moved')));
  const frame = node('div', 'tour-demo-window' + (mobile ? ' is-mobile' : '') + ' tour-demo-playing',
    node('div', 'tour-demo-browserbar',
      text('span', 'tour-demo-dots', '●  ●  ●'),
      text('span', 'tour-demo-tab-label',
        mobile ? (plan.device === 'ios' ? 'Safari' : 'Chrome') : t('tour_demo_browser'))),
    address,
    bookmarkBar,
    node('div', 'tour-demo-content',
      node('div', 'tour-demo-before', scene(plan, t, false)),
      node('div', 'tour-demo-after', scene(plan, t, true))),
    mobile ? text('div', 'tour-demo-mobilebar',
      plan.device === 'ios' ? '‹       □       ☆       ≡' : '‹       ☆       ⋮') : null,
    node('span', 'tour-demo-aim'),
    plan.gesture === 'drag' ? text('span', 'tour-demo-drag-copy', '📊') : null,
    makePointer(mobile),
    text('span', 'tour-demo-demo-tag', t('tour_demo_chip')));
  for (const [key, value] of Object.entries({
    '--demo-from-x': plan.start.x + '%', '--demo-from-y': plan.start.y + '%',
    '--demo-to-x': plan.target.x + '%', '--demo-to-y': plan.target.y + '%',
  })) frame.style.setProperty(key, value);
  frame.setAttribute('aria-hidden', 'true');
  host.replaceChildren(frame);
}
export function replayTourDemo(host) {
  const frame = host.firstElementChild;
  if (!frame) return;
  frame.classList.remove('tour-demo-playing');
  void frame.offsetWidth;
  frame.classList.add('tour-demo-playing');
}
