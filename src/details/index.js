// Détails de catégorie au dépôt (véhicules, téléphones, électronique) : un seul point d'entrée pour le formulaire
import { electronicAdObject, electronicFields, electronicsErrors, electronicsFilled } from './electronics';
import { hasVehDetails, vehicleAdObject, vehicleErrors, vehicleFields } from './vehicles';

// Champs à afficher pour la catégorie et le type choisis
export function detailFields(d) {
  if (d.cat === 'auto' && d.sub) return vehicleFields(d.sub);
  if ((d.cat === 'phone' || d.cat === 'multi') && d.sub) return electronicFields(d.cat, d.sub);
  return [];
}

// Des détails sont-ils déjà saisis ?
export const detailsFilled = (d) => (d.cat === 'auto' ? hasVehDetails(d) : electronicsFilled(d));

// Erreurs des champs obligatoires
export function detailErrors(d, ar) {
  if (d.cat === 'auto' && d.sub) return vehicleErrors(d.sub, d, ar);
  if ((d.cat === 'phone' || d.cat === 'multi') && d.sub) return electronicsErrors(d.cat, d.sub, d, ar);
  return {};
}

// Champs ajoutés à l'annonce
export function detailAdObject(d) {
  if (d.cat === 'auto' && d.sub) return vehicleAdObject(d.sub, d);
  if ((d.cat === 'phone' || d.cat === 'multi') && d.sub) return electronicAdObject(d.cat, d.sub, d);
  return {};
}
