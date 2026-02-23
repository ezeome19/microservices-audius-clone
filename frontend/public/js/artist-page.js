// Artist Page JavaScript
if (typeof API_URL === 'undefined') {
    window.API_URL = window.location.origin;
}

let selectedPackage = null;
let selectedCurrency = 'NGN';
let artistId = null;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Get artist ID from URL
    const pathParts = window.location.pathname.split('/').filter(p => p !== '');
    artistId = pathParts[pathParts.length - 1];

    initializeModals();
    initializeTabs();
    initializeFollowButton();
    checkInitialFollowStatus();
    loadArtistStats();
    initializeSocialMenus();
});

/*
- [x] Fix Streaming Service Connectivity (Audit #ECONNREFUSED) <!-- id: 162 -->
- [ ] Enhancing Social and Tip Features <!-- id: 163 -->
  - [x] Fix tipping endpoint disconnections <!-- id: 164 -->
  - [x] Implement dynamic Follow/Unfollow UI updates <!-- id: 165 -->
  - [x] Fix tipping redirect routes <!-- id: 166 -->
  - [x] Implement Audio Player state persistence <!-- id: 167 -->
  - [x] Implement Dashboard tab persistence <!-- id: 168 -->
  - [ ] Final verification of end-to-end flow <!-- id: 169 -->
*/
// Load Consolidated Artist Stats
async function loadArtistStats() {
    try {
        const response = await (window.authFetch || fetch)(`${API_URL}/api/social/stats/${artistId}`);
        const data = await response.json();

        if (response.ok && data.stats) {
            const { followers, following, tracks } = data.stats;

            // Update Header Stats
            document.getElementById('headerFollowerCount').textContent = followers.toLocaleString();
            document.getElementById('headerTrackCount').textContent = tracks.toLocaleString();
            document.getElementById('headerFollowingCount').textContent = following.toLocaleString();
        }
    } catch (err) {
        console.error('Failed to load artist stats:', err);
    }
}

// Global Currency State for Tipping
let tipCurrency = 'NGN';
const currencyMap = {
    'NGN': { symbol: '₦', min: 10, placeholder: '500' },
    'USD': { symbol: '$', min: 1, placeholder: '5' }
};

function initializeTipping() {
    const tipAmountInput = document.getElementById('tipAmount');
    const sendTipBtn = document.getElementById('sendTipBtn');
    const currencyBtns = document.querySelectorAll('.tip-currency-btn');

    // Currency selection
    currencyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currencyBtns.forEach(b => {
                b.classList.remove('active');
                b.style.borderColor = 'var(--border-color)';
                b.style.background = 'var(--bg-secondary)';
                b.style.color = 'var(--text-primary)';
            });
            btn.classList.add('active');
            btn.style.borderColor = 'var(--accent-primary)';
            btn.style.background = 'rgba(204, 15, 224, 0.1)';
            btn.style.color = 'var(--accent-primary)';

            tipCurrency = btn.dataset.currency;
            updateTipCurrencyUI();
        });
    });

    if (tipAmountInput) {
        tipAmountInput.addEventListener('input', (e) => {
            updateTipBreakdown(e.target.value);
        });
    }

    if (sendTipBtn) {
        sendTipBtn.addEventListener('click', handleSendTip);
    }
}

function updateTipCurrencyUI() {
    const config = currencyMap[tipCurrency];
    document.getElementById('tipCurrencySymbol').textContent = config.symbol;
    document.getElementById('tipMinText').textContent = `Minimum: ${config.symbol}${config.min}`;
    document.getElementById('tipAmount').placeholder = config.placeholder;
    updateTipBreakdown(document.getElementById('tipAmount').value);
}

function updateTipBreakdown(amount) {
    const tipAmount = parseFloat(amount) || 0;
    const config = currencyMap[tipCurrency];
    const platformFee = tipAmount * 0.10;
    const artistReceives = tipAmount * 0.90;

    const symbol = config.symbol;
    document.getElementById('tipAmountDisplay').textContent = `${symbol}${tipAmount.toLocaleString()}`;
    document.getElementById('platformFeeDisplay').textContent = `${symbol}${platformFee.toLocaleString()}`;
    document.getElementById('artistReceivesDisplay').textContent = `${symbol}${artistReceives.toLocaleString()}`;

    const sendTipBtn = document.getElementById('sendTipBtn');
    sendTipBtn.disabled = tipAmount < config.min;
    sendTipBtn.textContent = tipAmount >= config.min ? 'Send Tip' : `Minimum ${symbol}${config.min}`;
}

// Modal Management
function initializeModals() {
    // Buy Coins Modal
    const buyCoinsBtn = document.getElementById('buyCoinsBtn');
    const coinModal = document.getElementById('coinPurchaseModal');

    if (buyCoinsBtn && coinModal) {
        buyCoinsBtn.addEventListener('click', () => {
            coinModal.classList.add('active');
        });
    }

    // Tip Modal
    const tipBtn = document.getElementById('tipBtn');
    const tipModal = document.getElementById('tipModal');

    if (tipBtn && tipModal) {
        tipBtn.addEventListener('click', () => {
            tipModal.classList.add('active');
        });
    }

    // Close modals
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.remove('active');
        });
    });

    // Close on background click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    initializeCoinPurchase();
    initializeTipping();
}

// Coin Purchase Logic
function initializeCoinPurchase() {
    const packages = document.querySelectorAll('.package-card');
    const currencyBtns = document.querySelectorAll('.currency-btn');
    const purchaseBtn = document.getElementById('purchaseBtn');

    // Package selection
    packages.forEach(pkg => {
        pkg.addEventListener('click', () => {
            packages.forEach(p => p.classList.remove('selected'));
            pkg.classList.add('selected');
            selectedPackage = pkg.dataset.packageId;
            updatePurchaseButton();
        });
    });

    // Currency selection
    currencyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currencyBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedCurrency = btn.dataset.currency;
            updatePurchaseButton();
        });
    });

    // Purchase button
    if (purchaseBtn) {
        purchaseBtn.addEventListener('click', handleCoinPurchase);
    }
}

function updatePurchaseButton() {
    const purchaseBtn = document.getElementById('purchaseBtn');
    if (selectedPackage) {
        purchaseBtn.disabled = false;
        purchaseBtn.textContent = `Buy with ${selectedCurrency}`;
    }
}

async function handleCoinPurchase() {
    if (!selectedPackage || !artistId) return;

    const purchaseBtn = document.getElementById('purchaseBtn');
    purchaseBtn.disabled = true;
    purchaseBtn.textContent = 'Processing...';

    try {
        const response = await (window.authFetch || fetch)(`${API_URL}/api/coins/purchase`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                artistId,
                packageId: selectedPackage,
                currency: selectedCurrency
            })
        });

        const data = await response.json();

        if (response.ok && data.paymentLink) {
            // Use Custom Modal for Flutterwave Hosted Checkout
            window.showFlutterwaveCustomModal(data, 'artist');
        } else {
            alert(data.error || data.message || 'Failed to initialize payment');
        }
    } catch (error) {
        console.error('Purchase error:', error);
        alert('An error occurred. Please try again.');
    } finally {
        purchaseBtn.disabled = false;
        purchaseBtn.textContent = `Buy with ${selectedCurrency}`;
    }
}

async function handleSendTip() {
    const tipAmount = parseFloat(document.getElementById('tipAmount').value);
    const tipMessage = document.getElementById('tipMessage').value;

    const config = currencyMap[tipCurrency];
    if (tipAmount < config.min || !artistId) return;

    const sendTipBtn = document.getElementById('sendTipBtn');
    sendTipBtn.disabled = true;
    sendTipBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';

    try {
        const response = await (window.authFetch || fetch)(`${API_URL}/api/payment/tips/${artistId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: tipAmount,
                currency: tipCurrency,
                message: tipMessage
            })
        });

        const data = await response.json();

        if (response.ok && data.paymentLink) {
            // Use Custom Modal for Flutterwave Hosted Checkout
            window.showFlutterwaveCustomModal(data, 'artist');
        } else {
            alert(`${data.error || data.message || 'Failed to initiate payment'}`);
        }
    } catch (error) {
        console.error('Tip error:', error);
        alert('An error occurred. Please try again.');
    } finally {
        sendTipBtn.disabled = false;
        sendTipBtn.textContent = 'Send Tip';
    }
}

// Tab Management
function initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;

            // Update active states
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Show corresponding content
            tabContents.forEach(content => {
                content.style.display = 'none';
            });
            const activeTab = document.getElementById(`${tabName}-tab`);
            if (activeTab) {
                activeTab.style.display = 'block';
            }

            // Load content based on tab
            if (tabName === 'albums' && !activeTab.dataset.loaded) {
                loadAlbums();
            } else if (tabName === 'playlists' && !activeTab.dataset.loaded) {
                loadPlaylists();
            } else if (tabName === 'exclusive' && !activeTab.dataset.loaded) {
                loadExclusiveContent();
            }
        });
    });
}

// Load Albums
async function loadAlbums() {
    const albumsTab = document.getElementById('albums-tab');
    if (!albumsTab) return;

    albumsTab.innerHTML = `
        <h3>Albums</h3>
        <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
            <p>Loading albums...</p>
        </div>
    `;

    try {
        const response = await (window.authFetch || fetch)(`${API_URL}/api/music/artists/${artistId}/albums`);

        if (!response.ok) {
            throw new Error('Failed to fetch albums');
        }

        const data = await response.json();
        const albums = data.albums || [];

        if (albums.length === 0) {
            albumsTab.innerHTML = `
                <h3>Albums</h3>
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <p>No albums available</p>
                </div>
            `;
        } else {
            renderAlbums(albums);
        }

        albumsTab.dataset.loaded = 'true';
    } catch (error) {
        console.error('Error loading albums:', error);
        albumsTab.innerHTML = `
            <h3>Albums</h3>
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <p>Failed to load albums. Please try again.</p>
                <button onclick="loadAlbums()" class="btn btn-secondary" style="margin-top: 16px;">Retry</button>
            </div>
        `;
    }
}

// Render Albums
function renderAlbums(albums) {
    const albumsTab = document.getElementById('albums-tab');

    let html = '<h3 style="margin-bottom: 20px;">Albums</h3>';
    html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;">';

    albums.forEach(album => {
        html += `
            <div style="background: var(--bg-card); border-radius: 12px; padding: 16px; transition: transform 0.2s; cursor: pointer;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">
                <div style="width: 100%; aspect-ratio: 1; background: var(--bg-secondary); border-radius: 8px; overflow: hidden; margin-bottom: 12px;">
                    ${album.coverArtUrl ? `<img src="${album.coverArtUrl}" alt="${album.name}" style="width: 100%; height: 100%; object-fit: cover;">` : ''}
                </div>
                <h4 style="margin: 0 0 8px 0; font-size: 1rem;">${album.name}</h4>
                <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">${album.releaseYear || 'Unknown'} • ${album.trackCount || 0} tracks</p>
            </div>
        `;
    });

    html += '</div>';
    albumsTab.innerHTML = html;
}

// Load Playlists
async function loadPlaylists() {
    const playlistsTab = document.getElementById('playlists-tab');
    if (!playlistsTab) return;

    playlistsTab.innerHTML = `
        <h3>Playlists</h3>
        <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
            <p>Loading playlists...</p>
        </div>
    `;

    try {
        const response = await (window.authFetch || fetch)(`${API_URL}/api/music/artists/${artistId}/playlists`);

        if (!response.ok) {
            throw new Error('Failed to fetch playlists');
        }

        const data = await response.json();
        const playlists = data.playlists || [];

        if (playlists.length === 0) {
            playlistsTab.innerHTML = `
                <h3>Playlists</h3>
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <p>No playlists available</p>
                </div>
            `;
        } else {
            renderArtistPlaylists(playlists);
        }

        playlistsTab.dataset.loaded = 'true';
    } catch (error) {
        console.error('Error loading playlists:', error);
        playlistsTab.innerHTML = `
            <h3>Playlists</h3>
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <p>Failed to load playlists. Please try again.</p>
                <button onclick="loadPlaylists()" class="btn btn-secondary" style="margin-top: 16px;">Retry</button>
            </div>
        `;
    }
}

// Render Artist Playlists
function renderArtistPlaylists(playlists) {
    const playlistsTab = document.getElementById('playlists-tab');

    let html = '<h3 style="margin-bottom: 20px;">Playlists</h3>';
    html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;">';

    playlists.forEach(playlist => {
        html += `
            <div style="background: var(--bg-card); border-radius: 12px; padding: 16px; transition: transform 0.2s; cursor: pointer;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">
                <div style="width: 100%; aspect-ratio: 1; background: var(--bg-secondary); border-radius: 8px; overflow: hidden; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; font-size: 3rem;">
                    📜
                </div>
                <h4 style="margin: 0 0 8px 0; font-size: 1rem;">${playlist.name}</h4>
                <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">${playlist.songCount || 0} songs</p>
            </div>
        `;
    });

    html += '</div>';
    playlistsTab.innerHTML = html;
}

// Load Exclusive Content
async function loadExclusiveContent() {
    const exclusiveTab = document.getElementById('exclusive-tab');
    if (!exclusiveTab) return;

    exclusiveTab.innerHTML = `
        <h3>Exclusive Content</h3>
        <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
            <p>Loading exclusive content...</p>
        </div>
    `;

    try {
        // Fetch exclusive songs for this artist
        const response = await (window.authFetch || fetch)(`${API_URL}/api/music/songs?artistId=${artistId}&isExclusive=true`);

        if (!response.ok) {
            throw new Error('Failed to fetch exclusive content');
        }

        const data = await response.json();
        const exclusiveSongs = data.songs || [];

        // Fetch user's coin wallets
        const walletResponse = await (window.authFetch || fetch)(`${API_URL}/api/payment/coins/wallets`);

        let userWallets = [];
        if (walletResponse.ok) {
            const walletData = await walletResponse.json();
            userWallets = walletData.wallets || [];
        }

        if (exclusiveSongs.length === 0) {
            exclusiveTab.innerHTML = `
                <h3>Exclusive Content</h3>
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <p>No exclusive content available</p>
                </div>
            `;
        } else {
            renderExclusiveContent(exclusiveSongs, userWallets);
        }

        exclusiveTab.dataset.loaded = 'true';
    } catch (error) {
        console.error('Error loading exclusive content:', error);
        exclusiveTab.innerHTML = `
            <h3>Exclusive Content</h3>
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <p>Failed to load exclusive content. Please try again.</p>
                <button onclick="loadExclusiveContent()" class="btn btn-secondary" style="margin-top: 16px;">Retry</button>
            </div>
        `;
    }
}

window.toggleLike = async function (event, songId) {
    const indicator = event ? event.currentTarget.closest('.like-indicator') : document.querySelector(`.audius-track-row[data-song-id="${songId}"] .like-indicator`);
    if (!indicator) return;

    const icon = indicator.querySelector('i');
    const isLiked = indicator.classList.contains('liked') || icon.classList.contains('fa-solid');

    try {
        const method = isLiked ? 'DELETE' : 'POST';
        const response = await (window.authFetch || fetch)(`${API_URL}/api/social/like/${songId}`, {
            method
        });

        if (response.ok) {
            const allIndicators = document.querySelectorAll(`.audius-track-row[data-song-id="${songId}"] .like-indicator, .track-stats[data-song-id="${songId}"] .like-indicator`);
            allIndicators.forEach(ind => {
                const i = ind.querySelector('i');
                if (isLiked) {
                    ind.classList.remove('liked');
                    i.classList.replace('fa-solid', 'fa-regular');
                } else {
                    ind.classList.add('liked');
                    i.classList.replace('fa-regular', 'fa-solid');
                }
            });
        }
    } catch (e) {
        console.error('Like toggle failed:', e);
    }
};

// Render Exclusive Content (Updated to 144px layout)
function renderExclusiveContent(songs, userWallets) {
    const exclusiveTab = document.getElementById('exclusive-tab');

    const artistWallet = userWallets.find(w => w.artistId === artistId);
    const userCoins = artistWallet ? artistWallet.balance : 0;

    let html = `
        <h3 style="margin-bottom: 20px;">Exclusive Content</h3>
        <p style="color: var(--text-secondary); margin-bottom: 24px;">
            Unlock exclusive tracks with artist coins. You have <strong>${userCoins}</strong> coins.
        </p>
        <div style="display: flex; flex-direction: column; gap: 16px;">
    `;

    songs.forEach(song => {
        const hasAccess = userCoins >= (song.requiredCoins || 0);

        html += `
            <div class="audius-track-row ${hasAccess ? '' : 'locked'}" data-song-id="${song.id || song._id}" style="${hasAccess ? '' : 'opacity: 0.8;'}" onclick="${hasAccess ? "handleTrackRowClick(event, '" + (song.id || song._id) + "')" : ""}">
                <div class="track-rank"></div>

                <div class="track-artwork-container" style="width: 128px; height: 128px;">
                    <img src="${song.coverArtUrl || 'https://placehold.co/300?text=No+Cover'}" class="track-artwork" alt="${song.title}">
                    <div class="play-overlay">
                        <span class="overlay-icon"><i class="fa-solid fa-${hasAccess ? 'play' : 'lock'}"></i></span>
                    </div>
                </div>

                <div class="track-main-info">
                    <div class="track-title-row">
                        <span class="track-title">${song.title}</span>
                        <span style="color: var(--accent-primary); font-size: 0.9rem; margin-left: 8px;">
                            <i class="fa-solid fa-coins"></i> ${song.requiredCoins}
                        </span>
                    </div>
                    <div class="track-artist-row">
                        <span class="artist-link">${window.artistName || 'Artist'}</span>
                    </div>
                </div>

                <div class="track-stats">
                    <span class="like-indicator" onclick="event.stopPropagation(); toggleLike('${song.id || song._id}')" style="cursor: pointer;">
                        <i class="fa-regular fa-heart"></i>
                    </span>
                    <span><i class="fa-solid fa-retweet"></i> ${song.repostCount || 0}</span>
                </div>

                <div class="track-plays">
                    <i class="fa-solid fa-play" style="font-size: 0.8rem; margin-right: 4px;"></i>${song.playCount || 0}
                </div>

                <div class="track-duration">
                    ${song.duration}s
                </div>
                
                ${!hasAccess ? `
                    <div style="grid-column: span 6; padding-top: 8px; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end;">
                        <button onclick="event.stopPropagation(); unlockSong('${song.id || song._id}', ${song.requiredCoins})" class="btn" style="background: var(--accent-gradient); color: white; padding: 6px 16px; border-radius: 4px; font-size: 0.85rem;">Unlock Track</button>
                    </div>
                ` : ''}
            </div>
        `;
    });

    html += '</div>';
    exclusiveTab.innerHTML = html;
}

// Unlock Song
function unlockSong(songId, requiredCoins) {
    alert(`Unlocking this song requires ${requiredCoins} coins. Coin spending functionality coming soon!`);
}

// Helper: Get Cookie
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Check initial follow status
async function checkInitialFollowStatus() {
    if (!artistId) return;
    const followBtn = document.getElementById('followBtn');
    if (!followBtn) return;

    try {
        const response = await (window.authFetch || fetch)(`${API_URL}/api/social/follow/status/${artistId}`);

        if (response.ok) {
            const data = await response.json();
            if (data.isFollowing) {
                followBtn.textContent = 'Following';
                followBtn.classList.add('active'); // Optional: for styling
            } else {
                followBtn.textContent = 'Follow';
                followBtn.classList.remove('active');
            }
        }
    } catch (error) {
        console.error('Failed to check follow status:', error);
    }
}

// Follow/Unfollow
function initializeFollowButton() {
    const followBtn = document.getElementById('followBtn');
    if (!followBtn) return;

    followBtn.addEventListener('click', async () => {
        const isFollowing = followBtn.textContent.trim() === 'Following';
        followBtn.disabled = true;

        try {
            const method = isFollowing ? 'DELETE' : 'POST';
            const response = await (window.authFetch || fetch)(`${API_URL}/api/social/follow/${artistId}`, {
                method
            });

            if (response.ok) {
                const data = await response.json();
                followBtn.textContent = isFollowing ? 'Follow' : 'Following';

                if (isFollowing) {
                    followBtn.classList.remove('active');
                } else {
                    followBtn.classList.add('active');
                }

                // Update follower count dynamically if stats are provided
                if (data.followerCount !== undefined) {
                    const countEl = document.getElementById('headerFollowerCount');
                    if (countEl) countEl.textContent = data.followerCount.toLocaleString();
                } else {
                    // Fallback to manual increment/decrement if backend doesn't return count
                    const countEl = document.getElementById('headerFollowerCount');
                    if (countEl) {
                        let currentCount = parseInt(countEl.textContent.replace(/,/g, '')) || 0;
                        countEl.textContent = (isFollowing ? currentCount - 1 : currentCount + 1).toLocaleString();
                    }
                }
            }
        } catch (error) {
            console.error('Follow error:', error);
        } finally {
            followBtn.disabled = false;
        }
    });
}

// Track playback
document.querySelectorAll('.track-row').forEach(row => {
    row.addEventListener('click', (e) => {
        if (e.target.classList.contains('play-btn') || e.target.closest('.play-btn')) {
            const songId = row.dataset.songId;
            playSong(songId);
        }
    });
});

function playSong(songId) {
    // This will be handled by the audio player component
    console.log('Playing song:', songId);
    // Emit event for audio player
    window.dispatchEvent(new CustomEvent('play-song', { detail: { songId } }));
}

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


// Social Menus & Actions
function initializeSocialMenus() {
    const artistMoreBtn = document.getElementById('artistMoreBtn');
    const artistMoreMenu = document.getElementById('artistMoreMenu');

    if (artistMoreBtn && artistMoreMenu) {
        artistMoreBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = artistMoreMenu.style.display === 'block';
            artistMoreMenu.style.display = isVisible ? 'none' : 'block';
        });
    }

    // Close menus on outside click
    document.addEventListener('click', () => {
        if (artistMoreMenu) artistMoreMenu.style.display = 'none';
        document.querySelectorAll('.track-menu').forEach(m => m.style.display = 'none');
    });
}

window.toggleTrackMenu = function (event, songId) {
    event.stopPropagation();
    const menu = document.getElementById(`trackMenu-${songId}`);
    const isVisible = menu.style.display === 'block';

    // Close other track menus
    document.querySelectorAll('.track-menu').forEach(m => m.style.display = 'none');

    if (!isVisible) {
        menu.style.display = 'block';
    }
}

window.copyArtistLink = function () {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        alert('Artist link copied to clipboard!');
    });
}

window.shareToXArtist = function () {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out ${window.artistName || 'this artist'} on Audius Clone!`);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
}

window.shareTrack = function (songId) {
    const url = encodeURIComponent(`${window.location.origin}/song/${songId}`);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=Listening to this track on Audius Clone!`, '_blank');
}

let currentCommentSongId = null;

window.toggleComments = async function (songId) {
    currentCommentSongId = songId;
    const modal = document.getElementById('commentModal');
    modal.style.display = 'flex';

    loadComments(songId);
}

async function loadComments(songId) {
    const list = document.getElementById('commentsList');
    list.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">Loading comments...</div>';

    try {
        const response = await (window.authFetch || fetch)(`${API_URL}/api/social/comments/${songId}`);
        const data = await response.json();

        if (response.ok) {
            const comments = data.comments || [];
            if (comments.length === 0) {
                list.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">No comments yet. Be the first to comment!</div>';
            } else {
                list.innerHTML = comments.map(c => renderCommentItem(c)).join('');

                // Update comment count in track row
                const countBadge = document.querySelector(`.comment-count-${songId}`);
                if (countBadge) countBadge.textContent = comments.length;
            }
        }
    } catch (err) {
        console.error('Failed to load comments:', err);
        list.innerHTML = '<div style="text-align: center; color: #ff4444; padding: 20px;">Error loading comments.</div>';
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
                    <button onclick="replyToComment('${c.id}', '${c.userName || 'User'}')" class="comment-action-btn" style="background: none; border: none; font-size: 0.75rem; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; gap: 4px;">
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
        const response = await (window.authFetch || fetch)(url, {
            method: isLiked ? 'DELETE' : 'POST'
        });

        if (response.ok) {
            const newIsLiked = !isLiked;
            btn.dataset.liked = newIsLiked;

            // Update local set if exists (shared with other functions)
            if (window.userCommentLikes) {
                if (newIsLiked) window.userCommentLikes.add(commentId);
                else window.userCommentLikes.delete(commentId);
            }

            // Update UI
            if (newIsLiked) {
                icon.classList.replace('fa-regular', 'fa-solid');
                icon.style.color = '#CC0EF0';
                btn.style.color = '#CC0EF0';
                if (countSpan) countSpan.textContent = parseInt(countSpan.textContent || '0') + 1;
            } else {
                icon.classList.replace('fa-solid', 'fa-regular');
                icon.style.color = 'var(--text-secondary)';
                btn.style.color = 'var(--text-secondary)';
                if (countSpan) countSpan.textContent = Math.max(0, parseInt(countSpan.textContent || '1') - 1);
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

window.replyToComment = function (parentId, userName) {
    activeParentId = parentId;
    const input = document.getElementById('newCommentContent');
    input.placeholder = `Replying to ${userName}...`;
    input.focus();

    // Add a cancel reply button if not present
    if (!document.getElementById('cancelReplyBtn')) {
        const cancelBtn = document.createElement('button');
        cancelBtn.id = 'cancelReplyBtn';
        cancelBtn.textContent = 'Cancel Reply';
        cancelBtn.className = 'btn btn-secondary';
        cancelBtn.style.marginRight = '8px';
        cancelBtn.onclick = cancelReply;
        document.getElementById('postCommentBtn').parentNode.insertBefore(cancelBtn, document.getElementById('postCommentBtn'));
    }
}

function cancelReply() {
    activeParentId = null;
    const input = document.getElementById('newCommentContent');
    input.placeholder = 'Write a comment...';
    document.getElementById('cancelReplyBtn')?.remove();
}

function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return new Date(date).toLocaleDateString();
}

// Post Comment Logic
document.getElementById('postCommentBtn')?.addEventListener('click', async () => {
    const content = document.getElementById('newCommentContent').value.trim();
    if (!content || !currentCommentSongId) return;

    const btn = document.getElementById('postCommentBtn');
    btn.disabled = true;

    try {
        const response = await (window.authFetch || fetch)(`${API_URL}/api/social/comment/${currentCommentSongId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content,
                parentId: activeParentId
            })
        });

        if (response.ok) {
            document.getElementById('newCommentContent').value = '';
            cancelReply();
            loadComments(currentCommentSongId);
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to post comment');
        }
    } catch (err) {
        console.error('Post comment error:', err);
    } finally {
        btn.disabled = false;
    }
});
