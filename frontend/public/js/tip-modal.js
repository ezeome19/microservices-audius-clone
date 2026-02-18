// Tip Modal Function
if (typeof API_URL === 'undefined') {
    window.API_URL = window.location.origin;
}


window.openTipModal = function (artistId, artistName) {
    // ... rest of the code ...
    // Create modal HTML
    const modalHTML = `
        <div id="tipModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000;">
            <div style="background: var(--bg-card); border-radius: 16px; padding: 32px; max-width: 500px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h2 style="font-size: 1.5rem; font-weight: 700; margin: 0;">
                        <i class="fa-solid fa-gift" style="color: var(--accent-primary); margin-right: 8px;"></i>
                        Tip ${artistName}
                    </h2>
                    <button onclick="closeTipModal()" style="background: none; border: none; color: var(--text-secondary); font-size: 1.5rem; cursor: pointer; padding: 0; width: 32px; height: 32px;">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <p style="color: var(--text-secondary); margin-bottom: 24px; line-height: 1.6;">
                    Show your support by sending a tip. Choose your preferred currency:
                </p>

                <!-- Currency Selection -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                    <button id="nairaBtn" class="currency-btn" onclick="selectCurrency('NGN')" 
                        style="padding: 16px; border: 2px solid var(--border-color); border-radius: 8px; background: var(--bg-secondary); cursor: pointer; transition: all 0.2s;">
                        <div style="font-size: 2rem; margin-bottom: 8px;">₦</div>
                        <div style="font-weight: 600;">Nigerian Naira</div>
                    </button>
                    <button id="usdBtn" class="currency-btn" onclick="selectCurrency('USD')" 
                        style="padding: 16px; border: 2px solid var(--border-color); border-radius: 8px; background: var(--bg-secondary); cursor: pointer; transition: all 0.2s;">
                        <div style="font-size: 2rem; margin-bottom: 8px;">$</div>
                        <div style="font-weight: 600;">US Dollar</div>
                    </button>
                </div>

                <!-- Amount Input -->
                <div style="margin-bottom: 24px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-secondary);">
                        Tip Amount
                    </label>
                    <input type="number" id="tipAmount" placeholder="Enter amount" min="1" 
                        style="width: 100%; padding: 14px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 1rem;">
                </div>

                <!-- Quick Amount Buttons -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 24px;">
                    <button onclick="setTipAmount(500)" class="quick-amount-btn" style="padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-secondary); cursor: pointer; font-weight: 600;">500</button>
                    <button onclick="setTipAmount(1000)" class="quick-amount-btn" style="padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-secondary); cursor: pointer; font-weight: 600;">1,000</button>
                    <button onclick="setTipAmount(2000)" class="quick-amount-btn" style="padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-secondary); cursor: pointer; font-weight: 600;">2,000</button>
                    <button onclick="setTipAmount(5000)" class="quick-amount-btn" style="padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-secondary); cursor: pointer; font-weight: 600;">5,000</button>
                </div>

                <!-- Send Tip Button -->
                <button id="sendTipBtn" onclick="processTip('${artistId}', '${artistName}')" 
                    class="btn btn-primary" style="width: 100%; padding: 16px; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <i class="fa-solid fa-paper-plane"></i> Send Tip
                </button>

                <p style="margin-top: 16px; font-size: 0.85rem; color: var(--text-muted); text-align: center;">
                    <i class="fa-solid fa-shield-halved"></i> Secure payment powered by Flutterwave
                </p>
            </div>
        </div>
    `;

    // Inject modal into page
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Set default currency to Naira
    selectCurrency('NGN');
};

window.closeTipModal = function () {
    const modal = document.getElementById('tipModal');
    if (modal) {
        modal.remove();
    }
};

let selectedCurrency = 'NGN';

window.selectCurrency = function (currency) {
    selectedCurrency = currency;

    // Update button styles
    const nairaBtn = document.getElementById('nairaBtn');
    const usdBtn = document.getElementById('usdBtn');

    if (currency === 'NGN') {
        nairaBtn.style.borderColor = 'var(--accent-primary)';
        nairaBtn.style.background = 'rgba(204, 14, 240, 0.1)';
        usdBtn.style.borderColor = 'var(--border-color)';
        usdBtn.style.background = 'var(--bg-secondary)';
    } else {
        usdBtn.style.borderColor = 'var(--accent-primary)';
        usdBtn.style.background = 'rgba(204, 14, 240, 0.1)';
        nairaBtn.style.borderColor = 'var(--border-color)';
        nairaBtn.style.background = 'var(--bg-secondary)';
    }
};

window.setTipAmount = function (amount) {
    document.getElementById('tipAmount').value = amount;
};

// Helper: Get Cookie
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

window.processTip = async function (artistId, artistName) {
    const amount = document.getElementById('tipAmount').value;

    if (!amount || amount <= 0) {
        alert('Please enter a valid tip amount');
        return;
    }

    try {
        // Call backend to initiate payment
        const response = await fetch(`${API_URL}/api/payment/tips/${artistId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': getCookie('token')
            },
            body: JSON.stringify({
                artistId,
                amount: parseFloat(amount),
                currency: selectedCurrency
            })
        });

        if (response.ok) {
            const data = await response.json();
            // Redirect to Flutterwave payment page
            if (data.paymentLink) {
                window.location.href = data.paymentLink;
            }
        } else {
            const errorData = await response.json();
            alert(`Failed to initiate payment: ${errorData.message || 'Please try again.'}`);
        }
    } catch (error) {
        console.error('Tip processing error:', error);
        alert('An error occurred. Please try again.');
    }
};
