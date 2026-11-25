// Détails des enfants, de l'alimentation et des matériaux au dépôt, comme sur le site.
// Enfants : la rubrique est choisie à l'étape 1 ; l'article, l'âge, l'état… sont ici (ou le type de service).
// Alimentation : la rubrique est choisie à l'étape 1 ; seule une note apparaît pour certaines rubriques.
// Matériaux et équipements : la rubrique est choisie à l'étape 1 ; la marque et l'état sont facultatifs.
import { L6 } from './labels6';
import { L3 } from './labels3';

const T = (k, ar) => { const x = L6[k] || L3[k]; return x ? (ar ? x[1] : x[0]) : k; };
const lab = (k) => [T(k, false), T(k, true)];
const opts = (list, pre) => list.map((v) => ({ v, fr: T(pre + v, false), ar: T(pre + v, true) }));

const FSUBS_SERV = ['babysit', 'aideDom'];
const FITEMS = {
  bebeEquip: ['poussette', 'siegeAuto', 'litBebe', 'chaiseHaute', 'porteBebe', 'baignoire', 'other'],
  mobEnfant: ['lit', 'armoire', 'bureau', 'commode', 'other'],
  jouets: ['jouet', 'jeuSociete', 'peluche', 'educatif', 'exterieur', 'other'],
};
const FAGES = ['a0', 'a1', 'a2', 'a3', 'a4', 'a5'];
const FROLES = ['menage', 'cuisine', 'nounou', 'ouvrier', 'gardien', 'chauffeur', 'other'];
const FSCHED = ['full', 'part', 'day', 'live'];
const FLANGS = ['has', 'ar', 'fr', 'pul', 'son', 'wol'];
const GENDER_SUBS = ['vetBebe', 'vetEnfant', 'chausEnfant', 'bijouxEnfant', 'accEnfant'];
const CONDS = ['new', 'vgood', 'good', 'fair', 'repair'];
const CSIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'unique'];
const SHOE = Array.from({ length: 23 }, (_, i) => String(16 + i));
const NOTE_ALIM = ['maison', 'lait', 'viande'];

const isServ = (sb) => FSUBS_SERV.includes(sb);

function famFields(d) {
  const sb = d.sub;
  if (isServ(sb)) {
    const f = [{ k: 'foffer', label: lab('offerL'), type: 'chips', opts: opts(['offer', 'demand'], 'of_'), req: true }];
    if (sb === 'aideDom') f.push({ k: 'frole', label: lab('roleL'), type: 'chips', opts: opts(FROLES, 'r_'), req: true });
    f.push({ k: 'fsched', label: lab('schedL'), type: 'chips', opts: opts(FSCHED, 's_') });
    if (d.foffer === 'demand') f.push({ k: 'fage', label: lab('ageL'), type: 'chips', opts: opts(FAGES, 'fa_') });
    else f.push({ k: 'fexp', label: lab('expL'), type: 'num', len: 2, ph: '3' });
    f.push({ k: 'flangs', label: lab('langsL'), type: 'checks', opts: FLANGS.map((q) => ({ v: q, fr: T('l_' + q), ar: T('l_' + q, true) })) });
    return f;
  }
  const f = [];
  if (FITEMS[sb]) f.push({ k: 'fitem', label: lab('hitem'), type: 'chips', opts: opts(FITEMS[sb], 'fi_') });
  if (sb !== 'vetMat') f.push({ k: 'fage', label: lab('ageL'), type: 'chips', opts: opts(FAGES, 'fa_') });
  if (GENDER_SUBS.includes(sb)) f.push({ k: 'fgender', label: lab('genderL'), type: 'chips', opts: opts(['f', 'm', 'x'], 'g_') });
  if (sb === 'chausEnfant') f.push({ k: 'fsize', label: lab('shoeSize'), type: 'chips', opts: SHOE.map((z) => ({ v: z, fr: z, ar: z })) });
  if (sb === 'vetMat') f.push({ k: 'fsize', label: lab('csize'), type: 'chips', opts: CSIZES.map((x) => ({ v: x, fr: x === 'unique' ? T('sz_unique') : x, ar: x === 'unique' ? T('sz_unique', true) : x })) });
  f.push({ k: 'fcond', label: lab('cond'), type: 'chips', opts: opts(CONDS, 'c_'), req: true });
  return f;
}

function alimFields(d) {
  if (!NOTE_ALIM.includes(d.sub)) return [];
  return [{ k: 'lnote', type: 'note', label: lab('alimTip') }];
}

function equipFields() {
  return [
    { k: 'qbrand', label: lab('brand'), type: 'text', len: 40 },
    { k: 'qcond', label: lab('cond'), type: 'chips', opts: [{ v: 'new', fr: T('newM'), ar: T('newM', true) }, { v: 'used', fr: T('usedM'), ar: T('usedM', true) }] },
  ];
}

export function l6Fields(d) {
  if (!d.sub) return [];
  if (d.cat === 'fam') return famFields(d);
  if (d.cat === 'alim') return alimFields(d);
  if (d.cat === 'equip') return equipFields(d);
  return [];
}

export function l6Errors(d, ar) {
  const e = {};
  if (d.cat === 'fam' && d.sub) {
    if (isServ(d.sub)) {
      if (!d.foffer) e.foffer = T('errOffer', ar);
      if (d.sub === 'aideDom' && !d.frole) e.frole = T('errRole', ar);
    } else if (!d.fcond) e.fcond = T('errCond', ar);
  }
  return e;
}

// Champs ajoutés à l'annonce (site : fam, alim, eqp)
export function l6AdObject(d) {
  const o = {};
  if (d.cat === 'fam' && d.sub) {
    const f = isServ(d.sub)
      ? { sub: d.sub, offer: d.foffer, role: d.sub === 'aideDom' ? d.frole : '', sched: d.fsched, exp: d.foffer !== 'demand' ? String(d.fexp || '').trim() : '', age: d.foffer === 'demand' ? d.fage : '', langs: (d.flangs || []).slice() }
      : { sub: d.sub, item: FITEMS[d.sub] ? d.fitem : '', age: d.sub !== 'vetMat' ? d.fage : '', gender: d.fgender, size: d.fsize, cond: d.fcond };
    Object.keys(f).forEach((k) => { if (f[k] === '' || f[k] == null || (Array.isArray(f[k]) && !f[k].length)) delete f[k]; });
    o.fam = f;
  }
  if (d.cat === 'alim' && d.sub) o.alim = { sub: d.sub };
  if (d.cat === 'equip' && d.sub) {
    const e = { sub: d.sub };
    if ((d.qbrand || '').trim()) e.brand = d.qbrand.trim();
    if (d.qcond) e.cond = d.qcond;
    o.eqp = e;
  }
  return o;
}

// Reprend les champs d'une annonce existante dans le formulaire (modification)
export function l6FromAd(a) {
  const o = {};
  if (a.cat === 'fam' && a.fam) {
    const f = a.fam;
    if (isServ(f.sub)) {
      Object.assign(o, { foffer: f.offer || '', frole: f.role || '', fsched: f.sched || '', fexp: f.exp || '', fage: f.age || '', flangs: (f.langs || []).slice() });
    } else {
      Object.assign(o, { fitem: f.item || '', fage: f.age || '', fgender: f.gender || '', fsize: f.size != null ? String(f.size) : '', fcond: f.cond || '' });
    }
  }
  if (a.cat === 'equip' && a.eqp) Object.assign(o, { qbrand: a.eqp.brand || '', qcond: a.eqp.cond || '' });
  return o;
}
