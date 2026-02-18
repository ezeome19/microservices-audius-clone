// Settings Page (Inline rendering)
window.showSettingsPage = function () {
    const tracksContainer = document.getElementById('tracksContainer');
    const feedTitle = document.getElementById('feedTitle');
    const filterEl = document.getElementById('trendingFilters');

    if (filterEl) filterEl.style.display = 'none';
    currentTab = 'settings';

    feedTitle.textContent = 'Settings';

    const countries = ["Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo, Democratic Republic of the", "Congo, Republic of the", "Costa Rica", "Côte d'Ivoire", "Croatia", "Cuba", "Cyprus", "Czechia", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"];

    tracksContainer.innerHTML = `
        <div class="settings-page" style="max-width: 800px; margin: 0 auto; padding: 24px; animation: fadeIn 0.3s ease;">
            <h1 style="font-size: 2.5rem; font-weight: 900; margin-bottom: 32px; background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Settings</h1>

            <!-- Nav Tabs -->
            <div style="display: flex; gap: 24px; margin-bottom: 32px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
                <button onclick="switchSettingsSection('profile')" class="settings-section-btn active" data-section="profile" style="background: none; border: none; font-size: 1rem; font-weight: 700; color: var(--accent-primary); cursor: pointer; padding-bottom: 8px; border-bottom: 2px solid var(--accent-primary);">Profile</button>
                <button onclick="switchSettingsSection('account')" class="settings-section-btn" data-section="account" style="background: none; border: none; font-size: 1rem; font-weight: 600; color: var(--text-secondary); cursor: pointer; padding-bottom: 8px;">Account</button>
                <button onclick="switchSettingsSection('playback')" class="settings-section-btn" data-section="playback" style="background: none; border: none; font-size: 1rem; font-weight: 600; color: var(--text-secondary); cursor: pointer; padding-bottom: 8px;">Playback</button>
            </div>

            <!-- Profile Section -->
            <div id="settings-section-profile" class="settings-section">
                <div style="background: var(--bg-card); padding: 32px; border-radius: 16px; margin-bottom: 24px; border: 1px solid var(--border-color); box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
                    <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 24px; color: var(--text-primary);">Public Profile</h2>
                    
                    <div style="margin-bottom: 24px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.5px;">Display Name</label>
                        <input type="text" id="settingsName" 
                            style="width: 100%; padding: 14px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 10px; color: var(--text-primary); font-size: 1rem;">
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 6px;">This is how you'll appear to other users</p>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.5px;">Age</label>
                            <input type="number" id="settingsAge" min="13" max="120"
                                style="width: 100%; padding: 14px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 10px; color: var(--text-primary); font-size: 1rem;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.5px;">Gender</label>
                            <select id="settingsGender" 
                                style="width: 100%; padding: 14px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 10px; color: var(--text-primary); font-size: 1rem; cursor: pointer;">
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                                <option value="prefer_not_to_say">Prefer not to say</option>
                            </select>
                        </div>
                    </div>

                    <div style="margin-bottom: 32px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.5px;">Nationality</label>
                        <select id="settingsNationality" 
                            style="width: 100%; padding: 14px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 10px; color: var(--text-primary); font-size: 1rem; cursor: pointer;">
                            <option value="">Select Country</option>
                            ${countries.map(c => `<option value="${c}">${c}</option>`).join('')}
                        </select>
                    </div>

                    <button class="btn btn-primary" onclick="updateAccountSettings()" style="padding: 14px 32px; font-weight: 700; border-radius: 12px; font-size: 1rem;">
                        <i class="fa-solid fa-save" style="margin-right: 8px;"></i> Save Changes
                    </button>
                </div>
            </div>

            <!-- Account Section -->
            <div id="settings-section-account" class="settings-section" style="display: none;">
                <!-- Artist Upgrade Card -->
                <div id="merchantUpgradeCard" style="display: none; background: linear-gradient(135deg, rgba(126, 27, 204, 0.1) 0%, rgba(204, 14, 240, 0.1) 100%); padding: 32px; border-radius: 16px; margin-bottom: 24px; border: 1px solid rgba(126, 27, 204, 0.3); position: relative; overflow: hidden;">
                    <div style="position: relative; z-index: 1;">
                        <h2 style="font-size: 1.75rem; font-weight: 900; margin-bottom: 12px; color: var(--accent-primary);">Become an Artist</h2>
                        <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 24px; max-width: 500px;">
                            Take the next step in your musical journey. Upload original tracks, create your own Artist Coin, and start earning from your fans immediately.
                        </p>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; color: var(--text-primary); font-weight: 600;">
                            <span><i class="fa-solid fa-circle-check" style="color: #4CAF50; margin-right: 8px;"></i> Unlimited Uploads</span>
                            <span><i class="fa-solid fa-circle-check" style="color: #4CAF50; margin-right: 8px;"></i> Artist Analytics</span>
                            <span><i class="fa-solid fa-circle-check" style="color: #4CAF50; margin-right: 8px;"></i> Monetization Tools</span>
                            <span><i class="fa-solid fa-circle-check" style="color: #4CAF50; margin-right: 8px;"></i> Verified Badge</span>
                        </div>
                        <button onclick="openUpgradeModal()" class="btn btn-primary" style="padding: 14px 32px; font-weight: 800; border-radius: 12px; background: var(--accent-gradient);">Upgrade to Artist Account</button>
                    </div>
                </div>

                <!-- Artist Status Info -->
                <div id="merchantStatusInfo" style="display: none; background: var(--bg-card); padding: 32px; border-radius: 16px; margin-bottom: 24px; border: 1px solid var(--border-color);">
                     <div style="display: flex; align-items: center; gap: 20px;">
                        <div style="width: 60px; height: 60px; background: rgba(76, 175, 80, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #4CAF50; font-size: 1.5rem;">
                            <i class="fa-solid fa-music"></i>
                        </div>
                        <div>
                            <h3 style="margin: 0; font-size: 1.25rem;">Artist Account Active</h3>
                            <p style="margin: 4px 0 0 0; color: var(--text-secondary);">Your profile is verified and active</p>
                        </div>
                     </div>
                </div>

                <!-- Account Security -->
                <div style="background: var(--bg-card); padding: 32px; border-radius: 16px; border: 1px solid var(--border-color); margin-bottom: 24px;">
                    <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 24px; color: var(--text-primary);">Account & Security</h2>
                    
                    <div style="margin-bottom: 24px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.5px;">Email Address</label>
                        <input type="email" id="settingsEmail" readonly
                            style="width: 100%; padding: 14px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 10px; color: var(--text-primary); opacity: 0.6; cursor: not-allowed;">
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px; background: rgba(255, 59, 48, 0.05); border: 1px solid rgba(255, 59, 48, 0.1); border-radius: 12px;">
                        <div>
                            <h4 style="margin: 0; color: #FF3B30; font-weight: 700;">Account Session</h4>
                            <p style="margin: 4px 0 0 0; color: var(--text-secondary); font-size: 0.85rem;">Logging out will clear your session on this device.</p>
                        </div>
                        <button onclick="handleLogout()" class="btn"
                            style="background: #FF3B30; color: white; padding: 10px 24px; border-radius: 8px; font-weight: 700;">
                            <i class="fa-solid fa-right-from-bracket" style="margin-right: 8px;"></i> Logout
                        </button>
                    </div>
                </div>

                <!-- Danger Zone -->
                <div style="background: rgba(255, 59, 48, 0.05); padding: 32px; border-radius: 16px; border: 1px dashed #FF3B30;">
                    <h2 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 12px; color: #FF3B30;">Danger Zone</h2>
                    <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 0.9rem;">Once you delete your account, there is no going back. All your tracks, likes, and profile data will be permanently removed.</p>
                    <button class="btn" onclick="confirmDeleteAccount()" 
                        style="background: transparent; color: #FF3B30; padding: 10px 24px; border: 1px solid #FF3B30; border-radius: 8px; font-weight: 700;">
                        <i class="fa-solid fa-circle-exclamation" style="margin-right: 8px;"></i> Delete My Account
                    </button>
                </div>
            </div>

            <!-- Playback Section -->
            <div id="settings-section-playback" class="settings-section" style="display: none;">
                <div style="background: var(--bg-card); padding: 32px; border-radius: 16px; border: 1px solid var(--border-color);">
                    <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 24px; color: var(--text-primary);">Playback Settings</h2>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid var(--border-color);">
                        <div>
                            <p style="font-weight: 700; margin-bottom: 4px; color: var(--text-primary);">Autoplay Similar</p>
                            <p style="font-size: 0.85rem; color: var(--text-secondary);">Keep the music going when your current track ends.</p>
                        </div>
                        <label class="switch" style="position: relative; display: inline-block; width: 60px; height: 32px;">
                            <input type="checkbox" id="autoplayToggle" style="opacity: 0; width: 0; height: 0;">
                            <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--bg-secondary); transition: .4s; border-radius: 34px;">
                                <span style="position: absolute; content: ''; height: 24px; width: 24px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></span>
                            </span>
                        </label>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid var(--border-color);">
                        <div>
                            <p style="font-weight: 700; margin-bottom: 4px; color: var(--text-primary);">High Fidelity Audio</p>
                            <p style="font-size: 0.85rem; color: var(--text-secondary);">Stream at 320kbps for premium sound quality.</p>
                        </div>
                        <label class="switch" style="position: relative; display: inline-block; width: 60px; height: 32px;">
                            <input type="checkbox" id="hqToggle" checked style="opacity: 0; width: 0; height: 0;">
                            <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--accent-primary); transition: .4s; border-radius: 34px;">
                                <span style="position: absolute; content: ''; height: 24px; width: 24px; right: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%;"></span>
                            </span>
                        </label>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <p style="font-weight: 700; margin-bottom: 4px; color: var(--text-primary);">Visualizations</p>
                            <p style="font-size: 0.85rem; color: var(--text-secondary);">Show animated transitions during playback.</p>
                        </div>
                        <label class="switch" style="position: relative; display: inline-block; width: 60px; height: 32px;">
                            <input type="checkbox" id="vizToggle" checked style="opacity: 0; width: 0; height: 0;">
                            <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--accent-primary); transition: .4s; border-radius: 34px;">
                                <span style="position: absolute; content: ''; height: 24px; width: 24px; right: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%;"></span>
                            </span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Internal Section Switcher
    window.switchSettingsSection = function (sectionId) {
        document.querySelectorAll('.settings-section').forEach(s => s.style.display = 'none');
        document.getElementById(`settings-section-${sectionId}`).style.display = 'block';

        document.querySelectorAll('.settings-section-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.style.color = 'var(--text-secondary)';
            btn.style.fontWeight = '600';
            btn.style.borderBottom = 'none';
        });

        const activeBtn = document.querySelector(`.settings-section-btn[data-section="${sectionId}"]`);
        activeBtn.classList.add('active');
        activeBtn.style.color = 'var(--accent-primary)';
        activeBtn.style.fontWeight = '700';
        activeBtn.style.borderBottom = '2px solid var(--accent-primary)';
    };

    // Load user data
    loadUserSettings();
};

async function loadUserSettings() {
    try {
        const response = await fetch(`${API_URL}/api/auth/me`);
        if (response.ok) {
            const data = await response.json();
            const user = data.user;

            if (document.getElementById('settingsName')) document.getElementById('settingsName').value = user.name || '';
            if (document.getElementById('settingsEmail')) document.getElementById('settingsEmail').value = user.email || '';
            if (document.getElementById('settingsAge')) document.getElementById('settingsAge').value = user.age || '';
            if (document.getElementById('settingsGender')) document.getElementById('settingsGender').value = user.gender || '';
            if (document.getElementById('settingsNationality')) document.getElementById('settingsNationality').value = user.nationality || '';

            // Handle Merchant Upgrade UI
            const upgradeCard = document.getElementById('merchantUpgradeCard');
            const statusInfo = document.getElementById('merchantStatusInfo');

            if (user.user_type === 'merchant') {
                if (upgradeCard) upgradeCard.style.display = 'none';
                if (statusInfo) statusInfo.style.display = 'block';
            } else {
                if (upgradeCard) upgradeCard.style.display = 'block';
                if (statusInfo) statusInfo.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Failed to load user settings:', error);
    }
}

async function updateAccountSettings() {
    const name = document.getElementById('settingsName').value;
    const age = document.getElementById('settingsAge').value;
    const gender = document.getElementById('settingsGender').value;
    const nationality = document.getElementById('settingsNationality').value;

    if (!name || name.length < 3) {
        alert('Name must be at least 3 characters long');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/auth/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                age: age ? parseInt(age) : null,
                gender: gender || null,
                nationality: nationality || null
            })
        });

        if (response.ok) {
            alert('Profile updated successfully!');
            // Proactively update other UI elements like user name in sidebar if present
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to update settings');
        }
    } catch (error) {
        console.error('Failed to update settings:', error);
        alert('An error occurred');
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to log out?')) {
        window.location.href = '/auth/logout';
    }
}

function openUpgradeModal() {
    const modal = document.getElementById('upgradeToMerchantModal');
    if (modal) {
        modal.style.display = 'block';
    } else {
        alert('Artist upgrade feature is temporarily unavailable.');
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
