// Settings Page (Inline rendering)
window.showSettingsPage = function () {
    const tracksContainer = document.getElementById('tracksContainer');
    const feedTitle = document.getElementById('feedTitle');
    const filterEl = document.getElementById('trendingFilters');

    if (filterEl) filterEl.style.display = 'none';
    currentTab = 'settings';

    feedTitle.textContent = 'Settings';

    tracksContainer.innerHTML = `
        <div class="settings-page" style="max-width: 800px; margin: 0 auto; padding: 24px;">
            <h1 style="font-size: 2rem; font-weight: 900; margin-bottom: 32px;">Settings</h1>

            <!-- Account Settings -->
            <div style="background: var(--bg-card); padding: 24px; border-radius: 12px; margin-bottom: 24px; border: 1px solid var(--border-color);">
                <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 20px;">Account</h2>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-secondary);">Name</label>
                    <input type="text" id="settingsName" 
                        style="width: 100%; padding: 12px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary);">
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">This name will be displayed on your comments</p>
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-secondary);">Email</label>
                    <input type="email" id="settingsEmail" readonly
                        style="width: 100%; padding: 12px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); opacity: 0.6;">
                </div>

                <button class="btn btn-primary" onclick="updateAccountSettings()" style="padding: 12px 24px;">
                    <i class="fa-solid fa-save"></i> Save Changes
                </button>
            </div>

            <!-- Playback Settings -->
            <div style="background: var(--bg-card); padding: 24px; border-radius: 12px; margin-bottom: 24px; border: 1px solid var(--border-color);">
                <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 20px;">Playback</h2>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <div>
                        <p style="font-weight: 600; margin-bottom: 4px;">Autoplay</p>
                        <p style="font-size: 0.85rem; color: var(--text-muted);">Automatically play similar tracks when your music ends</p>
                    </div>
                    <label class="switch" style="position: relative; display: inline-block; width: 50px; height: 24px;">
                        <input type="checkbox" id="autoplayToggle" style="opacity: 0; width: 0; height: 0;">
                        <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--bg-secondary); transition: .4s; border-radius: 24px;"></span>
                    </label>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <p style="font-weight: 600; margin-bottom: 4px;">High Quality Audio</p>
                        <p style="font-size: 0.85rem; color: var(--text-muted);">Stream at higher bitrate (uses more data)</p>
                    </div>
                    <label class="switch" style="position: relative; display: inline-block; width: 50px; height: 24px;">
                        <input type="checkbox" id="hqToggle" checked style="opacity: 0; width: 0; height: 0;">
                        <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--accent-primary); transition: .4s; border-radius: 24px;"></span>
                    </label>
                </div>
            </div>

            <!-- Privacy Settings -->
            <div style="background: var(--bg-card); padding: 24px; border-radius: 12px; margin-bottom: 24px; border: 1px solid var(--border-color);">
                <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 20px;">Privacy</h2>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <div>
                        <p style="font-weight: 600; margin-bottom: 4px;">Private Account</p>
                        <p style="font-size: 0.85rem; color: var(--text-muted);">Only approved followers can see your activity</p>
                    </div>
                    <label class="switch" style="position: relative; display: inline-block; width: 50px; height: 24px;">
                        <input type="checkbox" id="privateToggle" style="opacity: 0; width: 0; height: 0;">
                        <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--bg-secondary); transition: .4s; border-radius: 24px;"></span>
                    </label>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <p style="font-weight: 600; margin-bottom: 4px;">Show Listening Activity</p>
                        <p style="font-size: 0.85rem; color: var(--text-muted);">Let others see what you're listening to</p>
                    </div>
                    <label class="switch" style="position: relative; display: inline-block; width: 50px; height: 24px;">
                        <input type="checkbox" id="activityToggle" checked style="opacity: 0; width: 0; height: 0;">
                        <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--accent-primary); transition: .4s; border-radius: 24px;"></span>
                    </label>
                </div>
            </div>

            <!-- Danger Zone -->
            <div style="background: rgba(255, 59, 48, 0.1); padding: 24px; border-radius: 12px; border: 1px solid rgba(255, 59, 48, 0.3);">
                <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 12px; color: #FF3B30;">Danger Zone</h2>
                <p style="color: var(--text-secondary); margin-bottom: 16px;">Once you delete your account, there is no going back. Please be certain.</p>
                <button class="btn" onclick="confirmDeleteAccount()" 
                    style="background: #FF3B30; color: white; padding: 12px 24px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                    <i class="fa-solid fa-trash"></i> Delete Account
                </button>
            </div>
        </div>
    `;

    // Load user data
    loadUserSettings();
};

async function loadUserSettings() {
    try {
        const response = await fetch(`${API_URL}/api/auth/profile`);
        if (response.ok) {
            const data = await response.json();
            const user = data.user;

            document.getElementById('settingsName').value = user.name || '';
            document.getElementById('settingsEmail').value = user.email || '';
        }
    } catch (error) {
        console.error('Failed to load user settings:', error);
    }
}

async function updateAccountSettings() {
    const name = document.getElementById('settingsName').value;

    if (!name || name.length < 5) {
        alert('Name must be at least 5 characters long');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/auth/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });

        if (response.ok) {
            alert('Settings updated successfully!');
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to update settings');
        }
    } catch (error) {
        console.error('Failed to update settings:', error);
        alert('An error occurred');
    }
}

function confirmDeleteAccount() {
    if (confirm('Are you absolutely sure? This action cannot be undone.')) {
        if (confirm('This will permanently delete all your data. Continue?')) {
            deleteAccount();
        }
    }
}

async function deleteAccount() {
    try {
        const response = await fetch(`${API_URL}/api/auth/profile`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Account deleted successfully');
            window.location.href = '/auth/login';
        } else {
            alert('Failed to delete account');
        }
    } catch (error) {
        console.error('Failed to delete account:', error);
        alert('An error occurred');
    }
}
