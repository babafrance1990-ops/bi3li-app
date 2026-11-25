// Brouillon d'annonce gardé sur le téléphone (si le vendeur quitte l'écran, rien n'est perdu)
// + mémoire de la dernière ville / quartier / contacts, repris dans l'annonce suivante (comme sur le site).
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'bi3li_draft';
const LAST = 'bi3li_last_place';
const PHOTO_TTL = 24 * 3600 * 1000; // le serveur efface les photos non publiées après 48 h : on les renvoie après 24 h

export function newDraft(last = {}) {
  return {
    step: 1, cat: '', sub: '', title: '', desc: '', photos: [],
    price: '', punit: '', nego: true, hidep: false, // comme le site : « à discuter » coché par défaut
    city: last.city || 'Nouakchott', hood: last.hood || '', near: '',
    deliv: false, delivNote: '',
    wa: last.wa ?? true, call: last.call ?? true, msg: last.msg ?? false,
    // Immobilier
    deal: '', kind: '', surface: '',
    // Vidéo et message vocal : adresse du serveur (annonce existante) ou fichier sur le téléphone (nouveau)
    video: '', videoUri: '', voice: '', voiceUri: '',
    // Animaux (espèce = sous-catégorie)
    count: '1', sex: '', age: '', breed: '', tabaski: false,
    // Véhicules (noms comme sur le site)
    brand: '',
    model: '',
    vtype: '',
    color: '',
    seats: '',
    doors: '',
    year: '',
    km: '',
    fuel: '',
    gear: '',
    cond: '',
    vbrand: '',
    vmodel: '',
    vmtype: '',
    vcc: '',
    vyear: '',
    vkm: '',
    vfuel: '',
    vseats: '',
    vttype: '',
    vload: '',
    vbtype: '',
    vpart: '',
    vcompat: '',
    vservice: '',
    vhours: '',
    vcond: '',
    vhome: false, vdriver: false,
    modelOther: false, // modèle de voiture saisi à la main (« Autre modèle »)
    // Téléphones et électronique (noms comme sur le site)
    pbrand: '',
    pmodel: '',
    pstorage: '',
    pram: '',
    pcond: '',
    pcolor: '',
    pbatt: '',
    pimei: '',
    mbrand: '',
    mmodel: '',
    msize: '',
    mres: '',
    mpads: '',
    mgames: '',
    mcpu: '',
    mram: '',
    mstorage: '',
    mstype: '',
    mscreen: '',
    macc: '',
    mcompat: '',
    mcond: '',
    pdual: '', punlock: '', msmart: '', pincl: [],
    // Immobilier (noms comme sur le site ; deal, kind, surface et sous-catégorie sont à l'étape 1)
    rooms: '', salons: '', baths: '', floor: '', levels: '', place: '', furnished: '', avance: '', caution: '', dur: '',
    papers: '', pub: '', comm: '', dimL: '', dimW: '', ilot: '', lot: '', built: '', servic: '', eq: [],
    // Emploi
    jcontract: '', jtime: '', jsector: '', jfunc: '', jexp: '', jedu: '', flangs: [],
    // Services
    soffer: 'offer', sarea: '', shome: false,
    // Mode et beauté
    moitem: '', mopub: '', mosize: '', mofabric: '', mocolor: '', mobrand: '', mometal: '', moweight: '', mocond: '', mohand: false,
    bbrand: '', bcond: '',
    // Covoiturage
    ctype: '', cfrom: '', cto: '', cdate: '', ctime: '', cseats: '', ccar: '', cstops: '', cbags: '', cclim: false, cwomen: false,
  };
}

export async function loadDraft() {
  let last = {};
  try { last = JSON.parse((await AsyncStorage.getItem(LAST)) || '{}'); } catch {}
  try {
    const d = JSON.parse(await AsyncStorage.getItem(KEY));
    if (d && d.cat !== undefined) {
      // Photos : on garde celles déjà envoyées depuis moins de 24 h ; les autres seront renvoyées si le fichier existe encore
      d.photos = (d.photos || []).map((p) => (p.url && Date.now() - (p.at || 0) < PHOTO_TTL ? { ...p, status: 'ok' } : { ...p, url: null, status: 'todo' }));
      return { draft: d, restored: true, last };
    }
  } catch {}
  return { draft: newDraft(last), restored: false, last };
}

export const saveDraft = (d) => AsyncStorage.setItem(KEY, JSON.stringify(d)).catch(() => {});
export const clearDraft = () => AsyncStorage.removeItem(KEY).catch(() => {});
export const saveLast = (d) =>
  AsyncStorage.setItem(LAST, JSON.stringify({ city: d.city, hood: d.hood, wa: d.wa, call: d.call, msg: d.msg })).catch(() => {});
