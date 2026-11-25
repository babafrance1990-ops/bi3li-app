// Détails des véhicules au dépôt, comme sur le site.
// Voiture → champs « car » de l'annonce ; autres types → champs « veh ». Noms des champs identiques au site.

export const CAR_BRANDS = ['Toyota', 'Hyundai', 'Mercedes', 'Nissan', 'Kia', 'Peugeot', 'Renault', 'Mitsubishi', 'Ford', 'Suzuki', 'Land Rover', 'Volkswagen', 'Honda', 'Isuzu', 'Autre'];
export const VBRANDS = {
  bus: ['Toyota', 'Mercedes', 'Hyundai', 'Nissan', 'Isuzu', 'Mitsubishi', 'Autre'],
  truck: ['Mercedes', 'Renault', 'Volvo', 'MAN', 'Scania', 'DAF', 'Iveco', 'Isuzu', 'Mitsubishi', 'Autre'],
  moto: ['Yamaha', 'Honda', 'Suzuki', 'TVS', 'Bajaj', 'Haojue', 'KTM', 'Autre'],
};

// Libellés (fr / ar) des valeurs de liste, comme sur le site
const L = {
  vtype: { berline: ['Berline', 'سيدان'], suv: ['4x4 / SUV', 'دفع رباعي'], pickup: ['Pick-up', 'بيك أب'], citadine: ['Citadine', 'سيارة صغيرة'], utilitaire: ['Utilitaire', 'سيارة نفعية'], monospace: ['Monospace', 'ميني فان'] },
  color: { blanc: ['Blanc', 'أبيض'], noir: ['Noir', 'أسود'], gris: ['Gris', 'رمادي'], argent: ['Argent', 'فضي'], bleu: ['Bleu', 'أزرق'], rouge: ['Rouge', 'أحمر'], vert: ['Vert', 'أخضر'], beige: ['Beige', 'بيج'], marron: ['Marron', 'بني'], autre: ['Autre', 'آخر'] },
  cond: { new: ['Neuf', 'جديدة'], vgood: ['Très bon', 'ممتازة'], good: ['Bon', 'جيدة'], fair: ['Correct', 'مقبولة'], repair: ['À réparer', 'تحتاج إصلاح'] },
  fuel: { petrol: ['Essence', 'بنزين'], diesel: ['Diesel', 'ديزل'] },
  gear: { manual: ['Manuelle', 'يدوي'], automatic: ['Automatique', 'أوتوماتيك'] },
  m2: { moto: ['Moto', 'دراجة نارية'], scooter: ['Scooter', 'سكوتر'], tricycle: ['Tricycle (triporteur)', 'دراجة ثلاثية (تريبورتور)'] },
  bt: { adult: ['Vélo adulte', 'دراجة للكبار'], child: ['Vélo enfant', 'دراجة للأطفال'], vtt: ['VTT', 'دراجة جبلية'], electric: ['Vélo électrique', 'دراجة كهربائية'] },
  part: { engine: ['Pièces moteur', 'قطع المحرك'], tires: ['Pneus et jantes', 'إطارات وجنوط'], battery: ['Batterie', 'بطارية'], body: ['Carrosserie', 'هيكل'], lights: ['Phares et éclairage', 'أضواء'], interior: ['Intérieur et sièges', 'داخلية ومقاعد'], audio: ['Autoradio et électronique', 'راديو وإلكترونيات'], oil: ['Huiles et filtres', 'زيوت وفلاتر'], tools: ['Outillage', 'عدة وأدوات'], other_p: ['Autre', 'أخرى'] },
  svc: { mech: ['Mécanique générale', 'ميكانيك عام'], oil: ['Vidange et entretien', 'تغيير الزيت والصيانة'], body: ['Carrosserie et peinture', 'سمكرة وطلاء'], elec: ['Électricité auto', 'كهرباء السيارات'], ac: ['Climatisation auto', 'مكيف السيارات'], tires: ['Pneus et vulcanisation', 'إطارات وفلكنة'], tow: ['Dépannage et remorquage', 'إنقاذ وسحب'], wash: ['Lavage', 'غسيل'], diag: ['Diagnostic électronique', 'تشخيص إلكتروني'] },
  tt: { benne: ['Benne', 'قلابة'], plateau: ['Plateau', 'مسطحة'], citerne: ['Citerne', 'صهريج'], frigo: ['Frigorifique', 'مبردة'], tracteur: ['Tracteur routier', 'رأس قاطرة'], autre_t: ['Autre', 'أخرى'] },
};
const LABEL = {
  brand: ['Marque', 'الماركة'], model: ['Modèle', 'الموديل'], vtype: ['Type de véhicule', 'نوع السيارة'], color: ['Couleur', 'اللون'],
  seats: ['Nombre de places', 'عدد المقاعد'], doors: ['Nombre de portes', 'عدد الأبواب'], year: ['Année', 'السنة'],
  km: ['Kilométrage (km)', 'عدد الكيلومترات'], fuel: ['Carburant', 'الوقود'], gear: ['Boîte de vitesses', 'ناقل الحركة'],
  cond: ['État général', 'الحالة العامة'], mtype: ['Type de deux-roues', 'نوع الدراجة'], cc: ['Cylindrée', 'سعة المحرك'],
  btype: ['Type de vélo', 'نوع الدراجة'], part: ['Pièce ou équipement', 'القطعة أو المعدات'], compat: ['Compatible avec', 'متوافق مع'],
  service: ['Type de service', 'نوع الخدمة'], ttype: ['Type de camion', 'نوع الشاحنة'], load: ['Charge utile (tonnes)', 'الحمولة (طن)'],
  hours: ['Horaires', 'أوقات العمل'], driver: ['Avec chauffeur', 'مع سائق'], home: ['Se déplace à domicile', 'يتنقل إلى المنزل'],
  vmodel: ['Modèle', 'الموديل'],
};
const ch = (map) => Object.entries(map).map(([v, [fr, ar]]) => ({ v, fr, ar }));
const plain = (list) => list.map((x) => ({ v: x, fr: x, ar: x === 'Autre' ? 'أخرى' : x }));
const SEATS = ['2', '4', '5', '7', '8', '9+'];

// Messages si un champ obligatoire manque : [fr, ar]
export const VEH_ERR = {
  errBrand: ['Choisissez la marque.', 'اختر الماركة.'], errYear: ['Indiquez une année entre 1980 et 2027.', 'اكتب سنة بين 1980 و2027.'],
  errFuel: ['Choisissez le carburant.', 'اختر نوع الوقود.'], errGear: ['Choisissez la boîte de vitesses.', 'اختر ناقل الحركة.'],
  errCond: ['Choisissez l’état.', 'اختر الحالة.'], errVsel: ['Choisissez une option.', 'اختر خياراً.'], errVkind: ['Choisissez ce que vous proposez.', 'اختر ما تعرضه.'],
};

// Vérifie les champs obligatoires : renvoie { champ: message }
export function vehicleErrors(kind, d, ar) {
  const e = {};
  vehicleFields(kind).forEach((f) => {
    if (f.req && !String(d[f.k] ?? '').trim()) e[f.k] = (ar ? VEH_ERR[f.err][1] : VEH_ERR[f.err][0]);
  });
  const y = +d.year || +d.vyear;
  if (kind === 'car' && d.year && (y < 1980 || y > 2027)) e.year = VEH_ERR.errYear[ar ? 1 : 0];
  if (kind !== 'car' && d.vyear && (+d.vyear < 1980 || +d.vyear > 2027)) e.vyear = VEH_ERR.errYear[ar ? 1 : 0];
  return e;
}

// Y a-t-il déjà des détails saisis ?
export function hasVehDetails(d) {
  return ['brand', 'model', 'vtype', 'color', 'seats', 'doors', 'year', 'km', 'fuel', 'gear', 'cond', 'vbrand', 'vmodel', 'vmtype', 'vcc', 'vyear', 'vkm', 'vfuel', 'vseats', 'vttype', 'vload', 'vbtype', 'vpart', 'vcompat', 'vservice', 'vhours', 'vcond'].some((k) => !!d[k]) || !!d.vhome || !!d.vdriver;
}

// Champs par type de véhicule : k = nom du champ dans l'annonce (et dans le brouillon), type : chips | text | num | check
export function vehicleFields(kind) {
  if (kind === 'car') return [
    { k: 'brand', label: LABEL.brand, type: 'chips', opts: plain(CAR_BRANDS), req: true, err: 'errBrand' },
    { k: 'model', label: LABEL.model, type: 'text' },
    { k: 'vtype', label: LABEL.vtype, type: 'chips', opts: ch(L.vtype) },
    { k: 'color', label: LABEL.color, type: 'chips', opts: ch(L.color) },
    { k: 'seats', label: LABEL.seats, type: 'chips', opts: plain(SEATS) },
    { k: 'doors', label: LABEL.doors, type: 'chips', opts: plain(['2', '3', '4', '5']) },
    { k: 'year', label: LABEL.year, type: 'num', len: 4, req: true, err: 'errYear' },
    { k: 'km', label: LABEL.km, type: 'num' },
    { k: 'fuel', label: LABEL.fuel, type: 'chips', opts: ch(L.fuel), req: true, err: 'errFuel' },
    { k: 'gear', label: LABEL.gear, type: 'chips', opts: ch(L.gear), req: true, err: 'errGear' },
    { k: 'cond', label: LABEL.cond, type: 'chips', opts: ch(L.cond), req: true, err: 'errCond' },
  ];
  const cond = { k: 'vcond', label: LABEL.cond, type: 'chips', opts: ch(L.cond), req: true, err: 'errCond' };
  if (kind === 'rental') return [
    { k: 'vmodel', label: LABEL.model, type: 'text' },
    { k: 'vdriver', label: LABEL.driver, type: 'check' },
  ];
  if (kind === 'bus') return [
    { k: 'vbrand', label: LABEL.brand, type: 'chips', opts: plain(VBRANDS.bus), req: true, err: 'errBrand' },
    { k: 'vmodel', label: LABEL.model, type: 'text' },
    { k: 'vyear', label: LABEL.year, type: 'num', len: 4, req: true, err: 'errYear' },
    { k: 'vkm', label: LABEL.km, type: 'num' },
    { k: 'vfuel', label: LABEL.fuel, type: 'chips', opts: ch(L.fuel) },
    { k: 'vseats', label: LABEL.seats, type: 'chips', opts: plain(['15', '18', '22', '26', '30', '35', '50']) },
    cond,
  ];
  if (kind === 'truck') return [
    { k: 'vbrand', label: LABEL.brand, type: 'chips', opts: plain(VBRANDS.truck), req: true, err: 'errBrand' },
    { k: 'vmodel', label: LABEL.model, type: 'text' },
    { k: 'vyear', label: LABEL.year, type: 'num', len: 4, req: true, err: 'errYear' },
    { k: 'vkm', label: LABEL.km, type: 'num' },
    { k: 'vfuel', label: LABEL.fuel, type: 'chips', opts: ch(L.fuel) },
    { k: 'vttype', label: LABEL.ttype, type: 'chips', opts: ch(L.tt) },
    { k: 'vload', label: LABEL.load, type: 'text', numeric: true },
    cond,
  ];
  if (kind === 'moto') return [
    { k: 'vmtype', label: LABEL.mtype, type: 'chips', opts: ch(L.m2), req: true, err: 'errVsel' },
    { k: 'vbrand', label: LABEL.brand, type: 'chips', opts: plain(VBRANDS.moto), req: true, err: 'errBrand' },
    { k: 'vmodel', label: LABEL.model, type: 'text' },
    { k: 'vcc', label: LABEL.cc, type: 'chips', opts: plain(['50', '110', '125', '150', '200', '250']) },
    { k: 'vyear', label: LABEL.year, type: 'num', len: 4 },
    { k: 'vkm', label: LABEL.km, type: 'num' },
    cond,
  ];
  if (kind === 'bike') return [
    { k: 'vbtype', label: LABEL.btype, type: 'chips', opts: ch(L.bt), req: true, err: 'errVsel' },
    cond,
  ];
  if (kind === 'parts') return [
    { k: 'vpart', label: LABEL.part, type: 'chips', opts: ch(L.part), req: true, err: 'errVsel' },
    { k: 'vcompat', label: LABEL.compat, type: 'text' },
    cond,
  ];
  if (kind === 'service') return [
    { k: 'vservice', label: LABEL.service, type: 'chips', opts: ch(L.svc), req: true, err: 'errVsel' },
    { k: 'vhours', label: LABEL.hours, type: 'text' },
    { k: 'vhome', label: LABEL.home, type: 'check' },
  ];
  return [];
}

// Champs du véhicule à enregistrer dans l'annonce (site : car pour la voiture, veh pour le reste)
export function vehicleAdObject(kind, d) {
  if (kind === 'car') return { car: { brand: d.brand, model: d.model.trim(), vtype: d.vtype, color: d.color, seats: d.seats, doors: d.doors, year: d.year, km: d.km, fuel: d.fuel, gear: d.gear, cond: d.cond } };
  const v = { kind,
    brand: d.vbrand, model: (d.vmodel || '').trim(), mtype: d.vmtype, cc: d.vcc, year: d.vyear, km: d.vkm, fuel: d.vfuel,
    seats: d.vseats, ttype: d.vttype, load: d.vload, btype: d.vbtype, part: d.vpart, compat: (d.vcompat || '').trim(),
    service: d.vservice, hours: (d.vhours || '').trim(), home: !!d.vhome, driver: !!d.vdriver, cond: d.vcond };
  // Champs vides retirés, comme sur le site
  Object.keys(v).forEach((k) => { if (v[k] === '' || v[k] === undefined || v[k] === null || v[k] === false) delete v[k]; });
  return { veh: v };
}
