// Détails de la maison et de l'électroménager au dépôt, comme sur le site.
// Maison : la rubrique est choisie à l'étape 1 ; l'article, l'état et les dimensions sont ici.
// Électroménager : l'article est choisi à l'étape 1 ; la marque, l'état et le reste sont ici.
import { L3 } from './labels3';

const T = (k, ar) => { const x = L3[k]; return x ? (ar ? x[1] : x[0]) : k; };
const lab = (k) => [T(k, false), T(k, true)];
const opts = (list, pre) => list.map((v) => ({ v, fr: T(pre + v, false), ar: T(pre + v, true) }));

const HITEMS = {
  salon: ['salonComplet', 'jalsa', 'tarkiya', 'salonEuro', 'coussins', 'housses', 'other_i'],
  ameub: ['chambre', 'lit', 'armoire', 'buffet', 'canape', 'meubleTv', 'etagere', 'other_i'],
  table: ['tableChaises', 'tableManger', 'chaises', 'tableBasse', 'bureau', 'other_i'],
  tapis: ['tapis', 'moquette', 'natte', 'other_i'],
  deco: ['rideaux', 'lampe', 'miroir', 'tableau', 'vase', 'other_i'],
  cuisine: ['theSet', 'theiere', 'plateau', 'vaisselle', 'marmites', 'gaz', 'other_i'],
};
const CONDS = ['new', 'vgood', 'good', 'fair', 'repair'];
const SMALLS = ['blender', 'robot', 'juicer', 'kettle', 'iron', 'vacuum', 'airfryer', 'coffee', 'hair', 'other'];
const HBRANDS = ['LG', 'Samsung', 'Hisense', 'Midea', 'Haier', 'Beko', 'Whirlpool', 'Condor', 'Autre'];
const MATS = ['bois', 'metal', 'plastique', 'verre', 'autre'];

const isMenager = (d) => d.cat === 'menager';

function maisonFields(d) {
  if (!d.sub) return [];
  const sb = d.sub;
  const f = [
    { k: 'hitem', label: lab('hitem'), type: 'chips', opts: opts(HITEMS[sb] || [], 'hi_'), req: true },
    { k: 'hcond', label: lab('cond'), type: 'chips', opts: opts(CONDS, 'c_'), req: true },
  ];
  if (['salon', 'table', 'cuisine'].includes(sb)) {
    f.push({ k: 'hqty', label: lab(sb === 'salon' ? 'qtyMat' : sb === 'table' ? 'qtyChair' : 'qty'), type: 'num', len: 3, ph: sb === 'cuisine' ? '1' : '6' });
  }
  if (['salon', 'tapis', 'table', 'ameub'].includes(sb)) f.push({ k: 'hdims', label: lab('hdims'), type: 'text', len: 40, ph: T('hdimsPh') });
  if (sb === 'ameub' || sb === 'table') f.push({ k: 'hmat', label: lab('mat'), type: 'chips', opts: MATS.map((x) => ({ v: x, fr: T('mt2_' + x), ar: T('mt2_' + x, true) })) });
  if (['salon', 'tapis', 'deco', 'ameub'].includes(sb)) f.push({ k: 'hcolor', label: lab('hcolor'), type: 'text', len: 30, ph: T('hcolorPh') });
  f.push({ k: 'hdeliv', label: lab('delivery'), type: 'check' });
  return f;
}

// Électroménager : l'article (d.sub) est choisi à l'étape 1
function menagerFields(d) {
  if (!isMenager(d) || !d.sub) return [];
  const f = [];
  if (d.sub === 'small') f.push({ k: 'hsmall', label: lab('smallL'), type: 'chips', opts: opts(SMALLS, 'sm_'), req: true });
  f.push({ k: 'hcond', label: lab('cond'), type: 'chips', opts: opts(CONDS, 'c_'), req: true });
  f.push({ k: 'hbrand', label: lab('brand'), type: 'chips', opts: HBRANDS.map((b) => ({ v: b, fr: b, ar: b === 'Autre' ? 'أخرى' : b })) });
  f.push({ k: 'hcap', label: lab('cap'), type: 'text', len: 20, ph: T('capPh') });
  f.push({ k: 'hdeliv', label: lab('delivery'), type: 'check' });
  return f;
}

export function l5Fields(d) {
  if (d.cat === 'maison') return maisonFields(d);
  if (isMenager(d)) return menagerFields(d);
  return [];
}

export function l5Errors(d, ar) {
  const e = {};
  if (d.cat === 'maison' && d.sub) {
    if (!d.hitem) e.hitem = T('errHitem', ar);
    if (!d.hcond) e.hcond = T('errCond', ar);
  }
  if (isMenager(d) && d.sub) {
    if (!d.hcond) e.hcond = T('errCond', ar);
    if (d.sub === 'small' && !d.hsmall) e.hsmall = T('errHitem', ar);
  }
  return e;
}

// Champs ajoutés à l'annonce (site : home)
export function l5AdObject(d) {
  if ((d.cat === 'maison' && d.sub) || (isMenager(d) && d.sub)) {
    const m = isMenager(d);
    const h = { sub: m ? 'electro' : d.sub, item: m ? d.sub : d.hitem, cond: d.hcond, delivery: !!d.hdeliv };
    if (m && d.sub === 'small' && d.hsmall) h.small = d.hsmall;
    ['hqty', 'hdims', 'hmat', 'hcolor', 'hbrand', 'hcap'].forEach((k) => {
      const v = String(d[k] || '').trim();
      if (v) h[k.slice(1)] = v;
    });
    return { home: h };
  }
  return {};
}

// Reprend les champs d'une annonce existante dans le formulaire (modification)
export function l5FromAd(a) {
  if (!a.home) return {};
  const h = a.home;
  const o = { hcond: h.cond || '', hdeliv: !!h.delivery, hsmall: h.small || '' };
  if (a.cat === 'menager') o.sub = h.item || '';
  else { o.sub = h.sub || ''; o.hitem = h.item || ''; }
  ['qty', 'dims', 'mat', 'color', 'brand', 'cap'].forEach((k) => { if (h[k] != null && h[k] !== '') o['h' + k] = String(h[k]); });
  return o;
}
