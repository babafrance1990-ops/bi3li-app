// Détails de catégorie au dépôt (véhicules, téléphones, électronique, immobilier, emploi, services, covoiturage) :
// un seul point d'entrée pour le formulaire
import { electronicAdObject, electronicFields, electronicsErrors, electronicsFilled } from './electronics';
import { l3AdObject, l3Errors, l3Fields, l3FromAd, l3Title } from './lot3';
import { hasVehDetails, vehicleAdObject, vehicleErrors, vehicleFields } from './vehicles';

export { l3FromAd };

// Champs à afficher pour la catégorie et le type choisis
export function detailFields(d) {
  if (d.cat === 'auto' && d.sub) return vehicleFields(d.sub);
  if ((d.cat === 'phone' || d.cat === 'multi') && d.sub) return electronicFields(d.cat, d.sub);
  return l3Fields(d);
}

// Catégories dont les détails sont obligatoires : leur bloc reste ouvert (pas de bouton « Ajouter »)
export const detailsOpenByDefault = (d) => ['immo', 'job', 'serv', 'covoit'].includes(d.cat);

// Des détails sont-ils déjà saisis ?
export const detailsFilled = (d) => (d.cat === 'auto' ? hasVehDetails(d) : electronicsFilled(d));

// Titre du bloc de détails
export function detailTitle(d, ar) {
  if (d.cat === 'auto') return ar ? 'تفاصيل المركبة' : 'Détails du véhicule';
  if (d.cat === 'phone' || d.cat === 'multi') return ar ? 'تفاصيل الجهاز' : 'Détails de l’appareil';
  return l3Title(d, ar);
}

// Erreurs des champs obligatoires
export function detailErrors(d, ar) {
  if (d.cat === 'auto' && d.sub) return vehicleErrors(d.sub, d, ar);
  if ((d.cat === 'phone' || d.cat === 'multi') && d.sub) return electronicsErrors(d.cat, d.sub, d, ar);
  return l3Errors(d, ar);
}

// Champs ajoutés à l'annonce
export function detailAdObject(d) {
  if (d.cat === 'auto' && d.sub) return vehicleAdObject(d.sub, d);
  if ((d.cat === 'phone' || d.cat === 'multi') && d.sub) return electronicAdObject(d.cat, d.sub, d);
  return l3AdObject(d);
}
