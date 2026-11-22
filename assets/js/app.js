import {
  RELEASE, stripTime, diffDays, addDays, sameDay, mondayIndex, pad,
  offsetOf, codeOf, parseCode, isMilestone, daysToNextMilestone, monthsBetween, toISO, fromISO
} from './dates.js';
import { translations } from './i18n.js';
import { EVENTS } from './events.js';
import { drawCard, canvasBlob } from './share.js';

const SITE_URL = 'https://macduff55.github.io/bgta-agta/';
const $ = id => document.getElementById(id);
const THEMES = ['auto', 'night', 'sunset', 'light'];
const THEME_ICON = { auto:'i-auto', night:'i-moon', sunset:'i-sunset', light:'i-sun' };
const THEME_COLOR = { night:'#0a0714', sunset:'#ffb36b', light:'#f6f2fb' };

const store = {
  get(k){ try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v){ try { localStorage.setItem(k, v); } catch (e) {} }
};

const events = EVENTS.map(e => ({ ...e, d: fromISO(e.date) })).filter(e => e.d).sort((a, b) => a.d - b.d);
const eventOn = date => events.find(e => sameDay(e.d, date));

const savedLang = store.get('bgta-lang');
let lang = savedLang === 'en' || savedLang === 'tr' ? savedLang : ((navigator.language || 'en').toLowerCase().startsWith('tr') ? 'tr' : 'en');
let t = translations[lang];
let themePref = THEMES.includes(store.get('bgta-theme')) ? store.get('bgta-theme') : 'auto';

let today = new Date();
let view = 'month';
let viewDate = new Date(today.getFullYear(), today.getMonth(), 1);
let selected = stripTime(today);
let convDate = stripTime(today);
let shareDate = stripTime(today);

const linked = fromISO(new URLSearchParams(location.search).get('d'));
if (linked){
  selected = convDate = shareDate = linked;
  viewDate = new Date(linked.getFullYear(), linked.getMonth(), 1);
}

const fmt = (d, opts) => d.toLocaleDateString(t.locale, opts);
const capital = s => s.charAt(0).toUpperCase() + s.slice(1);
const icon = id => `<svg class="icon" aria-hidden="true"><use href="#${id}"/></svg>`;
const setLabel = (btn, text) => { btn.querySelector('span').textContent = text; };

let toastTimer;
function toast(msg){
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

/* ---------- THEME ---------- */
const lightQuery = matchMedia('(prefers-color-scheme: light)');
function applyTheme(){
  const theme = themePref === 'auto' ? (lightQuery.matches ? 'light' : 'night') : themePref;
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]').content = THEME_COLOR[theme];
  const btn = $('themeBtn');
  btn.innerHTML = icon(THEME_ICON[themePref]);
  btn.setAttribute('aria-label', t.themeLabel[themePref]);
  btn.title = t.themeLabel[themePref];
}
lightQuery.addEventListener('change', () => { if (themePref === 'auto') applyTheme(); });

/* ---------- STATIC TEXT ---------- */
function applyStaticText(){
  document.documentElement.lang = lang;
  document.title = t.title;
  $('langBtn').setAttribute('aria-label', t.langLabel);
  $('langBtn').title = t.langLabel;
  $('heroDateLine').textContent = t.releaseDateLine;
  $('heroNote').textContent = t.releaseNote;
  $('prevBtn').setAttribute('aria-label', t.prev);
  $('nextBtn').setAttribute('aria-label', t.next);
  $('todayBtn').textContent = t.today;
  $('releaseBtn').textContent = t.release;
  setLabel($('viewMonth'), t.month);
  setLabel($('viewYear'), t.year);
  [['lblH', 0], ['lblM', 1], ['lblS', 2]].forEach(([id, i]) => { $(id).textContent = t.clock[i]; });
  $('lblWeeks').textContent = t.weeks;
  $('lblMonths').textContent = t.months;
  $('lblNext').textContent = t.nextMilestone;
  setLabel($('heroShareBtn'), t.shareBtn);
  setLabel($('installBtn'), t.installBtn);
  $('legendBefore').innerHTML = t.legendBefore;
  $('legendAfter').innerHTML = t.legendAfter;
  $('legendMilestone').innerHTML = t.legendMilestone;
  $('legendEvent').innerHTML = t.legendEvent;
  $('hint').innerHTML = t.hint;
  setLabel($('convTitle'), t.convTitle);
  $('convSub').textContent = t.convSub;
  $('convDateLabel').textContent = t.convDate;
  $('convCodeLabel').textContent = t.convCode;
  $('convCode').placeholder = t.convPlaceholder;
  setLabel($('convCardBtn'), t.makeCard);
  setLabel($('convLinkBtn'), t.copyLink);
  setLabel($('shareTitle'), t.shareTitle);
  $('shareSub').textContent = t.shareSub;
  setLabel($('shareBtn'), t.share);
  setLabel($('downloadBtn'), t.download);
  setLabel($('copyBtn'), t.copyLink);
  setLabel($('timelineTitle'), t.timelineTitle);
  $('timelineSub').textContent = t.timelineSub;
  $('footerText').textContent = t.footer + ' ';
  $('sourceLink').textContent = t.source;

  const row = $('weekdaysRow');
  row.innerHTML = '';
  t.weekdays.forEach(d => {
    const s = document.createElement('span');
    s.textContent = d;
    row.appendChild(s);
  });

  const chips = $('convChips');
  chips.innerHTML = '';
  const nextNewYear = new Date(today.getFullYear() + 1, 0, 1);
  [
    [t.chipToday, stripTime(today)],
    [t.chipNewYear, nextNewYear],
    [t.chipAnniv, new Date(RELEASE.getFullYear() + 1, RELEASE.getMonth(), RELEASE.getDate())],
    [t.chipThousand, addDays(RELEASE, 1000)]
  ].forEach(([label, d]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.addEventListener('click', () => setConvDate(d, true));
    chips.appendChild(b);
  });
}

/* ---------- HERO ---------- */
let lastBadge = null;
function renderStatus(){
  const now = new Date();
  const o = offsetOf(now);
  $('todayChip').textContent = fmt(now, { weekday:'short', day:'numeric', month:'short', year:'numeric' });

  const word = $('heroWordmark'), num = $('heroNumber'), sub = $('heroSub'), clock = $('clock');
  if (o > 0){
    word.textContent = 'B.GTA';
    num.textContent = o;
    sub.textContent = t.beforeSub(o);
    const ms = RELEASE - now;
    clock.hidden = false;
    $('clkH').textContent = pad(Math.floor(ms / 3600000) % 24);
    $('clkM').textContent = pad(Math.floor(ms / 60000) % 60);
    $('clkS').textContent = pad(Math.floor(ms / 1000) % 60);
    $('statWeeks').textContent = Math.floor(o / 7);
    $('statMonths').textContent = monthsBetween(stripTime(now), RELEASE);
  } else if (o === 0){
    word.textContent = t.gtaDayWordmark;
    num.textContent = 'GTA';
    sub.textContent = t.gtaDaySub;
    clock.hidden = true;
    $('statWeeks').textContent = 0;
    $('statMonths').textContent = 0;
  } else {
    word.textContent = 'A.GTA';
    num.textContent = -o;
    sub.textContent = t.afterSub(-o);
    clock.hidden = true;
    $('statWeeks').textContent = Math.floor(-o / 7);
    $('statMonths').textContent = monthsBetween(RELEASE, stripTime(now));
  }
  const next = daysToNextMilestone(now);
  $('statNext').textContent = next ? t.daysShort(next) : '—';

  // App icon badge (installed PWA on supporting platforms) shows today's number.
  const badge = Math.abs(o);
  if (badge !== lastBadge && 'setAppBadge' in navigator){
    lastBadge = badge;
    (badge ? navigator.setAppBadge(badge) : navigator.clearAppBadge()).catch(() => {});
  }
}

/* ---------- DETAIL ---------- */
function describe(date){
  const c = codeOf(date);
  const text = c.kind === 'release' ? t.detailRelease : (c.kind === 'before' ? t.detailBefore(c.n) : t.detailAfter(c.n));
  const ev = eventOn(date);
  const parts = [text];
  if (ev) parts.push(ev[lang]);
  if (isMilestone(date)) parts.push(t.milestone);

  const el = $('detail');
  el.innerHTML = '';
  const tag = document.createElement('span');
  tag.className = 'tag ' + c.kind;
  tag.textContent = c.kind === 'release' ? 'GTA' : c.long;
  const body = document.createElement('div');
  body.className = 'detail-text';
  const b = document.createElement('b');
  b.textContent = capital(fmt(date, { weekday:'long', day:'numeric', month:'long', year:'numeric' }));
  const s = document.createElement('span');
  s.textContent = parts.join(' · ');
  body.append(b, s);
  el.append(tag, body);
}

/* ---------- MONTH VIEW ---------- */
function renderMonth(direction){
  const cal = $('calendar');
  cal.innerHTML = '';
  const year = viewDate.getFullYear(), month = viewDate.getMonth();
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();
  const last = new Date(year, month, days);

  const label = $('monthLabel');
  label.textContent = capital(fmt(first, { month:'long', year:'numeric' }));
  const small = document.createElement('small');
  small.textContent = `${codeOf(first).short} → ${codeOf(last).short}`;
  label.appendChild(small);

  for (let i = 0; i < mondayIndex(first.getDay()); i++){
    const blank = document.createElement('div');
    blank.className = 'day empty';
    cal.appendChild(blank);
  }

  const todayD = stripTime(today);
  for (let d = 1; d <= days; d++){
    const date = new Date(year, month, d);
    const c = codeOf(date);
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'day ' + c.kind;
    cell.setAttribute('role', 'gridcell');
    cell.dataset.day = d;
    if (mondayIndex(date.getDay()) >= 5) cell.classList.add('weekend');
    if (date < todayD) cell.classList.add('past');
    if (isMilestone(date)) cell.classList.add('milestone');
    if (sameDay(date, todayD)){ cell.classList.add('today'); cell.setAttribute('aria-current', 'date'); }
    if (sameDay(date, selected)) cell.classList.add('selected');

    const ev = eventOn(date);
    let html = `<span class="num">${d}</span><span class="badge">${c.short}</span>`;
    if (ev && c.kind !== 'release') html = `<svg class="icon ev" aria-hidden="true"><use href="#ev-${ev.type}"/></svg>` + html;
    cell.innerHTML = html;
    cell.setAttribute('aria-label', `${fmt(date, { day:'numeric', month:'long', year:'numeric' })}, ${c.long}${ev ? ', ' + ev[lang] : ''}`);
    cal.appendChild(cell);
  }

  if (direction){
    cal.classList.remove('slide-left', 'slide-right');
    void cal.offsetWidth;
    cal.classList.add(direction > 0 ? 'slide-left' : 'slide-right');
  }
  describe(selected.getFullYear() === year && selected.getMonth() === month ? selected : first);
}

/* ---------- YEAR VIEW ---------- */
function renderYear(direction){
  const grid = $('yearView');
  grid.innerHTML = '';
  const year = viewDate.getFullYear();
  const label = $('monthLabel');
  label.textContent = String(year);
  const small = document.createElement('small');
  small.textContent = `${codeOf(new Date(year, 0, 1)).short} → ${codeOf(new Date(year, 11, 31)).short}`;
  label.appendChild(small);

  const todayD = stripTime(today);
  for (let m = 0; m < 12; m++){
    const first = new Date(year, m, 1);
    const days = new Date(year, m + 1, 0).getDate();
    let cells = '';
    for (let i = 0; i < mondayIndex(first.getDay()); i++) cells += '<i class="o"></i>';
    for (let d = 1; d <= days; d++){
      const date = new Date(year, m, d);
      const k = codeOf(date).kind;
      let cls = k === 'release' ? 'r' : (k === 'after' ? 'a' : '');
      if (sameDay(date, todayD)) cls += ' t';
      if (eventOn(date)) cls += ' e';
      cells += `<i class="${cls.trim()}"></i>`;
    }
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mini';
    const name = capital(fmt(first, { month:'long' }));
    btn.innerHTML = `<h3>${name}<small>${codeOf(first).short}</small></h3><div class="g" aria-hidden="true">${cells}</div>`;
    btn.setAttribute('aria-label', `${name} ${year}, ${codeOf(first).long}`);
    btn.addEventListener('click', () => {
      viewDate = first;
      setView('month');
    });
    grid.appendChild(btn);
  }
  if (direction){
    grid.classList.remove('slide-left', 'slide-right');
    void grid.offsetWidth;
    grid.classList.add(direction > 0 ? 'slide-left' : 'slide-right');
  }
  describe(selected.getFullYear() === year ? selected : new Date(year, 0, 1));
}

function renderCalendar(direction){
  if (view === 'month') renderMonth(direction);
  else renderYear(direction);
}

function setView(v){
  view = v;
  $('viewMonth').setAttribute('aria-pressed', v === 'month');
  $('viewYear').setAttribute('aria-pressed', v === 'year');
  $('monthView').hidden = v !== 'month';
  $('yearView').hidden = v !== 'year';
  $('hint').hidden = v !== 'month';
  renderCalendar(0);
}

function shift(delta){
  viewDate = view === 'month'
    ? new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1)
    : new Date(viewDate.getFullYear() + delta, viewDate.getMonth(), 1);
  renderCalendar(delta);
}

function goTo(date){
  const target = new Date(date.getFullYear(), date.getMonth(), 1);
  const delta = Math.sign(target - viewDate);
  viewDate = target;
  selected = stripTime(date);
  if (view !== 'month') setView('month');
  else renderCalendar(delta);
}

/* ---------- TIMELINE ---------- */
function renderTimeline(){
  const list = $('timeline');
  list.innerHTML = '';
  const nextIdx = events.findIndex(e => diffDays(e.d, today) >= 0);
  events.forEach((e, i) => {
    const c = codeOf(e.d);
    const li = document.createElement('li');
    if (i === nextIdx) li.className = 'next';
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = `<span class="tl-icon">${icon('ev-' + e.type)}</span><span class="tl-body"><b></b><span></span></span><span class="tag ${c.kind}"></span>`;
    b.querySelector('.tl-body b').textContent = e[lang];
    b.querySelector('.tl-body span').textContent = fmt(e.d, { day:'numeric', month:'long', year:'numeric' });
    b.querySelector('.tag').textContent = c.kind === 'release' ? 'GTA' : c.long;
    b.addEventListener('click', () => {
      goTo(e.d);
      $('monthLabel').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'start' });
    });
    li.appendChild(b);
    list.appendChild(li);
  });
}

/* ---------- CONVERTER ---------- */
function renderConverter(){
  const c = codeOf(convDate);
  const big = $('convBig');
  big.className = 'big ' + c.kind;
  big.textContent = c.kind === 'release' ? t.release.toUpperCase() : c.long;
  const wd = capital(fmt(convDate, { weekday:'long', day:'numeric', month:'long', year:'numeric' }));
  const weeks = t.weeksAway(c.n, c.kind === 'after');
  const ev = eventOn(convDate);
  $('convLine').textContent = [wd, weeks, ev && ev[lang]].filter(Boolean).join(' · ');
}

function setConvDate(date, syncInputs){
  convDate = stripTime(date);
  if (syncInputs){
    $('convDate').value = toISO(convDate);
    $('convCode').value = codeOf(convDate).short;
    clearConvError();
  }
  renderConverter();
}

function clearConvError(){
  $('convError').textContent = '';
  $('convCode').removeAttribute('aria-invalid');
}

$('convDate').addEventListener('input', e => {
  const d = fromISO(e.target.value);
  if (!d) return;
  convDate = d;
  $('convCode').value = codeOf(d).short;
  clearConvError();
  renderConverter();
});
$('convCode').addEventListener('input', e => {
  const v = e.target.value.trim();
  if (!v){ clearConvError(); return; }
  const d = parseCode(v);
  if (!d || d.getFullYear() < 1 || d.getFullYear() > 9999){
    $('convError').textContent = t.convError;
    $('convCode').setAttribute('aria-invalid', 'true');
    return;
  }
  clearConvError();
  convDate = d;
  $('convDate').value = toISO(d);
  renderConverter();
});
$('convCardBtn').addEventListener('click', () => {
  shareDate = convDate;
  renderShare();
  $('sharePanel').scrollIntoView({ behavior:'smooth', block:'start' });
});
$('convLinkBtn').addEventListener('click', () => copyLink(convDate));

/* ---------- SHARE ---------- */
const linkFor = date => sameDay(date, today) ? SITE_URL : `${SITE_URL}?d=${toISO(date)}`;

async function renderShare(){
  const canvas = $('shareCanvas');
  await drawCard(canvas, { date: shareDate, t, url: SITE_URL });
  const c = codeOf(shareDate);
  canvas.setAttribute('aria-label', `${fmt(shareDate, { day:'numeric', month:'long', year:'numeric' })}: ${c.long}`);
}

function cardFileName(){
  return `bgta-${codeOf(shareDate).short.toLowerCase()}.png`;
}

async function downloadCard(){
  const blob = await canvasBlob($('shareCanvas'));
  if (!blob) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = cardFileName();
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast(t.downloaded);
}

async function shareCard(){
  const blob = await canvasBlob($('shareCanvas'));
  const c = codeOf(shareDate);
  const text = t.shareText(c.kind === 'release' ? t.release : c.long, fmt(shareDate, { day:'numeric', month:'long', year:'numeric' }));
  const url = linkFor(shareDate);
  const file = blob && new File([blob], cardFileName(), { type:'image/png' });
  try {
    if (file && navigator.canShare && navigator.canShare({ files:[file] })){
      await navigator.share({ files:[file], text: text + ' ' + url });
      return;
    }
    if (navigator.share){
      await navigator.share({ title: t.title, text, url });
      return;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return;
  }
  downloadCard();
}

async function copyLink(date){
  const url = linkFor(date);
  try {
    await navigator.clipboard.writeText(url);
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = url;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  toast(t.copied);
}

$('shareBtn').addEventListener('click', shareCard);
$('downloadBtn').addEventListener('click', downloadCard);
$('copyBtn').addEventListener('click', () => copyLink(shareDate));
$('heroShareBtn').addEventListener('click', () => {
  shareDate = stripTime(today);
  renderShare();
  $('sharePanel').scrollIntoView({ behavior:'smooth', block:'start' });
});

/* ---------- PWA ---------- */
let installPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  installPrompt = e;
  $('installBtn').hidden = false;
});
$('installBtn').addEventListener('click', async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  const { outcome } = await installPrompt.userChoice;
  installPrompt = null;
  $('installBtn').hidden = true;
  if (outcome === 'accepted') toast(t.installed);
});
if ('serviceWorker' in navigator && location.protocol.startsWith('http')){
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

/* ---------- INPUT ---------- */
$('calendar').addEventListener('click', e => {
  const cell = e.target.closest('.day:not(.empty)');
  if (!cell) return;
  selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), +cell.dataset.day);
  $('calendar').querySelectorAll('.selected').forEach(c => c.classList.remove('selected'));
  cell.classList.add('selected');
  describe(selected);
  setConvDate(selected, true);
});
$('prevBtn').addEventListener('click', () => shift(-1));
$('nextBtn').addEventListener('click', () => shift(1));
$('todayBtn').addEventListener('click', () => goTo(today));
$('releaseBtn').addEventListener('click', () => goTo(RELEASE));
$('viewMonth').addEventListener('click', () => setView('month'));
$('viewYear').addEventListener('click', () => setView('year'));

$('langBtn').addEventListener('click', () => {
  lang = lang === 'en' ? 'tr' : 'en';
  t = translations[lang];
  store.set('bgta-lang', lang);
  renderAll();
});
$('themeBtn').addEventListener('click', () => {
  themePref = THEMES[(THEMES.indexOf(themePref) + 1) % THEMES.length];
  store.set('bgta-theme', themePref);
  applyTheme();
});

document.addEventListener('keydown', e => {
  if (e.target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === 'ArrowLeft') shift(-1);
  else if (e.key === 'ArrowRight') shift(1);
  else if (e.key === 't' || e.key === 'T') goTo(today);
});

let touchX = null, touchY = null;
const swipeArea = document.querySelector('#monthView');
swipeArea.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; touchY = e.touches[0].clientY; }, { passive:true });
swipeArea.addEventListener('touchend', e => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  const dy = e.changedTouches[0].clientY - touchY;
  touchX = touchY = null;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) shift(dx < 0 ? 1 : -1);
});

function renderAll(){
  applyStaticText();
  applyTheme();
  renderStatus();
  renderCalendar(0);
  renderTimeline();
  setConvDate(convDate, true);
  renderShare();
}

setInterval(() => {
  const now = new Date();
  if (!sameDay(now, today)){
    const wasToday = sameDay(shareDate, today);
    today = now;
    if (wasToday) shareDate = stripTime(now);
    renderCalendar(0);
    renderTimeline();
    renderShare();
  }
  renderStatus();
}, 1000);

renderAll();
