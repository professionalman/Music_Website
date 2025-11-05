// // public/js/login.js

// document.addEventListener('DOMContentLoaded', () => {
//     const loginForm = document.getElementById('login-form');
//     const errorBox = document.getElementById('error-box');
//     const submitButton = loginForm.querySelector('button[type="submit"]');

//     if (!loginForm) {
//         console.error("Login form not found.");
//         return;
//     }

//     loginForm.addEventListener('submit', async (e) => {
//         e.preventDefault(); // Prevent form from reloading the page by default

//         // 1. Get data from inputs
//         const emailInput = document.getElementById('email');
//         const passwordInput = document.getElementById('password');

//         const email = emailInput.value.trim();
//         const password = passwordInput.value;

//         // 2. Clear old error message and disable button
//         errorBox.textContent = '';
//         errorBox.style.display = 'none';
//         submitButton.disabled = true;
//         submitButton.textContent = 'LOGGING IN...';

//         // 3. Client-side validation
//         if (!email || !password) {
//             showError('Please enter both email and password.');
//             return;
//         }

//         // 4. Send request to API
//         try {
//             const response = await fetch('/api/auth/login', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     email: email,
//                     password: password
//                 }),
//             });
            
//             // Read JSON data from response
//             const data = await response.json();

//             // 5. Handle result
//             if (!response.ok) {
//                 // If server returns error (e.g., status 401, 500)
//                 // `data.message` is the error message from backend
//                 throw new Error(data.message || 'An unknown error occurred.');
//             }
            
//             // Login successful!
//             console.log('Login successful:', data);

//             // Save user info and token to localStorage
//             localStorage.setItem('userInfo', JSON.stringify(data));

//             // Redirect user to homepage
//             window.location.href = '/';

//         } catch (error) {
//             // Display caught error from `throw new Error`
//             showError(error.message);
//         }
//     });

//     // Utility function to show error and re-enable button
//     function showError(message) {
//         errorBox.textContent = message;
//         errorBox.style.display = 'block';
//         submitButton.disabled = false;
//         submitButton.textContent = 'LOG IN';
//     }
// });
// ✅ public/js/login.js
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const errorBox = document.getElementById('error-box');
  const submitButton = loginForm.querySelector('button[type="submit"]');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    errorBox.style.display = 'none';
    submitButton.disabled = true;
    submitButton.textContent = 'LOGGING IN...';

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');

      console.log('✅ Login successful:', data);

      // ✅ Save full user info including token
      localStorage.setItem('userInfo', JSON.stringify(data));

      // Redirect based on user role
      if (data.role === 'admin') {
        window.location.href = '/admin'; // Admin goes to admin panel
      } else if (data.role === 'artist') {
        window.location.href = '/artists'; // Artist goes to artists page
      } else {
        window.location.href = '/'; // Regular user goes to home
      }
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.style.display = 'block';
      submitButton.disabled = false;
      submitButton.textContent = 'LOG IN';
    }
  });
});
