// Fastify Artist Routes
async function artistRoutes(fastify, options) {
    const axios = require('axios');
    const API_URL = process.env.API_GATEWAY_URL || 'http://localhost:3000';

    // Artist page
    fastify.get('/:artistId', async (request, reply) => {
        const { artistId } = request.params;
        try {
            const token = request.cookies.token;

            if (!token) {
                return reply.redirect('/auth/login');
            }

            // Fetch artist data
            const [artistRes, songsRes] = await Promise.all([
                axios.get(`${API_URL}/api/music/artists/${artistId}`, {
                    headers: { 'x-auth-token': token }
                }),
                axios.get(`${API_URL}/api/music/artists/${artistId}/tracks`, {
                    headers: { 'x-auth-token': token }
                })
            ]);

            console.log('[Artist Route] Artist data:', artistRes.data);
            console.log('[Artist Route] Tracks response:', songsRes.data);

            // Extract tracks - API might return 'tracks' or 'songs'
            const tracks = songsRes.data.tracks || songsRes.data.songs || [];
            console.log('[Artist Route] Extracted tracks count:', tracks.length);

            // Fetch coin packages (may not exist)
            let coinData = null;
            try {
                const coinRes = await axios.get(`${API_URL}/api/coins/packages/${artistId}`, {
                    headers: { 'x-auth-token': token }
                });
                coinData = coinRes.data;
            } catch (error) {
                // Artist may not have coins yet
            }

            // Get user's wallet
            let userWallet = null;
            try {
                const walletsRes = await axios.get(`${API_URL}/api/coins/wallets`, {
                    headers: { 'x-auth-token': token }
                });
                if (walletsRes.data && walletsRes.data.wallets) {
                    userWallet = walletsRes.data.wallets.find(w => w.artistId === artistId);
                }
            } catch (error) {
                // User may not have wallet yet
            }

            // Check if user is following this artist
            let isFollowing = false;
            try {
                const followStatusRes = await axios.get(`${API_URL}/api/social/follow/status/${artistId}`, {
                    headers: { 'x-auth-token': token }
                });
                isFollowing = followStatusRes.data.isFollowing;
            } catch (error) {
                console.error('[Artist Route] Failed to fetch follow status:', error.message);
            }

            const renderData = {
                title: artistRes.data.artist?.name || 'Artist',
                artistName: artistRes.data.artist?.name || 'Artist',
                artist: artistRes.data.artist,
                songs: tracks, // Use extracted tracks
                artistCoin: coinData?.artistCoin,
                packages: coinData?.packages,
                userWallet,
                coinHolders: 0,
                hasExclusiveContent: tracks.some(s => s.isExclusive) || false,
                isFollowing: isFollowing
            };

            console.log('[Artist Route] Render data songs count:', renderData.songs.length);

            return reply.view('artist', renderData);
        } catch (error) {
            fastify.log.error('Artist page error:', error.message);
            if (error.response) {
                fastify.log.error('API Response:', error.response.status, error.response.data);
            }
            return reply.status(500).send('Failed to load artist page');
        }
    });

    // API endpoint for artist content (without layout) - for inline rendering
    fastify.get('/api/:artistId/content', async (request, reply) => {
        const { artistId } = request.params;
        try {
            const token = request.cookies.token;

            if (!token) {
                return reply.status(401).send({ error: 'Unauthorized' });
            }

            // Fetch artist data and follow status
            const [artistRes, songsRes, followStatusRes] = await Promise.all([
                axios.get(`${API_URL}/api/music/artists/${artistId}`, {
                    headers: { 'x-auth-token': token }
                }),
                axios.get(`${API_URL}/api/music/artists/${artistId}/tracks`, {
                    headers: { 'x-auth-token': token }
                }),
                axios.get(`${API_URL}/api/social/follow/status/${artistId}`, {
                    headers: { 'x-auth-token': token }
                }).catch(() => ({ data: { isFollowing: false } }))
            ]);

            const isFollowing = followStatusRes.data.isFollowing;
            const tracks = songsRes.data.tracks || songsRes.data.songs || [];
            const artist = artistRes.data.artist;

            // Return just the HTML content (not the full page) - Full Audius-style layout
            const contentHTML = `
                <div class="artist-page-inline">
                    <!-- Cover Photo -->
                    <div class="artist-cover" style="height: 240px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); position: relative; overflow: hidden;">
                        ${artist.coverPhoto ? `<img src="${artist.coverPhoto}" alt="Cover" style="width: 100%; height: 100%; object-fit: cover;">` : ''}
                    </div>
 
                    <!-- Artist Header -->
                    <div style="display: flex; align-items: flex-end; gap: 24px; margin-top: -80px; padding: 0 32px; position: relative; z-index: 2;">
                        <!-- Profile Picture -->
                        <div style="width: 160px; height: 160px; border-radius: 50%; border: 4px solid var(--bg-primary); overflow: hidden; background: var(--bg-secondary);">
                            ${artist.profilePicture ?
                    `<img src="${artist.profilePicture}" alt="${artist.name}" style="width: 100%; height: 100%; object-fit: cover;">` :
                    `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 4rem; font-weight: 800; color: var(--text-secondary);">${artist.name.charAt(0)}</div>`
                }
                        </div>
 
                        <!-- Artist Details -->
                        <div style="flex: 1; padding-bottom: 16px;">
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                                <h1 style="font-size: 2.5rem; font-weight: 900; margin: 0;">${artist.name}</h1>
                                ${artist.isVerified ? '<span style="font-size: 1.2rem; color: #00B1FF;"><i class="fa-solid fa-circle-check"></i></span>' : ''}
                            </div>
 
                            <!-- Stats Row with Action Buttons -->
                            <div style="display: flex; gap: 40px; align-items: center;">
                                <div style="display: flex; flex-direction: column;">
                                    <span style="font-size: 22px; font-weight: 900; color: #736E88;">${artist.followerCount || 0}</span>
                                    <span style="font-size: 12px; font-weight: 900; color: #C3C1CB;">FOLLOWERS</span>
                                </div>
                                <div style="display: flex; flex-direction: column;">
                                    <span style="font-size: 22px; font-weight: 900; color: #736E88;">${tracks.length}</span>
                                    <span style="font-size: 12px; font-weight: 900; color: #C3C1CB;">TRACKS</span>
                                </div>
                                <div style="display: flex; flex-direction: column;">
                                    <span style="font-size: 22px; font-weight: 900; color: #736E88;">${artist.followingCount || 0}</span>
                                    <span style="font-size: 12px; font-weight: 900; color: #C3C1CB;">FOLLOWING</span>
                                </div>
                                
                                <!-- Action Buttons (inline with stats) -->
                                <div style="display: flex; gap: 12px; margin-left: auto;">
                                    <button id="followBtn-${artist.id || artist._id}" class="btn btn-primary ${isFollowing ? 'active' : ''}" 
                                        onclick="toggleFollowArtist('${artist.id || artist._id}', this)"
                                        style="border-radius: 4px; padding: 10px 32px; font-weight: 700;">
                                        ${isFollowing ? 'Following' : 'Follow'}
                                    </button>
                                    <button class="btn btn-secondary" style="border-radius: 4px; width: 44px; height: 44px; padding: 0; display: flex; align-items: center; justify-content: center;">
                                        <i class="fa-solid fa-share-nodes"></i>
                                    </button>
                                    <button class="btn btn-secondary" style="border-radius: 4px; width: 44px; height: 44px; padding: 0; display: flex; align-items: center; justify-content: center;">
                                        <i class="fa-solid fa-ellipsis"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Two Column Layout: Main Content + Sidebar -->
                    <div style="display: flex; gap: 40px; padding: 0 32px 32px;">
                        <!-- Main Content -->
                        <div style="flex: 1;">
                            <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 24px;">Tracks</h2>
                            <div class="track-list">
                                ${tracks.map((track, index) => {
                    const isGated = track.isGated || track.is_stream_gated || false;
                    return `
                                    <div class="audius-track-row ${isGated ? 'gated-track' : ''}" 
                                         data-song-id="${track.id || track._id}" 
                                         onclick="${isGated ? '' : `handleTrackRowClick(event, '${track.id || track._id}')`}"
                                         style="${isGated ? 'opacity: 0.6; cursor: not-allowed;' : ''}">
                                        <div class="track-rank">${index + 1}</div>
                                        <div class="track-artwork-container" style="width: 128px; height: 128px;">
                                            <img src="${track.coverArtUrl || track.artwork?.['480x480'] || 'https://placehold.co/300'}" class="track-artwork" alt="${track.title}">
                                            <div class="play-overlay" style="${isGated ? 'opacity: 1;' : ''}">
                                                <span class="overlay-icon"><i class="fa-solid fa-${isGated ? 'lock' : 'play'}"></i></span>
                                            </div>
                                        </div>
                                        <div class="track-main-info">
                                            <div class="track-title-row">
                                                <span class="track-title song-link" onclick="event.stopPropagation(); showSongPage('${track.id || track._id}')">${track.title}</span>
                                                ${isGated ? `<span style="color: #CC0EF0; font-size: 0.85rem; margin-left: 8px;" title="${track.gatedReason || 'Access Restricted'}"><i class="fa-solid fa-lock"></i> ${track.gatedReason || 'Gated'}</span>` : ''}
                                            </div>
                                            <div class="track-artist-row">
                                                <span class="artist-link">${artist.name}</span>
                                                ${artist.isVerified ? '<span class="verification-badge"><i class="fa-solid fa-circle-check"></i></span>' : ''}
                                            </div>
                                        </div>
                                        <div class="track-stats">
                                            <div style="display: flex; gap: 16px; align-items: center;">
                                                <span class="like-indicator" onclick="event.stopPropagation(); toggleLike('${track.id || track._id}')" style="cursor: pointer;">
                                                    <i class="fa-regular fa-heart"></i>
                                                </span>
                                                <span title="Repost"><i class="fa-solid fa-retweet"></i> ${track.repostCount || 0}</span>
                                                <span title="Favorite"><i class="fa-solid fa-heart"></i> ${track.favoriteCount || track.likeCount || 0}</span>
                                            </div>
                                        </div>
                                        <div class="track-plays">
                                            <i class="fa-solid fa-play" style="font-size: 0.8rem; margin-right: 4px;"></i>${track.playCount || 0}
                                        </div>
                                    </div>
                                    `;
                }).join('')}
                            </div>
                        </div>

                        <!-- Sidebar -->
                        <div style="width: 350px; flex-shrink: 0;">
                            <!-- About Artist -->
                            <div style="background: var(--bg-card); padding: 24px; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 24px;">
                                <h4 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 900; color: #C3C1CB; text-transform: uppercase;">
                                    <i class="fa-solid fa-user" style="color: var(--accent-primary); margin-right: 8px;"></i>
                                    About Artist
                                </h4>
                                <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6; margin: 0;">
                                    ${artist.bio || `${artist.name} is an artist on Audius, sharing their music with the world.`}
                                </p>
                            </div>
                            
                            <!-- Support the Artist -->
                            <div style="background: var(--bg-card); padding: 24px; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 24px;">
                                <h4 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 900; color: #C3C1CB; text-transform: uppercase;">
                                    <i class="fa-solid fa-hand-holding-heart" style="color: var(--accent-primary); margin-right: 8px;"></i>
                                    Support the Artist
                                </h4>
                                <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 20px; line-height: 1.6;">
                                    Show your appreciation by sending a tip to ${artist.name}. Your support helps artists create more amazing music!
                                </p>
                                <button class="btn" onclick="openTipModal('${artist.id || artist._id}', '${artist.name.replace(/'/g, "\\'")}')"
                                    style="background: var(--accent-gradient); color: white; display: flex; align-items: center; justify-content: center; gap: 12px; padding: 14px; border-radius: 4px; font-weight: 700; font-size: 1.1rem; width: 100%; border: none; cursor: pointer;">
                                    <i class="fa-solid fa-gift"></i> Send Tip
                                </button>
                                <p style="text-align: center; color: var(--text-muted); font-size: 0.85rem; margin-top: 12px;">
                                    <i class="fa-solid fa-shield-halved"></i> Secure payment via Flutterwave
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            reply.type('text/html').send(contentHTML);
        } catch (error) {
            fastify.log.error('Artist content API error:', error.message);
            return reply.status(500).send({ error: 'Failed to load artist content' });
        }
    });

    // Payment verification callback
    fastify.get('/payment/verify', async (request, reply) => {
        const { status, tx_ref } = request.query;
        const token = request.cookies.token;

        if (status === 'successful' && token) {
            try {
                await axios.post(`${API_URL}/api/coins/verify`, {
                    reference: tx_ref
                }, {
                    headers: { 'x-auth-token': token }
                });

                return reply.view('payment-success', {
                    title: 'Payment Successful',
                    message: 'Your coins have been credited!'
                });
            } catch (error) {
                fastify.log.error('Payment verification error:', error);
            }
        }

        return reply.view('payment-error', {
            title: 'Payment Failed',
            message: 'Payment verification failed'
        });
    });
}

module.exports = artistRoutes;
