# Architecture favoris - TrendSnap

## Objectif

Mettre en place des favoris:

- persistants exclusivement en Local Storage;
- consultables indefiniment, meme si les tendances source expirent;
- synchronises automatiquement entre state React et stockage local;
- limites a **50 favoris maximum**;
- simples a maintenir et a faire evoluer.

## Contraintes produit

- Les donnees tendances disparaissent environ apres 7 jours.
- Un favori doit rester exploitable sans dependre des snapshots.
- Le Local Storage est la seule persistance autorisee.
- Les operations principales sont: ajouter, retirer, verifier, lister.

---

## Architecture retenue

Approche: **Context API + `useState` + hook metier + service Local Storage**.

Pourquoi:

- separation claire des responsabilites;
- logique metier centralisee;
- composants UI simples;
- pas de sur-ingenierie pour un plafond de 50 favoris;
- evolutif pour recherche, tags, sync cloud.

---

## Structure des fichiers

```text
frontend/src/features/favorites/
  FavoritesContext.jsx      # Contexte + Provider (state, hydratation, persist, sync multi-onglets)
  useFavorites.js           # Hook metier — API publique pour les composants
  favoritesStorage.js       # Unique point d'acces Local Storage (load/save/erreurs)
  favoriteNormalizer.js     # Transforme les donnees source en FavoriteItem
  favoriteKey.js            # Genere la cle stable anti-doublons
  constants.js              # Constantes metier (MAX_FAVORITES, cle LS, version)

  components/
    FavoriteCard.jsx        # Carte affiche d'un favori (ouvrir / supprimer)
    FavoritesGrid.jsx       # Grille masonry responsive (CSS columns)
    FavoritesEmptyState.jsx # Etat vide + CTA retour tendances

  FavoritesPage.jsx         # Page Favoris — compose UI + MovieModal
```

Organisation:

- **racine du feature** : logique metier, persistance, normalisation;
- **`components/`** : composants UI d'affichage uniquement;
- **`FavoritesPage.jsx`** : composition de la page (hors sous-dossier `pages/` tant que le volume reste faible).

Pas de sous-dossiers supplementaires (`model/`, `storage/`, `state/`, `hooks/`) tant qu'ils n'apportent pas de valeur reelle.

---

## Responsabilites par fichier

### `FavoritesContext.jsx`

Contient dans un seul fichier:

- la creation du contexte React;
- le `FavoritesProvider`;
- l'export du Provider.

Le Provider gere uniquement:

1. chargement initial des favoris depuis Local Storage (via `favoritesStorage`);
2. stockage de l'etat React (`Favorite[]` via `useState`);
3. exposition des actions metier au contexte;
4. persistance automatique apres chaque modification;
5. ecoute de l'evenement `storage` pour la synchronisation multi-onglets.

Les composants UI ne doivent pas connaitre ces details.

### `useFavorites.js`

Hook metier separe qui expose l'API publique stable aux composants.

Les composants consomment **uniquement** ce hook. L'implementation interne peut evoluer sans modifier l'UI.

### `favoritesStorage.js`

**Unique point d'acces au Local Storage.**

Responsabilites:

- lire les favoris (`loadFavorites`);
- sauvegarder les favoris (`saveFavorites`);
- gerer les erreurs JSON;
- gerer les valeurs invalides (fallback safe).

> **Regle stricte : les composants React ne doivent jamais acceder directement au Local Storage.**

### `favoriteNormalizer.js`

**Seul endroit** responsable de transformer les donnees sources en objet favori.

Flux attendu:

```text
MovieModal
    ↓
useFavorites().toggleFavorite(content)
    ↓
favoriteNormalizer
    ↓
FavoriteItem
    ↓
favoritesStorage
```

Aucun composant ne construit manuellement un objet favori. Tous les favoris ont toujours la meme structure.

### `favoriteKey.js`

Genere une cle stable et deterministe pour eviter les doublons.

Priorite:

- `movie.id` si disponible;
- sinon slug de `template + title + year|dateDeSortie`.

### `constants.js`

Centralise les constantes metier:

- `MAX_FAVORITES = 50`;
- `LOCAL_STORAGE_KEY`;
- `FAVORITES_VERSION`.

Evite les valeurs codées en dur dans plusieurs fichiers.

### Composants UI (`components/`)

- `FavoriteCard.jsx` — affiche une affiche, actions ouvrir/supprimer;
- `FavoritesGrid.jsx` — grille masonry responsive (CSS columns);
- `FavoritesEmptyState.jsx` — etat vide + CTA retour tendances.

Composants de rendu pur: pas de logique de persistance, pas d'acces Local Storage.

### `FavoritesPage.jsx`

Compose la page Favoris, consomme `useFavorites()`, reutilise `MovieModal` pour le detail.

---

## Couches volontairement non creees

| Fichier | Raison |
|---|---|
| `FavoritesProvider.jsx` (separe) | fusionne dans `FavoritesContext.jsx` |
| `favorite.types.js` | inutile en JS sans migration TypeScript |
| `favoritesSchema.js` | validation legere suffisante dans `favoritesStorage.js` |
| `favoritesMigrations.js` | premature; logique conditionnelle dans `loadFavorites()` si besoin |
| `useFavoriteStatus.js` | redondant avec `useFavorites().isFavorite` |
| `FavoriteModal.jsx` | reutilisation de `MovieModal` existant |

Principe: ajouter une couche uniquement lorsqu'un besoin concret apparait.

---

## API publique de `useFavorites()`

Interface contractuelle exposee aux composants:

```javascript
{
  favorites,              // Favorite[] — liste triee par addedAt desc

  addFavorite(content),   // ajoute un favori (refuse si limite atteinte)
  removeFavorite(key),    // supprime par cle
  toggleFavorite(content),// ajoute ou retire selon presence
  isFavorite(content),    // boolean
  clearFavorites(),       // vide tous les favoris (optionnel)

  count,                  // nombre de favoris
  isAtLimit               // true si count >= MAX_FAVORITES
}
```

Les composants n'utilisent que cette API. L'implementation interne (state, storage, normalisation) reste encapsulee.

---

## Modele de donnee favori

Principes:

- objet **self-contained** pour affichage autonome;
- `addedAt` obligatoire;
- `version` conservee pour evolution future;
- stockage interne en **`Favorite[]`** (tableau, pas de Map/Record).

Exemple:

```js
{
  key: "netflix-series|stranger-things|2016",
  version: 1,
  addedAt: "2026-07-28T10:30:00.000Z",
  source: {
    template: "netflix-series",
    snapshotDate: "2026-07-28"
  },
  content: {
    title: "Stranger Things",
    poster: "https://...",
    modalPoster: "https://...",
    description: "...",
    genre: ["Science-fiction", "Thriller"],
    stars: ["..."],
    year: "2016",
    dateDeSortie: "2016-07-15",
    saison: "4",
    episodes: "34",
    originCountry: "USA",
    trailerUrl: "https://..."
  }
}
```

### Stockage interne: tableau `Favorite[]`

Justification:

- maximum 50 favoris;
- `find`, `some`, `filter` largement suffisants;
- serialisation Local Storage directe;
- meilleure lisibilite qu'une Map ou un Record.

Pas d'optimisation prematuree.

---

## Synchronisation React ↔ Local Storage

Geree exclusivement dans le Provider (`FavoritesContext.jsx`):

1. **Hydratation initiale** — `loadFavorites()` au demarrage (initializer `useState` ou `useEffect` mount).
2. **Persistance automatique** — `saveFavorites(favorites)` apres chaque modification d'etat.
3. **Sync multi-onglets** — listener `window.storage` pour recharger si un autre onglet modifie les favoris.

Regles metier:

- blocage a 50 favoris (`MAX_FAVORITES` depuis `constants.js`);
- anti-doublons par cle stable (`favoriteKey.js`);
- tri d'affichage: `addedAt` desc.

---

## Reutilisation de `MovieModal`

Decision: **reutiliser `MovieModal`**, sans creer `FavoriteModal`.

- la page Favoris passe a `MovieModal` les donnees stockees dans `favorite.content`;
- un seul composant modale a maintenir;
- coherence UX entre tendances et favoris.

---

## Page Favoris

Comportements:

- grille masonry responsive en CSS columns (`columns-2 md:columns-3 lg:columns-5`);
- clic sur une affiche → ouverture de `MovieModal` avec les donnees du Local Storage;
- suppression d'un favori (carte ou modale);
- etat vide si aucun favori;
- mise a jour immediate quand un favori est ajoute ou supprime;
- message utilisateur explicite si la limite de 50 est atteinte.

Navigation: route `/favoris` via React Router, lien dans `Header`.

---

## Regles d'architecture

- **UI ≠ logique metier ≠ persistance.** Chaque couche a une responsabilite unique.
- **Un seul point d'acces au Local Storage** : `favoritesStorage.js`.
- **Un seul endroit de normalisation** : `favoriteNormalizer.js`.
- **Les composants consomment uniquement `useFavorites()`** — jamais le contexte, le storage ou le normalizer directement.
- **Pas d'optimisation prematuree** — tableau simple, pas de Map/Record/virtualisation.
- **Ajouter une nouvelle couche uniquement lorsqu'un besoin concret apparait.**

---

## Strategie d'implementation par etapes

### Etape 1 — Fondations

- creer `constants.js`, `favoriteKey.js`, `favoriteNormalizer.js`;
- fixer le format favori (`key`, `version`, `addedAt`, `source`, `content`).

### Etape 2 — Service Local Storage

- implementer `favoritesStorage.js` (`loadFavorites`, `saveFavorites`);
- gerer fallback resilient (JSON invalide, donnees inconnues).

### Etape 3 — Context et hook metier

- creer `FavoritesContext.jsx` (contexte + Provider + `useState`);
- implementer `useFavorites.js` avec l'API publique definie ci-dessus;
- brancher hydratation, persistance auto et sync multi-onglets.

### Etape 4 — Integration UI existante

- integrer le bouton favoris dans `MovieModal`;
- ajouter/retirer via `useFavorites().toggleFavorite()`;
- gerer le message de limite atteinte.

### Etape 5 — Page Favoris

- creer `FavoritesPage.jsx` + composants dans `components/`;
- ouvrir `MovieModal` avec les donnees du Local Storage.

### Etape 6 — Navigation et qualite

- ajouter route `/favoris` dans React Router + lien dans `Header`;
- tests manuels: ajout, suppression, reload, sync multi-onglets, blocage au 51e.

---

## Evolutions futures possibles (sans refonte)

- tri et recherche;
- tags et notes utilisateur;
- export/import JSON;
- synchronisation cloud.

Le noyau actuel reste volontairement simple, mais pret a evoluer.
