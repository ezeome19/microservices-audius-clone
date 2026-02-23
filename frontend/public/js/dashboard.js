// Dashboard Page JavaScript
if (typeof API_URL === 'undefined') {
    window.API_URL = window.location.origin;
}


// State management
let currentTab = 'trending';
let trendingCache = null;
let favoritesCache = null;
let playlistsCache = null;
window.userLikes = new Set(); // Global state for liked song IDs
window.currentUserId = null; // Global state for current user ID

window.showFlutterwaveCustomModal = function (paymentData, returnTab) {
    if (!paymentData) {
        console.error('[Payment] No payment data provided');
        return;
    }

    const paymentLink = paymentData.link || paymentData.paymentLink;
    const publicKey = paymentData.publicKey;
    const txRef = paymentData.tx_ref || paymentData.reference;
    const amount = paymentData.amount;
    const currency = paymentData.currency || 'NGN';
    const customer = paymentData.customer;
    const customizations = paymentData.customizations;

    // If FlutterwaveCheckout is not available or missing required fields, fall back to redirect
    if (typeof FlutterwaveCheckout === 'undefined' || !publicKey || !txRef) {
        console.warn('[Payment] Inline checkout unavailable, redirecting...');
        if (paymentLink) window.location.href = paymentLink;
        return;
    }

    console.log('[Payment] Initializing inline checkout...');

    // Stop any previous confirmation-bypass observer
    if (window._flwConfirmObserver) {
        window._flwConfirmObserver.disconnect();
        window._flwConfirmObserver = null;
    }

    FlutterwaveCheckout({
        public_key: publicKey,
        tx_ref: txRef,
        amount: amount,
        currency: currency,
        payment_options: "card, account, ussd, banktransfer",
        customer: {
            email: customer?.email || '',
            name: customer?.name || 'Audius User',
        },
        customizations: {
            title: customizations?.title || "Audius Clone",
            description: customizations?.description || "Payment",
            logo: "",  // Empty to avoid CORS errors with localhost
        },
        callback: function (data) {
            console.log("[Payment] Payment successful");
            stopConfirmObserver();
            // Redirect to the frontend's payment verification page
            const redirectUrl = paymentData.redirect_url || `${window.location.origin}/payment/verify`;
            const separator = redirectUrl.includes('?') ? '&' : '?';
            window.location.href = `${redirectUrl}${separator}transaction_id=${data.transaction_id || data.id}&tx_ref=${txRef}&status=successful`;
        },
        onclose: function (incomplete) {
            console.log("[Payment] Modal closed. Incomplete:", incomplete);
            stopConfirmObserver();

            // Navigate back to the correct tab
            if (returnTab) {
                if (returnTab === 'artist') {
                    const hash = window.location.hash;
                    if (!hash.includes('artist/')) {
                        activateTab('trending');
                    }
                } else {
                    activateTab(returnTab);
                }
            }

            // Show retry popup only if payment was incomplete
            if (incomplete) {
                window.showPaymentCancelledPopup(
                    () => window.showFlutterwaveCustomModal(paymentData, returnTab),
                    () => console.log("[Payment] Retry declined")
                );
            }
        }
    });

    // ── Auto-bypass Flutterwave's "Are you sure?" confirmation dialog ──
    // When user clicks Flutterwave's close button, it shows a confirmation.
    // This observer detects that dialog and auto-clicks "Yes" instantly.
    function startConfirmObserver() {
        window._flwConfirmObserver = new MutationObserver(function (mutations) {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== 1) continue;
                    // Look for confirmation buttons inside newly added elements
                    const buttons = node.querySelectorAll ? node.querySelectorAll('button') : [];
                    for (const btn of buttons) {
                        const text = (btn.textContent || '').trim().toLowerCase();
                        if (text === 'yes, close' || text === 'yes' || text === 'yes, cancel') {
                            btn.click();
                            return;
                        }
                    }
                    // Also check if the node itself is a button
                    if (node.tagName === 'BUTTON') {
                        const text = (node.textContent || '').trim().toLowerCase();
                        if (text === 'yes, close' || text === 'yes' || text === 'yes, cancel') {
                            node.click();
                            return;
                        }
                    }
                }
            }
        });
        window._flwConfirmObserver.observe(document.body, { childList: true, subtree: true });
    }

    function stopConfirmObserver() {
        if (window._flwConfirmObserver) {
            window._flwConfirmObserver.disconnect();
            window._flwConfirmObserver = null;
        }
    }

    // Start observing after a brief delay to let the modal render
    setTimeout(startConfirmObserver, 300);
};

// Helper: Get user-scoped localStorage key
function getScopedKey(key) {
    if (!window.currentUserId) return key;
    return `user_${window.currentUserId}_${key}`;
}

// Reusable Flutterwave payment cancellation popup with retry timer
window.showPaymentCancelledPopup = function (retryCallback, resetButtonsFn) {
    const overlay = document.createElement('div');
    overlay.className = 'payment-cancel-overlay';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 1000002; transition: all 0.3s; backdrop-filter: blur(8px);';

    overlay.innerHTML = `
        <div style="background: var(--bg-card); padding: 40px; border-radius: 24px; text-align: center; max-width: 420px; border: 1px solid var(--border-color); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: var(--bg-secondary);">
                <div id="retryProgress" style="height: 100%; width: 100%; background: var(--accent-gradient); transition: width 1s linear;"></div>
            </div>
            <div style="width: 80px; height: 80px; background: rgba(245, 158, 11, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                <i class="fa-solid fa-circle-exclamation" style="font-size: 2.5rem; color: #f59e0b;"></i>
            </div>
            <h3 style="margin: 0 0 12px 0; font-size: 1.5rem; font-weight: 700;">Payment Interrupted</h3>
            <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 32px; font-size: 1.05rem;">The payment process was interrupted. Would you like to try again or return to the app?</p>
            <div style="display: flex; gap: 16px;">
                <button id="cancelFinal" style="flex: 1; padding: 14px; border-radius: 12px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: white; cursor: pointer; font-weight: 600; transition: all 0.2s;">Go Back</button>
                <button id="retryPayment" disabled style="flex: 1.5; padding: 14px; border-radius: 12px; border: none; background: var(--accent-gradient); color: white; font-weight: 700; cursor: not-allowed; opacity: 0.6; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    Retry in <span id="retryCountdown">10</span>s
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    let timeLeft = 10;
    const retryBtn = document.getElementById('retryPayment');
    const countdownEl = document.getElementById('retryCountdown');
    const progressBar = document.getElementById('retryProgress');

    const timer = setInterval(() => {
        timeLeft--;
        if (countdownEl) countdownEl.textContent = timeLeft;
        if (progressBar) progressBar.style.width = `${(timeLeft / 10) * 100}%`;

        if (timeLeft <= 0) {
            clearInterval(timer);
            retryBtn.disabled = false;
            retryBtn.style.cursor = 'pointer';
            retryBtn.style.opacity = '1';
            retryBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Retry Now';
        }
    }, 1000);

    document.getElementById('cancelFinal').onclick = () => {
        clearInterval(timer);
        overlay.remove();
        if (resetButtonsFn) resetButtonsFn();
    };

    retryBtn.onclick = () => {
        if (timeLeft > 0) return;
        overlay.remove();
        if (retryCallback) retryCallback();
    };
};

/**
 * Initializes the sidebar 'Subscribe to Premium' button
 */
function initializeSidebarSubscription() {
    const subBtn = document.getElementById('subscribeBtn');
    if (!subBtn) return;

    // Remove any existing listeners by cloning
    const newBtn = subBtn.cloneNode(true);
    subBtn.parentNode.replaceChild(newBtn, subBtn);

    newBtn.addEventListener('click', async () => {
        try {
            newBtn.disabled = true;
            newBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';

            const response = await (window.authFetch || fetch)('/api/payment/initialize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ amount: 5000 })
            });

            const result = await response.json();

            if (result.status === 'success' && result.data && result.data.link) {
                // Use Custom Modal
                window.showFlutterwaveCustomModal(result.data, 'wallet');

                // Reset button after a slight delay
                setTimeout(() => {
                    newBtn.disabled = false;
                    newBtn.innerText = 'Subscribe to Premium';
                }, 1000);
            } else {
                alert('Payment initialization failed: ' + (result.message || 'Unknown error'));
                newBtn.disabled = false;
                newBtn.innerText = 'Subscribe to Premium';
            }
        } catch (error) {
            console.error('Sidebar Subscription error:', error);
            alert('An error occurred. Please try again.');
            newBtn.disabled = false;
            newBtn.innerText = 'Subscribe to Premium';
        }
    });
}
// This ensures cross-tab session isolation by sending the token as a header
// instead of relying on the shared cookie.
window.authFetch = async function (url, options = {}) {
    const tabToken = sessionStorage.getItem('tab_session_token');
    if (tabToken) {
        options.headers = options.headers || {};
        // If headers is a Headers object, convert to plain object
        if (options.headers instanceof Headers) {
            const h = {};
            options.headers.forEach((v, k) => h[k] = v);
            options.headers = h;
        }
        options.headers['x-auth-token'] = tabToken;
    }
    options.credentials = options.credentials || 'include';

    let response = await fetch(url, options);

    // AUTO-RECOVERY: If response is 401 (Unauthorized) or 400 (Invalid Token)
    // it likely means the tab token is stale/expired.
    if ((response.status === 401 || response.status === 400) && tabToken) {
        console.warn('[Session] Tab token stale/invalid. Attempting to recover with cookie session...');

        // Remove stale tab token
        sessionStorage.removeItem('tab_session_token');
        sessionStorage.removeItem('tab_session_userid');

        // Retry without x-auth-token header (falls back to cookie)
        if (options.headers) {
            delete options.headers['x-auth-token'];
        }

        response = await fetch(url, options);

        if (response.ok) {
            console.log('[Session] Recovery successful. Re-syncing tab state...');
            // Reload page to re-initialize everything with the fresh session
            window.location.reload();
        }
    }

    return response;
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    // SAFETY: Guarantee the mask is removed after 5 seconds no matter what
    const maskSafetyTimeout = setTimeout(() => {
        console.warn('[Session] Safety timeout reached - force-hiding mask');
        hideSessionMask();
    }, 5000);

    // Critical: Initialize session management before anything else to ensure state isolation
    try {
        const shouldStop = await initializeSessionManagement();
        if (shouldStop) {
            clearTimeout(maskSafetyTimeout);
            return;
        }
    } catch (err) {
        console.error('[Session] initializeSessionManagement failed:', err);
        hideSessionMask();
    }
    clearTimeout(maskSafetyTimeout);

    initializeTabs();
    initializeHeaderSearch();
    initializeFilters(); // Initialize filters
    initializeNotifications(); // Initialize notification bell
    initializeSidebarSubscription(); // Initialize sidebar subscription button

    // Perform background syncs in parallel to speed up initial load
    const syncTasks = [
        fetchCurrentUser(),
        syncUserLikes(),
        checkUserTier()
    ];

    // Wait for critical user data before continuing with other loads
    await syncTasks[0]; // Wait for fetchCurrentUser specifically

    // The others can continue in background or be awaited if strictly necessary
    // But we want trending tracks to load ASAP

    // Restore view from URL hash, localStorage, or default to trending
    const hash = window.location.hash.substring(1); // Remove '#'
    const scopedKey = getScopedKey('last_active_tab');
    const lastTab = localStorage.getItem(scopedKey);

    // Check if hash is for artist page (format: artist/artistId)
    if (hash.startsWith('artist/')) {
        const artistId = hash.split('/')[1];
        if (artistId) {
            showArtistPage(artistId);
            return;
        }
    }

    // Check if hash is for song page (format: song/songId)
    if (hash.startsWith('song/')) {
        const songId = hash.split('/')[1];
        if (songId) {
            showSongPage(songId);
            return;
        }
    }

    // Otherwise, handle tab navigation
    const validTabs = ['trending', 'explore', 'favorites', 'playlists', 'wallet', 'coins', 'profile', 'upload', 'feed', 'artist-dashboard', 'artist-tracks', 'admin-stats', 'admin-verify', 'admin-users', 'admin-analytics'];
    const tabToLoad = validTabs.includes(hash) ? hash : (validTabs.includes(lastTab) ? lastTab : 'trending');

    // Activate the correct tab
    activateTab(tabToLoad);

    // Await remaining tasks if they haven't finished
    await Promise.allSettled(syncTasks);
});

// Handle browser back/forward navigation (hash changes)
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.substring(1);

    // Check if navigating to artist page
    if (hash.startsWith('artist/')) {
        const artistId = hash.split('/')[1];
        if (artistId) {
            showArtistPage(artistId);
        }
    }
    // Check if navigating to song page
    else if (hash.startsWith('song/')) {
        const songId = hash.split('/')[1];
        if (songId) {
            showSongPage(songId);
        }
    } else {
        // Handle tab navigation
        const validTabs = ['trending', 'explore', 'favorites', 'playlists', 'wallet', 'coins', 'profile', 'upload', 'feed', 'artist-dashboard', 'artist-tracks', 'admin-stats', 'admin-verify', 'admin-users', 'admin-analytics'];
        if (validTabs.includes(hash)) {
            const targetLink = document.querySelector(`.nav-item[data-tab="${hash}"]`);
            if (targetLink) {
                targetLink.click();
            }
        } else {
            // Default to trending
            loadTrendingTracks();
        }
    }
});

// Initialize trending filters
function initializeFilters() {
    const timeFilter = document.getElementById('timeFilter');
    const genreFilter = document.getElementById('genreFilter');

    if (timeFilter) {
        timeFilter.addEventListener('change', () => {
            trendingCache = null; // Clear cache to force refresh
            loadTrendingTracks();
        });
    }

    if (genreFilter) {
        genreFilter.addEventListener('change', () => {
            trendingCache = null; // Clear cache to force refresh
            loadTrendingTracks();
        });
    }
}

// Initialize Notification Bell
function initializeNotifications() {
    const bell = document.getElementById('notifBell');
    const dropdown = document.getElementById('notifDropdown');
    const badge = document.getElementById('notifBadge');
    const listEl = document.getElementById('notifList');

    if (!bell || !dropdown) return;

    // Toggle dropdown on bell click
    bell.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.style.display === 'block';
        dropdown.style.display = isOpen ? 'none' : 'block';

        if (!isOpen) {
            fetchNotifications(listEl, badge);
        }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && e.target !== bell) {
            dropdown.style.display = 'none';
        }
    });
}

// Fetch and render notifications
async function fetchNotifications(listEl, badge) {
    if (!listEl) return;

    try {
        const response = await authFetch(`${API_URL}/api/recommendations/notifications`);

        if (!response.ok) {
            listEl.innerHTML = '<div style="text-align: center; padding: 24px; color: var(--text-muted);"><p style="font-size: 0.9rem;">No notifications yet.</p></div>';
            return;
        }

        const data = await response.json();
        const notifications = data.notifications || [];

        if (badge) {
            // Recommendation service currently returns dynamic notifications (all "new")
            // We'll treat them as unread for the badge if there are any
            badge.style.display = notifications.length > 0 ? 'block' : 'none';
        }

        if (notifications.length === 0) {
            listEl.innerHTML = '<div style="text-align: center; padding: 24px; color: var(--text-muted);"><p style="font-size: 0.9rem;">No notifications yet.</p></div>';
            return;
        }

        listEl.innerHTML = notifications.map(n => {
            const date = n.date || n.createdAt;
            const icon = n.type === 'like' ? 'heart' :
                n.type === 'comment' ? 'comment' :
                    n.type === 'trending' ? 'fire' :
                        n.type === 'release' ? 'music' : 'bell';

            return `
                <div style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); display: flex; gap: 12px; align-items: flex-start; ${n.isRead ? '' : 'background: rgba(204,14,240,0.05);'}">
                    <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--accent-gradient); flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; color: white;">
                        <i class="fa-solid fa-${icon}"></i>
                    </div>
                    <div style="flex: 1;">
                        <p style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin: 0 0 2px;">${n.title || 'New notification'}</p>
                        <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0 0 4px;">${n.message || ''}</p>
                        <p style="font-size: 0.7rem; color: var(--text-muted); margin: 0;">${date ? new Date(date).toLocaleString() : ''}</p>
                    </div>
                    ${!n.isRead ? '<span style="width: 8px; height: 8px; background: #CC0EF0; border-radius: 50%; flex-shrink: 0; margin-top: 6px;"></span>' : ''}
                </div>
            `;
        }).join('');

    } catch (err) {
        console.warn('[Notifications] Failed to load:', err.message);
        if (listEl) {
            listEl.innerHTML = '<div style="text-align: center; padding: 24px; color: var(--text-muted);"><p style="font-size: 0.9rem;">Could not load notifications.</p></div>';
        }
    }
}

// Mark all notifications as read
window.markAllAsRead = async function () {
    // Stubbed: Recommendations service notifications are dynamic and generated on-the-fly
    // In a full implementation, we would persist the 'lastReadDate' for the user.
    const badge = document.getElementById('notifBadge');
    if (badge) badge.style.display = 'none';
};

// Sync likes from backend
async function syncUserLikes() {
    try {
        const response = await authFetch(`${API_URL}/api/social/likes`);

        if (response.ok) {
            const data = await response.json();
            const likes = data.likes || [];

            // Separate song likes and comment likes if they are mixed
            // If the backend /likes endpoint only returns song likes, we may need a separate sync or handle it in loadComments
            window.userLikes = new Set(likes.filter(l => l.songId).map(l => l.id));
            window.userCommentLikes = new Set(likes.filter(l => l.commentId).map(l => l.commentId));

            console.log('[Dashboard] Synced likes - Songs:', window.userLikes.size, 'Comments:', window.userCommentLikes.size);
        }
    } catch (error) {
        console.error('[Dashboard] Failed to sync likes:', error);
    }
}

// Fetch Current User for State Isolation
async function fetchCurrentUser() {
    try {
        const response = await authFetch(`${API_URL}/api/auth/me`);
        if (response.ok) {
            const data = await response.json();
            window.currentUserId = data.user?.id;
            console.log('[Dashboard] Identified User:', window.currentUserId);
        }
    } catch (error) {
        console.error('[Dashboard] Failed to fetch current user:', error);
    }
}

/**
 * Session Management: Isolation across tabs
 * Detects if the current tab's intended session (in sessionStorage) 
 * differs from the cookie's current session (server-rendered user).
 */
async function initializeSessionManagement() {
    const configEl = document.getElementById('session-config');
    if (!configEl) return false;

    try {
        const config = JSON.parse(configEl.textContent);
        const { token, userId, syncSession } = config;

        // 1. If we just logged in, capture this session in this tab context
        if (syncSession && token) {
            console.log('[Session] Capturing new session for this tab...');
            sessionStorage.setItem('tab_session_token', token);
            sessionStorage.setItem('tab_session_userid', userId);

            // Clean up URL so reloads don't re-trigger sync flag
            window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
            hideSessionMask();
            return false;
        }

        // 2. Check for existing session in this tab
        const tabToken = sessionStorage.getItem('tab_session_token');
        const tabUserId = sessionStorage.getItem('tab_session_userid');

        // 3. If no session recorded for this tab yet, capture current
        if (!tabToken) {
            console.log('[Session] Recording initial session for new tab...');
            sessionStorage.setItem('tab_session_token', token);
            sessionStorage.setItem('tab_session_userid', userId);
            hideSessionMask();
            return false;
        }

        // 4. DETECTION: If the server-rendered user (from cookie) mismatches the tab's recorded user
        if (tabUserId !== userId) {
            console.warn('[Session] Mismatch detected! Tab belongs to', tabUserId, 'but cookie is', userId);

            // If the cookie has a NEW valid token but the tab session is empty or different,
            // we should trust the COOKIE (user just logged in) and update the tab.
            if (syncSession && token) {
                console.log('[Session] Trusting new login cookie over stale tab session...');
                sessionStorage.setItem('tab_session_token', token);
                sessionStorage.setItem('tab_session_userid', userId);
                hideSessionMask();
                return false;
            }

            // Otherwise, sync the cookie back to what this tab expects
            // IMPORTANT: Use plain fetch() here, NOT authFetch, to avoid
            // auto-recovery (401 → retry → reload) causing an infinite reload loop.
            console.log('[Session] Syncing cookie back to tab session...');
            const response = await fetch('/auth/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: tabToken })
            });

            if (response.ok) {
                console.log('[Session] Sync successful. Reloading...');
                window.location.reload();
                return true; // Stop initialization
            } else {
                console.error('[Session] Sync failed. Clearing tab session for recovery...');
                sessionStorage.removeItem('tab_session_token');
                sessionStorage.removeItem('tab_session_userid');
                hideSessionMask();
            }
        }

        hideSessionMask();
        return false;
    } catch (err) {
        console.error('[Session] Error initializing session management:', err);
        hideSessionMask();
        return false;
    }
}

/**
 * Hide the session masking overlay
 */
function hideSessionMask() {
    const mask = document.getElementById('session-mask');
    if (mask) {
        mask.classList.add('hidden');
        // Optional: Remove from DOM after transition to be clean
        setTimeout(() => mask.remove(), 500);
    }
}

// Check User Tier and Update UI
async function checkUserTier() {
    try {
        const response = await authFetch(`${API_URL}/api/payment/wallet`);
        if (response.ok) {
            const data = await response.json();
            window.currentUserTier = data.tier || 'free';

            // Add Premium Badge if Yearly
            if (window.currentUserTier === 'yearly') {
                const headerActions = document.querySelector('header div[style*="display: flex; gap: 16px; align-items: center;"]');
                if (headerActions && !document.getElementById('premiumBadge')) {
                    const badge = document.createElement('div');
                    badge.id = 'premiumBadge';
                    badge.innerHTML = '<i class="fa-solid fa-crown" style="color: #FFD700; margin-right: 6px;"></i><span style="font-weight: 800; font-size: 0.75rem; letter-spacing: 1px;">PREMIUM</span>';
                    badge.style = 'background: rgba(255, 215, 0, 0.1); color: #FFD700; border: 1px solid #FFD700; padding: 4px 12px; border-radius: 20px; display: flex; align-items: center; margin-right: 8px;';
                    headerActions.prepend(badge);
                }
            }
            console.log('[Dashboard] User Tier:', window.currentUserTier);
        }
    } catch (error) {
        console.error('[Dashboard] Failed to check tier:', error);
    }
}



// Header Search Management
function initializeHeaderSearch() {
    const headerSearchInput = document.querySelector('header .search-bar input');
    if (headerSearchInput) {
        headerSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value.trim();
                if (query) {
                    // Switch to explore tab
                    const exploreLink = document.querySelector('.nav-item[data-tab="explore"]');
                    if (exploreLink) {
                        // Manually trigger click to update UI state
                        exploreLink.click();

                        // Wait for DOM update then populate and trigger search
                        setTimeout(() => {
                            const exploreInput = document.getElementById('exploreSearch');
                            if (exploreInput) {
                                exploreInput.value = query;
                                // Trigger input event to start search
                                exploreInput.dispatchEvent(new Event('input', { bubbles: true }));
                                // Clear header search
                                headerSearchInput.value = '';
                            }
                        }, 50);
                    }
                }
            }
        });
    }
}

// Tab Management
/**
 * Activate a tab by name
 */
window.activateTab = function (tabName) {
    const navLinks = document.querySelectorAll('.nav-item[data-tab]');
    const targetLink = document.querySelector(`.nav-item[data-tab="${tabName}"]`);

    if (!targetLink) return;

    // Update URL hash for tab persistence
    window.location.hash = tabName;

    // Update active state
    navLinks.forEach(l => {
        l.classList.remove('active');
        l.style.fontWeight = '400';
        l.style.color = 'var(--text-secondary)';
    });
    targetLink.classList.add('active');
    targetLink.style.fontWeight = '600';
    targetLink.style.color = 'white';

    // Handle different tabs
    currentTab = tabName;
    localStorage.setItem(getScopedKey('last_active_tab'), tabName);

    // Toggle filters
    const filterEl = document.getElementById('trendingFilters');
    if (tabName === 'trending') {
        if (filterEl) filterEl.style.display = 'flex';
        loadTrendingTracks();
    } else {
        if (filterEl) filterEl.style.display = 'none';

        if (tabName === 'feed') {
            loadPersonalizedFeed();
        } else if (tabName === 'explore') {
            showExploreTab();
        } else if (tabName === 'favorites') {
            loadFavorites();
        } else if (tabName === 'playlists') {
            loadPlaylists();
        } else if (tabName === 'wallet') {
            showWalletPage();
        } else if (tabName === 'coins') {
            showCoinPage();
        } else if (tabName === 'profile') {
            showProfilePage();
        } else if (tabName === 'upload') {
            showUploadPage();
        } else if (tabName === 'artist-dashboard') {
            showArtistDashboard();
        } else if (tabName === 'artist-tracks') {
            showArtistTracks();
        } else if (tabName === 'admin-stats') {
            showAdminStats();
        } else if (tabName === 'admin-verify') {
            showAdminVerify();
        } else if (tabName === 'admin-users') {
            showAdminUsers();
        } else if (tabName === 'admin-analytics') {
            showAdminAnalytics();
        }
    }
}

function initializeTabs() {
    const navLinks = document.querySelectorAll('.nav-item[data-tab]');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            activateTab(link.dataset.tab);
        });
    });
}

// Load Trending Tracks (Personalized based on user preferences)
async function loadTrendingTracks() {
    const tracksContainer = document.getElementById('tracksContainer');
    const feedTitle = document.getElementById('feedTitle');

    // Show loading state
    feedTitle.textContent = 'Trending';
    tracksContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
            <p>Loading trending tracks...</p>
        </div>
    `;

    try {
        const time = document.getElementById('timeFilter')?.value || 'allTime';
        const genre = document.getElementById('genreFilter')?.value || '';

        // Check cache first (only if no filters are applied or cache matches filters)
        if (trendingCache && !genre && time === 'allTime') {
            renderTracks(trendingCache, 'Trending');
            return;
        }

        let tracks = [];
        let title = 'Trending';

        // Fetch trending tracks from music API
        const response = await authFetch(`${API_URL}/api/music/songs?time=${time}&genre=${genre}`);
        if (response.ok) {
            const data = await response.json();
            tracks = data.songs || [];

            // Build title based on filters
            if (genre || time !== 'allTime') {
                const timeLabel = time === 'allTime' ? 'All Time' : 'This ' + time.charAt(0).toUpperCase() + time.slice(1);
                title = `Trending ${genre || ''} (${timeLabel})`.trim();
            }
        }

        trendingCache = (genre || time !== 'allTime') ? null : tracks;
        renderTracks(tracks, title);

    } catch (error) {
        console.error('Error loading trending tracks:', error);
        document.getElementById('feedTitle').textContent = 'Trending';
        document.getElementById('tracksContainer').innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <p>Failed to load trending tracks. Please try again.</p>
                <button onclick="loadTrendingTracks()" class="btn btn-secondary" style="margin-top: 16px;">Retry</button>
            </div>
        `;
    }
}

// Navigation: Artist Page (Inline rendering for seamless audio)
window.showArtistPage = async function (artistId) {
    const tracksContainer = document.getElementById('tracksContainer');
    const feedTitle = document.getElementById('feedTitle');
    const filterEl = document.getElementById('trendingFilters');

    if (filterEl) filterEl.style.display = 'none';
    currentTab = 'artist';

    // Update URL without page reload (using hash for SPA behavior)
    window.location.hash = `artist/${artistId}`;

    tracksContainer.innerHTML = `<div style="text-align: center; padding: 40px;"><p>Loading artist...</p></div>`;
    feedTitle.textContent = '';

    try {
        // Fetch artist content HTML
        const response = await authFetch(`/artist/api/${artistId}/content`);

        if (!response.ok) {
            throw new Error('Failed to load artist');
        }

        const html = await response.text();
        tracksContainer.innerHTML = html;

        // Update like indicators for tracks
        if (window.userLikes) {
            document.querySelectorAll('.like-indicator').forEach(indicator => {
                const row = indicator.closest('[data-song-id]');
                if (row) {
                    const songId = row.dataset.songId;
                    const isLiked = window.userLikes.has(songId);
                    const icon = indicator.querySelector('i');
                    if (icon) {
                        icon.className = isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
                        indicator.style.color = isLiked ? '#CC0EF0' : 'inherit';
                    }
                }
            });
        }

    } catch (err) {
        console.error('Error showing artist page:', err);
        tracksContainer.innerHTML = `
            <div style="text-align: center; padding: 60px; color: var(--text-secondary);">
                <i class="fa-solid fa-exclamation-circle" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;"></i>
                <p style="font-size: 1.2rem; margin-bottom: 8px;">Failed to load artist</p>
                <p style="font-size: 0.9rem;">The artist may not exist or there was a network error.</p>
                <button onclick="loadTrendingTracks()" class="btn btn-secondary" style="margin-top: 20px;">Back to Trending</button>
            </div>
        `;
    }
};

// Navigation: Song Page
window.showSongPage = async function (songId) {
    const tracksContainer = document.getElementById('tracksContainer');
    const feedTitle = document.getElementById('feedTitle');
    const filterEl = document.getElementById('trendingFilters');

    if (filterEl) filterEl.style.display = 'none';
    currentTab = 'song';

    // Update URL without page reload (using hash for SPA behavior)
    window.location.hash = `song/${songId}`;

    tracksContainer.innerHTML = `<div style="text-align: center; padding: 40px;"><p>Loading song details...</p></div>`;

    try {
        // Fetch song details and stats in parallel
        const [songRes, statsRes] = await Promise.all([
            authFetch(`${API_URL}/api/music/songs/${songId}`),
            authFetch(`${API_URL}/api/social/stats/song/${songId}`).catch(() => null)
        ]);

        if (!songRes.ok) throw new Error('Song not found');
        const songData = await songRes.json();
        const song = songData.song;

        // Get stats or use defaults
        let stats = { plays: song.playCount || 0, reposts: 0, favorites: 0, comments: 0 };
        if (statsRes && statsRes.ok) {
            const statsData = await statsRes.json();
            stats = statsData.stats || stats;
        }

        // Check if user has liked this song
        const isLiked = window.userLikes && window.userLikes.has(songId);

        // Format duration
        const duration = song.duration ? `${Math.floor(song.duration / 60)}:${String(Math.floor(song.duration % 60)).padStart(2, '0')}` : '--:--';

        feedTitle.textContent = '';
        tracksContainer.innerHTML = `
            <div class="song-detail-page" style="display: grid; grid-template-columns: 1fr 350px; gap: 40px; padding: 20px;">
                <!-- Main Content -->
                <div>
                    <!-- Header Section -->
                    <div style="display: flex; gap: 32px; margin-bottom: 40px;">
                        <!-- Album Art -->
                        <div style="width: 240px; height: 240px; flex-shrink: 0; background: var(--bg-card); border-radius: 8px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.4); position: relative;">
                            <img src="${song.coverArtUrl || 'https://placehold.co/600?text=No+Cover'}" style="width: 100%; height: 100%; object-fit: cover;">
                            <div class="play-overlay" style="opacity: 1; pointer-events: auto; cursor: ${song.isGated ? 'not-allowed' : 'pointer'};" onclick="${song.isGated ? '' : `playSong('${songId}')`}">
                                <span style="font-size: 3rem;">${song.isGated ? '<i class="fa-solid fa-lock" style="color: #CC0EF0;"></i>' : '▶'}</span>
                            </div>
                        </div>

                        <!-- Track Info -->
                        <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                <p style="color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; font-size: 0.75rem;">TRACK</p>
                                ${song.isGated ? `<span class="gated-badge" style="background: #CC0EF022; color: #CC0EF0; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; display: flex; align-items: center; gap: 4px;"><i class="fa-solid fa-lock"></i> GATED TRACK</span>` : ''}
                            </div>
                            <h1 style="font-size: 2.5rem; font-weight: 900; margin-bottom: 16px; line-height: 1.2;">
                                ${song.title}
                            </h1>
                            
                            <!-- Artist -->
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
                                <img src="${song.artist?.profilePicture || 'https://placehold.co/150'}" style="width: 32px; height: 32px; border-radius: 50%;">
                                <span class="artist-link" onclick="showArtistPage('${song.artist?.id || song.artistId}')" style="font-size: 1rem; font-weight: 600; cursor: pointer; color: var(--text-primary);">${song.artist?.name || 'Unknown Artist'}</span>
                                ${song.artist?.isVerified ? '<i class="fa-solid fa-circle-check" style="color: #00B1FF; font-size: 0.9rem;"></i>' : ''}
                            </div>

                            <!-- Gated Reason Alert -->
                            ${song.isGated ? `
                            <div style="background: rgba(204, 14, 240, 0.1); border-left: 4px solid #CC0EF0; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
                                <p style="color: #CC0EF0; font-weight: 600; font-size: 0.9rem; margin-bottom: 4px;">Locked Content</p>
                                <p style="color: var(--text-secondary); font-size: 0.85rem;">This track is <strong>${song.gatedReason || 'restricted'}</strong>. To listen to this track, please visit the original artist on <a href="https://audius.co" target="_blank" style="color: #CC0EF0; text-decoration: none;">Audius.co</a>.</p>
                            </div>
                            ` : ''}

                            <!-- Stats Row -->
                            <div style="display: flex; gap: 24px; margin-bottom: 24px; color: var(--text-secondary); font-size: 0.9rem;">
                                <span title="Plays"><i class="fa-solid fa-play" style="margin-right: 6px;"></i>${stats.plays.toLocaleString()}</span>
                                <span title="Reposts"><i class="fa-solid fa-retweet" style="margin-right: 6px;"></i>${stats.reposts.toLocaleString()}</span>
                                <span title="Favorites"><i class="fa-solid fa-heart" style="margin-right: 6px;"></i>${stats.favorites.toLocaleString()}</span>
                                <span title="Comments"><i class="fa-regular fa-comment" style="margin-right: 6px;"></i>${stats.comments.toLocaleString()}</span>
                            </div>

                            <!-- Action Buttons -->
                            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                                <button class="btn btn-primary" 
                                        style="padding: 12px 32px; font-size: 1rem; display: flex; align-items: center; gap: 8px; ${song.isGated ? 'opacity: 0.5; cursor: not-allowed; background: var(--border-color); color: var(--text-muted);' : ''}" 
                                        onclick="${song.isGated ? '' : `playSong('${songId}')`}"
                                        ${song.isGated ? 'disabled' : ''}>
                                    <i class="fa-solid fa-${song.isGated ? 'lock' : 'play'}"></i> ${song.isGated ? 'Locked' : 'Play'}
                                </button>
                                <button class="btn btn-secondary like-btn-${songId}" style="padding: 12px 24px; display: flex; align-items: center; gap: 8px;" onclick="toggleLike('${songId}')">
                                    <i class="fa-${isLiked ? 'solid' : 'regular'} fa-heart" style="color: ${isLiked ? '#CC0EF0' : 'inherit'};"></i> ${isLiked ? 'Liked' : 'Like'}
                                </button>
                                <button class="btn btn-secondary" style="padding: 12px 24px; display: flex; align-items: center; gap: 8px;" onclick="repostTrack('${songId}')">
                                    <i class="fa-solid fa-retweet"></i> Repost
                                </button>
                                <div style="position: relative;">
                                    <button class="btn btn-secondary" id="shareBtn-${songId}" style="padding: 12px 24px; display: flex; align-items: center; gap: 8px;" onclick="toggleShareMenu('${songId}')">
                                        <i class="fa-solid fa-share-nodes"></i> Share
                                    </button>
                                    <div id="shareMenu-${songId}" class="dropdown-menu" style="display: none; position: absolute; top: 100%; left: 0; margin-top: 8px; width: 200px; z-index: 50;">
                                        <div class="dropdown-item" onclick="copyTrackLink('${songId}')"><i class="fa-solid fa-link"></i> Copy Link</div>
                                        <div class="dropdown-item" onclick="shareToX('${songId}', '${song.title.replace(/'/g, "\\'")}')"><i class="fa-brands fa-x-twitter"></i> Share to X</div>
                                    </div>
                                </div>
                                <button class="btn btn-secondary" style="padding: 12px 20px;" onclick="toggleTrackMenu(event, '${songId}')">
                                    <i class="fa-solid fa-ellipsis"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Metadata Section -->
                    <div style="background: var(--bg-card); padding: 24px; border-radius: 12px; margin-bottom: 32px; border: 1px solid var(--border-color);">
                        <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 16px;">Track Details</h3>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; color: var(--text-secondary);">
                            <div>
                                <span style="font-size: 0.85rem; color: var(--text-muted);">Genre</span>
                                <p style="font-weight: 600; color: var(--text-primary); margin-top: 4px;">${song.genre || 'Not specified'}</p>
                            </div>
                            <div>
                                <span style="font-size: 0.85rem; color: var(--text-muted);">Duration</span>
                                <p style="font-weight: 600; color: var(--text-primary); margin-top: 4px;">${duration}</p>
                            </div>
                            <div>
                                <span style="font-size: 0.85rem; color: var(--text-muted);">Release Date</span>
                                <p style="font-weight: 600; color: var(--text-primary); margin-top: 4px;">${song.releaseDate ? new Date(song.releaseDate).toLocaleDateString() : 'Unknown'}</p>
                            </div>
                            <div>
                                <span style="font-size: 0.85rem; color: var(--text-muted);">Mood</span>
                                <p style="font-weight: 600; color: var(--text-primary); margin-top: 4px;">${song.mood || 'Not specified'}</p>
                            </div>
                        </div>
                        ${song.description ? `<div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);"><p style="color: var(--text-secondary); line-height: 1.6;">${song.description}</p></div>` : ''}
                    </div>

                    <!-- Comments Section -->
                    <div id="commentsSection-${songId}" style="background: var(--bg-card); padding: 24px; border-radius: 12px; border: 1px solid var(--border-color);">
                        <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 20px;">Comments (${stats.comments})</h3>
                        
                        <!-- Comment Input -->
                        <div style="display: flex; gap: 12px; margin-bottom: 24px;">
                            <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--accent-gradient);"></div>
                            <div style="flex: 1;">
                                <textarea id="commentInput-${songId}" placeholder="Write a comment..." style="width: 100%; min-height: 60px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; color: var(--text-primary); resize: vertical;"></textarea>
                                <button class="btn btn-primary" style="margin-top: 8px; padding: 8px 24px;" onclick="postComment('${songId}')">Post Comment</button>
                            </div>
                        </div>

                        <!-- Comments List -->
                        <div id="commentsList-${songId}">
                            <p style="color: var(--text-muted); text-align: center; padding: 20px;">No comments yet. Be the first to comment!</p>
                        </div>
                    </div>
                </div>

                <!-- Sidebar -->
                <div>
                    <!-- More by Artist -->
                    <div style="background: var(--bg-card); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color);">
                        <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 16px;">More by ${song.artist?.name || 'this artist'}</h3>
                        <div id="relatedTracks-${songId}">
                            <p style="color: var(--text-muted); font-size: 0.9rem;">Loading...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Load related tracks
        loadRelatedTracks(song.artist?.id || song.artistId, songId);

        // Load comments
        loadComments(songId);

    } catch (err) {
        console.error('Error showing song page:', err);
        tracksContainer.innerHTML = `
            <div style="text-align: center; padding: 60px; color: var(--text-secondary);">
                <i class="fa-solid fa-exclamation-circle" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;"></i>
                <p style="font-size: 1.2rem; margin-bottom: 8px;">Failed to load song details</p>
                <p style="font-size: 0.9rem;">The song may not exist or there was a network error.</p>
                <button onclick="loadTrendingTracks()" class="btn btn-secondary" style="margin-top: 20px;">Back to Trending</button>
            </div>
        `;
    }
};

// Load Favorites
async function loadFavorites() {
    const tracksContainer = document.getElementById('tracksContainer');
    const feedTitle = document.getElementById('feedTitle');

    feedTitle.textContent = 'Your Favorites';
    tracksContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
            <p>Loading your favorites...</p>
        </div>
    `;

    try {
        if (favoritesCache) {
            renderTracks(favoritesCache, 'Your Favorites');
            return;
        }

        const response = await authFetch(`${API_URL}/api/social/likes`);

        if (!response.ok) {
            throw new Error('Failed to fetch favorites');
        }

        const data = await response.json();
        favoritesCache = data.likes || [];

        // Sync global state
        window.userLikes = new Set(favoritesCache.map(l => l.id));


        if (favoritesCache.length === 0) {
            feedTitle.textContent = 'Your Favorites';
            tracksContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <p>You haven't liked any songs yet.</p>
                    <p style="margin-top: 8px;">Start exploring and like your favorite tracks!</p>
                </div>
            `;
        } else {
            renderTracks(favoritesCache, 'Your Favorites');
        }

    } catch (error) {
        console.error('Error loading favorites:', error);
        feedTitle.textContent = 'Your Favorites';
        tracksContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <p>Failed to load favorites. Please try again.</p>
                <button onclick="loadFavorites()" class="btn btn-secondary" style="margin-top: 16px;">Retry</button>
            </div>
        `;
    }
}

// Load Playlists
async function loadPlaylists() {
    const tracksContainer = document.getElementById('tracksContainer');
    const feedTitle = document.getElementById('feedTitle');

    feedTitle.textContent = 'Your Playlists';
    tracksContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
            <p>Loading your playlists...</p>
        </div>
    `;

    try {
        if (playlistsCache) {
            renderPlaylists(playlistsCache);
            return;
        }

        const response = await authFetch(`${API_URL}/api/music/playlists/my-playlists`);

        if (!response.ok) {
            throw new Error('Failed to fetch playlists');
        }


        const data = await response.json();
        playlistsCache = data.playlists || [];

        if (playlistsCache.length === 0) {
            feedTitle.textContent = 'Your Playlists';
            tracksContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <p>You don't have any playlists yet.</p>
                    <button class="btn btn-primary" style="margin-top: 16px;" onclick="createPlaylist()">Create Playlist</button>
                </div>
            `;
        } else {
            renderPlaylists(playlistsCache);
        }

    } catch (error) {
        console.error('Error loading playlists:', error);
        feedTitle.textContent = 'Your Playlists';
        tracksContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <p>Failed to load playlists. Please try again.</p>
                <button onclick="loadPlaylists()" class="btn btn-secondary" style="margin-top: 16px;">Retry</button>
            </div>
        `;
    }
}

// Show Explore Tab
function showExploreTab() {
    const tracksContainer = document.getElementById('tracksContainer');
    const feedTitle = document.getElementById('feedTitle');

    feedTitle.textContent = 'Explore Music';
    tracksContainer.innerHTML = `
        <div style="margin-bottom: 24px;">
            <input 
                type="text" 
                id="exploreSearch" 
                placeholder="Search for songs, artists, albums..." 
                style="width: 100%; padding: 12px 20px; background: var(--bg-secondary); border: 1px solid var(--border-color); color: white; border-radius: 8px; font-size: 1rem;"
            >
        </div>
        <div id="exploreResults" style="margin-top: 24px;">
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <p>Search for music to explore</p>
            </div>
        </div>
    `;

    // Add search functionality
    const searchInput = document.getElementById('exploreSearch');
    let searchTimeout;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();

        if (query.length < 2) {
            document.getElementById('exploreResults').innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <p>Search for music to explore</p>
                </div>
            `;
            return;
        }

        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 500);
    });
}

// Perform Search
async function performSearch(query) {
    const resultsDiv = document.getElementById('exploreResults');

    resultsDiv.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
            <p>Searching...</p>
        </div>
    `;

    try {
        const response = await authFetch(`${API_URL}/api/music/search?q=${encodeURIComponent(query)}`);

        if (!response.ok) {
            throw new Error('Search failed');
        }

        const data = await response.json();
        renderSearchResults(data);

    } catch (error) {
        console.error('Search error:', error);
        resultsDiv.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <p>Search failed. Please try again.</p>
            </div>
        `;
    }
}

// Render Search Results
function renderSearchResults(data) {
    const resultsDiv = document.getElementById('exploreResults');
    const songs = data.songs || [];
    const artists = data.artists || [];

    if (songs.length === 0 && artists.length === 0) {
        resultsDiv.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <p>No results found</p>
            </div>
        `;
        return;
    }

    let html = '';

    if (songs.length > 0) {
        html += '<h4 style="margin-bottom: 16px;">Songs</h4>';
        html += '<div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 32px;">';
        songs.forEach((song, i) => {
            html += createTrackRowHTML(song, i);
        });
        html += '</div>';
    }

    if (artists.length > 0) {
        html += '<h4 style="margin-bottom: 16px;">Artists</h4>';
        html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;">';
        artists.forEach(artist => {
            html += createArtistCardHTML(artist);
        });
        html += '</div>';
    }

    resultsDiv.innerHTML = html;
    attachTrackEventListeners();
}

// Render Tracks
function renderTracks(tracks, title) {
    const tracksContainer = document.getElementById('tracksContainer');
    const feedTitle = document.getElementById('feedTitle');

    if (feedTitle) feedTitle.textContent = title;

    if (!tracks || tracks.length === 0) {
        tracksContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <p>No tracks available</p>
            </div>
        `;
        return;
    }

    let html = '<div style="display: flex; flex-direction: column; gap: 16px;">';

    tracks.forEach((track, i) => {
        html += createTrackRowHTML(track, i);
    });

    html += '</div>';
    tracksContainer.innerHTML = html;
    attachTrackEventListeners();
}

// Create Track Row HTML (Audius Rectangular Style - Refined)
function createTrackRowHTML(track, index = null) {
    const songId = track.id || track._id;
    const isLiked = window.userLikes.has(songId);
    const artistId = track.artist?.id || track.artistId;
    const isActuallyPlaying = window.audioPlayer?.currentSong?.id === songId && window.audioPlayer?.isPlaying;
    const isGated = track.isGated || false;

    // Rank is 1-indexed based on index in list
    const rank = index !== null ? index + 1 : '';

    // Verification & Tier Badges
    const isVerified = track.artist?.verified || track.artist?.isVerified;
    const tier = track.artist?.tier;
    const tierClass = tier ? `tier-${tier.toLowerCase()}` : '';

    return `
        <div class="audius-track-row ${isActuallyPlaying ? 'is-playing' : ''} ${isGated ? 'gated-track' : ''}" 
             data-song-id="${songId}" 
             onclick="${isGated ? '' : `handleTrackRowClick(event, '${songId}')`}"
             style="${isGated ? 'opacity: 0.6; cursor: not-allowed;' : ''}">
            
            <div class="track-rank">${rank}</div>

            <div class="track-artwork-container" style="width: 128px; height: 128px;">
                <img src="${track.coverArtUrl || 'https://placehold.co/300?text=No+Cover'}" 
                     class="track-artwork" alt="${track.title}" 
                     onerror="this.src='https://placehold.co/300?text=No+Cover'">
                ${isGated ?
            `<div class="play-overlay" style="opacity: 1;">
                        <span class="overlay-icon"><i class="fa-solid fa-lock"></i></span>
                    </div>` :
            `<div class="play-overlay">
                        <span class="overlay-icon">${isActuallyPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>'}</span>
                    </div>`
        }
            </div>

            <div class="track-main-info">
                <div class="track-title-row">
                    <span class="track-title song-link" onclick="event.stopPropagation(); showSongPage('${songId}')">${track.title || 'Unknown Title'}</span>
                    ${isGated ? `<span style="color: #CC0EF0; font-size: 0.85rem; margin-left: 8px;" title="${track.gatedReason || 'Access Restricted'}"><i class="fa-solid fa-lock"></i> ${track.gatedReason || 'Gated'}</span>` : ''}
                    ${track.isExclusive ? '<span style="color: var(--gold-tier); font-size: 0.9rem; margin-left: 8px;"><i class="fa-solid fa-lock"></i></span>' : ''}
                </div>
                <div class="track-artist-row">
                    <span class="artist-link" onclick="event.stopPropagation(); showArtistPage('${artistId}')">${track.artist?.name || track.artistName || 'Unknown Artist'}</span>
                    ${isVerified ? '<span class="verification-badge" title="Verified"><i class="fa-solid fa-circle-check"></i></span>' : ''}
                    ${tier ? `<span class="tier-badge ${tierClass}" title="${tier} Tier"></span>` : ''}
                </div>
            </div>

            <div class="track-stats">
                <span class="like-indicator ${isLiked ? 'liked' : ''}" onclick="event.stopPropagation(); toggleLike('${songId}')" style="cursor: pointer;">
                    <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                </span>
                <span><i class="fa-solid fa-retweet"></i> ${track.repostCount || 0}</span>
                <span><i class="fa-solid fa-heart"></i> ${track.favoriteCount || track.likeCount || 0}</span>
            </div>

            <div class="track-plays">
                <i class="fa-solid fa-play" style="font-size: 0.8rem; margin-right: 4px;"></i>${track.playCount || 0}
            </div>
            
            <div class="track-duration">
                ${formatDuration(track.duration)}
            </div>
        </div>
    `;
}

// Handle Track Row Click (Click anywhere to play)
// Handle Track Row Click (Click anywhere to play)
window.handleTrackRowClick = function (event, songId) {
    // If we clicked a specific action link/button, don't trigger row play
    if (event.target.closest('.song-link') ||
        event.target.closest('.artist-link') ||
        event.target.closest('.like-indicator')) {
        return;
    }
    playSong(songId);
};


// Create Artist Card HTML
function createArtistCardHTML(artist) {
    const artistId = artist.id || artist._id;
    return `
        <div onclick="showArtistPage('${artistId}')" style="text-decoration: none; color: inherit; cursor: pointer;">
            <div style="background: var(--bg-card); border-radius: 12px; padding: 16px; text-align: center; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">
                <div style="width: 100%; aspect-ratio: 1; background: var(--bg-secondary); border-radius: 50%; overflow: hidden; margin-bottom: 12px;">
                    ${artist.profilePicture || artist.profilePictureUrl ? `<img src="${artist.profilePicture || artist.profilePictureUrl}" alt="${artist.name}" style="width: 100%; height: 100%; object-fit: cover;">` : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 3rem; font-weight: 800; color: var(--text-secondary);">${artist.name ? artist.name.charAt(0) : '?'}</div>`}
                </div>
                <h4 style="margin: 0 0 4px 0; font-size: 1rem;">${artist.name || 'Unknown Artist'}</h4>
                <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">${artist.followerCount || 0} followers</p>
            </div>
        </div>
    `;
}

// Render Playlists
function renderPlaylists(playlists) {
    const tracksContainer = document.getElementById('tracksContainer');
    const feedTitle = document.getElementById('feedTitle');

    if (feedTitle) feedTitle.textContent = 'Your Playlists';

    let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0;">Your Playlists</h3>
            <button class="btn btn-primary" onclick="createPlaylist()">Create Playlist</button>
        </div>
    `;

    html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;">';

    playlists.forEach(playlist => {
        const isPublic = playlist.isPublic;
        html += `
            <div style="background: var(--bg-card); border-radius: 12px; padding: 16px; transition: transform 0.2s; position: relative;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">
                <a href="/playlist/${playlist.id || playlist._id}" style="text-decoration: none; color: inherit;">
                    <div style="width: 100%; aspect-ratio: 1; background: var(--bg-secondary); border-radius: 8px; overflow: hidden; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; font-size: 3rem;">
                        📜
                    </div>
                    <h4 style="margin: 0 0 8px 0; font-size: 1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${playlist.name}</h4>
                    <p style="margin: 0 0 12px 0; font-size: 0.85rem; color: var(--text-secondary);">${playlist.songCount || 0} songs</p>
                </a>
                
                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid var(--border-color);">
                    <div style="display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: ${isPublic ? 'var(--primary-color)' : 'var(--text-muted)'};">
                        <i class="fa-solid fa-${isPublic ? 'globe' : 'lock'}"></i>
                        <span>${isPublic ? 'Public' : 'Private'}</span>
                    </div>
                    <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.7rem;" onclick="event.preventDefault(); togglePlaylistVisibility('${playlist.id || playlist._id}', ${isPublic})">
                        Make ${isPublic ? 'Private' : 'Public'}
                    </button>
                </div>
            </div>
        `;
    });

    html += '</div>';
    tracksContainer.innerHTML = html;
}

// Attach Track Event Listeners
function attachTrackEventListeners() {
    // Click-to-play is now handled via inline onclick for row-wide coverage
    // and stopPropagation on link elements.
}

// Play Song
function playSong(songId) {
    window.dispatchEvent(new CustomEvent('play-song', { detail: { songId } }));
}

// Toggle Playlist Visibility
window.togglePlaylistVisibility = async function (playlistId, currentIsPublic) {
    try {
        const response = await authFetch(`${API_URL}/api/music/playlists/${playlistId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isPublic: !currentIsPublic })
        });

        if (response.ok) {
            playlistsCache = null; // Clear cache to refresh
            loadPlaylists();
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to update visibility');
        }
    } catch (err) {
        console.error('Error toggling visibility:', err);
    }
};

// Create Playlist (Enforcing Tier Rules)
window.createPlaylist = async function () {
    // Show custom modal to get name
    if (window.showCustomModal) {
        window.showCustomModal({
            title: "Create New Playlist",
            content: "Enter a name for your new playlist.",
            showInput: true,
            confirmText: "Create",
            onConfirm: async (name) => {
                if (!name) return;
                try {
                    const response = await authFetch(`${API_URL}/api/music/playlists`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, isPublic: true })
                    });

                    if (response.ok) {
                        playlistsCache = null;
                        loadPlaylists();
                    } else {
                        const error = await response.json();
                        if (error.code === 'PLAYLIST_CREATION_BLOCKED') {
                            window.showCustomModal({
                                title: "Upgrade Required",
                                content: error.message,
                                confirmText: "See Plans",
                                onConfirm: () => window.showSubscriptionModal()
                            });
                        } else {
                            alert(error.message || 'Creation failed');
                        }
                    }
                } catch (err) {
                    console.error('Creation error:', err);
                }
            }
        });
    } else {
        const name = prompt("Enter playlist name:");
        // ... (legacy fallback)
    }
};

// Helper: Format Duration
function formatDuration(seconds) {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Toggle Like Wrapper
window.toggleLike = async function (songId) {
    if (window.audioPlayer && typeof window.audioPlayer.toggleLikeForSong === 'function') {
        await window.audioPlayer.toggleLikeForSong(songId);
    } else {
        // Fallback or legacy support
        console.warn('AudioPlayer.toggleLikeForSong not found, using legacy like toggle');
        const isLiked = window.userLikes.has(songId);
        try {
            const method = isLiked ? 'DELETE' : 'POST';
            const response = await authFetch(`${API_URL}/api/social/like/${songId}`, { method });
            if (response.ok) {
                if (isLiked) window.userLikes.delete(songId);
                else window.userLikes.add(songId);

                // Update UI manually for now
                const indicator = document.querySelector(`.audius-track-row[data-song-id="${songId}"] .like-indicator`);
                if (indicator) {
                    const icon = indicator.querySelector('i');
                    if (!isLiked) {
                        indicator.classList.add('liked');
                        icon.classList.replace('fa-regular', 'fa-solid');
                    } else {
                        indicator.classList.remove('liked');
                        icon.classList.replace('fa-solid', 'fa-regular');
                    }
                }
            }
        } catch (e) {
            console.error('Like failed:', e);
        }
    }
};

// Listen for playback state changes to update track rows
window.addEventListener('playback-state-changed', (e) => {
    const { isPlaying, songId } = e.detail;
    document.querySelectorAll('.track-row').forEach(row => {
        const rowId = row.dataset.songId;
        const overlayIcon = row.querySelector('.overlay-icon');

        if (rowId === songId) {
            row.classList.toggle('is-playing', isPlaying);
            if (overlayIcon) overlayIcon.textContent = isPlaying ? '⏸' : '▶';
        } else {
            row.classList.remove('is-playing');
            if (overlayIcon) overlayIcon.textContent = '▶';
        }
    });
});

// Load Related Tracks for Song Page
async function loadRelatedTracks(artistId, currentSongId) {
    const container = document.getElementById(`relatedTracks-${currentSongId}`);
    if (!container) return;

    try {
        const response = await authFetch(`${API_URL}/api/music/artists/${artistId}/tracks`);
        if (!response.ok) throw new Error('Failed to load tracks');

        const data = await response.json();
        const tracks = (data.tracks || data.songs || []).filter(t => t.id !== currentSongId && t._id !== currentSongId).slice(0, 5);

        if (tracks.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">No other tracks available</p>';
            return;
        }

        container.innerHTML = tracks.map(track => `
            <div class="related-track-item" onclick="showSongPage('${track.id || track._id}')" style="display: flex; gap: 12px; padding: 12px; border-radius: 8px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='var(--bg-secondary)'" onmouseout="this.style.background='transparent'">
                <img src="${track.coverArtUrl || 'https://placehold.co/100'}" style="width: 48px; height: 48px; border-radius: 4px; object-fit: cover;">
                <div style="flex: 1; min-width: 0;">
                    <p style="font-weight: 600; font-size: 0.9rem; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${track.title}</p>
                    <p style="color: var(--text-muted); font-size: 0.8rem;">${track.playCount || 0} plays</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading related tracks:', error);
        container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">Failed to load tracks</p>';
    }
}

// Load Comments for Song Page
async function loadComments(songId) {
    const container = document.getElementById(`commentsList-${songId}`);
    if (!container) return;

    try {
        const response = await authFetch(`${API_URL}/api/social/comments/${songId}`);
        if (!response.ok) throw new Error('Failed to load comments');

        const data = await response.json();
        const comments = data.comments || [];

        if (comments.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">No comments yet. Be the first to comment!</p>';
            return;
        }

        container.innerHTML = comments.map(c => renderCommentItem(c)).join('');

    } catch (error) {
        console.error('Error loading comments:', error);
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">Failed to load comments</p>';
    }
}

function renderCommentItem(c, depth = 0) {
    const timeAgo = formatTimeAgo(c.createdAt);
    const hasReplies = c.replies && c.replies.length > 0;
    const isReply = depth > 0;
    const isLiked = c.isLiked || (window.userCommentLikes && window.userCommentLikes.has(c.id));
    const likeCount = c.likeCount || 0;

    return `
        <div class="comment-item ${isReply ? 'is-reply' : ''}" style="margin-left: ${depth * 16}px; border-left: ${depth > 0 ? '1px solid var(--border-color)' : 'none'}; padding-left: ${depth > 0 ? '12px' : '0'};">
            <div class="comment-avatar" style="${isReply ? 'width: 24px; height: 24px;' : ''}"></div>
            <div class="comment-body">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div class="comment-user" style="${isReply ? 'font-size: 0.8rem;' : ''}">${c.userName || 'User ' + c.userId.substring(0, 8)}</div>
                    <div class="comment-date" style="${isReply ? 'font-size: 0.7rem;' : ''}">${timeAgo}</div>
                </div>
                <div class="comment-text" style="${isReply ? 'font-size: 0.85rem;' : ''}">${c.content}</div>
                <div class="comment-actions" style="display: flex; gap: 12px; margin-top: 4px;">
                    <button onclick="toggleCommentLike(event, '${c.id}')" class="comment-action-btn" data-liked="${isLiked}" style="background: none; border: none; font-size: 0.75rem; color: ${isLiked ? '#CC0EF0' : 'var(--text-secondary)'}; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                        <i class="fa-${isLiked ? 'solid' : 'regular'} fa-heart"></i> <span class="like-count">${likeCount}</span>
                    </button>
                    ${!isReply ? `
                    <button onclick="replyToComment('${c.id}', '${c.userName || 'User'}', '${c.songId}')" class="comment-action-btn" style="background: none; border: none; font-size: 0.75rem; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; gap: 4px;">
                        <i class="fa-regular fa-comment"></i> Reply
                    </button>
                    ` : ''}
                    ${hasReplies ? `
                    <button onclick="toggleReplies(event, '${c.id}')" class="comment-action-btn toggle-replies-btn" style="background: none; border: none; font-size: 0.75rem; color: #CC0EF0; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                        <i class="fa-solid fa-chevron-down"></i> Show Replies (${c.replies.length})
                    </button>
                    ` : ''}
                </div>
                <div id="replies-${c.id}" class="replies">
                    ${(c.replies || []).map(reply => renderCommentItem(reply, depth + 1)).join('')}
                </div>
            </div>
        </div>
    `;
}

window.toggleReplies = function (event, commentId) {
    const repliesDiv = document.getElementById(`replies-${commentId}`);
    if (!repliesDiv) return;
    const btn = event.currentTarget;
    const count = repliesDiv.children.length;
    const isHidden = !repliesDiv.classList.contains('show');

    if (isHidden) {
        repliesDiv.classList.add('show');
        btn.innerHTML = `<i class="fa-solid fa-chevron-up"></i> Hide Replies (${count})`;
    } else {
        repliesDiv.classList.remove('show');
        btn.innerHTML = `<i class="fa-solid fa-chevron-down"></i> Show Replies (${count})`;
    }
}

window.toggleCommentLike = async function (event, commentId) {
    const btn = event.currentTarget;
    const icon = btn.querySelector('i');
    const countSpan = btn.querySelector('.like-count');
    const isLiked = btn.dataset.liked === 'true';

    try {
        const url = `${API_URL}/api/social/like/comment/${commentId}`;
        const response = await authFetch(url, {
            method: isLiked ? 'DELETE' : 'POST'
        });

        if (response.ok) {
            const newIsLiked = !isLiked;
            btn.dataset.liked = newIsLiked;

            // Update global state
            if (!window.userCommentLikes) window.userCommentLikes = new Set();
            if (newIsLiked) window.userCommentLikes.add(commentId);
            else window.userCommentLikes.delete(commentId);

            // Update UI
            if (newIsLiked) {
                icon.classList.replace('fa-regular', 'fa-solid');
                icon.style.color = '#CC0EF0';
                btn.style.color = '#CC0EF0';
                if (countSpan) countSpan.textContent = parseInt(countSpan.textContent) + 1;
            } else {
                icon.classList.replace('fa-solid', 'fa-regular');
                icon.style.color = 'var(--text-secondary)';
                btn.style.color = 'var(--text-secondary)';
                if (countSpan) countSpan.textContent = Math.max(0, parseInt(countSpan.textContent) - 1);
            }
        } else {
            const errorData = await response.json();
            console.error('Comment like/unlike failed:', errorData.message);
        }
    } catch (err) {
        console.error('Comment like/unlike network error:', err);
    }
}

let activeParentId = null;

window.replyToComment = function (parentId, userName, songId) {
    activeParentId = parentId;
    const input = document.getElementById(`commentInput-${songId}`);
    if (input) {
        input.placeholder = `Replying to ${userName}...`;
        input.focus();

        if (!document.getElementById(`cancelReply-${songId}`)) {
            const cancelBtn = document.createElement('button');
            cancelBtn.id = `cancelReply-${songId}`;
            cancelBtn.textContent = 'Cancel Reply';
            cancelBtn.className = 'btn btn-secondary';
            cancelBtn.style.marginRight = '8px';
            cancelBtn.style.padding = '8px 16px';
            cancelBtn.onclick = () => cancelReply(songId);
            input.nextElementSibling.insertBefore(cancelBtn, input.nextElementSibling.firstChild);
        }
    }
}

function cancelReply(songId) {
    activeParentId = null;
    const input = document.getElementById(`commentInput-${songId}`);
    if (input) {
        input.placeholder = 'Write a comment...';
        document.getElementById(`cancelReply-${songId}`)?.remove();
    }
}

// Post Comment
window.postComment = async function (songId) {
    const input = document.getElementById(`commentInput-${songId}`);
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    try {
        const response = await authFetch(`${API_URL}/api/social/comment/${songId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: text,
                parentId: activeParentId
            })
        });

        if (response.ok) {
            input.value = '';
            cancelReply(songId);
            loadComments(songId);
            // Update comment count in stats
            const statsEl = document.querySelector(`#commentsSection-${songId} h3`);
            if (statsEl) {
                const currentCount = parseInt(statsEl.textContent.match(/\d+/)?.[0] || 0);
                statsEl.textContent = `Comments (${currentCount + 1})`;
            }
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to post comment');
        }
    } catch (error) {
        console.error('Error posting comment:', error);
        alert('Failed to post comment. Please try again.');
    }
};

// Toggle Share Menu
window.toggleShareMenu = function (songId) {
    const menu = document.getElementById(`shareMenu-${songId}`);
    if (!menu) return;

    // Close other open menus
    document.querySelectorAll('.dropdown-menu').forEach(m => {
        if (m.id !== `shareMenu-${songId}`) m.style.display = 'none';
    });

    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';

    // Close menu when clicking outside
    if (menu.style.display === 'block') {
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!e.target.closest(`#shareBtn-${songId}`) && !e.target.closest(`#shareMenu-${songId}`)) {
                    menu.style.display = 'none';
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 0);
    }
};

// Copy Track Link
window.copyTrackLink = async function (songId) {
    const link = `${window.location.origin}/dashboard#song-${songId}`;
    try {
        await navigator.clipboard.writeText(link);
        alert('Link copied to clipboard!');
    } catch (error) {
        console.error('Failed to copy link:', error);
        alert('Failed to copy link');
    }
};

// Share to X (Twitter)
window.shareToX = function (songId, songTitle) {
    const link = `${window.location.origin}/dashboard#song-${songId}`;
    const text = `Check out "${songTitle}" on Audius!`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
};

// Repost Track
window.repostTrack = async function (songId) {
    try {
        const response = await authFetch(`${API_URL}/api/social/reposts/${songId}`, {
            method: 'POST'
        });

        if (response.ok) {
            alert('Track reposted successfully!');
            // Update repost count if on song page
            const statsEl = document.querySelector(`[title="Reposts"]`);
            if (statsEl) {
                const currentCount = parseInt(statsEl.textContent.match(/\d+/)?.[0] || 0);
                statsEl.innerHTML = `<i class="fa-solid fa-retweet" style="margin-right: 6px;"></i>${currentCount + 1}`;
            }
        }
    } catch (error) {
        console.error('Error reposting track:', error);
        alert('Failed to repost track. Please try again.');
    }
};

// Format time ago helper
// Format time ago helper
function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
}

// --- Roles & Dashboards ---

// Artist Dashboard (Merchant)
window.showArtistDashboard = async function () {
    const tracksContainer = document.getElementById('tracksContainer');
    const feedTitle = document.getElementById('feedTitle');
    feedTitle.textContent = 'Artist Insights';

    tracksContainer.innerHTML = `
        <div class="artist-dashboard">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
                <div class="stat-card" style="background: var(--bg-card); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color);">
                    <p style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Total Streams</p>
                    <h2 id="totalStreams" style="font-size: 2rem; margin: 10px 0;">0</h2>
                    <p style="font-size: 0.8rem; color: #4CAF50;"><i class="fa-solid fa-arrow-up"></i> 12% from last month</p>
                </div>
                <div class="stat-card" style="background: var(--bg-card); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color);">
                    <p style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Monthly Listeners</p>
                    <h2 id="monthlyListeners" style="font-size: 2rem; margin: 10px 0;">0</h2>
                    <p style="font-size: 0.8rem; color: #4CAF50;"><i class="fa-solid fa-arrow-up"></i> 5% from last month</p>
                </div>
                <div class="stat-card" style="background: var(--bg-card); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color);">
                    <p style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Artist Wallet</p>
                    <h2 id="artistWallet" style="font-size: 2rem; margin: 10px 0;">₩0</h2>
                    <button class="btn btn-secondary" style="width: 100%; margin-top: 10px; font-size: 0.8rem;" onclick="location.hash='#wallet'">Manage Funds</button>
                </div>
            </div>

            <div style="background: var(--bg-card); padding: 24px; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 30px;">
                <h3 style="margin-bottom: 20px;">Streaming History</h3>
                <canvas id="artistChart" height="100"></canvas>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div style="background: var(--bg-card); padding: 24px; border-radius: 12px; border: 1px solid var(--border-color);">
                    <h3 style="margin-bottom: 16px;">Top Locations</h3>
                    <div id="topLocations" style="display: flex; flex-direction: column; gap: 12px;">
                        <p style="color: var(--text-muted);">Loading location data...</p>
                    </div>
                </div>
                <div style="background: var(--bg-card); padding: 24px; border-radius: 12px; border: 1px solid var(--border-color);">
                    <h3 style="margin-bottom: 16px;">Listener Demographics</h3>
                    <canvas id="demographicsChart" height="200"></canvas>
                </div>
            </div>
        </div>
    `;

    // Initialize charts
    setTimeout(() => {
        const ctx = document.getElementById('artistChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Streams',
                    data: [120, 190, 300, 500, 200, 300, 450],
                    borderColor: '#7E1BCC',
                    tension: 0.3,
                    fill: true,
                    backgroundColor: 'rgba(126, 27, 204, 0.1)'
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } } }
        });

        const demoCtx = document.getElementById('demographicsChart').getContext('2d');
        new Chart(demoCtx, {
            type: 'doughnut',
            data: {
                labels: ['Male', 'Female', 'Non-binary'],
                datasets: [{
                    data: [45, 40, 15],
                    backgroundColor: ['#7E1BCC', '#CC0EFE', '#E5E5E5']
                }]
            }
        });

        // Mock data for locations
        const locations = [
            { name: 'Lagos, Nigeria', percent: 35 },
            { name: 'London, UK', percent: 20 },
            { name: 'New York, USA', percent: 15 },
            { name: 'Accra, Ghana', percent: 10 }
        ];
        document.getElementById('topLocations').innerHTML = locations.map(l => `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.9rem;">${l.name}</span>
                <div style="flex: 1; height: 8px; background: #eee; border-radius: 4px; margin: 0 15px; position: relative; overflow: hidden;">
                    <div style="width: ${l.percent}%; height: 100%; background: var(--accent-gradient);"></div>
                </div>
                <span style="font-size: 0.8rem; font-weight: 700;">${l.percent}%</span>
            </div>
        `).join('');
    }, 100);
};

// Artist Tracks Management
window.showArtistTracks = async function () {
    const tracksContainer = document.getElementById('tracksContainer');
    const feedTitle = document.getElementById('feedTitle');
    feedTitle.textContent = 'Manage Your Content';

    tracksContainer.innerHTML = `
        <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
            <button class="btn btn-primary" onclick="location.hash='#upload'"><i class="fa-solid fa-plus"></i> Upload New Track</button>
        </div>
        <div id="artistTracksList">
            <div style="text-align: center; padding: 40px;"><p>Loading your tracks...</p></div>
        </div>
    `;

    try {
        const response = await authFetch(`${API_URL}/api/music/artists/me/tracks`); // To be implemented or updated in backend
        const data = await response.json();
        const tracks = data.songs || [];

        if (tracks.length === 0) {
            document.getElementById('artistTracksList').innerHTML = '<div style="background: var(--bg-card); padding: 40px; border-radius: 12px; text-align: center; border: 1px dashed var(--border-color);"><p style="color: var(--text-muted);">You haven\'t uploaded any tracks yet.</p></div>';
            return;
        }

        document.getElementById('artistTracksList').innerHTML = `
            <table style="width: 100%; border-collapse: collapse; background: var(--bg-card); border-radius: 12px; overflow: hidden; border: 1px solid var(--border-color);">
                <thead>
                    <tr style="background: var(--bg-secondary); text-align: left; font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted);">
                        <th style="padding: 16px;">Track</th>
                        <th style="padding: 16px;">Status</th>
                        <th style="padding: 16px;">Streams</th>
                        <th style="padding: 16px;">Date</th>
                        <th style="padding: 16px;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${tracks.map(t => `
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 16px; display: flex; align-items: center; gap: 12px;">
                                <img src="${t.coverArtUrl || 'https://placehold.co/40'}" style="width: 40px; height: 40px; border-radius: 4px;">
                                <div><p style="font-weight: 700;">${t.title}</p></div>
                            </td>
                            <td style="padding: 16px;"><span style="padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; background: #E8F5E9; color: #2E7D32;">ACTIVE</span></td>
                            <td style="padding: 16px; font-weight: 700;">${t.playCount || 0}</td>
                            <td style="padding: 16px; font-size: 0.85rem; color: var(--text-muted);">${new Date(t.createdAt).toLocaleDateString()}</td>
                            <td style="padding: 16px;"><button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.8rem;">Edit</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (e) {
        document.getElementById('artistTracksList').innerHTML = '<p>Error loading tracks.</p>';
    }
};

// Admin Stats — Platform Overview (Live Data)
window.showAdminStats = async function () {
    const tracksContainer = document.getElementById('tracksContainer');
    const feedTitle = document.getElementById('feedTitle');
    feedTitle.textContent = 'Platform Overview';

    tracksContainer.innerHTML = `
        <div style="text-align: center; padding: 60px;">
            <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 2rem; color: var(--accent-primary); margin-bottom: 16px; display: block;"></i>
            <p style="color: var(--text-muted);">Loading platform data...</p>
        </div>
    `;

    try {
        // Fetch all users and merchants in parallel
        const [usersRes, merchantsRes, healthRes] = await Promise.all([
            authFetch(`${API_URL}/api/auth/users`).catch(() => null),
            authFetch(`${API_URL}/api/auth/merchants`).catch(() => null),
            fetch(`${API_URL}/health`).catch(() => null)
        ]);

        let users = [];
        let merchants = [];
        let healthData = null;

        if (usersRes && usersRes.ok) {
            const data = await usersRes.json();
            users = data.users || [];
        }
        if (merchantsRes && merchantsRes.ok) {
            const data = await merchantsRes.json();
            merchants = data.merchants || [];
        }
        if (healthRes && healthRes.ok) {
            healthData = await healthRes.json();
        }

        // Compute stats
        const totalUsers = users.length;
        const consumers = users.filter(u => u.userType === 'consumer' && !u.isAdmin).length;
        const artistCount = users.filter(u => u.userType === 'merchant').length;
        const adminCount = users.filter(u => u.isAdmin).length;
        const pendingVerifications = merchants.filter(m => !m.isVerified).length;
        const verifiedArtists = merchants.filter(m => m.isVerified).length;
        const recentUsers = users.filter(u => {
            const created = new Date(u.createdAt);
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return created > weekAgo;
        }).length;

        // Build service health cards
        const serviceNames = {
            auth: { label: 'Auth Service', icon: 'fa-shield-halved', color: '#4CAF50' },
            music: { label: 'Music Catalog', icon: 'fa-compact-disc', color: '#2196F3' },
            streaming: { label: 'Streaming', icon: 'fa-tower-broadcast', color: '#9C27B0' },
            social: { label: 'Social Service', icon: 'fa-comments', color: '#FF9800' },
            payment: { label: 'Payment Service', icon: 'fa-credit-card', color: '#4CAF50' },
            recommendations: { label: 'Recommendations', icon: 'fa-wand-magic-sparkles', color: '#E91E63' },
            analytics: { label: 'Analytics', icon: 'fa-chart-bar', color: '#00BCD4' }
        };

        let servicesHTML = '';
        let allUp = true;
        if (healthData && healthData.services) {
            servicesHTML = Object.entries(healthData.services).map(([key, svcData]) => {
                const svc = serviceNames[key] || { label: key, icon: 'fa-server', color: '#666' };
                const isUp = svcData.status === 'up';
                if (!isUp) allUp = false;
                const statusColor = isUp ? '#4CAF50' : '#F44336';
                const statusLabel = isUp ? 'Online' : 'Offline';
                const statusDot = `<span style="width: 8px; height: 8px; border-radius: 50%; background: ${statusColor}; display: inline-block; ${!isUp ? 'animation: pulse 1.5s infinite;' : ''}"></span>`;
                return `
                    <div style="display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: var(--bg-secondary); border-radius: 10px; border: 1px solid ${isUp ? 'var(--border-color)' : 'rgba(244,67,54,0.3)'};">
                        <div style="width: 38px; height: 38px; border-radius: 10px; background: ${svc.color}18; display: flex; align-items: center; justify-content: center;">
                            <i class="fa-solid ${svc.icon}" style="color: ${svc.color}; font-size: 1rem;"></i>
                        </div>
                        <div style="flex: 1;">
                            <p style="font-weight: 700; margin: 0; font-size: 0.9rem; color: var(--text-primary);">${svc.label}</p>
                            <p style="font-size: 0.75rem; color: var(--text-muted); margin: 2px 0 0 0;">${svcData.url || key}</p>
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            ${statusDot}
                            <span style="font-size: 0.75rem; font-weight: 700; color: ${statusColor};">${statusLabel}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        tracksContainer.innerHTML = `
            <div class="admin-dashboard" style="animation: fadeIn 0.3s ease;">
                <!-- Stat Cards -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 28px;">
                    <div style="background: var(--bg-card); padding: 24px; border-radius: 14px; border: 1px solid var(--border-color); position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -10px; right: -10px; width: 60px; height: 60px; border-radius: 50%; background: rgba(33, 150, 243, 0.08);"></div>
                        <p style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Total Users</p>
                        <h2 style="font-size: 2.2rem; margin: 8px 0 4px; font-weight: 900; color: var(--text-primary);">${totalUsers.toLocaleString()}</h2>
                        <p style="font-size: 0.8rem; color: #4CAF50; font-weight: 600;"><i class="fa-solid fa-arrow-up" style="margin-right: 4px;"></i>${recentUsers} this week</p>
                    </div>
                    <div style="background: var(--bg-card); padding: 24px; border-radius: 14px; border: 1px solid var(--border-color); position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -10px; right: -10px; width: 60px; height: 60px; border-radius: 50%; background: rgba(156, 39, 176, 0.08);"></div>
                        <p style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Listeners</p>
                        <h2 style="font-size: 2.2rem; margin: 8px 0 4px; font-weight: 900; color: var(--text-primary);">${consumers.toLocaleString()}</h2>
                        <p style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">Consumer accounts</p>
                    </div>
                    <div style="background: var(--bg-card); padding: 24px; border-radius: 14px; border: 1px solid var(--border-color); position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -10px; right: -10px; width: 60px; height: 60px; border-radius: 50%; background: rgba(76, 175, 80, 0.08);"></div>
                        <p style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Artists</p>
                        <h2 style="font-size: 2.2rem; margin: 8px 0 4px; font-weight: 900; color: var(--text-primary);">${artistCount.toLocaleString()}</h2>
                        <p style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">${verifiedArtists} verified</p>
                    </div>
                    <div style="background: var(--bg-card); padding: 24px; border-radius: 14px; border: 1px solid var(--border-color); position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -10px; right: -10px; width: 60px; height: 60px; border-radius: 50%; background: rgba(255, 152, 0, 0.08);"></div>
                        <p style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Admins</p>
                        <h2 style="font-size: 2.2rem; margin: 8px 0 4px; font-weight: 900; color: var(--text-primary);">${adminCount.toLocaleString()}</h2>
                        <p style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">Platform moderators</p>
                    </div>
                    <div style="background: var(--bg-card); padding: 24px; border-radius: 14px; border: 1px solid ${pendingVerifications > 0 ? 'rgba(255, 152, 0, 0.4)' : 'var(--border-color)'}; position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -10px; right: -10px; width: 60px; height: 60px; border-radius: 50%; background: rgba(255, 152, 0, 0.08);"></div>
                        <p style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Pending Verifications</p>
                        <h2 style="font-size: 2.2rem; margin: 8px 0 4px; font-weight: 900; color: ${pendingVerifications > 0 ? '#FFA000' : 'var(--text-primary)'};">${pendingVerifications}</h2>
                        ${pendingVerifications > 0 ? '<p style="font-size: 0.8rem; color: #FFA000; font-weight: 600; cursor: pointer;" onclick="activateTab(\'admin-verify\')"><i class="fa-solid fa-arrow-right" style="margin-right: 4px;"></i>Review now</p>' : '<p style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">All clear</p>'}
                    </div>
                </div>

                <!-- User Breakdown Chart -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px;">
                    <div style="background: var(--bg-card); padding: 28px; border-radius: 14px; border: 1px solid var(--border-color);">
                        <h3 style="margin-bottom: 20px; font-size: 1.1rem; font-weight: 800; color: var(--text-primary);">User Breakdown</h3>
                        <div style="display: flex; flex-direction: column; gap: 16px;">
                            <div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                                    <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);">Listeners</span>
                                    <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary);">${consumers} (${totalUsers > 0 ? Math.round(consumers / totalUsers * 100) : 0}%)</span>
                                </div>
                                <div style="height: 8px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden;">
                                    <div style="width: ${totalUsers > 0 ? (consumers / totalUsers * 100) : 0}%; height: 100%; background: linear-gradient(90deg, #7C3AED, #CC0EF0); border-radius: 4px; transition: width 0.5s;"></div>
                                </div>
                            </div>
                            <div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                                    <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);">Artists</span>
                                    <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary);">${artistCount} (${totalUsers > 0 ? Math.round(artistCount / totalUsers * 100) : 0}%)</span>
                                </div>
                                <div style="height: 8px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden;">
                                    <div style="width: ${totalUsers > 0 ? (artistCount / totalUsers * 100) : 0}%; height: 100%; background: linear-gradient(90deg, #4CAF50, #8BC34A); border-radius: 4px; transition: width 0.5s;"></div>
                                </div>
                            </div>
                            <div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                                    <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);">Admins</span>
                                    <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary);">${adminCount} (${totalUsers > 0 ? Math.round(adminCount / totalUsers * 100) : 0}%)</span>
                                </div>
                                <div style="height: 8px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden;">
                                    <div style="width: ${totalUsers > 0 ? (adminCount / totalUsers * 100) : 0}%; height: 100%; background: linear-gradient(90deg, #FF9800, #FFB74D); border-radius: 4px; transition: width 0.5s;"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Service Health -->
                    <div style="background: var(--bg-card); padding: 28px; border-radius: 14px; border: 1px solid var(--border-color);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <h3 style="margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-primary);">Service Health</h3>
                            <span style="padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; background: ${healthData ? (allUp ? 'rgba(76,175,80,0.1)' : 'rgba(244,67,54,0.1)') : 'rgba(255,152,0,0.1)'}; color: ${healthData ? (allUp ? '#4CAF50' : '#F44336') : '#FFA000'};">
                                ${healthData ? (allUp ? 'ALL SYSTEMS GO' : 'DEGRADED') : 'GATEWAY UNREACHABLE'}
                            </span>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 8px; max-height: 280px; overflow-y: auto;">
                            ${servicesHTML || '<p style="color: var(--text-muted); text-align: center; padding: 20px;">Could not fetch service status</p>'}
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div style="background: var(--bg-card); padding: 24px; border-radius: 14px; border: 1px solid var(--border-color);">
                    <h3 style="margin-bottom: 16px; font-size: 1.1rem; font-weight: 800;">Quick Actions</h3>
                    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                        <button class="btn btn-secondary" onclick="activateTab('admin-users')" style="padding: 10px 20px; border-radius: 10px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                            <i class="fa-solid fa-users-gear"></i> Manage Users
                        </button>
                        <button class="btn btn-secondary" onclick="activateTab('admin-verify')" style="padding: 10px 20px; border-radius: 10px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                            <i class="fa-solid fa-user-check"></i> Verification Queue ${pendingVerifications > 0 ? `<span style="background: #FFA000; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem;">${pendingVerifications}</span>` : ''}
                        </button>
                        <button class="btn btn-secondary" onclick="activateTab('admin-analytics')" style="padding: 10px 20px; border-radius: 10px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                            <i class="fa-solid fa-chart-line"></i> Platform Analytics
                        </button>
                    </div>
                </div>
            </div>
        `;
    } catch (e) {
        console.error('[Admin Stats] Error:', e);
        tracksContainer.innerHTML = `
            <div style="text-align: center; padding: 60px; color: var(--text-secondary);">
                <i class="fa-solid fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 16px; color: #FFA000;"></i>
                <p>Failed to load platform statistics.</p>
                <button onclick="showAdminStats()" class="btn btn-secondary" style="margin-top: 16px;">Retry</button>
            </div>
        `;
    }
};

// Admin Verification Queue (Enhanced)
window.showAdminVerify = async function () {
    const tracksContainer = document.getElementById('tracksContainer');
    const feedTitle = document.getElementById('feedTitle');
    feedTitle.textContent = 'Artist Verification Queue';

    tracksContainer.innerHTML = `
        <div id="verifyQueue">
            <div style="text-align: center; padding: 60px;">
                <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 2rem; color: var(--accent-primary); margin-bottom: 16px; display: block;"></i>
                <p style="color: var(--text-muted);">Loading verification requests...</p>
            </div>
        </div>
    `;

    try {
        const response = await authFetch(`${API_URL}/api/auth/merchants`);
        if (!response.ok) {
            console.error('[Admin Verify] Merchants API returned status:', response.status);
            throw new Error(`API returned ${response.status}`);
        }
        const data = await response.json();
        console.log('[Admin Verify] Full data received:', data);

        // Filter for users who are merchants but NOT verified
        const merchants = (data.merchants || []).filter(m => {
            const isUnverified = m.isVerified === false || m.isVerified === null || m.isVerified === 0;
            const isMerchant = m.userType === 'merchant';
            return isMerchant && isUnverified;
        });

        console.log('[Admin Verify] Processed unverified merchants:', merchants);

        if (merchants.length === 0) {
            document.getElementById('verifyQueue').innerHTML = `
                <div style="background: var(--bg-card); padding: 60px; border-radius: 14px; text-align: center; border: 1px solid var(--border-color);">
                    <i class="fa-solid fa-circle-check" style="font-size: 3rem; color: #4CAF50; margin-bottom: 16px;"></i>
                    <h3 style="margin-bottom: 8px; color: var(--text-primary);">All Clear!</h3>
                    <p style="color: var(--text-muted);">No pending artist verifications at this time.</p>
                </div>
            `;
            return;
        }

        feedTitle.textContent = `Artist Verification Queue (${merchants.length})`;

        document.getElementById('verifyQueue').innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 16px; animation: fadeIn 0.3s ease;">
                ${merchants.map(m => `
                    <div style="background: var(--bg-card); padding: 28px; border-radius: 14px; border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: flex-start; gap: 20px;">
                        <div style="display: flex; gap: 20px; align-items: flex-start; flex: 1;">
                            <div style="width: 56px; height: 56px; border-radius: 14px; background: var(--accent-gradient); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 1.3rem; flex-shrink: 0;">${(m.name || '?')[0].toUpperCase()}</div>
                            <div style="flex: 1;">
                                <h3 style="margin: 0 0 4px 0; font-size: 1.1rem; font-weight: 800;">${m.artistName || m.name}</h3>
                                <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0 0 8px 0;">${m.email}</p>
                                <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 8px;">
                                    ${m.artistName ? `<span style="font-size: 0.75rem; background: rgba(156, 39, 176, 0.1); color: #AB47BC; padding: 3px 10px; border-radius: 20px; font-weight: 700;">Artist: ${m.artistName}</span>` : ''}
                                    ${m.recordLabel ? `<span style="font-size: 0.75rem; background: rgba(33, 150, 243, 0.1); color: #42A5F5; padding: 3px 10px; border-radius: 20px; font-weight: 700;">Label: ${m.recordLabel}</span>` : ''}
                                    <span style="font-size: 0.75rem; background: rgba(255, 152, 0, 0.1); color: #FFA000; padding: 3px 10px; border-radius: 20px; font-weight: 700;">
                                        <i class="fa-solid fa-clock" style="margin-right: 4px;"></i>Requested ${new Date(m.upgradedAt || m.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                ${m.bio ? `<p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5; margin: 4px 0 0 0; max-width: 500px;">${m.bio.substring(0, 150)}${m.bio.length > 150 ? '...' : ''}</p>` : ''}
                            </div>
                        </div>
                        <div style="display: flex; gap: 10px; flex-shrink: 0;">
                            <button class="btn" onclick="approveMerchant('${m.id}')" style="background: #2E7D32; color: white; padding: 10px 20px; border-radius: 10px; font-weight: 700; font-size: 0.85rem;">
                                <i class="fa-solid fa-check" style="margin-right: 6px;"></i>Verify
                            </button>
                            <button class="btn" onclick="rejectMerchant('${m.id}')" style="background: rgba(198, 40, 40, 0.1); color: #C62828; padding: 10px 20px; border-radius: 10px; font-weight: 700; border: 1px solid rgba(198, 40, 40, 0.3); font-size: 0.85rem;">
                                <i class="fa-solid fa-xmark" style="margin-right: 6px;"></i>Reject
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (e) {
        console.error('[Admin Verify] Error:', e);
        document.getElementById('verifyQueue').innerHTML = `
            <div style="text-align: center; padding: 60px; color: var(--text-secondary);">
                <i class="fa-solid fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 16px; color: #FFA000;"></i>
                <p>Failed to load verification queue.</p>
                <button onclick="showAdminVerify()" class="btn btn-secondary" style="margin-top: 16px;">Retry</button>
            </div>
        `;
    }
};

// Admin User Management (Enhanced)
window.showAdminUsers = async function () {
    const tracksContainer = document.getElementById('tracksContainer');
    const feedTitle = document.getElementById('feedTitle');
    feedTitle.textContent = 'User Management';

    tracksContainer.innerHTML = `
        <div id="usersList">
            <div style="text-align: center; padding: 60px;">
                <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 2rem; color: var(--accent-primary); margin-bottom: 16px; display: block;"></i>
                <p style="color: var(--text-muted);">Loading platform users...</p>
            </div>
        </div>
    `;

    try {
        const response = await authFetch(`${API_URL}/api/auth/users`);
        const data = await response.json();
        const users = data.users || [];

        // Store globally so filter can reuse
        window._adminAllUsers = users;

        renderAdminUserTable(users, true);
    } catch (e) {
        console.error('[Admin Users] Error:', e);
        document.getElementById('usersList').innerHTML = `
            <div style="text-align: center; padding: 60px; color: var(--text-secondary);">
                <i class="fa-solid fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 16px; color: #FFA000;"></i>
                <p>Failed to load users.</p>
                <button onclick="showAdminUsers()" class="btn btn-secondary" style="margin-top: 16px;">Retry</button>
            </div>
        `;
    }
};

// Render User Table with filters
// Splits render into controls (once) + table body (re-rendered on filter)
window.renderAdminUserTable = function (users, isInitialRender = false) {
    const container = document.getElementById('usersList');
    if (!container) return;

    // Only render the full container (controls + table shell) on initial render
    if (isInitialRender || !document.getElementById('adminUserTableBody')) {
        const savedSearch = document.getElementById('adminUserSearch')?.value || '';
        const savedRole = document.getElementById('adminRoleFilter')?.value || 'all';

        container.innerHTML = `
            <div style="animation: fadeIn 0.3s ease;">
                <!-- Search & Filter Bar -->
                <div style="display: flex; gap: 12px; margin-bottom: 20px; align-items: center;">
                    <div style="flex: 1; position: relative;">
                        <i class="fa-solid fa-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted);"></i>
                        <input type="text" id="adminUserSearch" placeholder="Search by name or email... (press Enter)"
                            value="${savedSearch}"
                            style="width: 100%; padding: 12px 12px 12px 40px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 10px; color: var(--text-primary); font-size: 0.9rem;">
                    </div>
                    <select id="adminRoleFilter"
                        style="padding: 12px 16px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 10px; color: var(--text-primary); font-size: 0.9rem; cursor: pointer; font-weight: 600;">
                        <option value="all"${savedRole === 'all' ? ' selected' : ''}>All Roles</option>
                        <option value="consumer"${savedRole === 'consumer' ? ' selected' : ''}>Listeners</option>
                        <option value="merchant"${savedRole === 'merchant' ? ' selected' : ''}>Artists</option>
                        <option value="admin"${savedRole === 'admin' ? ' selected' : ''}>Admins</option>
                    </select>
                    <span id="adminUserCount" style="padding: 12px 16px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 10px; font-size: 0.85rem; font-weight: 700; color: var(--text-secondary);">
                        ${users.length} users
                    </span>
                </div>

                <!-- User Table -->
                <div style="border-radius: 14px; overflow: hidden; border: 1px solid var(--border-color);">
                    <table style="width: 100%; border-collapse: collapse; background: var(--bg-card);">
                        <thead>
                            <tr style="background: var(--bg-secondary); text-align: left;">
                                <th style="padding: 14px 16px; font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); font-weight: 800; letter-spacing: 0.5px;">User</th>
                                <th style="padding: 14px 16px; font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); font-weight: 800; letter-spacing: 0.5px;">Role</th>
                                <th style="padding: 14px 16px; font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); font-weight: 800; letter-spacing: 0.5px;">Status</th>
                                <th style="padding: 14px 16px; font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); font-weight: 800; letter-spacing: 0.5px;">Email</th>
                                <th style="padding: 14px 16px; font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); font-weight: 800; letter-spacing: 0.5px;">Joined</th>
                                <th style="padding: 14px 16px; font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); font-weight: 800; letter-spacing: 0.5px;">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="adminUserTableBody"></tbody>
                    </table>
                </div>
            </div>
        `;

        // Attach search: debounce + Enter key
        const searchInput = document.getElementById('adminUserSearch');
        let debounceTimer = null;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => filterAdminUsers(), 300);
        });
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                clearTimeout(debounceTimer);
                filterAdminUsers();
            }
        });

        // Attach dropdown change
        document.getElementById('adminRoleFilter').addEventListener('change', () => {
            filterAdminUsers();
        });
    }

    // Update just the table body
    _renderAdminTableRows(users);
};

// Internal: render just the <tbody> rows (preserves controls)
window._renderAdminTableRows = function (users) {
    const tbody = document.getElementById('adminUserTableBody');
    if (!tbody) return;

    const getRoleBadge = (u) => {
        if (u.isAdmin) return { label: 'ADMIN', bg: 'rgba(255, 152, 0, 0.12)', color: '#E65100' };
        if (u.userType === 'merchant') return { label: 'ARTIST', bg: 'rgba(156, 39, 176, 0.12)', color: '#7B1FA2' };
        return { label: 'LISTENER', bg: 'rgba(33, 150, 243, 0.12)', color: '#1565C0' };
    };

    const getStatusBadge = (u) => {
        if (u.isAdmin) return { label: 'Admin', bg: 'rgba(255, 152, 0, 0.12)', color: '#E65100' };
        if (u.userType === 'merchant' && u.isVerified) return { label: 'Verified', bg: 'rgba(76, 175, 80, 0.12)', color: '#2E7D32' };
        if (u.userType === 'merchant' && !u.isVerified) return { label: 'Pending', bg: 'rgba(255, 152, 0, 0.12)', color: '#FFA000' };
        return { label: 'Active', bg: 'rgba(76, 175, 80, 0.12)', color: '#4CAF50' };
    };

    tbody.innerHTML = users.map(u => {
        const role = getRoleBadge(u);
        const status = getStatusBadge(u);
        return `
            <tr style="border-bottom: 1px solid var(--border-color); transition: background 0.15s; cursor: pointer;"
                onmouseenter="this.style.background='var(--bg-secondary)'" onmouseleave="this.style.background=''"
                onclick="showUserDetailModal('${u.id}')">
                <td style="padding: 14px 16px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 36px; height: 36px; border-radius: 10px; background: var(--accent-gradient); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 0.85rem; flex-shrink: 0;">${(u.name || '?')[0].toUpperCase()}</div>
                        <div>
                            <p style="font-weight: 700; margin: 0; font-size: 0.9rem; color: var(--text-primary);">${u.name}</p>
                            <p style="font-size: 0.75rem; color: var(--text-muted); margin: 2px 0 0 0;">${u.nationality || ''}</p>
                        </div>
                    </div>
                </td>
                <td style="padding: 14px 16px;">
                    <span style="padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; background: ${role.bg}; color: ${role.color}; letter-spacing: 0.3px;">
                        ${role.label}
                    </span>
                </td>
                <td style="padding: 14px 16px;">
                    <span style="padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; background: ${status.bg}; color: ${status.color};">
                        ${status.label}
                    </span>
                </td>
                <td style="padding: 14px 16px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 0.85rem; color: var(--text-secondary);">${u.email}</span>
                        ${u.isEmailVerified ? '<i class="fa-solid fa-circle-check" style="color: #4CAF50; font-size: 0.75rem;"></i>' : '<i class="fa-solid fa-circle-xmark" style="color: var(--text-muted); font-size: 0.75rem;"></i>'}
                    </div>
                </td>
                <td style="padding: 14px 16px; font-size: 0.85rem; color: var(--text-muted);">${new Date(u.createdAt).toLocaleDateString()}</td>
                <td style="padding: 14px 16px;" onclick="event.stopPropagation()">
                    ${!u.isAdmin ? `<button class="btn btn-secondary" style="padding: 6px 14px; font-size: 0.75rem; border-radius: 8px; font-weight: 700;" onclick="deleteUser('${u.id}')">
                        <i class="fa-solid fa-trash" style="margin-right: 4px;"></i>Delete
                    </button>` : '<span style="font-size: 0.75rem; color: var(--text-muted);">Protected</span>'}
                </td>
            </tr>`;
    }).join('');

    // Update user count
    const countEl = document.getElementById('adminUserCount');
    if (countEl) countEl.textContent = `${users.length} users`;
};

// User Detail Modal
window.showUserDetailModal = function (userId) {
    const users = window._adminAllUsers || [];
    const u = users.find(us => us.id === userId);
    if (!u) return;

    const getRoleLabel = (u) => {
        if (u.isAdmin) return 'Admin';
        if (u.userType === 'merchant') return 'Artist (Merchant)';
        return 'Listener (Consumer)';
    };

    const overlay = document.createElement('div');
    overlay.className = 'user-detail-modal-overlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center;
        z-index: 10000; animation: fadeIn 0.2s ease;
    `;

    const card = document.createElement('div');
    card.style.cssText = `
        background: var(--bg-card, #1a1a2e); border: 1px solid var(--border-color, #2a2a3e);
        border-radius: 20px; padding: 36px; max-width: 560px; width: 95%;
        box-shadow: 0 24px 48px rgba(0,0,0,0.5); animation: slideUp 0.25s ease;
        max-height: 85vh; overflow-y: auto;
    `;

    const detailRow = (label, value) => value ? `
        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <span style="color: var(--text-muted, #888); font-size: 0.85rem; font-weight: 600;">${label}</span>
            <span style="color: var(--text-primary, #fff); font-size: 0.85rem; font-weight: 700; text-align: right; max-width: 60%; word-break: break-all;">${value}</span>
        </div>
    ` : '';

    const verifiedBadge = u.userType === 'merchant'
        ? (u.isVerified
            ? '<span style="background: rgba(76,175,80,0.12); color: #2E7D32; padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 800;">✓ VERIFIED</span>'
            : '<span style="background: rgba(255,152,0,0.12); color: #FFA000; padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 800;">⏳ PENDING</span>')
        : '';

    card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
            <div style="display: flex; align-items: center; gap: 16px;">
                <div style="width: 56px; height: 56px; border-radius: 16px; background: var(--accent-gradient); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 1.4rem; flex-shrink: 0;">${(u.name || '?')[0].toUpperCase()}</div>
                <div>
                    <h2 style="margin: 0 0 4px 0; font-size: 1.4rem; font-weight: 800;">${u.name || 'Unknown'}</h2>
                    <p style="margin: 0; color: var(--text-muted, #888); font-size: 0.85rem;">${u.email}</p>
                </div>
            </div>
            <button id="closeUserDetail" style="background: none; border: none; color: var(--text-muted, #888); font-size: 1.5rem; cursor: pointer; padding: 4px 8px; transition: color 0.2s;">&times;</button>
        </div>

        ${verifiedBadge ? `<div style="margin-bottom: 20px;">${verifiedBadge}</div>` : ''}

        <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 4px 16px; margin-bottom: 16px;">
            <h4 style="color: var(--text-muted, #888); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; margin: 12px 0 4px 0;">Account Info</h4>
            ${detailRow('User ID', u.id)}
            ${detailRow('Role', getRoleLabel(u))}
            ${detailRow('Email Verified', u.isEmailVerified ? '✅ Yes' : '❌ No')}
            ${detailRow('Joined', new Date(u.createdAt).toLocaleString())}
        </div>

        <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 4px 16px; margin-bottom: 16px;">
            <h4 style="color: var(--text-muted, #888); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; margin: 12px 0 4px 0;">Demographics</h4>
            ${detailRow('Age', u.age || '—')}
            ${detailRow('Gender', u.gender ? u.gender.charAt(0).toUpperCase() + u.gender.slice(1) : '—')}
            ${detailRow('Nationality', u.nationality || '—')}
        </div>

        ${u.userType === 'merchant' ? `
        <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 4px 16px; margin-bottom: 16px;">
            <h4 style="color: var(--text-muted, #888); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; margin: 12px 0 4px 0;">Artist Info</h4>
            ${detailRow('Artist Name', u.artistName || '—')}
            ${detailRow('Record Label', u.recordLabel || '—')}
            ${detailRow('Verified', u.isVerified ? '✅ Yes' : '❌ No')}
            ${detailRow('Upgraded At', u.upgradedAt ? new Date(u.upgradedAt).toLocaleString() : '—')}
            ${u.bio ? `<div style="padding: 10px 0;"><span style="color: var(--text-muted, #888); font-size: 0.85rem; font-weight: 600;">Bio</span><p style="color: var(--text-secondary, #ccc); font-size: 0.85rem; line-height: 1.6; margin: 6px 0 0 0;">${u.bio}</p></div>` : ''}
            ${u.website ? detailRow('Website', `<a href="${u.website}" target="_blank" style="color: #7c3aed;">${u.website}</a>`) : ''}
        </div>
        ` : ''}

        <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 20px; margin-top: 20px;">
            <h4 style="color: var(--text-muted, #888); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">Admin Actions</h4>
            <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                <select id="modalRoleSelect_${u.id}" style="padding: 8px 14px; font-size: 0.8rem; border-radius: 8px; background: var(--bg-secondary, #222); border: 1px solid var(--border-color, #333); color: var(--text-primary, #fff); font-weight: 700; cursor: pointer;">
                    <option value="" selected disabled>Change Role…</option>
                    <option value="merchant">Artist</option>
                    <option value="admin">Admin</option>
                </select>
                <button class="btn" onclick="const sel = document.getElementById('modalRoleSelect_${u.id}'); if(sel.value) { changeUserRole('${u.id}', sel.value); document.querySelector('.user-detail-modal-overlay')?.remove(); }"
                    style="padding: 8px 16px; background: rgba(124,58,237,0.12); color: #7C3AED; border: 1px solid rgba(124,58,237,0.3); border-radius: 8px; font-weight: 700; font-size: 0.8rem; cursor: pointer;">
                    <i class="fa-solid fa-user-pen" style="margin-right: 5px;"></i>Apply
                </button>
                ${!u.isEmailVerified ? `
                <button class="btn" onclick="adminVerifyEmail('${u.id}'); document.querySelector('.user-detail-modal-overlay')?.remove();"
                    style="padding: 8px 16px; background: rgba(33,150,243,0.1); color: #1976D2; border: 1px solid rgba(33,150,243,0.3); border-radius: 8px; font-weight: 700; font-size: 0.8rem; cursor: pointer;">
                    <i class="fa-solid fa-envelope-circle-check" style="margin-right: 5px;"></i>Verify Email
                </button>` : ''}
                ${!u.isAdmin ? `
                <button class="btn" onclick="deleteUser('${u.id}'); document.querySelector('.user-detail-modal-overlay')?.remove();"
                    style="padding: 8px 16px; background: rgba(198,40,40,0.1); color: #C62828; border: 1px solid rgba(198,40,40,0.3); border-radius: 8px; font-weight: 700; font-size: 0.8rem; cursor: pointer;">
                    <i class="fa-solid fa-trash" style="margin-right: 5px;"></i>Delete User
                </button>` : ''}
            </div>
        </div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // Close handlers
    document.getElementById('closeUserDetail').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
};

// Filter admin users table (debounced, preserves controls)
window.filterAdminUsers = function () {
    const search = (document.getElementById('adminUserSearch')?.value || '').toLowerCase();
    const role = document.getElementById('adminRoleFilter')?.value || 'all';
    let users = window._adminAllUsers || [];

    if (search) {
        users = users.filter(u => u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search));
    }
    if (role !== 'all') {
        if (role === 'admin') {
            users = users.filter(u => u.isAdmin);
        } else {
            users = users.filter(u => u.userType === role && !u.isAdmin);
        }
    }

    _renderAdminTableRows(users);
};

window.approveMerchant = async function (merchantId) {
    if (!confirm('Verify this artist? They will be able to upload music and receive payouts.')) return;

    try {
        const response = await authFetch(`${API_URL}/api/auth/merchants/${merchantId}/verify`, {
            method: 'POST'
        });

        if (response.ok) {
            alert('Artist verified successfully!');
            showAdminVerify();
        } else {
            const data = await response.json();
            alert('Failed: ' + (data.message || 'Unknown error'));
        }
    } catch (e) {
        alert('Verification failed. Server unreachable.');
    }
};

window.rejectMerchant = async function (merchantId) {
    const reason = prompt('Reason for rejection:');
    if (reason === null) return;

    try {
        const response = await authFetch(`${API_URL}/api/auth/merchants/${merchantId}/unverify`, {
            method: 'POST'
        });

        if (response.ok) {
            alert('Merchant request rejected.');
            showAdminVerify();
        } else {
            alert('Failed to reject request.');
        }
    } catch (e) {
        alert('Action failed.');
    }
};

window.deleteUser = async function (userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
        const response = await authFetch(`${API_URL}/api/auth/${userId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('User deleted successfully.');
            showAdminUsers();
        } else {
            const data = await response.json();
            alert('Failed: ' + (data.message || 'Unknown error'));
        }
    } catch (e) {
        alert('Delete failed. Server unreachable.');
    }
};

// Admin: Change user role
window.changeUserRole = async function (userId, newRole) {
    const roleLabels = { consumer: 'Listener', merchant: 'Artist', admin: 'Admin' };
    const label = roleLabels[newRole] || newRole;

    if (newRole === 'admin') {
        if (!confirm(`⚠️ Promote this user to ADMIN? They will gain FULL platform access.`)) return;
    } else {
        if (!confirm(`Change this user's role to ${label}?`)) return;
    }

    try {
        const body = newRole === 'admin'
            ? { isAdmin: true }
            : { userType: newRole, isAdmin: false };

        const response = await authFetch(`${API_URL}/api/auth/${userId}/role`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (response.ok) {
            alert(`Role updated to ${label} successfully!`);
            showAdminUsers(); // Refresh table
        } else {
            const data = await response.json();
            alert('Failed: ' + (data.message || 'Unknown error'));
        }
    } catch (e) {
        alert('Role change failed. Server unreachable.');
    }
};

// Admin: Verify user email
window.adminVerifyEmail = async function (userId) {
    if (!confirm('Mark this user\'s email as verified?')) return;

    try {
        const response = await authFetch(`${API_URL}/api/auth/${userId}/verify-email`, {
            method: 'POST'
        });

        if (response.ok) {
            alert('Email verified successfully!');
            showAdminUsers(); // Refresh table
        } else {
            const data = await response.json();
            alert('Failed: ' + (data.message || 'Unknown error'));
        }
    } catch (e) {
        alert('Email verification failed. Server unreachable.');
    }
};

// Admin Analytics — Demographics, Revenue, Tips, Trending
window.showAdminAnalytics = async function () {
    const tracksContainer = document.getElementById('tracksContainer');
    const feedTitle = document.getElementById('feedTitle');
    feedTitle.textContent = 'Platform Analytics';

    // Store fetched data globally for sub-tab switching
    window._analyticsData = window._analyticsData || { users: [], revenue: null, tips: [] };

    // Sub-tab bar + content area
    tracksContainer.innerHTML = `
        <div class="admin-analytics" style="animation: fadeIn 0.3s ease;">
            <div id="analyticsSubTabs" style="display: flex; gap: 4px; background: var(--bg-secondary); border-radius: 12px; padding: 4px; margin-bottom: 24px; width: fit-content;">
                <button class="analytics-sub-tab active" data-subtab="users" onclick="switchAnalyticsSubTab('users')"
                    style="padding: 10px 22px; border-radius: 10px; border: none; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.25s; background: var(--accent-gradient); color: white;">
                    <i class="fa-solid fa-users" style="margin-right: 6px;"></i>Users
                </button>
                <button class="analytics-sub-tab" data-subtab="revenue" onclick="switchAnalyticsSubTab('revenue')"
                    style="padding: 10px 22px; border-radius: 10px; border: none; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.25s; background: transparent; color: var(--text-secondary);">
                    <i class="fa-solid fa-coins" style="margin-right: 6px;"></i>Revenue & Tips
                </button>
                <button class="analytics-sub-tab" data-subtab="artist" onclick="switchAnalyticsSubTab('artist')"
                    style="padding: 10px 22px; border-radius: 10px; border: none; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.25s; background: transparent; color: var(--text-secondary);">
                    <i class="fa-solid fa-music" style="margin-right: 6px;"></i>Artist Analytics
                </button>
            </div>
            <div id="analyticsSubContent">
                <div style="text-align: center; padding: 40px;"><i class="fa-solid fa-circle-notch fa-spin" style="font-size: 2rem; color: var(--accent-primary);"></i></div>
            </div>
        </div>
    `;

    // Fetch core data
    try {
        const [usersRes, revenueRes, tipsRes] = await Promise.all([
            authFetch(`${API_URL}/api/auth/users`).catch(() => null),
            authFetch(`${API_URL}/api/payment/analytics/platform/revenue`).catch(() => null),
            authFetch(`${API_URL}/api/payment/analytics/platform/tips`).catch(() => null)
        ]);
        if (usersRes && usersRes.ok) { const d = await usersRes.json(); window._analyticsData.users = d.users || []; }
        if (revenueRes && revenueRes.ok) { const d = await revenueRes.json(); window._analyticsData.revenue = d.revenue || null; }
        if (tipsRes && tipsRes.ok) { const d = await tipsRes.json(); window._analyticsData.tips = d.leaderboard || []; }
    } catch (e) { console.error('[Analytics] Fetch error:', e); }

    // Show default sub-tab
    switchAnalyticsSubTab('users');
};

window.switchAnalyticsSubTab = function (tab) {
    // Update tab buttons
    document.querySelectorAll('.analytics-sub-tab').forEach(btn => {
        if (btn.dataset.subtab === tab) {
            btn.style.background = 'var(--accent-gradient)';
            btn.style.color = 'white';
            btn.classList.add('active');
        } else {
            btn.style.background = 'transparent';
            btn.style.color = 'var(--text-secondary)';
            btn.classList.remove('active');
        }
    });
    const container = document.getElementById('analyticsSubContent');
    if (!container) return;
    if (tab === 'users') _renderUsersAnalytics(container);
    else if (tab === 'revenue') _renderRevenueAnalytics(container);
    else if (tab === 'artist') _renderArtistAnalytics(container);
};

function _renderUsersAnalytics(container) {
    const users = window._analyticsData?.users || [];
    const ageGroups = { '13-17': 0, '18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55+': 0, 'Unknown': 0 };
    users.forEach(u => {
        if (!u.age) { ageGroups['Unknown']++; return; }
        if (u.age <= 17) ageGroups['13-17']++; else if (u.age <= 24) ageGroups['18-24']++;
        else if (u.age <= 34) ageGroups['25-34']++; else if (u.age <= 44) ageGroups['35-44']++;
        else if (u.age <= 54) ageGroups['45-54']++; else ageGroups['55+']++;
    });
    const genders = {}, nationalities = {};
    users.forEach(u => {
        const g = u.gender ? u.gender.charAt(0).toUpperCase() + u.gender.slice(1).replace(/_/g, ' ') : 'Unknown';
        genders[g] = (genders[g] || 0) + 1;
        const n = u.nationality || 'Unknown';
        nationalities[n] = (nationalities[n] || 0) + 1;
    });
    const topNat = Object.entries(nationalities).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const genderColors = { Male: '#2196F3', Female: '#E91E63', Other: '#9C27B0', 'Prefer not to say': '#607D8B', Unknown: '#9E9E9E' };

    const barRow = (label, count, total, color, labelW = '50px') => {
        const pct = total > 0 ? (count / total * 100) : 0;
        return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <span style="width:${labelW};font-size:0.8rem;font-weight:700;color:var(--text-secondary);">${label}</span>
            <div style="flex:1;height:8px;background:var(--bg-secondary);border-radius:4px;overflow:hidden;">
                <div style="width:${pct}%;height:100%;background:${color};border-radius:4px;transition:width 0.5s;"></div>
            </div>
            <span style="width:55px;text-align:right;font-size:0.8rem;font-weight:700;color:var(--text-primary);">${count} (${Math.round(pct)}%)</span>
        </div>`;
    };

    const ageHTML = Object.entries(ageGroups).filter(([, v]) => v > 0).map(([l, c]) => barRow(l, c, users.length, 'linear-gradient(90deg,#7C3AED,#CC0EF0)')).join('');
    const genderHTML = Object.entries(genders).map(([l, c]) => barRow(l, c, users.length, genderColors[l] || '#9E9E9E', '120px')).join('');
    const natHTML = topNat.map(([nat, count], i) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--bg-secondary);border-radius:8px;border:1px solid var(--border-color);">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="width:24px;height:24px;border-radius:50%;background:var(--accent-gradient);display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:800;color:white;">${i + 1}</span>
                <span style="font-weight:700;font-size:0.85rem;">${nat}</span>
            </div>
            <span style="font-size:0.8rem;font-weight:700;color:var(--text-muted);">${count} users</span>
        </div>`).join('');

    // User type breakdown
    const listeners = users.filter(u => u.userType === 'consumer' && !u.isAdmin).length;
    const artists = users.filter(u => u.userType === 'merchant').length;
    const admins = users.filter(u => u.isAdmin).length;

    container.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:24px;">
            <div style="background:var(--bg-card);padding:20px;border-radius:14px;border:1px solid var(--border-color);text-align:center;">
                <p style="font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;font-weight:700;">Total Users</p>
                <h3 style="font-size:2rem;font-weight:900;margin:4px 0 0;color:var(--text-primary);">${users.length}</h3>
            </div>
            <div style="background:var(--bg-card);padding:20px;border-radius:14px;border:1px solid var(--border-color);text-align:center;">
                <p style="font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;font-weight:700;">Listeners / Artists</p>
                <h3 style="font-size:2rem;font-weight:900;margin:4px 0 0;color:#2196F3;">${listeners} / ${artists}</h3>
            </div>
            <div style="background:var(--bg-card);padding:20px;border-radius:14px;border:1px solid var(--border-color);text-align:center;">
                <p style="font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;font-weight:700;">Admins</p>
                <h3 style="font-size:2rem;font-weight:900;margin:4px 0 0;color:#E91E63;">${admins}</h3>
            </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;">
            <div style="background:var(--bg-card);padding:24px;border-radius:14px;border:1px solid var(--border-color);">
                <h4 style="font-size:0.9rem;font-weight:800;margin-bottom:16px;color:var(--text-secondary);">Age Distribution</h4>
                ${ageHTML || '<p style="color:var(--text-muted);">No data</p>'}
            </div>
            <div style="background:var(--bg-card);padding:24px;border-radius:14px;border:1px solid var(--border-color);">
                <h4 style="font-size:0.9rem;font-weight:800;margin-bottom:16px;color:var(--text-secondary);">Gender Distribution</h4>
                ${genderHTML || '<p style="color:var(--text-muted);">No data</p>'}
            </div>
        </div>
        <div style="background:var(--bg-card);padding:24px;border-radius:14px;border:1px solid var(--border-color);">
            <h4 style="font-size:0.9rem;font-weight:800;margin-bottom:16px;color:var(--text-secondary);">Top Nationalities</h4>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:8px;">${natHTML || '<p style="color:var(--text-muted);">No data</p>'}</div>
        </div>`;
}

function _renderRevenueAnalytics(container) {
    const { revenue, tips, users } = window._analyticsData || {};
    const revenueHTML = revenue ? `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:14px;">
            ${[
            ['Lifetime Earnings', `₦${revenue.lifetimeEarnings.toLocaleString()}`, '#4CAF50'],
            ['Monthly Revenue', `₦${revenue.monthlyRevenue.toLocaleString()}`, '#2196F3'],
            ['Total Transactions', revenue.totalTransactions.toLocaleString(), 'var(--text-primary)'],
            ['Total Tips', revenue.totalTips.toLocaleString(), '#E91E63'],
            ['Artists Earning', revenue.artistCount.toLocaleString(), '#9C27B0'],
            ['Total Withdrawn', `₦${revenue.totalWithdrawn.toLocaleString()}`, '#FF9800']
        ].map(([label, val, color]) => `
                <div style="background:var(--bg-secondary);padding:18px;border-radius:12px;border:1px solid var(--border-color);text-align:center;">
                    <p style="font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;font-weight:700;letter-spacing:0.5px;">${label}</p>
                    <h3 style="font-size:1.6rem;font-weight:900;margin:6px 0 0;color:${color};">${val}</h3>
                </div>`).join('')}
        </div>` : '<p style="color:var(--text-muted);text-align:center;padding:20px;">No revenue data available yet</p>';

    const medals = ['🥇', '🥈', '🥉'];
    const tipsHTML = (tips || []).length > 0 ? tips.map((t, i) => {
        const artist = (users || []).find(u => u.id === t.artistId);
        const name = artist ? (artist.artistName || artist.name) : (t.artistId || 'Unknown');
        return `<div style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:var(--bg-secondary);border-radius:10px;border:1px solid var(--border-color);">
            <span style="font-size:1.2rem;width:28px;text-align:center;">${medals[i] || `<span style="font-size:0.85rem;font-weight:800;color:var(--text-muted);">${i + 1}</span>`}</span>
            <div style="width:36px;height:36px;border-radius:10px;background:var(--accent-gradient);display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:0.85rem;flex-shrink:0;">${name[0].toUpperCase()}</div>
            <div style="flex:1;"><p style="font-weight:700;margin:0;font-size:0.9rem;">${name}</p><p style="font-size:0.75rem;color:var(--text-muted);margin:2px 0 0;">${t.tipCount} tips</p></div>
            <div style="text-align:right;"><p style="font-weight:800;margin:0;font-size:0.95rem;color:#4CAF50;">₦${t.totalAmount.toLocaleString()}</p><p style="font-size:0.7rem;color:var(--text-muted);margin:2px 0 0;">${t.totalCoins} coins</p></div>
        </div>`;
    }).join('') : '<p style="color:var(--text-muted);text-align:center;padding:20px;">No tips recorded yet</p>';

    container.innerHTML = `
        <h3 style="font-size:1.1rem;font-weight:800;margin-bottom:16px;"><i class="fa-solid fa-coins" style="margin-right:8px;color:#4CAF50;"></i>Platform Revenue</h3>
        <div style="background:var(--bg-card);padding:24px;border-radius:14px;border:1px solid var(--border-color);margin-bottom:28px;">${revenueHTML}</div>
        <h3 style="font-size:1.1rem;font-weight:800;margin-bottom:16px;"><i class="fa-solid fa-trophy" style="margin-right:8px;color:#E91E63;"></i>Tip Leaderboard</h3>
        <div style="background:var(--bg-card);padding:24px;border-radius:14px;border:1px solid var(--border-color);">
            <div style="display:flex;flex-direction:column;gap:10px;">${tipsHTML}</div>
        </div>`;
}

async function _renderArtistAnalytics(container) {
    container.innerHTML = `<div style="text-align:center;padding:40px;"><i class="fa-solid fa-circle-notch fa-spin" style="font-size:2rem;color:var(--accent-primary);"></i><p style="color:var(--text-muted);margin-top:12px;">Loading artist analytics...</p></div>`;

    try {
        // Fetch platform trending (local) + streaming top (global) + Audius trending in parallel
        const [platformRes, streamRes, audiusRes] = await Promise.all([
            authFetch(`${API_URL}/api/music/songs?source=local&limit=10`).catch(() => null),
            authFetch(`${API_URL}/api/stream/history/top?global=true&limit=10`).catch(() => null),
            authFetch(`${API_URL}/api/music/songs?source=audius&time=week&limit=10`).catch(() => null)
        ]);

        let platformTracks = [], topPlayed = [], audiusTrending = [];
        if (platformRes && platformRes.ok) { const d = await platformRes.json(); platformTracks = d.songs || []; }
        if (streamRes && streamRes.ok) {
            const d = await streamRes.json();
            topPlayed = d.topSongs || d.songs || d.history || d || [];
            if (!Array.isArray(topPlayed)) topPlayed = [];
        }
        if (audiusRes && audiusRes.ok) { const d = await audiusRes.json(); audiusTrending = d.songs || []; }

        // Most played songs (from streaming history)
        const mostPlayedHTML = topPlayed.length > 0 ? topPlayed.slice(0, 10).map((s, i) => {
            const title = s.title || s.songTitle || 'Unknown';
            const artist = s.artistName || s.artist?.name || 'Unknown';
            const plays = s.playCount || s.count || 0;
            return `<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--bg-secondary);border-radius:10px;border:1px solid var(--border-color);">
                <span style="width:24px;font-weight:800;font-size:0.85rem;color:var(--text-muted);text-align:center;">${i + 1}</span>
                <div style="width:40px;height:40px;border-radius:8px;background:var(--bg-card);overflow:hidden;flex-shrink:0;">
                    ${s.coverArtUrl ? `<img src="${s.coverArtUrl}" style="width:100%;height:100%;object-fit:cover;">` : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1rem;">🎵</div>'}
                </div>
                <div style="flex:1;min-width:0;"><p style="font-weight:700;margin:0;font-size:0.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${title}</p><p style="font-size:0.75rem;color:var(--text-muted);margin:2px 0 0;">${artist}</p></div>
                <span style="font-weight:800;font-size:0.85rem;color:#7C3AED;">${plays} plays</span>
            </div>`;
        }).join('') : '<p style="color:var(--text-muted);text-align:center;padding:16px;">No streaming data yet</p>';

        // Platform trending (most liked / popular songs)
        const trendingHTML = platformTracks.length > 0 ? platformTracks.slice(0, 10).map((s, i) => {
            const likes = s.likeCount || s.likes || 0;
            const plays = s.playCount || 0;
            return `<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--bg-secondary);border-radius:10px;border:1px solid var(--border-color);">
                <span style="width:24px;font-weight:800;font-size:0.85rem;color:var(--text-muted);text-align:center;">${i + 1}</span>
                <div style="width:40px;height:40px;border-radius:8px;background:var(--bg-card);overflow:hidden;flex-shrink:0;">
                    ${s.coverArtUrl ? `<img src="${s.coverArtUrl}" style="width:100%;height:100%;object-fit:cover;">` : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1rem;">🎵</div>'}
                </div>
                <div style="flex:1;min-width:0;"><p style="font-weight:700;margin:0;font-size:0.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${s.title}</p><p style="font-size:0.75rem;color:var(--text-muted);margin:2px 0 0;">${s.artist?.name || 'Unknown'}</p></div>
                <div style="display:flex;gap:12px;align-items:center;">
                    <span style="font-size:0.8rem;color:#E91E63;font-weight:700;">❤️ ${likes}</span>
                    <span style="font-size:0.8rem;color:#7C3AED;font-weight:700;">▶ ${plays}</span>
                </div>
            </div>`;
        }).join('') : '<p style="color:var(--text-muted);text-align:center;padding:16px;">No tracks yet</p>';

        // Artist leaderboard from users data
        const artistUsers = (window._analyticsData?.users || []).filter(u => u.userType === 'merchant');
        const artistHTML = artistUsers.length > 0 ? artistUsers.slice(0, 10).map((a, i) => `
            <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--bg-secondary);border-radius:10px;border:1px solid var(--border-color);">
                <span style="width:24px;font-weight:800;font-size:0.85rem;color:var(--text-muted);text-align:center;">${i + 1}</span>
                <div style="width:40px;height:40px;border-radius:10px;background:var(--accent-gradient);display:flex;align-items:center;justify-content:center;color:white;font-weight:800;flex-shrink:0;">${(a.artistName || a.name || '?')[0].toUpperCase()}</div>
                <div style="flex:1;"><p style="font-weight:700;margin:0;font-size:0.85rem;">${a.artistName || a.name}</p><p style="font-size:0.75rem;color:var(--text-muted);margin:2px 0 0;">${a.isVerified ? '✅ Verified' : '⏳ Pending'}</p></div>
                <span style="font-size:0.75rem;color:var(--text-muted);">Joined ${new Date(a.createdAt).toLocaleDateString()}</span>
            </div>`).join('') : '<p style="color:var(--text-muted);text-align:center;padding:16px;">No artists yet</p>';

        // Audius trending
        const audiusHTML = audiusTrending.length > 0 ? audiusTrending.slice(0, 8).map((s, i) => `
            <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--bg-secondary);border-radius:10px;border:1px solid var(--border-color);">
                <span style="width:24px;font-weight:800;font-size:0.85rem;color:var(--text-muted);text-align:center;">${i + 1}</span>
                <div style="width:40px;height:40px;border-radius:8px;background:var(--bg-card);overflow:hidden;flex-shrink:0;">
                    ${s.coverArtUrl ? `<img src="${s.coverArtUrl}" style="width:100%;height:100%;object-fit:cover;">` : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1rem;">🎵</div>'}
                </div>
                <div style="flex:1;min-width:0;"><p style="font-weight:700;margin:0;font-size:0.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${s.title}</p><p style="font-size:0.75rem;color:var(--text-muted);margin:2px 0 0;">${s.artist?.name || 'Unknown'}</p></div>
                <span style="font-size:0.75rem;padding:4px 10px;border-radius:6px;background:rgba(124,58,237,0.12);color:#7C3AED;font-weight:700;">Audius</span>
            </div>`).join('') : '<p style="color:var(--text-muted);text-align:center;padding:16px;">Could not load Audius data</p>';

        container.innerHTML = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;">
                <div style="background:var(--bg-card);padding:24px;border-radius:14px;border:1px solid var(--border-color);">
                    <h4 style="font-size:0.9rem;font-weight:800;margin-bottom:16px;color:var(--text-secondary);"><i class="fa-solid fa-fire" style="margin-right:6px;color:#FF5722;"></i>Most Played Songs</h4>
                    <div style="display:flex;flex-direction:column;gap:8px;">${mostPlayedHTML}</div>
                </div>
                <div style="background:var(--bg-card);padding:24px;border-radius:14px;border:1px solid var(--border-color);">
                    <h4 style="font-size:0.9rem;font-weight:800;margin-bottom:16px;color:var(--text-secondary);"><i class="fa-solid fa-heart" style="margin-right:6px;color:#E91E63;"></i>Popular Tracks</h4>
                    <div style="display:flex;flex-direction:column;gap:8px;">${trendingHTML}</div>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
                <div style="background:var(--bg-card);padding:24px;border-radius:14px;border:1px solid var(--border-color);">
                    <h4 style="font-size:0.9rem;font-weight:800;margin-bottom:16px;color:var(--text-secondary);"><i class="fa-solid fa-star" style="margin-right:6px;color:#FFC107;"></i>Platform Artists</h4>
                    <div style="display:flex;flex-direction:column;gap:8px;">${artistHTML}</div>
                </div>
                <div style="background:var(--bg-card);padding:24px;border-radius:14px;border:1px solid var(--border-color);">
                    <h4 style="font-size:0.9rem;font-weight:800;margin-bottom:16px;color:var(--text-secondary);"><i class="fa-brands fa-audible" style="margin-right:6px;color:#7C3AED;"></i>Audius Trending</h4>
                    <div style="display:flex;flex-direction:column;gap:8px;">${audiusHTML}</div>
                </div>
            </div>`;
    } catch (e) {
        console.error('[Artist Analytics]', e);
        container.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-secondary);"><p>Failed to load artist analytics.</p><button onclick="_renderArtistAnalytics(document.getElementById('analyticsSubContent'))" class="btn btn-secondary" style="margin-top:12px;">Retry</button></div>`;
    }
}

window.showSettingsPage = function () {
    window.location.href = '/settings';
};

window.showUploadPage = function () {
    const tracksContainer = document.getElementById('tracksContainer');
    const feedTitle = document.getElementById('feedTitle');
    feedTitle.textContent = 'Upload New Content';

    tracksContainer.innerHTML = `
        <div style="max-width: 600px; margin: 0 auto; background: var(--bg-card); padding: 32px; border-radius: 12px; border: 1px solid var(--border-color);">
            <div id="uploadForm" class="auth-form">
                <div class="form-group">
                    <label>Track Title</label>
                    <input type="text" id="trackTitle" placeholder="Enter track title">
                </div>
                <div class="form-group">
                    <label>Genre</label>
                    <select id="trackGenre" style="padding: 12px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px;">
                        <option value="Electronic">Electronic</option>
                        <option value="Hip-Hop">Hip-Hop</option>
                        <option value="Pop">Pop</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Audio File</label>
                    <input type="file" id="audioFile" accept="audio/*">
                </div>
                <div class="form-group">
                    <label>Cover Art</label>
                    <input type="file" id="coverArt" accept="image/*">
                </div>
                <button class="btn btn-primary" style="margin-top: 20px;" onclick="alert('Upload functionality pending backend integration.')">Upload Track</button>
            </div>
        </div>
    `;
};
