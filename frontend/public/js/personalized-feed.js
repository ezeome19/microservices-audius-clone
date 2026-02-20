// Load Personalized Feed based on user's preferred artists
window.loadPersonalizedFeed = async function () {
    const tracksContainer = document.getElementById('tracksContainer');
    const feedTitle = document.getElementById('feedTitle');

    // Show loading state
    feedTitle.textContent = 'Your Feed';
    tracksContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
            <p>Loading your personalized feed...</p>
        </div>
    `;

    try {
        const response = await authFetch(`${API_URL}/api/music/songs/feed`);

        if (!response.ok) {
            throw new Error('Failed to fetch personalized feed');
        }

        const data = await response.json();
        const tracks = data.songs || [];
        const source = data.source || 'personalized';

        if (tracks.length === 0) {
            feedTitle.textContent = 'Your Feed';
            tracksContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <p>No tracks available in your feed yet.</p>
                    <p style="margin-top: 8px;">Select your favorite artists in preferences to personalize your feed!</p>
                    <button onclick="window.location.href='/artists/preferences'" class="btn btn-primary" style="margin-top: 16px;">Set Preferences</button>
                </div>
            `;
        } else {
            const title = source === 'personalized'
                ? `Your Feed (${data.artistCount || 0} artists)`
                : 'Your Feed (Trending)';
            renderTracks(tracks, title);
        }

    } catch (error) {
        console.error('Error loading personalized feed:', error);
        feedTitle.textContent = 'Your Feed';
        tracksContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <p>Failed to load your feed. Please try again.</p>
                <button onclick="loadPersonalizedFeed()" class="btn btn-secondary" style="margin-top: 16px;">Retry</button>
            </div>
        `;
    }
};
