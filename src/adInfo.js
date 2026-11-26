// Informations affichées sur la carte d'annonce : sous-catégorie, deux faits clés, état
import { SUB_KEY, subsOf } from './subcategories';
import { KIND_L } from './kindArt';
import { L } from './details/vehicles';
import { LBL } from './details/electronics';

const pick = (pair, lang) => (lang === 'ar' ? pair[1] : pair[0]);

// Sous-catégorie lisible (ex. « Appartement · Location », « Conducteur : je propose des places »)
export function adSubInfo(ad, lang, t) {
  if (ad.cat === 'immo' && ad.estate?.kind && KIND_L[ad.estate.kind]) {
    const deal = ad.estate.deal ? t(ad.estate.deal === 'rent' ? 'rent' : 'sale') : '';
    return [pick(KIND_L[ad.estate.kind], lang), deal].filter(Boolean).join(' · ');
  }
  const id = ad.cat === 'covoit' ? ad.trip?.type : ad[SUB_KEY[ad.cat]];
  const x = subsOf(ad.cat).find((s) => s.id === id);
  return x ? x[lang] || x.fr : '';
}

// Deux faits clés selon la catégorie (année et km, surface et pièces, marque et mémoire)
export function adFacts(ad, lang) {
  const ar = lang === 'ar';
  const out = [];
  if (ad.car) {
    if (ad.car.year) out.push(String(ad.car.year));
    if (+ad.car.km > 0) out.push(Number(ad.car.km).toLocaleString('fr-FR').replace(/[  ]/g, ' ') + ' km');
  }
  if (ad.estate) {
    if (+ad.estate.surface > 0) out.push(ad.estate.surface + ' m²');
    if (ad.estate.rooms) out.push(ad.estate.rooms + (ar ? ' غرف' : ' pièces'));
  }
  const dev = ad.dev || ad.mm;
  if (dev) {
    if (dev.brand) out.push(dev.brand);
    if (dev.storage) out.push(dev.storage + (ar ? ' غيغا' : ' Go'));
  }
  return out.slice(0, 2);
}

// État du bien (neuf, occasion…) pour la pastille sur la photo ; vide si non renseigné
export function adCondLabel(ad, lang) {
  const c = ad.car?.cond;
  if (c && L.cond[c]) return pick(L.cond[c], lang);
  const p = ad.dev?.cond;
  if (p && LBL['pc_' + p]) return pick(LBL['pc_' + p], lang);
  return '';
}
