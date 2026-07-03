# Planification technique - TrendSnap

## 1. Vision globale du système

### Objectif
TrendSnap est une plateforme légère de suivi des tendances culturelles (films, séries, animés, mangas, jeux vidéo, livres, musique, etc.). Elle collecte chaque jour des tops depuis plusieurs sources externes, stocke uniquement l'état du jour dans MongoDB Atlas et affiche des classements esthétiques. Les favoris sont entièrement locaux (stockés dans `localStorage`). Il n'y aura pas de système d'utilisateurs ni d'historique des jours passés.

### Principes clés
- Architecture minimale et maintenable par un développeur solo.
- Priorité à un MVP simple et robuste plutôt qu'à l'optimisation prématurée.
- Respect du Clean Code et principes SOLID quand pertinent.
- Extensible pour ajouter de nouvelles catégories/sources.
- Hébergement gratuit au démarrage (Vercel + Render + MongoDB Atlas free tier).
- Images scrappées hébergées sur le backend (dossier `uploads/images/`).
- Tâches automatisées via cron jobs.
- Aucun système d'authentification ni de gestion d'utilisateurs (contraintes permanentes).

### Architecture générale

- Front-end : React + Vite + Tailwind CSS
- Back-end : Node.js + Express (API REST publique pour lectures)
- Base de données : MongoDB Atlas (stocke l'état du jour)
- Scraping : scripts Node.js basés sur Puppeteer
- Déploiement : Front-end sur Vercel, Back-end sur Render, DB sur MongoDB Atlas

### Flux des données

1. Un cron (Render cron job ou service externe) lance les scrapers chaque jour.
2. Les scrapers normalisent les tops, téléchargent et uploadent les images sur le backend, puis mettent à jour les collections MongoDB pour représenter l'état du jour.
3. Le backend expose une API publique pour récupérer les tops et les fiches d'œuvres.
4. Le front-end consomme l'API via TanStack Query et gère les favoris localement (`localStorage`).

### Schéma d'interactions

- Front-end -> API REST : lecture des tops et détails d'œuvres.
- Back-end -> MongoDB Atlas : lecture/écriture de l'état du jour.
- Cron / Scrapers -> Back-end ou DB : ingestion quotidienne des tops.
- Scrapers -> Sources externes : récupération HTML, métadonnées et images.

---

## 2. MVP

### Fonctionnalités de la V1

- Collecte quotidienne de tops depuis un ensemble restreint de sources fiables.
- Stockage uniquement de l'état du jour (aucun historique conservé).
- Page d'accueil affichant un Top 10 esthétique pour chaque catégorie principale : `films`, `séries`, `musiques`, `mangas`, `jeux vidéo`, `livres`.
- Fiche détaillée pour chaque œuvre (métadonnées, image, sources qui l'ont listée aujourd'hui).
- Favoris gérés côté client via `localStorage` (pas de compte utilisateur).
- Interface responsive, moderne, construite avec Tailwind CSS et comportant un switcher `dark/light`.
- Images scrappées hébergées sur le backend.
- Cron job d'ingestion quotidien automatisé.

### Ce qui ne fera PAS partie de la V1

- Historique multi-jours (aucun enregistrement des jours passés).
- Système d'authentification ou gestion d'utilisateurs (pas maintenant, pas plus tard).
- Recherche dédiée (pas de `SearchPage`).
- Recommandations personnalisées.
- Dashboard admin complet.

---

## 3. Structure du projet

### Proposition d’arborescence

```text
TrendSnap/
  frontend/
    public/
    src/
      assets/
      components/
      hooks/
      pages/
        HomePage.tsx
        WorkDetailPage.tsx
        FavoritesPage.tsx
        NotFoundPage.tsx
      services/
      styles/
      App.tsx
      main.tsx
    package.json
    tsconfig.json
    tailwind.config.js
    postcss.config.js
  backend/
    src/
      controllers/
      routes/
      services/
      models/
      repositories/
      utils/
      jobs/
      app.ts
      server.ts
    uploads/
      images/
    package.json
    tsconfig.json
    .env.example
  scrapers/
    sources/
      sourceA.ts
      sourceB.ts
    utils/
      browser.ts
      parser.ts
      downloader.ts
      errorHandler.ts
    jobs/
      dailyScrape.ts
    package.json
    tsconfig.json
  docs/
    planning-technique-trendsnap.md
  README.md
```

---

## 4. Base de données

> Règle clé : la BDD contient uniquement l'état du jour. Chaque exécution quotidienne remplace/écrase l'état précédent pour limiter la taille et la complexité.

### Collections principales

#### Works
- Description : entité principale représentant une œuvre (film, série, album, jeu, livre, manga...).
- Champs :
  - `_id` : ObjectId
  - `title` : string
  - `type` : string (`film`, `serie`, `musique`, `manga`, `jeu`, `livre`, ...)
  - `description` : string | null
  - `year` : number | null
  - `genres` : string[]
  - `imageUrl` : string (URL interne vers l'image servie par le backend)
  - `externalIds` : object (ex. `{ imdb?: string, mal?: string, slug?: string }`)
  - `sourceReferences` : [{ sourceId: ObjectId, externalId: string, fetchedAt: Date }]
  - `createdAt` : Date
  - `updatedAt` : Date
- Index recommandés :
  - `title` (text) pour recherche basique côté front si besoin
  - `type`
  - `externalIds.imdb` / `externalIds.slug`

#### Trends
- Description : représentation de l'état du jour (top lists). Stocke, pour chaque œuvre listée aujourd'hui, son rang et éventuel score.
- Champs :
  - `_id` : ObjectId
  - `workId` : ObjectId (référence vers `Works`)
  - `sourceId` : ObjectId
  - `category` : string (`film`, `serie`, `musique`, ...)
  - `rank` : number
  - `score` : number | null
  - `date` : Date (jour de la collecte — utile pour audits, égal à aujourd'hui)
  - `rawData` : object | null
  - `createdAt` : Date
- Index recommandés :
  - `date`
  - `category, rank`
  - `sourceId, category`

#### Sources
- Description : configuration et métadonnées des sources scrappées.
- Champs :
  - `_id` : ObjectId
  - `name` : string
  - `slug` : string
  - `category` : string
  - `url` : string
  - `type` : string (`scraper`, `api`, `rss`)
  - `meta` : object (sélecteurs, notes)
  - `isActive` : boolean
  - `lastScrapedAt` : Date
  - `createdAt` : Date
  - `updatedAt` : Date
- Index recommandés :
  - `slug`
  - `category`
  - `isActive`

> Notes :
- Il n'y a pas de collection `Favorites` ni de `Users` — tous deux supprimés de la conception puisque les favoris sont locaux et qu'il n'y aura pas d'auth.

---

## 5. API REST

### Principes
- API publique (lecture) pour récupérer les tops et les fiches d'œuvres.
- Pas de routes pour gérer des utilisateurs ou des favoris côté serveur.
- Pagination et filtres simples pour limiter la charge.

### Routes principales

#### GET /api/trends
- Description : renvoie les tops du jour.
- Query params : `category` (string) optional — si absent, renvoie tops pour toutes les catégories principales.
- Comportement : retourne les top 10 par catégorie (ou par `category` demandée), avec possibilité de filtrer par `source`.
- Réponse :
  - `data` : { [category: string]: [{ rank, work: Work, sourceId, score }] }

#### GET /api/works/:workId
- Description : détail d'une œuvre (métadonnées + participation aux tops du jour).
- Réponse :
  - `data` : { work, todayTrend?: { rank, score, sourceId } }

#### GET /api/sources
- Description : liste des sources actives.
- Réponse :
  - `data` : [{ source }]

#### POST /api/scrape/run (privé, accès restreint via clé si souhaité)
- Description : permet de déclencher manuellement une ingestion pour une source ou pour toutes.
- Body : `{ sourceSlug?: string }`
- Réponse : `{ data: { status, details } }`

### Format d'erreur
- `{ status: 'error', message: string, code?: string, details?: object }`

---

## 6. Scraping

### Ajouter une nouvelle source

1. Créer un module dans `scrapers/sources/` qui exporte une fonction `scrape()` renvoyant une liste normalisée `{ title, externalId?, rank, score?, imageUrl?, rawData? }`.
2. Ajouter la configuration dans la collection `Sources` (sélecteurs, fréquence, notes).
3. Tester localement le parser avec HTML d'exemple.
4. Activer la source dans le job `dailyScrape.ts`.

### Gestion des erreurs

- Erreurs isolées : journaliser (fichier + collection de logs si souhaité) et continuer le traitement des autres sources.
- Erreurs critiques (ex: blocage IP massif) : envoyer un code d'erreur dans la sortie du job et marquer la source `isActive=false` si nécessaire.
- Retry simple avec backoff (3 tentatives) pour erreurs réseau temporaires.

### Changement de structure HTML

- Externaliser les sélecteurs et mappings dans la configuration de la source.
- Fournir des fixtures HTML et tests unitaires pour détecter les régressions.
- En cas d'échec de parsing, sauvegarder `rawHtml` et `rawData` pour analyse et marquer la source pour revue.

### Éviter les doublons

- Normaliser chaque œuvre par `externalId` (si disponible) ou par `title + year`.
- Rechercher un `Work` existant avant création.
- Dans `Trends`, remplacer ou upsert les documents pour la même `workId, sourceId, date` afin d'éviter les doublons.

---

## 7. Front-end

### Pages

- `HomePage` : affiche les Top 10 esthétiques du jour pour chaque catégorie (mise en avant visuelle, carrousels/grilles).
- `WorkDetailPage` : fiche détaillée d'une œuvre (métadonnées, image, sources qui l'ont listée aujourd'hui).
- `FavoritesPage` : favori local — liste construite depuis `localStorage`.
- `NotFoundPage` : 404.

### Composants clés

- `TopGrid` / `TopCarousel` : affichage visuel des Top 10 par catégorie.
- `WorkCard` : aperçu d'une œuvre (image, titre, rank aujourd'hui, bouton favori).
- `FavoriteButton` : toggle favori (stocke/supprime dans `localStorage`).
- `Header` : inclut le switcher `DarkModeSwitcher` (dark/light) et navigation minimaliste.
- `Footer` : crédits / liens.
- `Image` : wrapper pour lazy-loading et fallback d'image.

### Hooks React

- `useTrends(category?)` : récupère les tops du jour via TanStack Query.
- `useWorkDetail(workId)` : récupère la fiche d'une œuvre.
- `useFavorites()` : abstraction `localStorage` (get/set/toggle) — aucune interaction serveur.
- `useDarkMode()` : gère le thème (persisté en `localStorage`).
- `useSources()` : liste des sources actives.

### Gestion des appels API

- Utiliser TanStack Query pour la lecture (cache, revalidation, erreurs).
- Centraliser les appels HTTP dans `services/api.ts`.
- Variables d'environnement : `VITE_API_BASE_URL`.

### UI / UX

- Tailwind CSS pour la rapidité de développement et le style moderne.
- Dark/light switcher, accessible et persistant.
- Page d'accueil orientée visuel : images larges, overlays pour rank/score, micro-interactions CSS.

---

## 8. Historique des tendances

- Contrainte : aucun historique des jours passés n'est conservé. La collection `Trends` représente uniquement l'état du jour et est réécrite chaque exécution. Par conséquent, il n'y a pas de fonctionnalité de visualisation d'évolution dans la V1.

---

## 9. Déploiement

### MongoDB Atlas

1. Créer un compte gratuit et provisionner un cluster M0.
2. Configurer les règles d'accès IP et créer un utilisateur DB.
3. Récupérer `MONGODB_URI` pour le backend et les scrapers.

### Backend (Render)

1. Créer un service Web Node.js sur Render (ou équivalent).
2. Définir la commande de build/start (`npm install && npm run build && npm start`).
3. Définir variables d'environnement essentielles :
   - `MONGODB_URI`
   - `PORT`
   - `UPLOAD_DIR` (par défaut `uploads/images`)
   - `IMAGE_BASE_URL` (URL publique où les images sont servies)
4. Configurer un cron job (Render Cron ou service externe) pour lancer le job de scraping quotidien.

### Frontend (Vercel)

1. Déployer le dossier `frontend/` sur Vercel.
2. Définir la variable `VITE_API_BASE_URL` pointant vers le backend déployé.

### Notes variables d'environnement

- Front-end : `VITE_API_BASE_URL`
- Back-end : `MONGODB_URI`, `PORT`, `UPLOAD_DIR`, `IMAGE_BASE_URL`, `NODE_ENV`
- Scrapers (si séparés) : `MONGODB_URI`, `BACKEND_API_URL` (si upload via API)

---

## 10. Roadmap

### Phase 1 (MVP)

- Définir 4–6 sources initiales (une par catégorie prioritaire).
- Implémenter scrapers et job quotidien.
- Implémenter backend minimal et collections `Works`, `Trends`, `Sources`.
- Développer frontend : `HomePage`, `WorkDetailPage`, `FavoritesPage` (localStorage), switcher dark/light.
- Déployer (Vercel + Render + MongoDB Atlas).

### Phase 2 (UX / Stabilisation)

- Polissage UI (animations, responsive, accessibilité).
- Monitoring simple des jobs de scraping.
- Tests de parsing et fixtures pour chaque source.

### Phase 3 (évolutions possibles)

- Ajouter plus de catégories/sources.
- Mettre en place un historique si la stratégie produit change (exigerait refonte DB).

---

## 11. Difficultés potentielles

### Problèmes techniques
- Fiabilité du scraping (HTML changeant, captchas, blocage IP).
- Limites du plan gratuit pour stockage et execution (Render / MongoDB Atlas).
- Gestion et optimisation des images (taille, CDN éventuel).

### Problèmes juridiques
- Respect des conditions d'utilisation des sites sources et des droits d'auteur pour images/textes.
- Préférer sources publiques, APIs officielles ou partenariats lorsque possible.

### Solutions recommandées
- Démarrer avec peu de sources robustes.
- Garder le scraping léger et respecter les délais entre requêtes.
- Documenter chaque source et conserver fixtures pour debugging.

---

## 12. Estimation

### Temps de développement (développeur solo expérimenté)
- Conception et planification : 0.5 jour
- Backend minimal + DB : 2 jours
- Scrapers initiaux (4–6 sources) + cron : 3 jours
- Frontend (Home + Detail + Favorites + theme switcher) : 4 jours
- Déploiement & ajustements : 1–2 jours
- Total estimé : 10–12 jours

### Difficulté par module
- Backend & DB : faible à modéré
- Scraping : modéré (varie selon sources)
- Frontend : modéré (UI/UX moderne, dark mode)

### Risques
- Changements fréquents dans les sources scrappées.
- Restrictions des offres gratuites (cold starts, quotas).

---

## Conclusion

Le projet doit rester simple : état du jour seulement, favoris locaux, pas d'users et une UI moderne orientée Top 10 par catégorie. Cette contrainte réduit la complexité opérationnelle et juridique et permet un MVP rapide et maintenable par une seule personne.
