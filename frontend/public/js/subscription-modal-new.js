// Replace the existing showSubscriptionModal and subscribeToTier functions with these

// Helper function to get cookie by name
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

window.showSubscriptionModal = function () {
    const modal = document.createElement('div');
    modal.className = 'custom-modal-overlay subscription-modal-overlay';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 10000;';

    modal.innerHTML = `
        <div class="custom-modal subscription-modal-horizontal" style="background: var(--bg-card); border-radius: 24px; max-width: 1400px; width: 95%; max-height: 90vh; overflow-y: auto; padding: 40px; position: relative;">
            <button class="modal-close-x" id="closeSubModal" style="position: absolute; top: 20px; right: 20px; background: none; border: none; color: white; font-size: 32px; cursor: pointer; opacity: 0.7; transition: opacity 0.3s;">&times;</button>
            
            <h2 style="text-align: center; font-size: 2.5rem; margin: 0 0 10px 0; background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Choose Your Plan</h2>
            <p class="modal-subtitle" style="text-align: center; color: #888; margin-bottom: 40px; font-size: 1.1rem;">Unlock unlimited streaming and exclusive features</p>
            
            <div class="subscription-plans-horizontal" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin: 30px 0;">
                <!-- DAILY PLAN -->
                <div class="plan-card" data-tier="daily" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 2px solid #2a2a3e; border-radius: 16px; padding: 24px; position: relative; transition: all 0.3s ease; cursor: pointer;">
                    <div class="plan-badge" style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #7c3aed; color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: bold; letter-spacing: 0.5px;">24 HOURS</div>
                    <h3 style="text-align: center; font-size: 24px; margin: 20px 0 10px; color: #fff;">Daily</h3>
                    <div class="plan-price" style="text-align: center; margin: 15px 0;">
                        <span class="price-ngn" style="display: block; font-size: 28px; font-weight: bold; color: #7c3aed;">₦500</span>
                        <span class="price-usd" style="display: block; font-size: 16px; color: #888; margin-top: 4px;">$0.35</span>
                    </div>
                    <div class="plan-tokens" style="text-align: center; background: rgba(124, 58, 237, 0.2); padding: 8px; border-radius: 8px; margin: 15px 0; font-weight: 600; color: #a78bfa;">5 A-Tokens • 125 Streams</div>
                    <ul class="plan-features" style="list-style: none; padding: 0; margin: 20px 0;">
                        <li style="padding: 8px 0; font-size: 14px; color: #ccc;"><i class="fas fa-check" style="margin-right: 8px; width: 16px; color: #10b981;"></i> 125 Total Streams</li>
                        <li style="padding: 8px 0; font-size: 14px; color: #ccc;"><i class="fas fa-check" style="margin-right: 8px; width: 16px; color: #10b981;"></i> Ad-Free Streaming</li>
                        <li style="padding: 8px 0; font-size: 14px; color: #ccc;"><i class="fas fa-check" style="margin-right: 8px; width: 16px; color: #10b981;"></i> High-Quality Audio</li>
                        <li style="padding: 8px 0; font-size: 14px; color: #ccc;"><i class="fas fa-times" style="margin-right: 8px; width: 16px; color: #ef4444;"></i> No Playlists</li>
                        <li style="padding: 8px 0; font-size: 14px; color: #ccc;"><i class="fas fa-times" style="margin-right: 8px; width: 16px; color: #ef4444;"></i> No Uploads</li>
                    </ul>
                    <button class="subscribe-btn" onclick="subscribeToTier('daily')" style="width: 100%; padding: 12px; background: #7c3aed; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">Select Daily</button>
                </div>
                
                <!-- WEEKLY PLAN -->
                <div class="plan-card" data-tier="weekly" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 2px solid #2a2a3e; border-radius: 16px; padding: 24px; position: relative; transition: all 0.3s ease; cursor: pointer;">
                    <div class="plan-badge" style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #7c3aed; color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: bold; letter-spacing: 0.5px;">7 DAYS</div>
                    <h3 style="text-align: center; font-size: 24px; margin: 20px 0 10px; color: #fff;">Weekly</h3>
                    <div class="plan-price" style="text-align: center; margin: 15px 0;">
                        <span class="price-ngn" style="display: block; font-size: 28px; font-weight: bold; color: #7c3aed;">₦2,000</span>
                        <span class="price-usd" style="display: block; font-size: 16px; color: #888; margin-top: 4px;">$1.35</span>
                    </div>
                    <div class="plan-tokens" style="text-align: center; background: rgba(124, 58, 237, 0.2); padding: 8px; border-radius: 8px; margin: 15px 0; font-weight: 600; color: #a78bfa;">25 A-Tokens • 625 Streams</div>
                    <ul class="plan-features" style="list-style: none; padding: 0; margin: 20px 0;">
                        <li style="padding: 8px 0; font-size: 14px; color: #ccc;"><i class="fas fa-check" style="margin-right: 8px; width: 16px; color: #10b981;"></i> 625 Total Streams</li>
                        <li style="padding: 8px 0; font-size: 14px; color: #ccc;"><i class="fas fa-check" style="margin-right: 8px; width: 16px; color: #10b981;"></i> Ad-Free + High Quality</li>
                        <li style="padding: 8px 0; font-size: 14px; color: #ccc;"><i class="fas fa-check" style="margin-right: 8px; width: 16px; color: #10b981;"></i> Create Playlists (12+)</li>
                        <li style="padding: 8px 0; font-size: 14px; color: #ccc;"><i class="fas fa-check" style="margin-right: 8px; width: 16px; color: #10b981;"></i> Upload Music</li>
                        <li style="padding: 8px 0; font-size: 14px; color: #ccc;"><i class="fas fa-check" style="margin-right: 8px; width: 16px; color: #10b981;"></i> Offline Listening</li>
                        <li style="padding: 8px 0; font-size: 14px; color: #ccc;"><i class="fas fa-check" style="margin-right: 8px; width: 16px; color: #10b981;"></i> Priority Support</li>
                    </ul>
                    <button class="subscribe-btn" onclick="subscribeToTier('weekly')" style="width: 100%; padding: 12px; background: #7c3aed; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">Select Weekly</button>
                </div>
                
                <!-- MONTHLY PLAN (POPULAR) -->
                <div class="plan-card popular" data-tier="monthly" style="background: linear-gradient(135deg, #1a1a2e 0%, #2d1810 100%); border: 2px solid #f59e0b; border-radius: 16px; padding: 24px; position: relative; transition: all 0.3s ease; cursor: pointer;">
                    <div class="plan-badge popular-badge" style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: bold; letter-spacing: 0.5px;">MOST POPULAR</div>
                    <h3 style="text-align: center; font-size: 24px; margin: 20px 0 10px; color: #fff;">Monthly</h3>
                    <div class="plan-price" style="text-align: center; margin: 15px 0;">
                        <span class="price-ngn" style="display: block; font-size: 28px; font-weight: bold; color: #f59e0b;">₦7,500</span>
                        <span class="price-usd" style="display: block; font-size: 16px; color: #888; margin-top: 4px;">$5.00</span>
                    </div>
                    <div class="plan-tokens" style="text-align: center; background: rgba(245, 158, 11, 0.2); padding: 8px; border-radius: 8px; margin: 15px 0; font-weight: 600; color: #fbbf24;">100 A-Tokens • 2,500 Streams</div>
                    <ul class="plan-features" style="list-style: none; padding: 0; margin: 20px 0;">
                        <li style="padding: 8px 0; font-size: 14px; color: #ccc;"><i class="fas fa-check" style="margin-right: 8px; width: 16px; color: #10b981;"></i> 2,500 Total Streams</li>
                        <li style="padding: 8px 0; font-size: 14px; color: #ccc;"><i class="fas fa-check" style="margin-right: 8px; width: 16px; color: #10b981;"></i> Unlimited Playlists</li>
                        <li style="padding: 8px 0; font-size: 14px; color: #ccc;"><i class="fas fa-check" style="margin-right: 8px; width: 16px; color: #10b981;"></i> Upload Music</li>
                        <li style="padding: 8px 0; font-size: 14px; color: #ccc;"><i class="fas fa-check" style="margin-right: 8px; width: 16px; color: #10b981;"></i> Offline Listening</li>
                        <li style="padding: 8px 0; font-size: 14px; color: #ccc;"><i class="fas fa-check" style="margin-right: 8px; width: 16px; color: #10b981;"></i> Early Access Features</li>
                        <li style="padding: 8px 0; font-size: 14px; color: #ccc;"><i class="fas fa-chart-line" style="margin-right: 8px; width: 16px; color: #10b981;"></i> Artist Analytics</li>
                    </ul>
                    <button class="subscribe-btn popular-btn" onclick="subscribeToTier('monthly')" style="width: 100%; padding: 12px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">Select Monthly</button>
                </div>
                
                <!-- YEARLY PLAN (BEST VALUE) -->
                <div class="plan-card premium" data-tier="yearly" style="background: linear-gradient(135deg, #1a1a2e 0%, #2d2410 100%); border: 2px solid #fbbf24; border-radius: 16px; padding: 24px; position: relative; transition: all 0.3s ease; cursor: pointer;">
                    <div class="plan-badge premium-badge" style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: bold; letter-spacing: 0.5px;">BEST VALUE</div>
                    <h3 style="text-align: center; font-size: 24px; margin: 20px 0 10px; color: #fff;">Yearly</h3>
                    <div class="plan-price" style="text-align: center; margin: 15px 0;">
                        <span class="price-ngn" style="display: block; font-size: 28px; font-weight: bold; color: #fbbf24;">₦75,000</span>
                        <span class="price-usd" style="display: block; font-size: 16px; color: #888; margin-top: 4px;">$50.00</span>
                    </div>
                    <div class="plan-tokens" style="text-align: center; background: rgba(251, 191, 36, 0.2); padding: 8px; border-radius: 8px; margin: 15px 0; font-weight: 600; color: #fbbf24;">1,500 A-Tokens • 37,500 Streams</div>
                    <ul class="plan-features" style="list-style: none; padding: 0; margin: 20px 0;">
                        <li style="padding: 8px 0; font-size: 14px; color: #ccc;"><i class="fas fa-check" style="margin-right: 8px; width: 16px; color: #10b981;"></i> 37,500 Total Streams</li>
                        <li style="padding: 8px 0; font-size: 14px; color: #ccc;"><i class="fas fa-crown" style="margin-right: 8px; width: 16px; color: #fbbf24;"></i> Premium Crown Badge</li>
                        <li style="padding: 8px 0; font-size: 14px; color: #ccc;"><i class="fas fa-star" style="margin-right: 8px; width: 16px; color: #fbbf24;"></i> Exclusive Content</li>
                        <li style="padding: 8px 0; font-size: 14px; color: #ccc;"><i class="fas fa-gift" style="margin-right: 8px; width: 16px; color: #fbbf24;"></i> Bonus Rewards</li>
                        <li style="padding: 8px 0; font-size: 14px; color: #ccc;"><i class="fas fa-headset" style="margin-right: 8px; width: 16px; color: #10b981;"></i> VIP Support</li>
                        <li style="padding: 8px 0; font-size: 14px; color: #ccc;"><i class="fas fa-palette" style="margin-right: 8px; width: 16px; color: #10b981;"></i> Custom Themes</li>
                    </ul>
                    <button class="subscribe-btn premium-btn" onclick="subscribeToTier('yearly')" style="width: 100%; padding: 12px; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">Select Yearly</button>
                </div>
            </div>
            
            <button class="modal-cancel-btn" id="cancelSubModal" style="display: block; margin: 20px auto 0; padding: 12px 32px; background: transparent; border: 1px solid #444; color: #888; border-radius: 8px; cursor: pointer; transition: all 0.3s;">Maybe Later</button>
        </div>
    `;

    document.body.appendChild(modal);

    // Add hover effects
    const planCards = modal.querySelectorAll('.plan-card');
    planCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-8px)';
            card.style.boxShadow = '0 12px 24px rgba(124, 58, 237, 0.3)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = 'none';
        });
    });

    document.getElementById('closeSubModal').addEventListener('click', () => modal.remove());
    document.getElementById('cancelSubModal').addEventListener('click', () => modal.remove());

    // Add responsive styles
    const style = document.createElement('style');
    style.textContent = `
        @media (max-width: 1024px) {
            .subscription-plans-horizontal {
                grid-template-columns: repeat(2, 1fr) !important;
            }
        }
        @media (max-width: 640px) {
            .subscription-plans-horizontal {
                grid-template-columns: 1fr !important;
            }
        }
    `;
    document.head.appendChild(style);
};

window.subscribeToTier = function (tierId) {
    if (tierId === 'free') {
        window.alert("You are already on the Free tier.");
        return;
    }

    const pricing = {
        'daily': { USD: 0.35, NGN: 500, aTokens: 5, streams: 125 },
        'weekly': { USD: 1.35, NGN: 2000, aTokens: 25, streams: 625 },
        'monthly': { USD: 5.00, NGN: 7500, aTokens: 100, streams: 2500 },
        'yearly': { USD: 50.00, NGN: 75000, aTokens: 1500, streams: 37500 }
    };

    const tierPricing = pricing[tierId];

    // Step 1: Currency Selection
    window.showCustomModal({
        title: `Subscribe: ${tierId.toUpperCase()}`,
        content: `Select your preferred currency:`,
        showCurrency: true,
        confirmText: "Continue",
        onConfirm: async (_, currency) => {
            const amount = tierPricing[currency];

            // Close the currency modal
            document.querySelector('.custom-modal-overlay')?.remove();

            // Step 2: Payment Method Selection
            window.showPaymentMethodModal({
                tier: tierId,
                amount,
                currency,
                aTokens: tierPricing.aTokens,
                streams: tierPricing.streams
            });
        }
    });
};

window.showPaymentMethodModal = function ({ tier, amount, currency, aTokens, streams }) {
    const modal = document.createElement('div');
    modal.className = 'custom-modal-overlay';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 10001;';

    modal.innerHTML = `
        <div class="custom-modal" style="background: var(--bg-card); border-radius: 16px; padding: 32px; max-width: 600px; width: 90%;">
            <h3 style="margin: 0 0 16px 0; font-size: 1.8rem;">Choose Payment Method</h3>
            <p style="margin: 0 0 8px 0; color: #ccc;">Subscribing to <strong>${tier.toUpperCase()}</strong> - ${currency} ${amount}</p>
            <p class="a-token-bonus" style="text-align: center; color: #a78bfa; font-weight: 600; margin: 10px 0; font-size: 1.1rem;">+ ${aTokens} A-Tokens (${streams} Streams)</p>
            
            <div class="payment-method-buttons" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0;">
                <button class="payment-method-btn wallet-btn" id="walletPayBtn" style="padding: 20px; border: 2px solid #2a2a3e; border-radius: 12px; background: #1a1a2e; color: white; cursor: pointer; transition: all 0.3s ease; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                    <i class="fas fa-wallet" style="font-size: 32px; color: #7c3aed;"></i>
                    <span style="font-weight: 600; font-size: 16px;">Fund with Wallet</span>
                    <small style="font-size: 12px; color: #888;">Use your wallet balance</small>
                </button>
                
                <button class="payment-method-btn other-btn" id="otherPayBtn" style="padding: 20px; border: 2px solid #2a2a3e; border-radius: 12px; background: #1a1a2e; color: white; cursor: pointer; transition: all 0.3s ease; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                    <i class="fas fa-credit-card" style="font-size: 32px; color: #7c3aed;"></i>
                    <span style="font-weight: 600; font-size: 16px;">Other Payment Methods</span>
                    <small style="font-size: 12px; color: #888;">Card, Bank Transfer, USSD</small>
                </button>
            </div>
            
            <button class="modal-close-btn" id="closePaymentModal" style="width: 100%; padding: 12px; background: transparent; border: 1px solid #444; color: #888; border-radius: 8px; cursor: pointer; transition: all 0.3s;">Cancel</button>
        </div>
    `;

    document.body.appendChild(modal);

    // Add hover effects
    const buttons = modal.querySelectorAll('.payment-method-btn');
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.borderColor = '#7c3aed';
            btn.style.transform = 'translateY(-4px)';
            btn.style.boxShadow = '0 8px 16px rgba(124, 58, 237, 0.3)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.borderColor = '#2a2a3e';
            btn.style.transform = 'translateY(0)';
            btn.style.boxShadow = 'none';
        });
    });

    // Wallet payment handler
    document.getElementById('walletPayBtn').addEventListener('click', async () => {
        await handleWalletSubscription(tier, currency, amount, aTokens, streams);
        modal.remove();
    });

    // Flutterwave payment handler
    document.getElementById('otherPayBtn').addEventListener('click', async () => {
        await handleFlutterwaveSubscription(tier, currency, amount);
        modal.remove();
    });

    document.getElementById('closePaymentModal').addEventListener('click', () => {
        modal.remove();
    });
};

async function handleWalletSubscription(tier, currency, amount, aTokens, streams) {
    try {
        const response = await (window.authFetch || fetch)('/api/payment/subscriptions/wallet-purchase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tier, currency })
        });

        const result = await response.json();

        if (response.ok) {
            window.showCustomModal({
                title: "Subscription Activated!",
                content: `You've successfully subscribed to ${tier.toUpperCase()}. ${result.subscription.aTokensReceived} A-Tokens (${result.subscription.streamsReceived} streams) have been added to your wallet.`,
                confirmText: "Great!"
            });

            // Refresh wallet data
            if (typeof loadWalletData === 'function') {
                loadWalletData();
            }
        } else {
            window.showCustomModal({
                title: "Insufficient Balance",
                content: result.message || "You don't have enough balance in your wallet. Please fund your wallet first.",
                confirmText: "OK"
            });
        }
    } catch (error) {
        console.error('Wallet subscription error:', error);
        window.showCustomModal({
            title: "Error",
            content: "Failed to process wallet payment. Please try again.",
            confirmText: "OK"
        });
    }
}

async function handleFlutterwaveSubscription(tier, currency, amount) {
    try {
        const response = await (window.authFetch || fetch)(`${window.location.origin}/api/payment/initialize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: amount,
                currency: currency,
                meta: {
                    type: 'subscription',
                    tier: tier
                }
            })
        });

        const result = await response.json();

        if (result.status === 'success' && result.data && result.data.link) {
            // Use Custom Modal for Flutterwave Hosted Checkout
            window.showFlutterwaveCustomModal(result.data, 'wallet');

            // Close the plan selection modal
            const selectionModal = document.querySelector('.modal-overlay');
            if (selectionModal) selectionModal.remove();
        } else {
            window.alert("Failed to initialize payment. Please try again.");
        }
    } catch (error) {
        console.error('Flutterwave subscription error:', error);
        window.alert("Failed to initialize payment. Please try again.");
    }
}
