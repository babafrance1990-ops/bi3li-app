// Détails des téléphones et de l'électronique au dépôt, comme sur le site.
// Téléphone (smartphone, simple, tablette) → champ « dev » ; électronique et accessoires → champ « mm ».
// Noms des champs identiques au site ; libellés (fr / ar) repris du site.

const LBL = {
  a_bag: ["Sacoche", "حقيبة"],
  a_cable: ["Câble", "كابل"],
  a_case: ["Coque / étui", "غطاء / جراب"],
  a_charger: ["Chargeur", "شاحن"],
  a_earphones: ["Écouteurs / casque", "سماعات"],
  a_holder: ["Support", "حامل"],
  a_keyboard: ["Clavier", "لوحة مفاتيح"],
  a_monitor: ["Écran / moniteur", "شاشة"],
  a_mouse: ["Souris", "فأرة"],
  a_other_a: ["Autre accessoire", "ملحق آخر"],
  a_powerbank: ["Batterie externe", "بطارية متنقلة"],
  a_printer: ["Imprimante", "طابعة"],
  a_screen: ["Protection d’écran", "واقي شاشة"],
  a_storage: ["Disque dur / clé USB", "قرص صلب / فلاشة"],
  accType: ["Type d’accessoire", "نوع الملحق"],
  battery: ["Batterie (%)", "البطارية (%)"],
  brand: ["Marque", "الماركة"],
  color: ["Couleur", "اللون"],
  compat: ["Compatible avec", "متوافق مع"],
  compatPh: ["Ex. : iPhone 13, Samsung, HP…", "مثال: iPhone 13، Samsung، HP…"],
  consoleModel: ["Modèle de console", "موديل الجهاز"],
  cpu: ["Processeur", "المعالج"],
  cpuPh: ["Ex. : Intel Core i5", "مثال: Intel Core i5"],
  d_basic: ["Téléphone simple", "هاتف عادي"],
  d_smart: ["Smartphone", "هاتف ذكي"],
  d_tab: ["Tablette", "جهاز لوحي"],
  dtype: ["Type d’appareil", "نوع الجهاز"],
  dual: ["Double SIM", "شريحتان"],
  errDtype: ["Choisissez le type d’appareil.", "اختر نوع الجهاز."],
  errImei: ["L’IMEI contient 15 chiffres.", "رقم IMEI يتكون من 15 رقماً."],
  errModel: ["Indiquez le modèle.", "اكتب الموديل."],
  errStorage: ["Choisissez le stockage.", "اختر سعة التخزين."],
  games: ["Jeux inclus", "الألعاب المرفقة"],
  gamesPh: ["Ex. : 3", "مثال: 3"],
  i_box: ["Boîte", "العلبة"],
  i_charger: ["Chargeur", "الشاحن"],
  i_earphones: ["Écouteurs", "السماعات"],
  i_invoice: ["Facture", "الفاتورة"],
  i_warranty: ["Garantie", "الضمان"],
  imei: ["Numéro IMEI", "رقم IMEI"],
  imeiHelp: ["Tapez *#06# sur le téléphone pour l’afficher. Les acheteurs ne le verront pas.", "اكتب *#06# على الهاتف لإظهاره. لن يراه المشترون."],
  imeiOk: ["IMEI transmis au modérateur", "تم إرسال IMEI إلى المشرف"],
  inch: ["pouces", "بوصة"],
  incl: ["Fourni avec", "يأتي مع"],
  mmInfo: ["Informations sur l’appareil", "معلومات الجهاز"],
  model: ["Modèle", "الموديل"],
  modelPh: ["Ex. : Hilux", "مثال: هايلكس"],
  modelPh2: ["Référence ou modèle", "المرجع أو الموديل"],
  mt_accpc: ["Accessoire informatique", "ملحقات الحاسوب"],
  mt_acctel: ["Accessoire téléphone", "ملحقات الهاتف"],
  mt_basic: ["Téléphone simple", "هاتف عادي"],
  mt_console: ["Console de jeux", "جهاز ألعاب"],
  mt_desktop: ["Ordinateur de bureau", "حاسوب مكتبي"],
  mt_gen: ["Groupe électrogène", "مولد كهربائي"],
  mt_laptop: ["Ordinateur portable", "حاسوب محمول"],
  mt_other: ["Autre appareil", "جهاز آخر"],
  mt_smart: ["Smartphone", "هاتف ذكي"],
  mt_solar: ["Solaire & batteries", "طاقة شمسية وبطاريات"],
  mt_tab: ["Tablette", "جهاز لوحي"],
  mt_tv: ["Télévision", "تلفاز"],
  mtype: ["Type de produit", "نوع المنتج"],
  pads: ["Manettes incluses", "أذرع التحكم المرفقة"],
  pc_broken: ["Écran cassé / à réparer", "شاشة مكسورة / يحتاج إصلاح"],
  pc_good: ["Bon état", "حالة جيدة"],
  pc_likenew: ["Comme neuf", "كالجديد"],
  pc_scratch: ["Rayures visibles", "به خدوش"],
  pc_sealed: ["Neuf sous emballage", "جديد في علبته"],
  pcond: ["État", "الحالة"],
  phInfo: ["Informations sur l’appareil", "معلومات الجهاز"],
  phModelPh: ["Ex. : Galaxy A55", "مثال: Galaxy A55"],
  r_4k: ["4K", "4K"],
  r_fhd: ["Full HD", "Full HD"],
  r_hd: ["HD", "HD"],
  ram: ["Mémoire vive (RAM)", "الذاكرة العشوائية"],
  res: ["Résolution", "الدقة"],
  screen: ["Taille de l’écran", "حجم الشاشة"],
  smartTv: ["Smart TV (Internet)", "تلفاز ذكي (إنترنت)"],
  st_hdd: ["Disque dur (HDD)", "قرص صلب (HDD)"],
  st_ssd: ["SSD", "SSD"],
  storage: ["Stockage", "سعة التخزين"],
  stype: ["Type de stockage", "نوع التخزين"],
  tvSize: ["Taille de l’écran", "حجم الشاشة"],
  unlocked: ["Débloqué tous opérateurs", "مفتوح لكل الشبكات"],
};

const pl = (list) => list.map((x) => ({ v: x, fr: x, ar: x === 'Autre' ? 'أخرى' : x }));
const yn = () => [{ v: 'yes', fr: 'Oui', ar: 'نعم' }, { v: 'no', fr: 'Non', ar: 'لا' }];
const PHONE_BRANDS = ['Samsung', 'Apple', 'Tecno', 'Infinix', 'Itel', 'Xiaomi', 'Huawei', 'Oppo', 'Autre'];
const PHONE_CONDS = ['sealed', 'likenew', 'good', 'scratch', 'broken'];
const INCL = ['box', 'charger', 'earphones', 'invoice', 'warranty'];
const STORAGES = [16, 32, 64, 128, 256, 512, 1024];
const RAMS = [1, 2, 3, 4, 6, 8, 12];
const gbOpt = (n) => ({ v: String(n), fr: n >= 1024 ? n / 1024 + ' To' : n + ' Go', ar: n >= 1024 ? n / 1024 + ' تيرا' : n + ' جيغا' });
const MBRANDS = {
  tv: ['Samsung', 'LG', 'Sony', 'Hisense', 'TCL', 'Philips', 'Autre'],
  console: ['Sony', 'Microsoft', 'Nintendo', 'Autre'],
  laptop: ['HP', 'Dell', 'Lenovo', 'Apple', 'Asus', 'Acer', 'Toshiba', 'Microsoft', 'Autre'],
  desktop: ['HP', 'Dell', 'Lenovo', 'Apple', 'Asus', 'Acer', 'Autre'],
  acctel: ['Samsung', 'Apple', 'Oraimo', 'Anker', 'Xiaomi', 'Tecno', 'Autre'],
  accpc: ['HP', 'Logitech', 'Dell', 'Lenovo', 'Canon', 'Epson', 'SanDisk', 'Autre'],
  solar: ['Jinko', 'Longi', 'Canadian Solar', 'JA Solar', 'Felicity', 'Must', 'Autre'],
  gen: ['Honda', 'Yamaha', 'Perkins', 'Elemax', 'Firman', 'Autre'],
  other: ['Autre'],
};
const CONSOLES = ['PS5', 'PS4', 'PS3', 'Xbox Series X', 'Xbox Series S', 'Xbox One', 'Nintendo Switch', 'Autre'];
const ACCS = {
  acctel: ['charger', 'cable', 'earphones', 'case', 'screen', 'powerbank', 'holder', 'other_a'],
  accpc: ['keyboard', 'mouse', 'monitor', 'printer', 'storage', 'cable', 'bag', 'other_a'],
};
const TYPE_LABEL = {
  smart: ['Smartphone', 'هاتف ذكي'], basic: ['Téléphone simple', 'هاتف عادي'], tab: ['Tablette', 'جهاز لوحي'],
};
const PHONE_TYPES = ['smart', 'basic', 'tab'];
export const isPhoneSub = (x) => PHONE_TYPES.includes(x);
export const needStorage = (x) => x === 'smart' || x === 'tab';

// Messages d'erreur (fr / ar) : champs obligatoires
export const ELEC_ERR = {
  errBrand: ['Choisissez la marque.', 'اختر الماركة.'], errModel: ['Indiquez le modèle.', 'اكتب الموديل.'], errStorage: ['Choisissez le stockage.', 'اختر سعة التخزين.'],
  errCond: ['Choisissez l’état.', 'اختر الحالة.'], errImei: ['L’IMEI contient 15 chiffres.', 'رقم IMEI يتكون من 15 رقماً.'],
  errDtype: ['Choisissez le type d’appareil.', 'اختر نوع الجهاز.'],
};

const phoneFields = (sub) => [
  { k: 'pbrand', label: LBL.brand, type: 'chips', opts: pl(PHONE_BRANDS), req: true, err: 'errBrand' },
  { k: 'pmodel', label: LBL.model, type: 'text', req: true, err: 'errModel' },
  { k: 'pstorage', label: LBL.storage, type: 'chips', opts: STORAGES.map(gbOpt), req: needStorage(sub), err: 'errStorage' },
  { k: 'pram', label: LBL.ram, type: 'chips', opts: RAMS.map((r) => ({ v: String(r), fr: r + ' Go', ar: r + ' جيغا' })) },
  { k: 'pcond', label: LBL.pcond, type: 'chips', opts: PHONE_CONDS.map((c) => ({ v: c, fr: LBL['pc_' + c][0], ar: LBL['pc_' + c][1] })), req: true, err: 'errCond' },
  { k: 'pcolor', label: LBL.color, type: 'text' },
  ...(sub === 'smart' || sub === 'tab' ? [{ k: 'pbatt', label: LBL.battery, type: 'num', len: 3 }] : []),
  ...(sub !== 'tab' ? [
    { k: 'pdual', label: LBL.dual, type: 'chips', opts: yn() },
    { k: 'punlock', label: LBL.unlocked, type: 'chips', opts: yn() },
  ] : []),
  { k: 'pincl', label: LBL.incl, type: 'checks', opts: INCL.map((q) => ({ v: q, fr: LBL['i_' + q][0], ar: LBL['i_' + q][1] })) },
  { k: 'pimei', label: LBL.imei, type: 'num', len: 15 },
];

const multiFields = (sub) => {
  const bopts = MBRANDS[sub] ? pl(MBRANDS[sub]) : [];
  const brand = { k: 'mbrand', label: LBL.brand, type: 'chips', opts: bopts, req: ['tv', 'console', 'laptop', 'desktop'].includes(sub), err: 'errBrand' };
  const cond = { k: 'mcond', label: LBL.pcond, type: 'chips', opts: PHONE_CONDS.map((c) => ({ v: c, fr: LBL['pc_' + c][0], ar: LBL['pc_' + c][1] })), req: true, err: 'errCond' };
  const incl = { k: 'pincl', label: LBL.incl, type: 'checks', opts: INCL.map((q) => ({ v: q, fr: LBL['i_' + q][0], ar: LBL['i_' + q][1] })) };
  const model = (req) => ({ k: 'mmodel', label: LBL.model, type: 'text', req, err: 'errModel' });
  if (sub === 'tv') return [brand,
    { k: 'msize', label: LBL.tvSize, type: 'chips', opts: ['24', '32', '40', '43', '50', '55', '65', '75'].map((s) => ({ v: s, fr: s + (s === '75' ? '+' : '') + ' ' + LBL.inch[0], ar: s + (s === '75' ? '+' : '') + ' ' + LBL.inch[1] })) },
    { k: 'mres', label: LBL.res, type: 'chips', opts: [{ v: 'hd', fr: 'HD', ar: 'HD' }, { v: 'fhd', fr: 'Full HD', ar: 'Full HD' }, { v: '4k', fr: '4K', ar: '4K' }] },
    { k: 'msmart', label: LBL.smartTv, type: 'chips', opts: yn() }, cond, incl];
  if (sub === 'console') return [brand,
    { k: 'mmodel', label: LBL.consoleModel, type: 'chips', opts: pl(CONSOLES), req: true, err: 'errModel' },
    { k: 'mpads', label: LBL.pads, type: 'chips', opts: pl(['0', '1', '2', '3', '4']) },
    { k: 'mgames', label: LBL.games, type: 'num' }, cond, incl];
  if (sub === 'laptop' || sub === 'desktop') return [brand, model(false),
    { k: 'mcpu', label: LBL.cpu, type: 'text' },
    { k: 'mram', label: LBL.ram, type: 'chips', opts: [4, 8, 16, 32, 64].map((r) => ({ v: String(r), fr: r + ' Go', ar: r + ' جيغا' })) },
    { k: 'mstorage', label: LBL.storage, type: 'chips', opts: [128, 256, 512, 1024, 2048].map(gbOpt) },
    { k: 'mstype', label: LBL.stype, type: 'chips', opts: [{ v: 'ssd', fr: 'SSD', ar: 'SSD' }, { v: 'hdd', fr: LBL.st_hdd[0], ar: LBL.st_hdd[1] }] },
    ...(sub === 'laptop' ? [{ k: 'mscreen', label: LBL.screen, type: 'chips', opts: ['11', '13', '14', '15', '16', '17'].map((s) => ({ v: s, fr: s + ' ' + LBL.inch[0], ar: s + ' ' + LBL.inch[1] })) }] : []),
    cond, incl];
  if (sub === 'acctel' || sub === 'accpc') return [
    { k: 'macc', label: LBL.accType, type: 'chips', opts: ACCS[sub].map((a) => ({ v: a, fr: LBL['a_' + a][0], ar: LBL['a_' + a][1] })) },
    { k: 'mbrand', label: LBL.brand, type: 'chips', opts: pl(MBRANDS[sub]) },
    { k: 'mcompat', label: LBL.compat, type: 'text' }, cond, incl];
  if (MBRANDS[sub]) return [brand, model(false), cond, incl];
  return [];
};

// Champs à afficher pour la catégorie téléphone / électronique
export function electronicFields(cat, sub) {
  if (!sub) return [];
  if (cat === 'phone' && isPhoneSub(sub)) return phoneFields(sub);
  if (cat === 'phone' || cat === 'multi') return multiFields(sub);
  return [];
}

// Enregistrement comme sur le site : dev (téléphone) ou mm (électronique et accessoires)
export function electronicAdObject(cat, sub, d) {
  const clean = (o) => { Object.keys(o).forEach((k) => { const v = o[k]; if (v === '' || v === undefined || v === null || (typeof v === 'number' && isNaN(v)) || v === false || (Array.isArray(v) && !v.length)) delete o[k]; }); return o; };
  if (cat === 'phone' && isPhoneSub(sub)) {
    const imei = String(d.pimei || '').replace(/\D/g, '');
    return { dev: clean({ dtype: sub, brand: d.pbrand, model: (d.pmodel || '').trim(), storage: +d.pstorage || '', ram: +d.pram || '', cond: d.pcond, color: (d.pcolor || '').trim(), battery: +d.pbatt || '', dual: d.pdual, unlocked: d.punlock, incl: d.pincl || [], imei: imei.length === 15 }) };
  }
  return { mm: clean({ type: sub, acc: d.macc, brand: d.mbrand, model: (d.mmodel || '').trim(), size: d.msize, res: d.mres, smart: d.msmart, pads: d.mpads, games: +d.mgames || '', cpu: (d.mcpu || '').trim(), ram: d.mram, storage: d.mstorage, stype: d.mstype, screen: d.mscreen, compat: (d.mcompat || '').trim(), cond: d.mcond, incl: d.pincl || [] }) };
}

// Y a-t-il déjà des détails saisis ?
export function electronicsFilled(d) {
  return ['pbrand', 'pmodel', 'pstorage', 'pram', 'pcond', 'pcolor', 'pbatt', 'pdual', 'punlock', 'pimei', 'mbrand', 'mmodel', 'msize', 'mres', 'msmart', 'mpads', 'mgames', 'mcpu', 'mram', 'mstorage', 'mstype', 'mscreen', 'macc', 'mcompat', 'mcond'].some((k) => !!d[k]) || (d.pincl || []).length > 0;
}

// Erreurs : champs obligatoires et IMEI
export function electronicsErrors(cat, sub, d, ar) {
  const e = {};
  electronicFields(cat, sub).forEach((f) => {
    if (f.req && !String(d[f.k] ?? '').trim()) e[f.k] = ELEC_ERR[f.err][ar ? 1 : 0];
  });
  if (d.pimei && String(d.pimei).replace(/\D/g, '').length !== 15) e.pimei = ELEC_ERR.errImei[ar ? 1 : 0];
  return e;
}
