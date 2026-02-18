// Theme Switcher - Apply merchant theme based on user type
(function () {
    // Check if user is logged in and get user type
    function applyTheme() {
        const token = localStorage.getItem('token');

        if (!token) {
            return;
        }

        // Decode JWT to get user type (simple base64 decode, no verification needed for theme)
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));

            if (payload.userType === 'merchant') {
                document.body.classList.add('merchant-theme');
            } else {
                document.body.classList.remove('merchant-theme');
            }
        } catch (error) {
            console.error('Failed to parse token for theme:', error);
        }
    }

    // Apply theme on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyTheme);
    } else {
        applyTheme();
    }

    // Re-apply theme when storage changes (e.g., after login/logout)
    window.addEventListener('storage', function (e) {
        if (e.key === 'token') {
            applyTheme();
        }
    });
})();
