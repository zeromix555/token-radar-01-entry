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

## The model (radar-4)

```
implied = TVL x category multiple x growth x maturity x chain
```

- **Category multiple** — a partial-pooling estimate of the median market-cap / TVL
  of the token-bearing protocols in the same category, computed from the snapshot
  at run time, clamped to 0.04–0.90. A category with at least 4 samples uses its
  own median outright. A thinner category is pulled toward the global median
  (0.214 on this snapshot) in proportion to its sample count: the global median
  acts as a prior worth 16 observations, so one sample moves the multiple less
  than 6% of the way from the global median to the category's own median, and a
  category with no traded protocol at all stays on the global median. No protocol
  name is ever special-cased, and the multiple is never tuned to any other entry's
  total — the board's total implied value is not the score, the rule is.
- **Growth** — 1 + clamped 7-day TVL change (−50%…+100%) × 1.0, up from 0.6 in
  radar-3. The 7-day change is one of the three signals the model claims to use,
  but at 0.6 it barely ranked: the middle 80% of rows sat in ×0.92–×1.03
  (7-day changes p10 −12.9%, p90 +5.6%). At 1.0 the middle 80% spans ×0.87–×1.06
  and growth actually separates growers from shrinkers, while the clamps still
  bound the extremes (the +4,448% row counts as +100%, ×2.0). Measured cost:
  total implied value $4.516B → $4.477B (−0.9%), the top 5 keep their order,
  6 rows move ≥10 ranks, biggest mover ×0.71 (a hard-shrinking protocol).
  A weight of 1.5 was tested and rejected: 14 rows move ≥10 ranks and the
  biggest mover falls ×0.36 — a 7-day wobble deciding a rank.
- **Maturity** — 0.7 + min(age, 1095 days) / 1095 × 0.3; unknown age counts as 365 days.
- **Chain** — 1 + 0.03 per extra chain, up to 4 extra chains.
- **Category share** — each row's share of its category's pre-token TVL,
  computed from the snapshot and shown in the detail view. It is display only,
  never a multiplier: a protocol that is most of its category reads differently
  from one of 34 in it (Veda holds 50.0% of pre-token Onchain Capital Allocator
  TVL; USDD holds 90.7% of pre-token CDP TVL).

Why pooling: the snapshot's mcap/TVL ratios are heavy-tailed (global median 0.214,
90th percentile 2.97, max 400.2), so a thin category's raw median is one or two
observations of a wild distribution — using it outright would let a single protocol
set a whole category's value, and the hard fallback it replaces threw that evidence
away entirely. Under radar-2, 112 of 198 rows sat on the global median, including
the whole top 3. Radar-3's pooling left only 18 of 198 rows exactly on the global
median. A naive shrinkage (weighted average of the category median and the global
median with no prior strength) was tested and rejected: it explodes the total to
$8.16–12.90B because thin categories with high medians get lifted wholesale.
Radar-4 tested two more multiple rules and rejected both: a TVL-weighted category
median collapses the global median to the 0.04 clamp floor (over half of all
token-bearing TVL sits in protocols with mcap/TVL ≤ 0.04, so the weighted median
is a giant-protocol artifact), total −56.8% to $1.949B, 152 rows move ≥10 ranks,
fallback rows 18 → 55; a median over token-bearing protocols with TVL ≥ $50M only
gives total −65.5% to $1.557B, 81 rows move ≥10, fallback rows 18 → 91. The
unweighted median stays: it is the multiple of a typical traded protocol, which is
what a launch is.

Radar-4 also fixes the farm plans: under radar-3 four of the six steps were the
same words on all 198 rows. Every row now carries seven steps — a fresh wallet,
the position sized by TVL ($50–$250), a category-specific weekly action, a hold
of 30–60 days by age, a claim check naming the protocol and its chain, an exit
plan whose unwind trigger is decided before the farm starts (claim first, then
withdraw half on a token or snapshot announcement; unwind fully if TVL halves or
the points page disappears), and a farm log. Each step states what it costs and
how long it takes.

The board ranks all 198 strict-rankable protocols: pre-token (records no token) and
not an exchange, a versioned pool, or a bridge / liquid-staking / restaking product,
with no wrapped / staked / staking word in the name and no exchange-name prefix.
That is the watchlist's own rule, reused for the whole board — the watchlist's 40
are the floor, never the ceiling. Token-bearing protocols never enter the ranked
board; the top 24 by market cap appear apart, at the market's own values.

## The dashboard

A dark radar console with no network: search, category / chain / min-TVL filters, a
watchlist-only toggle, sortable columns (including the category multiple), a Live-tokens tab, a model-explainer tab
with the category multiples and a categories-by-total-implied-value table,
and a detail drawer per row with the model equation broken down, the row's share
of its category's pre-token TVL, a seven-step farm plan (cost and time on every
step), and a risk note.

## Files

- `main.ts` — entrypoint: snapshot in, board + dashboard + dossier out.
- `lib/model.ts` — the model, the board builder, the farm plans, the snapshot parser.
- `vendor/makefun-board.ts` — make.fun's dossier library, byte for byte the scorer's copy.
- `dashboard/` — `index.html`, `app.css`, `app.js` (the page reads `data.js`, written by `main.ts`).
- `screenshots/` — three whole views of the dashboard: the board, a detail view, a filtered view.

## License

MIT. See `LICENSE`.
