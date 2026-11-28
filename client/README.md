# SortApp — client

Frontend React + Vite di SortApp: importa la watchlist (screenshot TvTime via AI o CSV), gestisci la lista e lascia che l'app scelga cosa guardare.

## Architettura

- **La lista vive solo nel browser** (`localStorage`, chiave `sortapp.films`; la vecchia chiave `randomtime.films` viene migrata automaticamente al primo avvio): nessun account, nessun database. Svuotare i dati del sito cancella la lista.
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

Header obbligatorio `title,genre,type` (`type` = `film` | `serie`), colonna `watched` (0/1) facoltativa; max 2 MB / 5000 righe. Il pulsante **Esporta CSV** nella scheda Lista scarica la lista nello stesso formato, quindi il file si può reimportare (backup o passaggio a un altro browser). I campi con virgole vanno tra virgolette: `"Crouching Tiger, Hidden Dragon",Azione,film`.
