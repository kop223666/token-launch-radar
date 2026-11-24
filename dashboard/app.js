// Token Radar's plain dashboard. It reads window.RADAR (written beside dashboard/ by main.ts)
// and renders the ranked board, a filterable table, a per-protocol detail drawer with the model's
// own inputs and the protocol's farm plan, plus the live-token view and the model itself.
// No network: every byte it shows is in data.js.
(function () {
  'use strict';

  var DATA = window.RADAR;
  if (!DATA) return;
  var app = document.getElementById('view');
  var detailEl = document.getElementById('detail');
  var state = { q: '', category: 'all', tab: 'board', sort: 'implied', dir: -1, selected: null };

  var usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  function fmtUsd(n) {
    if (n === null || n === undefined || !isFinite(n)) return 'n/a';
    if (Math.abs(n) >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (Math.abs(n) >= 1e3) return '$' + Math.round(n / 1e3) + 'K';
    return usd.format(n);
  }
  function fmtPct(n) {
    if (n === null || n === undefined || !isFinite(n)) return 'n/a';
    return (n > 0 ? '+' : '') + n.toFixed(2) + '%';
  }
  function fmtAge(days) {
    if (days === null || days === undefined) return 'unknown';
    if (days >= 365) return (days / 365).toFixed(1) + 'y';
    return Math.max(0, Math.round(days)) + 'd';
  }
  function fmtMult(n) {
    if (n === null || n === undefined || !isFinite(n)) return 'n/a';
    return '×' + n.toFixed(2);
  }

  // The farm plan is the same derivation main.ts writes to board.json: category, chains, TVL and
  // age decide the action, the capital, the hold and every cost and time. No name is special-cased.
  function chainOf(p) { return p.chains && p.chains.length > 0 ? p.chains[0] : 'its main chain'; }
  function gasUsd(chain) {
    var c = String(chain).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (c === 'ethereum') return 8;
    if (c === 'solana' || c === 'sui' || c === 'aptos' || c === 'polygon') return 1;
    if (c === 'arbitrum' || c === 'optimism' || c === 'base' || c === 'zksyncera' || c === 'linea' || c === 'scroll' || c === 'mantle' || c === 'blast' || c === 'bnbchain' || c === 'bsc' || c === 'avalanche' || c === 'tron' || c === 'fantom' || c === 'gnosis') return 1;
    return 2;
  }
  function capitalFor(p) {
    if (p.tvl_usd >= 5e9) return 250;
    if (p.tvl_usd >= 1e9) return 150;
    if (p.tvl_usd >= 1e8) return 100;
    return 50;
  }
  function holdDaysFor(age) {
    if (age === null || age === undefined) return 30;
    if (age < 180) return 60;
    if (age < 365) return 45;
    return 30;
  }
  function actionFor(p, capital, chain) {
    var c = (p.category || '').toLowerCase();
    var name = p.name;
    if (c.indexOf('lend') >= 0 || c.indexOf('cdp') >= 0 || c.indexOf('collateral') >= 0) return 'Supply $' + capital + ' of USDC to ' + name + ' on ' + chain + ' and keep the position open.';
    if (c.indexOf('dex') >= 0 || c.indexOf('swap') >= 0 || c.indexOf('amm') >= 0) return 'Provide $' + capital + ' of liquidity to ' + name + "'s main pool on " + chain + ' and keep the position open.';
    if (c.indexOf('yield') >= 0 || c.indexOf('leveraged farm') >= 0 || c.indexOf('vault') >= 0) return 'Deposit $' + capital + ' into ' + name + "'s highest-yield vault on " + chain + ' and keep the shares.';
    if (c.indexOf('bridge') >= 0) return 'Bridge $' + capital + ' of USDC to ' + chain + ' through ' + name + ' and use the bridged funds in its app.';
    if (c.indexOf('staking') >= 0 || c.indexOf('restak') >= 0) return "Stake $" + capital + " of the chain's staking asset through " + name + ' and keep the receipt.';
    if (c.indexOf('perpetual') >= 0 || c.indexOf('derivative') >= 0) return 'Deposit $' + capital + ' of USDC as margin on ' + name + ' and open one small hedge.';
    if (c.indexOf('prediction') >= 0) return 'Fund $' + capital + ' and place one market position on ' + name + '.';
    if (c.indexOf('curator') >= 0 || c.indexOf('allocator') >= 0) return 'Deposit $' + capital + ' into a ' + name + ' vault on ' + chain + ' and keep the shares.';
    if (c.indexOf('stable') >= 0) return 'Mint or deposit $' + capital + ' of the stable asset through ' + name + ' on ' + chain + '.';
    if (c.indexOf('rwa') >= 0) return "Mint $" + capital + " of the protocol's yield asset on " + chain + ' and hold it.';
    if (c.indexOf('insurance') >= 0) return 'Buy $' + capital + ' of cover from ' + name + ' on ' + chain + ' and keep the policy.';
    if (c.indexOf('option') >= 0) return 'Deposit $' + capital + ' as collateral and write one covered call on ' + name + ' on ' + chain + '.';
    if (c.indexOf('launchpad') >= 0) return "Commit $" + capital + " to " + name + "'s next launch pool on " + chain + '.';
    if (c.indexOf('payment') >= 0) return 'Route $' + capital + ' of payments through ' + name + ' on ' + chain + '.';
    if (c.indexOf('index') >= 0) return 'Buy $' + capital + " of " + name + "'s index token on " + chain + '.';
    if (c.indexOf('privacy') >= 0) return 'Deposit $' + capital + ' through ' + name + "'s private pool on " + chain + '.';
    if (c.indexOf('nft') >= 0) return 'List or buy one ' + name + ' asset worth about $' + capital + ' on ' + chain + '.';
    if (c.indexOf('governance') >= 0) return 'Lock $' + capital + ' of assets in ' + name + "'s governance on " + chain + '.';
    if (c.indexOf('ai agent') >= 0 || c.indexOf('decentralized ai') >= 0) return 'Fund $' + capital + ' into an agent vault on ' + name + ' on ' + chain + '.';
    if (c.indexOf('chain') >= 0) return 'Bridge $' + capital + ' to ' + chain + ' and use ' + name + "'s native apps.";
    return 'Deposit $' + capital + ' of USDC into ' + name + ' on ' + chain + ' and keep the position open.';
  }
  function stepText(step) {
    var s = step.text + ' Cost: ' + step.cost + '. Time: ' + step.time + '.';
    if (s.length > 600) s = s.slice(0, 596) + '...';
    if (s.length < 20) s = s + " Hold the position and check the protocol's own page.";
    return s;
  }
  function farmSteps(p) {
    var chain = chainOf(p);
    var gas = gasUsd(chain);
    var capital = capitalFor(p);
    var hold = holdDaysFor(p.age_days);
    return [
      { text: 'Use a fresh wallet that holds only the funds you plan to farm, and keep its seed phrase offline.', cost: 'about $' + gas + ' of gas for the first transaction (estimate for ' + chain + ')', time: '5 minutes' },
      { text: actionFor(p, capital, chain), cost: '$' + capital + ' of capital and about $' + gas + ' of gas (estimate)', time: '15 minutes to set up' },
      { text: 'Make one qualifying action each week, such as a deposit, a borrow, a swap or a vote.', cost: 'about $' + gas + ' of gas a week (estimate)', time: '10 minutes a week' },
      { text: 'Hold the position for at least ' + hold + ' days so the activity is counted in more than one snapshot.', cost: 'the $' + capital + ' stays in the position', time: hold + ' days' },
      { text: "Before you withdraw, open the protocol's own points or rewards page and claim only from the link it publishes.", cost: 'no fee to check, and never pay to claim', time: '10 minutes' },
      { text: 'Write the wallet, the dates and every transaction in a farm log so you can repeat the position or unwind it.', cost: 'nothing but the log', time: '5 minutes' }
    ].map(stepText);
  }

  function el(tag, attrs) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else if (k === 'html') node.innerHTML = attrs[k];
        else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2), attrs[k]);
        else if (attrs[k] !== null && attrs[k] !== undefined) node.setAttribute(k, attrs[k]);
      });
    }
    for (var i = 2; i < arguments.length; i++) {
      var child = arguments[i];
      if (child === null || child === undefined) continue;
      if (Array.isArray(child)) child.forEach(function (c) { if (c) node.appendChild(c); });
      else if (typeof child === 'string') node.appendChild(document.createTextNode(child));
      else node.appendChild(child);
    }
    return node;
  }

  function readHash() {
    var hash = window.location.hash.replace(/^#/, '');
    if (!hash) return;
    var params = new URLSearchParams(hash);
    if (params.get('q')) state.q = params.get('q');
    if (params.get('category')) state.category = params.get('category');
    if (params.get('tab')) state.tab = params.get('tab');
    if (params.get('sort')) state.sort = params.get('sort');
    if (params.get('p')) state.selected = params.get('p');
  }
  function writeHash() {
    var params = new URLSearchParams();
    if (state.q) params.set('q', state.q);
    if (state.category !== 'all') params.set('category', state.category);
    if (state.tab !== 'board') params.set('tab', state.tab);
    if (state.sort !== 'implied') params.set('sort', state.sort);
    if (state.selected) params.set('p', state.selected);
    var h = params.toString();
    history.replaceState(null, '', h ? '#' + h : window.location.pathname + window.location.search);
  }

  function filteredRows() {
    var q = state.q.trim().toLowerCase();
    var rows = DATA.rows.filter(function (r) {
      if (state.category !== 'all' && (r.category || 'Uncategorized') !== state.category) return false;
      if (q && r.name.toLowerCase().indexOf(q) < 0 && r.slug.toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    var dir = state.dir;
    var key = state.sort;
    rows.sort(function (a, b) {
      var va, vb;
      if (key === 'implied') { va = a.implied_value_usd; vb = b.implied_value_usd; }
      else if (key === 'tvl') { va = a.tvl_usd; vb = b.tvl_usd; }
      else if (key === 'growth') { va = a.change_7d === null ? -999 : a.change_7d; vb = b.change_7d === null ? -999 : b.change_7d; }
      else if (key === 'age') { va = a.age_days === null ? -1 : a.age_days; vb = b.age_days === null ? -1 : b.age_days; }
      else { va = a.name.toLowerCase(); vb = b.name.toLowerCase(); }
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return a.slug < b.slug ? -1 : 1;
    });
    return rows;
  }

  function sortHeader(label, key, cls) {
    var arrow = state.sort === key ? (state.dir === -1 ? ' ▼' : ' ▲') : '';
    return el('th', { 'class': cls || '', onclick: function () {
      if (state.sort === key) state.dir = -state.dir;
      else { state.sort = key; state.dir = key === 'name' ? 1 : -1; }
      writeHash(); render();
    } }, label + arrow);
  }

  function boardTable(rows) {
    var table = el('table');
    var thead = el('thead', null, el('tr', null,
      sortHeader('Rank', 'implied', 'num'),
      sortHeader('Protocol', 'name'),
      el('th', null, 'Category'),
      el('th', null, 'Chains'),
      sortHeader('TVL', 'tvl', 'num'),
      sortHeader('7d', 'growth', 'num'),
      sortHeader('Age', 'age', 'num'),
      sortHeader('Implied value', 'implied', 'num')
    ));
    var tbody = el('tbody');
    rows.forEach(function (r) {
      var chg = r.change_7d === null ? el('td', { 'class': 'num' }, 'n/a') :
        el('td', { 'class': 'num ' + (r.change_7d >= 0 ? 'up' : 'down') }, fmtPct(r.change_7d));
      var tr = el('tr', { 'class': state.selected === r.slug ? 'selected' : '', onclick: function () { select(r.slug); } },
        el('td', { 'class': 'num rank' }, String(r.rank)),
        el('td', { 'class': 'name' }, r.name, el('small', null, r.slug)),
        el('td', null, el('span', { 'class': 'pill' }, r.category || 'Uncategorized')),
        el('td', null, (r.chains || []).slice(0, 3).join(', ') || '—'),
        el('td', { 'class': 'num' }, fmtUsd(r.tvl_usd)),
        chg,
        el('td', { 'class': 'num' }, fmtAge(r.age_days)),
        el('td', { 'class': 'num value' }, fmtUsd(r.implied_value_usd))
      );
      tbody.appendChild(tr);
    });
    table.appendChild(thead);
    table.appendChild(tbody);
    return table;
  }

  function liveTable() {
    var table = el('table');
    table.appendChild(el('thead', null, el('tr', null,
      el('th', { 'class': 'num' }, '#'),
      el('th', null, 'Protocol'),
      el('th', null, 'Category'),
      el('th', { 'class': 'num' }, 'Market cap'),
      el('th', { 'class': 'num' }, 'TVL'),
      el('th', { 'class': 'num' }, 'Mcap / TVL'),
      el('th', { 'class': 'num' }, '7d')
    )));
    var tbody = el('tbody');
    DATA.live.forEach(function (r, i) {
      tbody.appendChild(el('tr', { onclick: function () {} },
        el('td', { 'class': 'num rank' }, String(i + 1)),
        el('td', { 'class': 'name' }, r.name, el('small', null, r.slug)),
        el('td', null, el('span', { 'class': 'pill' }, r.category || 'Uncategorized')),
        el('td', { 'class': 'num' }, fmtUsd(r.mcap_usd)),
        el('td', { 'class': 'num' }, fmtUsd(r.tvl_usd)),
        el('td', { 'class': 'num' }, fmtMult(r.mcap_tvl_ratio)),
        r.change_7d === null ? el('td', { 'class': 'num' }, 'n/a') :
          el('td', { 'class': 'num ' + (r.change_7d >= 0 ? 'up' : 'down') }, fmtPct(r.change_7d))
      ));
    });
    table.appendChild(tbody);
    return table;
  }

  function modelView() {
    var m = DATA.model;
    var div = el('div');
    div.appendChild(el('p', { 'class': 'note' }, 'The model prices TVL the way the market does. Each category\u2019s multiple is the median market-cap / TVL of the live-token protocols in that category (at least ' + m.min_comparables + ' of them, else the global median of ' + fmtMult(DATA.global_multiple) + '), clamped to [' + m.multiple_min + ', ' + m.multiple_max + ']. No protocol name is ever special-cased.'));
    div.appendChild(el('div', { 'class': 'math' },
      'implied = TVL × category_multiple × growth × maturity × breadth\n' +
      'growth   = 1 + clamp(7d change, ' + m.growth_floor + '%, ' + m.growth_cap + '%) / 100 × ' + m.growth_weight + '\n' +
      'maturity = ' + m.maturity_floor + ' + min(age, ' + m.maturity_days + 'd) / ' + m.maturity_days + ' × ' + m.maturity_range + '\n' +
      'breadth  = 1 + min(chains − 1, ' + m.breadth_max_chains + ') × ' + m.breadth_per_chain));
    div.appendChild(el('h3', null, 'Category multiples used'));
    var table = el('table', { 'class': 'mult-table' });
    table.appendChild(el('thead', null, el('tr', null,
      el('th', null, 'Category'), el('th', { 'class': 'num' }, 'Multiple'), el('th', { 'class': 'num' }, 'Live comparables'))));
    var tbody = el('tbody');
    DATA.multiples.forEach(function (x) {
      tbody.appendChild(el('tr', null,
        el('td', null, x.category),
        el('td', { 'class': 'num' }, fmtMult(x.multiple)),
        el('td', { 'class': 'num' }, String(x.comparables))));
    });
    tbody.appendChild(el('tr', null,
      el('td', null, 'Global fallback (fewer than ' + m.min_comparables + ' comparables)'),
      el('td', { 'class': 'num' }, fmtMult(DATA.global_multiple)),
      el('td', { 'class': 'num' }, '—')));
    table.appendChild(tbody);
    div.appendChild(table);
    div.appendChild(el('p', { 'class': 'note' }, 'Farm plans are derived the same way: the protocol\u2019s category picks the action, its TVL picks the capital, its age picks the hold, its first chain picks the gas estimate. Every step names its cost and its time.'));
    return div;
  }

  function select(slug) {
    state.selected = state.selected === slug ? null : slug;
    writeHash();
    render();
    if (state.selected) detailEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function renderDetail() {
    detailEl.innerHTML = '';
    if (!state.selected) { detailEl.hidden = true; return; }
    var r = null;
    for (var i = 0; i < DATA.rows.length; i++) if (DATA.rows[i].slug === state.selected) { r = DATA.rows[i]; break; }
    if (!r) { detailEl.hidden = true; return; }
    detailEl.hidden = false;
    detailEl.appendChild(el('h2', null, '#' + r.rank + ' ' + r.name));
    detailEl.appendChild(el('p', { 'class': 'tag' }, (r.category || 'Uncategorized') + ' · ' + (r.chains || []).join(', ') + ' · tracked since ' + (r.listed_at || 'unknown') + ' · records no token'));
    var kv = el('div', { 'class': 'kv' });
    kv.appendChild(el('div', null, el('div', { 'class': 'k' }, 'Implied value'), el('div', { 'class': 'v' }, fmtUsd(r.implied_value_usd), el('small', null, 'if its record stayed as it is'))));
    kv.appendChild(el('div', null, el('div', { 'class': 'k' }, 'TVL'), el('div', { 'class': 'v' }, fmtUsd(r.tvl_usd), el('small', null, '7d ' + fmtPct(r.change_7d)))));
    kv.appendChild(el('div', null, el('div', { 'class': 'k' }, 'Age without a token'), el('div', { 'class': 'v' }, fmtAge(r.age_days), el('small', null, 'listed ' + (r.listed_at || 'unknown')))));
    kv.appendChild(el('div', null, el('div', { 'class': 'k' }, 'Category multiple'), el('div', { 'class': 'v' }, fmtMult(r.category_multiple), el('small', null, r.comparables > 0 ? r.comparables + ' live comparables' : 'global fallback'))));
    detailEl.appendChild(kv);
    detailEl.appendChild(el('h3', null, 'How the number is built'));
    detailEl.appendChild(el('div', { 'class': 'math' },
      fmtUsd(r.tvl_usd) + ' TVL × ' + r.category_multiple.toFixed(4) + ' (' + (r.category || 'Uncategorized') + (r.comparables > 0 ? ' median, ' + r.comparables + ' live comparables' : ' has no live comparables, global fallback') + ')\n' +
      '× ' + r.growth_multiplier.toFixed(4) + ' growth (' + fmtPct(r.change_7d) + ' over 7 days)\n' +
      '× ' + r.maturity_multiplier.toFixed(4) + ' maturity (' + fmtAge(r.age_days) + ' with no token)\n' +
      '× ' + r.breadth_multiplier.toFixed(4) + ' breadth (' + (r.chains || []).length + ' chain' + ((r.chains || []).length === 1 ? '' : 's') + ')\n' +
      '= ' + fmtUsd(r.implied_value_usd) + ' implied value'));
    detailEl.appendChild(el('h3', null, 'Farm plan: six steps'));
    var ol = el('ol', { 'class': 'steps' });
    farmSteps(r).forEach(function (s) {
      var idx = s.indexOf(' Cost: ');
      var action = idx >= 0 ? s.slice(0, idx) : s;
      var rest = idx >= 0 ? s.slice(idx + 1) : '';
      ol.appendChild(el('li', null, action + ' ', el('span', { 'class': 'cost' }, rest)));
    });
    detailEl.appendChild(ol);
  }

  function render() {
    var tabs = document.getElementById('tabs');
    var buttons = tabs.querySelectorAll('button');
    buttons.forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-tab') === state.tab); });
    var controls = document.getElementById('controls');
    controls.style.display = state.tab === 'board' ? 'flex' : 'none';
    app.innerHTML = '';
    if (state.tab === 'live') {
      app.appendChild(el('p', { 'class': 'note' }, 'Protocols whose token already trades, shown at the market\u2019s own value — never mixed into the ranked board. Their market-cap / TVL ratios are the comparables the model calibrates on.'));
      app.appendChild(liveTable());
      document.getElementById('count').textContent = '';
    } else if (state.tab === 'model') {
      app.appendChild(modelView());
      document.getElementById('count').textContent = '';
    } else {
      var rows = filteredRows();
      if (rows.length === 0) {
        app.appendChild(el('div', { 'class': 'empty' }, 'No protocol matches that filter.'));
      } else {
        app.appendChild(boardTable(rows));
      }
      document.getElementById('count').textContent = rows.length + ' of ' + DATA.board_size + ' rows';
    }
    renderDetail();
  }

  function init() {
    var meta = document.getElementById('meta');
    meta.innerHTML = '';
    meta.appendChild(el('div', null, 'Snapshot ', el('b', null, DATA.as_of), ' · ', el('b', null, String(DATA.board_size)), ' rows · ', el('b', null, String(DATA.watchlist_size)), ' on the watchlist'));
    meta.appendChild(el('div', null, 'Model ', el('b', null, DATA.model_version), ' · global multiple ', el('b', null, fmtMult(DATA.global_multiple))));
    var note = document.getElementById('model-note');
    note.innerHTML = '';
    note.appendChild(el('span', null, ''));
    note.appendChild(document.createTextNode('How it ranks: '));
    note.appendChild(el('b', null, 'implied value = TVL × category multiple × growth × maturity × breadth'));
    note.appendChild(document.createTextNode('. The multiple is the median market-cap / TVL of the live-token protocols in the same category, read from this snapshot — never a hardcoded name. Click any row for its arithmetic and its farm plan.'));
    var cats = [];
    DATA.rows.forEach(function (r) { if (cats.indexOf(r.category || 'Uncategorized') < 0) cats.push(r.category || 'Uncategorized'); });
    cats.sort();
    var sel = document.getElementById('category');
    cats.forEach(function (c) { sel.appendChild(el('option', { value: c }, c)); });
    readHash();
    document.getElementById('q').value = state.q;
    sel.value = state.category;
    document.getElementById('sort').value = state.sort;
    document.getElementById('q').addEventListener('input', function (e) { state.q = e.target.value; state.selected = null; writeHash(); render(); });
    sel.addEventListener('change', function (e) { state.category = e.target.value; state.selected = null; writeHash(); render(); });
    document.getElementById('sort').addEventListener('change', function (e) { state.sort = e.target.value; state.dir = state.sort === 'name' ? 1 : -1; writeHash(); render(); });
    document.getElementById('tabs').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-tab]');
      if (!b) return;
      state.tab = b.getAttribute('data-tab');
      state.selected = null;
      writeHash();
      render();
    });
    render();
  }

  init();
})();
