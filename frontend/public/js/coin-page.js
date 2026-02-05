// Artist Coins Page Implementation
window.showCoinPage = function () {
    const tracksContainer = document.getElementById('tracksContainer');
    const feedTitle = document.getElementById('feedTitle');
    const filterEl = document.getElementById('trendingFilters');

    if (filterEl) filterEl.style.display = 'none';
    currentTab = 'coins';

    feedTitle.textContent = 'Artist Coins';

    tracksContainer.innerHTML = `
        <div class="coins-page" style="max-width: 1000px; margin: 0 auto; padding: 20px;">
            <!-- Header -->
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px;">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div style="background: var(--accent-gradient); width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem;">
                        <i class="fa-solid fa-coins"></i>
                    </div>
                    <h1 style="font-size: 2.5rem; font-weight: 900; margin: 0;">Artist Coins</h1>
                </div>
                <div class="search-bar" style="width: 300px;">
                    <input type="text" id="coinSearch" placeholder="Search for artist coins..." 
                           style="width: 100%; border: 1px solid var(--border-color); background: var(--bg-card); padding: 10px 16px; border-radius: 8px; color: var(--text-primary);">
                </div>
            </div>

            <!-- Discover Section -->
            <div style="background: var(--bg-card); border-radius: 16px; padding: 24px; border: 1px solid var(--border-color); margin-bottom: 40px;">
                <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 24px;">Discover Artist Coins</h3>
                
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">
                            <th style="padding: 12px; font-weight: 600;">Coin</th>
                            <th style="padding: 12px; font-weight: 600; text-align: right;">Price</th>
                            <th style="padding: 12px; font-weight: 600; text-align: right;">Volume (24h)</th>
                            <th style="padding: 12px; font-weight: 600; text-align: right;">Market Cap</th>
                            <th style="padding: 12px; font-weight: 600;"></th>
                        </tr>
                    </thead>
                    <tbody id="coinsTableBody">
                        <!-- Placeholder rows -->
                        <tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--text-muted);">Loading artist coins...</td></tr>
                    </tbody>
                </table>
            </div>

            <!-- Your Coins Section -->
            <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 20px;">Your Coins</h3>
            <div id="userCoinsList" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
                <div style="background: var(--bg-card); padding: 24px; border-radius: 12px; border: 1px solid var(--border-color); text-align: center; color: var(--text-muted);">
                    <p>You don't own any artist coins yet.</p>
                </div>
            </div>
        </div>

        <!-- Buy Modal (Swap UI Template) -->
        <div id="buyCoinModal" class="modal" style="display:none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px);">
            <div class="modal-content" style="background: var(--bg-card); margin: 10% auto; padding: 32px; border-radius: 20px; width: 450px; border: 1px solid var(--border-color); position: relative;">
                <span class="close" onclick="closeBuyModal()" style="position: absolute; right: 20px; top: 15px; color: var(--text-muted); cursor: pointer; font-size: 24px;">&times;</span>
                
                <h2 style="font-size: 1.5rem; font-weight: 900; text-align: center; margin-bottom: 32px;">BUY / SELL</h2>
                
                <div style="display: flex; gap: 8px; margin-bottom: 24px;">
                    <button class="btn btn-primary" style="flex: 1; padding: 12px; border-radius: 12px;">Buy</button>
                    <button class="btn btn-secondary" style="flex: 1; padding: 12px; border-radius: 12px;">Sell</button>
                    <button class="btn btn-secondary" style="flex: 1; padding: 12px; border-radius: 12px;">Convert</button>
                </div>

                <!-- Swap Card -->
                <div style="background: var(--bg-secondary); border-radius: 16px; padding: 20px; margin-bottom: 32px; border: 1px solid var(--border-color);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">You Pay</span>
                        <span style="font-size: 0.85rem; color: var(--text-muted);">Available: <span id="userAvailableTokens">$0.00</span></span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <input type="number" id="buyAmount" value="0.00" style="flex: 1; background: transparent; border: none; font-size: 2rem; font-weight: 700; color: var(--text-primary); width: 100%;">
                        <span style="font-weight: 700; color: var(--text-muted);">USD</span>
                        <button style="background: var(--border-color); border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; color: var(--text-secondary); cursor: pointer;">MAX</button>
                    </div>
                    
                    <div style="text-align: center; margin: 16px 0;">
                        <i class="fa-solid fa-arrow-down" style="color: var(--text-muted);"></i>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">You Receive</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <input type="text" id="receiveAmount" readonly value="0.00" style="flex: 1; background: transparent; border: none; font-size: 2rem; font-weight: 700; color: var(--text-primary); width: 100%;">
                        <div style="display: flex; align-items: center; gap: 8px; background: var(--bg-card); padding: 4px 12px; border-radius: 20px; border: 1px solid var(--border-color);">
                            <span id="targetCoinIcon">🪙</span>
                            <span id="targetCoinSymbol" style="font-weight: 700;">COIN</span>
                        </div>
                    </div>
                </div>

                <button class="btn btn-primary" style="width: 100%; padding: 16px; border-radius: 12px; font-size: 1.1rem; font-weight: 800;" id="confirmBuyBtn">
                    Confirm Purchase
                </button>
                
                <p style="text-align: center; margin-top: 16px; font-size: 0.75rem; color: var(--text-muted);">
                    Powered by <span style="font-weight: 700; color: var(--text-primary);">Mercury Payment Engine</span>
                </p>
            </div>
        </div>
    `;

    loadCoinsData();
};

async function loadCoinsData() {
    try {
        // Mock data to start with
        const mockCoins = [
            { rank: 1, name: 'Drake Coins', symbol: 'DRA', price: 20.45, volume: '1.2M', marketCap: '8.5M', change: 5.2 },
            { rank: 2, name: 'The Weeknd', symbol: 'XO', price: 15.12, volume: '800K', marketCap: '6.2M', change: -2.1 },
            { rank: 3, name: 'Electronic', symbol: 'ELE', price: 4.50, volume: '450K', marketCap: '2.1M', change: 12.4 }
        ];

        renderCoinsTable(mockCoins);
    } catch (err) {
        console.error('Failed to load coins data:', err);
    }
}

function renderCoinsTable(coins) {
    const tbody = document.getElementById('coinsTableBody');
    if (!tbody) return;

    tbody.innerHTML = coins.map(coin => `
        <tr style="border-bottom: 1px solid var(--border-color); transition: background 0.2s; cursor: pointer;" onmouseover="this.style.background='var(--bg-secondary)'" onmouseout="this.style.background='transparent'">
            <td style="padding: 16px 12px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 0.8rem; color: var(--text-muted); min-width: 20px;">${coin.rank}</span>
                    <div style="width: 40px; height: 40px; background: var(--accent-gradient); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700;">
                        ${coin.symbol.charAt(0)}
                    </div>
                    <div>
                        <p style="margin: 0; font-weight: 700;">${coin.symbol}</p>
                        <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted);">${coin.name}</p>
                    </div>
                </div>
            </td>
            <td style="padding: 16px 12px; text-align: right; font-weight: 600;">$${coin.price}</td>
            <td style="padding: 16px 12px; text-align: right; color: var(--text-muted);">$${coin.volume}</td>
            <td style="padding: 16px 12px; text-align: right; font-weight: 600;">$${coin.marketCap}</td>
            <td style="padding: 16px 12px; text-align: right;">
                <button class="btn btn-secondary" style="padding: 6px 16px; font-size: 0.85rem; border-radius: 8px;" onclick="openBuyModal('${coin.symbol}', ${coin.price})">Buy</button>
            </td>
        </tr>
    `).join('');
}

window.openBuyModal = function (symbol, price) {
    const modal = document.getElementById('buyCoinModal');
    if (!modal) return;

    document.getElementById('targetCoinSymbol').textContent = symbol;
    document.getElementById('targetCoinIcon').textContent = symbol === 'XO' ? '❤️' : '🪙';

    const buyInput = document.getElementById('buyAmount');
    const receiveInput = document.getElementById('receiveAmount');

    buyInput.oninput = () => {
        const val = parseFloat(buyInput.value);
        if (isNaN(val)) receiveInput.value = '0.00';
        else receiveInput.value = (val / price).toFixed(2);
    };

    modal.style.display = 'block';
};

window.closeBuyModal = function () {
    const modal = document.getElementById('buyCoinModal');
    if (modal) modal.style.display = 'none';
};

// Close modal when clicking outside
window.onclick = function (event) {
    const modal = document.getElementById('buyCoinModal');
    if (event.target == modal) {
        closeBuyModal();
    }
}
