// Token Launch Radar dashboard, radar-6: renders window.RADAR (written by main.ts) with no network.
(function () {
  'use strict';
  var R = window.RADAR;
  if (!R) { document.body.textContent = 'No radar data.'; return; }
  var rows = R.rows, live = R.live;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var money = function (n) {
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    return '$' + n;
  };
  var pct = function (v) {
    if (v === null || v === undefined) return '<span class="flat">—</span>';
    var cls = v > 0 ? 'up' : v < 0 ? 'down' : 'flat';
    return '<span class="' + cls + '">' + (v > 0 ? '+' : '') + v.toFixed(1) + '%</span>';
  };
  var heatTxt = function (v) {
    if (v === null || v === undefined) return '<span class="flat">—</span>';
    var cls = v > 0 ? 'hot' : v < 0 ? 'cold' : 'flat';
    return '<span class="' + cls + '">' + (v > 0 ? '+' : '') + v.toFixed(1) + 'pp</span>';
  };
  var ageTxt = function (d) { return d === null ? '—' : d >= 365 ? (d / 365).toFixed(1) + 'y' : d + 'd'; };
  var maxImp = rows.length ? rows[0].implied_value_usd : 1;
  var totalImp = rows.reduce(function (a, r) { return a + r.implied_value_usd; }, 0);
  var chainSet = {};
  rows.forEach(function (r) { r.chains.forEach(function (c) { chainSet[c] = 1; }); });
  var chainCount = Object.keys(chainSet).length;

  // ---- header + stats
  $('asof').textContent = 'Snapshot ' + R.as_of + ' · floor ' + money(R.floor_usd);
  $('src').textContent = 'Source: DefiLlama protocols feed';
  $('stats').innerHTML = [
    ['Watchlist', R.watchlist_size + ' protocols'],
    ['Board', R.board_size + ' ranked'],
    ['Total implied value', money(totalImp)],
    ['Median category multiple', '×' + R.global_multiple.toFixed(3)],
    ['Chains covered', String(chainCount)]
  ].map(function (s) { return '<div class="stat"><b>' + esc(s[0] === 'Total implied value' || s[0] === 'Median category multiple' ? s[1] : s[1].split(' ')[0]) + '</b><span>' + esc(s[0]) + '</span></div>'; }).join('');

  // ---- filter selects
  var cats = {}, chains = {};
  rows.forEach(function (r) { if (r.category) cats[r.category] = 1; r.chains.forEach(function (c) { chains[c] = 1; }); });
  Object.keys(cats).sort().forEach(function (c) { $('cat').appendChild(new Option(c, c)); });
  Object.keys(chains).sort().forEach(function (c) { $('chain').appendChild(new Option(c, c)); });
  var watchSet = {};
  (R.watchlist_slugs || []).forEach(function (s) { watchSet[s] = 1; });

  // ---- farm steps, regenerated in the page from the same record the model used.
  // These eight steps must match lib/model.ts farmSteps exactly: the detail drawer shows
  // them, and board.json carries the model's own copy.
  function capitalFor(r) { return r.tvl_usd >= 5e9 ? 250 : r.tvl_usd >= 1e9 ? 150 : r.tvl_usd >= 1e8 ? 100 : 50; }
  function holdFor(r) { return r.age_days === null ? 30 : r.age_days < 180 ? 60 : r.age_days < 365 ? 45 : 30; }
  function actionFor(r, cap, chain) {
    var c = (r.category || '').toLowerCase(), n = r.name;
    if (/lend|cdp|collateral/.test(c)) return 'Supply $' + cap + ' of USDC to ' + n + ' on ' + chain + ' and keep the position open.';
    if (/dex|yield|leveraged farm/.test(c)) return 'Provide $' + cap + ' of liquidity to ' + n + '\'s main pool on ' + chain + ' and keep the position open.';
    if (/bridge/.test(c)) return 'Bridge $' + cap + ' of USDC to ' + chain + ' through ' + n + ' and use the bridged funds in its app.';
    if (/staking|restak/.test(c)) return 'Stake $' + cap + ' of the chain\'s staking asset through ' + n + ' and keep the receipt.';
    if (/perpetual|derivative/.test(c)) return 'Deposit $' + cap + ' of USDC as margin on ' + n + ' and open one small hedge.';
    if (/prediction/.test(c)) return 'Fund $' + cap + ' and place one market position on ' + n + '.';
    if (/curator|allocator/.test(c)) return 'Deposit $' + cap + ' into a ' + n + ' vault on ' + chain + ' and keep the shares.';
    if (/stable/.test(c)) return 'Mint or deposit $' + cap + ' of the stable asset through ' + n + ' on ' + chain + '.';
    if (/rwa/.test(c)) return 'Mint $' + cap + ' of the protocol\'s yield asset on ' + chain + ' and hold it.';
    if (/insurance/.test(c)) return 'Buy $' + cap + ' of cover from ' + n + ' on ' + chain + ' and keep the policy.';
    if (/options/.test(c)) return 'Deposit $' + cap + ' of USDC into a ' + n + ' options vault on ' + chain + ' and keep the receipt.';
    if (/launchpad/.test(c)) return 'Commit $' + cap + ' to the next ' + n + ' launch on ' + chain + ' and complete its tasks.';
    return 'Deposit $' + cap + ' of USDC into ' + n + ' on ' + chain + ' and keep the position open.';
  }
  function weeklyActionFor(r) {
    var c = (r.category || '').toLowerCase(), n = r.name;
    var tail = 'so the wallet shows repeat activity instead of one deposit.';
    if (/lend|cdp|collateral/.test(c)) return 'Each week, repay a small part of a borrow or top up the supply on ' + n + ', ' + tail;
    if (/dex|yield|leveraged farm/.test(c)) return 'Each week, swap a small amount or add a little liquidity on ' + n + ', ' + tail;
    if (/bridge/.test(c)) return 'Each week, bridge a small amount through ' + n + ' and use it in its app, ' + tail;
    if (/staking|restak/.test(c)) return 'Each week, stake a small top-up through ' + n + ' or claim and restake the rewards, ' + tail;
    if (/perpetual|derivative/.test(c)) return 'Each week, close the hedge on ' + n + ' and open a fresh small one, ' + tail;
    if (/prediction/.test(c)) return 'Each week, settle one market on ' + n + ' and open another, ' + tail;
    if (/curator|allocator/.test(c)) return 'Each week, add a small deposit to a ' + n + ' vault or move a little between vaults, ' + tail;
    if (/stable/.test(c)) return 'Each week, mint or deposit a small amount of the stable asset through ' + n + ', ' + tail;
    if (/rwa/.test(c)) return 'Each week, buy a small amount of the yield asset on ' + n + ', ' + tail;
    if (/insurance/.test(c)) return 'Each week, check the cover on ' + n + ' and renew or top it up before it lapses, ' + tail;
    if (/options/.test(c)) return 'Each week, roll a small options position on ' + n + ', ' + tail;
    if (/launchpad/.test(c)) return 'Each week, complete one open task for the next ' + n + ' launch, ' + tail;
    return 'Each week, make one qualifying action on ' + n + ', such as a deposit, a borrow, a swap or a vote, ' + tail;
  }
  // What to watch while a farm runs, by category family: the same table as lib/model.ts,
  // so the drawer shows the step the model wrote into board.json.
  var WATCH_SIGNALS = [
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
    [/.*/, 'Watch the points page and the TVL each week: a points re-weight or a TVL halving is the first sign the farm is over.']
  ];
  function watchFor(r) {
    var c = (r.category || '').toLowerCase();
    for (var i = 0; i < WATCH_SIGNALS.length; i++) {
      if (WATCH_SIGNALS[i][0].test(c)) return WATCH_SIGNALS[i][1];
    }
    return WATCH_SIGNALS[WATCH_SIGNALS.length - 1][1];
  }
  function farmSteps(r) {
    var chain = r.chains[0] || 'its main chain', cap = capitalFor(r), hold = holdFor(r);
    var steps = [
      ['Use a fresh wallet that holds only the funds you plan to farm, and keep its seed phrase offline.', 'under $3 of gas for the first transaction', '5 minutes'],
      ['Before you deposit, check ' + r.name + ' through its own official channels on ' + chain + ': confirm the app address from its docs or profile, never follow a deposit link from a DM, a reply or a search ad, and stop if the page asks for an approval beyond the deposit itself.', 'nothing to check', '10 minutes'],
      [actionFor(r, cap, chain), '$' + cap + ' of capital and about $' + (cap >= 150 ? 8 : 4) + ' of gas', '15 minutes to set up'],
      [weeklyActionFor(r), 'about $2 of gas a week', '10 minutes a week'],
      ['Hold the position for at least ' + hold + ' days so the activity is counted in more than one snapshot.', 'the $' + cap + ' stays in the position', hold + ' days'],
      ['Before you withdraw, open ' + r.name + '\'s own points or rewards page on ' + chain + ' and confirm your wallet\'s activity is counted before any snapshot.', 'no fee to check, and never pay to claim', '10 minutes'],
      ['Decide the unwind trigger now: if ' + r.name + ' announces a token or a points snapshot, claim first, then withdraw half; if its TVL falls by half or its points page disappears, unwind fully and move the capital to the next row on this board.', 'about $4 of gas to withdraw', '15 minutes to unwind'],
      ['Write the wallet, the dates and every transaction in a farm log so you can repeat the position or unwind it.', 'nothing but the log', '5 minutes'],
      ['Each week, check one thing: ' + watchFor(r), 'nothing to check', '5 minutes a week']
    ];
    return steps.map(function (s) { return s[0] + ' Cost: ' + s[1] + '. Time: ' + s[2] + '.'; });
  }

  // ---- board render + sort + filter
  var sortKey = 'rank', sortDir = 1;
  function filtered() {
    var q = $('q').value.trim().toLowerCase(), cat = $('cat').value, ch = $('chain').value,
      min = +$('mintvl').value, wo = $('watchonly').checked;
    return rows.filter(function (r) {
      if (q && r.name.toLowerCase().indexOf(q) < 0 && r.slug.toLowerCase().indexOf(q) < 0) return false;
      if (cat && r.category !== cat) return false;
      if (ch && r.chains.indexOf(ch) < 0) return false;
      if (r.tvl_usd < min) return false;
      if (wo && !watchSet[r.slug]) return false;
      return true;
    });
  }
  function srcTag(r) {
    if (r.multiple_source === 'own median') return '';
    return '<span class="src">' + esc(r.multiple_source.toUpperCase()) + '</span>';
  }
  function renderBoard() {
    var list = filtered().slice().sort(function (a, b) {
      var av = a[sortKey], bv = b[sortKey];
      if (av === null) return 1; if (bv === null) return -1;
      var d = (typeof av === 'string' ? av.localeCompare(bv) : av - bv);
      return d * sortDir;
    });
    $('count').textContent = list.length + ' of ' + rows.length + ' shown';
    $('rows').innerHTML = list.map(function (r) {
      var w = Math.max(2, Math.round(r.implied_value_usd / maxImp * 100));
      return '<tr data-slug="' + esc(r.slug) + '"><td class="num">' + r.rank + '</td>' +
        '<td><span class="name">' + esc(r.name) + '</span>' + (r.category ? '<span class="cat">' + esc(r.category) + '</span>' : '') +
        (watchSet[r.slug] ? '<span class="tag">WATCHLIST</span>' : '') + srcTag(r) +
        '<br><span class="chains">' + esc(r.chains.slice(0, 4).join(' · ')) + '</span></td>' +
        '<td class="num">' + money(r.tvl_usd) + '</td><td class="num">' + pct(r.change_7d) + '</td>' +
        '<td class="num">' + heatTxt(r.heat_pct) + '</td>' +
        '<td class="num">' + ageTxt(r.age_days) + '</td><td class="num">×' + r.base_multiple.toFixed(3) + '</td><td class="num">' + money(r.implied_value_usd) + '</td>' +
        '<td class="barcol"><div class="bar"><i style="width:' + w + '%"></i></div></td></tr>';
    }).join('');
  }
  document.querySelectorAll('#board th[data-sort]').forEach(function (th) {
    th.addEventListener('click', function () {
      var k = th.getAttribute('data-sort');
      if (sortKey === k) sortDir = -sortDir; else { sortKey = k; sortDir = k === 'name' ? 1 : -1; }
      renderBoard();
    });
  });
  ['q', 'cat', 'chain', 'mintvl', 'watchonly'].forEach(function (id) {
    $(id).addEventListener('input', renderBoard);
    $(id).addEventListener('change', renderBoard);
  });

  // ---- live view
  $('liverows').innerHTML = live.map(function (p, i) {
    return '<tr><td class="num">' + (i + 1) + '</td><td><span class="name">' + esc(p.name) + '</span>' +
      (p.category ? '<span class="cat">' + esc(p.category) + '</span>' : '') + '</td>' +
      '<td class="num">' + money(p.tvl_usd) + '</td><td class="num">' + (p.mcap_usd ? money(p.mcap_usd) : '—') + '</td>' +
      '<td class="num">' + pct(p.change_7d) + '</td><td class="chains">' + esc(p.chains.slice(0, 4).join(' · ')) + '</td></tr>';
  }).join('');

  // ---- movers view: fastest growers and shrinkers among board rows with 7-day data
  function moverRow(r) {
    return '<tr data-slug="' + esc(r.slug) + '"><td class="num">' + r.rank + '</td>' +
      '<td><span class="name">' + esc(r.name) + '</span>' + (r.category ? '<span class="cat">' + esc(r.category) + '</span>' : '') + '</td>' +
      '<td class="num">' + pct(r.change_7d) + '</td><td class="num">' + money(r.tvl_usd) + '</td>' +
      '<td class="num">' + money(r.implied_value_usd) + '</td></tr>';
  }
  var withChange = rows.filter(function (r) { return r.change_7d !== null; });
  var growers = withChange.slice().sort(function (a, b) { return b.change_7d - a.change_7d; }).slice(0, 10);
  var shrinkers = withChange.slice().sort(function (a, b) { return a.change_7d - b.change_7d; }).slice(0, 10);
  $('growrows').innerHTML = growers.map(moverRow).join('');
  $('shrinkrows').innerHTML = shrinkers.map(moverRow).join('');

  // ---- model view: category signals + categories by total implied value + chains by board TVL
  var sigs = R.category_signals || {};
  var multKeys = Object.keys(sigs).sort(function (a, b) { return sigs[b].multiple - sigs[a].multiple; });
  $('multrows').innerHTML = multKeys.map(function (c) {
    var s = sigs[c];
    return '<tr><td>' + esc(c) + '</td><td class="num">×' + s.multiple.toFixed(3) + '</td>' +
      '<td class="num">' + heatTxt(s.heat_pct) + '</td><td class="num">' + s.samples + '</td><td>' + esc(s.source) + '</td></tr>';
  }).join('') +
    '<tr><td>Global median (prior)</td><td class="num">×' + R.global_multiple.toFixed(3) + '</td><td class="num">' + heatTxt(0) + '</td><td class="num">—</td><td>global prior</td></tr>';
  var catAgg = {};
  rows.forEach(function (r) {
    var c = r.category || '(none)';
    if (!catAgg[c]) catAgg[c] = { n: 0, total: 0, top: r };
    catAgg[c].n += 1; catAgg[c].total += r.implied_value_usd;
  });
  $('catsumrows').innerHTML = Object.keys(catAgg).sort(function (a, b) { return catAgg[b].total - catAgg[a].total; })
    .map(function (c) { return '<tr><td>' + esc(c) + '</td><td class="num">' + catAgg[c].n + '</td><td class="num">' + money(catAgg[c].total) + '</td><td>' + esc(catAgg[c].top.name) + ' (#' + catAgg[c].top.rank + ')</td></tr>'; }).join('');
  var chainAgg = {};
  rows.forEach(function (r) {
    r.chains.forEach(function (c) {
      if (!chainAgg[c]) chainAgg[c] = { n: 0, total: 0 };
      chainAgg[c].n += 1; chainAgg[c].total += r.tvl_usd;
    });
  });
  $('chainsumrows').innerHTML = Object.keys(chainAgg).sort(function (a, b) { return chainAgg[b].total - chainAgg[a].total; }).slice(0, 10)
    .map(function (c) { return '<tr><td>' + esc(c) + '</td><td class="num">' + chainAgg[c].n + '</td><td class="num">' + money(chainAgg[c].total) + '</td></tr>'; }).join('');

  // ---- tabs
  function show(view) {
    ['board', 'live', 'movers', 'model'].forEach(function (v) {
      $('view-' + v).classList.toggle('hidden', v !== view);
      $('tab-' + v).classList.toggle('active', v === view);
    });
    $('controls').style.display = view === 'board' ? '' : 'none';
    closeDrawer();
  }
  $('tab-board').addEventListener('click', function () { show('board'); });
  $('tab-live').addEventListener('click', function () { show('live'); });
  $('tab-movers').addEventListener('click', function () { show('movers'); });
  $('tab-model').addEventListener('click', function () { show('model'); });

  // ---- detail drawer
  function closeDrawer() { $('drawer').classList.add('hidden'); document.querySelectorAll('#rows tr.sel').forEach(function (t) { t.classList.remove('sel'); }); }
  $('close').addEventListener('click', closeDrawer);
  $('rows').addEventListener('click', function (e) {
    var tr = e.target.closest('tr'); if (!tr) return;
    var r = rows.filter(function (x) { return x.slug === tr.getAttribute('data-slug'); })[0];
    if (!r) return;
    document.querySelectorAll('#rows tr.sel').forEach(function (t) { t.classList.remove('sel'); });
    tr.classList.add('sel');
    var steps = farmSteps(r);
    $('detail').innerHTML =
      '<h2>#' + r.rank + ' ' + esc(r.name) + '</h2>' +
      '<div class="kv"><span>Category</span><b>' + esc(r.category || '—') + '</b>' +
      '<span>Category share</span><b>' + r.category_share_pct.toFixed(1) + '% of pre-token ' + esc(r.category || '—') + ' TVL</b>' +
      '<span>Multiple source</span><b>' + esc(r.multiple_source) + ' (' + r.category_samples + ' traded sample' + (r.category_samples === 1 ? '' : 's') + ')</b>' +
      '<span>Chains</span><b>' + esc(r.chains.join(', ')) + '</b>' +
      '<span>TVL</span><b>' + money(r.tvl_usd) + '</b>' +
      '<span>7-day change</span><b>' + (r.change_7d === null ? '—' : (r.change_7d > 0 ? '+' : '') + r.change_7d.toFixed(1) + '%') + '</b>' +
      '<span>Category heat</span><b>' + (r.heat_pct > 0 ? '+' : '') + r.heat_pct.toFixed(1) + ' points vs the market</b>' +
      '<span>Listed</span><b>' + esc(r.listed_at || 'unknown') + ' (' + ageTxt(r.age_days) + ')</b>' +
      '<span>Token</span><b>records no token</b></div>' +
      '<div class="eq"><div><span>TVL × category multiple ×' + r.base_multiple.toFixed(3) + '</span><span>' + money(r.tvl_usd * r.base_multiple) + '</span></div>' +
      '<div><span>Growth ×' + r.growth_multiplier.toFixed(3) + '</span><span>' + (r.change_7d === null ? 'no 7d data' : r.change_7d.toFixed(1) + '%') + '</span></div>' +
      '<div><span>Heat ×' + r.heat_multiplier.toFixed(3) + '</span><span>' + (r.heat_pct > 0 ? '+' : '') + r.heat_pct.toFixed(1) + 'pp vs market</span></div>' +
      '<div><span>Maturity ×' + r.maturity_multiplier.toFixed(3) + '</span><span>' + ageTxt(r.age_days) + '</span></div>' +
      '<div><span>Chain ×' + r.chain_multiplier.toFixed(3) + '</span><span>' + r.chains.length + ' chain' + (r.chains.length === 1 ? '' : 's') + '</span></div>' +
      '<div class="tot"><span>Implied value</span><span>' + money(r.implied_value_usd) + '</span></div></div>' +
      '<h3>Farm plan — 9 steps</h3><ol class="steps">' + steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +
      '<p class="risk">Risk: ' + esc(r.risk_note) + ' An implied value is a model claim, not a promise. Never pay to claim, and never farm with funds you cannot leave locked for the full hold.</p>';
    $('drawer').classList.remove('hidden');
  });

  renderBoard();
})();
