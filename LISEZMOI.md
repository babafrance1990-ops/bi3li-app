# Bi3li — application mobile (React Native + Expo)

Même serveur que le site : toutes les données viennent de https://bi3li.net/api.

## Ce qui est fait (version 0.1)
- Accueil : catégories qui défilent, annonces 2 par ligne, chargement par pages de 40, « tirer pour actualiser »
- Fiche annonce : galerie photos, prix (anciennes / nouvelles ouguiyas), ville et quartier, description, vendeur (vérifié, note), boutons WhatsApp / Appeler
- Connexion / création de compte : numéro à 8 chiffres + code à 4 chiffres, mêmes messages d'erreur que le site, « Code oublié » → WhatsApp du support
- Mon compte : informations, arabe / français, déconnexion
- **Déposer (v0.2)** : 3 étapes comme le site — 1) catégorie (+ vente/location et type de bien pour l'immobilier, marque/modèle/année/km pour les véhicules) ; 2) photos (galerie ou appareil photo, 6 max, allégées puis envoyées dès l'ajout, toucher une photo = la mettre en principale), titre facultatif (automatique sinon), description ; 3) prix (nouvelle / ancienne ouguiya avec conversion), à discuter, ville (liste par wilaya), moughataa pour Nouakchott, repère, livraison, WhatsApp / appels, aperçu, Publier. Brouillon gardé sur le téléphone ; ville, quartier et contacts repris pour l'annonce suivante. Écran final « Partager sur WhatsApp ».
- **Recherche (v0.3)** : mots en français ou en arabe avec équivalents (frigo ↔ ثلاجة, hilux ↔ هيلكس, voiture ↔ سيارة…, listes reprises du site), catégories, bouton « تدقيق / Affiner » : ville (liste par wilaya), moughataa ou wilaya de Nouakchott, prix min/max, date, particuliers/commerçants, avec photo, prix à discuter, livraison, vente/location + type de bien (immobilier), marque + année minimum (véhicules, l'année est aussi lue dans le titre), tri par date ou prix. Recherches récentes gardées sur le téléphone.
- **Messagerie (v0.4)** : liste des conversations (non lus en vert, pastille rouge sur l'onglet), discussion avec rappel de l'annonce, phrases rapides (acheteur : disponible ? dernier prix ? où ? — vendeur : réponses toutes prêtes avec le prix et le lieu), envoi de photo, « ✓✓ lu », messages non envoyés à retoucher pour réessayer, rafraîchissement toutes les 4 s. Bouton « Message » de la fiche annonce branché.
- **Mes annonces (v0.5)** : depuis « Mon compte » (ou la fiche de sa propre annonce) — onglets En ligne / Vendues, vues et contacts de chaque annonce, Modifier (même formulaire en 3 étapes, déjà rempli ; on garde vidéo, message vocal et détails saisis sur le site), Vendu, Remonter (1 fois tous les 7 jours), Partager sur WhatsApp, Supprimer (avec confirmation).
- **Alertes (v0.6)** : bouton « 🔔 نبّهني بالإعلانات الجديدة » dans la recherche ; écran « Mes alertes » (depuis Mon compte) avec le nombre de nouvelles annonces par alerte, cloche marche/arrêt, suppression ; toucher une alerte = voir ses annonces. Pastille verte sur « Mon compte ». Même format que le site (recherches enregistrées dans le compte) : les alertes du site apparaissent dans l'appli et inversement.
- **Favoris ♥ (v0.7)** : cœur sur chaque annonce (liste et fiche), écran « Mes favoris » dans Mon compte ; même liste que sur le site.
- **Notifications (v0.7)** : nouveau message et nouvelle annonce correspondant à une alerte, même appli fermée ; toucher la notification ouvre la discussion ou l'annonce. Le serveur bi3li.net les envoie (route /api/push, en ligne depuis le 23/11/2026).
  ⚠️ Une fois pour toutes, dans ce dossier : `npx eas-cli@latest init` (avec le compte Expo) — cela ajoute l'identifiant du projet Expo dans app.json, indispensable pour les notifications.
- **v0.8** : page vendeur / boutique (toucher le vendeur dans une fiche : note, abonnés, « répond vite », adresse et horaires de la boutique, Suivre, WhatsApp de la boutique, laisser un avis après un échange, toutes ses annonces, avis) ; photo en plein écran (toucher la photo, zoom à deux doigts sur iPhone) ; « Signaler cette annonce » (raisons au choix) ; « Modifier mon profil » (photo, nom, ville) et « Ma page vendeur » dans Mon compte.
- **v0.9 — Vérification du numéro par WhatsApp** : écran « توثيق رقمي » (bandeau jaune « رقمك غير موثّق » dans l'accueil et Mon compte, ouvert aussi après la création du compte et depuis le message « 3 annonces maximum ») : WhatsApp s'ouvre avec « تأكيد بيعلي، الرمز … », l'utilisateur l'envoie, l'appli détecte la confirmation (toutes les 3 s et au retour dans l'appli). « Code oublié » automatique : WhatsApp → connexion → nouveau code secret. Même méthode que le site.
- **v1.0 — Ma boutique** : « Mon compte » → « 🏪 Ouvrir ma boutique (gratuit) » / « Ma boutique » : logo (photo du compte), nom, marché, présentation, adresse, horaires, WhatsApp de la boutique, livraison, agence immobilière ; badge « vérifiée » ou « en attente » ; avertissement si un changement de nom retire le badge ; écran « متجرك على الإنترنت الآن! » avec partage WhatsApp et « Voir ma boutique » ; fermer la boutique. Mêmes champs et textes que le site.
- Prix masqué (« راسل البائع لمعرفة السعر ») et « à discuter » coché par défaut, comme sur le site.

## Lancer l'application (sur un PC avec Node.js)
```
npm install
# versions déjà alignées sur Expo SDK 58
npx expo start
```
Puis scanner le QR code avec l'appli **Expo Go** (iPhone ou Android).

## Fichiers
- `app/` : les écrans (expo-router) — `(tabs)/` = onglets du bas, `annonce/[id].js`, `connexion.js`, `conversation/[id].js`, `mes-annonces.js`, `modifier/[id].js`
- `src/components/AdForm.js` : formulaire d'annonce en 3 étapes (dépôt et modification)
- `src/api.js` : toutes les routes du serveur au même endroit
- `src/categories.js` : mêmes identifiants que le site (`auto`, `immo`, `phone`…)
- `app.json` : nom « بيعلي – Bi3li », identifiant `net.bi3li.app` (Android et iPhone)
