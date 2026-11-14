// Token Launch Radar dashboard: renders window.RADAR (written by main.ts) with no network.
(function () {
  'use strict';
  var R = window.RADAR;
  if (!R) { document.body.textContent = 'No radar data.'; return; }
  var rows = R.rows, live = R.live;
  var watch = {};
  R.watchlist = R.watchlist || [];
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
  var ageTxt = function (d) { return d === null ? '—' : d >= 365 ? (d / 365).toFixed(1) + 'y' : d + 'd'; };
  var maxImp = rows.length ? rows[0].implied_value_usd : 1;
  var totalImp = rows.reduce(function (a, r) { return a + r.implied_value_usd; }, 0);

  // ---- header + stats
  $('asof').textContent = 'Snapshot ' + R.as_of + ' · floor ' + money(R.floor_usd);
  $('src').textContent = 'Source: DefiLlama protocols feed';
  $('stats').innerHTML = [
    ['Watchlist', R.watchlist_size + ' protocols'],
    ['Board', R.board_size + ' ranked'],
    ['Total implied value', money(totalImp)],
    ['Median category multiple', '×' + R.global_multiple.toFixed(3)]
  ].map(function (s) { return '<div class="stat"><b>' + esc(s[0] === 'Total implied value' || s[0] === 'Median category multiple' ? s[1] : s[1].split(' ')[0]) + '</b><span>' + esc(s[0]) + '</span></div>'; }).join('');

  // ---- filter selects
  var cats = {}, chains = {};
  rows.forEach(function (r) { if (r.category) cats[r.category] = 1; r.chains.forEach(function (c) { chains[c] = 1; }); });
  Object.keys(cats).sort().forEach(function (c) { $('cat').appendChild(new Option(c, c)); });
  Object.keys(chains).sort().forEach(function (c) { $('chain').appendChild(new Option(c, c)); });
  // watchlist membership comes from rank data: watchlist slugs are the board's first-page set is unknown here,
  // so the toggle filters on the flag the program writes into each row's slug set below.
  var watchSet = {};
  (R.watchlist_slugs || []).forEach(function (s) { watchSet[s] = 1; });

  // ---- farm steps, regenerated in the page from the same record the model used
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
  function farmSteps(r) {
    var chain = r.chains[0] || 'its main chain', cap = capitalFor(r), hold = holdFor(r);
    var steps = [
      ['Use a fresh wallet that holds only the funds you plan to farm, and keep its seed phrase offline.', 'under $3 of gas for the first transaction', '5 minutes'],
      [actionFor(r, cap, chain), '$' + cap + ' of capital and about $' + (cap >= 150 ? 8 : 4) + ' of gas', '15 minutes to set up'],
      ['Make one qualifying action each week, such as a deposit, a borrow, a swap or a vote.', 'about $2 of gas a week', '10 minutes a week'],
      ['Hold the position for at least ' + hold + ' days so the activity is counted in more than one snapshot.', 'the $' + cap + ' stays in the position', hold + ' days'],
      ['Before you withdraw, open the protocol\'s own points or rewards page and claim only from the link it publishes.', 'no fee to check, and never pay to claim', '10 minutes'],
      ['Write the wallet, the dates and every transaction in a farm log so you can repeat the position or unwind it.', 'nothing but the log', '5 minutes']
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
        (watchSet[r.slug] ? '<span class="tag">WATCHLIST</span>' : '') +
        '<br><span class="chains">' + esc(r.chains.slice(0, 4).join(' · ')) + '</span></td>' +
        '<td class="num">' + money(r.tvl_usd) + '</td><td class="num">' + pct(r.change_7d) + '</td>' +
        '<td class="num">' + ageTxt(r.age_days) + '</td><td class="num">' + money(r.implied_value_usd) + '</td>' +
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

  // ---- model view: category multiples
  $('multrows').innerHTML = Object.keys(R.category_multiples).sort(function (a, b) { return R.category_multiples[b] - R.category_multiples[a]; })
    .map(function (c) { return '<tr><td>' + esc(c) + '</td><td class="num">×' + R.category_multiples[c].toFixed(3) + '</td></tr>'; }).join('') +
    '<tr><td>Global median (prior)</td><td class="num">×' + R.global_multiple.toFixed(3) + '</td></tr>';

  // ---- tabs
  function show(view) {
    ['board', 'live', 'model'].forEach(function (v) {
      $('view-' + v).classList.toggle('hidden', v !== view);
      $('tab-' + v).classList.toggle('active', v === view);
    });
    $('controls').style.display = view === 'board' ? '' : 'none';
    closeDrawer();
  }
  $('tab-board').addEventListener('click', function () { show('board'); });
  $('tab-live').addEventListener('click', function () { show('live'); });
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
      '<span>Chains</span><b>' + esc(r.chains.join(', ')) + '</b>' +
      '<span>TVL</span><b>' + money(r.tvl_usd) + '</b>' +
      '<span>7-day change</span><b>' + (r.change_7d === null ? '—' : (r.change_7d > 0 ? '+' : '') + r.change_7d.toFixed(1) + '%') + '</b>' +
      '<span>Listed</span><b>' + esc(r.listed_at || 'unknown') + ' (' + ageTxt(r.age_days) + ')</b>' +
      '<span>Token</span><b>records no token</b></div>' +
      '<div class="eq"><div><span>TVL × category multiple ×' + r.base_multiple.toFixed(3) + '</span><span>' + money(r.tvl_usd * r.base_multiple) + '</span></div>' +
      '<div><span>Growth ×' + r.growth_multiplier.toFixed(3) + '</span><span>' + (r.change_7d === null ? 'no 7d data' : r.change_7d.toFixed(1) + '%') + '</span></div>' +
      '<div><span>Maturity ×' + r.maturity_multiplier.toFixed(3) + '</span><span>' + ageTxt(r.age_days) + '</span></div>' +
      '<div><span>Chain ×' + r.chain_multiplier.toFixed(3) + '</span><span>' + r.chains.length + ' chain' + (r.chains.length === 1 ? '' : 's') + '</span></div>' +
      '<div class="tot"><span>Implied value</span><span>' + money(r.implied_value_usd) + '</span></div></div>' +
      '<h3>Farm plan — 6 steps</h3><ol class="steps">' + steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +
      '<p class="risk">Risk: an implied value is a model claim, not a promise. A launch may never come, a snapshot may re-weight activity, and withdrawing early can void a farm. Never pay to claim, and never farm with funds you cannot leave locked for the full hold.</p>';
    $('drawer').classList.remove('hidden');
  });

  renderBoard();
})();
