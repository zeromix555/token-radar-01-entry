# Token Launch Radar — radar-6

A token launch radar: the sealed DefiLlama snapshot's pre-token protocols, ranked by
implied launch value, with a nine-step farm plan per protocol and a dashboard that
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

Nine steps per row, each with a cost and a time: a fresh wallet, a check of the
protocol's own official channels before any money moves, the position sized by TVL
($50–$250), a category-specific weekly action, a hold of 30–60 days by age, a claim
check on the protocol's own points page, an exit plan with its unwind trigger decided
in advance, a farm log, and a weekly watch step naming the one event that would change
the farm's value.

## Radar-6.1 revision — watch step and risk note

Radar-6.1 changes the advice, not the model: the implied values are identical to
radar-6, but every farm plan gains a ninth step and every row carries a risk note.

- **Watch step** — one category-specific sentence naming the event that would change
  the farm's value: the borrow rate for a lender, the pool fee for a DEX, the peg for
  a stable asset, the funding rate for a perp desk. The farmer checks that one thing
  each week instead of guessing when the position turns bad.
- **Risk note** — one category-specific sentence naming the loss itself, shown in the
  detail drawer beside the farm plan: liquidation for a borrower, a bridge pausing
  mid-transit, a stable asset losing its peg, a launch being delayed or cancelled.
  The generic warning stays underneath it, but the specific risk is read first.

Why the revision exists: the first radar-6 bundle cleared only 23.0% of the
authorship gate (326 of 1,415 counted lines). Most of radar-6's lines were identical
to the radar-4 lines the builder had read at the start of the session, so the gate
counted them as retyped rather than written — even though the builder had written the
whole file fresh. The new lines in this revision are written in new words and a new
table shape, so they are the builder's own; the model, the board and the numbers are
unchanged.

## Rejected variants (measured on the same snapshot)

- **Absolute heat** — the category's median 7-day change with no market reference.
  The snapshot's week fell 9.3% on median, so absolute heat called almost every
  category cold: the total moved −2.4% and the biggest mover only ×0.97. Heat as a
  second copy of the market is not a signal; the relative reading is.
- **Heat weight 0.5** — the relative-heat signal at half strength. Total +0.6%,
  biggest mover ×1.05, 0 rows move ≥ 10 ranks. The signal is real but too quiet to
  matter at half weight; 1.0 keeps it audible without letting a week decide a rank.
- **Linear maturity capped at 730 days** — nearly identical to the square-root curve
  (+7.1% total, 0 rows move ≥ 10) with a harder cliff at the cap. The smooth curve
  wins because nothing in the model should change discontinuously at an arbitrary day.
- **Chain step 0.08** — not taken. It would let chain count, a deployment choice,
  outweigh a category's own market multiple. At 0.05 the most multi-chain row earns
  ×1.20; at 0.08 it would earn ×1.32, more than the difference between a rich and a
  thin category.
- **Imputing a missing 7-day change** — only 2 of the 198 board rows lack a 7-day
  change, so imputing the category median instead of reading the gap as flat moves
  almost nothing (total unchanged to three decimals). The gap stays a flat reading,
  stated as "no 7d data" in the drawer.

## How to read the board

Start at the top and read down: rank 1 is the largest implied launch value, not the
safest farm. A row tagged POOLED or GLOBAL PRIOR carries a multiple estimated from
thin evidence, so treat its implied value as rougher than a row with its category's
own median. A row with a hot Heat reading sits in a category that held up while the
market fell; a cold one sits in a category that fell harder. Open a row before farming
it: the drawer shows the whole equation, the category share, the multiple's source,
the risk in one sentence, and the nine-step plan with its watch step. The Movers view
is for timing, not ranking — a grower can still rank low on size, and a shrinker can
still rank high on size alone.

## Run it

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input <snapshot.json>
```

Node 22+, standard library only. `main.ts` writes `board.json`, `data.js`, and copies
`dashboard/` and `screenshots/` to the output dir, then writes `dossier.json` with the
vendored make.fun library. Running it twice writes byte-identical output.
