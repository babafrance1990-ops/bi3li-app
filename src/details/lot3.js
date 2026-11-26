// Détails de l'immobilier, de l'emploi, des services et du covoiturage au dépôt, comme sur le site.
// Noms des champs identiques au site. L'immobilier garde vente/location, type et surface à l'étape 1.
import { WILAYAS } from '../places';
import { L3 } from './labels3';

const T = (k, ar) => { const x = L3[k]; return x ? (ar ? x[1] : x[0]) : k; };
const lab = (k) => [T(k, false), T(k, true)];
const opts = (list, pre) => list.map((v) => ({ v, fr: T(pre + v, false), ar: T(pre + v, true) }));
const plainOpts = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => ({ v: String(from + i), fr: String(from + i), ar: String(from + i) }));
// Nombres avec « + » sur la dernière valeur (chambres, salons, salles de bain), comme sur le site
const plusOpts = (from, to) => plainOpts(from, to).map((o, i, all) => (i === all.length - 1 ? { ...o, fr: o.v + '+', ar: o.v + '+' } : o));
const nOpts = (list, zero, key) => list.map((v) => (v === '0'
  ? { v, fr: T(zero, false), ar: T(zero, true) }
  : { v, fr: T(key, false).replace('{n}', v), ar: T(key, true).replace('{n}', v) }));
const todayStr = () => {
  const x = new Date();
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
};
const digitsOf = (v) => String(v || '').replace(/\D/g, '');

// ---------- Immobilier ----------
const EQUIP = {
  duplex: ['snde', 'somelec', 'tank', 'solar', 'genset', 'ac', 'terrace', 'parking', 'garage', 'guard'],
  villa: ['snde', 'somelec', 'tank', 'borehole', 'solar', 'genset', 'ac', 'yard', 'garage', 'pool', 'terrace', 'wall', 'guard'],
  office: ['snde', 'somelec', 'genset', 'ac', 'parking', 'elevator', 'guard', 'road'],
  warehouse: ['snde', 'somelec', 'genset', 'road', 'truck', 'wall', 'guard', 'wc'],
  building: ['snde', 'somelec', 'tank', 'genset', 'elevator', 'parking', 'guard', 'road'],
  farm: ['borehole', 'waterNear', 'elecNear', 'solar', 'wall', 'road'],
  room: ['snde', 'somelec', 'ac', 'solar', 'genset', 'guard'],
  apt: ['snde', 'somelec', 'tank', 'solar', 'genset', 'ac', 'parking', 'guard'],
  house: ['snde', 'somelec', 'tank', 'borehole', 'solar', 'genset', 'yard', 'garage', 'ac', 'wall'],
  shop: ['snde', 'somelec', 'solar', 'genset', 'road', 'wc', 'window'],
  land: ['waterNear', 'elecNear', 'borehole', 'corner', 'wall', 'road'],
};
// Équipements « utilités » (affichés en premier, comme sur le site)
const UTIL = ['snde', 'somelec', 'tank', 'borehole', 'solar', 'genset', 'waterNear', 'elecNear', 'water', 'elec'];
export const hasRooms = (k) => k === 'apt' || k === 'house' || k === 'villa' || k === 'duplex';
const hasLevels = (k) => k === 'house' || k === 'villa' || k === 'duplex' || k === 'building';
const hasPlace = (k) => k === 'shop' || k === 'office' || k === 'warehouse';

function estateFields(d) {
  const k = d.kind;
  const rent = d.deal === 'rent';
  const f = [];
  if (k === 'land') {
    f.push({ k: 'dimL', label: lab('dimL'), type: 'num', len: 4 });
    f.push({ k: 'dimW', label: lab('dimW'), type: 'num', len: 4 });
    f.push({ k: 'ilot', label: lab('ilot'), type: 'text', len: 10, ph: T('ilotPh') });
    f.push({ k: 'lot', label: lab('lotN'), type: 'text', len: 10, ph: T('lotPh') });
    f.push({ k: 'built', label: lab('built'), type: 'chips', opts: opts(['bare', 'built'], 'bt_') });
    f.push({ k: 'servic', label: lab('servic'), type: 'chips', opts: [{ v: 'yes', fr: T('yesO'), ar: T('yesO', true) }, { v: 'no', fr: T('noO'), ar: T('noO', true) }] });
  }
  if (hasRooms(k)) {
    f.push({ k: 'rooms', label: lab('rooms'), type: 'chips', opts: plusOpts(1, 8), req: true });
    f.push({ k: 'salons', label: lab('salons'), type: 'chips', opts: plusOpts(0, 4) });
    f.push({ k: 'baths', label: lab('baths'), type: 'chips', opts: plusOpts(0, 5) });
  }
  if (k === 'apt' || k === 'office') {
    f.push({ k: 'floor', label: lab('floor'), type: 'chips', opts: [{ v: '0', fr: T('rdc'), ar: T('rdc', true) }, ...plainOpts(1, 4), { v: '5', fr: '5+', ar: '5+' }] });
  }
  if (hasLevels(k)) f.push({ k: 'levels', label: lab('levels'), type: 'chips', opts: ['0', '1', '2'].map((v) => ({ v, fr: T('lv_' + v), ar: T('lv_' + v, true) })) });
  if (hasPlace(k)) f.push({ k: 'place', label: lab('place'), type: 'chips', opts: opts(['road', 'market', 'street'], 'pl_') });
  if (rent && hasRooms(k)) f.push({ k: 'furnished', label: lab('furnished'), type: 'chips', opts: [{ v: 'yes', fr: T('yesO'), ar: T('yesO', true) }, { v: 'no', fr: T('noO'), ar: T('noO', true) }] });
  if (rent) {
    f.push({ k: 'avance', label: lab('avance'), type: 'chips', opts: nOpts(['0', '1', '2', '3', '4', '6', '12'], 'av_0', 'av_n') });
    f.push({ k: 'caution', label: lab('caution'), type: 'chips', opts: nOpts(['0', '1', '2', '3'], 'ca_0', 'av_n') });
    f.push({ k: 'dur', label: lab('durLbl'), type: 'chips', opts: opts(['year', 'month', 'short'], 'du_') });
  } else {
    f.push({ k: 'papers', label: lab('papers'), type: 'chips', opts: opts(['titre', 'permis', 'attrib', 'acte', 'autre', 'none'], 'p_') });
  }
  f.push({ k: 'pub', label: lab('pubLbl'), type: 'chips', opts: opts(['owner', 'agent'], 'pub_'), req: true });
  if (d.pub === 'agent') f.push({ k: 'comm', label: lab('commLbl'), type: 'chips', opts: opts(rent ? ['none', 'half', 'one', 'nego'] : ['none', 'p1', 'p2', 'p3', 'nego'], 'cm_') });
  const list = EQUIP[k] || [];
  const util = list.filter((q) => UTIL.includes(q));
  const other = list.filter((q) => !UTIL.includes(q));
  if (util.length) f.push({ k: 'eq', label: lab('utilLbl'), type: 'checks', opts: opts(util, 'e_') });
  if (other.length) f.push({ k: 'eq', label: lab('otherEq'), type: 'checks', opts: opts(other, 'e_') });
  return f;
}

// ---------- Emploi (la sous-catégorie est l'offre ou la demande) ----------
const JCT = ['cdi', 'cdd', 'stage', 'interim', 'free', 'day', 'app'];
const JSC = ['commerce', 'btp', 'transport', 'peche', 'mines', 'agri', 'hotel', 'sante', 'edu', 'it', 'banque', 'admin', 'secu', 'dom', 'art', 'ong', 'other'];
const JFN = ['vendeur', 'chauffeur', 'ouvrier', 'tech', 'elec', 'plomb', 'macon', 'meca', 'compta', 'secr', 'ens', 'inf', 'cuis', 'gard', 'dev', 'caisse', 'chef', 'other'];
const JED = ['none', 'bepc', 'cap', 'bac', 'bac2', 'lic', 'master', 'doc'];
const FLANGS = ['has', 'ar', 'fr', 'pul', 'son', 'wol'];

function jobFields(d) {
  if (!d.sub) return [];
  const offer = d.sub === 'offer';
  return [
    { k: 'jcontract', label: lab('ctL'), type: 'chips', opts: opts(JCT, 'ct_'), req: offer },
    { k: 'jtime', label: lab('tmL'), type: 'chips', opts: opts(['full', 'part'], 'tm_') },
    { k: 'jsector', label: lab('scL'), type: 'chips', opts: opts(JSC, 'sc_'), req: true },
    { k: 'jfunc', label: lab('fnL'), type: 'chips', opts: opts(JFN, 'fn_'), req: true },
    { k: 'jexp', label: lab(offer ? 'exReq' : 'exL'), type: 'chips', opts: opts(['0', '1', '2', '3', '4', '5'], 'ex_') },
    { k: 'jedu', label: lab(offer ? 'edReq' : 'edL'), type: 'chips', opts: opts(JED, 'ed_') },
    { k: 'flangs', label: lab(offer ? 'langsReq' : 'langsL'), type: 'checks', opts: opts(FLANGS, 'l_') },
  ];
}

// ---------- Services (la sous-catégorie est choisie à l'étape 1) ----------
function servFields(d) {
  if (!d.sub) return [];
  return [
    { k: 'soffer', label: lab('soffer'), type: 'chips', opts: opts(['offer', 'demand'], 'so_') },
    { k: 'sarea', label: lab('sarea'), type: 'text', len: 60, ph: T('sareaPh') },
    { k: 'shome', label: lab('shome'), type: 'check' },
  ];
}

// ---------- Covoiturage ----------
const CITIES = WILAYAS.flatMap((w) => w.cities.map(([fr, ar]) => ({ v: fr, fr, ar })));

function tripFields(d) {
  const f = []; // conducteur / passager : choisi à l'étape catégorie (sous-catégories)
  if (!d.ctype) return f;
  const offer = d.ctype === 'offer';
  f.push({ k: 'cfrom', label: lab('cfrom'), type: 'chips', opts: CITIES, req: true });
  f.push({ k: 'cto', label: lab('cto'), type: 'chips', opts: CITIES, req: true });
  f.push({ k: 'cdate', label: lab('cdate'), type: 'date', req: true });
  f.push({ k: 'ctime', label: lab('ctime'), type: 'time', req: offer });
  f.push({ k: 'cseats', label: lab(offer ? 'cseats' : 'cseatsD'), type: 'chips', opts: plainOpts(1, 8), req: true });
  if (offer) f.push({ k: 'ccar', label: lab('ccar'), type: 'text', len: 40, ph: T('ccarPh') });
  f.push({ k: 'cstops', label: lab('cstops'), type: 'text', len: 60, ph: T('cstopsPh') });
  f.push({ k: 'cbags', label: lab('cbags'), type: 'chips', opts: opts(['s', 'm', 'l'], 'bg_') });
  if (offer) f.push({ k: 'cclim', label: lab('cclim'), type: 'check' });
  f.push({ k: 'cwomen', label: lab('cwomen'), type: 'check' });
  return f;
}

// ---------- Champs affichés pour la catégorie ----------
export function l3Fields(d) {
  if (d.cat === 'immo') return d.deal && d.kind ? estateFields(d) : [];
  if (d.cat === 'job') return jobFields(d);
  if (d.cat === 'serv') return servFields(d);
  if (d.cat === 'covoit') return tripFields(d);
  return [];
}

// Erreurs des champs obligatoires : { champ: message }
export function l3Errors(d, ar) {
  const e = {};
  const msg = (k) => T(k, ar);
  if (d.cat === 'immo' && d.deal && d.kind) {
    if (hasRooms(d.kind) && !d.rooms) e.rooms = msg('errRooms');
    if (!d.pub) e.pub = msg('errPub');
  }
  if (d.cat === 'job' && d.sub) {
    if (d.sub === 'offer' && !d.jcontract) e.jcontract = msg('errCt');
    if (!d.jsector) e.jsector = msg('errSc');
    if (!d.jfunc) e.jfunc = msg('errFn');
  }
  if (d.cat === 'covoit') {
    if (!d.ctype) e.ctype = msg('errCtype');
    else {
      if (!d.cfrom) e.cfrom = msg('errCfrom');
      if (!d.cto || d.cto === d.cfrom) e.cto = msg('errCto');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d.cdate || '') || d.cdate < todayStr()) e.cdate = msg('errCdate');
      if (d.ctype === 'offer' && !/^([01]?\d|2[0-3]):[0-5]\d$/.test(d.ctime || '')) e.ctime = msg('errCtime');
      const cs = +d.cseats;
      if (!(cs >= 1 && cs <= 8)) e.cseats = msg('errCseats');
    }
  }
  return e;
}

// Champs ajoutés à l'annonce (noms et valeurs comme sur le site)
export function l3AdObject(d) {
  if (d.cat === 'immo' && d.deal && d.kind) {
    const k = d.kind;
    const rent = d.deal === 'rent';
    const area = +d.dimL > 0 && +d.dimW > 0 ? Math.round(+d.dimL * +d.dimW) : 0;
    const e = {
      deal: d.deal, kind: k, surface: +digitsOf(d.surface) || area || 0,
      eq: (d.eq || []).filter((q) => (EQUIP[k] || []).includes(q)),
      rooms: d.rooms, salons: d.salons, baths: d.baths, furnished: rent ? d.furnished : undefined,
      floor: k === 'apt' || k === 'office' ? d.floor : undefined,
      levels: hasLevels(k) ? d.levels : undefined,
      place: hasPlace(k) ? d.place : undefined,
      papers: rent ? undefined : d.papers,
      pub: d.pub,
      comm: d.pub === 'agent' ? d.comm : undefined,
      avance: rent ? d.avance : undefined, caution: rent ? d.caution : undefined, dur: rent ? d.dur : undefined,
      ilot: k === 'land' ? (d.ilot || '').trim() : undefined,
      lot: k === 'land' ? (d.lot || '').trim() : undefined,
      dimL: k === 'land' && +d.dimL > 0 ? +d.dimL : undefined,
      dimW: k === 'land' && +d.dimW > 0 ? +d.dimW : undefined,
      built: k === 'land' ? d.built : undefined,
      servic: k === 'land' ? d.servic : undefined,
    };
    Object.keys(e).forEach((x) => { if (e[x] === '' || e[x] === undefined) delete e[x]; });
    return { estate: e };
  }
  if (d.cat === 'job' && d.sub) {
    const j = {
      offer: d.sub, contract: d.jcontract, time: d.jtime, sector: d.jsector, func: d.jfunc,
      exp: d.jexp, edu: d.jedu, langs: (d.flangs || []).slice(),
    };
    Object.keys(j).forEach((x) => { if (j[x] === '' || j[x] === undefined || (Array.isArray(j[x]) && !j[x].length)) delete j[x]; });
    return { job: j };
  }
  if (d.cat === 'serv' && d.sub) {
    return { serv: { sub: d.sub, offer: d.soffer === 'demand' ? 'demand' : 'offer', area: (d.sarea || '').trim(), home: !!d.shome } };
  }
  if (d.cat === 'covoit' && d.ctype) {
    const offer = d.ctype === 'offer';
    return {
      trip: {
        type: d.ctype, from: d.cfrom, to: d.cto, date: d.cdate, time: d.ctime || '', seats: +d.cseats || 1,
        car: offer ? (d.ccar || '').trim() : '', stops: (d.cstops || '').trim(), bags: d.cbags || '',
        clim: offer && !!d.cclim, women: !!d.cwomen,
      },
    };
  }
  return {};
}

// Reprend les champs d'une annonce existante dans le formulaire (modification)
export function l3FromAd(a) {
  const o = {};
  const put = (k, v) => { if (v !== undefined && v !== null && v !== '') o[k] = String(v); };
  if (a.estate) {
    const e = a.estate;
    ['rooms', 'salons', 'baths', 'furnished', 'floor', 'levels', 'place', 'papers', 'pub', 'comm', 'avance', 'caution', 'dur', 'ilot', 'lot', 'dimL', 'dimW', 'built', 'servic'].forEach((k) => put(k, e[k]));
    if (Array.isArray(e.eq)) o.eq = e.eq.slice();
  }
  if (a.job) {
    const j = a.job;
    o.sub = j.offer || '';
    put('jcontract', j.contract); put('jtime', j.time); put('jsector', j.sector); put('jfunc', j.func); put('jexp', j.exp); put('jedu', j.edu);
    if (Array.isArray(j.langs)) o.flangs = j.langs.slice();
  }
  if (a.serv) {
    o.sub = a.serv.sub || '';
    o.soffer = a.serv.offer === 'demand' ? 'demand' : 'offer';
    o.sarea = a.serv.area || '';
    o.shome = !!a.serv.home;
  }
  if (a.trip) {
    const t = a.trip;
    o.ctype = t.type || ''; o.cfrom = t.from || ''; o.cto = t.to || ''; o.cdate = t.date || ''; o.ctime = t.time || '';
    put('cseats', t.seats); o.ccar = t.car || ''; o.cstops = t.stops || ''; o.cbags = t.bags || '';
    o.cclim = !!t.clim; o.cwomen = !!t.women;
  }
  return o;
}

export const l3Title = (d, ar) => (T(d.cat === 'immo' ? 'reInfo' : d.cat === 'job' ? 'jobInfo' : d.cat === 'serv' ? 'servInfo' : 'tripInfo', ar));
