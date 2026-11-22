# RandomTime — client

Frontend React + Vite di RandomTime: importa la watchlist (screenshot TvTime via AI o CSV), gestisci la lista e lascia che l'app scelga cosa guardare.

## Architettura

- **La lista vive solo nel browser** (`localStorage`, chiave `randomtime.films`): nessun account, nessun database. Svuotare i dati del sito cancella la lista.
- Il **server** (`../server`) è stateless e serve solo a `POST /api/extract`: inoltra lo screenshot a Claude e restituisce i titoli estratti. Gli errori arrivano come codici (`{ "error": "ERR_..." }`) tradotti in `src/i18n.js` → `errors`.
- L'import CSV è elaborato interamente nel browser.

## Sviluppo

```bash
npm install
npm run dev      # http://localhost:5173
npm run lint
npm run build
```

## Configurazione

- `VITE_API_URL`: URL del server.
  - Sviluppo: `.env.local` (non versionato), es. `VITE_API_URL=http://localhost:3001`
  - Produzione: `.env.production`

Server (`../server/.env`): `ANTHROPIC_API_KEY`, `CLIENT_URL` (origine CORS consentita), opzionale `EXTRACT_DAILY_LIMIT` (estrazioni AI per IP al giorno, default 5).

## Import CSV

Header obbligatorio `title,genre,type` (`type` = `film` | `serie`), max 1 MB / 500 righe. I campi con virgole vanno tra virgolette: `"Crouching Tiger, Hidden Dragon",Azione,film`.
