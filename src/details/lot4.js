// Détails de la mode et de la beauté au dépôt, comme sur le site.
// Mode : la rubrique (sous-catégorie) est choisie à l'étape 1, l'article et l'état sont ici.
// Beauté : la rubrique est choisie à l'étape 1 ; marque et état sont facultatifs.
import { L3 } from './labels3';

const T = (k, ar) => { const x = L3[k]; return x ? (ar ? x[1] : x[0]) : k; };
const lab = (k) => [T(k, false), T(k, true)];
const opts = (list, pre) => list.map((v) => ({ v, fr: T(pre + v, false), ar: T(pre + v, true) }));
const plainOpts = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => ({ v: String(from + i), fr: String(from + i), ar: String(from + i) }));

const MOITEMS = {
  tradF: ['melhfa', 'rembaya', 'body', 'foulard', 'tenueT', 'other'], tradM: ['daraa', 'sarwal', 'cheche', 'other'],
  clothesF: ['robe', 'abaya', 'ensemble', 'pantalon', 'jupe', 'tshirt', 'veste', 'other'],
  clothesM: ['chemise', 'pantalon', 'polo', 'costume', 'veste', 'survet', 'other'],
  shoesF: ['talons', 'sandales', 'baskets', 'ballerines', 'other'], shoesM: ['babouches', 'baskets', 'ville', 'sandales', 'other'],
  glasses: ['soleil', 'vue', 'other'], jewelry: ['collier', 'bracelet', 'bague', 'boucles', 'parure', 'other'],
  watches: ['montreH', 'montreF', 'connectee', 'other'], bags: ['sacMain', 'valise', 'sacVoyage', 'sacDos', 'other'],
};
const MOPUB = ['f', 'm', 'k', 'x'];
const MO_PUBSUBS = ['bags', 'watches', 'glasses'];
const CSIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'unique'];
const CONDS = ['new', 'vgood', 'good', 'fair', 'repair'];
const METALS = ['or', 'argent', 'plaque', 'fantaisie'];
const BRAND_SUBS = ['shoesF', 'shoesM', 'watches', 'bags', 'clothesF', 'clothesM', 'glasses'];
const HAND_SUBS = ['tradF', 'tradM', 'jewelry', 'bags'];

// Catégorie de taille : vêtements, chaussures ou autre
const moKind = (sb) => (/^trad|^clothes/.test(sb || '') ? 'cloth' : /^shoes/.test(sb || '') ? 'shoe' : sb);

function modeFields(d) {
  if (!d.sub) return [];
  const sb = d.sub;
  const mk = moKind(sb);
  const f = [{ k: 'moitem', label: lab('hitem'), type: 'chips', opts: opts(MOITEMS[sb] || [], 'mi_'), req: true }];
  if (MO_PUBSUBS.includes(sb)) f.push({ k: 'mopub', label: lab('mpub'), type: 'chips', opts: opts(MOPUB, 'pu_') });
  if (mk === 'cloth') {
    f.push({ k: 'mosize', label: lab('csize'), type: 'chips', opts: CSIZES.map((x) => ({ v: x, fr: x === 'unique' ? T('sz_unique') : x, ar: x === 'unique' ? T('sz_unique', true) : x })) });
    f.push({ k: 'mofabric', label: lab('fabric'), type: 'text', len: 40, ph: T('fabricPh') });
  }
  if (mk === 'shoe') f.push({ k: 'mosize', label: lab('shoeSize'), type: 'chips', opts: plainOpts(20, 46) });
  if (sb === 'jewelry') {
    f.push({ k: 'mometal', label: lab('metal'), type: 'chips', opts: opts(METALS, 'me_') });
    f.push({ k: 'moweight', label: lab('weight'), type: 'num', len: 6, ph: '10' });
  }
  if (BRAND_SUBS.includes(sb)) f.push({ k: 'mobrand', label: lab('brand'), type: 'text', len: 40, ph: T('mbrandPh') });
  f.push({ k: 'mocolor', label: lab('color'), type: 'text', len: 30, ph: T('phColorPh') });
  f.push({ k: 'mocond', label: lab('cond'), type: 'chips', opts: opts(CONDS, 'c_'), req: true });
  if (HAND_SUBS.includes(sb)) f.push({ k: 'mohand', label: lab('handmade'), type: 'check' });
  return f;
}

function beautyFields(d) {
  if (!d.sub) return [];
  return [
    { k: 'bbrand', label: lab('brand'), type: 'text', len: 40 },
    { k: 'bcond', label: lab('cond'), type: 'chips', opts: [{ v: 'new', fr: T('newM'), ar: T('newM', true) }, { v: 'used', fr: T('usedM'), ar: T('usedM', true) }] },
    { k: 'btynote', label: lab('btyRule'), type: 'note' },
  ];
}

export function l4Fields(d) {
  if (d.cat === 'mode') return modeFields(d);
  if (d.cat === 'beaute') return beautyFields(d);
  return [];
}

export function l4Errors(d, ar) {
  const e = {};
  if (d.cat === 'mode' && d.sub) {
    if (!d.moitem) e.moitem = T('errHitem', ar);
    if (!d.mocond) e.mocond = T('errCond', ar);
  }
  return e;
}

// Champs ajoutés à l'annonce (site : mo pour la mode, bty pour la beauté)
export function l4AdObject(d) {
  if (d.cat === 'mode' && d.sub) {
    const sb = d.sub;
    const mo = { sub: sb, item: d.moitem, cond: d.mocond, hand: !!d.mohand };
    if (/F$/.test(sb)) mo.pub = 'f';
    else if (/M$/.test(sb)) mo.pub = 'm';
    else if (MO_PUBSUBS.includes(sb) && d.mopub) mo.pub = d.mopub;
    if (d.mosize) mo.size = d.mosize;
    ['mofabric', 'mocolor', 'mobrand', 'mometal', 'moweight'].forEach((k) => {
      const v = String(d[k] || '').trim();
      if (v) mo[k.slice(2)] = v;
    });
    return { mo };
  }
  if (d.cat === 'beaute' && d.sub) {
    const bty = { sub: d.sub };
    if ((d.bbrand || '').trim()) bty.brand = d.bbrand.trim();
    if (d.bcond) bty.cond = d.bcond;
    return { bty };
  }
  return {};
}

// Reprend les champs d'une annonce existante dans le formulaire (modification)
export function l4FromAd(a) {
  const o = {};
  if (a.mo) {
    const m = a.mo;
    o.sub = m.sub || '';
    o.moitem = m.item || ''; o.mocond = m.cond || ''; o.mohand = !!m.hand;
    o.mopub = m.pub && MOPUB.includes(m.pub) ? m.pub : '';
    o.mosize = m.size || ''; o.mofabric = m.fabric || ''; o.mocolor = m.color || ''; o.mobrand = m.brand || '';
    o.mometal = m.metal || ''; o.moweight = m.weight ? String(m.weight) : '';
  }
  if (a.bty) {
    o.sub = a.bty.sub || '';
    o.bbrand = a.bty.brand || ''; o.bcond = a.bty.cond || '';
  }
  return o;
}
