// Passe le choix de catégorie de la page « Choisir la catégorie » au formulaire d'annonce, qui l'attend au retour.
let back = null;
export function setCatCallback(fn) { back = fn; }
export function takeCatCallback() { const f = back; back = null; return f; }
