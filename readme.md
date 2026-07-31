# Spotify Analytics Dashboard

A free, static Spotify analytics dashboard deployed on GitHub Pages. React + Vite, no backend — auth uses Authorization Code with PKCE.

## Setup

1. Edit [src/config.js](src/config.js) with your Spotify app's Client ID and your GitHub Pages redirect URI (must exactly match a Redirect URI registered in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)).
2. If your GitHub repo name differs from `Spotify-Analytics-Project`, update `base` in [vite.config.js](vite.config.js) and `homepage` in [package.json](package.json) to match.

## Run locally

```
npm install
npm run dev
```

Open the printed local URL. Click **Connect to Spotify** to test the login flow.

> Note: Spotify requires the redirect URI to match exactly, including scheme/host/port. If you test locally, either temporarily register `http://127.0.0.1:5199/Spotify-Analytics-Project/` (or whatever Vite prints) as an additional Redirect URI in the Spotify dashboard, or just test against the deployed GitHub Pages URL once deployed.

## Deploy to GitHub Pages

```
npm run deploy
```

This builds the app and publishes `dist/` to the `gh-pages` branch. Enable GitHub Pages for that branch in your repo settings if not already configured.
