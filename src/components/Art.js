// Affiche le dessin d'une catégorie ou d'une sous-catégorie (mêmes dessins que sur le site)
import { SvgXml } from 'react-native-svg';
import { ART } from '../artwork';

export function CatArt({ cat, size = 56 }) {
  const inner = ART.cats[cat];
  if (!inner) return null;
  return <SvgXml xml={`<svg viewBox="0 0 64 64" width="${size}" height="${size}">${inner}</svg>`} width={size} height={size} />;
}

export function SubArt({ cat, sub, size = 56 }) {
  const inner = ART.subs[cat]?.[sub];
  if (!inner) return null;
  const bg = ART.bg[cat] || '#ECEEEC';
  return <SvgXml xml={`<svg viewBox="0 0 64 64" width="${size}" height="${size}"><rect width="64" height="64" fill="${bg}"/>${inner}</svg>`} width={size} height={size} />;
}
