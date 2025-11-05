// public/js/favorite.js

document.addEventListener('DOMContentLoaded', () => {
    const displayContainer = document.getElementById('favorite-songs-display');
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    if (!userInfo || !userInfo.token) {
        // If not logged in, redirect to login page
        window.location.href = '/login';
        return;
    }

    // Function to call API to get favorite songs list
    async function loadFavoriteSongs() {
        try {
            const response = await fetch('/api/songs/favorites', {
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired or invalid
                    localStorage.removeItem('userInfo');
                    window.location.href = '/login';
                }
                throw new Error('Unable to load favorites list.');
            }

            const favoriteSongs = await response.json();
            renderFavoriteSongs(favoriteSongs);

        } catch (error) {
            console.error("Error loading favorite songs:", error);
            displayContainer.innerHTML = `<p class="error-message">${error.message}</p>`;
        }
    }

    // Function to render list to UI
    function renderFavoriteSongs(songs) {
        displayContainer.innerHTML = '';
        displayContainer.className = 'song-list-container';

        if (!songs || songs.length === 0) {
            displayContainer.innerHTML = '<p class="search-initial-message">You haven\'t liked any songs yet.</p>';
            return;
        }

        const tableHeader = document.createElement('div');
        // ... code to create header ...
        displayContainer.appendChild(tableHeader);

        songs.forEach((song, index) => {
            // Now this function exists
            if (typeof window.createSongListItem === 'function') {
                const songItem = window.createSongListItem(song, index + 1, song.artistName);

                songItem.addEventListener('click', (event) => {
                    // Prevent playing music when clicking on like button
                    if (event.target.closest('.like-song-btn')) return;

                    if (typeof window.playSongFromData !== 'function') return;
                    window.playSongFromData(song, songs);
                });
                displayContainer.appendChild(songItem);
            }
        });
    }
    // Run main function
    loadFavoriteSongs();
});