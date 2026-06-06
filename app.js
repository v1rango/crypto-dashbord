const COINS = ['bitcoin', 'ethereum', 'solana', 'binancecoin', 'ripple'];

const IDS = {
  bitcoin:     { priceEl: 'btc-price', changeEl: 'btc-change', sym: 'BTC', name: 'Bitcoin' },
  ethereum:    { priceEl: 'eth-price', changeEl: 'eth-change', sym: 'ETH', name: 'Ethereum' },
  solana:      { priceEl: 'sol-price', changeEl: 'sol-change', sym: 'SOL', name: 'Solana' },
  binancecoin: { priceEl: 'bnb-price', changeEl: 'bnb-change', sym: 'BNB', name: 'BNB' },
  ripple:      { sym: 'XRP', name: 'XRP' },
};

let chart = null;

function updateClock() {
  const now = new Date();

  document.getElementById('clock-tehran').textContent = now.toLocaleTimeString('fa-IR', {
    timeZone: 'Asia/Tehran',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  document.getElementById('clock-ny').textContent = now.toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}
setInterval(updateClock, 1000);
updateClock();

async function fetchPrices() {
  try {
    const ids = COINS.join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
    const res = await fetch(url);
    const data = await res.json();

    COINS.forEach(id => {
      const coin = data[id];
      const info = IDS[id];
      if (!coin || !info.priceEl) return;

      const price = coin.usd;
      const change = coin.usd_24h_change;

      document.getElementById(info.priceEl).textContent = '$' + price.toLocaleString('en-US', { maximumFractionDigits: 2 });

      const changeEl = document.getElementById(info.changeEl);
      changeEl.textContent = (change >= 0 ? '+' : '') + change.toFixed(2) + '%';
      changeEl.className = 'card-sub ' + (change >= 0 ? 'up' : 'down');
    });

    renderCoinList(data);

    const lastUpdate = document.querySelector('.last-update');
    if (lastUpdate) {
      lastUpdate.textContent = 'آخرین آپدیت: ' + new Date().toLocaleTimeString('fa-IR', { timeZone: 'Asia/Tehran' });
    }

  } catch (err) {
    console.error('خطا در دریافت قیمت‌ها:', err);
  }
}

function renderCoinList(data) {
  const list = document.getElementById('coin-list');
  list.innerHTML = '';

  COINS.forEach(id => {
    const coin = data[id];
    const info = IDS[id];
    if (!coin) return;

    const change = coin.usd_24h_change;
    const price = coin.usd;

    list.innerHTML += `
      <div class="coin-row">
        <div class="coin-left">
          <div class="coin-icon">${info.sym.slice(0, 2)}</div>
          <div>
            <div class="coin-name">${info.name}</div>
            <div class="coin-sym">${info.sym}</div>
          </div>
        </div>
        <div class="coin-right">
          <div class="coin-price">$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
          <div class="coin-change ${change >= 0 ? 'up' : 'down'}">${change >= 0 ? '+' : ''}${change.toFixed(2)}%</div>
        </div>
      </div>
    `;
  });

  const p = document.createElement('p');
  p.className = 'last-update';
  list.after(p);
}

async function fetchChart() {
  try {
    const url = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7&interval=daily`;
    const res = await fetch(url);
    const data = await res.json();

    const labels = data.prices.map(p => {
      const d = new Date(p[0]);
      return d.toLocaleDateString('fa-IR', { timeZone: 'Asia/Tehran', month: 'short', day: 'numeric' });
    });

    const prices = data.prices.map(p => Math.round(p[1]));

    const isUp = prices[prices.length - 1] >= prices[0];
    const lineColor = isUp ? '#1D9E75' : '#D85A30';

    const ctx = document.getElementById('priceChart');
    if (chart) chart.destroy();

    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: prices,
          borderColor: lineColor,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: lineColor,
          tension: 0.4,
          fill: true,
          backgroundColor: isUp ? 'rgba(29,158,117,0.08)' : 'rgba(216,90,48,0.08)',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => '$' + ctx.raw.toLocaleString()
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#888', font: { size: 11 } }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: {
              color: '#888',
              font: { size: 11 },
              callback: v => '$' + (v / 1000).toFixed(0) + 'k'
            }
          }
        }
      }
    });

  } catch (err) {
    console.error('خطا در دریافت نمودار:', err);
  }
}

fetchPrices();
fetchChart();

setInterval(fetchPrices, 60 * 60 * 1000);
setInterval(fetchChart, 60 * 60 * 1000);