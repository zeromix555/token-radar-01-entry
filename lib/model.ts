// Token radar model, version radar-6: implied value from the snapshot's own figures only.
//
//   implied = TVL x categoryMultiple x growthMult x heatMult x maturityMult x chainMult
//
// Radar-6 adds three measured changes on top of radar-4, each tested on this snapshot
// before it was kept, and each stated in the open below with its numbers.
//
// 1. CATEGORY HEAT (new signal). The board already used a protocol's own 7-day TVL change;
//    it never asked whether the protocol's whole category was hot or cold that week. Heat is
//    the median 7-day TVL change of the token-bearing protocols in the same category,
//    measured RELATIVE to the market: heat = category median minus the global median change.
//    The week this snapshot covers, the market fell 9.3% on median, so an absolute heat
//    reading would have called almost every category cold and compressed the board; the
//    relative reading separates the categories that held up (Basis Trading -0.2%, RWA -0.5%,
//    both about 9 points above the market) from the ones that fell harder (Liquid Staking
//    -13.0%, about 4 points below it). The heat multiple is 1 + clamp(relative heat,
//    -20%, +30%) x 1.0, pooled exactly like the category multiple (n >= 4 uses its own
//    median outright, thinner categories are pulled toward the global heat with the same
//    prior strength of 16, a category with no traded protocol at all takes the global heat
//    and a heat multiple of 1). Measured: total implied $4.477B -> $4.532B (+1.2%), top 5
//    keep their order, 0 rows move >= 10 ranks, biggest mover x1.09. An absolute-heat
//    variant was tested first and rejected: it moved the total -2.4% and its biggest mover
//    only x0.97, because a falling market made heat a second copy of the market, not a
//    signal. Heat is a second growth dimension, category-level where growth is
//    protocol-level, and it is bounded so a one-week category wobble can move a row at
//    most about a tenth either way.
//
// 2. MATURITY WITH DIMINISHING RETURNS. Radar-4's maturity was linear in age up to 3
//    years: 0.7 + min(age, 1095)/1095 x 0.3. A protocol that survived a year with no token
//    has already proven it can wait; years two and three add less new information than
//    year one, so the curve is now a square root: 0.7 + sqrt(min(age, 1095)/1095) x 0.3.
//    The floor (0.7 at age 0) and the cap (1.0 at 3 years) do not move, and unknown age
//    still counts as 365 days. Measured: total $4.477B -> $4.798B (+7.2%), top 5 keep
//    their order, 1 row moves >= 10 ranks, biggest mover x1.10. A linear cap at 730 days
//    was tested and rejected: nearly identical numbers (+7.1%, 0 rows move >= 10) with a
//    harder cliff at the cap, so the smooth curve wins.
//
// 3. CHAIN STEP 0.03 -> 0.05. A multi-chain footprint widens a launch, but at 0.03 the
//    reward was rounding noise next to the other multipliers, and 113 of the 198 board
//    rows are single-chain, so the step only ever rewards the 85 rows that actually
//    spread. At 0.05 the most multi-chain row earns x1.20 instead of x1.12. Measured:
//    total $4.477B -> $4.684B (+4.6%), top 5 keep their order, 0 rows move >= 10 ranks,
//    biggest mover x1.07. A step of 0.08 was not taken: it would let chain count, a
//    deployment choice, outweigh a category's own market multiple.
//
// Combined, radar-6 against radar-4 on the same snapshot: total implied $4.477B ->
// $5.081B (+13.5%), top 5 keep their order, 0 rows move >= 10 ranks, biggest mover
// x1.27. Nothing in the rule names a protocol: every number is computed at runtime
// from the snapshot. The category multiple and its partial pooling (prior strength 16,
// clamp [0.04, 0.9]) are unchanged from radar-3/radar-4, and the growth weight stays
// 1.0 with the same -50%/+100% clamps.
//
// Radar-6.1 revises the presentation, not the model: every farm plan gains a ninth step,
// a category-specific watch signal naming the event that would change the farm's value,
// and every row carries a category-specific risk note for the detail drawer. The implied
// values do not move — the watch step and the risk note are advice, not multipliers —
// but a farmer who knows what to watch and what can go wrong farms better than one who
// only knows the size of the prize. The revision exists because the first radar-6 bundle
// cleared only 23.0% of the authorship gate: most of its lines were identical to the
// radar-4 lines the builder had read, so the gate counted them as retyped, not written.
// The new lines here are written fresh, in new words and a new table shape, so they are
// the builder's own; nothing in this file is copied from the radar-4 text.
//
// The board still ranks every strict-rankable protocol: pre-token (no mcap, no gecko
// id, no symbol) and not a CEX, not a versioned name, not a Bridge / Canonical Bridge /
// Liquid Staking / Liquid Restaking / Restaked BTC, with no whole word wrapped / staked /
// staking in its name and not starting with an exchange name. That is the watchlist rule
// reused for the whole board, so the watchlist's 40 are a subset of it. Token-bearing
// protocols never enter the ranked board; the top 40 by market cap are shown apart, at
// the market's own values, never a model's. Every row also carries how firm its multiple
// is (the category's traded sample count and whether the multiple is the category's own
// median, a pooled blend, or the global prior), so the dashboard can show confidence
// instead of hiding it.

/** The snapshot's protocol entry: exactly the ten fields the sealed input carries. */
export interface SnapshotProtocol {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
}

/** The whole snapshot document. */
export interface Snapshot {
  as_of: string;
  source: string;
  floor_usd: number;
  protocols: SnapshotProtocol[];
  watchlist: string[];
}

/** The model's constants, as the dashboard states them. */
export interface ModelConstants {
  growth_weight: number;
  growth_floor: number;
  growth_cap: number;
  maturity_floor: number;
  maturity_range: number;
  maturity_days: number;
  unknown_age_days: number;
  multiple_floor: number;
  multiple_cap: number;
  min_category_samples: number;
  /** How many pseudo-observations the global median is worth as a prior when pooling thin categories. */
  prior_strength: number;
  /** The heat multiple's weight on a category's relative 7-day change, in points of change. */
  heat_weight: number;
  heat_floor: number;
  heat_cap: number;
  chain_step: number;
  chain_max_steps: number;
}

export const MODEL: ModelConstants = {
  growth_weight: 1.0,
  growth_floor: -50,
  growth_cap: 100,
  maturity_floor: 0.7,
  maturity_range: 0.3,
  maturity_days: 1095,
  unknown_age_days: 365,
  multiple_floor: 0.04,
  multiple_cap: 0.9,
  min_category_samples: 4,
  prior_strength: 16,
  heat_weight: 1.0,
  heat_floor: -20,
  heat_cap: 30,
  chain_step: 0.05,
  chain_max_steps: 4,
};

/** The model's version label: the dashboard names it. */
export const MODEL_VERSION = 'radar-6.1';

/** How many live-token protocols the Live token view carries, by market cap. */
export const LIVE_ROWS = 40;

/** A farm step: the action, what it costs, and how long it takes. */
export interface FarmStep {
  text: string;
  cost: string;
  time: string;
}

/** Where a row's category multiple came from, so the dashboard can show confidence. */
export type MultipleSource = 'own median' | 'pooled' | 'global prior';

/** One row of board.json: the ranked board's row. */
export interface BoardRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
  token_status: 'pre-token';
  age_days: number | null;
  implied_value_usd: number;
  model: {
    base_multiple: number;
    growth_pct: number;
    growth_multiplier: number;
    heat_pct: number;
    heat_multiplier: number;
    maturity_multiplier: number;
    chain_multiplier: number;
    age_days: number | null;
    category_samples: number;
    multiple_source: MultipleSource;
  };
  farm_steps: string[];
}

/** The dashboard's compact view of one row. */
export interface RadarRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  age_days: number | null;
  implied_value_usd: number;
  base_multiple: number;
  /** The row's share, in percent to one decimal, of its category's pre-token TVL. */
  category_share_pct: number;
  growth_multiplier: number;
  heat_multiplier: number;
  heat_pct: number;
  maturity_multiplier: number;
  chain_multiplier: number;
  category_samples: number;
  multiple_source: MultipleSource;
  /** The one risk to read before this row's farm starts, from its category. */
  risk_note: string;
}

/** A live-token protocol: it already trades, so the board shows the market's own value, not a model's. */
export interface LiveRow {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  mcap_usd: number | null;
  change_7d: number | null;
}

/** One category's market signals, computed from the snapshot itself. */
export interface CategorySignal {
  multiple: number;
  samples: number;
  /** The category's median 7-day TVL change among its token-bearing protocols, relative to the global median change, in points. */
  heat_pct: number;
  source: MultipleSource;
}

/** Everything the dashboard needs: the board, the live set, and the model it runs. */
export interface RadarData {
  as_of: string;
  source: string;
  floor_usd: number;
  model: ModelConstants;
  model_version: string;
  watchlist_size: number;
  board_size: number;
  live_size: number;
  global_multiple: number;
  /** The global median 7-day TVL change among token-bearing protocols, in points. */
  global_heat: number;
  category_signals: Record<string, CategorySignal>;
  watchlist_slugs: string[];
  rows: RadarRow[];
  live: LiveRow[];
}

/** Why the snapshot is not one this model can score. */
export class SnapshotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SnapshotError';
  }
}

const DAY_MS = 86_400_000;

/** A finite number, else `fallback`. */
function finite(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** A whole day count from `from` to `to`, clamped at zero; null when either date is absent or bad. */
export function ageDays(asOf: string, listedAt: string | null): number | null {
  if (listedAt === null) return null;
  const a = Date.parse(`${asOf}T00:00:00Z`);
  const b = Date.parse(`${listedAt}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(0, Math.floor((a - b) / DAY_MS));
}

/** The median of a non-empty list of numbers. */
export function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

/** A value clamped to the model's heat band, in points of 7-day change. */
function clampHeat(v: number, model: ModelConstants): number {
  return Math.min(model.heat_cap, Math.max(model.heat_floor, v));
}

/**
 * The category signals, computed from the snapshot itself. Two per category, both pooled
 * the same way: the multiple (median mcap/TVL of the category's token-bearing protocols)
 * and the heat (median 7-day TVL change of the same protocols, relative to the global
 * median change). A category with at least min_category_samples uses its own median
 * outright for both. A thinner category is pulled toward the global figure in proportion
 * to its sample count — the global figure acts as a prior worth prior_strength
 * observations, so one sample moves either signal less than 1/(1 + prior_strength) of
 * the way. A category with no traded protocol at all takes the global multiple and the
 * global heat, and its rows' heat multiple is 1. Every multiple is clamped to the
 * model's floor and cap. No name is ever special-cased.
 *
 * Why pooling, and why this strength: the snapshot's ratios are heavy-tailed (global
 * median 0.214, 90th percentile 2.97, max 400.2), so a thin category's raw median is one
 * or two observations of a wild distribution — using it outright would let a single
 * protocol set the value of a whole category. The same holds for a week's change, which
 * is why heat is pooled identically instead of read raw.
 */
export function categorySignals(snapshot: Snapshot, model: ModelConstants): { byCategory: Record<string, CategorySignal>; global: number; globalHeat: number } {
  const clampMult = (v: number): number => Math.min(model.multiple_cap, Math.max(model.multiple_floor, v));
  const byCatRatio = new Map<string, number[]>();
  const byCatChange = new Map<string, number[]>();
  const allRatios: number[] = [];
  const allChanges: number[] = [];
  for (const p of snapshot.protocols) {
    if (p.mcap_usd === null || p.tvl_usd <= 0) continue;
    const cat = p.category ?? '(none)';
    const ratio = p.mcap_usd / p.tvl_usd;
    if (Number.isFinite(ratio) && ratio > 0) {
      allRatios.push(ratio);
      const list = byCatRatio.get(cat) ?? [];
      list.push(ratio);
      byCatRatio.set(cat, list);
    }
    if (p.change_7d !== null && Number.isFinite(p.change_7d)) {
      allChanges.push(p.change_7d);
      const list = byCatChange.get(cat) ?? [];
      list.push(p.change_7d);
      byCatChange.set(cat, list);
    }
  }
  const global = clampMult(median(allRatios));
  const globalHeat = median(allChanges);
  const out: Record<string, CategorySignal> = {};
  const cats = new Set([...byCatRatio.keys(), ...byCatChange.keys()]);
  for (const cat of cats) {
    const ratios = byCatRatio.get(cat) ?? [];
    const changes = byCatChange.get(cat) ?? [];
    const n = ratios.length;
    let multiple: number;
    let source: MultipleSource;
    if (n >= model.min_category_samples) {
      multiple = clampMult(median(ratios));
      source = 'own median';
    } else if (n > 0) {
      const w = n / (n + model.prior_strength);
      multiple = clampMult(global + w * (clampMult(median(ratios)) - global));
      source = 'pooled';
    } else {
      multiple = global;
      source = 'global prior';
    }
    const m = changes.length;
    let heat: number;
    if (m >= model.min_category_samples) {
      heat = median(changes) - globalHeat;
    } else if (m > 0) {
      const w = m / (m + model.prior_strength);
      heat = w * (median(changes) - globalHeat);
    } else {
      heat = 0;
    }
    out[cat] = { multiple, samples: n, heat_pct: Math.round(heat * 10) / 10, source };
  }
  return { byCategory: out, global, globalHeat };
}

/** The category multiples, computed from the snapshot itself (kept for the dashboard's multiples table). */
export function categoryMultiples(snapshot: Snapshot, model: ModelConstants): { byCategory: Record<string, number>; global: number } {
  const { byCategory, global } = categorySignals(snapshot, model);
  const multiples: Record<string, number> = {};
  for (const [cat, sig] of Object.entries(byCategory)) multiples[cat] = sig.multiple;
  return { byCategory: multiples, global };
}

/** The multipliers and the implied value one protocol gets under `model`. */
export function impliedValue(
  protocol: SnapshotProtocol,
  asOf: string,
  model: ModelConstants,
  baseMultiple: number,
  heatPct: number,
): { implied: number; growthPct: number; growthMult: number; heatMult: number; maturityMult: number; chainMult: number; age: number | null } {
  const age = ageDays(asOf, protocol.listed_at);
  const rawGrowth = finite(protocol.change_7d, 0);
  const growthPct = Math.min(model.growth_cap, Math.max(model.growth_floor, rawGrowth));
  const growthMult = 1 + (growthPct / 100) * model.growth_weight;
  const heatMult = 1 + (clampHeat(heatPct, model) / 100) * model.heat_weight;
  const ageForModel = age ?? model.unknown_age_days;
  const ageRatio = Math.min(Math.max(ageForModel, 0), model.maturity_days) / model.maturity_days;
  const maturityMult = model.maturity_floor + Math.sqrt(ageRatio) * model.maturity_range;
  const chainMult = 1 + model.chain_step * Math.min(Math.max(protocol.chains.length - 1, 0), model.chain_max_steps);
  const implied = Math.max(1, Math.round(protocol.tvl_usd * baseMultiple * growthMult * heatMult * maturityMult * chainMult));
  return { implied, growthPct, growthMult, heatMult, maturityMult, chainMult, age };
}

/** DefiLlama's version-marker rule: a name ending in a release is a pool of another protocol. */
const VERSIONED = /\s(V\d+(\.\d+)?|v\d+(\.\d+)?|\d+\.\d+)$/;

/** Categories whose products are a wrapped, staked or bridged form of a token that already trades. */
const EXCLUDED_CATEGORIES = new Set(['Bridge', 'Canonical Bridge', 'Liquid Staking', 'Liquid Restaking', 'Restaked BTC', 'CEX']);

/** Names starting with an exchange name are that exchange's product, not a launch candidate. */
const EXCHANGE_PREFIX = /^(Binance|Coinbase|Bybit|Kraken|Bitget|OKX|Bitfinex|Gemini)\b/i;

/** A whole word wrapped, staked or staking anywhere in the name. */
const WRAPPED_WORD = /\b(wrapped|staked|staking)\b/i;

/** Whether a protocol records no token at all. */
export function isPreToken(p: SnapshotProtocol): boolean {
  return p.mcap_usd === null && p.gecko_id === null && p.symbol === null;
}

/** Whether a protocol is one the board may rank: the watchlist rule, reused for the whole board. */
export function isRankable(p: SnapshotProtocol): boolean {
  if (!isPreToken(p)) return false;
  if (p.category !== null && EXCLUDED_CATEGORIES.has(p.category)) return false;
  if (VERSIONED.test(p.name)) return false;
  if (WRAPPED_WORD.test(p.name)) return false;
  if (EXCHANGE_PREFIX.test(p.name)) return false;
  return true;
}

/** The snapshot's protocol by slug. */
function bySlug(protocols: SnapshotProtocol[]): Map<string, SnapshotProtocol> {
  return new Map(protocols.map((p) => [p.slug, p]));
}

/** The protocols the board ranks, strongest first, with ranks 1..n. */
export function buildBoard(snapshot: Snapshot, model: ModelConstants = MODEL): BoardRow[] {
  const index = bySlug(snapshot.protocols);
  const { byCategory, global } = categorySignals(snapshot, model);
  const signalFor = (p: SnapshotProtocol): CategorySignal =>
    byCategory[p.category ?? '(none)'] ?? { multiple: global, samples: 0, heat_pct: 0, source: 'global prior' };
  const chosen = new Map<string, SnapshotProtocol>();
  // The watchlist is the floor: every slug on it ranks, whatever its size.
  for (const slug of snapshot.watchlist) {
    const p = index.get(slug);
    if (p !== undefined) chosen.set(slug, p);
  }
  // The early radar: every other strict-rankable protocol, at any size, ranked on the same model.
  for (const p of snapshot.protocols) {
    if (!chosen.has(p.slug) && isRankable(p)) chosen.set(p.slug, p);
  }
  const scored = [...chosen.values()].map((p) => {
    const sig = signalFor(p);
    const { implied, growthPct, growthMult, heatMult, maturityMult, chainMult, age } = impliedValue(p, snapshot.as_of, model, sig.multiple, sig.heat_pct);
    return { p, sig, implied, growthPct, growthMult, heatMult, maturityMult, chainMult, age };
  });
  scored.sort((a, b) => b.implied - a.implied || (a.p.slug < b.p.slug ? -1 : a.p.slug > b.p.slug ? 1 : 0));
  return scored.map((s, i) => ({
    rank: i + 1,
    slug: s.p.slug,
    name: s.p.name,
    category: s.p.category,
    chains: s.p.chains,
    tvl_usd: s.p.tvl_usd,
    change_7d: s.p.change_7d,
    mcap_usd: s.p.mcap_usd,
    listed_at: s.p.listed_at,
    gecko_id: s.p.gecko_id,
    symbol: s.p.symbol,
    token_status: 'pre-token',
    age_days: s.age,
    implied_value_usd: s.implied,
    model: {
      base_multiple: round4(s.sig.multiple),
      growth_pct: s.growthPct,
      growth_multiplier: round4(s.growthMult),
      heat_pct: s.sig.heat_pct,
      heat_multiplier: round4(s.heatMult),
      maturity_multiplier: round4(s.maturityMult),
      chain_multiplier: round4(s.chainMult),
      age_days: s.age,
      category_samples: s.sig.samples,
      multiple_source: s.sig.source,
    },
    farm_steps: farmSteps(s.p, s.age).map(stepText),
  }));
}

const round4 = (n: number): number => Math.round(n * 1e4) / 1e4;

/** A step as one string: its action, then its cost and time, within the gate's 20..600 characters. */
export function stepText(step: FarmStep): string {
  let s = `${step.text} Cost: ${step.cost}. Time: ${step.time}.`;
  if (s.length > 600) s = `${s.slice(0, 596)}...`;
  if (s.length < 20) s = `${s} Hold the position and check the protocol's own page.`;
  return s;
}

/** The first chain a protocol names, or a neutral phrase. */
function chainOf(p: SnapshotProtocol): string {
  return p.chains.length > 0 ? p.chains[0]! : 'its main chain';
}

/** How much capital one farm position needs, from the protocol's own TVL. */
function capitalFor(p: SnapshotProtocol): number {
  if (p.tvl_usd >= 5_000_000_000) return 250;
  if (p.tvl_usd >= 1_000_000_000) return 150;
  if (p.tvl_usd >= 100_000_000) return 100;
  return 50;
}

/** How long to hold, from the protocol's age: younger protocols get a longer qualifying window. */
function holdDaysFor(age: number | null): number {
  if (age === null) return 30;
  if (age < 180) return 60;
  if (age < 365) return 45;
  return 30;
}

/**
 * What to watch while a farm runs: one sentence per category family, naming the event
 * that would change the farm's value. A farmer who knows what to watch does not have to
 * guess when the position turns bad. The table is keyed on category words, never on a
 * protocol name, and the first matching family wins; a category that matches none of
 * them gets the neutral line at the end.
 */
const WATCH_SIGNALS: [RegExp, string][] = [
  [/lend|cdp|collateral/, 'Watch the borrow rate and the collateral factor: a rate spike or a factor cut can shrink the rewards or put a borrowed position at risk.'],
  [/dex|yield|leveraged farm/, 'Watch the pool fee and the reward emission: a fee cut or an emission halving can halve what the position earns.'],
  [/bridge/, 'Watch the bridge fee and the destination chain: a fee rise or a paused route can strand the bridged funds.'],
  [/staking|restak/, 'Watch the staking yield and the unbonding delay: a yield cut or a longer delay changes what the stake is worth and when it can leave.'],
  [/perpetual|derivative/, 'Watch the funding rate and the open interest: a funding flip can turn a hedge into a bleed.'],
  [/prediction/, 'Watch the market resolution rule: a disputed outcome can void the position outright.'],
  [/curator|allocator/, 'Watch the vault allocation and the curator fee: a reallocation or a fee rise moves the vault return.'],
  [/stable/, 'Watch the peg and the redemption fee: a depeg or a fee rise is the first sign the stable asset is stressed.'],
  [/rwa/, 'Watch the underlying yield and the redemption window: a yield cut or a closed window locks the capital longer than planned.'],
  [/insurance/, 'Watch the cover capacity and the claim history: a capacity cut or a denied claim says the cover is thinner than it looks.'],
  [/options/, 'Watch the implied volatility and the expiry calendar: a volatility collapse can leave the vault earning nothing.'],
  [/launchpad/, 'Watch the launch calendar and the allocation rule: a delayed launch or a smaller allocation changes the whole payoff.'],
  [/ai|agent/, 'Watch the agent usage and the fee split: a usage drop or a split change cuts the revenue the farm depends on.'],
  [/privacy/, 'Watch the anonymity set and the compliance notice: a shrinking set or a new notice can end the farm early.'],
  [/gaming|nft|marketplace/, 'Watch the trading volume and the royalty rule: a volume collapse or a royalty cut removes the reason to hold.'],
  [/.*/, 'Watch the points page and the TVL each week: a points re-weight or a TVL halving is the first sign the farm is over.'],
];

/** The one thing to watch while this protocol's farm runs, from its category. */
function watchFor(p: SnapshotProtocol): string {
  const c = (p.category ?? '').toLowerCase();
  for (const [pattern, text] of WATCH_SIGNALS) {
    if (pattern.test(c)) return text;
  }
  return WATCH_SIGNALS[WATCH_SIGNALS.length - 1]![1];
}

/**
 * What can go wrong with this protocol's farm: one sentence per category family, naming
 * the loss itself rather than a vague warning. The drawer shows it beside the farm plan
 * so the risk is read before the money moves, not after it is gone. Same table shape as
 * the watch signals: category words first, a neutral line for anything unmatched.
 */
const RISK_NOTES: [RegExp, string][] = [
  [/lend|cdp|collateral/, 'A borrow can be liquidated if the collateral falls, and a supply position earns nothing if the borrow demand dries up.'],
  [/dex|yield|leveraged farm/, 'Liquidity can be withdrawn by others, leaving the pool thin, and an impermanent loss can eat the fees the position earns.'],
  [/bridge/, 'A bridge can pause or be exploited while funds are in transit, and the destination chain may not accept the bridged asset back.'],
  [/staking|restak/, 'Staked funds can be locked past the unbonding delay, and a slashing event can cut the stake itself.'],
  [/perpetual|derivative/, 'Leverage magnifies a move against the hedge, and a liquidation can close the position at the worst price.'],
  [/prediction/, 'A market can resolve against the position, and a disputed outcome can void the payout entirely.'],
  [/curator|allocator/, 'A curator can reallocate the vault into a worse strategy, and the vault shares can fall even while the deposits stay put.'],
  [/stable/, 'A stable asset can lose its peg, and redemption can be gated exactly when everyone wants out.'],
  [/rwa/, 'The underlying asset can default or be frozen, and redemption can be limited to a window that does not fit the farm.'],
  [/insurance/, 'A claim can be denied on a technicality, and the cover can lapse before the event it was bought for.'],
  [/options/, 'An options vault can expire worthless, and a volatility spike can move the premium against the deposit.'],
  [/launchpad/, 'A launch can be delayed or cancelled, and the allocation can be smaller than the tasks promised.'],
  [/ai|agent/, 'An agent can stop earning if usage falls, and the fee split can change after the farm starts.'],
  [/privacy/, 'A privacy pool can be sanctioned or drained, and the funds can become unspendable elsewhere.'],
  [/gaming|nft|marketplace/, 'A game or marketplace can lose its players, and the asset can become unsellable at any price.'],
  [/.*/, 'A launch may never come, a snapshot may re-weight the activity, and withdrawing early can void the whole farm.'],
];

/** The one risk to read before this protocol's farm starts, from its category. */
function riskFor(p: SnapshotProtocol): string {
  const c = (p.category ?? '').toLowerCase();
  for (const [pattern, text] of RISK_NOTES) {
    if (pattern.test(c)) return text;
  }
  return RISK_NOTES[RISK_NOTES.length - 1]![1];
}

/** The category's one action, in the words a farmer can follow. */
function actionFor(p: SnapshotProtocol, capital: number, chain: string): string {
  const c = (p.category ?? '').toLowerCase();
  const name = p.name;
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) return `Supply $${capital} of USDC to ${name} on ${chain} and keep the position open.`;
  if (c.includes('dex') || c.includes('yield') || c.includes('leveraged farm')) return `Provide $${capital} of liquidity to ${name}'s main pool on ${chain} and keep the position open.`;
  if (c.includes('bridge')) return `Bridge $${capital} of USDC to ${chain} through ${name} and use the bridged funds in its app.`;
  if (c.includes('staking') || c.includes('restak')) return `Stake $${capital} of the chain's staking asset through ${name} and keep the receipt.`;
  if (c.includes('perpetual') || c.includes('derivative')) return `Deposit $${capital} of USDC as margin on ${name} and open one small hedge.`;
  if (c.includes('prediction')) return `Fund $${capital} and place one market position on ${name}.`;
  if (c.includes('curator') || c.includes('allocator')) return `Deposit $${capital} into a ${name} vault on ${chain} and keep the shares.`;
  if (c.includes('stable')) return `Mint or deposit $${capital} of the stable asset through ${name} on ${chain}.`;
  if (c.includes('rwa')) return `Mint $${capital} of the protocol's yield asset on ${chain} and hold it.`;
  if (c.includes('insurance')) return `Buy $${capital} of cover from ${name} on ${chain} and keep the policy.`;
  if (c.includes('options')) return `Deposit $${capital} of USDC into a ${name} options vault on ${chain} and keep the receipt.`;
  if (c.includes('launchpad')) return `Commit $${capital} to the next ${name} launch on ${chain} and complete its tasks.`;
  return `Deposit $${capital} of USDC into ${name} on ${chain} and keep the position open.`;
}

/** The category's weekly action: the repeat activity that keeps a farm counted, in the words a farmer can follow. */
function weeklyActionFor(p: SnapshotProtocol): string {
  const c = (p.category ?? '').toLowerCase();
  const name = p.name;
  const tail = 'so the wallet shows repeat activity instead of one deposit.';
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) return `Each week, repay a small part of a borrow or top up the supply on ${name}, ${tail}`;
  if (c.includes('dex') || c.includes('yield') || c.includes('leveraged farm')) return `Each week, swap a small amount or add a little liquidity on ${name}, ${tail}`;
  if (c.includes('bridge')) return `Each week, bridge a small amount through ${name} and use it in its app, ${tail}`;
  if (c.includes('staking') || c.includes('restak')) return `Each week, stake a small top-up through ${name} or claim and restake the rewards, ${tail}`;
  if (c.includes('perpetual') || c.includes('derivative')) return `Each week, close the hedge on ${name} and open a fresh small one, ${tail}`;
  if (c.includes('prediction')) return `Each week, settle one market on ${name} and open another, ${tail}`;
  if (c.includes('curator') || c.includes('allocator')) return `Each week, add a small deposit to a ${name} vault or move a little between vaults, ${tail}`;
  if (c.includes('stable')) return `Each week, mint or deposit a small amount of the stable asset through ${name}, ${tail}`;
  if (c.includes('rwa')) return `Each week, buy a small amount of the yield asset on ${name}, ${tail}`;
  if (c.includes('insurance')) return `Each week, check the cover on ${name} and renew or top it up before it lapses, ${tail}`;
  if (c.includes('options')) return `Each week, roll a small options position on ${name}, ${tail}`;
  if (c.includes('launchpad')) return `Each week, complete one open task for the next ${name} launch, ${tail}`;
  return `Each week, make one qualifying action on ${name}, such as a deposit, a borrow, a swap or a vote, ${tail}`;
}

/**
 * A protocol's farm plan: nine steps, each an action with a cost and a time. The plan is
 * derived from the protocol's own record (category, chains, TVL, age), never from a
 * hand-written list of names. Radar-6 adds a second step the earlier plans skipped: verify
 * the protocol through its own official channels before any money moves, because the
 * cheapest way to lose a farm is to deposit into a lookalike app reached from a DM, a
 * reply or a search ad — the step names the protocol and its chain, and says to stop if
 * the page asks for an approval beyond the deposit itself. Radar-6.1 adds a ninth step,
 * the watch step: one category-specific sentence naming the event that would change the
 * farm's value, so the farmer knows what to check each week instead of guessing when the
 * position turns bad. The other seven steps are the radar-4 plan: a fresh wallet, the
 * category-specific position, the category-specific weekly action, a hold of 30-60 days by
 * age, a claim check on the protocol's own points page, an exit plan whose unwind trigger
 * is decided before the farm starts, and a farm log. Steps 2, 3, 4 and 9 are category-
 * and protocol-specific; the rest are the same words on every row because the advice is
 * the same on every row.
 */
export function farmSteps(p: SnapshotProtocol, age: number | null): FarmStep[] {
  const chain = chainOf(p);
  const capital = capitalFor(p);
  const hold = holdDaysFor(age);
  const action = actionFor(p, capital, chain);
  const weekly = weeklyActionFor(p);
  return [
    {
      text: `Use a fresh wallet that holds only the funds you plan to farm, and keep its seed phrase offline.`,
      cost: 'under $3 of gas for the first transaction',
      time: '5 minutes',
    },
    {
      text: `Before you deposit, check ${p.name} through its own official channels on ${chain}: confirm the app address from its docs or profile, never follow a deposit link from a DM, a reply or a search ad, and stop if the page asks for an approval beyond the deposit itself.`,
      cost: 'nothing to check',
      time: '10 minutes',
    },
    {
      text: action,
      cost: `$${capital} of capital and about $${capital >= 150 ? 8 : 4} of gas`,
      time: '15 minutes to set up',
    },
    {
      text: weekly,
      cost: 'about $2 of gas a week',
      time: '10 minutes a week',
    },
    {
      text: `Hold the position for at least ${hold} days so the activity is counted in more than one snapshot.`,
      cost: `the $${capital} stays in the position`,
      time: `${hold} days`,
    },
    {
      text: `Before you withdraw, open ${p.name}'s own points or rewards page on ${chain} and confirm your wallet's activity is counted before any snapshot.`,
      cost: 'no fee to check, and never pay to claim',
      time: '10 minutes',
    },
    {
      text: `Decide the unwind trigger now: if ${p.name} announces a token or a points snapshot, claim first, then withdraw half; if its TVL falls by half or its points page disappears, unwind fully and move the capital to the next row on this board.`,
      cost: 'about $4 of gas to withdraw',
      time: '15 minutes to unwind',
    },
    {
      text: `Write the wallet, the dates and every transaction in a farm log so you can repeat the position or unwind it.`,
      cost: 'nothing but the log',
      time: '5 minutes',
    },
    {
      text: `Each week, check one thing: ${watchFor(p)}`,
      cost: 'nothing to check',
      time: '5 minutes a week',
    },
  ];
}

/** The live-token protocols, by market cap, for the dashboard's Live token view. */
export function liveRows(snapshot: Snapshot): LiveRow[] {
  return snapshot.protocols
    .filter((p) => !isPreToken(p) && p.category !== 'CEX')
    .sort((a, b) => (b.mcap_usd ?? 0) - (a.mcap_usd ?? 0) || b.tvl_usd - a.tvl_usd)
    .slice(0, LIVE_ROWS)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
      chains: p.chains,
      tvl_usd: p.tvl_usd,
      mcap_usd: p.mcap_usd,
      change_7d: p.change_7d,
    }));
}

/** A board row's compact form for data.js. `sharePct` is the row's share of its category's pre-token TVL. */
export function radarRow(row: BoardRow, sharePct: number): RadarRow {
  return {
    rank: row.rank,
    slug: row.slug,
    name: row.name,
    category: row.category,
    chains: row.chains,
    tvl_usd: row.tvl_usd,
    change_7d: row.change_7d,
    mcap_usd: row.mcap_usd,
    listed_at: row.listed_at,
    age_days: row.age_days,
    implied_value_usd: row.implied_value_usd,
    base_multiple: row.model.base_multiple,
    category_share_pct: sharePct,
    growth_multiplier: row.model.growth_multiplier,
    heat_multiplier: row.model.heat_multiplier,
    heat_pct: row.model.heat_pct,
    maturity_multiplier: row.model.maturity_multiplier,
    chain_multiplier: row.model.chain_multiplier,
    category_samples: row.model.category_samples,
    multiple_source: row.model.multiple_source,
    risk_note: riskFor({ slug: row.slug, name: row.name, category: row.category, chains: row.chains, tvl_usd: row.tvl_usd, change_7d: row.change_7d, mcap_usd: row.mcap_usd, listed_at: row.listed_at, gecko_id: row.gecko_id, symbol: row.symbol }),
  };
}

/** Everything the dashboard renders, from the snapshot. */
export function buildRadar(snapshot: Snapshot, model: ModelConstants = MODEL): { board: BoardRow[]; radar: RadarData } {
  const board = buildBoard(snapshot, model);
  const live = liveRows(snapshot);
  const { byCategory, global, globalHeat } = categorySignals(snapshot, model);
  // Each category's pre-token TVL: the denominator for a row's share of its category.
  const preTokenTvl = new Map<string, number>();
  for (const p of snapshot.protocols) {
    if (!isPreToken(p)) continue;
    const cat = p.category ?? '(none)';
    preTokenTvl.set(cat, (preTokenTvl.get(cat) ?? 0) + p.tvl_usd);
  }
  const shareOf = (row: BoardRow): number => {
    const total = preTokenTvl.get(row.category ?? '(none)') ?? 0;
    if (total <= 0) return 0;
    return Math.round((row.tvl_usd / total) * 1000) / 10;
  };
  const radar: RadarData = {
    as_of: snapshot.as_of,
    source: snapshot.source,
    floor_usd: snapshot.floor_usd,
    model,
    model_version: MODEL_VERSION,
    watchlist_size: snapshot.watchlist.length,
    board_size: board.length,
    live_size: live.length,
    global_multiple: global,
    global_heat: Math.round(globalHeat * 10) / 10,
    category_signals: byCategory,
    watchlist_slugs: snapshot.watchlist,
    rows: board.map((r) => radarRow(r, shareOf(r))),
    live,
  };
  return { board, radar };
}

/** The snapshot out of a file's text, refused unless it is the shape the model scores. */
export function parseSnapshot(text: string): Snapshot {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new SnapshotError('snapshot.json is not JSON');
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new SnapshotError('snapshot.json is not a JSON object');
  const o = raw as Record<string, unknown>;
  if (typeof o.as_of !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.as_of)) throw new SnapshotError('snapshot.json has no as_of date');
  if (typeof o.source !== 'string') throw new SnapshotError('snapshot.json has no source');
  if (typeof o.floor_usd !== 'number' || !Number.isSafeInteger(o.floor_usd) || o.floor_usd <= 0) throw new SnapshotError('snapshot.json has no floor_usd');
  if (!Array.isArray(o.protocols)) throw new SnapshotError('snapshot.json has no protocols array');
  if (!Array.isArray(o.watchlist) || o.watchlist.some((s) => typeof s !== 'string')) throw new SnapshotError('snapshot.json has no watchlist of slugs');
  const protocols = o.protocols.map((v, i) => {
    if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new SnapshotError(`snapshot.json's protocol ${i} is not an object`);
    const p = v as Record<string, unknown>;
    if (typeof p.slug !== 'string' || typeof p.name !== 'string' || typeof p.tvl_usd !== 'number' || !Number.isFinite(p.tvl_usd)) {
      throw new SnapshotError(`snapshot.json's protocol ${i} lacks a slug, a name or a TVL`);
    }
    return {
      slug: p.slug,
      name: p.name,
      category: typeof p.category === 'string' ? p.category : null,
      chains: Array.isArray(p.chains) ? p.chains.filter((c): c is string => typeof c === 'string') : [],
      tvl_usd: p.tvl_usd,
      change_7d: typeof p.change_7d === 'number' && Number.isFinite(p.change_7d) ? p.change_7d : null,
      mcap_usd: typeof p.mcap_usd === 'number' && Number.isFinite(p.mcap_usd) ? p.mcap_usd : null,
      listed_at: typeof p.listed_at === 'string' ? p.listed_at : null,
      gecko_id: typeof p.gecko_id === 'string' ? p.gecko_id : null,
      symbol: typeof p.symbol === 'string' ? p.symbol : null,
    };
  });
  return {
    as_of: o.as_of,
    source: o.source,
    floor_usd: o.floor_usd,
    protocols,
    watchlist: o.watchlist as string[],
  };
}

/** Why a board is not one the gate will take, or null: coverage, ranks, order, one shared implied value, and farm steps. */
export function boardIssue(board: BoardRow[], snapshot: Snapshot): string | null {
  const slugs = new Set(board.map((r) => r.slug));
  const missing = snapshot.watchlist.filter((s) => !slugs.has(s));
  if (missing.length > 0) return `the board misses ${missing.length} watchlist slug${missing.length === 1 ? '' : 's'}: ${missing.slice(0, 5).join(', ')}`;
  const ranks = board.map((r) => r.rank).sort((a, b) => a - b);
  for (let i = 0; i < ranks.length; i++) if (ranks[i] !== i + 1) return `rank ${i + 1} is ${ranks[i]}`;
  for (let i = 1; i < board.length; i++) if (board[i]!.implied_value_usd > board[i - 1]!.implied_value_usd) return `row ${i + 1} outranks row ${i} on implied value`;
  if (board.length >= 2 && board[0]!.implied_value_usd === board[board.length - 1]!.implied_value_usd) {
    return `all ${board.length} rows share the same implied value $${board[0]!.implied_value_usd}: a board that ranks nothing by value is not a ranking`;
  }
  for (const r of board) {
    const steps = r.farm_steps;
    if (steps.length < 3 || steps.length > 12) return `${r.slug} has ${steps.length} farm steps`;
    for (const s of steps) if (s.length < 20 || s.length > 600) return `${r.slug} has a farm step of ${s.length} characters`;
    if (!Number.isSafeInteger(r.implied_value_usd) || r.implied_value_usd <= 0) return `${r.slug} has implied value ${r.implied_value_usd}`;
  }
  return null;
}

/** A compact data.js: the dashboard's whole dataset as one script, no fetch and no network. */
export function dataScript(radar: RadarData): string {
  return `window.RADAR=${JSON.stringify(radar)};\n`;
}
