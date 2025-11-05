// public/js/search.js (Final version, calls server search API)

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('search-results-container');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    
    // Function to display search results from returned API data
    function displayResults(data, query) {
        resultsContainer.innerHTML = ''; // Clear old results

        const { artists, songs } = data;

        if (artists.length === 0 && songs.length === 0) {
            resultsContainer.innerHTML = `<p>No results found for "<strong>${query}</strong>".</p>`;
            return;
        }

        // Display artists
        if (artists.length > 0) {
            const artistsSection = document.createElement('div');
            artistsSection.className = 'search-result-section';
            artistsSection.innerHTML = `<h2>Artists</h2>`;
            const artistsGrid = document.createElement('div');
            artistsGrid.className = 'card-grid';
            
            artists.forEach(artist => {
                const artistCard = document.createElement('a');
                artistCard.href = `/artist?artistId=${artist._id}`;
                artistCard.className = 'card artist-card';
                artistCard.innerHTML = `
                    <img src="/${artist.avatarUrl || 'img/singer-holder.png'}" alt="${artist.name}" class="album-art">
                    <h3 class="artist-card-name">${artist.name}</h3>
                    <p class="artist-card-type">Artist</p>
                `;
                artistsGrid.appendChild(artistCard);
            });
            artistsSection.appendChild(artistsGrid);
            resultsContainer.appendChild(artistsSection);
        }

        // Display songs
        if (songs.length > 0) {
            const songsSection = document.createElement('div');
            songsSection.className = 'search-result-section';
            songsSection.innerHTML = `<h2>Songs</h2>`;
            const songsGrid = document.createElement('div');
            songsGrid.className = 'card-grid';

            songs.forEach(song => {
                if (typeof window.createSongCard !== 'function') return;
                const songCard = window.createSongCard(song);
                
                songCard.addEventListener('click', () => {
                    if (typeof window.playSongFromData !== 'function') return;
                    // Playlist context is now the list of found songs itself
                    window.playSongFromData(song, songs);
                });
                songsGrid.appendChild(songCard);
            });
            songsSection.appendChild(songsGrid);
            resultsContainer.appendChild(songsSection);
        }
    }

    // Function to call search API
    async function performSearch(query) {
        if (!query.trim()) {
            resultsContainer.innerHTML = `<p class="search-initial-message">Type a keyword to start searching.</p>`;
            return;
        }

        resultsContainer.innerHTML = `<p class="loading-message">Searching...</p>`;

        try {
            // Call new API endpoint, encode query to handle special characters
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error('Invalid server response.');
            }
            const data = await response.json();
            displayResults(data, query);

        } catch (error) {
            console.error("Error calling search API:", error);
            resultsContainer.innerHTML = `<p class="error-message">An error occurred, could not search.</p>`;
        }
    }

    // Attach event to search bar with Debounce
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        const query = searchInput.value;
        
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 300); // Wait 300ms after stop typing

        clearSearchBtn.style.display = query ? 'block' : 'none';
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchInput.focus();
        resultsContainer.innerHTML = `<p class="search-initial-message">Type a keyword to start searching.</p>`;
        clearSearchBtn.style.display = 'none';
    });
});