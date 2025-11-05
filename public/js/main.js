// js/main.js (New version for "Discover" home page)

document.addEventListener('DOMContentLoaded', () => {
    console.log("Main (Home) DOMContentLoaded Start");

    const homeContentContainer = document.getElementById('home-content');
    if (!homeContentContainer) {
        console.error("Could not find #home-content container.");
        return;
    }

    // Get username from localStorage
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const username = userInfo.username || 'Guest';
    
    // Find and remove the "Loading..." paragraph
    const loadingPara = homeContentContainer.querySelector('p');
    if (loadingPara && loadingPara.textContent === 'Loading...') {
        loadingPara.remove();
    }
    
    // Create and insert welcome header at the top
    const welcomeHeader = document.createElement('h1');
    welcomeHeader.textContent = `Welcome back, ${username}`;
    homeContentContainer.insertBefore(welcomeHeader, homeContentContainer.firstChild);

    console.log("Main (Home) DOMContentLoaded End");
});