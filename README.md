# SortApp

> L'amico che non ti dice mai "boh, scegli tu".

SortApp ti aiuta a decidere cosa guardare stasera. Importi la tua watchlist (da uno screenshot di TV Time, letto con l'AI, oppure da un file CSV), la gestisci come una lista e, quando non sai cosa scegliere, l'app pesca un titolo per te.

- **Importa**: carica uno screenshot di TV Time e Claude estrae titoli, generi e tipo (film/serie); oppure carica un CSV.
- **Lista**: aggiungi titoli a mano, segna quelli visti, filtra, cerca ed esporta in CSV.
- **Scegli**: estrazione casuale tra i titoli da vedere, con filtro film/serie e "ignora stasera".
- Interfaccia in italiano e inglese, tema chiaro e scuro.

## Dove stanno i dati

Nessun account e nessun database: **la lista vive solo nel browser** (`localStorage`, chiave `sortapp.films`). Svuotare i dati del sito la cancella, per questo l'app ogni tanto suggerisce di esportare un backup CSV, che si può reimportare dalla scheda Importa (anche per passare la lista a un altro browser).

Il server è stateless: riceve lo screenshot, lo inoltra a Claude e restituisce i titoli estratti, senza salvare nulla.

## Struttura

```
client/   React + Vite: tutta l'app (vedi client/README.md)
server/   Express: POST /api/extract (screenshot → titoli) e GET /api/health
```

## Avvio in locale

Serve Node.js 22.

```bash
# server (porta 3001)
cd server
npm install
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
npm run dev

# client (porta 5173), in un altro terminale
cd client
npm install
echo "VITE_API_URL=http://localhost:3001" > .env.local
npm run dev
```

Apri http://localhost:5173. Senza `ANTHROPIC_API_KEY` l'app funziona lo stesso, ma l'import da screenshot no.

## Variabili d'ambiente

| Dove | Variabile | Obbligatoria | Descrizione |
|---|---|---|---|
| server | `ANTHROPIC_API_KEY` | sì | Chiave API di Anthropic, usata per estrarre i titoli dagli screenshot. |
| server | `CLIENT_URL` | in produzione | Origine del client consentita dal CORS (es. `https://tuo-sito.vercel.app`). Default `http://localhost:5173`. |
| server | `EXTRACT_DAILY_LIMIT` | no | Estrazioni AI per IP al giorno. Default `5`. |
| server | `PORT` | no | Porta del server. Default `3001` (Render la imposta da solo). |
| client | `VITE_API_URL` | sì | URL del server. In sviluppo in `client/.env.local`, in produzione in `client/.env.production`. |

Il file `server/.env` non è versionato.

## Test e CI

```bash
cd client
npm test         # Vitest
npm run lint
npm run build
```

GitHub Actions (`.github/workflows/ci.yml`) esegue lint, test e build del client e uno smoke test del server (lo avvia e controlla `/api/health`) a ogni pull request e a ogni push su `main`.

## Deploy

- **Client**: Vercel (cartella `client/`, build con `npm run build`).
- **Server**: Render, piano gratuito. Il servizio si addormenta dopo un periodo di inattività e il primo risveglio può richiedere fino a un minuto: il client lo "sveglia" con una chiamata a `/api/health` appena si apre l'app e, se serve, mostra un messaggio d'attesa prima dell'estrazione.
