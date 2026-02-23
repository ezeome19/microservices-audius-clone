// Follow/Unfollow Artist
window.toggleFollowArtist = async function (artistId, buttonElement) {
    if (!buttonElement) return;

    const isFollowing = buttonElement.textContent.trim() === 'Following';
    buttonElement.disabled = true;

    try {
        const endpoint = isFollowing ?
            `${API_URL}/api/social/follow/${artistId}` :
            `${API_URL}/api/social/follow/${artistId}`;

        const method = isFollowing ? 'DELETE' : 'POST';

        const response = await (window.authFetch || fetch)(endpoint, {
            method: method,
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            // Update button state
            buttonElement.textContent = isFollowing ? 'Follow' : 'Following';
            buttonElement.style.borderColor = isFollowing ? 'var(--accent-primary)' : '#00B1FF';
            buttonElement.style.color = isFollowing ? 'var(--accent-primary)' : '#00B1FF';

            // Update follower count if element exists
            const followerCountEl = document.getElementById('headerFollowerCount');
            if (followerCountEl) {
                const currentCount = parseInt(followerCountEl.textContent) || 0;
                followerCountEl.textContent = isFollowing ? currentCount - 1 : currentCount + 1;
            }
        } else {
            alert('Failed to update follow status');
        }
    } catch (error) {
        console.error('Error toggling follow:', error);
        alert('An error occurred');
    } finally {
        buttonElement.disabled = false;
    }
};
