// Détails de catégorie au dépôt (véhicules, téléphones, électronique, immobilier, emploi, services, covoiturage) :
// un seul point d'entrée pour le formulaire
import { electronicAdObject, electronicFields, electronicsErrors, electronicsFilled } from './electronics';
import { l3AdObject, l3Fields, l3FromAd, l3Title } from './lot3';
import { l4AdObject, l4Fields, l4FromAd } from './lot4';
import { l5AdObject, l5Fields, l5FromAd } from './lot5';
import { l6AdObject, l6Fields, l6FromAd } from './lot6';

// Modules de détails : le premier qui a des champs pour la catégorie l'emporte
const MODULES_FIELDS = [l3Fields, l4Fields, l5Fields, l6Fields];
import { L3 } from './labels3';
import { hasVehDetails, vehicleAdObject, vehicleErrors, vehicleFields } from './vehicles';

export { l3FromAd, l4FromAd, l5FromAd, l6FromAd };

// Champs à afficher pour la catégorie et le type choisis
export function detailFields(d) {
  if (d.cat === 'auto' && d.sub) return vehicleFields(d.sub);
  if ((d.cat === 'phone' || d.cat === 'multi') && d.sub) return electronicFields(d.cat, d.sub);
  return MODULES_FIELDS.reduce((acc, fn) => (acc.length ? acc : fn(d)), []);
}

// Catégories dont les détails sont obligatoires : leur bloc reste ouvert (pas de bouton « Ajouter »)
export const detailsOpenByDefault = (d) => ['immo', 'job', 'serv', 'covoit', 'mode', 'beaute', 'maison', 'menager', 'fam', 'alim'].includes(d.cat);

// Des détails sont-ils déjà saisis ?
export const detailsFilled = (d) => (d.cat === 'auto' ? hasVehDetails(d) : electronicsFilled(d));

// Titre du bloc de détails
export function detailTitle(d, ar) {
  if (d.cat === 'auto') return ar ? 'تفاصيل المركبة' : 'Détails du véhicule';
  if (d.cat === 'phone' || d.cat === 'multi') return ar ? 'تفاصيل الجهاز' : 'Détails de l’appareil';
  if (['mode', 'beaute', 'maison', 'menager', 'fam', 'alim', 'equip'].includes(d.cat)) return ar ? L3.homeInfo[1] : L3.homeInfo[0];
  return l3Title(d, ar);
}

// Erreurs de saisie : les détails sont facultatifs, seules les valeurs saisies sont vérifiées
export function detailErrors(d, ar) {
  if (d.cat === 'auto' && d.sub) return vehicleErrors(d.sub, d, ar);
  if ((d.cat === 'phone' || d.cat === 'multi') && d.sub) return electronicsErrors(d.cat, d.sub, d, ar);
  return {};
}

// Champs ajoutés à l'annonce
export function detailAdObject(d) {
  if (d.cat === 'auto' && d.sub) return vehicleAdObject(d.sub, d);
  if ((d.cat === 'phone' || d.cat === 'multi') && d.sub) return electronicAdObject(d.cat, d.sub, d);
  return { ...l3AdObject(d), ...l4AdObject(d), ...l5AdObject(d), ...l6AdObject(d) };
}
