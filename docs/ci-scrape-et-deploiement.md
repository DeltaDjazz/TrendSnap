# Automatisation : scrape quotidien et déploiement GitHub Pages

Ce document décrit le pipeline CI/CD qui remplace (ou complète) l’exécution locale de `npm run scrapall` pour alimenter le site statique TrendSnap.

## Vue d’ensemble

```text
┌─────────────────┐     cron 08:00 UTC      ┌──────────────────────────┐
│ GitHub Actions  │ ──────────────────────► │ Job scrape-build         │
│ (workflow)      │     ou workflow_dispatch  │ 1. npm run scrapall      │
└─────────────────┘                         │ 2. commit JSON (main)    │
                                            │ 3. npm run build         │
                                            └────────────┬─────────────┘
                                                         │
                                                         ▼
                                            ┌──────────────────────────┐
                                            │ Job deploy               │
                                            │ GitHub Pages (artifact)  │
                                            └──────────────────────────┘
```

Fichier de workflow : [`.github/workflows/scrape-and-deploy.yml`](../.github/workflows/scrape-and-deploy.yml).

## Choix d’architecture

### Un seul workflow « scrape + build + deploy »

Plutôt que de séparer « scrape » et « déploiement » sur deux branches (`main` vs `deploy`), le pipeline quotidien enchaîne tout dans **une** exécution :

1. Les scrapers écrivent déjà dans `frontend/src/data/snapshots/YYYY-MM-DD/` et mettent à jour `active-date.json` (voir [snapshots-date.md](./snapshots-date.md)).
2. Ces fichiers sont **versionnés sur la branche par défaut** (`main`) : historique des tops, diff Git, rollback via `npm run set-date`.
3. Le frontend est **reconstruit juste après** le scrape pour embarquer les JSON via `import.meta.glob` (Vite).
4. Le déploiement utilise les **actions officielles GitHub Pages** (`upload-pages-artifact` + `deploy-pages`), comme [deploy-pages.yml](../.github/workflows/deploy-pages.yml).

Avantages :

- Pas de branche `gh-pages` à maintenir à la main (contrairement à `npm run deploy` local avec `gh-pages`).
- Pas de risque de publier un build sans les snapshots du jour.
- Le déclenchement est limité au **cron** et à **workflow_dispatch** : un push de commit de données ne relance pas une deuxième fois le scrape (évite les boucles).

### Workflow `deploy-pages.yml` existant

Le workflow [`.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml) reste utile pour un déploiement **manuel** déclenché par un push sur la branche `deploy` (sans rescrape). Le flux recommandé au quotidien est **scrape-and-deploy** sur `main`.

## Planification et déclenchement manuel

| Déclencheur | Comportement |
| --- | --- |
| `schedule` : `0 8 * * *` | Exécution automatique tous les jours à **08:00 UTC** (09:00 heure de Paris en hiver, 10:00 en été). |
| `workflow_dispatch` | Bouton **Run workflow** dans l’onglet Actions du dépôt GitHub. |

Pour lancer à la main : **Actions** → **Daily scrape and deploy** → **Run workflow** → choisir la branche (en général `main`).

## Environnement d’exécution (Node + Puppeteer)

Le job s’exécute sur `ubuntu-latest` :

1. `npm ci` à la racine (dépendance `puppeteer`, **Node 22+** requis par Puppeteer 25).
2. Installation Chrome en deux temps : `npx puppeteer browsers install chrome`, puis **`sudo`** + `--install-deps` (les paquets système Linux exigent les droits root sur le runner).
3. Variable `CI=true` (convention pour distinguer l’environnement CI du poste local).

Les scripts Netflix utilisent déjà `--no-sandbox` et `--disable-setuid-sandbox`, souvent **nécessaires** sur les runners GitHub. Si un job Apple ou Amazon échoue au lancement du navigateur, alignez `puppeteer.launch()` sur les mêmes `args` que les jobs Netflix.

Durée : timeout du job fixé à **90 minutes** (six scrapers séquentiels via `scrapeAll.mjs`).

## Persistance des données

Après un `npm run scrapall` réussi :

| Chemin | Rôle |
| --- | --- |
| `frontend/src/data/snapshots/<date>/` | Fichiers JSON du jour (un dossier par date). |
| `frontend/src/data/active-date.json` | Date affichée par le frontend (`dateDuJour`). |

Le workflow committe uniquement ces chemins avec le message :

```text
chore(data): snapshots YYYY-MM-DD
```

Les logs scraper (`scrapers/logs/`) restent ignorés par `.gitignore` et ne sont pas poussés.

Si le scrape échoue (`scrapeAll` sort avec un code ≠ 0, par exemple un job en échec), **aucun commit ni déploiement** n’est effectué (étapes suivantes non exécutées).

## Déploiement GitHub Pages

Prérequis côté dépôt GitHub (une fois) :

1. **Settings** → **Pages** → **Build and deployment** : source **GitHub Actions** (pas « Deploy from a branch » si vous basculez entièrement sur ce workflow).
2. L’environnement `github-pages` est créé automatiquement au premier déploiement réussi.

Le site est servi avec `base: '/TrendSnap/'` (voir [frontend/vite.config.js](../frontend/vite.config.js)), donc l’URL attendue est :

```text
https://<organisation-ou-utilisateur>.github.io/TrendSnap/
```

## Permissions

Le workflow demande :

- `contents: write` — pousser les commits de snapshots sur `main`.
- `pages: write` et `id-token: write` — déploiement OIDC vers GitHub Pages.

Le `GITHUB_TOKEN` fourni par Actions suffit ; aucun secret personnalisé n’est requis pour le scrape ni pour Pages.

## Date des dossiers snapshot

`getDateToday()` dans `saveSnapshot.mjs` utilise l’horloge du runner (**UTC** sur GitHub Actions). Avec un cron à 08:00 UTC, le dossier `YYYY-MM-DD` correspond au **jour civil UTC**, ce qui est cohérent avec l’heure planifiée.

## Opérations courantes

### Tester le pipeline sans attendre le cron

Lancer **workflow_dispatch** depuis l’interface GitHub (voir ci-dessus).

### Revenir à une ancienne date sur le site

1. Committer ou ajuster `active-date.json` (ou `npm run set-date -- YYYY-MM-DD` en local).
2. Soit attendre un déploiement via push sur `deploy` (`deploy-pages.yml`), soit relancer **Daily scrape and deploy** après avoir seulement changé la date (inutile de rescraper) — en pratique, un commit manuel + rebuild peut se faire via `deploy-pages` ou un run manuel du workflow après modification de la date.

Pour un rollback **sans** rescrape, le plus simple reste : modifier `active-date.json` sur `main`, puis déclencher un build/deploy (workflow deploy ou scrape-and-deploy si vous acceptez de relancer les scrapers ; sinon étendre `deploy-pages` pour `main` + `paths`).

### Surveiller les échecs

- Onglet **Actions** : logs par job et par scraper (sortie de `scrapeAll.mjs`).
- Fichiers locaux `scrapers/logs/scrapall-latest.log` ne sont pas sur GitHub ; tout le diagnostic passe par les logs du workflow.

## Fichiers liés

| Fichier | Rôle |
| --- | --- |
| `.github/workflows/scrape-and-deploy.yml` | Pipeline quotidien complet |
| `.github/workflows/deploy-pages.yml` | Déploiement depuis la branche `deploy` |
| `scrapers/scrapeAll.mjs` | Orchestration des jobs |
| `scrapers/utils/saveSnapshot.mjs` | Écriture JSON + `active-date.json` |
| `docs/snapshots-date.md` | Modèle de données et rollback |

## Checklist de mise en service

- [ ] Fusionner le workflow sur `main`.
- [ ] Vérifier **Settings → Pages → GitHub Actions** comme source de déploiement.
- [ ] Lancer une fois **Daily scrape and deploy** manuellement et contrôler le commit + l’URL Pages.
- [ ] Confirmer que tous les jobs Puppeteer démarrent (args `--no-sandbox` si besoin sur Apple/Amazon).
