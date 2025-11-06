// public/js/account.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DECLARE VARIABLES ---
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.account-content');
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    // --- CLIENT-SIDE ROUTE PROTECTION ---
    if (!userInfo || !userInfo.token) {
        window.location.href = '/login';
        return;
    }

    // --- TAB SWITCHING LOGIC ---
    tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = link.dataset.tab;

            tabLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            link.classList.add('active');
            document.getElementById(`${tabId}-content`).classList.add('active');
        });
    });

    // --- ADD THIS PART TO READ HASH ON PAGE LOAD ---
    const currentHash = window.location.hash.replace('#', '');
    if (currentHash) {
        const activeLink = document.querySelector(`.tab-link[data-tab="${currentHash}"]`);
        if (activeLink) {
            // Use .click() to trigger both 'active' class add/remove logic
            activeLink.click();
        }
    }
    // --- END ADDED PART ---

    const accountForm = document.getElementById('account-form');

    const usernameInput = accountForm.querySelector('input[name="username"]');
    const emailInput = accountForm.querySelector('input[name="email"]');
    const userIdInput = document.getElementById('user-id-display'); // Add this ID to EJS

    console.log('Account.js loaded. UserInfo:', userInfo);
    console.log('Form elements found:', { accountForm, usernameInput, emailInput, userIdInput });

    // --- STEP 1: CLIENT-SIDE PROTECTION ---
    if (!userInfo || !userInfo.token) {
        // If no login info, do not allow access to this page
        window.location.href = '/login';
        return; // Stop script execution
    }

    // --- STEP 2: FETCH USER PROFILE FROM API ---
    async function fetchUserProfile() {
        try {
            // Call new API to get profile (using correct endpoint /api/users)
            const response = await fetch('/api/users/profile', {
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Unable to load account information.');
            }

            const user = await response.json();

            // Fill info into form
            userIdInput.value = user._id || 'N/A';
            usernameInput.value = user.username || '';
            emailInput.value = user.email || '';

            // Also update avatar preview if it exists
            const avatarPreview = document.getElementById('avatar-preview');
            if (avatarPreview && user.avatarUrl) {
                avatarPreview.src = `/${user.avatarUrl}`;
            }

        } catch (error) {
            console.error("Error fetching profile:", error);
            // Show error in the UI
            userIdInput.value = 'Error loading user data';
            if (window.showNotification) {
                window.showNotification(`Error: ${error.message}`, 'error');
            }
        }
    }

    // Call fetch profile function immediately upon entering page
    fetchUserProfile();

    accountForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = accountForm.querySelector('input[name="username"]').value;
        const email = accountForm.querySelector('input[name="email"]').value;
        const submitButton = accountForm.querySelector('button[type="submit"]');

        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';

        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (!userInfo || !userInfo.token) {
            window.showNotification("Session expired. Please log in again.", 'error');
            window.location.href = '/login';
            return;
        }

        try {
            const response = await fetch('/api/users/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({ username, email })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Update failed.');
            }

            // Update successful!
            window.showNotification('Information updated successfully!');

            // Update info in localStorage with the response data
            const updatedUserInfo = JSON.parse(localStorage.getItem('userInfo'));
            updatedUserInfo.username = data.username;
            updatedUserInfo.email = data.email;
            localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));

            // Update the form fields with new values
            usernameInput.value = data.username;
            emailInput.value = data.email;

            // Update sidebar username - target the correct element
            const sidebarProfileName = document.querySelector('#sidebar-container .profile-name');
            console.log('Looking for sidebar element, found:', sidebarProfileName);
            
            if (sidebarProfileName) {
                sidebarProfileName.textContent = data.username;
                console.log('Successfully updated sidebar username to:', data.username);
            } else {
                console.warn('Sidebar profile name element not found. Sidebar HTML:', 
                    document.querySelector('#sidebar-container')?.innerHTML.substring(0, 500));
            }

            // Update welcome message if it exists (on main page)
            const welcomeUser = document.getElementById('welcome-user');
            if (welcomeUser) {
                welcomeUser.textContent = data.username;
                console.log('Updated welcome message to:', data.username);
            }

            console.log('Username updated successfully to:', data.username);
            console.log('localStorage userInfo after update:', JSON.parse(localStorage.getItem('userInfo')));

        } catch (error) {
            console.error('Update error:', error);
            window.showNotification(`Error: ${error.message}`, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Save Changes';
        }
    });

    // =======================================================
    // === START: AVATAR CHANGE TAB LOGIC (COMPLETE) ===
    // =======================================================
    const avatarForm = document.getElementById('avatar-form');
    const avatarPreview = document.getElementById('avatar-preview');
    const avatarFileInput = avatarForm.querySelector('input[type="file"]');
    const defaultAvatars = avatarForm.querySelectorAll('.default-avatars img');
    const defaultAvatarPathInput = avatarForm.querySelector('input[name="defaultAvatarPath"]');

    avatarFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => { avatarPreview.src = event.target.result; }
            reader.readAsDataURL(file);
            defaultAvatarPathInput.value = '';
            defaultAvatars.forEach(img => img.classList.remove('selected'));
        }
    });

    defaultAvatars.forEach(img => {
        img.addEventListener('click', () => {
            defaultAvatars.forEach(i => i.classList.remove('selected'));
            img.classList.add('selected');
            avatarPreview.src = img.src;
            defaultAvatarPathInput.value = img.dataset.path;
            avatarFileInput.value = '';
        });
    });

    avatarForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = avatarForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';

        const formData = new FormData(avatarForm);

        try {
            const response = await fetch('/api/users/change-avatar', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: formData
            });

            // Always read response as JSON
            const data = await response.json();

            // Check response.ok AFTER reading json
            if (!response.ok) {
                // data.message is error message from backend
                throw new Error(data.message || 'Avatar update failed.');
            }

            // Update successful!
            // Update successful!
            window.showNotification(data.message);

            // --- START IMPORTANT CHANGES ---

            // 1. Update image on sidebar immediately (you already have this)
            const sidebarAvatar = document.querySelector('.sidebar-profile .profile-avatar');
            if (sidebarAvatar) {
                sidebarAvatar.src = `/${data.avatarUrl}`;
            }

            // 2. Update userInfo object in localStorage
            // Get userInfo again from localStorage to ensure it's the latest
            const currentUserInfo = JSON.parse(localStorage.getItem('userInfo'));
            if (currentUserInfo) {
                // Update avatarUrl field
                currentUserInfo.avatarUrl = data.avatarUrl;
                // Save back to localStorage
                localStorage.setItem('userInfo', JSON.stringify(currentUserInfo));
                console.log("localStorage updated with new avatar.");
            }

            // --- END IMPORTANT CHANGES ---


        } catch (error) {
            // CORRECT CATCH BLOCK SHOULD BE LIKE THIS:
            console.error("Client-side error when changing avatar:", error);
            window.showNotification(`Error: ${error.message}`, `error`); // Only use alert or client functions
            // ABSOLUTELY NO `res.status(...)` here
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Save Avatar';
            // Note: This part re-reads response.json() which will fail because the body stream is already read.
            // It also seems redundant as the success logic is already handled in the try block.
            // Consider removing the redundant data reading and success handling here if it was intended to be inside try.
            // Based on original code structure, it seems there might be a mistake in original code flow here (double reading response).
            // Assuming the intention was to handle success/failure only once.
            // If you need reload to ensure everything is synced:
             window.location.reload();
        }
    });
    // =====================================================
    // === END: AVATAR CHANGE TAB LOGIC ===
    // =====================================================


    // --- PASSWORD CHANGE FORM HANDLING (COMPLETE) ---
    const passwordForm = document.getElementById('password-form');
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = passwordForm.querySelector('button[type="submit"]');

        const currentPassword = passwordForm.querySelector('input[name="currentPassword"]').value;
        const newPassword = passwordForm.querySelector('input[name="newPassword"]').value;
        const confirmNewPassword = passwordForm.querySelector('input[name="confirmNewPassword"]').value;

        if (newPassword !== confirmNewPassword) {
            window.showNotification('New passwords do not match!', 'error');
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Changing...';

        try {
            const response = await fetch('/api/users/change-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            window.showNotification(data.message);
            passwordForm.reset(); // Clear input fields after successful change

        } catch (error) {
            window.showNotification(`Error: ${error.message}`, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Change Password';
        }
    });


});