// Months are 0-based: 10 = November. If the date moves, also update `releaseDateLine` in i18n.js.
export const RELEASE = new Date(2026, 10, 19);

const DAY_MS = 86400000;

export const stripTime = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
// Rounding absorbs the 23/25-hour days around DST changes.
export const diffDays = (a, b) => Math.round((stripTime(a) - stripTime(b)) / DAY_MS);
export const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const sameDay = (a, b) => diffDays(a, b) === 0;
export const mondayIndex = jsDay => (jsDay + 6) % 7;
export const pad = n => String(n).padStart(2, '0');

/** Positive before release, 0 on release day, negative after. */
export const offsetOf = date => diffDays(RELEASE, date);

export function codeOf(date){
  const o = offsetOf(date);
  if (o === 0) return { kind:'release', n:0, short:'GTA', long:'GTA Day' };
  if (o > 0) return { kind:'before', n:o, short:'B' + o, long:'B.GTA ' + o };
  return { kind:'after', n:-o, short:'A' + (-o), long:'A.GTA ' + (-o) };
}

/** Accepts "A214", "a.gta 214", "B 100", "GTA". Returns a Date or null. */
export function parseCode(input){
  const s = String(input).trim().toUpperCase().replace(/\s+/g, '');
  if (s === 'GTA' || s === 'GTADAY' || s === '0') return new Date(RELEASE);
  const m = s.match(/^([AB])(?:\.?GTA)?\.?(\d{1,5})$/);
  if (!m) return null;
  const n = parseInt(m[2], 10);
  return addDays(RELEASE, m[1] === 'A' ? n : -n);
}

export function isAnniversary(date){
  return date.getMonth() === RELEASE.getMonth()
    && date.getDate() === RELEASE.getDate()
    && date.getFullYear() > RELEASE.getFullYear();
}

export function isMilestone(date){
  const o = offsetOf(date);
  if (o === 0) return false;
  return Math.abs(o) % 100 === 0 || isAnniversary(date);
}

/** Days from `today` to the next milestone, or 0 on release day. */
export function daysToNextMilestone(today){
  const o = offsetOf(today);
  if (o === 0) return 0;
  if (o > 0) return o % 100 === 0 ? 100 : o % 100;
  let best = 100 - ((-o) % 100);
  const anniv = new Date(today.getFullYear(), RELEASE.getMonth(), RELEASE.getDate());
  if (anniv <= stripTime(today)) anniv.setFullYear(anniv.getFullYear() + 1);
  return Math.min(best, diffDays(anniv, today));
}

export function monthsBetween(a, b){
  let m = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  if (b.getDate() < a.getDate()) m--;
  return Math.max(0, m);
}

export const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function fromISO(s){
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return d.getMonth() === +m[2] - 1 ? d : null;
}
