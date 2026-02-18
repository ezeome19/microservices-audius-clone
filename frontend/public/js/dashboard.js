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

// Helper: Get user-scoped localStorage key
function getScopedKey(key) {
    if (!window.currentUserId) return key;
    return `user_${window.currentUserId}_${key}`;
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    initializeTabs();
    initializeHeaderSearch();
    initializeFilters(); // New: Initialize filters

    await fetchCurrentUser(); // Get user ID for state isolation
    await syncUserLikes(); // Fetch likes first
    await checkUserTier(); // Fetch and display user tier (Badge for Yearly)
    initializeNotifications(); // New: Initialize notification bell

    // Restore view from URL hash, localStorage, or default to trending
    const hash = window.location.hash.substring(1); // Remove '#'
    const lastTab = localStorage.getItem(getScopedKey('last_active_tab'));

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
    const validTabs = ['trending', 'explore', 'favorites', 'playlists', 'wallet', 'coins', 'profile', 'upload'];
    const tabToLoad = validTabs.includes(hash) ? hash : (validTabs.includes(lastTab) ? lastTab : 'trending');

    // Activate the correct tab
    const targetLink = document.querySelector(`.nav-item[data-tab="${tabToLoad}"]`);
    if (targetLink) {
        targetLink.click();
    } else {
        // Fallback to trending
        currentTab = 'trending';
        const filterEl = document.getElementById('trendingFilters');
        if (filterEl) filterEl.style.display = 'flex';
        loadTrendingTracks();
    }
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
        const validTabs = ['trending', 'explore', 'favorites', 'playlists', 'wallet', 'coins', 'profile', 'upload'];
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

// Sync likes from backend
async function syncUserLikes() {
    try {
        const response = await fetch(`${API_URL}/api/social/likes`, {
            credentials: 'include'
        });

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
        const response = await fetch(`${API_URL}/api/auth/me`);
        if (response.ok) {
            const data = await response.json();
            window.currentUserId = data.user?.id;
            console.log('[Dashboard] Identified User:', window.currentUserId);
        }
    } catch (error) {
        console.error('[Dashboard] Failed to fetch current user:', error);
    }
}

// Check User Tier and Update UI
async function checkUserTier() {
    try {
        const response = await fetch(`${API_URL}/api/payment/wallet`);
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
function initializeTabs() {
    const navLinks = document.querySelectorAll('.nav-item[data-tab]');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = link.dataset.tab;

            // Update URL hash for tab persistence
            window.location.hash = tabName;

            // Update active state
            navLinks.forEach(l => {
                l.classList.remove('active');
                l.style.fontWeight = '400';
                l.style.color = 'var(--text-secondary)';
            });
            link.classList.add('active');
            link.style.fontWeight = '600';
            link.style.color = 'white';

            // Handle different tabs
            currentTab = tabName;
            localStorage.setItem(getScopedKey('last_active_tab'), tabName);

            if (tabName === 'trending') {
                const filterEl = document.getElementById('trendingFilters');
                if (filterEl) filterEl.style.display = 'flex';
                loadTrendingTracks();
            } else {
                const filterEl = document.getElementById('trendingFilters');
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
                }
            }
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
        const response = await fetch(`${API_URL}/api/music/songs?time=${time}&genre=${genre}`);
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
        const response = await fetch(`/artist/api/${artistId}/content`);

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
            fetch(`${API_URL}/api/music/songs/${songId}`),
            fetch(`${API_URL}/api/social/stats/song/${songId}`).catch(() => null)
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

        const response = await fetch(`${API_URL}/api/social/likes`);

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

        const response = await fetch(`${API_URL}/api/music/playlists/my-playlists`);

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
        const response = await fetch(`${API_URL}/api/music/search?q=${encodeURIComponent(query)}`);

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
        const response = await fetch(`${API_URL}/api/music/playlists/${playlistId}`, {
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
                    const response = await fetch(`${API_URL}/api/music/playlists`, {
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
            const response = await fetch(`${API_URL}/api/social/like/${songId}`, { method });
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
        const response = await fetch(`${API_URL}/api/music/artists/${artistId}/tracks`);
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
        const response = await fetch(`${API_URL}/api/social/comments/${songId}`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to load comments');

        const data = await response.json();
        const comments = data.comments || [];

        if (comments.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">No comments yet. Be the first to comment!</p>';
            return;
        }

        // Build a tree of comments
        const commentMap = {};
        const topLevelComments = [];

        comments.forEach(c => {
            commentMap[c.id] = { ...c, replies: [] };
        });

        comments.forEach(c => {
            if (c.parentId && commentMap[c.parentId]) {
                commentMap[c.parentId].replies.push(commentMap[c.id]);
            } else {
                topLevelComments.push(commentMap[c.id]);
            }
        });

        container.innerHTML = topLevelComments.map(c => renderCommentItem(c)).join('');

    } catch (error) {
        console.error('Error loading comments:', error);
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">Failed to load comments</p>';
    }
}

function renderCommentItem(c, depth = 0) {
    const timeAgo = formatTimeAgo(c.createdAt);
    const isLiked = c.isLiked || (window.userCommentLikes && window.userCommentLikes.has(c.id));
    const likeCount = c.likeCount || 0;

    return `
        <div class="comment-item" style="margin-left: ${depth * 24}px; border-left: ${depth > 0 ? '2px solid var(--border-color)' : 'none'}; padding-left: ${depth > 0 ? '12px' : '0'}; padding-top: 12px; margin-bottom: 12px;">
            <div style="display: flex; gap: 12px;">
                <div style="width: ${depth > 0 ? '32px' : '40px'}; height: ${depth > 0 ? '32px' : '40px'}; border-radius: 50%; background: var(--accent-gradient); flex-shrink: 0;"></div>
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <span style="font-weight: 600; font-size: 0.9rem;">${c.userName || 'User ' + c.userId.substring(0, 8)}</span>
                        <span style="color: var(--text-muted); font-size: 0.8rem;">${timeAgo}</span>
                    </div>
                    <p style="color: var(--text-secondary); line-height: 1.5; font-size: 0.95rem;">${c.content || c.text}</p>
                    <div class="comment-actions" style="display: flex; gap: 16px; margin-top: 8px;">
                        <button onclick="toggleCommentLike(event, '${c.id}')" class="comment-like-btn" data-liked="${isLiked}" style="background: none; border: none; font-size: 0.8rem; color: ${isLiked ? '#CC0EF0' : 'var(--text-secondary)'}; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                            <i class="fa-${isLiked ? 'solid' : 'regular'} fa-heart"></i> <span class="like-count">${likeCount}</span> Like${likeCount !== 1 ? 's' : ''}
                        </button>
                        <button onclick="replyToComment('${c.id}', '${c.userName || 'User'}', '${c.songId}')" style="background: none; border: none; font-size: 0.8rem; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; gap: 4px;">
                            <i class="fa-regular fa-comment"></i> Reply
                        </button>
                    </div>
                </div>
            </div>
            <div class="replies">
                ${(c.replies || []).map(reply => renderCommentItem(reply, depth + 1)).join('')}
            </div>
        </div>
    `;
}

window.toggleCommentLike = async function (event, commentId) {
    const btn = event.currentTarget;
    const icon = btn.querySelector('i');
    const countSpan = btn.querySelector('.like-count');
    const isLiked = btn.dataset.liked === 'true';

    try {
        const url = `${API_URL}/api/social/like/comment/${commentId}`;
        const response = await fetch(url, {
            method: isLiked ? 'DELETE' : 'POST',
            credentials: 'include'
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
        const response = await fetch(`${API_URL}/api/social/comment/${songId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Send cookies with request
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
        const response = await fetch(`${API_URL}/api/social/reposts/${songId}`, {
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
function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
}
// --- Notifications ---

function initializeNotifications() {
    const notifBell = document.getElementById('notifBell');
    const notifDropdown = document.getElementById('notifDropdown');

    if (!notifBell || !notifDropdown) return;

    notifBell.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = notifDropdown.style.display === 'block';
        notifDropdown.style.display = isVisible ? 'none' : 'block';

        if (!isVisible) {
            loadNotifications();
        }
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!notifBell.contains(e.target) && !notifDropdown.contains(e.target)) {
            notifDropdown.style.display = 'none';
        }
    });

    // Initial check for a badge (visual effect)
    setTimeout(() => {
        document.getElementById('notifBadge').style.display = 'block';
    }, 2000);
}

async function loadNotifications() {
    const notifList = document.getElementById('notifList');
    const notifBadge = document.getElementById('notifBadge');

    try {
        const response = await fetch(`${API_URL}/api/recommendations/notifications`);
        if (!response.ok) throw new Error('Failed to fetch notifications');

        const { notifications } = await response.json();

        if (!notifications || notifications.length === 0) {
            notifList.innerHTML = `
                <div style="text-align: center; padding: 24px; color: var(--text-muted);">
                    <p style="font-size: 0.9rem; margin: 0;">No new notifications</p>
                </div>
            `;
            return;
        }

        notifList.innerHTML = notifications.map(notif => `
            <div class="notif-item" onclick="handleNotificationClick('${notif.trackId || (notif.track ? notif.track.id : '')}', '${notif.type}')" 
                style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); cursor: pointer; transition: background 0.2s; display: flex; gap: 12px; align-items: start;">
                <div style="width: 32px; height: 32px; background: var(--bg-secondary); border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--accent-primary);">
                    <i class="${notif.type === 'trending' ? 'fa-solid fa-chart-line' : 'fa-solid fa-music'}"></i>
                </div>
                <div style="flex: 1;">
                    <p style="margin: 0; font-size: 0.85rem; font-weight: 700; color: var(--text-primary);">${notif.title}</p>
                    <p style="margin: 2px 0 0 0; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;">${notif.message}</p>
                    <p style="margin: 4px 0 0 0; font-size: 0.7rem; color: var(--text-muted);">${formatNotifDate(notif.date)}</p>
                </div>
            </div>
        `).join('');

        // Add hover effect style if not already present
        if (!document.getElementById('notifStyles')) {
            const style = document.createElement('style');
            style.id = 'notifStyles';
            style.innerHTML = `
                .notif-item:hover { background: var(--bg-secondary); }
                .notif-item:last-child { border-bottom: none; }
            `;
            document.head.appendChild(style);
        }

    } catch (error) {
        console.error('Error loading notifications:', error);
        notifList.innerHTML = `
            <div style="text-align: center; padding: 24px; color: var(--text-muted);">
                <p style="font-size: 0.9rem; margin: 0;">Failed to load notifications</p>
            </div>
        `;
    }
}

function formatNotifDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;

    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;

    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
}

window.handleNotificationClick = function (trackId, type) {
    if (trackId) {
        // Play track or show track page
        if (typeof playTrack === 'function') {
            playTrack(trackId);
        } else {
            window.location.hash = `song/${trackId}`;
        }
    }
    document.getElementById('notifDropdown').style.display = 'none';
    document.getElementById('notifBadge').style.display = 'none';
};

window.markAllAsRead = function () {
    const notifBadge = document.getElementById('notifBadge');
    if (notifBadge) notifBadge.style.display = 'none';
    // Optionally call backend to mark as read
};
