# Date active et rollback des snapshots

Ce document décrit comment TrendSnap choisit les données affichées (par date) et comment revenir à une date antérieure.

## Principe

Chaque scrape écrit ses JSON dans un dossier daté :

```text
frontend/src/data/snapshots/YYYY-MM-DD/
  netflix-series.json
  netflix-movies.json
  apple-series.json
  apple-movies.json
  amazon-series.json
  amazon-movies.json
```

La date **affichée** par le frontend n’est pas calculée à la volée dans le navigateur : elle est lue dans un fichier unique.

```text
frontend/src/data/active-date.json
```

Exemple :

```json
{
  "dateDuJour": "2026-07-19"
}
```

Tant que `dateDuJour` vaut `2026-07-19`, le frontend charge les fichiers de `snapshots/2026-07-19/`.

## Chaîne côté frontend

1. `active-date.json` contient `dateDuJour`.
2. `frontend/src/data/loadSnapshots.js` importe ce JSON et expose `loadSnapshot(filename)`.
3. Vite inclut tous les snapshots au build via `import.meta.glob('./snapshots/*/*.json')`.
4. `App.jsx` charge les tops ainsi :

```js
const netflixSeries = loadSnapshot('netflix-series.json')
// → ./snapshots/${dateDuJour}/netflix-series.json
```

Changer `dateDuJour` suffit pour pointer vers un autre dossier (à condition que ce dossier existe et contienne les JSON attendus).

## Chaîne côté scrapers

Fichier utilitaire : `scrapers/utils/saveSnapshot.mjs`.

| Fonction | Rôle |
| --- | --- |
| `getDateToday()` | Retourne la date système au format `YYYY-MM-DD`. |
| `saveSnapshot(filename, data)` | Écrit le JSON dans `snapshots/<aujourd’hui>/` **et** met à jour `active-date.json` vers cette date. |
| `setActiveDate(date)` | Écrit uniquement `active-date.json` (sans rescraper). |

Conséquence : après un scrape réussi, le frontend pointe automatiquement vers le dossier du jour.

## Rollback (revenir à une date passée)

### Prérequis

Le dossier `frontend/src/data/snapshots/<date>/` doit déjà exister (créé lors d’un scrape précédent).

### Commande

À la racine du monorepo :

```bash
npm run set-date -- 2026-07-19
```

Équivalent :

```bash
node scrapers/setActiveDate.mjs 2026-07-19
```

Cela réécrit `active-date.json` :

```json
{
  "dateDuJour": "2026-07-19"
}
```

### Après un rollback

- En `npm run dev` (Vite) : recharger la page si besoin ; le HMR recharge souvent le JSON tout seul.
- En production : rebuild / redeploy pour embarquer la nouvelle date active.

### Édition manuelle

Tu peux aussi modifier directement `frontend/src/data/active-date.json` à la main. Le script `set-date` évite les erreurs de format.

## Workflows typiques

### Scrape du jour

```bash
npm run scrapall
# ou un job isolé : npm run scrapns, scrapnm, etc.
```

→ fichiers écrits dans `snapshots/<aujourd’hui>/`  
→ `active-date.json` pointe vers aujourd’hui

### Afficher une ancienne journée

```bash
npm run set-date -- 2026-07-15
```

→ le frontend lit `snapshots/2026-07-15/...`  
→ les dossiers des autres dates restent intacts

### Revenir au dernier scrape

Relancer un scrape, ou :

```bash
npm run set-date -- 2026-07-19
```

(avec la date du dossier le plus récent que tu veux afficher)

## Fichiers concernés

| Fichier | Rôle |
| --- | --- |
| `frontend/src/data/active-date.json` | Source de vérité de la date affichée |
| `frontend/src/data/loadSnapshots.js` | Charge les JSON de `snapshots/<dateDuJour>/` |
| `frontend/src/App.jsx` | Consomme `loadSnapshot(...)` |
| `scrapers/utils/saveSnapshot.mjs` | Écriture snapshot + date active |
| `scrapers/setActiveDate.mjs` | CLI de rollback / bascule |
| `package.json` (racine) | Script npm `set-date` |

## Erreurs fréquentes

- **`Snapshot introuvable`** : `active-date.json` pointe vers une date sans dossier (ou sans le fichier demandé). Vérifie `snapshots/<date>/` ou corrige la date avec `set-date`.
- **Format invalide** : la date doit être `YYYY-MM-DD` (ex. `2026-07-19`).
