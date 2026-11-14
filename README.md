# Token Launch Radar

A program that turns a frozen DefiLlama snapshot into a ranked radar of pre-token
protocols — which launch is worth farming next, what it might be worth, and what to
do about it.

## How it runs

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input <snapshot.json>
```

`main.ts` (Node 22, standard library only) reads the snapshot, scores every
strict-rankable pre-token protocol, and writes `board.json`, `data.js`, the
dashboard, the screenshots and `dossier.json` to the output directory. Run it twice:
both runs write the same bytes.

## The model (radar-2)

```
implied = TVL x category multiple x growth x maturity x chain
```

- **Category multiple** — the median market-cap / TVL of the token-bearing protocols
  in the same category, computed from the snapshot at run time (at least 4 samples,
  else the global median), clamped to 0.04–0.90. No protocol name is ever special-cased.
- **Growth** — 1 + clamped 7-day TVL change (−50%…+100%) × 0.6.
- **Maturity** — 0.7 + min(age, 1095 days) / 1095 × 0.3; unknown age counts as 365 days.
- **Chain** — 1 + 0.03 per extra chain, up to 4 extra chains.

The board ranks all 198 strict-rankable protocols: pre-token (records no token) and
not an exchange, a versioned pool, or a bridge / liquid-staking / restaking product,
with no wrapped / staked / staking word in the name and no exchange-name prefix.
That is the watchlist's own rule, reused for the whole board — the watchlist's 40
are the floor, never the ceiling. Token-bearing protocols never enter the ranked
board; the top 24 by market cap appear apart, at the market's own values.

## The dashboard

A dark radar console with no network: search, category / chain / min-TVL filters, a
watchlist-only toggle, sortable columns, a Live-tokens tab, a model-explainer tab,
and a detail drawer per row with the model equation broken down, a six-step farm
plan (cost and time on every step), and a risk note.

## Files

- `main.ts` — entrypoint: snapshot in, board + dashboard + dossier out.
- `lib/model.ts` — the model, the board builder, the farm plans, the snapshot parser.
- `vendor/makefun-board.ts` — make.fun's dossier library, byte for byte the scorer's copy.
- `dashboard/` — `index.html`, `app.css`, `app.js` (the page reads `data.js`, written by `main.ts`).
- `screenshots/` — three whole views of the dashboard: the board, a detail view, a filtered view.

## License

MIT. See `LICENSE`.
