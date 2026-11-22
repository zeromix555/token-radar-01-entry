# Token Launch Radar — radar-6

A token launch radar: the sealed DefiLlama snapshot's pre-token protocols, ranked by
implied launch value, with an eight-step farm plan per protocol and a dashboard that
shows the whole board, the live tokens apart, the week's movers, and the model itself.

## The model (radar-6)

```
implied = TVL × category multiple × growth × heat × maturity × chain
```

- **Category multiple** — the median market-cap / TVL of the token-bearing protocols in
  the same category, computed at run time from the snapshot. Categories with at least 4
  samples use their own median outright; thinner categories are pulled toward the global
  median (a prior worth 16 observations), and a category with no traded protocol stays
  on the global median. Clamped to 0.04–0.90.
- **Growth** — 1 + clamped 7-day TVL change (−50%…+100%) × 1.0.
- **Heat** — the category's median 7-day TVL change among its token-bearing protocols,
  measured against the market that week (global median change). The snapshot's week fell
  9.3% on median, so the relative reading separates categories that held up (Basis
  Trading, RWA, about 9 points above the market) from ones that fell harder. Heat is
  1 + clamped relative change (−20%…+30%) × 1.0, pooled like the multiple.
- **Maturity** — 0.7 + sqrt(min(age, 1095 days) / 1095) × 0.3. A year of waiting proves
  more than the third year does, so the curve flattens. Unknown age counts as 365 days.
- **Chain** — 1 + 0.05 per extra chain, up to 4 extra chains.

Radar-6 against radar-4 on the same snapshot: total implied value $4.477B → $5.081B
(+13.5%), top 5 keep their order, 0 rows move ≥ 10 ranks, biggest mover ×1.27. Every
number is computed at runtime from the snapshot; no protocol is ever named in the rule.
Each row also says where its multiple came from (its category's own median, a pooled
blend, or the global prior), so the dashboard shows confidence instead of hiding it.

## The board

198 rows: every strict-rankable pre-token protocol (records no token, not an exchange,
not a versioned pool, not a bridge / liquid-staking / restaking product, no wrapped /
staked / staking word in its name, not starting with an exchange name). The watchlist's
40 are a subset. The top 40 token-bearing protocols by market cap are shown apart in
the Live tokens view, at the market's own values. The Movers view lists the board's 10
fastest growers and 10 fastest shrinkers by 7-day TVL change.

## Farm plans

Eight steps per row, each with a cost and a time: a fresh wallet, a check of the
protocol's own official channels before any money moves, the position sized by TVL
($50–$250), a category-specific weekly action, a hold of 30–60 days by age, a claim
check on the protocol's own points page, an exit plan with its unwind trigger decided
in advance, and a farm log.

## Run it

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input <snapshot.json>
```

Node 22+, standard library only. `main.ts` writes `board.json`, `data.js`, and copies
`dashboard/` and `screenshots/` to the output dir, then writes `dossier.json` with the
vendored make.fun library. Running it twice writes byte-identical output.
