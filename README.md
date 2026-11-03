# Backend: AI analysis and on-chain event listener

Two jobs, as supplied by the challenge, plus a small API for the data the contract confirms.

- `POST /ai/analyse-savings`: calculates the key figures in code, asks Mistral to explain them, validates the reply, and serves the pre-written response if anything fails.
- Event listener: watches the SavingsGoal contract on Celo Sepolia for the configured wallet.
- `GET /goal` and `GET /transactions`: the current goal, its progress, and every contribution confirmed on-chain, built by `src/handlers/eventHandlers.js` into the in-memory store in `src/data/chainStore.js`.
- `GET /health`

## Run

```bash
npm install
cp .env.example .env    # fill in the values; never commit .env
npm run dev             # http://localhost:5000
```

| Variable | Purpose |
|---|---|
| `AI_MODE` | `live` to call Mistral, anything else serves the pre-written response |
| `MISTRAL_API_KEY`, `MISTRAL_MODEL` | Provided by the coaches. Keep out of git and out of the frontend |
| `MISTRAL_TIMEOUT_MS` | Optional, default 15000. Raise it when the model is slow |
| `FRONTEND_URL` | Allowed CORS origin, for example `http://localhost:5173` |
| `CELO_RPC_URL`, `CONTRACT_ADDRESS`, `WALLET_ADDRESS` | Which contract and which wallet's events to follow |

## Design notes
- The AI never calculates. `buildSummary` computes every figure and `validateAiResponse` rejects replies that contradict them, so the fallback is used rather than showing a wrong statement.
- The listener is read-only (no private key). A handler error cannot stop it.
- The store is in memory. Restart the backend with `EVENTS_FROM_BLOCK` set to replay older events.
