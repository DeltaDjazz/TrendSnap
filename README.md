# TrendSnap

TrendSnap is a monorepo with a React frontend, a backend, and scrapers.

## Run the frontend locally

```bash
cd frontend
npm install
npm run dev
```

## Deploy the frontend to GitHub Pages

The app is built from the frontend build output in [frontend/dist](frontend/dist).

### Deploy to GitHub Pages

From the repository root, run:

```bash
cd frontend
npm install
npm run deploy
```

This command will:
- build the frontend,
- publish the contents of [frontend/dist](frontend/dist) to the `gh-pages` branch,
- keep your GitHub Pages site configured to serve from the `gh-pages` branch at `/root`.

After deployment, your site should be available at:

```text
https://<your-github-username>.github.io/TrendSnap/
```

Make sure GitHub Pages is configured with:
- Source: Deploy from a branch
- Branch: `gh-pages`
- Folder: `/root`

## Run the backend locally

```bash
cd backend
npm install
npm run dev
```
