// Audio Player Component
class AudioPlayer {
    constructor() {
        this.audio = new Audio();
        this.currentSong = null;
        this.isPlaying = false;
        this.playlist = [];
        this.currentIndex = 0;
        this.isMinimized = false;

        this.initializePlayer();
        this.attachEventListeners();
        this.restorePlayerState();
        this.restoreMinimizeState();
    }

    getScopedKey(key) {
        const userId = window.currentUserId;
        if (!userId) return key;
        return `user_${userId}_${key}`;
    }

    initializePlayer() {
        // Create player UI if it doesn't exist
        if (!document.getElementById('audioPlayer')) {
            this.createPlayerUI();
        }

        // Listen for play-song events
        window.addEventListener('play-song', (e) => {
            this.loadSong(e.detail.songId, true); // User clicked play, so auto-play
        });

        // Save state before page unload
        window.addEventListener('beforeunload', () => {
            this.savePlayerState();
        });
    }

    createPlayerUI() {
        const playerHTML = `
            <style>
                #audioPlayer { transition: height 0.3s ease, padding 0.3s ease; }
                #audioPlayer.minimized { height: 40px !important; padding: 0 16px !important; grid-template-columns: 1fr auto !important; }
                #audioPlayer.minimized .player-full-section { display: none !important; }
                #audioPlayer.minimized .player-mini-section { display: flex !important; }
                .player-mini-section { display: none; align-items: center; gap: 12px; }
                #playerMinimizeBtn { background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 0.9rem; padding: 6px; transition: color 0.2s, transform 0.3s; }
                #playerMinimizeBtn:hover { color: var(--text-primary); }
                #audioPlayer.minimized #playerMinimizeBtn { transform: rotate(180deg); }
            </style>
            <div id="audioPlayer" style="position: fixed; bottom: 0; left: 0; right: 0; height: 90px; background: var(--bg-card); border-top: 1px solid var(--border-color); display: grid; grid-template-columns: 1fr 2fr 1fr; align-items: center; padding: 0 32px; z-index: 999;">
                <!-- Left: Song Info & Like Button -->
                <div class="player-full-section" style="display: flex; align-items: center; gap: 16px; justify-self: start;">
                    <div id="playerCover" style="width: 56px; height: 56px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden; flex-shrink: 0;">
                        <img id="playerCoverImg" style="width: 100%; height: 100%; object-fit: cover; display: none;" onerror="this.src='https://placehold.co/150?text=No+Cover'">
                    </div>
                    <div style="min-width: 0; max-width: 180px;">
                        <div id="playerTitle" style="font-weight: 600; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">No song playing</div>
                        <div id="playerArtist" style="color: var(--text-secondary); font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"></div>
                    </div>
                    <button id="likeBtn" style="background: none; border: none; cursor: pointer; font-size: 1.2rem; color: var(--text-secondary); transition: all 0.2s; padding: 8px; flex-shrink: 0;" title="Like this song">
                        <i class="fa-regular fa-heart"></i>
                    </button>
                </div>

                <!-- Center: Controls & Progress -->
                <div class="player-full-section" style="display: flex; flex-direction: column; gap: 8px; width: 100%; max-width: 600px; justify-self: center;">
                    <div style="display: flex; justify-content: center; gap: 24px; align-items: center;">
                        <button id="prevBtn" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1.2rem; transition: color 0.2s;" onmouseover="this.style.color='var(--text-primary)'" onmouseout="this.style.color='var(--text-secondary)'">⏮</button>
                        <button id="playPauseBtn" style="width: 42px; height: 42px; border-radius: 50%; background: var(--accent-gradient); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.1rem; box-shadow: 0 4px 12px rgba(126, 27, 204, 0.3); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">▶</button>
                        <button id="nextBtn" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1.2rem; transition: color 0.2s;" onmouseover="this.style.color='var(--text-primary)'" onmouseout="this.style.color='var(--text-secondary)'">⏭</button>
                    </div>

                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span id="currentTime" style="font-size: 0.75rem; color: var(--text-secondary); min-width: 35px; text-align: right;">0:00</span>
                        <div id="progressBar" style="flex: 1; height: 4px; background: var(--bg-secondary); border-radius: 2px; cursor: pointer; position: relative; overflow: hidden;">
                            <div id="progressFill" style="height: 100%; background: var(--accent-gradient); border-radius: 2px; width: 0%; transition: width 0.1s;"></div>
                        </div>
                        <span id="duration" style="font-size: 0.75rem; color: var(--text-secondary); min-width: 35px;">0:00</span>
                    </div>
                </div>

                <!-- Right: Volume & Extra Controls -->
                <div class="player-full-section" style="display: flex; align-items: center; gap: 12px; justify-self: end; min-width: 180px; justify-content: flex-end;">
                    <button id="playerMinimizeBtn" title="Minimize player"><i class="fa-solid fa-chevron-down"></i></button>
                    <button style="background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1rem;"><i class="fa-solid fa-list-ul"></i></button>
                    <div style="display: flex; align-items: center; gap: 8px; width: 120px;">
                        <span id="volumeIcon" style="font-size: 1rem; color: var(--text-secondary);">🔊</span>
                        <input type="range" id="volumeSlider" min="0" max="100" value="70" style="flex: 1; cursor: pointer; accent-color: var(--accent-primary);">
                    </div>
                </div>

                <!-- Mini bar (visible when minimized) -->
                <div class="player-mini-section">
                    <span id="miniTitle" style="font-weight: 600; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">No song playing</span>
                    <span id="miniArtist" style="color: var(--text-secondary); font-size: 0.75rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px;"></span>
                </div>
                <div class="player-mini-section" style="justify-content: flex-end; gap: 8px;">
                    <button id="miniPlayPauseBtn" style="width: 28px; height: 28px; border-radius: 50%; background: var(--accent-gradient); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.75rem;">▶</button>
                    <button id="playerExpandBtn" title="Expand player" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 0.9rem; padding: 6px;"><i class="fa-solid fa-chevron-up"></i></button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', playerHTML);
    }

    attachEventListeners() {
        // Play/Pause
        document.getElementById('playPauseBtn').addEventListener('click', () => {
            this.togglePlayPause();
        });

        // Mini play/pause
        document.getElementById('miniPlayPauseBtn').addEventListener('click', () => {
            this.togglePlayPause();
        });

        // Minimize / Expand
        document.getElementById('playerMinimizeBtn').addEventListener('click', () => {
            this.toggleMinimize();
        });
        document.getElementById('playerExpandBtn').addEventListener('click', () => {
            this.toggleMinimize();
        });

        // Previous/Next
        document.getElementById('prevBtn').addEventListener('click', () => {
            this.playPrevious();
        });

        document.getElementById('nextBtn').addEventListener('click', () => {
            this.playNext();
        });

        // Progress bar
        const progressBar = document.getElementById('progressBar');
        progressBar.addEventListener('click', (e) => {
            const rect = progressBar.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            this.seek(percent);
        });

        // Volume
        document.getElementById('volumeSlider').addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
        });

        // Like button
        document.getElementById('likeBtn').addEventListener('click', () => {
            this.toggleLike();
        });

        // Audio events
        this.audio.addEventListener('timeupdate', () => {
            this.updateProgress();

            // Save state periodically (every 2 seconds) during playback
            if (this.isPlaying && this.currentSong) {
                const now = Date.now();
                if (!this.lastStateSave || now - this.lastStateSave > 2000) {
                    this.savePlayerState();
                    this.lastStateSave = now;
                }
            }
        });

        this.audio.addEventListener('ended', () => {
            this.playNext();
        });

        this.audio.addEventListener('loadedmetadata', () => {
            document.getElementById('duration').textContent = this.formatTime(this.audio.duration);
        });
    }

    showGatedTrackError(song) {
        // Update player UI to show gated track message
        document.getElementById('playerTitle').textContent = song.title;
        document.getElementById('playerArtist').textContent = `🔒 ${song.gatedReason || 'Access Restricted'}`;

        const coverImg = document.getElementById('playerCoverImg');
        if (song.coverArtUrl) {
            coverImg.src = song.coverArtUrl;
            coverImg.style.display = 'block';
        }

        // Show user-friendly alert
        alert(`This track is gated and cannot be played.\n\nTrack: ${song.title}\nReason: ${song.gatedReason || 'Access Restricted'}\n\nGated tracks require special access (NFT ownership, tips, follows, or purchases) on the Audius platform.`);

        // Pause any current playback
        this.pause();
    }

    async loadSong(songId, autoPlay = false) {
        console.log('[AudioPlayer] Loading song:', songId, 'autoPlay:', autoPlay);
        try {
            // Fetch song details - Gateway will inject x-auth-token from cookie
            // Append logPlay=true only if we are actually intending to play it
            const url = `/api/music/songs/${songId}${autoPlay ? '?logPlay=true' : ''}`;
            const response = await (window.authFetch || fetch)(url);

            if (!response.ok) {
                if (response.status === 403) {
                    const error = await response.json();
                    if (error.code === 'LIMIT_REACHED') {
                        if (window.showCustomModal) {
                            window.showCustomModal({
                                title: "Limit Reached",
                                content: "You've reached your daily limit of 25 tracks on the Free tier. Upgrade to Premium for unlimited streaming!",
                                confirmText: "Upgrade Now",
                                onConfirm: () => window.showSubscriptionModal()
                            });
                        } else {
                            alert("Daily stream limit reached. Upgrade to Premium for unlimited access!");
                        }
                        return;
                    }
                }
                console.error('[AudioPlayer] Failed to fetch song metadata:', response.status);
                return;
            }


            const data = await response.json();
            const song = data.song;

            if (!song) {
                console.error('[AudioPlayer] Song metadata not found in response');
                return;
            }

            console.log('[AudioPlayer] Loaded metadata:', song.title);

            // Check if track is gated
            if (song.isGated) {
                console.warn('[AudioPlayer] Track is gated:', song.gatedReason);
                this.showGatedTrackError(song);
                return;
            }

            // Update UI
            document.getElementById('playerTitle').textContent = song.title;
            document.getElementById('playerArtist').textContent = song.artist?.name || 'Unknown Artist';

            const coverImg = document.getElementById('playerCoverImg');

            if (song.coverArtUrl) {
                coverImg.src = song.coverArtUrl;
                coverImg.style.display = 'block';
            } else {
                coverImg.src = 'https://placehold.co/150?text=No+Cover';
                coverImg.style.display = 'block';
            }


            // Sync like button state
            this.currentSong = song;
            const isLiked = window.userLikes && window.userLikes.has(songId);
            this.updateLikeButton(isLiked);

            // Load audio - check if audioUrl exists (will be null for gated tracks)
            if (!song.audioUrl) {
                console.error('[AudioPlayer] No audio URL available for this track');
                this.showGatedTrackError(song);
                return;
            }

            this.audio.src = song.audioUrl;

            // Only auto-play if explicitly requested (e.g., user clicked play button)
            // NEVER auto-play on page load/state restoration
            if (autoPlay) {
                this.play();
            }

        } catch (error) {
            console.error('[AudioPlayer] Failed to load song ERROR:', error);
        }
    }

    savePlayerState() {
        if (!this.currentSong) return;

        const state = {
            songId: this.currentSong.id || this.currentSong._id,
            currentTime: this.audio.currentTime,
            isPlaying: this.isPlaying,
            volume: this.audio.volume
        };

        localStorage.setItem(this.getScopedKey('audioPlayerState'), JSON.stringify(state));
        console.log('[AudioPlayer] State saved:', state);
    }

    async restorePlayerState() {
        // Wait for currentUserId to be populated if dashboard.js is doing it
        if (!window.currentUserId) {
            try {
                const response = await (window.authFetch || fetch)(`${window.location.origin}/api/auth/me`);
                if (response.ok) {
                    const data = await response.json();
                    window.currentUserId = data.user?.id;
                }
            } catch (err) {
                console.warn('[AudioPlayer] Failed to fetch current user for state restoration');
            }
        }

        // ONLY restore state if we have a currentUserId to scope it
        if (!window.currentUserId) {
            console.log('[AudioPlayer] No user identified, skipping state restoration');
            // Check for unscoped legacy state and clear it to prevent cross-account leak
            if (localStorage.getItem('audioPlayerState')) {
                localStorage.removeItem('audioPlayerState');
                console.log('[AudioPlayer] Cleared unscoped legacy state');
            }
            return;
        }

        const scopedKey = this.getScopedKey('audioPlayerState');
        const savedState = localStorage.getItem(scopedKey);

        if (!savedState) {
            console.log('[AudioPlayer] No saved state for user:', window.currentUserId);
            return;
        }

        try {
            const state = JSON.parse(savedState);
            console.log('[AudioPlayer] Restoring state for user:', window.currentUserId, state);

            // Load the song (without auto-play initially)
            await this.loadSong(state.songId, false);

            // Restore playback position
            this.audio.currentTime = state.currentTime || 0;

            // Restore volume
            if (state.volume !== undefined) {
                this.audio.volume = state.volume;
                const volumeSlider = document.getElementById('volumeSlider');
                if (volumeSlider) {
                    volumeSlider.value = state.volume * 100;
                }
            }

            // Check if we should resume playback (e.g., after returning from payment)
            const shouldResume = localStorage.getItem('resume_audio') === 'true';

            if (shouldResume || state.isPlaying) {
                console.log('[AudioPlayer] Resuming playback based on state/flag');
                this.play();
                localStorage.removeItem('resume_audio');
            } else {
                this.pause();
                console.log('[AudioPlayer] State restored - PAUSED');
            }
        } catch (error) {
            console.error('[AudioPlayer] Failed to restore state:', error);
            localStorage.removeItem(scopedKey);
        }
    }

    play() {
        this.audio.play();
        this.isPlaying = true;
        document.getElementById('playPauseBtn').textContent = '⏸';
        document.getElementById('miniPlayPauseBtn').textContent = '⏸';
        window.dispatchEvent(new CustomEvent('playback-state-changed', {
            detail: { isPlaying: true, songId: this.currentSong?.id || this.currentSong?._id }
        }));
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        document.getElementById('playPauseBtn').textContent = '▶';
        document.getElementById('miniPlayPauseBtn').textContent = '▶';
        window.dispatchEvent(new CustomEvent('playback-state-changed', {
            detail: { isPlaying: false, songId: this.currentSong?.id || this.currentSong?._id }
        }));
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    seek(percent) {
        this.audio.currentTime = this.audio.duration * percent;
    }

    setVolume(volume) {
        this.audio.volume = volume;
    }

    updateProgress() {
        const percent = (this.audio.currentTime / this.audio.duration) * 100;
        document.getElementById('progressFill').style.width = `${percent}%`;
        document.getElementById('currentTime').textContent = this.formatTime(this.audio.currentTime);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    playNext() {
        if (this.playlist.length === 0) {
            console.log('No playlist available');
            return;
        }

        this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
        const nextSong = this.playlist[this.currentIndex];
        this.loadSong(nextSong.id || nextSong._id, true); // Auto-play next song
    }

    playPrevious() {
        if (this.playlist.length === 0) {
            console.log('No playlist available');
            return;
        }

        this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
        const prevSong = this.playlist[this.currentIndex];
        this.loadSong(prevSong.id || prevSong._id, true); // Auto-play previous song
    }

    setPlaylist(songs, startIndex = 0) {
        this.playlist = songs;
        this.currentIndex = startIndex;
    }

    async trackPlay(songId, duration) {
        try {
            await (window.authFetch || fetch)(`${window.location.origin}/api/stream/history`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    songId,
                    duration,
                    timestamp: new Date().toISOString()
                })
            });

            console.log('Play tracked successfully');
        } catch (error) {
            console.error('Failed to track play:', error);
        }
    }

    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    async toggleLike() {
        if (!this.currentSong) return;
        const songId = this.currentSong.id || this.currentSong._id;
        await this.toggleLikeForSong(songId);
    }

    async toggleLikeForSong(songId) {
        const isLiked = window.userLikes && window.userLikes.has(songId);

        try {
            const method = isLiked ? 'DELETE' : 'POST';
            const response = await (window.authFetch || fetch)(`${window.location.origin}/api/social/like/${songId}`, {
                method
            });

            if (response.ok) {
                if (isLiked) {
                    window.userLikes.delete(songId);
                    console.log('Song unliked');
                } else {
                    window.userLikes.add(songId);
                    console.log('Song liked');
                }

                // Update player UI if it's the current song
                if (this.currentSong && (this.currentSong.id === songId || this.currentSong._id === songId)) {
                    this.updateLikeButton(!isLiked);
                }

                // Update any visible track rows in Dashboard
                const rows = document.querySelectorAll(`.track-row[data-song-id="${songId}"]`);
                rows.forEach(row => {
                    const indicator = row.querySelector('.like-indicator');
                    if (indicator) {
                        const icon = indicator.querySelector('i');
                        if (icon) {
                            if (!isLiked) {
                                icon.className = 'fa-solid fa-heart';
                                indicator.style.color = '#CC0EF0';
                            } else {
                                icon.className = 'fa-regular fa-heart';
                                indicator.style.color = 'inherit';
                            }
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    }

    updateLikeButton(isLiked) {
        const likeBtn = document.getElementById('likeBtn');
        if (!likeBtn) return;

        const icon = likeBtn.querySelector('i');
        if (!icon) return;

        if (isLiked) {
            icon.className = 'fa-solid fa-heart';
            likeBtn.style.color = '#CC0EF0';
            likeBtn.title = 'Unlike this song';
        } else {
            icon.className = 'fa-regular fa-heart';
            likeBtn.style.color = 'var(--text-secondary)';
            likeBtn.title = 'Like this song';
        }
    }

    toggleMinimize() {
        const player = document.getElementById('audioPlayer');
        this.isMinimized = !this.isMinimized;
        player.classList.toggle('minimized', this.isMinimized);
        // Sync mini bar text
        const title = document.getElementById('playerTitle')?.textContent || 'No song playing';
        const artist = document.getElementById('playerArtist')?.textContent || '';
        document.getElementById('miniTitle').textContent = title;
        document.getElementById('miniArtist').textContent = artist;
        localStorage.setItem(this.getScopedKey('playerMinimized'), this.isMinimized ? '1' : '0');
    }

    restoreMinimizeState() {
        const saved = localStorage.getItem(this.getScopedKey('playerMinimized'));
        if (saved === '1') {
            this.isMinimized = true;
            document.getElementById('audioPlayer')?.classList.add('minimized');
        }
    }
}

// Initialize player when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.audioPlayer = new AudioPlayer();

        // Track play after 30 seconds
        let playTrackingTimeout;
        window.audioPlayer.audio.addEventListener('play', () => {
            clearTimeout(playTrackingTimeout);
            playTrackingTimeout = setTimeout(() => {
                if (window.audioPlayer.currentSong) {
                    const audio = window.audioPlayer.audio;
                    const duration = audio.duration;

                    // Only track if duration is a valid number > 0
                    if (duration && !isNaN(duration) && isFinite(duration) && duration > 0) {
                        window.audioPlayer.trackPlay(
                            window.audioPlayer.currentSong.id || window.audioPlayer.currentSong._id,
                            duration
                        );
                    } else {
                        console.warn('[AudioPlayer] Skipping play tracking - invalid duration:', duration);
                    }
                }
            }, 30000); // Track after 30 seconds
        });

        window.audioPlayer.audio.addEventListener('pause', () => {
            clearTimeout(playTrackingTimeout);
        });
    });
} else {
    window.audioPlayer = new AudioPlayer();

    // Track play after 30 seconds
    let playTrackingTimeout;
    window.audioPlayer.audio.addEventListener('play', () => {
        clearTimeout(playTrackingTimeout);
        playTrackingTimeout = setTimeout(() => {
            if (window.audioPlayer.currentSong) {
                const duration = window.audioPlayer.audio.duration;
                // Only track if duration is valid (not NaN, Infinity, or 0)
                if (duration && isFinite(duration) && duration > 0) {
                    window.audioPlayer.trackPlay(
                        window.audioPlayer.currentSong.id || window.audioPlayer.currentSong._id,
                        duration
                    );
                } else {
                    console.warn('[AudioPlayer] Skipping play tracking - invalid duration:', duration);
                }
            }
        }, 30000); // Track after 30 seconds
    });

    window.audioPlayer.audio.addEventListener('pause', () => {
        clearTimeout(playTrackingTimeout);
    });
}
