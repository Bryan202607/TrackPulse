# TrackPulse (PWA React + Firebase)

## Installation
1. `npm install`
2. Créer un projet Firebase, activer **Authentication (E-mail/Mot de passe)** et **Firestore**.
3. Copier `.env.example` en `.env` et remplir les clés Firebase.
4. Publier les règles : `firestore.rules` dans la console Firebase (Firestore > Règles).
5. Ajouter deux icônes `icon-192.png` et `icon-512.png` dans `public/`.
6. `npm run dev`

## Premier administrateur
Créer un compte dans l'appli, puis dans la console Firestore ouvrir `users/<uid>` et mettre `role` à `admin`.
L'admin voit tous les appareils et approuve les demandes de déconnexion ou de suppression.

## Règles de fonctionnement
- Chaque membre enregistre son appareil : nom, marque, utilisateur, couleur.
- Déconnexion ou suppression : le membre fait une demande, l'admin approuve ou refuse.
- Le suivi est suspendu le samedi et le dimanche (heure du Cameroun) : l'appareil n'envoie plus sa position et la carte n'affiche rien.

## Limites à connaître
- Précision : celle du GPS de l'appareil (quelques mètres), pas de quelques millimètres.
- PWA : la position n'est envoyée que si l'appli est ouverte. Pour un suivi en arrière-plan, il faudra une version native (React Native / Expo).
- La pause du week-end est appliquée côté appli. Une règle serveur pourra être ajoutée plus tard.
- Informer et obtenir le consentement des utilisateurs avant d'activer le suivi.

## Version 0.2 : refonte B2B
- Sans fichier `.env`, l'appli démarre en **mode démo** (flotte simulée, connexion libre).
- Les données viennent de `src/lib/simulator.js`. Brancher Firestore à cet endroit à l'étape suivante.
- `Devices.jsx`, `Tracker.jsx` et `firestore.rules` (enregistrement, approbations) sont conservés mais pas encore reliés à la nouvelle interface.

## Version 0.3
- **Géofencing** : zones circulaires sur la carte, alerte à l'entrée et à la sortie.
- **Alertes** : excès de vitesse (60 km/h) et batterie faible (20 %), avec anti-répétition.
- **Relecture d'itinéraire** : curseur sur le trajet récent d'un appareil.
- **Rapports** : km, temps de route et d'arrêt par appareil, export CSV.
- **Rôles et journal d'audit** : `admin` (zones, journal, approbations) ou `membre`. En démo, un e-mail contenant « admin » donne le rôle admin.
- **Mode réel** (avec `.env`) : positions Firestore, comptes, onglet Appareils avec approbations, règle serveur qui refuse les positions le week-end (à tester dans le simulateur de règles Firebase).
- Limites : zones, alertes et journal sont stockés dans le navigateur ; les rapports en mode réel (km, temps) demandent un historique côté serveur.

## Version 0.4 (mode réel)
- Zones, alertes et journal d'audit sont dans Firestore (collections `zones`, `alerts`, `audit`) : partagés entre utilisateurs, journal en ajout seul.
- Rapports : chaque appareil cumule distance, temps de route et d'arrêt dans `stats.<semaine>` (aucun cumul le week-end).
- Les règles `firestore.rules` doivent être republiées. Les requêtes triées sur `t` peuvent demander la création d'un index : Firebase affiche un lien dans la console du navigateur.
- Limite : les alertes ne sont créées que lorsqu'un écran est ouvert. Pour des alertes 24 h/24 (hors week-end), il faudra une Cloud Function.

## Version 0.5
### Alertes 24 h/24 (Cloud Function)
1. Passer le projet Firebase au forfait Blaze (obligatoire pour les Cloud Functions).
2. `cd functions && npm install && cd ..` puis `firebase deploy --only functions,firestore:rules`.
3. Mettre `VITE_SERVER_ALERTS=true` dans `.env` : l'écran n'écrit plus les alertes, la fonction s'en charge.
4. Attention au coût : la fonction s'exécute à chaque position envoyée. Espacer les envois (distanceFilter, intervalle) pour limiter la facture.

### Appli native Android / iOS (suivi en arrière-plan)
1. `npm install`, puis `npx cap add android` (et `npx cap add ios` sur Mac).
2. `npm run cap:sync`, puis `npx cap open android` (ou `ios`).
3. Suivre le README du plugin `@capacitor-community/background-geolocation` pour les permissions (Android : localisation en arrière-plan ; iOS : clés Info.plist et mode « Location updates »).
4. L'appli native envoie la position même écran éteint, mais jamais le week-end (arrêt côté appli, refus côté serveur).
- Les stores (Google Play, App Store) exigent une justification claire de l'usage de la localisation en arrière-plan et le consentement des utilisateurs.

## Version 0.6 et mise sur GitHub
- Sécurité : règles Firestore avec validation des champs et e-mail vérifié, en-têtes (CSP) dans `firebase.json`, protection XSS sur les noms de zones, protection contre l'injection de formules dans les CSV.
- Design : feuille basse déplaçable sur mobile (vitesse de relâchement, résistance élastique), verre dépoli, animations « matérialisées », respect de `prefers-reduced-motion`, `prefers-reduced-transparency` et `prefers-contrast`.
- Publier sur GitHub (créez d'abord un dépôt **privé** vide) :
  `git remote add origin https://github.com/<compte>/<depot>.git` puis `git push -u origin main`.
- Après le premier `npm install`, commitez `package-lock.json`. Activez sur GitHub : Dependabot alerts, Secret scanning, protection de la branche `main`.

## Version 0.6.1
- Firebase passé en 13.x (corrige les dépendances vulnérables signalées par `npm audit`).
- CI : l'audit bloquant ne porte que sur les dépendances de production ; l'audit complet reste informatif.
- Dépôt GitHub : ne pas envoyer de dossier `.git` ni `.config`. Envoyer les fichiers du projet, ou utiliser GitHub Desktop.

## Version 0.6.2
- Dependabot : plus de mises à jour majeures automatiques (une seule bascule de `react-dom` en 19 casse l'installation, car `react` et `react-leaflet` restent en 18). Les mises à jour mineures sont regroupées en une seule demande.
- Après un premier `npm install` sur votre ordinateur, commitez `package-lock.json`, puis remplacez `npm install` par `npm ci` dans `.github/workflows/ci.yml` pour des tests reproductibles.
- Les failles restantes de `npm audit` viennent de `@capacitor/cli` (outil de développement, via `tar`) : sans effet sur l'appli en production. La bascule vers Capacitor 7 se fera à part, car elle demande de changer toute la famille `@capacitor/*` ensemble.

## Version 0.6.3
- `npm audit` signalait 4 failles « high » dans la chaîne `firebase` → `@firebase/firestore` → `@grpc/grpc-js` : Firestore fige une ancienne version de `@grpc/grpc-js`, même dans firebase 13. Le champ `overrides` de `package.json` impose une version corrigée. Ce module ne sert que côté Node : l'appli (navigateur) n'est pas concernée.
- Ne PAS lancer `npm audit fix --force` : il rétrograderait Firebase en 9.14.0.
- Nettoyage du dépôt : supprimer `.config`, `logs`, `objects` et tout autre élément issu de l'ancien dossier `.git` (`refs`, `hooks`, `info`, `branches`, `HEAD`, `config`, `description`, `COMMIT_EDITMSG`, `index`).
