// public/js/register.js

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const errorBox = document.getElementById('error-box');
    const submitButton = registerForm.querySelector('button[type="submit"]');

    if (!registerForm) {
        console.error("Registration form not found.");
        return;
    }

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent the form from reloading the page by default

        // 1. Get data from input fields
        const usernameInput = document.getElementById('username');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const roleInput = document.getElementById('role');

        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const role = roleInput.value;

        // 2. Clear old error messages and disable the submit button
        errorBox.textContent = '';
        errorBox.style.display = 'none';
        submitButton.disabled = true;
        submitButton.textContent = 'PROCESSING...';

        // 3. Client-side validation
        if (!username || !email || !password || !confirmPassword || !role) {
            showError('Please fill in all required fields.');
            return;
        }
        
        if (password !== confirmPassword) {
            showError('Password confirmation does not match.');
            return;
        }

        if (password.length < 6) {
            showError('Password must be at least 6 characters long.');
            return;
        }

        // 4. Send request to API
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    email: email,
                    password: password,
                    role: role
                }),
            });
            
            // Read JSON response data
            const data = await response.json();

            // 5. Handle result
            if (!response.ok) {
                // If the server returns an error (e.g. 400, 401, 500)
                // `data.message` contains the backend error message
                throw new Error(data.message || 'An unknown error occurred.');
            }

            // Registration successful!
            console.log('Registration successful:', data);

            // Save user info and token to localStorage
            localStorage.setItem('userInfo', JSON.stringify(data));
            
            // Redirect user to homepage
            window.location.href = '/'; 

        } catch (error) {
            // Display the caught error from `throw new Error`
            showError(error.message);
        }
    });
    
    // Utility function to show errors and re-enable the button
    function showError(message) {
        errorBox.textContent = message;
        errorBox.style.display = 'block';
        submitButton.disabled = false;
        submitButton.textContent = 'REGISTER';
    }
});
